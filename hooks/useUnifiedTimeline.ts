'use client';
import { useEffect, useState } from 'react';
import { authedGet } from '../lib/apiClient';

export interface TimelineRow {
  id: string;
  kind: 'sms' | 'call' | 'email' | 'note' | 'system';
  direction?: 'inbound' | 'outbound' | null;
  at: string;
  from?: string | null;
  to?: string | null;
  subject?: string | null;
  body?: string | null;
  status?: string | null;
  meta?: Record<string, any>;
}

export function useUnifiedTimeline(referralId: string | null | undefined) {
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!referralId) return;
    setLoading(true);
    setError(null);
    authedGet(`/api/partner/timeline?referralId=${encodeURIComponent(referralId)}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setRows(Array.isArray(data.rows) ? data.rows : []);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load timeline.'))
      .finally(() => setLoading(false));
  }, [referralId, refreshTick]);

  return { rows, loading, error, refresh: () => setRefreshTick(t => t + 1) };
}
