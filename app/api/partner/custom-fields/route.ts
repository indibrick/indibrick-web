// Custom deal field DEFINITIONS — GET + PUT of the current user's
// customDealFields array. Values on referrals go through the standard
// referrals PATCH endpoint (customFields is in its allowlist).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateCustomFields, type CustomFieldDef } from '@/lib/customFieldsShape';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('users').doc(uid).get();
  const data = snap.exists ? (snap.data() || {}) : {};
  const defs: CustomFieldDef[] = Array.isArray(data.customDealFields) ? data.customDealFields : [];
  return NextResponse.json({ defs });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.defs)) {
    return NextResponse.json({ error: 'defs must be an array' }, { status: 400 });
  }
  const { defs, errors } = validateCustomFields(body.defs);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const patch: Record<string, any> = defs.length === 0
    ? { customDealFields: FieldValue.delete() }
    : { customDealFields: defs };
  await adminDb.collection('users').doc(uid).set(patch, { merge: true });
  return NextResponse.json({ success: true, defs });
}
