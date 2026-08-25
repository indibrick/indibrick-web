// Cloudflare Turnstile server-side verification.
//
// Free CAPTCHA — GDPR-friendly, no vendor lock-in, better UX than
// reCAPTCHA. Site key is public (used on the /f/[slug] page); secret
// key stays server-side in env.
//
// To activate in prod:
//   TURNSTILE_SITE_KEY        = 0x4Axxxxxxxxxxxx
//   TURNSTILE_SECRET_KEY      = 0x4Axxxxxxxxxxxx
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY = 0x4Axxxxxxxxxxxx    (mirror for client)
//
// If secret key is unset, verifyTurnstileToken() returns { ok: true,
// skipped: true } so localhost testing works without a Turnstile
// account. The form's `requireCaptcha` flag captures admin intent
// regardless — we just log the skip so we know it happened.

export interface TurnstileVerifyResult {
  ok: boolean;
  skipped: boolean;
  errorCodes?: string[];
}

export async function verifyTurnstileToken(token: string, remoteIp: string): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — skipping verification');
    return { ok: true, skipped: true };
  }
  if (!token) return { ok: false, skipped: false, errorCodes: ['missing-input-response'] };

  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: remoteIp });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      // Turnstile aims for <1s p95 — bail if it stalls.
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json().catch(() => ({} as any));
    if (data && data.success === true) return { ok: true, skipped: false };
    return { ok: false, skipped: false, errorCodes: Array.isArray(data['error-codes']) ? data['error-codes'] : ['verification-failed'] };
  } catch (e: any) {
    console.error('[turnstile] verify error', e?.message);
    // Fail closed on network errors — better a false-negative on a real
    // user than a bot slipping through when Cloudflare is degraded.
    return { ok: false, skipped: false, errorCodes: ['network-error'] };
  }
}

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    || process.env.TURNSTILE_SITE_KEY
    || null;
}
