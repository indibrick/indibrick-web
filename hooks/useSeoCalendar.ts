'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedFetch, authedGet } from '../lib/apiClient';

export function useSeoCalendar(opts: { from?: string; to?: string; type?: string; status?: string } = {}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (opts.from) qs.set('from', opts.from);
    if (opts.to) qs.set('to', opts.to);
    if (opts.type) qs.set('type', opts.type);
    if (opts.status) qs.set('status', opts.status);
    const q = qs.toString() ? `?${qs.toString()}` : '';
    authedGet(`/api/admin/seo-os/calendar${q}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [opts.from, opts.to, opts.type, opts.status, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const generate = useCallback(async (input: { keywords: string[]; startDate: string; daysCount?: number }) => {
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const res = await authedFetch('/api/admin/seo-os/calendar/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, generationRunId: runId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || `HTTP ${res.status}` };
    refresh();
    return { ok: true, ...data };
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Record<string, any>) => {
    const res = await authedFetch(`/api/admin/seo-os/calendar/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/admin/seo-os/calendar/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  const spawnContent = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/admin/seo-os/calendar/${encodeURIComponent(id)}/spawn-content`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error };
    refresh();
    return { ok: true, contentId: data.contentId };
  }, [refresh]);

  return { items, loading, error, refresh, generate, update, remove, spawnContent };
}
