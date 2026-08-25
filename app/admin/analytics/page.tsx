'use client';
// Superadmin cross-tenant dashboard — one row per partner, one totals
// strip up top. Purely read; no partner-scoped writes.

import { useEffect, useState } from 'react';
import { authedGet } from '@/lib/apiClient';

interface PartnerRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string | null;
  totalReferrals: number;
  referrals30d: number;
  funded30d: number;
  fundedVolume30d: number;
  activeDripRuns: number;
  emailsSent30d: number;
  emailBounces30d: number;
  emailComplaints30d: number;
  suppressions: number;
  onboardingCompletedAt: string | null;
  managedAdsTier: string | null;
  teamName: string | null;
  teamRelation: 'owner' | 'member' | null;
}

interface Totals {
  partners: number;
  activePartners30d: number;
  totalReferrals: number;
  referrals30d: number;
  funded30d: number;
  fundedVolume30d: number;
  emailsSent30d: number;
  emailBounces30d: number;
  emailComplaints30d: number;
  activeDripRuns: number;
  suppressions: number;
  bounceRate30d: number | null;
  complaintRate30d: number | null;
}

function money(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

function Tile({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: 'ok' | 'warn' | 'bad' }) {
  const border = tone === 'bad' ? 'border-red-300' : tone === 'warn' ? 'border-amber-300' : 'border-neutral-200';
  return (
    <div className={`rounded-lg border ${border} bg-white p-4`}>
      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-neutral-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    authedGet('/api/admin/tenant-analytics')
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setTotals(data.totals || null);
        setGeneratedAt(data.generatedAt || '');
      })
      .catch((e: any) => setError(e?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-neutral-500">Loading analytics…</div>;
  if (error) return <div className="p-8 text-sm text-red-600">{error}</div>;
  if (!totals) return null;

  const bounceTone: 'ok' | 'warn' | 'bad' | undefined = totals.bounceRate30d == null
    ? undefined
    : totals.bounceRate30d >= 2 ? 'bad' : totals.bounceRate30d >= 1 ? 'warn' : 'ok';
  const complaintTone: 'ok' | 'warn' | 'bad' | undefined = totals.complaintRate30d == null
    ? undefined
    : totals.complaintRate30d >= 0.3 ? 'bad' : totals.complaintRate30d >= 0.1 ? 'warn' : 'ok';

  return (
    <div className="min-h-screen bg-neutral-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Platform analytics</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cross-tenant view · generated {generatedAt ? new Date(generatedAt).toLocaleString() : 'now'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="Partners" value={totals.partners} sub={`${totals.activePartners30d} active in 30d`}/>
          <Tile label="Leads (30d)" value={totals.referrals30d} sub={`${totals.totalReferrals} all-time`}/>
          <Tile label="Funded (30d)" value={totals.funded30d} sub={money(totals.fundedVolume30d) + ' volume'}/>
          <Tile label="Emails sent (30d)" value={totals.emailsSent30d} sub={`${totals.activeDripRuns} active drips`}/>
          <Tile
            label="Bounce rate (30d)"
            value={totals.bounceRate30d == null ? '—' : `${totals.bounceRate30d}%`}
            sub={`${totals.emailBounces30d} bounces`}
            tone={bounceTone}
          />
          <Tile
            label="Complaint rate (30d)"
            value={totals.complaintRate30d == null ? '—' : `${totals.complaintRate30d}%`}
            sub={`${totals.emailComplaints30d} complaints`}
            tone={complaintTone}
          />
          <Tile label="Suppressions" value={totals.suppressions} sub="all-time"/>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-3 py-2 text-left">Partner</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-right">Leads (all)</th>
                <th className="px-3 py-2 text-right">Leads (30d)</th>
                <th className="px-3 py-2 text-right">Funded (30d)</th>
                <th className="px-3 py-2 text-right">Volume</th>
                <th className="px-3 py-2 text-right">Emails (30d)</th>
                <th className="px-3 py-2 text-right">Bounces</th>
                <th className="px-3 py-2 text-right">Complaints</th>
                <th className="px-3 py-2 text-right">Active drips</th>
                <th className="px-3 py-2 text-right">Suppressions</th>
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2 text-left">Onboarding</th>
                <th className="px-3 py-2 text-left">Managed Ads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 && (
                <tr><td colSpan={14} className="px-3 py-6 text-center text-neutral-500">No partners yet.</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.uid} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 text-neutral-900">
                    <div className="font-medium">{r.displayName || r.email || r.uid.slice(0, 8)}</div>
                    {r.email && <div className="text-xs text-neutral-500">{r.email}</div>}
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{r.role?.replace('partner_', '') || '—'}</td>
                  <td className="px-3 py-2 text-right">{r.totalReferrals}</td>
                  <td className="px-3 py-2 text-right font-medium text-neutral-900">{r.referrals30d}</td>
                  <td className="px-3 py-2 text-right">{r.funded30d}</td>
                  <td className="px-3 py-2 text-right">{r.fundedVolume30d > 0 ? money(r.fundedVolume30d) : '—'}</td>
                  <td className="px-3 py-2 text-right">{r.emailsSent30d}</td>
                  <td className={`px-3 py-2 text-right ${r.emailBounces30d > 0 ? 'text-amber-700' : ''}`}>{r.emailBounces30d}</td>
                  <td className={`px-3 py-2 text-right ${r.emailComplaints30d > 0 ? 'text-red-700' : ''}`}>{r.emailComplaints30d}</td>
                  <td className="px-3 py-2 text-right">{r.activeDripRuns}</td>
                  <td className="px-3 py-2 text-right">{r.suppressions}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.teamName
                      ? <span className="inline-flex items-center gap-1">
                          <span className="text-neutral-800">{r.teamName}</span>
                          <span className={`text-[9px] uppercase tracking-widest ${r.teamRelation === 'owner' ? 'text-emerald-700' : 'text-neutral-500'}`}>{r.teamRelation}</span>
                        </span>
                      : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {r.onboardingCompletedAt ? new Date(r.onboardingCompletedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.managedAdsTier
                      ? <span className="inline-block rounded bg-purple-50 text-purple-700 px-2 py-0.5">{r.managedAdsTier}</span>
                      : <span className="text-neutral-400">—</span>}
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
