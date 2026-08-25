// SMS delivery status callback.
//
// Twilio POSTs here every time an outbound message changes state
// (queued → sent → delivered / undelivered / failed). We patch the
// corresponding /messages doc so the UI can render read receipts.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyTwilioSignature } from '@/lib/twilioClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(rawBody).forEach((v, k) => { params[k] = v; });

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'indibrick.ca';
  const fullUrl = `${proto}://${host}${req.nextUrl.pathname}`;
  const sig = req.headers.get('x-twilio-signature');
  const bypass = process.env.NODE_ENV !== 'production' && process.env.TWILIO_SKIP_SIGNATURE === '1';
  if (!bypass && !verifyTwilioSignature({ signatureHeader: sig, fullUrl, params })) {
    return NextResponse.json({ error: 'signature invalid' }, { status: 403 });
  }

  const sid = params.MessageSid;
  const status = params.MessageStatus; // queued|sent|delivered|failed|undelivered
  if (!sid || !status || !adminDb) return NextResponse.json({ ok: true });

  try {
    const snap = await adminDb.collection('messages')
      .where('twilioSid', '==', sid)
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ ok: true });
    await snap.docs[0].ref.update({
      status,
      statusUpdatedAt: new Date().toISOString(),
      ...(params.ErrorCode ? { errorCode: params.ErrorCode } : {}),
      ...(params.ErrorMessage ? { errorMessage: params.ErrorMessage } : {}),
    });
  } catch (e) {
    console.error('[twilio/sms-status] update failed', e);
  }
  return NextResponse.json({ ok: true });
}
