// Notifications management endpoint.
//
// Reads: happen client-side via the useNotifications hook (Firestore
// rules already scope reads to recipientUid = auth.uid).
// Writes: go through this route so we can audit-log dismiss/snooze
// events + eventually feed the "task fatigue" auto-disable heuristic
// (Sales Coach #1 risk).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

// Fields the caller is allowed to mutate. Everything else is dropped.
const ACTION_TO_PATCH: Record<string, () => Record<string, any>> = {
  read: () => ({ read: true, readAt: new Date().toISOString() }),
  unread: () => ({ read: false, readAt: null }),
  dismiss: () => ({ dismissed: true, dismissedAt: new Date().toISOString() }),
  // Snooze default = 7d, matching the Sales Coach guardrail: every
  // auto-task has a 1-click "not applicable — pause 7d" affordance.
  snooze7d: () => ({
    snoozedUntil: new Date(Date.now() + 7 * 86400_000).toISOString(),
    snoozedAt: new Date().toISOString(),
  }),
  snooze1d: () => ({
    snoozedUntil: new Date(Date.now() + 1 * 86400_000).toISOString(),
    snoozedAt: new Date().toISOString(),
  }),
  unsnooze: () => ({ snoozedUntil: null }),
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;

  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (typeof action !== 'string' || !(action in ACTION_TO_PATCH)) {
    return NextResponse.json(
      { error: 'Body must be { action: read | unread | dismiss | snooze7d | snooze1d | unsnooze }' },
      { status: 400 },
    );
  }

  const notifRef = adminDb.collection('notifications').doc(id);
  const snap = await notifRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = snap.data() || {};
  if (data.recipientUid !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const patch = ACTION_TO_PATCH[action]();
  await notifRef.update(patch);

  // Feed the rule-dismiss-rate metric. Sales Coach's guardrail: any
  // rule with a 30d dismiss rate > 30% should auto-disable. We stamp
  // one row per dismissal so the tally is a simple count query.
  if (action === 'dismiss' && data.ruleId) {
    try {
      await adminDb.collection('rule_events').add({
        type: 'dismiss',
        ruleId: data.ruleId,
        notificationId: id,
        by: uid,
        at: new Date().toISOString(),
      });
    } catch {
      // Metric is best-effort — never block the user's dismiss action.
    }
  }

  return NextResponse.json({ success: true, updated: Object.keys(patch) });
}
