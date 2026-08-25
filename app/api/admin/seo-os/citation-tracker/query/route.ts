// Tracked-query CRUD — list + create.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateQuery, type AiCitationQueryDoc } from '@/lib/aiCitationQueryShape';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const snap = await adminDb.collection('aiCitationQueries')
    .orderBy('createdAt', 'desc').limit(200).get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const doc: Partial<AiCitationQueryDoc> = {
    query: String(body.query || '').trim(),
    label: body.label ? String(body.label).slice(0, 120) : undefined,
    category: body.category,
    isActive: body.isActive !== false,
    enabledEngines: Array.isArray(body.enabledEngines) ? body.enabledEngines : [],
  };
  const errors = validateQuery(doc);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const full = {
    ...doc,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    tenantId: 'indibrick',
  };
  const ref = await adminDb.collection('aiCitationQueries').add(full);
  return NextResponse.json({ id: ref.id, ...full });
}
