// Outbound SMS + list endpoint.
//
// POST — send an SMS to a referral's clientPhone. Writes a /messages
//        doc immediately with status='queued', then Twilio's status
//        callback updates it to sent/delivered/failed later.
// GET  — return messages for a referral (used by the MessageThread
//        component's initial load). Live updates come from the
//        Firestore subscription in useMessages(); this endpoint is
//        the fallback + admin export path.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { resolveTeamVisibleUids, isReferralVisibleToTeam } from '@/lib/teamVisibility';
import { sendSms, normalizeE164 } from '@/lib/twilioClient';
import { recordUsage } from '@/lib/usage';
import { checkRateLimit, resetHeaderSeconds } from '@/lib/rateLimiter';

// Distributed rate limit (Wave D). Firestore-backed via
// lib/rateLimiter so scaling across instances doesn't reset quota.
// Same 6-per-minute-per-(agent,deal) limit blocks the "automation
// misfires + drains SMS budget" loop.
const SMS_WINDOW_MS = 60_000;
const SMS_MAX = 6;

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, email } = guard.session;

  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  const referralId = String(body?.referralId || '');
  const messageBody = String(body?.body || '').trim();
  if (!referralId || !messageBody) {
    return NextResponse.json({ error: 'referralId and body required' }, { status: 400 });
  }
  if (messageBody.length > 1600) {
    // ~10 SMS segments — Twilio hard-caps around this.
    return NextResponse.json({ error: 'Message too long (max 1600 chars)' }, { status: 400 });
  }
  const rate = await checkRateLimit({
    bucket: 'sms.send',
    key: `${uid}:${referralId}`,
    windowMs: SMS_WINDOW_MS,
    max: SMS_MAX,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Rate limit: ${SMS_MAX} SMS/min/deal. Try again in ${resetHeaderSeconds(rate)}s.` },
      { status: 429, headers: { 'Retry-After': String(resetHeaderSeconds(rate)) } },
    );
  }

  const refSnap = await adminDb.collection('referrals').doc(referralId).get();
  if (!refSnap.exists) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
  const referral = refSnap.data() || {};

  // Access check — direct participants, team members of the owner,
  // or admin. Team-scoped access lets a teammate reply on a deal the
  // owner isn't watching without an explicit invite.
  let isOn =
    referral.referrerId === uid ||
    referral.assignedAgentId === uid ||
    (Array.isArray(referral.participantIds) && referral.participantIds.includes(uid));
  const roleSnap = await adminDb.collection('users').doc(uid).get();
  const role = roleSnap.exists ? (roleSnap.data()?.role || 'client') : 'client';
  if (!isOn && role !== 'admin') {
    const teamUids = await resolveTeamVisibleUids(uid);
    isOn = isReferralVisibleToTeam(uid, teamUids, referral as any);
  }
  if (!isOn && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rawPhone = String(referral.clientPhone || '');
  const toNumber = normalizeE164(rawPhone);
  if (!toNumber) {
    return NextResponse.json({ error: 'Deal has no valid clientPhone' }, { status: 400 });
  }

  // Auto-append CASL-compliant footer on first message per referral.
  // Canadian anti-spam law requires an unsubscribe path on commercial
  // electronic messages — even 1:1 SMS from a broker to a client.
  const priorSnap = await adminDb.collection('messages')
    .where('referralId', '==', referralId)
    .where('direction', '==', 'outbound')
    .limit(1)
    .get();
  const isFirstOutbound = priorSnap.empty;
  const finalBody = isFirstOutbound
    ? `${messageBody}\n\nReply STOP to opt out.`
    : messageBody;

  // Fire the send. On success, Twilio returns a Message SID we store
  // for the status callback to update later.
  const sendResult = await sendSms({ to: toNumber, body: finalBody });
  if (!sendResult.ok) {
    return NextResponse.json({ error: sendResult.error || 'send failed' }, { status: 502 });
  }

  const nowIso = new Date().toISOString();
  const messageDoc: Record<string, any> = {
    channel: 'sms',
    direction: 'outbound',
    twilioSid: sendResult.sid,
    body: finalBody,
    fromNumber: process.env.TWILIO_PHONE_NUMBER || null,
    toNumber,
    clientPhone: toNumber,
    referralId,
    senderUid: uid,
    senderEmail: email,
    assignedAgentId: referral.assignedAgentId || null,
    participantUids: referral.participantIds || [],
    status: 'queued',
    segmentCount: sendResult.segmentCount || 1,
    createdAt: FieldValue.serverTimestamp(),
    tenantId: 'indibrick',
  };
  const created = await adminDb.collection('messages').add(messageDoc);

  // Timeline entry for the deal history.
  try {
    await adminDb.collection('referrals').doc(referralId).update({
      timeline: FieldValue.arrayUnion({
        type: 'system',
        author: `${email || uid.slice(0, 8)} (SMS)`,
        content: `📱 SMS sent: "${messageBody.slice(0, 200)}${messageBody.length > 200 ? '…' : ''}"`,
        timestamp: nowIso,
        isSystemMessage: false,
      }),
      lastUpdated: nowIso,
      lastUpdatedBy: uid,
    });
  } catch (e) {
    console.warn('[messages] timeline update failed', e);
  }

  await recordUsage({ smsSent: 1, smsSegments: sendResult.segmentCount || 1 });

  return NextResponse.json({
    success: true,
    id: created.id,
    twilioSid: sendResult.sid,
    segments: sendResult.segmentCount,
  });
}

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;

  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const referralId = String(searchParams.get('referralId') || '');
  if (!referralId) return NextResponse.json({ error: 'referralId required' }, { status: 400 });

  const refSnap = await adminDb.collection('referrals').doc(referralId).get();
  if (!refSnap.exists) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
  const referral = refSnap.data() || {};
  let isOn =
    referral.referrerId === uid ||
    referral.assignedAgentId === uid ||
    (Array.isArray(referral.participantIds) && referral.participantIds.includes(uid));
  if (!isOn && role !== 'admin') {
    const teamUids = await resolveTeamVisibleUids(uid);
    isOn = isReferralVisibleToTeam(uid, teamUids, referral as any);
  }
  if (!isOn && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const snap = await adminDb.collection('messages')
    .where('referralId', '==', referralId)
    .orderBy('createdAt', 'asc')
    .limit(200)
    .get();
  const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ messages });
}
