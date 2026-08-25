// Server-side write proxy for the referrals collection.
//
// Motivation: the partner UI has ~15 client-side updateDoc(doc(db,
// 'referrals', id), …) call sites. The new firestore.rules field-lock
// blocks unauthorized fields, but centralizing the write path here has
// three benefits:
//   1. The audit trail — every mutation goes through one handler that
//      logs uid + diff to copilot_events.
//   2. Ownership fields (referrerId, assignedAgentId, leadId,
//      participantIds, clientEmail) can be changed by admins only,
//      never by clients.
//   3. When we add the rules engine (Phase 2), all trigger-worthy
//      writes flow through here so onReferralWrite can rely on a stable
//      set of shapes.
//
// This endpoint is available now; client callers can migrate to it
// gradually. The Firestore rules already prevent the worst abuses even
// when the write comes from the client SDK.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { resolveTeamVisibleUids, isReferralVisibleToTeam } from '@/lib/teamVisibility';

// Fields any authenticated participant/assignee on a referral may set.
// Ownership + identity fields are excluded — those live in ADMIN_ONLY.
const PARTICIPANT_WRITE_FIELDS = new Set<string>([
  'status',
  'notes',
  'timeline',
  'callCount',
  'leadTag',
  'dealCategory',
  'dealType',                 // Mortgage | Real Estate | Legal — set when the deal is intake'd
  'dealSummary',
  'loanAmount',
  'expectedCommission',
  'lastTouchedAt',
  'lastUpdated',
  'clientName',
  'clientPhone',
  'requiredDocuments',
  'pushedForMortgage',        // Realtor opt-in to share a private deal with the brokerage
  'pushedForMortgageAt',
  'pushedForMortgageBy',
  // Phase 5 — Insurance
  'insuranceCarrier',
  'insurancePolicyNumber',
  'insurancePremiumAnnual',
  'insuranceCoverageType',
  'insuranceEffectiveDate',
  'insuranceRenewalDate',
  'insuranceBoundAt',
  'insuranceClaimedBy',
  'insuranceClaimedAt',
  // Wave A — user-defined per-deal custom field bag. Values only;
  // the field definitions themselves live on /users/{uid}.customDealFields.
  'customFields',
  // Wave E-4 — attribution bag (UTM + referrer + landing page).
  'attribution',
]);

const ADMIN_ONLY_FIELDS = new Set<string>([
  'referrerId',
  'assignedAgentId',
  'assignedAgentName',
  'participantIds',
  'participants',
  'leadId',
  'clientEmail',
]);

function isOnReferralDirect(uid: string, doc: FirebaseFirestore.DocumentData): boolean {
  if (doc.referrerId === uid) return true;
  if (doc.assignedAgentId === uid) return true;
  if (Array.isArray(doc.participantIds) && doc.participantIds.includes(uid)) return true;
  return false;
}

// Special fields that carry FieldValue sentinels (arrayUnion, etc.).
// The payload uses `{ __arrayUnion: [...] }` to opt into the server-side
// mutation without shipping the sentinel over the wire.
function coerceFieldValues(value: any): any {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('__arrayUnion' in value && Array.isArray(value.__arrayUnion)) {
      return FieldValue.arrayUnion(...value.__arrayUnion);
    }
    if ('__arrayRemove' in value && Array.isArray(value.__arrayRemove)) {
      return FieldValue.arrayRemove(...value.__arrayRemove);
    }
    if ('__serverTimestamp' in value) {
      return FieldValue.serverTimestamp();
    }
    if ('__increment' in value && typeof value.__increment === 'number') {
      return FieldValue.increment(value.__increment);
    }
  }
  return value;
}

async function auditWrite(
  uid: string,
  referralId: string,
  before: Record<string, any>,
  patch: Record<string, any>,
) {
  if (!adminDb) return;
  const changedKeys = Object.keys(patch);
  try {
    await adminDb.collection('copilot_events').add({
      type: 'referral_patch',
      uid,
      referralId,
      changedKeys,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Audit best-effort.
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;

  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const referralId = params.id;
  if (!referralId) return NextResponse.json({ error: 'Missing referral id' }, { status: 400 });

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return NextResponse.json({ error: 'Body must be a JSON object of fields to update' }, { status: 400 });
  }

  const refRef = adminDb.collection('referrals').doc(referralId);
  const snap = await refRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
  }
  const before = snap.data() || {};

  // Access check: caller must be on the referral directly, on the
  // same team as the referral's owner, or admin.
  if (role !== 'admin') {
    let allowed = isOnReferralDirect(uid, before);
    if (!allowed) {
      const teamUids = await resolveTeamVisibleUids(uid);
      allowed = isReferralVisibleToTeam(uid, teamUids, before as any);
    }
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Field allow-list check.
  const cleaned: Record<string, any> = {};
  const rejected: string[] = [];
  for (const [key, rawValue] of Object.entries(patch)) {
    if (PARTICIPANT_WRITE_FIELDS.has(key)) {
      cleaned[key] = coerceFieldValues(rawValue);
    } else if (ADMIN_ONLY_FIELDS.has(key)) {
      if (role === 'admin') {
        cleaned[key] = coerceFieldValues(rawValue);
      } else {
        rejected.push(key);
      }
    } else {
      rejected.push(key);
    }
  }

  if (rejected.length > 0 && Object.keys(cleaned).length === 0) {
    return NextResponse.json(
      { error: 'All fields rejected', rejected },
      { status: 400 },
    );
  }

  // Stamp who + when.
  cleaned.lastUpdatedBy = uid;
  cleaned.lastUpdated = new Date().toISOString();

  await refRef.update(cleaned);
  await auditWrite(uid, referralId, before, cleaned);

  return NextResponse.json({
    success: true,
    updated: Object.keys(cleaned),
    rejected,
  });
}
