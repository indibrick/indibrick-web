// Inbound SMS webhook.
//
// Twilio POSTs here as application/x-www-form-urlencoded when a text
// arrives on the brokerage number. We:
//   1. Verify the request came from Twilio (signature check)
//   2. Look up the referral whose clientPhone matches the sender
//   3. Write a /messages doc so the CRM thread updates live
//   4. Append a timeline entry to the referral for audit context
//   5. Record usage metering
//   6. Draft a reply for an agent to review — never send one
//   7. Return empty TwiML
//
// Nothing here texts the client back. The draft is written onto the
// message record for an agent to send, edit or ignore. An unreviewed
// message from a licensed brokerage carries a compliance surface that
// is not worth the minutes auto-reply would save; it becomes a config
// flag once a few hundred drafts have been read and trusted.
//
// Deliberately no auth check on Bearer token — this endpoint is
// public because Twilio can't attach one. Signature verification is
// the auth layer.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyTwilioSignature, normalizeE164 } from '@/lib/twilioClient';
import { recordUsage } from '@/lib/usage';
import { draftSmsReply } from '@/lib/smsReplyDraft';
import { TRANSCRIPTS_COLLECTION } from '@/lib/callTranscriptShape';

export const runtime = 'nodejs';

// Twilio expects the response to be TwiML XML even when we have nothing
// to say back. Returning an empty <Response/> means "acknowledge, no
// reply." Compare vs. <Response><Message>...</Message></Response>
// which would auto-reply.
function emptyTwiml() {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: NextRequest) {
  // Parse the form-encoded body Twilio sends.
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return NextResponse.json({ error: 'expected form-urlencoded' }, { status: 400 });
  }
  const rawBody = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(rawBody).forEach((v, k) => { params[k] = v; });

  // Verify Twilio signature. The URL Twilio signed against is the
  // fully-qualified request URL — reconstruct from headers so proxy
  // chains don't break the check.
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'indibrick.ca';
  const fullUrl = `${proto}://${host}${req.nextUrl.pathname}`;
  const sig = req.headers.get('x-twilio-signature');

  // Bypass signature check in dev when Twilio's tunnel isn't fronting
  // the request. Never enabled in prod.
  const bypass = process.env.NODE_ENV !== 'production' && process.env.TWILIO_SKIP_SIGNATURE === '1';
  if (!bypass && !verifyTwilioSignature({ signatureHeader: sig, fullUrl, params })) {
    console.warn('[twilio/sms] signature check failed', { sig, fullUrl });
    return NextResponse.json({ error: 'signature invalid' }, { status: 403 });
  }

  const fromNumber = params.From;
  const toNumber = params.To;
  const body = params.Body || '';
  const messageSid = params.MessageSid;
  const numSegments = Number(params.NumSegments || '1');
  if (!fromNumber || !messageSid) return emptyTwiml();

  if (!adminDb) return emptyTwiml();

  // Find the referral whose clientPhone (normalized) matches sender.
  // First try exact E.164 match on any normalized field; fall back to
  // suffix match on the last 10 digits (Canadian numbers are always
  // 10 digits + country code).
  const senderE164 = normalizeE164(fromNumber) || fromNumber;
  const suffix = senderE164.replace(/\D/g, '').slice(-10);

  let referralId: string | null = null;
  let referralData: any = null;
  try {
    // Exact match first — fast path via index.
    const exactSnap = await adminDb.collection('referrals')
      .where('clientPhone', '==', senderE164)
      .limit(1)
      .get();
    if (!exactSnap.empty) {
      referralId = exactSnap.docs[0].id;
      referralData = exactSnap.docs[0].data();
    } else if (suffix.length === 10) {
      // Fallback: scan a small window and match the digit suffix.
      // Not great at scale — future work: normalize clientPhone at
      // write-time so exact match always hits.
      const recent = await adminDb.collection('referrals')
        .orderBy('referralDate', 'desc')
        .limit(500)
        .get();
      for (const d of recent.docs) {
        const p = String(d.data().clientPhone || '').replace(/\D/g, '');
        if (p.endsWith(suffix)) {
          referralId = d.id;
          referralData = d.data();
          break;
        }
      }
    }
  } catch (e) {
    console.error('[twilio/sms] referral lookup failed', e);
  }

  // Even if we can't find a referral, log the message so we don't lose
  // it — it'll surface in an "orphaned messages" admin view.
  const messageDoc: Record<string, any> = {
    channel: 'sms',
    direction: 'inbound',
    twilioSid: messageSid,
    body,
    fromNumber: senderE164,
    toNumber,
    clientPhone: senderE164,
    referralId: referralId || null,
    assignedAgentId: referralData?.assignedAgentId || null,
    // participantUids drives the Firestore-rules read gate — everyone
    // on the referral gets access to the message thread.
    participantUids: referralData?.participantIds || [],
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    tenantId: 'indibrick',
  };
  const created = await adminDb.collection('messages').add(messageDoc);

  // ─── Draft a reply (never send one) ──────────────────────────────
  // Best-effort and deliberately non-fatal: Twilio is waiting on this
  // response, and a failed draft must never turn into a failed webhook
  // and a retried inbound message.
  try {
    let clientName = '';
    let status: string | null = null;
    let lastCallSummary: string | null = null;
    const recent: Array<{ direction: 'inbound' | 'outbound'; body: string }> = [];

    if (referralId) {
      const rSnap = await adminDb.collection('referrals').doc(referralId).get();
      const r = (rSnap.data() || {}) as any;
      clientName = String(r.clientName || '');
      status = r.status || null;

      // Prior thread, for continuity.
      const prior = await adminDb.collection('messages')
        .where('referralId', '==', referralId)
        .where('channel', '==', 'sms')
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get();
      prior.docs.reverse().forEach((d) => {
        const m = d.data() as any;
        if (m.body) recent.push({ direction: m.direction === 'inbound' ? 'inbound' : 'outbound', body: String(m.body) });
      });

      // The most recent analysed call, so the reply knows what was
      // already discussed out loud.
      const calls = await adminDb.collection(TRANSCRIPTS_COLLECTION)
        .where('referralId', '==', referralId)
        .where('status', '==', 'ready')
        .orderBy('updatedAt', 'desc')
        .limit(1)
        .get();
      if (!calls.empty) {
        lastCallSummary = (calls.docs[0].data() as any)?.analysis?.summary || null;
      }
    }

    const drafted = await draftSmsReply({
      clientName,
      inboundText: String(messageDoc.body || ''),
      status,
      recentMessages: recent,
      lastCallSummary,
    });

    if (drafted.ok && drafted.draft) {
      await created.update({
        suggestedReply: drafted.draft,
        suggestedReplyModel: drafted.model || null,
        suggestedReplyAt: new Date().toISOString(),
      });
    } else if (drafted.insufficientContext) {
      await created.update({ suggestedReply: null, suggestedReplySkipped: 'insufficient context' });
    }
  } catch (e) {
    console.warn('[sms] reply draft failed', e);
  }

  // Timeline entry on the referral so the deal history reflects the
  // inbound SMS without opening the messages panel.
  if (referralId) {
    try {
      await adminDb.collection('referrals').doc(referralId).update({
        timeline: FieldValue.arrayUnion({
          type: 'system',
          author: 'Client (SMS)',
          content: `📱 SMS received: "${body.slice(0, 200)}${body.length > 200 ? '…' : ''}"`,
          timestamp: new Date().toISOString(),
          isSystemMessage: false,
        }),
        lastUpdated: new Date().toISOString(),
        _systemUpdate: true, // Rules engine skips this write.
      });
      // Clear the flag right after so subsequent writes evaluate normally.
      await adminDb.collection('referrals').doc(referralId).update({
        _systemUpdate: FieldValue.delete(),
      });
    } catch (e) {
      console.error('[twilio/sms] timeline update failed', e);
    }
  }

  await recordUsage({ smsReceived: 1, smsSegments: numSegments });
  return emptyTwiml();
}
