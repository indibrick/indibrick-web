// Inbound calls to the brokerage number.
//
// Set this as the Voice webhook on the Twilio phone number:
//   https://indibrick.ca/api/twilio/voice-inbound
//
// ─── Routing ────────────────────────────────────────────────────────
// A client ringing back should reach the person they were dealing with,
// not a queue. So:
//
//   1. Match the caller's number to a referral. If it has an assigned
//      agent, ring that agent's browser client.
//   2. Otherwise ring every mortgage agent with a browser client
//      registered, first to answer takes it.
//   3. If nobody is reachable in the browser, fall back to the
//      brokerage's forwarding number when one is configured.
//   4. Otherwise say so plainly and hang up, rather than ringing out.
//
// Recording follows the same rule as outbound: on unless the call is
// explicitly private. Inbound has no per-call toggle — the agent is not
// there to set one before it rings — so it records, and the written
// disclosure covers it.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  verifyTwilioSignature,
  normalizeE164,
  twilioWebhookBaseUrl,
} from '@/lib/twilioClient';

export const runtime = 'nodejs';

function xmlAttr(v: string): string {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function twiml(inner: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } },
  );
}

/** Roles that take client calls. */
const CALL_TAKING_ROLES = ['partner_mortgage', 'admin'];

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
    return twiml('<Reject/>');
  }
  if (!adminDb) return twiml('<Say>We are unable to take your call right now.</Say>');

  const from = normalizeE164(String(params.From || '')) || String(params.From || '');
  const callSid = String(params.CallSid || '');
  const base = twilioWebhookBaseUrl();

  // 1) Whose client is this?
  let targetUids: string[] = [];
  let referralId: string | null = null;
  try {
    const match = await adminDb.collection('referrals')
      .where('clientPhone', '==', from).limit(1).get();
    if (!match.empty) {
      referralId = match.docs[0].id;
      const r = match.docs[0].data() as any;
      const assigned = String(r.assignedAgentId || '');
      if (assigned && assigned !== 'ADMIN_INBOX') targetUids = [assigned];
    }
  } catch (e) {
    console.warn('[voice-inbound] referral lookup failed', e);
  }

  // 2) Nobody specific — ring everyone who takes calls.
  if (targetUids.length === 0) {
    try {
      const agents = await adminDb.collection('users')
        .where('role', 'in', CALL_TAKING_ROLES).limit(10).get();
      targetUids = agents.docs.map((d) => d.id);
    } catch (e) {
      console.warn('[voice-inbound] agent lookup failed', e);
    }
  }

  // Log it before ringing, so a missed call is still a record.
  try {
    await adminDb.collection('messages').add({
      channel: 'call',
      direction: 'inbound',
      twilioSid: callSid,
      clientPhone: from,
      referralId,
      status: 'ringing',
      record: true,
      transcribe: true,
      preset: 'full',
      ringingUids: targetUids,
      createdAt: FieldValue.serverTimestamp(),
      tenantId: 'indibrick',
    });
  } catch (e) {
    console.warn('[voice-inbound] message log failed', e);
  }

  const recAttrs =
    ` record="record-from-answer-dual"` +
    ` recordingStatusCallback="${xmlAttr(`${base}/api/twilio/recording-status`)}"`;

  // 3) Ring browser clients. Several <Client> in one <Dial> ring
  //    simultaneously and the first to answer wins.
  if (targetUids.length > 0) {
    const clients = targetUids
      .map((uid) => `<Client>${xmlAttr(uid)}</Client>`)
      .join('');
    // A short timeout then fallthrough — a client who is offline should
    // not hold the caller for 30 seconds of silence.
    return twiml(
      `<Dial timeout="20" callerId="${xmlAttr(from)}"${recAttrs}>${clients}</Dial>` +
      fallbackTwiml(base),
    );
  }

  return twiml(fallbackTwiml(base));
}

/**
 * Runs when the <Dial> above completes without anyone answering — TwiML
 * continues to the next verb rather than hanging up.
 */
function fallbackTwiml(base: string): string {
  const forward = process.env.TWILIO_FALLBACK_FORWARD_NUMBER;
  if (forward) {
    return `<Dial timeout="25">${xmlAttr(forward)}</Dial>`;
  }
  return '<Say>Sorry, no one is available to take your call. Please try again shortly.</Say>';
}
