// Twilio Conversational Intelligence adapter.
//
// Requires TWILIO_INTELLIGENCE_SERVICE_SID (GAxxxx) — created in
// Console → Voice Intelligence → Services. The account SID and auth
// token come from the shared client.
//
// This provider is ASYNCHRONOUS. Creating a transcript returns a SID and
// Twilio does the work in the background, calling our webhook when the
// text is ready. Nothing here blocks on the result.
//
// ─── Speaker labelling ──────────────────────────────────────────────
// Calls are recorded dual-channel: channel 1 is the leg Twilio dialled
// first (the agent), channel 2 is the client. Twilio reports a channel
// per sentence, so speaker attribution is free and does not need the
// diarization add-on that usually drives these prices up.

import twilio from 'twilio';
import type {
  Transcriber,
  StartTranscriptionInput,
  StartTranscriptionResult,
  FetchTranscriptResult,
  TranscriptSegment,
  Speaker,
} from './types';

function client() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

/** Channel 1 is the first leg Twilio dialled, which is always the agent. */
function speakerForChannel(channel: unknown): Speaker {
  const n = Number(channel);
  if (n === 1) return 'agent';
  if (n === 2) return 'client';
  return 'unknown';
}

export const twilioTranscriber: Transcriber = {
  provider: 'twilio',

  isConfigured() {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_INTELLIGENCE_SERVICE_SID,
    );
  },

  async start(input: StartTranscriptionInput): Promise<StartTranscriptionResult> {
    const c = client();
    const serviceSid = process.env.TWILIO_INTELLIGENCE_SERVICE_SID;
    if (!c || !serviceSid) {
      return { ok: false, error: 'Twilio Intelligence is not configured (TWILIO_INTELLIGENCE_SERVICE_SID).' };
    }

    try {
      const transcript = await c.intelligence.v2.transcripts.create({
        serviceSid,
        channel: {
          media_properties: { source_sid: input.recordingSid },
        },
        // Echoed back on the webhook so the callback can find its call
        // without a reverse lookup.
        customerKey: input.messageId,
      } as any);

      return {
        ok: true,
        provider: 'twilio',
        jobId: transcript.sid,
        synchronous: false,
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'transcript create failed' };
    }
  },

  async fetch(jobId: string): Promise<FetchTranscriptResult> {
    const c = client();
    if (!c) return { ok: false, error: 'Twilio not configured' };

    try {
      const sentences = await c.intelligence.v2
        .transcripts(jobId)
        .sentences
        .list({ limit: 2000 });

      const segments: TranscriptSegment[] = sentences.map((s: any) => ({
        speaker: speakerForChannel(s.mediaChannel),
        text: String(s.transcript || '').trim(),
        startMs: Math.round(Number(s.startTime || 0) * 1000),
        endMs: Math.round(Number(s.endTime || 0) * 1000),
        ...(typeof s.confidence === 'number' ? { confidence: s.confidence } : {}),
      })).filter((s: TranscriptSegment) => s.text.length > 0);

      return { ok: true, segments };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'sentence fetch failed' };
    }
  },
};
