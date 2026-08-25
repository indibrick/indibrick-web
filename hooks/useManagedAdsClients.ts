// Admin fetch of the Managed Ads client roster + per-client reports.
// No live subscription — the roster changes infrequently and reports
// scan up to 5k referrals server-side.

import { useEffect, useState } from 'react';
import { authedGet, authedFetch } from '../lib/apiClient';
import type { ManagedAdsProfile } from '../lib/managedAdsShape';

export interface ManagedAdsClient {
  uid: string;
  email?: string;
  displayName?: string;
  role?: string;
  managedAds: ManagedAdsProfile;
}

export interface AttributionBucket {
  key: string;
  leads: number;
  contacted: number;
  active: number;
  funded: number;
  lost: number;
  fundedValue: number;
  fundedCommission: number;
}

export interface ManagedAdsReport {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  managedAds: ManagedAdsProfile | null;
  summary: AttributionBucket;
  bySource: AttributionBucket[];
  byCampaign: AttributionBucket[];
  trailing30d: {
    leads: number;
    funded: number;
    fundedValue: number;
    monthlyBudget: number;
    costPerLead: number | null;
    costPerFunded: number | null;
  };
  totalReferrals: number;
}

export function useManagedAdsClients() {
  const [clients, setClients] = useState<ManagedAdsClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    authedGet('/api/partner/managed-ads')
      .then(async r => {
        if (!r.ok) return;
        const data = await r.json().catch(() => ({}));
        setClients(Array.isArray(data.clients) ? data.clients : []);
      })
      .finally(() => setLoading(false));
  }, [refreshTick]);

  const refresh = () => setRefreshTick(t => t + 1);

  const upsert = async (uid: string, profile: Partial<ManagedAdsProfile>) => {
    const res = await authedFetch('/api/partner/managed-ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, profile }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'Failed'] };
    refresh();
    return { ok: true };
  };

  const remove = async (uid: string) => {
    const res = await authedFetch(`/api/partner/managed-ads?uid=${encodeURIComponent(uid)}`, { method: 'DELETE' });
    if (res.ok) refresh();
    return { ok: res.ok };
  };

  const fetchReport = async (uid: string): Promise<{ ok: boolean; report?: ManagedAdsReport; error?: string }> => {
    const res = await authedGet(`/api/partner/managed-ads/${encodeURIComponent(uid)}/report`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true, report: data as ManagedAdsReport };
  };

  return { clients, loading, refresh, upsert, remove, fetchReport };
}
