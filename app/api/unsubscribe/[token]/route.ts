// Public unsubscribe endpoint.
//
// Two paths:
//   GET  — used by the confirmation page (returns the decoded email +
//          current opt-out state so the UI can render "already opted
//          out" vs. "confirm you want to opt out").
//   POST — the one-click opt-out. This is what Gmail/Yahoo hit for
//          List-Unsubscribe-Post: one HTTP POST with no body, no UI.
//          Also called by the confirmation page's confirm button.
//
// The token is HMAC-signed (see lib/unsubscribeToken.ts) — decoding
// tells us the email + tenant + who sent + when. No DB lookup needed
// to validate; the /unsubscribes doc is written only after opt-out.

import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubToken } from '@/lib/unsubscribeToken';
import { recordUnsubscribe, isSuppressed } from '@/lib/suppression';

function ipOf(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const v = verifyUnsubToken(params.token);
  if (!v.ok || !v.payload) {
    return NextResponse.json({ error: v.error || 'invalid token' }, { status: 400 });
  }
  const email = v.payload.email;
  const already = await isSuppressed(email, v.payload.tenantId);
  return NextResponse.json({
    email,
    tenantId: v.payload.tenantId || 'indibrick',
    ctx: v.payload.ctx || null,
    alreadyOptedOut: already,
    issuedAt: v.payload.iat,
  });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const v = verifyUnsubToken(params.token);
  if (!v.ok || !v.payload) {
    return NextResponse.json({ error: v.error || 'invalid token' }, { status: 400 });
  }
  const result = await recordUnsubscribe({
    email: v.payload.email,
    tenantId: v.payload.tenantId,
    source: 'one_click',
    senderUid: v.payload.senderUid,
    ctx: v.payload.ctx,
    ip: ipOf(req),
    userAgent: (req.headers.get('user-agent') || '').slice(0, 200),
  });
  return NextResponse.json({ ok: result.ok, alreadyOptedOut: result.alreadyOptedOut === true });
}
