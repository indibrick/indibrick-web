// Live subscription to /forms + CRUD helpers.

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { authedPost, authedPatch, authedDelete } from '../lib/apiClient';
import type { FormDoc } from '../lib/formShape';

interface UseFormsResult {
  forms: FormDoc[];
  loading: boolean;
  create: (payload: Partial<FormDoc>) => Promise<{ ok: boolean; id?: string; errors?: string[] }>;
  update: (id: string, patch: Partial<FormDoc>) => Promise<{ ok: boolean; errors?: string[] }>;
  remove: (id: string) => Promise<{ ok: boolean }>;
}

export function useForms(): UseFormsResult {
  const [forms, setForms] = useState<FormDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'forms'), orderBy('updatedAt', 'desc'), limit(200));
    const unsub = onSnapshot(q,
      snap => { setForms(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))); setLoading(false); },
      err => { console.error('[useForms]', err); setLoading(false); },
    );
    return unsub;
  }, []);

  const create = async (payload: Partial<FormDoc>) => {
    try {
      const res = await authedPost('/api/partner/forms', payload);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'create failed'] };
      return { ok: true, id: data.id };
    } catch (e: any) { return { ok: false, errors: [e?.message || 'Network error'] }; }
  };

  const update = async (id: string, patch: Partial<FormDoc>) => {
    try {
      const res = await authedPatch(`/api/partner/forms/${id}`, patch);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'update failed'] };
      return { ok: true };
    } catch (e: any) { return { ok: false, errors: [e?.message || 'Network error'] }; }
  };

  const remove = async (id: string) => {
    try { const res = await authedDelete(`/api/partner/forms/${id}`); return { ok: res.ok }; }
    catch { return { ok: false }; }
  };

  return { forms, loading, create, update, remove };
}
