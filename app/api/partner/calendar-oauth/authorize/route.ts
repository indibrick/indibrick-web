// Kicks off the Google Calendar OAuth flow. The client hits this route with
// the current user's uid, we return an auth URL to redirect to. Google's
// consent screen sends the user to the /callback route with an auth code.

import { NextRequest, NextResponse } from 'next/server';
import { buildAuthUrl } from '../../../../../services/CalendarService';

export async function GET(req: NextRequest) {
  try {
    const uid = req.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'uid query parameter is required' }, { status: 400 });
    }

    // state carries the uid through Google's redirect so the callback knows
    // whose refresh_token it just received. We prefix with a timestamp so
    // stale states expire naturally.
    const state = Buffer.from(JSON.stringify({ uid, t: Date.now() })).toString('base64url');

    const authUrl = buildAuthUrl(state);
    return NextResponse.json({ authUrl });
  } catch (e: any) {
    console.error('[calendar-oauth/authorize]', e);
    return NextResponse.json(
      { error: e.message || 'Failed to build Google auth URL' },
      { status: 500 },
    );
  }
}
