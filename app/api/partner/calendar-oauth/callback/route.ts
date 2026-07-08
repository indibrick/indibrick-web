// Google redirects here after the user consents. We exchange the auth
// code for a refresh token, store it on the user's Firestore doc, then
// redirect them back to the partner portal Calendar tab with a success
// flag so the UI can show "Connected".

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { exchangeCodeForTokens, storeRefreshTokenForUser } from '../../../../../services/CalendarService';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const portalReturn = new URL('/partner', url.origin);

  if (errorParam) {
    // User denied consent, or Google rejected. Redirect back with a flag
    // so the UI can render a friendly "connection cancelled" message.
    portalReturn.searchParams.set('calendar', 'cancelled');
    return NextResponse.redirect(portalReturn);
  }

  if (!code || !stateRaw) {
    portalReturn.searchParams.set('calendar', 'error');
    portalReturn.searchParams.set('reason', 'missing_code_or_state');
    return NextResponse.redirect(portalReturn);
  }

  let uid: string;
  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf-8'));
    uid = parsed?.uid;
    if (!uid) throw new Error('state missing uid');
  } catch {
    portalReturn.searchParams.set('calendar', 'error');
    portalReturn.searchParams.set('reason', 'bad_state');
    return NextResponse.redirect(portalReturn);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Fetch the user's Google email so we can show it in the UI ("Connected
    // as mudit@indibrick.ca"). Non-fatal if the userinfo call fails.
    let email: string | undefined;
    try {
      const oauth2 = google.oauth2({
        version: 'v2',
        auth: (() => {
          const OAuth2 = google.auth.OAuth2;
          const c = new OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID!,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
          );
          c.setCredentials({ access_token: tokens.access_token });
          return c;
        })(),
      });
      const info = await oauth2.userinfo.get();
      email = info.data.email || undefined;
    } catch {
      /* non-fatal */
    }

    await storeRefreshTokenForUser(uid, tokens.refresh_token, email);

    portalReturn.searchParams.set('calendar', 'connected');
    if (email) portalReturn.searchParams.set('email', email);
    return NextResponse.redirect(portalReturn);
  } catch (e: any) {
    console.error('[calendar-oauth/callback]', e);
    portalReturn.searchParams.set('calendar', 'error');
    portalReturn.searchParams.set('reason', 'exchange_failed');
    return NextResponse.redirect(portalReturn);
  }
}
