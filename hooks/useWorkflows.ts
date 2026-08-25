'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedGet, authedFetch } from '../lib/apiClient';

export interface WorkflowDoc {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  triggerType?: string;
  triggerConfig?: Record<string, any>;
  conditions?: Array<{ field?: string; operator?: string; value?: any }>;
  actions?: Array<{ type?: string; config?: Record<string, any> }>;
  debounceMinutes?: number;
  dailyBucket?: boolean;
  firedCount?: number;
  errorCount?: number;
  lastFiredAt?: string | null;
  updatedAt?: any;
  createdAt?: any;
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    authedGet('/api/partner/workflows')
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setWorkflows(Array.isArray(data.workflows) ? data.workflows : []);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load workflows.'))
      .finally(() => setLoading(false));
  }, [tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const create = useCallback(async (input: Partial<WorkflowDoc>) => {
    const res = await authedFetch('/api/partner/workflows', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'Create failed'] };
    refresh();
    return { ok: true, id: data.id };
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Partial<WorkflowDoc>) => {
    const res = await authedFetch(`/api/partner/workflows/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'Update failed'] };
    refresh();
    return { ok: true };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/partner/workflows/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) refresh();
    return { ok: res.ok };
  }, [refresh]);

  return { workflows, loading, error, refresh, create, update, remove };
}
