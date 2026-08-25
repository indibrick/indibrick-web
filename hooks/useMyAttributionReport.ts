// Client-facing report — partner fetches their OWN attribution
// rollup. Uses the same /report endpoint as the admin view, now that
// self-access is allowed.

import { useEffect, useState } from 'react';
import { authedGet } from '../lib/apiClient';
import type { ManagedAdsReport } from './useManagedAdsClients';

export function useMyAttributionReport(uid: string | null | undefined) {
  const [report, setReport] = useState<ManagedAdsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    authedGet(`/api/partner/managed-ads/${encodeURIComponent(uid)}/report`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setReport(data as ManagedAdsReport);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load report.'))
      .finally(() => setLoading(false));
  }, [uid]);

  return { report, loading, error };
}
