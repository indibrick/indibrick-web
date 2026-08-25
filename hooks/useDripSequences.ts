// Live subscription to /drip_sequences + CRUD helpers + enroll.

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { authedPost, authedPatch, authedDelete } from '../lib/apiClient';
import type { DripSequenceDoc } from '../lib/dripShape';

interface UseDripsResult {
  sequences: DripSequenceDoc[];
  loading: boolean;
  create: (payload: Partial<DripSequenceDoc>) => Promise<{ ok: boolean; id?: string; errors?: string[] }>;
  update: (id: string, patch: Partial<DripSequenceDoc>) => Promise<{ ok: boolean; errors?: string[] }>;
  remove: (id: string) => Promise<{ ok: boolean }>;
  enroll: (
    id: string,
    payload: { referralIds?: string[]; recipientFilter?: any },
  ) => Promise<{ ok: boolean; enrolled?: number; suppressedCount?: number; alreadyEnrolledCount?: number; error?: string }>;
}

export function useDripSequences(currentUid: string | undefined): UseDripsResult {
  const [sequences, setSequences] = useState<DripSequenceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) { setSequences([]); setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, 'drip_sequences'),
      where('ownerUid', '==', currentUid),
      orderBy('updatedAt', 'desc'),
      limit(200),
    );
    const unsub = onSnapshot(q,
      snap => { setSequences(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))); setLoading(false); },
      err => { console.error('[useDripSequences]', err); setLoading(false); },
    );
    return unsub;
  }, [currentUid]);

  const create = async (payload: Partial<DripSequenceDoc>) => {
    try {
      const res = await authedPost('/api/partner/drip-sequences', payload);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'create failed'] };
      return { ok: true, id: data.id };
    } catch (e: any) { return { ok: false, errors: [e?.message || 'Network error'] }; }
  };

  const update = async (id: string, patch: Partial<DripSequenceDoc>) => {
    try {
      const res = await authedPatch(`/api/partner/drip-sequences/${id}`, patch);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'update failed'] };
      return { ok: true };
    } catch (e: any) { return { ok: false, errors: [e?.message || 'Network error'] }; }
  };

  const remove = async (id: string) => {
    try { const res = await authedDelete(`/api/partner/drip-sequences/${id}`); return { ok: res.ok }; }
    catch { return { ok: false }; }
  };

  const enroll = async (id: string, payload: { referralIds?: string[]; recipientFilter?: any }) => {
    try {
      const res = await authedPost(`/api/partner/drip-sequences/${id}/enroll`, payload);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || 'enroll failed' };
      return { ok: true, enrolled: data.enrolled, suppressedCount: data.suppressedCount, alreadyEnrolledCount: data.alreadyEnrolledCount };
    } catch (e: any) { return { ok: false, error: e?.message || 'Network error' }; }
  };

  return { sequences, loading, create, update, remove, enroll };
}
