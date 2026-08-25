'use client';
// Team-scoped report — owner-only view rendered in the Settings tab
// under the Team card. Shows trailing 30d referral + drip + email
// performance per teammate + totals strip. Renders nothing when the
// caller isn't a team owner (endpoint 404s cleanly).

import { useEffect, useState } from 'react';
import { authedGet } from '../../lib/apiClient';

interface Row {
  uid: string;
  displayName: string | null;
  email: string | null;
  relation: 'owner' | 'member';
  referrals30d: number;
  funded30d: number;
  fundedVolume30d: number;
  activeDripRuns: number;
  emailsSent30d: number;
  emailBounces30d: number;
  emailComplaints30d: number;
}

interface Payload {
  team: { id: string; name: string; ownerUid: string; memberCount: number };
  generatedAt: string;
  totals: Record<string, number>;
  rows: Row[];
}

function money(v: number): string {
  if (!v) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

export default function TeamReportPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notOwner, setNotOwner] = useState(false);

  useEffect(() => {
    setLoading(true);
    authedGet('/api/partner/team/report')
      .then(async r => {
        if (r.status === 404) { setNotOwner(true); return; }
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body?.error || `HTTP ${r.status}`);
        setData(body);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load team report.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-neutral-500">Loading team report…</div>;
  if (notOwner) return null; // owner-only; silently omit for non-owners
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-neutral-900">Team performance · trailing 30d</h3>
        <span className="text-xs text-neutral-500">{data.team.memberCount} members</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 text-sm">
        {[
          { k: 'Leads',         v: data.totals.referrals30d },
          { k: 'Funded',        v: data.totals.funded30d },
          { k: 'Volume',        v: money(data.totals.fundedVolume30d) },
          { k: 'Drips active',  v: data.totals.activeDripRuns },
          { k: 'Emails sent',   v: data.totals.emailsSent30d },
          { k: 'Bounces',       v: data.totals.emailBounces30d },
          { k: 'Complaints',    v: data.totals.emailComplaints30d },
        ].map(t => (
          <div key={t.k} className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t.k}</div>
            <div className="mt-0.5 text-lg font-semibold text-neutral-900">{t.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
            <tr>
              <th className="px-3 py-2 text-left">Member</th>
              <th className="px-3 py-2 text-right">Leads</th>
              <th className="px-3 py-2 text-right">Funded</th>
              <th className="px-3 py-2 text-right">Volume</th>
              <th className="px-3 py-2 text-right">Drips</th>
              <th className="px-3 py-2 text-right">Emails</th>
              <th className="px-3 py-2 text-right">Bounces</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {data.rows.map(r => (
              <tr key={r.uid} className="hover:bg-neutral-50">
                <td className="px-3 py-2">
                  <div className="font-medium text-neutral-900">{r.displayName || r.email || r.uid.slice(0, 8)}</div>
                  {r.email && r.displayName && <div className="text-xs text-neutral-500 truncate">{r.email}</div>}
                  <div className={`text-[10px] uppercase tracking-widest ${r.relation === 'owner' ? 'text-emerald-700' : 'text-neutral-500'}`}>{r.relation}</div>
                </td>
                <td className="px-3 py-2 text-right">{r.referrals30d}</td>
                <td className="px-3 py-2 text-right">{r.funded30d}</td>
                <td className="px-3 py-2 text-right">{money(r.fundedVolume30d)}</td>
                <td className="px-3 py-2 text-right">{r.activeDripRuns}</td>
                <td className="px-3 py-2 text-right">{r.emailsSent30d}</td>
                <td className={`px-3 py-2 text-right ${r.emailBounces30d > 0 ? 'text-amber-700' : ''}`}>{r.emailBounces30d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
