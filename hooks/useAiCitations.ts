'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedGet, authedFetch } from '../lib/apiClient';

export function useAiCitations(opts: { engine?: string; queryNormalized?: string; sinceDays?: number } = {}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (opts.engine) qs.set('engine', opts.engine);
    if (opts.queryNormalized) qs.set('queryNormalized', opts.queryNormalized);
    if (opts.sinceDays) {
      const since = new Date(Date.now() - opts.sinceDays * 86400_000).toISOString();
      qs.set('since', since);
    }
    const q = qs.toString() ? `?${qs.toString()}` : '';
    authedGet(`/api/admin/seo-os/citations${q}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [opts.engine, opts.queryNormalized, opts.sinceDays, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  return { items, loading, error, refresh };
}

export function useLastRun() {
  const [lastRun, setLastRun] = useState<any | null>(null);
  const [configuredEngines, setConfiguredEngines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    authedGet('/api/admin/seo-os/citation-tracker/last-run')
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setLastRun(data.lastRun || null);
        setConfiguredEngines(Array.isArray(data.configuredEngines) ? data.configuredEngines : []);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const runNow = useCallback(async () => {
    const res = await authedFetch('/api/admin/seo-os/citation-tracker/run', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error };
    refresh();
    return { ok: true, summary: data.summary };
  }, [refresh]);

  return { lastRun, configuredEngines, loading, error, refresh, runNow };
}
