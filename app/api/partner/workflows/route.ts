// Workflows API — list + create.
//
// Admin-only in Wave 2 while we harden the interpreter. Later waves
// expand to team-owner authoring under tenant scope.
//
// On create/update we pre-validate against the shared shape (used by
// the editor UI too), reject early on obvious errors, and stamp
// author + timestamps.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateWorkflow } from '@/lib/workflowShape';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin', 'internal_agent'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  try {
    const snap = await adminDb.collection('workflows')
      .orderBy('updatedAt', 'desc')
      .limit(200)
      .get();
    const workflows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ workflows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'list failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const errors = validateWorkflow(body);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const doc: Record<string, any> = {
    name: String(body.name).trim().slice(0, 120),
    description: body.description ? String(body.description).slice(0, 500) : '',
    enabled: body.enabled !== false,
    triggerType: body.triggerType,
    triggerConfig: body.triggerConfig || {},
    conditions: Array.isArray(body.conditions) ? body.conditions : [],
    actions: Array.isArray(body.actions) ? body.actions : [],
    debounceMinutes: Math.max(0, Math.min(1440, Number(body.debounceMinutes || 0))),
    dailyBucket: body.dailyBucket === true,
    ownerUid: uid,
    tenantId: 'indibrick',
    firedCount: 0,
    errorCount: 0,
    lastFiredAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await adminDb.collection('workflows').add(doc);
  return NextResponse.json({ success: true, id: ref.id });
}
