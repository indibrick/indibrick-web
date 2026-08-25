import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateQuery } from '@/lib/aiCitationQueryShape';

const EDITABLE = new Set(['query', 'label', 'category', 'isActive', 'enabledEngines']);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(patch)) if (EDITABLE.has(k)) clean[k] = v;

  // Validate merged shape when any field that participates in validation changed.
  const snap = await adminDb.collection('aiCitationQueries').doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const merged = { ...(snap.data() || {}), ...clean };
  const errors = validateQuery(merged);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  clean.updatedAt = FieldValue.serverTimestamp();
  await adminDb.collection('aiCitationQueries').doc(params.id).update(clean);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  await adminDb.collection('aiCitationQueries').doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
