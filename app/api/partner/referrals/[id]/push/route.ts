// Realtor "push for mortgage" action.
//
// A realtor's own deals are private-by-default in Phase 4. This
// dedicated endpoint is how a realtor opts a deal into the brokerage:
//   1. Sets pushedForMortgage: true + audit stamps
//   2. Adds a timeline entry attributing the push to the realtor
//   3. Sets assignedAgentId → ADMIN_INBOX so an admin can route it
//   4. The onReferralWrite trigger picks up the transition and the new
//      RULE_MORTGAGE_PUSH rule (rules/index.ts) notifies admins.
//
// Separate from the free-form PATCH endpoint because push is an
// important workflow inflection — we want to hard-enforce the
// participant-check + owner attribution, not rely on the generic
// field-allowlist path.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { resolveTeamVisibleUids, isReferralVisibleToTeam } from '@/lib/teamVisibility';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;

  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const referralId = params.id;
  if (!referralId) return NextResponse.json({ error: 'Missing referral id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const note: string | undefined = typeof body?.note === 'string' ? body.note : undefined;

  const refRef = adminDb.collection('referrals').doc(referralId);
  const snap = await refRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
  const referral = snap.data() || {};

  // Only the referral's owner (referrer / assignee / participant) or
  // a teammate of the owner can push.
  let isOnReferral =
    referral.referrerId === uid ||
    referral.assignedAgentId === uid ||
    (Array.isArray(referral.participantIds) && referral.participantIds.includes(uid));
  if (!isOnReferral) {
    const teamUids = await resolveTeamVisibleUids(uid);
    isOnReferral = isReferralVisibleToTeam(uid, teamUids, referral as any);
  }
  if (!isOnReferral) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (referral.pushedForMortgage === true) {
    return NextResponse.json({ error: 'Already pushed' }, { status: 409 });
  }

  const nowIso = new Date().toISOString();
  const timelineEntry: Record<string, any> = {
    type: 'system',
    author: 'System',
    content: `📬 Pushed to IndiBrick brokerage for mortgage${note ? ` — "${note.slice(0, 200)}"` : ''}.`,
    timestamp: nowIso,
    isSystemMessage: true,
  };

  const patch: Record<string, any> = {
    pushedForMortgage: true,
    pushedForMortgageAt: nowIso,
    pushedForMortgageBy: uid,
    lastUpdated: nowIso,
    lastUpdatedBy: uid,
    timeline: FieldValue.arrayUnion(timelineEntry),
  };

  // If the deal is still owned by the realtor with no broker assigned,
  // route it into the admin inbox so a broker picks it up. We preserve
  // the referrer identity so we can attribute the deal + pay commission
  // back to the realtor if it funds.
  if (!referral.assignedAgentId || referral.assignedAgentId === uid) {
    patch.assignedAgentId = 'ADMIN_INBOX';
  }

  await refRef.update(patch);

  return NextResponse.json({
    success: true,
    pushedAt: nowIso,
    assignedTo: patch.assignedAgentId || referral.assignedAgentId,
  });
}
