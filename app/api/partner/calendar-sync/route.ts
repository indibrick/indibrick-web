// Push CRM tasks to the connected user's Google Calendar. The prior
// implementation of this route was a placeholder mock that returned
// "Google Calendar API configuration required". This is the real one —
// uses the per-user refresh token stored during OAuth to insert/patch
// events in the user's primary calendar.

import { NextRequest, NextResponse } from 'next/server';
import { syncTasksForUser, getRefreshTokenForUser } from '../../../../services/CalendarService';
import { requireAuth } from '@/lib/authGuard';

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  // userId always comes from the verified token — the previous version
  // trusted the payload's userId, so any signed-in partner could sync
  // events to another partner's calendar.
  const userId = guard.session.uid;

  try {
    const { tasks } = await req.json();

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'tasks must be an array' }, { status: 400 });
    }

    // Check connection first so we can return a clean "please connect"
    // message rather than a 500 from deep inside the sync loop.
    const refreshToken = await getRefreshTokenForUser(userId);
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          message: 'Google Calendar is not connected for this user. Click "Connect Google Calendar" first.',
        },
        { status: 200 }, // 200 with connected:false — this is a UX state, not an error
      );
    }

    const result = await syncTasksForUser({ uid: userId, tasks });

    return NextResponse.json({
      success: true,
      connected: true,
      message: `Synced ${result.pushed} task${result.pushed === 1 ? '' : 's'} to Google Calendar${result.skipped ? ` (${result.skipped} skipped)` : ''}${result.errors.length ? ` — ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}` : ''}.`,
      ...result,
    });
  } catch (e: any) {
    console.error('[calendar-sync]', e);
    return NextResponse.json({ success: false, error: e.message || 'Sync failed' }, { status: 500 });
  }
}
