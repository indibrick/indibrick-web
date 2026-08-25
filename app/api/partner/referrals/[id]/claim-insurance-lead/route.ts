// First-come-first-served insurance lead claim.
//
// Every mortgage funding creates an insurance opportunity in the
// INSURANCE_INBOX pool (see rules/index.ts RULE_MORTGAGE_TO_INSURANCE).
// Insurance agents get a broadcast notification; whoever clicks Claim
// first wins. Uses a Firestore transaction to guarantee only one agent
// can atomically flip assignedAgentId — later clicks see 409.
//
// This is the mechanic behind Sales Coach's "leads not software" offer
// to insurance agents. They don't pay for the CRM; they pay a 15%
// referral fee on bound premium when they close a claimed lead.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin', 'partner_insurance'] });
  if (!guard.ok) return guard.response;
  const { uid, role, email } = guard.session;

  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const referralId = params.id;
  if (!referralId) return NextResponse.json({ error: 'Missing referral id' }, { status: 400 });

  const refRef = adminDb.collection('referrals').doc(referralId);

  // Transaction: guarantees only one caller can transition
  // INSURANCE_INBOX → their uid. Other concurrent clicks see the flip
  // and return 409.
  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(refRef);
      if (!snap.exists) throw { code: 404, message: 'Not found' };
      const referral = snap.data() || {};

      if (referral.dealType !== 'Insurance') {
        throw { code: 400, message: 'Not an insurance lead' };
      }
      if (referral.assignedAgentId !== 'INSURANCE_INBOX') {
        throw {
          code: 409,
          message: 'Already claimed',
          claimedBy: referral.insuranceClaimedBy || referral.assignedAgentId,
        };
      }

      // Resolve the agent's display name (best-effort; falls back to email).
      let displayName = email || uid.slice(0, 8);
      try {
        const userSnap = await tx.get(adminDb!.collection('users').doc(uid));
        if (userSnap.exists) {
          const u = userSnap.data() || {};
          displayName = u.displayName || u.email || displayName;
        }
      } catch { /* fall through */ }

      const nowIso = new Date().toISOString();
      const patch = {
        assignedAgentId: uid,
        assignedAgentName: displayName,
        insuranceClaimedBy: uid,
        insuranceClaimedAt: nowIso,
        status: 'Contacted',   // Agent has picked it up — move out of "New"
        lastUpdated: nowIso,
        lastUpdatedBy: uid,
        timeline: FieldValue.arrayUnion({
          type: 'system',
          author: 'System',
          content: `📮 Insurance lead claimed by ${displayName}${role === 'admin' ? ' (admin claim)' : ''}.`,
          timestamp: nowIso,
          isSystemMessage: true,
        }),
      };
      tx.update(refRef, patch);

      return { assignedAgentId: uid, assignedAgentName: displayName };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    if (e && typeof e.code === 'number') {
      return NextResponse.json(
        { error: e.message, ...(e.claimedBy ? { claimedBy: e.claimedBy } : {}) },
        { status: e.code },
      );
    }
    console.error('[claim-insurance-lead] error', e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
