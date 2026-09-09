// TwiML endpoint for outbound bridged calls.
//
// Twilio hits this URL when the AGENT leg answers. We return TwiML
// that dials the CLIENT number and bridges the two legs together.
// If the client doesn't answer inside 30s, we hang up (agent side
// hears a busy tone).

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyTwilioSignature,
  twilioPhoneNumber,
  normalizeE164,
  twilioWebhookBaseUrl,
} from '@/lib/twilioClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(raw).forEach((v, k) => { params[k] = v; });

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'indibrick.ca';
  const fullUrl = `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
  const sig = req.headers.get('x-twilio-signature');
  const bypass = process.env.NODE_ENV !== 'production' && process.env.TWILIO_SKIP_SIGNATURE === '1';
  if (!bypass && !verifyTwilioSignature({ signatureHeader: sig, fullUrl, params })) {
    return new NextResponse('signature invalid', { status: 403 });
  }

  // Client number comes in as a URL query param (?client=+14165551234)
  // because Twilio doesn't let us stash arbitrary data on the call.
  const client = req.nextUrl.searchParams.get('client');
  const clientE164 = normalizeE164(client || '') || client;
  if (!clientE164) {
    return new NextResponse('<Response><Say>Client number missing.</Say></Response>', {
      status: 200, headers: { 'Content-Type': 'text/xml' },
    });
  }

  const callerId = twilioPhoneNumber();
  // TwiML: dial the client from the Twilio number, record dual-channel,
  // 30s answer timeout. Recording status callback posts back when the
  // recording file is ready.
  //
  // The <Say> below is heard by the AGENT only — it plays on the leg
  // Twilio already answered. The client's notice has to ride on
  // <Number url="...">, which plays to the CALLED party after they
  // answer and before the two legs are bridged. See voice-whisper.
  const whisperUrl = `${twilioWebhookBaseUrl()}/api/twilio/voice-whisper`;
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your I n d i Brick call.</Say>
  <Dial callerId="${callerId}" timeout="30" record="record-from-answer-dual" recordingStatusCallback="/api/twilio/recording-status">
    <Number url="${whisperUrl}">${clientE164}</Number>
  </Dial>
</Response>`.trim();

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
