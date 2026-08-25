// Mark the current user's onboarding as complete (or skipped).
// Trivial endpoint; kept here for symmetry with the other partner APIs
// and so the endpoint contract stays server-controlled if we later
// want to gate the wizard behind admin approval etc.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const skipped = body?.skipped === true;
  const nowIso = new Date().toISOString();

  await adminDb.collection('users').doc(uid).set(
    skipped ? { onboardingSkippedAt: nowIso } : { onboardingCompletedAt: nowIso },
    { merge: true },
  );

  return NextResponse.json({ success: true });
}
