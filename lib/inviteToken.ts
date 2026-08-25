// Signed partner invite tokens.
//
// Same HMAC-SHA256 pattern as lib/unsubscribeToken.ts. Payload:
// email + role + tenantId + invitedBy + inviteId + iat + exp.
// Verification is stateless; the invite doc in /invites is the
// authoritative record for consumption state (pending / accepted /
// revoked / expired).
//
// Env: INVITE_SIGNING_SECRET (falls back to a DEV_ONLY string, same
// pattern as unsub).

import crypto from 'crypto';

const SECRET_ENV = 'INVITE_SIGNING_SECRET';
const DEFAULT_TTL_DAYS = 14;

export interface InvitePayload {
  inviteId: string;
  email: string;
  role: string;
  tenantId: string;
  invitedBy: string;
  // Optional team the inviter wants the invitee to auto-join on
  // accept. If set + the inviter still owns that team when the
  // invitee accepts, the invitee's uid lands in memberUids.
  teamId?: string;
  iat: number;
  exp: number;
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
    console.warn(`[inviteToken] ${SECRET_ENV} not set — DEV_ONLY fallback in use.`);
    return 'DEV_ONLY_INSECURE_INVITE_SECRET';
  }
  return v;
}

export function signInviteToken(
  input: Omit<InvitePayload, 'iat' | 'exp'>,
  ttlDays: number = DEFAULT_TTL_DAYS,
): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const full: InvitePayload = {
    ...input,
    email: String(input.email || '').trim().toLowerCase(),
    iat: nowSec,
    exp: nowSec + ttlDays * 86400,
  };
  const body = b64url(Buffer.from(JSON.stringify(full)));
  const sig = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  return `${body}.${sig}`;
}

export interface InviteVerifyResult {
  ok: boolean;
  payload?: InvitePayload;
  error?: string;
}

export function verifyInviteToken(token: string): InviteVerifyResult {
  if (!token || typeof token !== 'string') return { ok: false, error: 'missing token' };
  const dot = token.indexOf('.');
  if (dot < 1 || dot === token.length - 1) return { ok: false, error: 'malformed' };
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, error: 'bad signature' };
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as InvitePayload;
    if (!payload.email) return { ok: false, error: 'missing email' };
    if (!payload.role) return { ok: false, error: 'missing role' };
    if (!payload.inviteId) return { ok: false, error: 'missing inviteId' };
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, error: 'expired' };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, error: 'unparseable payload' };
  }
}
