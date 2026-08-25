'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedFetch, authedGet } from '../lib/apiClient';

export function useBacklinks(opts: { status?: string; minScore?: number } = {}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (opts.status) qs.set('status', opts.status);
    if (opts.minScore) qs.set('minScore', String(opts.minScore));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    authedGet(`/api/admin/seo-os/backlinks${q}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [opts.status, opts.minScore, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const discover = useCallback(async (input: { ourUrl: string; topic: string; maxProspects?: number }) => {
    const res = await authedFetch('/api/admin/seo-os/backlinks/discover', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error };
    refresh();
    return { ok: true, ...data };
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Record<string, any>) => {
    const res = await authedFetch(`/api/admin/seo-os/backlinks/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/admin/seo-os/backlinks/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  return { items, loading, error, refresh, discover, update, remove };
}
