// Managed Ads client roster — admin CRUD.
//
// GET: list every user whose /users/{uid}.managedAds.status is set.
// PUT: set/patch a user's managedAds profile (upsert). Admin only.
//
// Client-side reads are gated via Firestore rules on /users/{uid} —
// partners see their own; admins see all. Writes ALWAYS go through
// this endpoint because pricing state belongs to us, not the partner.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { validateManagedAdsProfile, type ManagedAdsProfile } from '@/lib/managedAdsShape';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  // Firestore doesn't index nested nulls well — filter in-memory.
  const snap = await adminDb.collection('users').limit(500).get();
  const clients = snap.docs
    .map(d => ({ uid: d.id, ...(d.data() as any) }))
    .filter(u => u.managedAds && u.managedAds.tier)
    .map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      managedAds: u.managedAds,
    }));
  return NextResponse.json({ clients });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid: actorUid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  const targetUid: string = String(body?.uid || '');
  if (!targetUid) return NextResponse.json({ error: 'uid required' }, { status: 400 });
  const profile: Partial<ManagedAdsProfile> = body?.profile || {};

  const errors = validateManagedAdsProfile(profile);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  // Confirm target user exists.
  const userRef = adminDb.collection('users').doc(targetUid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

  const existing = userSnap.data()?.managedAds || {};
  const merged: Record<string, any> = {
    tier: profile.tier || existing.tier,
    status: profile.status || existing.status || 'active',
    startedAt: profile.startedAt || existing.startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: actorUid,
  };
  // Firestore Admin SDK throws on `undefined` — only include optional
  // fields when they actually have a value.
  if (profile.endedAt || existing.endedAt) merged.endedAt = profile.endedAt || existing.endedAt;
  if (profile.monthlyRetainer !== undefined || existing.monthlyRetainer !== undefined) {
    merged.monthlyRetainer = profile.monthlyRetainer ?? existing.monthlyRetainer;
  }
  if (profile.monthlyAdBudget !== undefined || existing.monthlyAdBudget !== undefined) {
    merged.monthlyAdBudget = profile.monthlyAdBudget ?? existing.monthlyAdBudget;
  }
  if (profile.brief !== undefined || existing.brief !== undefined) {
    merged.brief = profile.brief ?? existing.brief;
  }
  if (profile.platforms !== undefined || existing.platforms !== undefined) {
    merged.platforms = profile.platforms ?? existing.platforms;
  }
  if (profile.campaignLabels !== undefined || existing.campaignLabels !== undefined) {
    merged.campaignLabels = profile.campaignLabels ?? existing.campaignLabels;
  }

  try {
    await userRef.set({ managedAds: merged }, { merge: true });
  } catch (e: any) {
    console.error('[managed-ads] write failed', e?.message, e?.stack);
    return NextResponse.json({ error: e?.message || 'Write failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true, profile: merged });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const targetUid = String(searchParams.get('uid') || '');
  if (!targetUid) return NextResponse.json({ error: 'uid required' }, { status: 400 });

  // Soft cancel: flip status to churned, don't wipe the profile so
  // reporting history still works.
  await adminDb.collection('users').doc(targetUid).set({
    managedAds: {
      status: 'churned',
      endedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }, { merge: true });
  return NextResponse.json({ success: true });
}
