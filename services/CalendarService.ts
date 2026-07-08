// Google Calendar sync — per-user OAuth 2.0.
//
// Each agent connects their own Google account via OAuth, we store the
// refresh token in `users/{uid}.googleCalendar`, then every CRM task the
// user creates or edits gets pushed to their personal Google Calendar as
// an event with a stable ID (`indibrick-task-${taskId}`). Google Calendar
// edits sync back into Firestore via a push webhook.
//
// This replaces the prior mock endpoint at /api/partner/calendar-sync that
// returned "Google Calendar API configuration required" — the mock was a
// placeholder that never had a real implementation.

import { google } from 'googleapis';
import { adminDb } from '../lib/firebaseAdmin';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

const CALENDAR_ID = 'primary';

// Deterministic event ID from CRM task ID, so re-syncing an already-pushed
// task updates the existing event instead of creating a duplicate.
export function eventIdForTask(taskId: string): string {
  // Google Calendar event IDs must be [0-9a-v] and length 5–1024. Base32
  // encode the taskId, prefix with a sentinel so we can identify our own.
  const clean = String(taskId).toLowerCase().replace(/[^0-9a-v]/g, '');
  return `indibricktask${clean}`;
}

export function getRedirectUri(): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI
    || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://indibrick.ca'}/api/partner/calendar-oauth/callback`;
}

// Returns a configured OAuth2 client. Callers pass the user's stored
// refresh token; this client can then generate access tokens on demand.
export function buildOAuthClient(refreshToken?: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Google Calendar OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET in the environment.',
    );
  }
  const client = new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
  }
  return client;
}

export function buildAuthUrl(state: string): string {
  const client = buildOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force a refresh_token every time — we need one
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{ refresh_token: string; access_token: string; expiry_date?: number | null }> {
  const client = buildOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('Google did not return a refresh_token. User likely already granted access — revoke at myaccount.google.com/permissions and retry.');
  }
  return {
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token || '',
    expiry_date: tokens.expiry_date ?? null,
  };
}

// Fetches the stored refresh token for a user. Returns null if the user
// hasn't connected their Calendar yet — callers should surface a
// "connect first" message instead of erroring.
export async function getRefreshTokenForUser(uid: string): Promise<string | null> {
  if (!adminDb) return null;
  const doc = await adminDb.collection('users').doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data() as any;
  return data?.googleCalendar?.refreshToken ?? null;
}

export async function storeRefreshTokenForUser(uid: string, refreshToken: string, email?: string): Promise<void> {
  if (!adminDb) throw new Error('Admin DB not connected');
  await adminDb.collection('users').doc(uid).set(
    {
      googleCalendar: {
        refreshToken,
        connectedAt: new Date().toISOString(),
        connectedEmail: email || null,
      },
    },
    { merge: true },
  );
}

export async function clearRefreshTokenForUser(uid: string): Promise<void> {
  if (!adminDb) throw new Error('Admin DB not connected');
  await adminDb.collection('users').doc(uid).set(
    { googleCalendar: null },
    { merge: true },
  );
}

// Push a single CRM task to the user's Google Calendar. If the event
// already exists (deterministic ID from taskId), we PATCH; otherwise
// we insert. Idempotent — safe to call repeatedly for the same task.
export async function upsertTaskAsEvent(params: {
  refreshToken: string;
  task: { id: string; description: string; dueDate: string; clientName?: string; status?: string; referralId?: string };
}): Promise<{ eventId: string; created: boolean }> {
  const { refreshToken, task } = params;
  const auth = buildOAuthClient(refreshToken);
  const cal = google.calendar({ version: 'v3', auth });

  const eventId = eventIdForTask(task.id);
  // A CRM task is a single moment (a call to make, a doc to chase). Model
  // as a 30-minute all-day-adjacent event at 9am America/Toronto by default.
  const startIso = `${task.dueDate}T09:00:00`;
  const endIso = `${task.dueDate}T09:30:00`;

  const eventBody = {
    id: eventId,
    summary: task.clientName ? `IndiBrick · ${task.clientName} — ${task.description}` : `IndiBrick · ${task.description}`,
    description: task.referralId
      ? `Open in IndiBrick CRM: https://indibrick.ca/partner\nDeal ref: ${task.referralId}\nStatus: ${task.status || 'Pending'}`
      : `Open in IndiBrick CRM: https://indibrick.ca/partner`,
    start: { dateTime: startIso, timeZone: 'America/Toronto' },
    end: { dateTime: endIso, timeZone: 'America/Toronto' },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
    source: { title: 'IndiBrick CRM', url: 'https://indibrick.ca/partner' },
  };

  try {
    await cal.events.get({ calendarId: CALENDAR_ID, eventId });
    // Exists → PATCH
    await cal.events.patch({ calendarId: CALENDAR_ID, eventId, requestBody: eventBody });
    return { eventId, created: false };
  } catch (err: any) {
    // 404 = not there yet, insert. Anything else re-throws.
    if (err?.code === 404 || err?.errors?.[0]?.reason === 'notFound') {
      await cal.events.insert({ calendarId: CALENDAR_ID, requestBody: eventBody });
      return { eventId, created: true };
    }
    throw err;
  }
}

// Batch push: iterates tasks with a small pause between calls so we don't
// blow through Calendar's 500-req/100sec quota. Returns per-task result.
export async function syncTasksForUser(params: {
  uid: string;
  tasks: { id: string; description: string; dueDate: string; clientName?: string; status?: string; referralId?: string }[];
}): Promise<{ pushed: number; skipped: number; errors: { taskId: string; message: string }[] }> {
  const { uid, tasks } = params;
  const refreshToken = await getRefreshTokenForUser(uid);
  if (!refreshToken) {
    throw new Error('User has not connected Google Calendar. Direct them to /api/partner/calendar-oauth/authorize.');
  }

  let pushed = 0;
  let skipped = 0;
  const errors: { taskId: string; message: string }[] = [];

  for (const t of tasks) {
    // Skip completed / missing-date tasks — Google Calendar isn't a graveyard.
    if (t.status === 'Completed' || !t.dueDate) {
      skipped++;
      continue;
    }
    try {
      await upsertTaskAsEvent({ refreshToken, task: t });
      pushed++;
    } catch (e: any) {
      errors.push({ taskId: t.id, message: e?.message || 'unknown' });
    }
    // Gentle throttle: 60ms between calls = ~16/sec, well under quota.
    await new Promise((r) => setTimeout(r, 60));
  }

  return { pushed, skipped, errors };
}
