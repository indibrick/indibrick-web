// Publish queue — list + enqueue.
//
// Enqueuing requires the underlying content to be `approved` (or
// already `published` — re-enqueue lets you refresh a native post).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';

const ALLOWED_DESTINATIONS = new Set(['native', 'gbp']);

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let q: FirebaseFirestore.Query = adminDb.collection('publishQueue')
    .orderBy('updatedAt', 'desc').limit(500);
  if (status) q = q.where('status', '==', status);

  const snap = await q.get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid, email } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  const contentId = String(body?.contentId || '');
  const destinations: string[] = Array.isArray(body?.destinations)
    ? body.destinations.map((s: any) => String(s)).filter((d: string) => ALLOWED_DESTINATIONS.has(d))
    : [];
  if (!contentId) return NextResponse.json({ error: 'contentId required' }, { status: 400 });
  if (destinations.length === 0) return NextResponse.json({ error: 'destinations required' }, { status: 400 });

  const contentSnap = await adminDb.collection('seoContent').doc(contentId).get();
  if (!contentSnap.exists) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  const content = contentSnap.data() as any;
  if (content.status !== 'approved' && content.status !== 'published') {
    return NextResponse.json({
      error: `Content must be approved to enqueue (currently ${content.status}).`,
    }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const writtenIds: string[] = [];
  const skipped: Array<{ destination: string; reason: string }> = [];

  for (const destination of destinations) {
    // Dedupe: if there's already a pending / publishing row for this
    // (content, destination), skip so a double-click doesn't enqueue twice.
    const dupSnap = await adminDb.collection('publishQueue')
      .where('contentId', '==', contentId)
      .where('destination', '==', destination)
      .where('status', 'in', ['pending', 'publishing'])
      .limit(1).get();
    if (!dupSnap.empty) {
      skipped.push({ destination, reason: 'Already queued (or publishing) for this destination.' });
      continue;
    }

    const doc = {
      contentId,
      destination,
      destinationConfig: {
        // Placeholder for Phase 2 revised: native + gbp don't need per-site
        // config, so no credentialId. Kept nullable so the shape stays
        // consistent with the WP/Shopify future.
        integrationCredentialId: null,
      },
      status: 'pending',
      approvedBy: uid,
      approvedByEmail: email,
      approvedAt: nowIso,
      publishedUrl: null,
      publishedAt: null,
      destinationRemoteId: null,
      failedAt: null,
      failReason: null,
      retryCount: 0,
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      tenantId: 'indibrick',
    };
    const ref = await adminDb.collection('publishQueue').add(doc);
    writtenIds.push(ref.id);
  }

  return NextResponse.json({
    enqueued: writtenIds.length,
    ids: writtenIds,
    skipped,
  });
}
