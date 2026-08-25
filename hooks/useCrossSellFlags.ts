// Live Firestore subscription to /crossSellFlags.
//
// Owners see their own flags. Admins see everyone's. The Firestore
// rules enforce this — the queries below just mirror what the rules
// would let through, so the "wrong" query returns empty rather than
// permission-error.

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { authedPatch } from '../lib/apiClient';

export type CrossSellStatus = 'Open' | 'Contacted' | 'Converted' | 'Dismissed';

export interface CrossSellFlag {
  id: string;
  sourceReferralId: string;
  ownerUid: string;
  crossSellKind: string;
  summary: string;
  clientName: string;
  loanAmount?: number | null;
  status: CrossSellStatus;
  flaggedAt?: any;
  lastEscalationLevel?: number;
  lastEscalatedAt?: any;
  contactedAt?: string | null;
  convertedAt?: string | null;
  dismissedAt?: string | null;
  lastActionBy?: string;
  actionNote?: string;
  ruleId?: string;
}

interface UseCrossSellFlagsResult {
  flags: CrossSellFlag[];
  openCount: number;
  loading: boolean;
  markContacted: (id: string, note?: string) => Promise<void>;
  markConverted: (id: string, note?: string) => Promise<void>;
  dismiss: (id: string, note?: string) => Promise<void>;
  reopen: (id: string) => Promise<void>;
}

interface UseCrossSellFlagsArgs {
  currentUid: string | undefined;
  isAdmin: boolean;
}

export function useCrossSellFlags({ currentUid, isAdmin }: UseCrossSellFlagsArgs): UseCrossSellFlagsResult {
  const [flags, setFlags] = useState<CrossSellFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) {
      setFlags([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Admins see all Open+Contacted flags across the team. Owners see
    // only their own (any status, so they can review closed history).
    const q = isAdmin
      ? query(collection(db, 'crossSellFlags'), where('status', 'in', ['Open', 'Contacted']), orderBy('flaggedAt', 'desc'))
      : query(collection(db, 'crossSellFlags'), where('ownerUid', '==', currentUid), orderBy('flaggedAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setFlags(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      (err) => {
        console.error('[useCrossSellFlags] subscribe error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [currentUid, isAdmin]);

  const openCount = useMemo(() => flags.filter(f => f.status === 'Open').length, [flags]);

  const patch = async (id: string, status: CrossSellStatus, note?: string) => {
    try {
      await authedPatch(`/api/partner/cross-sell-flags/${id}`, { status, note });
    } catch (e) {
      console.error(`[useCrossSellFlags] ${status} failed`, e);
    }
  };

  return {
    flags,
    openCount,
    loading,
    markContacted: (id, note) => patch(id, 'Contacted', note),
    markConverted: (id, note) => patch(id, 'Converted', note),
    dismiss:       (id, note) => patch(id, 'Dismissed', note),
    reopen:        (id)       => patch(id, 'Open'),
  };
}
