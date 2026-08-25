'use client';

// Admin Managed Ads dashboard.
//
// Left: client roster. Right: per-client attribution report with
// spend / leads / funded / cost-per-metric.

import { useEffect, useState } from 'react';
import { Loader2, DollarSign, TrendingUp, Users, Plus, X, Save, RefreshCw, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useManagedAdsClients, type ManagedAdsClient, type ManagedAdsReport } from '../../hooks/useManagedAdsClients';
import { MANAGED_ADS_TIERS, type ManagedAdsTier } from '../../lib/managedAdsShape';
import { formatCurrency } from '../../lib/crmHelpers';
import { EmptyState, LoadingState } from '../ui/StateFeedback';
import { useToast } from '../ui/ToastProvider';

interface ManagedAdsPanelProps {
  currentUid: string | undefined;
}

function TierBadge({ tier }: { tier?: string }) {
  const meta = MANAGED_ADS_TIERS.find(t => t.value === tier);
  const cls = tier === 'scale' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : tier === 'growth' ? 'bg-blue-100 text-blue-800 border-blue-200'
    : tier === 'starter' ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${cls}`}>
      {meta?.label || tier || 'None'}
    </span>
  );
}

function StatusChip({ status }: { status?: string }) {
  const cls = status === 'active' ? 'text-emerald-700' : status === 'paused' ? 'text-amber-700' : 'text-gray-500';
  return <span className={`text-[10px] font-black uppercase tracking-widest ${cls}`}>{status || 'unknown'}</span>;
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
      {sub && <p className="text-[10px] font-bold text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ClientEditor({
  initial, onClose, onSave,
}: {
  initial: Partial<ManagedAdsClient>;
  onClose: () => void;
  onSave: (uid: string, profile: any) => Promise<{ ok: boolean; errors?: string[] }>;
}) {
  const [uid, setUid] = useState(initial.uid || '');
  const [tier, setTier] = useState<ManagedAdsTier>((initial.managedAds?.tier as ManagedAdsTier) || 'starter');
  const [status, setStatus] = useState<'active' | 'paused' | 'churned'>(initial.managedAds?.status || 'active');
  const [monthlyRetainer, setMonthlyRetainer] = useState<string>(String(initial.managedAds?.monthlyRetainer ?? MANAGED_ADS_TIERS.find(t => t.value === (initial.managedAds?.tier || 'starter'))?.mgmtFee ?? 397));
  const [monthlyAdBudget, setMonthlyAdBudget] = useState<string>(String(initial.managedAds?.monthlyAdBudget ?? MANAGED_ADS_TIERS.find(t => t.value === (initial.managedAds?.tier || 'starter'))?.adSpendIncluded ?? 500));
  const [brief, setBrief] = useState(initial.managedAds?.brief || '');
  const [platformsStr, setPlatformsStr] = useState((initial.managedAds?.platforms || []).join(', '));
  const [labelsStr, setLabelsStr] = useState((initial.managedAds?.campaignLabels || []).join(', '));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isNew = !initial.uid;

  const save = async () => {
    if (!uid.trim()) { setErrors(['User uid required.']); return; }
    setSaving(true);
    setErrors([]);
    const profile = {
      tier, status,
      monthlyRetainer: Number(monthlyRetainer),
      monthlyAdBudget: Number(monthlyAdBudget),
      brief: brief.slice(0, 2000),
      platforms: platformsStr.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10),
      campaignLabels: labelsStr.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20),
    };
    const res = await onSave(uid.trim(), profile);
    setSaving(false);
    if (!res.ok) setErrors(res.errors || ['Save failed']);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-gray-200 shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">{isNew ? 'Add Managed Ads client' : 'Edit Managed Ads client'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Only admins can set these fields. Partners see them read-only.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 p-1"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 custom-scrollbar">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Partner UID</span>
            <input type="text" value={uid} onChange={e => setUid(e.target.value)} disabled={!isNew}
              placeholder="Firebase Auth UID from Firebase Console"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900 font-mono disabled:bg-gray-100"/>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Tier</span>
              <select value={tier} onChange={e => {
                const t = e.target.value as ManagedAdsTier;
                setTier(t);
                const meta = MANAGED_ADS_TIERS.find(x => x.value === t);
                if (meta) { setMonthlyRetainer(String(meta.mgmtFee)); setMonthlyAdBudget(String(meta.adSpendIncluded)); }
              }}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                {MANAGED_ADS_TIERS.map(t => <option key={t.value} value={t.value}>{t.label} — ${t.priceCad}/mo (${t.mgmtFee} mgmt + ${t.adSpendIncluded} spend)</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Status</span>
              <select value={status} onChange={e => setStatus(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="churned">Churned</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Monthly retainer (CAD)</span>
              <input type="number" min={0} value={monthlyRetainer} onChange={e => setMonthlyRetainer(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Monthly ad budget (CAD)</span>
              <input type="number" min={0} value={monthlyAdBudget} onChange={e => setMonthlyAdBudget(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Platforms (comma-separated)</span>
            <input type="text" value={platformsStr} onChange={e => setPlatformsStr(e.target.value)}
              placeholder="google, meta, linkedin"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Campaign labels (comma-separated)</span>
            <input type="text" value={labelsStr} onChange={e => setLabelsStr(e.target.value)}
              placeholder="renewal-fall-2026, sellers-toronto-core"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
            <span className="text-[10px] text-gray-500 mt-1 block">These match against attribution.campaign on inbound referrals.</span>
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Brief (audience, creative preferences)</span>
            <textarea rows={4} value={brief} onChange={e => setBrief(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900 resize-y"/>
          </label>
        </div>
        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2">Cancel</button>
          <button onClick={save} disabled={saving}
            className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm disabled:opacity-50">
            <Save size={11}/> {saving ? 'Saving…' : (isNew ? 'Add client' : 'Save changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

function AttributionReportView({ client, onClose, fetchReport }: {
  client: ManagedAdsClient;
  onClose: () => void;
  fetchReport: (uid: string) => Promise<{ ok: boolean; report?: ManagedAdsReport; error?: string }>;
}) {
  const [report, setReport] = useState<ManagedAdsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchReport(client.uid).then(res => {
      if (!res.ok) setError(res.error || 'Report failed');
      else setReport(res.report || null);
      setLoading(false);
    });
  };
  useEffect(load, [client.uid]);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-gray-200 shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Attribution — {client.displayName || client.email || client.uid.slice(0, 8)}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              <TierBadge tier={client.managedAds.tier}/> <StatusChip status={client.managedAds.status}/>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 text-slate-500 hover:text-slate-900" title="Refresh"><RefreshCw size={14}/></button>
            <button onClick={onClose} className="text-gray-400 hover:text-slate-900 p-1"><X size={18}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50 custom-scrollbar">
          {loading && <LoadingState label="Building report"/>}
          {error && !loading && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">{error}</div>
          )}
          {report && !loading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatTile label="Leads (trailing 30d)" value={report.trailing30d.leads} sub={`${report.trailing30d.funded} funded`}/>
                <StatTile label="Funded value (30d)" value={formatCurrency(report.trailing30d.fundedValue)} sub="mortgage volume"/>
                <StatTile label="Cost per lead" value={report.trailing30d.costPerLead != null ? `$${report.trailing30d.costPerLead}` : 'n/a'} sub={`Budget $${report.trailing30d.monthlyBudget}/mo`}/>
                <StatTile label="Cost per funded" value={report.trailing30d.costPerFunded != null ? `$${report.trailing30d.costPerFunded}` : 'n/a'} sub="ad-attributed"/>
              </div>

              <section className="bg-white p-4 rounded-2xl border border-gray-200">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3 flex items-center gap-2"><TrendingUp size={12}/> By campaign</h3>
                {report.byCampaign.length === 0 && <p className="text-xs text-gray-500">No attributed leads yet.</p>}
                {report.byCampaign.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-left border-b border-gray-100">
                        <th className="py-2">Campaign</th>
                        <th className="py-2">Leads</th>
                        <th className="py-2">Active</th>
                        <th className="py-2">Funded</th>
                        <th className="py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byCampaign.map(b => (
                        <tr key={b.key} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 font-bold text-slate-900">{b.key}</td>
                          <td className="py-2 text-slate-700">{b.leads}</td>
                          <td className="py-2 text-slate-700">{b.active}</td>
                          <td className="py-2 text-emerald-700 font-bold">{b.funded}</td>
                          <td className="py-2 text-slate-900 font-bold">{formatCurrency(b.fundedValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="bg-white p-4 rounded-2xl border border-gray-200">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3 flex items-center gap-2"><Users size={12}/> By source</h3>
                {report.bySource.length === 0 && <p className="text-xs text-gray-500">No leads yet.</p>}
                {report.bySource.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-left border-b border-gray-100">
                        <th className="py-2">Source</th>
                        <th className="py-2">Leads</th>
                        <th className="py-2">Funded</th>
                        <th className="py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.bySource.map(b => (
                        <tr key={b.key} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 font-bold text-slate-900">{b.key}</td>
                          <td className="py-2 text-slate-700">{b.leads}</td>
                          <td className="py-2 text-emerald-700 font-bold">{b.funded}</td>
                          <td className="py-2 text-slate-900 font-bold">{formatCurrency(b.fundedValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ManagedAdsPanel({ currentUid }: ManagedAdsPanelProps) {
  const toast = useToast();
  const { clients, loading, upsert, remove, fetchReport } = useManagedAdsClients();
  const [editing, setEditing] = useState<null | { mode: 'new' } | { mode: 'edit'; client: ManagedAdsClient }>(null);
  const [viewingReport, setViewingReport] = useState<ManagedAdsClient | null>(null);

  const totalMRR = clients.reduce((acc, c) => c.managedAds.status === 'active' ? acc + (c.managedAds.monthlyRetainer || 0) + (c.managedAds.monthlyAdBudget || 0) : acc, 0);
  const activeCount = clients.filter(c => c.managedAds.status === 'active').length;

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Active clients" value={activeCount}/>
        <StatTile label="Monthly billings" value={formatCurrency(totalMRR)} sub="retainer + ad spend"/>
        <StatTile label="Total clients" value={clients.length}/>
        <StatTile label="Churned" value={clients.filter(c => c.managedAds.status === 'churned').length}/>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Managed Ads clients</h2>
          <p className="text-xs text-gray-500 mt-0.5">Attribution ties inbound leads back to campaigns via UTM tags.</p>
        </div>
        <button onClick={() => setEditing({ mode: 'new' })}
          className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm">
          <Plus size={12}/> Add client
        </button>
      </div>

      {loading && <LoadingState label="Loading clients"/>}

      {!loading && clients.length === 0 && (
        <EmptyState
          icon={DollarSign}
          title="No Managed Ads clients yet"
          description="Add your first client with their tier + budget. Tag their campaigns with a utm_campaign label and the attribution report kicks in automatically."
          action={{ label: 'Add first client', onClick: () => setEditing({ mode: 'new' }) }}
        />
      )}

      {!loading && clients.length > 0 && (
        <div className="space-y-3">
          {clients.map(c => (
            <div key={c.uid} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TierBadge tier={c.managedAds.tier}/>
                    <StatusChip status={c.managedAds.status}/>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      · Retainer ${c.managedAds.monthlyRetainer || 0}/mo · Spend ${c.managedAds.monthlyAdBudget || 0}/mo
                    </span>
                  </div>
                  <p className="text-base font-black text-slate-900">{c.displayName || c.email || c.uid.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  {(c.managedAds.platforms || []).length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">
                      Platforms: {c.managedAds.platforms!.join(' · ')}
                    </p>
                  )}
                  {(c.managedAds.campaignLabels || []).length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Campaigns: {c.managedAds.campaignLabels!.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => setViewingReport(c)}
                    className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1 transition">
                    <ArrowUpRight size={11}/> Report
                  </button>
                  <button onClick={() => setEditing({ mode: 'edit', client: c })}
                    className="bg-white border border-gray-200 hover:border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition">
                    Edit
                  </button>
                  {c.managedAds.status !== 'churned' && (
                    <button onClick={async () => {
                      if (!window.confirm('Mark this client as churned?')) return;
                      const res = await remove(c.uid);
                      if (res.ok) toast.success('Client marked churned.');
                    }}
                      className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-800 px-3 py-2">
                      Churn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ClientEditor
          initial={editing.mode === 'edit' ? editing.client : {}}
          onClose={() => setEditing(null)}
          onSave={upsert}
        />
      )}
      {viewingReport && (
        <AttributionReportView
          client={viewingReport}
          onClose={() => setViewingReport(null)}
          fetchReport={fetchReport}
        />
      )}
    </div>
  );
}
