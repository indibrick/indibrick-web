// List backlink prospects.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const minScore = Number(searchParams.get('minScore') || 0);

  let q: FirebaseFirestore.Query = adminDb.collection('backlinkTargets')
    .orderBy('discoveredAt', 'desc').limit(500);
  if (status) q = q.where('reviewStatus', '==', status);

  const snap = await q.get();
  let items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  if (minScore > 0) items = items.filter(i => (i.topicFitScore || 0) >= minScore);
  return NextResponse.json({ items });
}
