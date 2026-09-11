// TwiML for calls originated in the browser dialer.
//
// This is the Voice URL on the TwiML App referenced by the access token.
// Twilio POSTs here the moment an agent's browser connects, and whatever
// TwiML comes back is what gets dialled.
//
// ─── The toll-fraud problem ─────────────────────────────────────────
// The obvious design is to let the browser pass the client's number as a
// connect parameter. Do not. Anyone holding a token — an agent, or
// anyone who lifted one out of a browser session — could then dial any
// number on earth, billed to this account. Premium-rate fraud is the
// standard way this gets exploited.
//
// So the browser passes a TICKET, never a number. The ticket is the id
// of the /messages document that /api/partner/call already created after
// running the full permission check. This endpoint re-reads that
// document server-side and dials the number stored on it.
//
// Four things must hold, or the call is refused:
//   1. The ticket resolves to a real call record.
//   2. It was created seconds ago, not lifted from history.
//   3. It has not already been dialled.
//   4. The uid that booked it matches the token identity Twilio reports
//      in `From` — so one agent cannot spend another agent's ticket.
//
// ─── Consent ────────────────────────────────────────────────────────
// The same client-side notice used on the phone path applies here. It
// rides on <Number url="...">, which plays to the called party before
// the legs bridge. See voice-whisper.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  verifyTwilioSignature,
  twilioPhoneNumber,
  twilioWebhookBaseUrl,
} from '@/lib/twilioClient';

export const runtime = 'nodejs';

/** A ticket is single-use and expires fast. It is booked, then spent. */
const TICKET_MAX_AGE_MS = 90_000;

function twiml(inner: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } },
  );
}

/** Spoken to the agent when we refuse. Silence would read as a bug. */
function refuse(reason: string) {
  console.warn('[voice-browser] refused:', reason);
  return twiml('<Say voice="alice">This call could not be placed. Please try again from the deal screen.</Say>');
}

function toMillis(v: any): number | null {
  if (!v) return null;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v === 'string') { const t = Date.parse(v); return Number.isFinite(t) ? t : null; }
  return null;
}

/**
 * Escape a value for use inside an XML attribute.
 *
 * TwiML is XML, and a bare `&` in an attribute makes the whole document
 * unparseable — Twilio then answers the call with "an application error
 * has occurred" and hangs up. Query strings on the whisper URL put an
 * ampersand in an attribute for the first time, which is exactly how
 * this bit.
 */
function xmlAttr(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
    return refuse('bad signature');
  }
  if (!adminDb) return refuse('no db');

  // Twilio reports the token identity as `client:<uid>`.
  const from = String(params.From || '');
  const callerUid = from.startsWith('client:') ? from.slice('client:'.length) : '';
  const ticket = String(params.ticket || '').trim();
  if (!callerUid || !ticket) return refuse('missing identity or ticket');

  const snap = await adminDb.collection('messages').doc(ticket).get();
  if (!snap.exists) return refuse('unknown ticket');
  const m = snap.data() as any;

  if (m.senderUid !== callerUid) return refuse('ticket belongs to another agent');
  if (m.channel !== 'call') return refuse('ticket is not a call');
  if (m.dialedAt) return refuse('ticket already spent');

  const bookedAt = toMillis(m.createdAt);
  if (bookedAt === null) return refuse('ticket has no booking time');
  if (Date.now() - bookedAt > TICKET_MAX_AGE_MS) return refuse('ticket expired');

  // The number comes off the record, never off the request.
  const clientPhone = String(m.clientPhone || '');
  if (!clientPhone) return refuse('ticket has no client number');

  // Burn it before dialling, so a replayed webhook cannot place a second
  // call on the same authorisation.
  try {
    await snap.ref.update({ dialedAt: new Date().toISOString(), status: 'ringing' });
  } catch (e) {
    console.warn('[voice-browser] could not mark ticket spent', e);
  }

  // Privacy options come off the ticket for the same reason the number
  // does: the browser must not be able to change them. An agent who
  // booked a private call cannot have it silently recorded, and one who
  // booked a recorded call cannot suppress the client's notice.
  const record = m.record !== false;
  const transcribe = record && m.transcribe !== false;

  const callerId = twilioPhoneNumber();
  const base = twilioWebhookBaseUrl();
  const whisperUrl =
    `${base}/api/twilio/voice-whisper?rec=${record ? '1' : '0'}&txt=${transcribe ? '1' : '0'}`;
  const recAttrs = record
    ? ` record="record-from-answer-dual" recordingStatusCallback="${xmlAttr(`${base}/api/twilio/recording-status`)}"`
    : '';

  return twiml(
    `<Dial callerId="${callerId}" timeout="30"${recAttrs}>` +
    `<Number url="${xmlAttr(whisperUrl)}">${clientPhone}</Number>` +
    `</Dial>`,
  );
}
