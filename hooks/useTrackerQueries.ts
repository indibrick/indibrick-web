'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedFetch, authedGet } from '../lib/apiClient';
import type { AiCitationQueryDoc, CitationEngine } from '../lib/aiCitationQueryShape';

export interface TrackerQueryRow extends AiCitationQueryDoc { id: string; }

export function useTrackerQueries() {
  const [items, setItems] = useState<TrackerQueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    authedGet('/api/admin/seo-os/citation-tracker/query')
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const create = useCallback(async (input: Partial<AiCitationQueryDoc>) => {
    const res = await authedFetch('/api/admin/seo-os/citation-tracker/query', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || data?.errors?.[0] };
    refresh();
    return { ok: true };
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Partial<AiCitationQueryDoc>) => {
    const res = await authedFetch(`/api/admin/seo-os/citation-tracker/query/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || data?.errors?.[0] };
    refresh();
    return { ok: true };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/admin/seo-os/citation-tracker/query/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  return { items, loading, error, refresh, create, update, remove };
}
