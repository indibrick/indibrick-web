// Single-template CRUD — GET / PATCH / DELETE (soft archive).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateTemplate } from '@/lib/emailTemplateShape';

const PATCHABLE = new Set(['name', 'category', 'channel', 'subject', 'body']);

async function loadForOwner(id: string, uid: string, role: string) {
  if (!adminDb) return { error: 'No DB' as const, status: 500 };
  const snap = await adminDb.collection('email_templates').doc(id).get();
  if (!snap.exists) return { error: 'Not found' as const, status: 404 };
  const data = snap.data() || {};
  if (data.ownerUid !== uid && role !== 'admin') return { error: 'Forbidden' as const, status: 403 };
  return { ref: snap.ref, data };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const res = await loadForOwner(params.id, guard.session.uid, guard.session.role);
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: res.status });
  return NextResponse.json({ template: { id: params.id, ...res.data } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const res = await loadForOwner(params.id, guard.session.uid, guard.session.role);
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: res.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const merged = { ...res.data, ...body };
  const errors = validateTemplate(merged);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const patch: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
  for (const k of Object.keys(body)) if (PATCHABLE.has(k)) patch[k] = body[k];
  await res.ref.update(patch);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const res = await loadForOwner(params.id, guard.session.uid, guard.session.role);
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: res.status });
  await res.ref.update({ archivedAt: new Date().toISOString(), updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ success: true });
}
