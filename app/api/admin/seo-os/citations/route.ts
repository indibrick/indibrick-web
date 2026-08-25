// Read /aiCitations — supports optional query + engine filter for the
// dashboard charts + snapshot table. Default cap 1000 rows so a big
// history doesn't OOM the client.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const engine = searchParams.get('engine');
  const queryNormalized = searchParams.get('queryNormalized');
  const sinceIso = searchParams.get('since');
  const limit = Math.min(2000, Number(searchParams.get('limit') || 1000));

  let q: FirebaseFirestore.Query = adminDb.collection('aiCitations')
    .orderBy('timestamp', 'desc').limit(limit);
  if (engine) q = q.where('engine', '==', engine);
  if (queryNormalized) q = q.where('queryNormalized', '==', queryNormalized);
  if (sinceIso) q = q.where('timestamp', '>=', sinceIso);

  const snap = await q.get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
}
