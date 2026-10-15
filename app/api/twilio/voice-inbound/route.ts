// Inbound calls to the brokerage number.
//
// Set this as the Voice webhook on the Twilio phone number:
//   https://indibrick.ca/api/twilio/voice-inbound
//
// ─── Routing ────────────────────────────────────────────────────────
// A client ringing back should reach the person they were dealing with,
// not a queue:
//
//   1. Match the caller's number to a referral. If it has an assigned
//      agent, ring that agent's browser client.
//   2. No match, or no assigned agent — ring the duty desk browser,
//      TWILIO_INBOUND_DUTY_UID, so a new lead lands in the CRM with a
//      screen pop rather than on a handset with no record attached.
//   3. Nobody answers in the browser — forwards to
//      TWILIO_FALLBACK_FORWARD_NUMBER.
//   4. With no forwarding number set, say so plainly rather than
//      ringing out.
//
// Step 2 exists because the original routing only ever rang a browser
// for an already-known client, which meant every genuinely new caller —
// the most valuable kind for a brokerage — bypassed the CRM entirely.
// Nine consecutive inbound calls went straight to the handset with
// ringingUids empty before this was added.
//
// There is still deliberately no fan-out to every agent. Ringing the
// whole team on an unknown number trains people to ignore the portal,
// and a client who reaches a random agent gets a worse conversation
// than one who reaches a phone that is definitely answered. The duty
// desk is one named person, set by env var.
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

  // Resolve the duty desk before logging. ringingUids is the field you
  // read when a call did not land where expected, so it has to record who
  // was actually rung, not just who the referral lookup found.
  const dutyUid = process.env.TWILIO_INBOUND_DUTY_UID || '';
  const ringingUids = targetUids.length > 0 ? targetUids : dutyUid ? [dutyUid] : [];

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
      ringingUids,
      // Distinguishes "their agent rang" from "the duty desk rang" from
      // "nobody was available" without re-deriving it later.
      routedTo: targetUids.length > 0 ? 'assigned-agent' : dutyUid ? 'duty-desk' : 'fallback-number',
      createdAt: FieldValue.serverTimestamp(),
      tenantId: 'indibrick',
    });
  } catch (e) {
    console.warn('[voice-inbound] message log failed', e);
  }

  const recAttrs =
    ` record="record-from-answer-dual"` +
    ` recordingStatusCallback="${xmlAttr(`${base}/api/twilio/recording-status`)}"`;

  // 2) Ring the assigned agent's browser, then fall through.
  //    A short timeout: an agent with the portal closed should not hold
  //    the caller in silence before they get a human.
  if (targetUids.length > 0) {
    const clients = targetUids.map((uid) => `<Client>${xmlAttr(uid)}</Client>`).join('');
    return twiml(
      `<Dial timeout="20" callerId="${xmlAttr(from)}"${recAttrs}>${clients}</Dial>` +
      fallbackTwiml(base, from),
    );
  }

  // 3) Unknown or unassigned caller — give the duty desk a short ring in
  //    the browser first. Shorter than the assigned-agent window above:
  //    this caller has no relationship with anyone here, so holding them
  //    in silence buys nothing. If the portal is closed it falls through
  //    to the handset exactly as before.
  if (dutyUid) {
    return twiml(
      `<Dial timeout="15" callerId="${xmlAttr(from)}"${recAttrs}>` +
        `<Client>${xmlAttr(dutyUid)}</Client>` +
      `</Dial>` +
      fallbackTwiml(base, from),
    );
  }

  // 4) No duty desk configured — straight to the forwarding number.
  return twiml(fallbackTwiml(base, from));
}

/**
 * Runs when the <Dial> above completes without anyone answering — TwiML
 * continues to the next verb rather than hanging up.
 */
function fallbackTwiml(base: string, from: string): string {
  const forward = process.env.TWILIO_FALLBACK_FORWARD_NUMBER;
  if (!forward) {
    return '<Say>Sorry, no one is available to take your call. Please try again shortly.</Say>';
  }
  // callerId is the client's number, not the Twilio line, so the handset
  // shows who is actually calling and the call can be returned from the
  // recent-calls list.
  const recAttrs =
    ` record="record-from-answer-dual"` +
    ` recordingStatusCallback="${xmlAttr(`${base}/api/twilio/recording-status`)}"`;
  return `<Dial timeout="25" callerId="${xmlAttr(from)}"${recAttrs}>${xmlAttr(forward)}</Dial>`;
}
