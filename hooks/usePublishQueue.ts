'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedFetch, authedGet } from '../lib/apiClient';

export function usePublishQueue(statusFilter?: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = statusFilter ? `?status=${statusFilter}` : '';
    authedGet(`/api/admin/seo-os/publish-queue${qs}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [statusFilter, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const enqueue = useCallback(async (contentId: string, destinations: string[]) => {
    const res = await authedFetch('/api/admin/seo-os/publish-queue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, destinations }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error };
    refresh();
    return { ok: true, ...data };
  }, [refresh]);

  const publishNow = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/admin/seo-os/publish-queue/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error };
    refresh();
    return { ok: true, ...data };
  }, [refresh]);

  const patch = useCallback(async (id: string, p: Record<string, any>) => {
    const res = await authedFetch(`/api/admin/seo-os/publish-queue/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/admin/seo-os/publish-queue/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  return { items, loading, error, refresh, enqueue, publishNow, patch, remove };
}
