'use client';
// Partner-facing "My Ads" view — only useful when the partner has a
// managedAds profile set by an admin. Shows the same rollup admins
// see, minus the ability to edit the tier/budget (that's an admin
// action). Renders a helpful empty state if managedAds is null.

import { useMyAttributionReport } from '@/hooks/useMyAttributionReport';

interface Props {
  uid: string | null | undefined;
}

function formatCurrency(v: number): string {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v}`;
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-neutral-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export default function MyAdsPanel({ uid }: Props) {
  const { report, loading, error } = useMyAttributionReport(uid);

  if (!uid) return null;
  if (loading) return <div className="text-sm text-neutral-500">Loading your ad performance…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!report) return null;

  const noProfile = !report.managedAds;
  if (noProfile) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700">
        <p className="font-medium text-neutral-900">You&apos;re not enrolled in Managed Ads yet.</p>
        <p className="mt-2 text-neutral-600">
          Managed Ads is IndiBrick&apos;s done-for-you paid acquisition service —
          we build, run, and optimize Google + Meta campaigns and pipe every
          lead into this CRM. Ask your account rep to get you set up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Your Managed Ads report</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Tier: <span className="font-medium">{report.managedAds?.tier || '—'}</span> · Status: <span className="font-medium">{report.managedAds?.status || 'active'}</span>
            </p>
          </div>
          <div className="text-right text-xs text-neutral-500">
            {report.totalReferrals} tracked leads all-time
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Leads (trailing 30d)"
          value={report.trailing30d.leads}
          sub={`${report.trailing30d.funded} funded`}
        />
        <StatTile
          label="Funded value (30d)"
          value={formatCurrency(report.trailing30d.fundedValue)}
          sub="mortgage volume"
        />
        <StatTile
          label="Cost per lead"
          value={report.trailing30d.costPerLead != null ? `$${report.trailing30d.costPerLead}` : '—'}
          sub={report.trailing30d.monthlyBudget ? `Budget $${report.trailing30d.monthlyBudget}/mo` : 'Budget not set'}
        />
        <StatTile
          label="Cost per funded"
          value={report.trailing30d.costPerFunded != null ? `$${report.trailing30d.costPerFunded}` : '—'}
          sub="ad-attributed"
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-neutral-900">By campaign</h4>
        {report.byCampaign.length === 0 && (
          <p className="mt-2 text-xs text-neutral-500">No attributed leads yet — allow 7–14 days after launch.</p>
        )}
        {report.byCampaign.length > 0 && (
          <div className="mt-2 overflow-x-auto rounded-lg border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2 text-left">Campaign</th>
                  <th className="px-3 py-2 text-right">Leads</th>
                  <th className="px-3 py-2 text-right">Contacted</th>
                  <th className="px-3 py-2 text-right">Active</th>
                  <th className="px-3 py-2 text-right">Funded</th>
                  <th className="px-3 py-2 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {report.byCampaign.map(b => (
                  <tr key={b.key}>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-800">{b.key}</td>
                    <td className="px-3 py-2 text-right">{b.leads}</td>
                    <td className="px-3 py-2 text-right">{b.contacted}</td>
                    <td className="px-3 py-2 text-right">{b.active}</td>
                    <td className="px-3 py-2 text-right">{b.funded}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(b.fundedValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-neutral-900">By source</h4>
        {report.bySource.length === 0 && (
          <p className="mt-2 text-xs text-neutral-500">No leads yet.</p>
        )}
        {report.bySource.length > 0 && (
          <div className="mt-2 overflow-x-auto rounded-lg border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-right">Leads</th>
                  <th className="px-3 py-2 text-right">Funded</th>
                  <th className="px-3 py-2 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {report.bySource.map(b => (
                  <tr key={b.key}>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-800">{b.key}</td>
                    <td className="px-3 py-2 text-right">{b.leads}</td>
                    <td className="px-3 py-2 text-right">{b.funded}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(b.fundedValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
