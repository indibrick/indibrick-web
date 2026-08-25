// Live subscription to the current user's /email_templates + CRUD helpers.

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { authedPost, authedPatch, authedDelete } from '../lib/apiClient';
import type { EmailTemplateDoc } from '../lib/emailTemplateShape';

interface UseTemplatesResult {
  templates: EmailTemplateDoc[];
  loading: boolean;
  create: (payload: Partial<EmailTemplateDoc>) => Promise<{ ok: boolean; id?: string; errors?: string[] }>;
  update: (id: string, patch: Partial<EmailTemplateDoc>) => Promise<{ ok: boolean; errors?: string[] }>;
  remove: (id: string) => Promise<{ ok: boolean }>;
}

export function useEmailTemplates(currentUid: string | undefined): UseTemplatesResult {
  const [templates, setTemplates] = useState<EmailTemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) { setTemplates([]); setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, 'email_templates'),
      where('ownerUid', '==', currentUid),
      orderBy('updatedAt', 'desc'),
      limit(200),
    );
    const unsub = onSnapshot(q,
      snap => { setTemplates(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))); setLoading(false); },
      err => { console.error('[useEmailTemplates]', err); setLoading(false); },
    );
    return unsub;
  }, [currentUid]);

  const create = async (payload: Partial<EmailTemplateDoc>) => {
    try {
      const res = await authedPost('/api/partner/email-templates', payload);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'create failed'] };
      return { ok: true, id: data.id };
    } catch (e: any) { return { ok: false, errors: [e?.message || 'Network error'] }; }
  };

  const update = async (id: string, patch: Partial<EmailTemplateDoc>) => {
    try {
      const res = await authedPatch(`/api/partner/email-templates/${id}`, patch);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, errors: data.errors || [data.error || 'update failed'] };
      return { ok: true };
    } catch (e: any) { return { ok: false, errors: [e?.message || 'Network error'] }; }
  };

  const remove = async (id: string) => {
    try { const res = await authedDelete(`/api/partner/email-templates/${id}`); return { ok: res.ok }; }
    catch { return { ok: false }; }
  };

  return { templates, loading, create, update, remove };
}
