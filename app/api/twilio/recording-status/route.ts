// Recording status callback.
//
// Twilio POSTs the recording URL when the audio file is ready
// (usually a few seconds after the call ends). We stash the URL on
// the /messages doc so the CRM can render a playback control.
//
// Auto-transcription is Wave 6 work — for now we just store the URL.
// When we wire Whisper/AssemblyAI in the AI wave, this endpoint (or
// a scheduled batch job) will fetch the audio and produce a transcript.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyTwilioSignature } from '@/lib/twilioClient';

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

  const callSid = params.CallSid;
  const recordingUrl = params.RecordingUrl; // .mp3 appended by Twilio
  const recordingSid = params.RecordingSid;
  const recordingDuration = Number(params.RecordingDuration || '0');
  if (!callSid || !recordingUrl || !adminDb) return NextResponse.json({ ok: true });

  try {
    const snap = await adminDb.collection('messages')
      .where('twilioSid', '==', callSid)
      .limit(1)
      .get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({
        recordingUrl: `${recordingUrl}.mp3`,   // playable
        recordingSid,
        recordingDuration,
      });
    }
  } catch (e) {
    console.error('[recording-status] update failed', e);
  }
  return NextResponse.json({ ok: true });
}
