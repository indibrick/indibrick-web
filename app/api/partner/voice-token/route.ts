// Hands the browser dialer a short-lived Twilio access token.
//
// Authenticated: the token carries the caller's uid as its identity, and
// /api/twilio/voice-browser trusts that identity to decide who may dial
// whom. Minting one for an unauthenticated request would hand out the
// ability to place calls billed to this account.
//
// The token grants outbound calling only, and only through our TwiML
// app — it cannot dial a number of the holder's choosing. The number is
// resolved server-side in voice-browser.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';
import { mintVoiceToken, isBrowserCallingConfigured } from '@/lib/twilioVoiceToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;

  if (!isBrowserCallingConfigured()) {
    // 200 with a flag, not an error: the UI uses this to decide whether
    // to offer the browser option at all, and a missing optional feature
    // is not a failed request.
    return NextResponse.json({ available: false, reason: 'not_configured' });
  }

  const result = mintVoiceToken(guard.session.uid);
  if (!result.ok) {
    return NextResponse.json({ available: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    available: true,
    token: result.token,
    identity: result.identity,
    expiresInSeconds: result.expiresInSeconds,
  });
}
