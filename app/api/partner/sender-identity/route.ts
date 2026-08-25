// Per-partner sender identity CRUD.
//
// GET: return the caller's own identity (or the specified uid if admin).
// PUT: set/patch identity on the caller's user doc.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { validateSenderIdentity } from '@/lib/senderIdentity';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const target = searchParams.get('uid');
  const targetUid = (target && role === 'admin') ? target : uid;

  const snap = await adminDb.collection('users').doc(targetUid).get();
  const data = snap.exists ? (snap.data() || {}) : {};
  return NextResponse.json({
    senderIdentity: data.senderIdentity || null,
    // Convenience: fall back to displayName/email if identity fields empty.
    fallback: {
      displayName: data.displayName || guard.session.email || 'IndiBrick Partner',
      brokerageName: data.brokerageName || '',
      email: data.email || guard.session.email || '',
    },
  });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const errors = validateSenderIdentity(body);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  // Strip any client-supplied verification claim — that flag flips
  // only from the confirmation-click flow, never from this endpoint.
  const { verifiedFromEmail: _drop, verifiedAt: _drop2, ...clean } = body;
  const patch: Record<string, any> = {
    ...clean,
    updatedAt: new Date().toISOString(),
    updatedBy: uid,
  };
  // Changing fromEmail invalidates any prior verification.
  if ('fromEmail' in clean) {
    patch.verifiedFromEmail = false;
    patch.verifiedAt = null;
  }

  await adminDb.collection('users').doc(uid).set({ senderIdentity: patch }, { merge: true });
  return NextResponse.json({ success: true });
}
