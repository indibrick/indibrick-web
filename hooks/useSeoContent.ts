'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedFetch, authedGet } from '../lib/apiClient';
import type { SeoContentDoc, SeoContentStatus } from '../lib/seoContentShape';

export interface SeoContentRow extends SeoContentDoc { id: string; }

export function useSeoContent(statusFilter?: SeoContentStatus | 'all') {
  const [items, setItems] = useState<SeoContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    authedGet(`/api/admin/seo-os/content${qs}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load content.'))
      .finally(() => setLoading(false));
  }, [statusFilter, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const generate = useCallback(async (input: Record<string, any>) => {
    const res = await authedFetch('/api/admin/seo-os/content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || data?.errors?.[0] || `HTTP ${res.status}` };
    refresh();
    return { ok: true, id: data.id, costUsd: data.generationCostUsd };
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Partial<SeoContentDoc>) => {
    const res = await authedFetch(`/api/admin/seo-os/content/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error };
    refresh();
    return { ok: true };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/admin/seo-os/content/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  return { items, loading, error, refresh, generate, update, remove };
}

export function useSeoContentDoc(id: string | null) {
  const [item, setItem] = useState<SeoContentRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    authedGet(`/api/admin/seo-os/content/${encodeURIComponent(id)}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setItem(data);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [id]);

  return { item, loading, error };
}
