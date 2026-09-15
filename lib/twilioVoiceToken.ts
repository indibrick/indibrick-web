// Access tokens for the in-browser dialer.
//
// ─── Why a second credential set ────────────────────────────────────
// The browser SDK authenticates with a short-lived JWT, and that JWT is
// signed with a Twilio API Key + Secret — NOT the Account Auth Token.
// This is deliberate on Twilio's part: an API Key can be revoked on its
// own, so a leaked browser token costs you one key rather than the
// account. Never sign these with TWILIO_AUTH_TOKEN.
//
// Required env (all three, or browser calling stays off):
//   TWILIO_API_KEY_SID      SKxxxxxxxx  — Console → API keys & tokens
//   TWILIO_API_KEY_SECRET   shown once at creation; not recoverable
//   TWILIO_TWIML_APP_SID    APxxxxxxxx  — Console → TwiML Apps
//
// The TwiML App's Voice URL must point at /api/twilio/voice-browser.
// That endpoint is what decides which number actually gets dialled.
//
// ─── Why the identity matters ───────────────────────────────────────
// The token's identity becomes the `From` on the resulting call, as
// `client:<identity>`. voice-browser reads it to confirm the person
// placing the call is the person who was authorised to place it, so the
// identity must be the Firebase uid and nothing friendlier.

import twilio from 'twilio';

const TTL_SECONDS = 600; // 10 min. The SDK re-mints before expiry.

export interface VoiceTokenResult {
  ok: boolean;
  token?: string;
  identity?: string;
  expiresInSeconds?: number;
  error?: string;
}

/** True when all three browser-dialer credentials are present. */
export function isBrowserCallingConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_API_KEY_SID &&
    process.env.TWILIO_API_KEY_SECRET &&
    process.env.TWILIO_TWIML_APP_SID,
  );
}

/**
 * Mint a Voice access token for one agent.
 *
 * `incomingAllow` is true. Agents both place and take calls in the
 * browser — an agent who can dial out but cannot be called back is only
 * half a phone, and returning a missed call is most of the job.
 *
 * The surface this opens is that a token holder can be rung as
 * `client:<uid>`. That is acceptable because reaching them still
 * requires going through our inbound endpoint, which decides who rings;
 * a token alone does not expose a dialable public address.
 */
export function mintVoiceToken(uid: string): VoiceTokenResult {
  if (!uid) return { ok: false, error: 'uid required' };
  if (!isBrowserCallingConfigured()) {
    return { ok: false, error: 'Browser calling is not configured on this environment.' };
  }

  try {
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID as string,
      process.env.TWILIO_API_KEY_SID as string,
      process.env.TWILIO_API_KEY_SECRET as string,
      { identity: uid, ttl: TTL_SECONDS },
    );

    token.addGrant(new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID as string,
      incomingAllow: true,
    }));

    return {
      ok: true,
      token: token.toJwt(),
      identity: uid,
      expiresInSeconds: TTL_SECONDS,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'token mint failed' };
  }
}
