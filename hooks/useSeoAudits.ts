'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedFetch, authedGet } from '../lib/apiClient';

export function useSeoAudits() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    authedGet('/api/admin/seo-os/audits')
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const runAudit = useCallback(async (url: string, skipAeo = false) => {
    const res = await authedFetch('/api/admin/seo-os/audits/run', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, skipAeo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || `HTTP ${res.status}` };
    refresh();
    return { ok: true, result: data.result, auditId: data.auditId };
  }, [refresh]);

  return { items, loading, error, refresh, runAudit };
}
