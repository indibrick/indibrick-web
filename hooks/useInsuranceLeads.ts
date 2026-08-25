// Live subscriptions to insurance-typed referrals.
//
// Two views are exposed:
//   claimable   — dealType=Insurance + assignedAgentId=INSURANCE_INBOX
//                 (the shared pool any insurance agent can claim)
//   mine        — dealType=Insurance + assignedAgentId=<current uid>
//                 (this agent's book of business)
//
// Firestore rules restrict reads by participant/assignee anyway; these
// queries just mirror the same shape so admins see the pool + their own
// simultaneously without extra permission logic.

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { authedPost } from '../lib/apiClient';

export interface InsuranceLead {
  id: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  status?: string;
  dealType?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  insuranceCarrier?: string;
  insurancePolicyNumber?: string;
  insurancePremiumAnnual?: number;
  insuranceCoverageType?: string;
  insuranceEffectiveDate?: string;
  insuranceRenewalDate?: string;
  insuranceBoundAt?: string;
  insuranceClaimedBy?: string;
  insuranceClaimedAt?: string;
  insuranceOpportunityFrom?: string;
  referralDate?: string;
  notes?: string;
}

interface UseInsuranceLeadsResult {
  claimable: InsuranceLead[];
  mine: InsuranceLead[];
  loading: boolean;
  claim: (id: string) => Promise<{ ok: boolean; error?: string; claimedBy?: string }>;
}

export function useInsuranceLeads(currentUid: string | undefined): UseInsuranceLeadsResult {
  const [claimable, setClaimable] = useState<InsuranceLead[]>([]);
  const [mine, setMine] = useState<InsuranceLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) {
      setClaimable([]);
      setMine([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const claimableQ = query(
      collection(db, 'referrals'),
      where('dealType', '==', 'Insurance'),
      where('assignedAgentId', '==', 'INSURANCE_INBOX'),
      orderBy('referralDate', 'desc'),
      limit(100),
    );
    const mineQ = query(
      collection(db, 'referrals'),
      where('dealType', '==', 'Insurance'),
      where('assignedAgentId', '==', currentUid),
      orderBy('referralDate', 'desc'),
      limit(200),
    );

    let claimReady = false, mineReady = false;
    const maybeDone = () => { if (claimReady && mineReady) setLoading(false); };

    const un1 = onSnapshot(claimableQ, snap => {
      setClaimable(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      claimReady = true; maybeDone();
    }, err => { console.error('[useInsuranceLeads:claimable]', err); claimReady = true; maybeDone(); });

    const un2 = onSnapshot(mineQ, snap => {
      setMine(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      mineReady = true; maybeDone();
    }, err => { console.error('[useInsuranceLeads:mine]', err); mineReady = true; maybeDone(); });

    return () => { un1(); un2(); };
  }, [currentUid]);

  const claim = async (id: string) => {
    try {
      const res = await authedPost(`/api/partner/referrals/${id}/claim-insurance-lead`, {});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}`, claimedBy: data.claimedBy };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error' };
    }
  };

  return { claimable, mine, loading, claim };
}
