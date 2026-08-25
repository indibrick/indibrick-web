// Click-to-call.
//
// Model: Twilio calls the AGENT's phone first. When they answer, our
// TwiML endpoint (/api/twilio/voice-outbound) tells Twilio to dial the
// CLIENT and bridge the two legs. Dual-channel recording means the
// playback separates agent + client audio.
//
// This means agents don't need a browser dialer for v1 — they answer
// on their cell/desk phone and get connected to the client. The
// browser dialer (WebRTC via Twilio Voice SDK) is Wave 6 work.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { initiateCall, normalizeE164 } from '@/lib/twilioClient';
import { recordUsage } from '@/lib/usage';
import { checkRateLimit, resetHeaderSeconds } from '@/lib/rateLimiter';

const CALL_WINDOW_MS = 60_000;
const CALL_MAX = 4;

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, email } = guard.session;

  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const rate = await checkRateLimit({
    bucket: 'call.initiate',
    key: uid,
    windowMs: CALL_WINDOW_MS,
    max: CALL_MAX,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Rate limit: ${CALL_MAX} calls/min. Try again in ${resetHeaderSeconds(rate)}s.` },
      { status: 429, headers: { 'Retry-After': String(resetHeaderSeconds(rate)) } },
    );
  }

  const body = await req.json().catch(() => null);
  const referralId = String(body?.referralId || '');
  const agentPhoneRaw = String(body?.agentPhone || '');
  if (!referralId || !agentPhoneRaw) {
    return NextResponse.json({ error: 'referralId and agentPhone required' }, { status: 400 });
  }
  const agentPhone = normalizeE164(agentPhoneRaw);
  if (!agentPhone) return NextResponse.json({ error: 'Invalid agent phone' }, { status: 400 });

  const refSnap = await adminDb.collection('referrals').doc(referralId).get();
  if (!refSnap.exists) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
  const referral = refSnap.data() || {};

  const isOn =
    referral.referrerId === uid ||
    referral.assignedAgentId === uid ||
    (Array.isArray(referral.participantIds) && referral.participantIds.includes(uid));
  const roleSnap = await adminDb.collection('users').doc(uid).get();
  const role = roleSnap.exists ? (roleSnap.data()?.role || 'client') : 'client';
  if (!isOn && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const clientPhone = normalizeE164(String(referral.clientPhone || ''));
  if (!clientPhone) return NextResponse.json({ error: 'Deal has no valid clientPhone' }, { status: 400 });

  const result = await initiateCall({
    to: clientPhone,
    agentNumber: agentPhone,
    recording: true,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'call failed' }, { status: 502 });
  }

  // Log the call attempt immediately — status callbacks patch it as
  // the call progresses through initiated → ringing → in-progress →
  // completed.
  const nowIso = new Date().toISOString();
  const messageDoc = {
    channel: 'call',
    direction: 'outbound',
    twilioSid: result.sid,
    clientPhone,
    agentPhone,
    referralId,
    senderUid: uid,
    senderEmail: email,
    assignedAgentId: referral.assignedAgentId || null,
    participantUids: referral.participantIds || [],
    status: 'initiated',
    recordingUrl: null,
    transcript: null,
    durationSeconds: null,
    createdAt: FieldValue.serverTimestamp(),
    tenantId: 'indibrick',
  };
  const created = await adminDb.collection('messages').add(messageDoc);

  try {
    await adminDb.collection('referrals').doc(referralId).update({
      callCount: FieldValue.increment(1),
      timeline: FieldValue.arrayUnion({
        type: 'system',
        author: `${email || uid.slice(0, 8)}`,
        content: `📞 Call initiated to ${clientPhone}`,
        timestamp: nowIso,
        isSystemMessage: false,
      }),
      lastUpdated: nowIso,
      lastUpdatedBy: uid,
    });
  } catch (e) {
    console.warn('[call] timeline update failed', e);
  }

  await recordUsage({ callsInitiated: 1 });

  return NextResponse.json({ success: true, id: created.id, twilioSid: result.sid });
}
