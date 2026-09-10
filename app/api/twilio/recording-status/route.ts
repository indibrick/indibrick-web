// Recording status callback.
//
// Twilio POSTs the recording URL when the audio file is ready
// (usually a few seconds after the call ends). We stash the URL on
// the /messages doc so the CRM can render a playback control.
//
// It also kicks off transcription, when the agent asked for it. That is
// deliberately fire-and-forget: the provider works asynchronously and
// calls /api/twilio/transcript-status when the text is ready, so nothing
// here waits. A webhook that blocks on a third party is a webhook Twilio
// eventually gives up on and retries.
//
// Whether a call gets transcribed at all is decided by the agent at dial
// time and stored on the /messages record. This endpoint honours that
// flag rather than re-deciding it.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyTwilioSignature } from '@/lib/twilioClient';
import { startTranscription, activeProvider } from '@/lib/transcription';
import { TRANSCRIPTS_COLLECTION } from '@/lib/callTranscriptShape';

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
    if (snap.empty) return NextResponse.json({ ok: true });

    const doc = snap.docs[0];
    const m = doc.data() as any;
    await doc.ref.update({
      recordingUrl: `${recordingUrl}.mp3`,   // playable
      recordingSid,
      recordingDuration,
    });

    // The agent's choice at dial time. Absent means yes, which preserves
    // behaviour for calls placed before the toggle existed.
    const transcribeRequested = m.transcribe !== false;

    const started = await startTranscription({
      recordingSid,
      recordingUrl: `${recordingUrl}.mp3`,
      durationSeconds: recordingDuration,
      messageId: doc.id,
      transcribeRequested,
    });

    const nowIso = new Date().toISOString();
    const base = {
      messageId: doc.id,
      referralId: m.referralId || null,
      provider: activeProvider(),
      durationSeconds: recordingDuration,
      segments: [],
      fullText: '',
      createdAt: nowIso,
      updatedAt: nowIso,
      analyzedAt: null,
    };

    // A transcript row is written even when we skip, so a missing
    // transcript is always explicable rather than an unexplained gap.
    if (started.skipped) {
      await adminDb.collection(TRANSCRIPTS_COLLECTION).doc(doc.id).set({
        ...base, jobId: null, status: 'skipped',
        skipReason: started.skipReason || 'not transcribed', error: null,
      }, { merge: true });
    } else if (!started.ok) {
      console.warn('[recording-status] transcription start failed:', started.error);
      await adminDb.collection(TRANSCRIPTS_COLLECTION).doc(doc.id).set({
        ...base, jobId: null, status: 'failed',
        skipReason: null, error: started.error || 'start failed',
      }, { merge: true });
    } else {
      await adminDb.collection(TRANSCRIPTS_COLLECTION).doc(doc.id).set({
        ...base, jobId: started.jobId || null, status: 'processing',
        skipReason: null, error: null,
      }, { merge: true });
    }
  } catch (e) {
    console.error('[recording-status] update failed', e);
  }
  return NextResponse.json({ ok: true });
}
