// Call status callback.
//
// Twilio POSTs here on initiated / ringing / answered / completed.
// We patch the /messages doc that was created when the agent hit
// Click-to-Call.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyTwilioSignature } from '@/lib/twilioClient';
import { recordUsage } from '@/lib/usage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(raw).forEach((v, k) => { params[k] = v; });

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'indibrick.ca';
  const fullUrl = `${proto}://${host}${req.nextUrl.pathname}`;
  const sig = req.headers.get('x-twilio-signature');
  const bypass = process.env.NODE_ENV !== 'production' && process.env.TWILIO_SKIP_SIGNATURE === '1';
  if (!bypass && !verifyTwilioSignature({ signatureHeader: sig, fullUrl, params })) {
    return NextResponse.json({ error: 'signature invalid' }, { status: 403 });
  }

  const sid = params.CallSid;
  const status = params.CallStatus; // initiated|ringing|in-progress|completed|busy|no-answer|failed
  if (!sid || !status || !adminDb) return NextResponse.json({ ok: true });

  const patch: Record<string, any> = {
    status,
    statusUpdatedAt: new Date().toISOString(),
  };
  const duration = Number(params.CallDuration || '0');
  if (status === 'completed' && duration > 0) {
    patch.durationSeconds = duration;
    // Meter billable minutes (rounded up).
    await recordUsage({ callMinutes: Math.ceil(duration / 60) });
  }
  if (params.ErrorCode) patch.errorCode = params.ErrorCode;
  if (params.ErrorMessage) patch.errorMessage = params.ErrorMessage;

  try {
    const snap = await adminDb.collection('messages')
      .where('twilioSid', '==', sid)
      .limit(1)
      .get();
    if (!snap.empty) await snap.docs[0].ref.update(patch);
  } catch (e) {
    console.error('[voice-status] update failed', e);
  }
  return NextResponse.json({ ok: true });
}
