// Vendor-agnostic transcription contract.
//
// Twilio is the current provider because it needed no new account. It is
// also the most expensive option by a wide margin — $0.024/min against
// Deepgram Nova-3 at $0.0043 — and is the single largest line in a
// call's cost, bigger than both phone legs combined.
//
// Everything vendor-specific lives behind this interface so that swap is
// one file rather than a rewrite. Nothing outside lib/transcription/
// should import a provider directly.

export type TranscriptionProvider = 'twilio' | 'deepgram';

/** Which side of the call a line came from. */
export type Speaker = 'agent' | 'client' | 'unknown';

export interface TranscriptSegment {
  speaker: Speaker;
  text: string;
  /** Offset from the start of the recording. */
  startMs: number;
  endMs: number;
  /** Provider confidence 0-1, when it reports one. */
  confidence?: number;
}

export interface StartTranscriptionInput {
  /** Twilio Recording SID (RExxx). */
  recordingSid: string;
  /** Playable URL, for providers that fetch audio rather than read by SID. */
  recordingUrl: string;
  durationSeconds: number;
  /** The /messages doc this belongs to — carried through the callback. */
  messageId: string;
}

export interface StartTranscriptionResult {
  ok: boolean;
  /** Provider's job handle, stored so the callback can be matched back. */
  jobId?: string;
  provider?: TranscriptionProvider;
  /** True when the provider returned the text immediately. */
  synchronous?: boolean;
  segments?: TranscriptSegment[];
  error?: string;
  /** Set when the call was deliberately not transcribed. Not an error. */
  skipped?: boolean;
  skipReason?: string;
}

export interface FetchTranscriptResult {
  ok: boolean;
  segments?: TranscriptSegment[];
  error?: string;
}

export interface Transcriber {
  readonly provider: TranscriptionProvider;
  /** True when this provider has the credentials it needs. */
  isConfigured(): boolean;
  start(input: StartTranscriptionInput): Promise<StartTranscriptionResult>;
  /** Pull the finished text once the provider says it is ready. */
  fetch(jobId: string): Promise<FetchTranscriptResult>;
}

/**
 * Calls shorter than this are not transcribed.
 *
 * Voicemail drops, wrong numbers and immediate hangups still produce a
 * recording, and transcribing them costs the same per minute as a real
 * conversation while producing nothing worth reading. At typical volume
 * this is 15-20% of calls removed from the bill for one comparison.
 */
export const MIN_TRANSCRIBE_SECONDS = 30;

/** Turn segments into the flat text an LLM prompt wants. */
export function segmentsToText(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => `${s.speaker === 'agent' ? 'Agent' : s.speaker === 'client' ? 'Client' : 'Speaker'}: ${s.text}`)
    .join('\n');
}
