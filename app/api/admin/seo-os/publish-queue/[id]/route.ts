import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';

const EDITABLE = new Set(['status', 'publishedUrl', 'publishedAt', 'destinationRemoteId', 'failReason']);
const ALLOWED_STATUSES = ['pending', 'publishing', 'published', 'failed', 'canceled'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(patch)) if (EDITABLE.has(k)) clean[k] = v;

  if (clean.status && !ALLOWED_STATUSES.includes(clean.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  if (clean.status === 'published' && !clean.publishedAt) clean.publishedAt = new Date().toISOString();
  clean.updatedAt = FieldValue.serverTimestamp();

  await adminDb.collection('publishQueue').doc(params.id).update(clean);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  await adminDb.collection('publishQueue').doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
