import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';

const ALLOWED_STATUSES = ['new', 'approved', 'rejected', 'contacted', 'landed'];
const EDITABLE = new Set(['reviewStatus', 'reviewerNotes', 'contactedAt', 'landedAt', 'landedBacklinkUrl']);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (EDITABLE.has(k)) clean[k] = v;
  }
  if (clean.reviewStatus && !ALLOWED_STATUSES.includes(clean.reviewStatus)) {
    return NextResponse.json({ error: 'Invalid reviewStatus' }, { status: 400 });
  }
  if (clean.reviewStatus === 'contacted' && !clean.contactedAt) clean.contactedAt = new Date().toISOString();
  if (clean.reviewStatus === 'landed' && !clean.landedAt) clean.landedAt = new Date().toISOString();

  clean.updatedAt = FieldValue.serverTimestamp();
  await adminDb.collection('backlinkTargets').doc(params.id).update(clean);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  await adminDb.collection('backlinkTargets').doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
