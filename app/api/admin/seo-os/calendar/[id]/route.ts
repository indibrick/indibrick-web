// Calendar item — update / delete.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';

const EDITABLE = new Set(['status', 'title', 'brief', 'scheduledDate', 'type', 'target']);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (EDITABLE.has(k)) clean[k] = v;
  }
  if (Object.keys(clean).length === 0) return NextResponse.json({ error: 'No editable fields' }, { status: 400 });

  if (clean.status === 'completed') {
    clean.completedAt = new Date().toISOString();
    clean.completedBy = uid;
  }
  clean.updatedAt = FieldValue.serverTimestamp();

  await adminDb.collection('seoCalendar').doc(params.id).update(clean);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  await adminDb.collection('seoCalendar').doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
