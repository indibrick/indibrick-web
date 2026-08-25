// Fire the actual publish for a queue item.
//
// Idempotency: if the row is already 'publishing' or 'published',
// refuse. That protects against a double-click during the seconds
// the native publish is in flight.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { dispatchPublish } from '@/lib/publishDispatcher';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { email } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const ref = adminDb.collection('publishQueue').doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
  const item = snap.data() as any;

  if (item.status === 'publishing') {
    return NextResponse.json({ error: 'Already publishing — wait for it to finish.' }, { status: 409 });
  }
  if (item.status === 'published') {
    return NextResponse.json({ error: 'Already published.', publishedUrl: item.publishedUrl }, { status: 409 });
  }
  if (item.status === 'canceled') {
    return NextResponse.json({ error: 'Item was canceled.' }, { status: 409 });
  }

  // Optimistic lock — flip to 'publishing' first. If two clicks race,
  // the second one sees 'publishing' on re-read and 409s above.
  await ref.update({ status: 'publishing', updatedAt: FieldValue.serverTimestamp() });

  const outcome = await dispatchPublish(item.destination, item.contentId, email || null);

  if (outcome.status === 'published') {
    await ref.update({
      status: 'published',
      publishedUrl: outcome.publishedUrl,
      publishedAt: new Date().toISOString(),
      destinationRemoteId: outcome.remoteId,
      failReason: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, publishedUrl: outcome.publishedUrl });
  }
  if (outcome.status === 'ready_for_manual') {
    // Roll status back — GBP items sit "pending" until the operator
    // manually marks them posted after copy-paste.
    await ref.update({
      status: 'pending',
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, manual: true, note: outcome.note });
  }
  // failed
  await ref.update({
    status: 'failed',
    failedAt: new Date().toISOString(),
    failReason: outcome.error,
    retryCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ error: outcome.error }, { status: 500 });
}
