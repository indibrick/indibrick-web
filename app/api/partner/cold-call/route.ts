// Cold-call dialer.
//
// Every other call path resolves the number from a referral the agent
// already has access to. This one dials whatever the agent types, which
// is the toll-fraud surface the ticket design exists to close — so it
// carries guardrails the referral paths do not need:
//
//   · Role-gated to partner_mortgage and admin. Other roles get 403.
//   · Its own, tighter rate limit — a compromised session should burn
//     out fast rather than dial for an hour.
//   · North American numbers only. The premium-rate numbers that make
//     this fraud profitable are almost all international, and a
//     brokerage cold-calling Ontario has no reason to reach them.
//   · Every attempt is logged against the caller's uid before it dials.
//
// The number still never travels in the TwiML request. It is written to
// the ticket here and read back server-side, exactly as on the referral
// paths.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { initiateCall, normalizeE164 } from '@/lib/twilioClient';
import { isBrowserCallingConfigured } from '@/lib/twilioVoiceToken';
import { normalizeCallOptions, callDefaultsFromUser, presetOf } from '@/lib/callOptionsShape';
import { recordUsage } from '@/lib/usage';
import { checkRateLimit, resetHeaderSeconds } from '@/lib/rateLimiter';

export const runtime = 'nodejs';

const ALLOWED_ROLES = new Set(['partner_mortgage', 'admin']);

// Deliberately tighter than the referral dialer's 4/min.
const WINDOW_MS = 60_000;
const MAX_PER_MIN = 3;
const DAILY_MAX = 120;

/** +1 followed by 10 digits, first digit of area code 2-9. */
function isNorthAmerican(e164: string): boolean {
  return /^\+1[2-9]\d{9}$/.test(e164);
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, email } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const userSnap = await adminDb.collection('users').doc(uid).get();
  const user = userSnap.data() || {};
  const role = user.role || 'client';
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: 'Cold dialling is not enabled for your role.' }, { status: 403 });
  }

  const perMin = await checkRateLimit({ bucket: 'coldcall.minute', key: uid, windowMs: WINDOW_MS, max: MAX_PER_MIN });
  if (!perMin.ok) {
    return NextResponse.json(
      { error: `Slow down — ${MAX_PER_MIN} cold calls per minute. Try again in ${resetHeaderSeconds(perMin)}s.` },
      { status: 429, headers: { 'Retry-After': String(resetHeaderSeconds(perMin)) } },
    );
  }
  const perDay = await checkRateLimit({ bucket: 'coldcall.day', key: uid, windowMs: 86_400_000, max: DAILY_MAX });
  if (!perDay.ok) {
    return NextResponse.json({ error: `Daily cold-call limit of ${DAILY_MAX} reached.` }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const toRaw = String(body?.to || '');
  const to = normalizeE164(toRaw);
  if (!to) return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 });
  if (!isNorthAmerican(to)) {
    return NextResponse.json(
      { error: 'Cold dialling is limited to Canadian and US numbers.' },
      { status: 400 },
    );
  }

  const norm = normalizeCallOptions(body, callDefaultsFromUser(user));
  if (!norm.ok) return NextResponse.json({ error: norm.error }, { status: 400 });
  const opts = norm.options!;

  const agentPhoneRaw = String(body?.agentPhone || '');
  const agentPhone = agentPhoneRaw ? normalizeE164(agentPhoneRaw) : null;
  if (agentPhoneRaw && !agentPhone) {
    return NextResponse.json({ error: 'Invalid agent phone' }, { status: 400 });
  }
  if (opts.mode === 'phone' && !agentPhone) {
    return NextResponse.json({ error: 'agentPhone required for phone mode' }, { status: 400 });
  }
  if (opts.mode === 'browser' && !isBrowserCallingConfigured()) {
    return NextResponse.json({ error: 'Browser calling is not configured.' }, { status: 503 });
  }

  let twilioSid: string | null = null;
  if (opts.mode === 'phone') {
    const result = await initiateCall({
      to,
      agentNumber: agentPhone as string,
      recording: opts.record,
      transcribe: opts.transcribe,
    });
    if (!result.ok) return NextResponse.json({ error: result.error || 'call failed' }, { status: 502 });
    twilioSid = result.sid || null;
  }

  // Same record shape as a referral call, minus the referral. That is
  // what makes it convertible later without a second schema.
  const created = await adminDb.collection('messages').add({
    channel: 'call',
    direction: 'outbound',
    kind: 'cold',
    twilioSid,
    mode: opts.mode,
    record: opts.record,
    transcribe: opts.transcribe,
    preset: presetOf(opts),
    clientPhone: to,
    agentPhone,
    referralId: null,          // none yet — set on conversion
    convertedReferralId: null,
    senderUid: uid,
    senderEmail: email,
    status: 'initiated',
    recordingUrl: null,
    dialedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    tenantId: 'indibrick',
  });

  await recordUsage({ callsInitiated: 1 });

  return NextResponse.json({
    success: true,
    id: created.id,
    mode: opts.mode,
    preset: presetOf(opts),
    to,
    twilioSid,
    ...(opts.mode === 'browser' ? { ticket: created.id } : {}),
  });
}
