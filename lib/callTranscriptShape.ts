// Stored call transcripts.
//
// ─── Why these are their own collection ─────────────────────────────
// A transcript is large, it is reprocessed whenever the analysis prompt
// improves, and it carries a retention question the /messages record
// should not inherit. Keeping it separate means a retention policy can
// delete transcripts without touching call history.
//
// The document id is the /messages id, so the two are always joinable
// and one call can never accumulate two transcripts.

import type { TranscriptSegment, TranscriptionProvider } from './transcription/types';

export type TranscriptStatus =
  | 'processing'   // handed to the provider, waiting on the callback
  | 'ready'        // text stored
  | 'skipped'      // deliberately not transcribed — see skipReason
  | 'failed';      // provider errored; see error

export interface CallTranscriptDoc {
  /** Mirrors the doc id. */
  messageId: string;
  referralId: string | null;
  provider: TranscriptionProvider;
  /** Provider's job handle, for matching the async callback. */
  jobId: string | null;
  status: TranscriptStatus;
  segments: TranscriptSegment[];
  /** Flattened text, so the analyser does not rebuild it every run. */
  fullText: string;
  durationSeconds: number;
  /** Populated when status is 'skipped'. A missing transcript should
   *  always be explicable rather than look like a failure. */
  skipReason?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Set once the AI summary has run, so reprocessing is detectable. */
  analyzedAt?: string | null;
}

export const TRANSCRIPTS_COLLECTION = 'call_transcripts';
