'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedFetch } from '@/lib/apiClient';
import type { SenderIdentity } from '@/lib/senderIdentity';

interface Fallback {
  displayName: string;
  brokerageName: string;
  email: string;
}

export function useSenderIdentity() {
  const [identity, setIdentity] = useState<SenderIdentity | null>(null);
  const [fallback, setFallback] = useState<Fallback | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch('/api/partner/sender-identity');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIdentity(data.senderIdentity || null);
      setFallback(data.fallback || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load sender identity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (patch: Partial<SenderIdentity>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await authedFetch('/api/partner/sender-identity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.errors?.[0] || errData.error || `HTTP ${res.status}`);
      }
      await load();
      return true;
    } catch (e: any) {
      setError(e?.message || 'Failed to save.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [load]);

  return { identity, fallback, loading, saving, error, reload: load, save };
}
