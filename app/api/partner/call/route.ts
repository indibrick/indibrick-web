// Click-to-call.
//
// Model: Twilio calls the AGENT's phone first. When they answer, our
// TwiML endpoint (/api/twilio/voice-outbound) tells Twilio to dial the
// CLIENT and bridge the two legs. Dual-channel recording means the
// playback separates agent + client audio.
//
// Two modes, chosen per call by the agent:
//
//   'phone'   Twilio rings the agent's own handset, then bridges. Works
//             from a car, costs two outbound legs.
//   'browser' The agent talks through the browser dialer. Roughly a
//             third the cost of the agent leg, but only at a desk.
//
// Browser mode does NOT place the call here — the browser does, holding
// a Twilio access token. What this route issues instead is a ticket: the
// /messages document below, created only after the same permission and
// rate-limit checks the phone path runs. /api/twilio/voice-browser
// redeems that ticket and reads the client's number off it, so a token
// holder can never dial a number of their own choosing.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { initiateCall, normalizeE164 } from '@/lib/twilioClient';
import { isBrowserCallingConfigured } from '@/lib/twilioVoiceToken';
import { normalizeCallOptions, callDefaultsFromUser, presetOf } from '@/lib/callOptionsShape';
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

  if (!referralId) {
    return NextResponse.json({ error: 'referralId required' }, { status: 400 });
  }
  // Validated here; whether it is REQUIRED depends on the mode, which is
  // resolved after the agent's stored defaults are read.
  const agentPhone: string | null = agentPhoneRaw ? normalizeE164(agentPhoneRaw) : null;
  if (agentPhoneRaw && !agentPhone) {
    return NextResponse.json({ error: 'Invalid agent phone' }, { status: 400 });
  }

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

  // Anything the request omits falls back to this agent's stored default,
  // so a bare call still does what they normally do.
  const norm = normalizeCallOptions(body, callDefaultsFromUser(roleSnap.data()));
  if (!norm.ok) {
    return NextResponse.json({ error: norm.error }, { status: 400 });
  }
  const opts = norm.options!;
  const mode = opts.mode;

  if (mode === 'phone' && !agentPhone) {
    return NextResponse.json({ error: 'agentPhone required for phone mode' }, { status: 400 });
  }
  if (mode === 'browser' && !isBrowserCallingConfigured()) {
    return NextResponse.json(
      { error: 'Browser calling is not configured on this environment.' },
      { status: 503 },
    );
  }

  const clientPhone = normalizeE164(String(referral.clientPhone || ''));
  if (!clientPhone) return NextResponse.json({ error: 'Deal has no valid clientPhone' }, { status: 400 });

  // Phone mode dials now. Browser mode leaves dialling to the browser,
  // which redeems the ticket created below.
  let twilioSid: string | null = null;
  if (mode === 'phone') {
    const result = await initiateCall({
      to: clientPhone,
      agentNumber: agentPhone as string,
      recording: opts.record,
      transcribe: opts.transcribe,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'call failed' }, { status: 502 });
    }
    twilioSid = result.sid || null;
  }

  // Log the call attempt immediately — status callbacks patch it as
  // the call progresses through initiated → ringing → in-progress →
  // completed.
  const nowIso = new Date().toISOString();
  const messageDoc = {
    channel: 'call',
    direction: 'outbound',
    // Browser calls have no SID until the browser connects; the voice
    // status callback fills it in.
    twilioSid,
    mode,
    record: opts.record,
    transcribe: opts.transcribe,
    preset: presetOf(opts),
    clientPhone,
    agentPhone,
    // Set by voice-browser when the ticket is redeemed. Its presence is
    // what makes a ticket single-use.
    dialedAt: null,
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
        content: `📞 ${mode === 'browser' ? 'Browser call' : 'Call initiated'} to ${clientPhone}`
          + (opts.record ? (opts.transcribe ? '' : ' · recording only') : ' · private, not recorded'),
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

  // In browser mode the id IS the ticket — the browser passes it to
  // Twilio as a connect parameter.
  return NextResponse.json({
    success: true,
    id: created.id,
    mode,
    record: opts.record,
    transcribe: opts.transcribe,
    preset: presetOf(opts),
    twilioSid,
    ...(mode === 'browser' ? { ticket: created.id } : {}),
  });
}
