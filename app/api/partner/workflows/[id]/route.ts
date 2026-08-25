// Workflow single-doc CRUD.
//
// PATCH accepts the same shape as POST minus timestamps. Used by both
// the full editor save and the enable/disable toggle in the list view.
//
// DELETE is soft-safe — we set enabled:false rather than hard-delete
// so the audit trail on /rule_events stays queryable. Hard delete
// available via ?hard=true (admin only, defense-in-depth).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateWorkflow } from '@/lib/workflowShape';

const PATCHABLE_FIELDS = new Set([
  'name', 'description', 'enabled',
  'triggerType', 'triggerConfig',
  'conditions', 'actions',
  'debounceMinutes', 'dailyBucket',
]);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin', 'internal_agent'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('workflows').doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ workflow: { id: snap.id, ...snap.data() } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  // If this is a full edit (all core fields present), revalidate.
  // If it's just a toggle (only enabled changing), skip the full pass.
  const isFullEdit = 'triggerType' in body || 'actions' in body || 'conditions' in body;
  if (isFullEdit) {
    const errors = validateWorkflow(body);
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });
  }

  const patch: Record<string, any> = {
    updatedAt: FieldValue.serverTimestamp(),
    lastUpdatedBy: uid,
  };
  for (const key of Object.keys(body)) {
    if (PATCHABLE_FIELDS.has(key)) patch[key] = body[key];
  }

  await adminDb.collection('workflows').doc(params.id).update(patch);
  return NextResponse.json({ success: true, updated: Object.keys(patch) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const hard = searchParams.get('hard') === 'true';
  const ref = adminDb.collection('workflows').doc(params.id);
  if (hard) {
    await ref.delete();
    return NextResponse.json({ success: true, deleted: 'hard' });
  }
  await ref.update({
    enabled: false,
    archivedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true, deleted: 'soft' });
}
