// Read / update / delete a single content doc.
//
// Status transitions (client-side):
//   draft → in_review → approved → published
// PATCH allow-list gates which fields can be updated from the UI; a
// content doc that's `published` is read-only except for
// re-generation which spawns a fresh draft (that path lives on POST /content).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateSeoContent, type SeoContentStatus } from '@/lib/seoContentShape';

const EDITABLE_FIELDS = new Set([
  'title', 'slug', 'excerpt', 'bodyHtml', 'kind', 'target', 'status',
]);

const VALID_STATUSES: SeoContentStatus[] = ['draft', 'in_review', 'approved', 'published'];

// Status is only allowed to move forward or back to 'draft' from
// in_review. Published items lock. This mirrors the "no autonomous
// publish, human review gate" rule from the work order.
const ALLOWED_TRANSITIONS: Record<SeoContentStatus, SeoContentStatus[]> = {
  draft:     ['in_review', 'draft'],
  in_review: ['approved', 'draft', 'in_review'],
  approved:  ['published', 'in_review', 'approved'],
  published: ['published'], // terminal from the UI's perspective
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('seoContent').doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ id: snap.id, ...snap.data() });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return NextResponse.json({ error: 'Body must be a JSON object.' }, { status: 400 });
  }

  const snap = await adminDb.collection('seoContent').doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const current = snap.data() || {};

  const clean: Record<string, any> = {};
  const rejected: string[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!EDITABLE_FIELDS.has(k)) { rejected.push(k); continue; }
    clean[k] = v;
  }
  if (Object.keys(clean).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided.', rejected }, { status: 400 });
  }

  // Status transition validation.
  if ('status' in clean) {
    const next = clean.status as SeoContentStatus;
    if (!VALID_STATUSES.includes(next)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    const from = (current.status || 'draft') as SeoContentStatus;
    if (!ALLOWED_TRANSITIONS[from].includes(next)) {
      return NextResponse.json({
        error: `Cannot move from ${from} → ${next}.`,
      }, { status: 400 });
    }
    if (next === 'approved') {
      clean.approvedBy = uid;
      clean.approvedAt = new Date().toISOString();
    }
    if (next === 'in_review') {
      clean.reviewedBy = uid;
    }
  }

  // Editing the article body when it's already published would silently
  // republish stale content — reject.
  if (current.status === 'published' && ('bodyHtml' in clean || 'title' in clean || 'slug' in clean)) {
    return NextResponse.json({
      error: 'Published content is read-only. Duplicate it as a new draft to edit.',
    }, { status: 409 });
  }

  // Validate the merged doc — catches invalid slugs, oversized fields.
  const merged = { ...current, ...clean };
  const errors = validateSeoContent(merged);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  clean.updatedAt = FieldValue.serverTimestamp();
  await adminDb.collection('seoContent').doc(params.id).update(clean);
  return NextResponse.json({ ok: true, rejected });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('seoContent').doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const status = (snap.data() as any)?.status;
  if (status === 'published') {
    return NextResponse.json({
      error: 'Published content cannot be deleted through this route (would break live URLs).',
    }, { status: 409 });
  }
  await snap.ref.delete();
  return NextResponse.json({ ok: true });
}
