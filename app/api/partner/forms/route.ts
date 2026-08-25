// Form CRUD — list + create.
// Admin-only in Wave 2 (same policy as /workflows).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateForm } from '@/lib/formShape';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin', 'internal_agent'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('forms').orderBy('updatedAt', 'desc').limit(200).get();
  const forms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ forms });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const errors = validateForm(body);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  // Slug uniqueness — the public /f/{slug} route resolves by slug.
  const existing = await adminDb.collection('forms').where('slug', '==', body.slug).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ errors: [`Slug "${body.slug}" is already in use.`] }, { status: 409 });
  }

  const doc = {
    slug: String(body.slug),
    name: String(body.name).trim().slice(0, 120),
    headline: String(body.headline || '').slice(0, 300),
    subheadline: String(body.subheadline || '').slice(0, 500),
    submitLabel: String(body.submitLabel || 'Submit'),
    successMessage: String(body.successMessage || 'Thanks — we\'ll be in touch shortly.'),
    enabled: body.enabled !== false,
    fields: Array.isArray(body.fields) ? body.fields : [],
    autoTag: body.autoTag ? String(body.autoTag).slice(0, 60) : null,
    dealType: body.dealType || 'Mortgage',
    redirectUrl: body.redirectUrl ? String(body.redirectUrl).slice(0, 500) : null,
    notifyEmails: Array.isArray(body.notifyEmails) ? body.notifyEmails.slice(0, 5) : [],
    dedupePolicy: ['append', 'skip', 'always_create'].includes(body.dedupePolicy) ? body.dedupePolicy : 'append',
    requireCaptcha: body.requireCaptcha === true,
    submitCount: 0,
    lastSubmitAt: null,
    ownerUid: uid,
    tenantId: 'indibrick',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await adminDb.collection('forms').add(doc);
  return NextResponse.json({ success: true, id: ref.id, slug: doc.slug });
}
