// Single-form CRUD — PATCH + soft DELETE.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateForm } from '@/lib/formShape';

const PATCHABLE = new Set([
  'name', 'headline', 'subheadline', 'submitLabel', 'successMessage',
  'enabled', 'fields', 'autoTag', 'dealType', 'redirectUrl', 'notifyEmails',
  'dedupePolicy',
  'requireCaptcha',
  // Slug intentionally NOT patchable — that would break embedded /f/{slug} URLs.
]);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin', 'internal_agent'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('forms').doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ form: { id: snap.id, ...snap.data() } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  // Only revalidate when fields changed materially.
  if ('fields' in body || 'name' in body) {
    const snap = await adminDb.collection('forms').doc(params.id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const merged = { ...snap.data(), ...body };
    const errors = validateForm(merged);
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });
  }

  const patch: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
  for (const k of Object.keys(body)) if (PATCHABLE.has(k)) patch[k] = body[k];
  await adminDb.collection('forms').doc(params.id).update(patch);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  await adminDb.collection('forms').doc(params.id).update({
    enabled: false,
    archivedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true });
}
