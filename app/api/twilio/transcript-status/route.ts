// Twilio Voice Intelligence completion callback.
//
// Twilio POSTs here when a transcript finishes processing. We pull the
// sentences, flatten them, and store the result against the call.
//
// Configure in Console → Voice Intelligence → Services → your service →
// webhook URL: https://indibrick.ca/api/twilio/transcript-status
//
// ─── Why the transcript is fetched rather than read from the body ───
// The callback announces completion; it does not carry the text. The
// sentences come from a second API call, which is also where speaker
// attribution lives.
//
// ─── Idempotency ────────────────────────────────────────────────────
// Twilio retries callbacks. A transcript already marked 'ready' is left
// alone, so a retry cannot overwrite good text with a failed refetch, and
// cannot reset analyzedAt and cause the summary to run twice.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyTwilioSignature } from '@/lib/twilioClient';
import { getTranscriber, segmentsToText } from '@/lib/transcription';
import { TRANSCRIPTS_COLLECTION } from '@/lib/callTranscriptShape';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(raw).forEach((v, k) => { params[k] = v; });

  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'indibrick.ca';
  // Include the query string: Twilio signs the full URL, and verifying
  // against the bare path breaks the moment this endpoint takes a param.
  const fullUrl = `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
  const sig = req.headers.get('x-twilio-signature');
  const bypass = process.env.NODE_ENV !== 'production' && process.env.TWILIO_SKIP_SIGNATURE === '1';
  if (!bypass && !verifyTwilioSignature({ signatureHeader: sig, fullUrl, params })) {
    return NextResponse.json({ error: 'signature invalid' }, { status: 403 });
  }
  if (!adminDb) return NextResponse.json({ ok: true });

  const transcriptSid = params.transcript_sid || params.TranscriptSid || '';
  // customerKey was set to the /messages id when the job was created, so
  // the callback resolves without a reverse lookup.
  const messageId = params.customer_key || params.CustomerKey || '';
  const status = (params.status || params.Status || '').toLowerCase();

  if (!messageId || !transcriptSid) {
    console.warn('[transcript-status] missing customer_key or transcript_sid');
    return NextResponse.json({ ok: true });
  }

  const ref = adminDb.collection(TRANSCRIPTS_COLLECTION).doc(messageId);
  const existing = await ref.get();
  if (existing.exists && (existing.data() as any)?.status === 'ready') {
    // Already stored. A retry must not clobber it.
    return NextResponse.json({ ok: true, deduped: true });
  }

  const nowIso = new Date().toISOString();

  if (status && status !== 'completed') {
    await ref.set({
      status: 'failed',
      error: `provider reported status "${status}"`,
      updatedAt: nowIso,
    }, { merge: true });
    return NextResponse.json({ ok: true });
  }

  const transcriber = getTranscriber();
  if (!transcriber) {
    await ref.set({ status: 'failed', error: 'no transcriber registered', updatedAt: nowIso }, { merge: true });
    return NextResponse.json({ ok: true });
  }

  const fetched = await transcriber.fetch(transcriptSid);
  if (!fetched.ok || !fetched.segments) {
    await ref.set({
      status: 'failed',
      error: fetched.error || 'sentence fetch failed',
      updatedAt: nowIso,
    }, { merge: true });
    return NextResponse.json({ ok: true });
  }

  await ref.set({
    status: 'ready',
    jobId: transcriptSid,
    segments: fetched.segments,
    fullText: segmentsToText(fetched.segments),
    error: null,
    updatedAt: nowIso,
  }, { merge: true });

  // Surface it on the call record so the CRM can show "transcript ready"
  // without a second read.
  try {
    await adminDb.collection('messages').doc(messageId).update({
      transcriptStatus: 'ready',
      transcriptSegmentCount: fetched.segments.length,
    });
  } catch (e) {
    console.warn('[transcript-status] message update failed', e);
  }

  return NextResponse.json({ ok: true, segments: fetched.segments.length });
}
