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
import { analyzeCall, formatTimelineNote, tasksFromAnalysis } from '@/lib/callAnalysis';
import { FieldValue } from 'firebase-admin/firestore';

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

  // ─── Analysis: the summary and the follow-ups ────────────────────
  // Deliberately after the transcript is committed. If analysis fails,
  // the transcript still stands on its own and can be re-analysed;
  // losing both to one bad model response would be the worse outcome.
  const fullText = segmentsToText(fetched.segments);
  const msgSnap = await adminDb.collection('messages').doc(messageId).get();
  const msg = (msgSnap.data() || {}) as any;
  const referralId: string | null = msg.referralId || null;

  const referralSnap = referralId
    ? await adminDb.collection('referrals').doc(referralId).get()
    : null;
  const referral = (referralSnap?.data() || {}) as any;
  const clientName = String(referral.clientName || 'the client');

  const analyzed = await analyzeCall({
    clientName,
    transcript: fullText,
    durationSeconds: Number(msg.recordingDuration || 0),
  });

  if (!analyzed.ok || !analyzed.analysis) {
    console.warn('[transcript-status] analysis failed:', analyzed.error);
    await ref.set({ analysisError: analyzed.error || 'analysis failed', updatedAt: nowIso }, { merge: true });
    return NextResponse.json({ ok: true, segments: fetched.segments.length, analyzed: false });
  }

  const a = analyzed.analysis;
  await ref.set({
    analysis: a,
    analysisModel: analyzed.model || null,
    analysisPromptVersion: analyzed.promptVersion || null,
    analysisCostUsd: analyzed.costUsd ?? null,
    analysisError: null,
    analyzedAt: nowIso,
    updatedAt: nowIso,
  }, { merge: true });

  if (!referralId) {
    // Nothing to attach it to — the transcript keeps the analysis.
    return NextResponse.json({ ok: true, analyzed: true, attached: false });
  }

  // The summary goes on the file as a note, in the same shape an agent's
  // own note takes, so it renders in the timeline they already read.
  try {
    await adminDb.collection('referrals').doc(referralId).update({
      timeline: FieldValue.arrayUnion({
        type: 'system',
        author: 'IndiBrick AI',
        content: `📝 Call summary\n\n${formatTimelineNote(a)}`,
        timestamp: nowIso,
        isSystemMessage: true,
      }),
      lastUpdated: nowIso,
    });
  } catch (e) {
    console.warn('[transcript-status] timeline write failed', e);
  }

  // One task per explicit commitment. Assigned to whoever took the call,
  // falling back to the deal's owner.
  const assigneeId = String(msg.senderUid || referral.assignedAgentId || '');
  let tasksCreated = 0;
  if (assigneeId) {
    const tasks = tasksFromAnalysis(a, {
      referralId,
      clientName,
      assigneeId,
      messageId,
    });
    for (const t of tasks) {
      try {
        await adminDb.collection('tasks').add({
          ...t,
          createdBy: 'system:call_analysis',
          createdAt: nowIso,
        });
        tasksCreated += 1;
      } catch (e) {
        console.warn('[transcript-status] task create failed', e);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    segments: fetched.segments.length,
    analyzed: true,
    tasksCreated,
  });
}
