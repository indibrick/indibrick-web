'use client';
import { useCallback, useEffect, useState } from 'react';
import { authedGet, authedFetch } from '../lib/apiClient';

export interface TeamRecord {
  id: string;
  name: string;
  ownerUid: string;
  memberUids: string[];
  _relation: 'owner' | 'member';
}

export interface TeamMemberRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string | null;
  relation: 'owner' | 'member';
}

export function useTeam() {
  const [team, setTeam] = useState<TeamRecord | null>(null);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedGet('/api/partner/team');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setTeam(data.team || null);
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (name: string) => {
    const res = await authedFetch('/api/partner/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || data?.errors?.[0] };
    await load();
    return { ok: true };
  }, [load]);

  const rename = useCallback(async (name: string) => {
    const res = await authedFetch('/api/partner/team', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return { ok: false };
    await load();
    return { ok: true };
  }, [load]);

  // Server does email → uid resolution so the UI stays humane. If
  // no user exists for the email, the API returns a clear error the
  // caller can surface as "invite them first."
  const addMemberByEmail = useCallback(async (email: string) => {
    const res = await authedFetch(`/api/partner/team?addEmail=${encodeURIComponent(email)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || data?.errors?.[0] };
    await load();
    return { ok: true };
  }, [load]);

  const removeMember = useCallback(async (uid: string) => {
    const res = await authedFetch(`/api/partner/team?remove=${encodeURIComponent(uid)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) return { ok: false };
    await load();
    return { ok: true };
  }, [load]);

  const disband = useCallback(async () => {
    const res = await authedFetch('/api/partner/team', { method: 'DELETE' });
    if (!res.ok) return { ok: false };
    await load();
    return { ok: true };
  }, [load]);

  return { team, members, loading, error, reload: load, create, rename, addMemberByEmail, removeMember, disband };
}
