// Clears the stored refresh token — user-initiated disconnect. Does NOT
// try to revoke the token on Google's side (that requires an active
// access token). The user can revoke at myaccount.google.com/permissions
// if they want to force it.

import { NextRequest, NextResponse } from 'next/server';
import { clearRefreshTokenForUser } from '../../../../../services/CalendarService';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 });
    await clearRefreshTokenForUser(uid);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[calendar-oauth/disconnect]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
