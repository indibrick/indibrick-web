// Email/SMS template CRUD — GET (list) + POST (create).
// Per-user scope: signed-in users see their own templates. Admins see all.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateTemplate } from '@/lib/emailTemplateShape';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const q = role === 'admin'
    ? adminDb.collection('email_templates').orderBy('updatedAt', 'desc').limit(200)
    : adminDb.collection('email_templates').where('ownerUid', '==', uid).orderBy('updatedAt', 'desc').limit(200);

  const snap = await q.get();
  const templates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const errors = validateTemplate(body);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const doc = {
    name: String(body.name).trim().slice(0, 120),
    category: body.category,
    channel: body.channel,
    subject: body.channel === 'email' ? String(body.subject || '').slice(0, 200) : null,
    body: String(body.body || ''),
    ownerUid: uid,
    tenantId: 'indibrick',
    usageCount: 0,
    lastUsedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await adminDb.collection('email_templates').add(doc);
  return NextResponse.json({ success: true, id: ref.id });
}
