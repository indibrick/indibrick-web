// List recent audit runs.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('seoAudits')
    .orderBy('runAt', 'desc').limit(200).get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
}
