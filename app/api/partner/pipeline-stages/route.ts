// Custom pipeline stages per user.
//
// A user can override the role-hardcoded stage list with their own
// vocabulary. Realtors especially — kvCORE ships with "Lead / Nurture
// / Under Contract / Sold" while we default to something more
// mortgage-brokerage-flavored. Rather than force a rename debate,
// each user gets their own list stored on /users/{uid}.customStages.
//
// GET  — returns { stages: string[] | null }
// PUT  — saves the stages array. Empty array = "clear override" and
//        the client falls back to the role default.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';

const MAX_STAGES = 15;
const MAX_LEN = 40;

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('users').doc(uid).get();
  const data = snap.exists ? (snap.data() || {}) : {};
  const stages = Array.isArray(data.customStages) ? data.customStages : null;
  return NextResponse.json({ stages });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.stages)) {
    return NextResponse.json({ error: 'stages must be an array of strings' }, { status: 400 });
  }
  const clean = body.stages
    .map((s: any) => String(s || '').trim())
    .filter((s: string) => s.length > 0 && s.length <= MAX_LEN);
  const deduped = Array.from(new Set(clean));
  if (deduped.length > MAX_STAGES) {
    return NextResponse.json({ error: `Max ${MAX_STAGES} stages` }, { status: 400 });
  }

  // Empty array = clear the override.
  const patch: Record<string, any> = deduped.length === 0
    ? { customStages: FieldValue.delete() }
    : { customStages: deduped };

  await adminDb.collection('users').doc(uid).set(patch, { merge: true });
  return NextResponse.json({ success: true, stages: deduped.length === 0 ? null : deduped });
}
