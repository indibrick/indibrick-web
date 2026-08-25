// SEO calendar — list + create manual item.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateCalendarItem } from '@/lib/seoCalendarShape';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  let q: FirebaseFirestore.Query = adminDb.collection('seoCalendar')
    .orderBy('scheduledDate', 'asc').limit(1000);
  if (from) q = q.where('scheduledDate', '>=', from);
  if (to)   q = q.where('scheduledDate', '<=', to);
  if (type) q = q.where('type', '==', type);
  if (status) q = q.where('status', '==', status);

  const snap = await q.get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const doc: Record<string, any> = {
    type: body.type,
    status: 'pending',
    source: 'manual',
    scheduledDate: body.scheduledDate,
    title: String(body.title || '').slice(0, 240),
    brief: body.brief ? String(body.brief).slice(0, 2000) : '',
    target: body.target || undefined,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    tenantId: 'indibrick',
  };

  const errors = validateCalendarItem(doc);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const ref = await adminDb.collection('seoCalendar').add(doc);
  return NextResponse.json({ id: ref.id, ...doc });
}
