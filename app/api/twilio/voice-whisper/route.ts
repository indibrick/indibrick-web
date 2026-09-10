// Client-side recording notice ("whisper").
//
// ─── Why this endpoint exists ───────────────────────────────────────
// The <Say> in voice-outbound plays on the leg Twilio already answered,
// which is the AGENT's phone. The client is dialled afterwards and was
// hearing nothing — they were joining a call that had been recording
// since the agent picked up.
//
// Canada's Criminal Code permits one-party consent, so that was not
// wiretapping. PIPEDA is the constraint that matters here: recording an
// individual in the course of commercial activity requires their
// knowledge, and a licensed brokerage is squarely in scope.
//
// <Number url="..."> is the TwiML hook that plays to the CALLED party
// after they answer and before the legs bridge, so this is the only
// place the client reliably hears it. Recording has already started by
// then, which is deliberate: the notice is captured in the recording
// itself and becomes its own audit trail.
//
// ─── Editing the wording ────────────────────────────────────────────
// Change RECORDING_NOTICE below. It is one string, spoken by Twilio's
// TTS, so write it the way it should sound rather than the way it would
// read — "I n d i Brick" is spaced so the voice does not slur it.
//
// To disable the notice entirely, set NOTICE_ENABLED to false. That
// returns empty TwiML and the call bridges silently, which restores the
// previous behaviour and its exposure.

import { NextRequest, NextResponse } from 'next/server';
import { verifyTwilioSignature } from '@/lib/twilioClient';

export const runtime = 'nodejs';

/** Flip to false to bridge silently. See the note above before doing so. */
const NOTICE_ENABLED = true;

/**
 * Spoken to the client before the agent is connected. Covers both the
 * recording and the fact that a written summary reaches their file —
 * the summary is the part a caller would not otherwise expect, so
 * naming it is what makes this genuine notice rather than boilerplate.
 */
const RECORDING_NOTICE =
  'Hi, this is I n d i Brick. Just so you know, this call is recorded ' +
  'and summarized for your file. If you would rather we did not, let ' +
  'your advisor know and we will stop the recording. Connecting you now.';

/**
 * Spoken when audio is kept but nothing is transcribed or summarised.
 * Claiming a summary would be a false statement, so it is dropped.
 */
const RECORDING_ONLY_NOTICE =
  'Hi, this is I n d i Brick. Just so you know, this call is recorded. ' +
  'If you would rather we did not, let your advisor know and we will ' +
  'stop the recording. Connecting you now.';

/** Twilio requires TwiML back even when there is nothing to say. */
function twiml(inner: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } },
  );
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(raw).forEach((v, k) => { params[k] = v; });

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'indibrick.ca';
  // MUST include the query string. Twilio signs the full URL, and this
  // endpoint is now called with ?rec=… — verifying against the bare
  // pathname would reject every legitimate request.
  const fullUrl = `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
  const sig = req.headers.get('x-twilio-signature');
  const bypass = process.env.NODE_ENV !== 'production' && process.env.TWILIO_SKIP_SIGNATURE === '1';
  if (!bypass && !verifyTwilioSignature({ signatureHeader: sig, fullUrl, params })) {
    // Returning empty TwiML rather than a 403: a rejected whisper must
    // not drop a live client call. Worst case the notice is skipped.
    return twiml('');
  }

  if (!NOTICE_ENABLED) return twiml('');

  // rec=0 means the agent chose a private call. There is no recording to
  // announce, and announcing one would be untrue — stay silent.
  const rec = req.nextUrl.searchParams.get('rec');
  if (rec === '0') return twiml('');

  // txt=0 means audio is kept but never transcribed or summarised.
  const txt = req.nextUrl.searchParams.get('txt');
  const notice = txt === '0' ? RECORDING_ONLY_NOTICE : RECORDING_NOTICE;
  return twiml(`<Say voice="alice">${notice}</Say>`);
}
