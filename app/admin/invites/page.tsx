'use client';
// Admin invites — issue a signed URL to a realtor / lawyer /
// insurance agent so they can join the platform. Copy the URL and
// send it via whatever channel (email / Slack / text) makes sense.

import { useEffect, useState } from 'react';
import { authedGet, authedFetch } from '@/lib/apiClient';
import { Copy, Trash2, Send } from 'lucide-react';

interface InviteRow {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedBy?: string;
  note?: string;
  createdAtIso?: string;
  acceptedAt?: string | null;
  expiresAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  partner_realtor: 'Realtor',
  partner_lawyer: 'Lawyer',
  partner_mortgage: 'Mortgage partner',
  partner_insurance: 'Insurance agent',
  internal_agent: 'Internal agent',
};

export default function AdminInvitesPage() {
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('partner_realtor');
  const [note, setNote] = useState('');
  const [teamId, setTeamId] = useState('');
  const [creating, setCreating] = useState(false);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);
  const [copiedFlash, setCopiedFlash] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedGet('/api/admin/invites');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setRows(Array.isArray(data.invites) ? data.invites : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load invites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await authedFetch('/api/admin/invites', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, note, teamId: teamId || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setLatestUrl(data.acceptUrl);
      setEmail(''); setNote('');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to create invite.');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this invite?')) return;
    try {
      const res = await authedFetch(`/api/admin/invites?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to revoke.');
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFlash(true);
      setTimeout(() => setCopiedFlash(false), 2000);
    } catch { /* clipboard may be blocked; the URL is visible on screen */ }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Partner invites</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Issue a signed URL that lets a new partner join the platform. Valid for 14 days.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-medium text-neutral-900">New invite</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@brokerage.ca"
              className="p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 md:col-span-2"/>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="p-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900">
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button onClick={create} disabled={creating || !email}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
              <Send size={14}/> {creating ? 'Creating…' : 'Create invite'}
            </button>
          </div>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Internal note (optional) — how you know them, deal source, etc"
            className="mt-3 w-full p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
          <div className="mt-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Auto-join team (optional)</label>
            <input type="text" value={teamId} onChange={e => setTeamId(e.target.value)}
              placeholder="Team ID — leave blank to send a solo invite"
              className="w-full p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono text-xs"/>
            <p className="text-[11px] text-neutral-500 mt-1">
              When set, the invitee lands in the roster the moment they accept. Only teams you own count.
            </p>
          </div>

          {latestUrl && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
              <span className="flex-1 text-xs text-emerald-900 font-mono truncate">{latestUrl}</span>
              <button onClick={() => copyLink(latestUrl)}
                className="text-xs font-medium text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1">
                <Copy size={12}/> {copiedFlash ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Sent</th>
                <th className="px-3 py-2 text-left">Expires</th>
                <th className="px-3 py-2"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && <tr><td colSpan={6} className="px-3 py-6 text-center text-neutral-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-neutral-500">No invites yet.</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-medium text-neutral-900">{r.email}</td>
                  <td className="px-3 py-2 text-neutral-600">{ROLE_LABELS[r.role] || r.role}</td>
                  <td className="px-3 py-2">
                    <span className={
                      r.status === 'accepted' ? 'text-emerald-700' :
                      r.status === 'revoked' ? 'text-neutral-400' :
                      'text-amber-700'
                    }>{r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {r.createdAtIso ? new Date(r.createdAtIso).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.status === 'pending' && (
                      <button onClick={() => revoke(r.id)} className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1">
                        <Trash2 size={12}/> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
