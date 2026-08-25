// Drip sequence CRUD — list + create.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateDripSequence } from '@/lib/dripShape';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const q = role === 'admin'
    ? adminDb.collection('drip_sequences').orderBy('updatedAt', 'desc').limit(200)
    : adminDb.collection('drip_sequences').where('ownerUid', '==', uid).orderBy('updatedAt', 'desc').limit(200);
  const snap = await q.get();
  const sequences = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ sequences });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const errors = validateDripSequence(body);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  // Validate every referenced templateId actually exists + belongs to caller.
  const steps: any[] = body.steps || [];
  const uniqueTemplateIds = Array.from(new Set(steps.map(s => s.templateId).filter(Boolean)));
  for (const tid of uniqueTemplateIds) {
    const t = await adminDb.collection('email_templates').doc(tid).get();
    if (!t.exists) return NextResponse.json({ errors: [`Template ${tid} not found.`] }, { status: 400 });
    const tData = t.data() || {};
    if (tData.ownerUid !== uid) return NextResponse.json({ errors: [`Template ${tid} not owned by you.`] }, { status: 403 });
  }

  const doc = {
    name: String(body.name).trim().slice(0, 120),
    description: body.description ? String(body.description).slice(0, 500) : '',
    enabled: body.enabled !== false,
    ownerUid: uid,
    tenantId: 'indibrick',
    steps: steps.map(s => ({
      templateId: String(s.templateId),
      waitDaysAfterEnroll: Math.max(0, Math.min(365, Number(s.waitDaysAfterEnroll || 0))),
      enabled: s.enabled !== false,
    })),
    respectSuppression: body.respectSuppression !== false,
    stopIfReplies: false, // v1 stub
    enrollmentCount: 0,
    activeRuns: 0,
    completedRuns: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await adminDb.collection('drip_sequences').add(doc);
  return NextResponse.json({ success: true, id: ref.id });
}
