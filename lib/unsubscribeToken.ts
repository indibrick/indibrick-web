// Stateless unsubscribe tokens.
//
// Signed payload = base64url(JSON) + '.' + base64url(HMAC-SHA256(payload, secret)).
// Verifying the token doesn't require a DB lookup — the payload
// self-describes (email + tenant + sender + issuedAt). Once verified,
// the /api/unsubscribe/[token] handler writes an /unsubscribes doc
// which is the authoritative suppression state.
//
// Why HMAC instead of a random opaque token stored in a DB doc:
//   - Emails go to potentially thousands of recipients; storing a
//     unique token per send would balloon writes.
//   - Recipients might click an old unsub link from a message we sent
//     6 months ago. Random tokens would have to live forever.
//   - HMAC lets us include just enough context in the URL to record
//     the opt-out later, without keeping token state around.
//
// Env: UNSUBSCRIBE_SIGNING_SECRET (required in prod).

import crypto from 'crypto';

const SECRET_ENV = 'UNSUBSCRIBE_SIGNING_SECRET';

export interface UnsubTokenPayload {
  email: string;       // recipient email (lowercased)
  tenantId?: string;   // for multi-tenant later; 'indibrick' today
  senderUid?: string;  // who sent the email — useful for admin audits
  ctx?: string;        // free-form context — e.g. 'batch:<id>' or 'form:<slug>'
  iat: number;         // issued-at (epoch seconds)
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function secret(): string {
  const v = process.env[SECRET_ENV] || '';
  if (!v) {
    // Development fallback — deterministic + weak so tokens verify in
    // local testing without setting env. Prod MUST set the env var;
    // health check surfaces this via `config.sentry` style flags later.
    console.warn(`[unsubToken] ${SECRET_ENV} not set — using DEV_ONLY fallback secret. DO NOT deploy without setting this.`);
    return 'DEV_ONLY_INSECURE_UNSUB_SECRET';
  }
  return v;
}

export function signUnsubToken(payload: Omit<UnsubTokenPayload, 'iat'>): string {
  const full: UnsubTokenPayload = {
    email: String(payload.email || '').trim().toLowerCase(),
    tenantId: payload.tenantId || 'indibrick',
    senderUid: payload.senderUid,
    ctx: payload.ctx,
    iat: Math.floor(Date.now() / 1000),
  };
  const body = b64url(Buffer.from(JSON.stringify(full)));
  const sig = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  return `${body}.${sig}`;
}

export interface UnsubVerifyResult {
  ok: boolean;
  payload?: UnsubTokenPayload;
  error?: string;
}

export function verifyUnsubToken(token: string): UnsubVerifyResult {
  if (!token || typeof token !== 'string') return { ok: false, error: 'missing token' };
  const dot = token.indexOf('.');
  if (dot < 1 || dot === token.length - 1) return { ok: false, error: 'malformed' };
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  // Constant-time compare — protects against timing oracles on the signature.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, error: 'bad signature' };
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as UnsubTokenPayload;
    if (!payload.email) return { ok: false, error: 'missing email in payload' };
    return { ok: true, payload };
  } catch {
    return { ok: false, error: 'unparseable payload' };
  }
}
