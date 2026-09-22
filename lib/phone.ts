/**
 * Canonical phone normalisation, shared by client and server.
 *
 * This lives here rather than in lib/twilioClient.ts because that module
 * imports the Twilio Node SDK. Importing it from a 'use client' component
 * would pull the entire SDK into the browser bundle. twilioClient re-exports
 * normalizeE164 from here, so existing server-side imports keep working.
 */

/** Strict E.164, or null when the input isn't a number we recognise. */
export function normalizeE164(phone: string): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

/**
 * Normalise for storage. New numbers get +1 automatically; anything we can't
 * parse is stored exactly as typed rather than blanked, so a deliberate
 * non-standard entry (an extension, an overseas number we don't recognise)
 * survives the round trip.
 *
 * Why this matters: inbound call routing and SMS threading both look up
 * referrals with an exact-equality query on clientPhone against Twilio's
 * E.164 `From`. A number stored as "6476788682" can never match "+16476788682",
 * so those calls fall through to the fallback handset instead of ringing the
 * assigned agent's browser.
 */
export function toStoredPhone(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  return normalizeE164(s) ?? s;
}
