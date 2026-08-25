// Cross-sell flag actions.
//
// Owner can transition Open → Contacted → Converted, or Open → Dismissed.
// Admin can do the same, plus reopen a dismissed flag. Every transition
// stamps a rule_events row so the dismiss-rate metric stays accurate
// (Sales Coach: 30%+ dismiss over 14 days → auto-disable the rule).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Open:      ['Contacted', 'Dismissed'],
  Contacted: ['Converted', 'Dismissed', 'Open'],
  Converted: [],                                 // terminal
  Dismissed: ['Open'],                           // admin can reopen
};

const NOW_STAMPS: Record<string, string> = {
  Contacted: 'contactedAt',
  Converted: 'convertedAt',
  Dismissed: 'dismissedAt',
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;

  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const flagId = params.id;
  if (!flagId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const nextStatus = body?.status;
  const note: string | undefined = typeof body?.note === 'string' ? body.note : undefined;
  if (typeof nextStatus !== 'string' || !(nextStatus in NOW_STAMPS) && nextStatus !== 'Open') {
    return NextResponse.json(
      { error: 'Body must be { status: Contacted | Converted | Dismissed | Open, note?: string }' },
      { status: 400 },
    );
  }

  const flagRef = adminDb.collection('crossSellFlags').doc(flagId);
  const snap = await flagRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const flag = snap.data() || {};

  const isOwner = flag.ownerUid === uid;
  const isAdmin = role === 'admin';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const currentStatus = String(flag.status || 'Open');
  const allowed = STATUS_TRANSITIONS[currentStatus] || [];
  // Admin can reopen from Dismissed even though the table above forbids it for owners.
  if (!allowed.includes(nextStatus) && !(isAdmin && currentStatus === 'Dismissed' && nextStatus === 'Open')) {
    return NextResponse.json(
      { error: `Cannot transition ${currentStatus} → ${nextStatus}` },
      { status: 400 },
    );
  }

  const patch: Record<string, any> = {
    status: nextStatus,
    lastActionBy: uid,
    lastActionAt: new Date().toISOString(),
  };
  if (nextStatus in NOW_STAMPS) patch[NOW_STAMPS[nextStatus]] = new Date().toISOString();
  if (nextStatus === 'Open') {
    // Reopening: clear the terminal-state timestamps + escalation history.
    patch.contactedAt = null;
    patch.convertedAt = null;
    patch.dismissedAt = null;
    patch.lastEscalationLevel = 0;
    patch.lastEscalatedAt = null;
  }
  if (note) patch.actionNote = note.slice(0, 500);

  await flagRef.update(patch);

  // Feed the dismiss-rate metric.
  if (nextStatus === 'Dismissed' && flag.ruleId) {
    try {
      await adminDb.collection('rule_events').add({
        type: 'flag_dismiss',
        ruleId: flag.ruleId,
        crossSellFlagId: flagId,
        by: uid,
        at: new Date().toISOString(),
      });
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ success: true, status: nextStatus });
}
