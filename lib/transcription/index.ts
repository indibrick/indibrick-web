// Transcription entry point. Callers use this, never a provider file.
//
// Selection is by env so switching providers is a config change plus one
// new adapter, with no edits to the calling code:
//   TRANSCRIPTION_PROVIDER=twilio     (default)
//   TRANSCRIPTION_PROVIDER=deepgram   (not yet implemented)

import type {
  Transcriber,
  TranscriptionProvider,
  StartTranscriptionInput,
  StartTranscriptionResult,
} from './types';
import { twilioTranscriber } from './twilioIntelligence';
import { MIN_TRANSCRIBE_SECONDS } from './types';

export * from './types';

const REGISTRY: Partial<Record<TranscriptionProvider, Transcriber>> = {
  twilio: twilioTranscriber,
};

export function activeProvider(): TranscriptionProvider {
  const raw = String(process.env.TRANSCRIPTION_PROVIDER || 'twilio').toLowerCase();
  return raw === 'deepgram' ? 'deepgram' : 'twilio';
}

export function getTranscriber(): Transcriber | null {
  return REGISTRY[activeProvider()] || null;
}

export function isTranscriptionConfigured(): boolean {
  const t = getTranscriber();
  return Boolean(t && t.isConfigured());
}

/**
 * Start transcription for one recording, applying the rules that decide
 * whether it should happen at all.
 *
 * Returns `skipped: true` — not an error — when a call was deliberately
 * left untranscribed. The caller records the reason so a missing
 * transcript is always explicable rather than looking like a failure.
 */
export async function startTranscription(
  input: StartTranscriptionInput & { transcribeRequested: boolean },
): Promise<StartTranscriptionResult> {
  if (!input.transcribeRequested) {
    return { ok: true, skipped: true, skipReason: 'agent chose not to transcribe this call' };
  }

  // Voicemail drops, wrong numbers and instant hangups bill the same per
  // minute as a real conversation and yield nothing worth reading.
  if (input.durationSeconds > 0 && input.durationSeconds < MIN_TRANSCRIBE_SECONDS) {
    return {
      ok: true,
      skipped: true,
      skipReason: `call was ${input.durationSeconds}s, under the ${MIN_TRANSCRIBE_SECONDS}s floor`,
    };
  }

  const t = getTranscriber();
  if (!t) {
    return { ok: false, error: `No transcriber registered for provider "${activeProvider()}".` };
  }
  if (!t.isConfigured()) {
    return { ok: false, error: `Transcription provider "${t.provider}" is not configured.` };
  }

  return t.start(input);
}
