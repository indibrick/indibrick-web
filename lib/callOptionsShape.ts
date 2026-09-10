// Per-call privacy options.
//
// Three independent choices, set per call and defaulted per agent:
//
//   mode        'phone'   ring the agent's handset, works anywhere
//               'browser' WebRTC, ~1/3 the agent-leg cost, desk only
//   record      capture audio at all
//   transcribe  run it through speech-to-text and the AI summariser
//
// ─── The one invariant ──────────────────────────────────────────────
// Transcription requires a recording — there is nothing to transcribe
// otherwise. `{ record: false, transcribe: true }` is not a
// configuration, it is a bug, and normalizeCallOptions() refuses it
// rather than silently turning recording back on. Silently re-enabling
// would be the worse failure: an agent who deliberately turned recording
// off would be recorded anyway.
//
// ─── Why "no recording" is a first-class option ─────────────────────
// Not every call should end up on a client's file. Internal calls,
// sensitive conversations about a client's finances or credit, and
// anything a client asks not to be recorded all need a path that leaves
// no audio behind. Making that a supported mode is what keeps it from
// being handled by nobody calling through the CRM at all.
//
// It also changes what the client is told. The spoken notice announces
// recording; playing it on an unrecorded call would be a false statement
// to a client, so the notice is attached only when recording is on.

export type CallMode = 'phone' | 'browser';

export interface CallOptions {
  mode: CallMode;
  record: boolean;
  transcribe: boolean;
}

/** What an agent gets when they have expressed no preference. */
export const DEFAULT_CALL_OPTIONS: CallOptions = {
  mode: 'phone',
  record: true,
  transcribe: true,
};

/**
 * The three combinations worth naming in a UI. `mode` is orthogonal and
 * is chosen separately, so it is not part of a preset.
 */
export type CallPreset = 'full' | 'record_only' | 'private';

export const CALL_PRESETS: Record<CallPreset, { record: boolean; transcribe: boolean; label: string; blurb: string }> = {
  full: {
    record: true, transcribe: true,
    label: 'Record & summarise',
    blurb: 'Audio kept, transcript written, summary and next steps posted to the file.',
  },
  record_only: {
    record: true, transcribe: false,
    label: 'Record only',
    blurb: 'Audio kept for playback. No transcript, no AI, nothing written to the file.',
  },
  private: {
    record: false, transcribe: false,
    label: 'Private call',
    blurb: 'Nothing captured. The client hears no recording notice, because there is none.',
  },
};

export function presetOf(o: Pick<CallOptions, 'record' | 'transcribe'>): CallPreset {
  if (!o.record) return 'private';
  return o.transcribe ? 'full' : 'record_only';
}

export interface NormalizeResult {
  ok: boolean;
  options?: CallOptions;
  error?: string;
}

/**
 * Coerce arbitrary input into valid options, or refuse.
 *
 * `fallback` is the agent's stored default, so an omitted field means
 * "whatever I normally do" rather than "off".
 */
export function normalizeCallOptions(
  input: any,
  fallback: CallOptions = DEFAULT_CALL_OPTIONS,
): NormalizeResult {
  const src = input && typeof input === 'object' ? input : {};

  const mode: CallMode = src.mode === 'browser' ? 'browser'
    : src.mode === 'phone' ? 'phone'
    : fallback.mode;

  // A named preset wins over loose flags — it is the thing a UI sends.
  let record: boolean;
  let transcribe: boolean;
  if (typeof src.preset === 'string' && src.preset in CALL_PRESETS) {
    const p = CALL_PRESETS[src.preset as CallPreset];
    record = p.record;
    transcribe = p.transcribe;
  } else {
    record = typeof src.record === 'boolean' ? src.record : fallback.record;
    transcribe = typeof src.transcribe === 'boolean' ? src.transcribe : fallback.transcribe;
  }

  if (!record && transcribe) {
    return {
      ok: false,
      error: 'Cannot transcribe a call that is not being recorded. Choose "Record & summarise", or turn transcription off.',
    };
  }

  return { ok: true, options: { mode, record, transcribe } };
}

/**
 * The agent's stored default, read off their /users document. Anything
 * missing or malformed falls back rather than throwing — a corrupt
 * preference must not block a call.
 */
export function callDefaultsFromUser(userDoc: any): CallOptions {
  const d = userDoc?.callDefaults;
  if (!d || typeof d !== 'object') return DEFAULT_CALL_OPTIONS;
  const norm = normalizeCallOptions(d, DEFAULT_CALL_OPTIONS);
  return norm.ok && norm.options ? norm.options : DEFAULT_CALL_OPTIONS;
}
