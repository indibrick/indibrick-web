// Twilio SDK wrapper. Server-side only — the SDK constructor requires
// the Auth Token which must NEVER hit the browser.
//
// Env vars (add to .env.local + your Vercel/Cloud Run config):
//   TWILIO_ACCOUNT_SID       = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//   TWILIO_AUTH_TOKEN        = <auth token from Twilio console>
//   TWILIO_PHONE_NUMBER      = +14165551234  (in E.164)
//   TWILIO_WEBHOOK_BASE_URL  = https://indibrick.ca (or ngrok URL in dev)
//
// The webhook base URL is the public origin Twilio calls back to. On
// localhost you need ngrok / cloudflared: point Twilio's Messaging +
// Voice webhook config at https://<your-tunnel>/api/twilio/...
//
// Design notes:
//   - We instantiate the client lazily so `import` doesn't crash the
//     dev server when env vars are absent.
//   - All send/call helpers return typed shapes so downstream code
//     can log deterministic fields to Firestore without introspection.

import twilio, { Twilio } from 'twilio';

let cached: Twilio | null = null;

export function twilioClient(): Twilio | null {
  if (cached) return cached;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  cached = twilio(sid, token);
  return cached;
}

export function twilioPhoneNumber(): string | null {
  return process.env.TWILIO_PHONE_NUMBER || null;
}

export function twilioWebhookBaseUrl(): string {
  // Default to the production origin; override via env for dev tunnels.
  return process.env.TWILIO_WEBHOOK_BASE_URL || 'https://indibrick.ca';
}

// ─── SMS ───────────────────────────────────────────────────────────

export interface SendSmsInput {
  to: string;           // E.164 (+14165551234)
  body: string;
  // Optional: statusCallback URL Twilio pings when delivery status
  // changes. We default to /api/twilio/sms-status but let callers
  // override for one-off use.
  statusCallback?: string;
  // Sub-account routing for multi-tenancy (Wave 3). For now every
  // send uses the master account.
  fromNumber?: string;
}

export interface SendSmsResult {
  ok: boolean;
  sid?: string;         // Twilio Message SID (SMxxxxxxxx)
  error?: string;
  segmentCount?: number;
}

export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const client = twilioClient();
  const from = input.fromNumber || twilioPhoneNumber();
  if (!client || !from) {
    return { ok: false, error: 'Twilio not configured (missing SID/token/number)' };
  }
  try {
    const message = await client.messages.create({
      to: input.to,
      from,
      body: input.body,
      statusCallback: input.statusCallback || `${twilioWebhookBaseUrl()}/api/twilio/sms-status`,
    });
    // Twilio counts a segment as 160 GSM-7 chars or 70 UCS-2 (unicode).
    // The SDK returns numSegments as a string.
    const segmentCount = Number(message.numSegments || '1');
    return { ok: true, sid: message.sid, segmentCount };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'send failed' };
  }
}

// ─── Voice ─────────────────────────────────────────────────────────

export interface InitiateCallInput {
  to: string;           // E.164 — the client's number
  agentNumber: string;  // E.164 — the agent's cell / desk phone
  // Twilio will call the agent first, then bridge to the client. When
  // recording is on both legs are captured dual-channel, so playback —
  // and any transcriber — can separate who said what.
  //
  // recording:false is a genuine mode, not an edge case: internal calls
  // and sensitive client conversations should leave no audio behind.
  recording?: boolean;
  // Whether the recording gets transcribed and summarised. Meaningless
  // without recording, and normalizeCallOptions() refuses that pairing
  // before it reaches here.
  transcribe?: boolean;
  // Callback URLs — we host the TwiML at /api/twilio/voice-outbound.
  twimlUrl?: string;
  statusCallback?: string;
  fromNumber?: string;
}

export interface InitiateCallResult {
  ok: boolean;
  sid?: string;         // Twilio Call SID (CAxxxxxxxx)
  error?: string;
}

export async function initiateCall(input: InitiateCallInput): Promise<InitiateCallResult> {
  const client = twilioClient();
  const from = input.fromNumber || twilioPhoneNumber();
  if (!client || !from) {
    return { ok: false, error: 'Twilio not configured' };
  }
  const baseUrl = twilioWebhookBaseUrl();
  const record = input.recording !== false;
  const transcribe = record && input.transcribe !== false;
  try {
    // Two-leg bridged call: Twilio calls the agent first, and the
    // TwiML endpoint returns <Dial> to the client, so the agent answers
    // on THEIR handset.
    //
    // The privacy flags travel on the TwiML URL because Twilio gives us
    // nowhere to stash state on a call. voice-outbound reads them back
    // to decide whether to attach recording and which notice to play.
    const twimlUrl = input.twimlUrl
      || `${baseUrl}/api/twilio/voice-outbound`
        + `?client=${encodeURIComponent(input.to)}`
        + `&rec=${record ? '1' : '0'}&txt=${transcribe ? '1' : '0'}`;

    const call = await client.calls.create({
      to: input.agentNumber,
      from,
      url: twimlUrl,
      statusCallback: input.statusCallback || `${baseUrl}/api/twilio/voice-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      // Omitted entirely on a private call. Passing record:false would
      // work, but the <Dial> in voice-outbound is what actually captures
      // the bridged audio — both sides have to agree, or a "private"
      // call still leaves a recording behind.
      ...(record
        ? {
            record: true,
            recordingChannels: 'dual' as const,
            recordingStatusCallback: `${baseUrl}/api/twilio/recording-status`,
          }
        : {}),
    });
    return { ok: true, sid: call.sid };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'call failed' };
  }
}

// ─── Signature verification ────────────────────────────────────────
// Twilio signs every webhook with X-Twilio-Signature. We verify it
// against the request URL + form params to reject forged callbacks.
// See https://www.twilio.com/docs/usage/webhooks/webhooks-security

export function verifyTwilioSignature(opts: {
  signatureHeader: string | null;
  fullUrl: string;
  params: Record<string, string>;
}): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !opts.signatureHeader) return false;
  try {
    return twilio.validateRequest(token, opts.signatureHeader, opts.fullUrl, opts.params);
  } catch {
    return false;
  }
}

// ─── Phone number normalization ────────────────────────────────────
// Twilio requires E.164. Canadian numbers → +1XXXXXXXXXX.

export function normalizeE164(phone: string): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}
