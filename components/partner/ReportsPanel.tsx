'use client';

// Reports dashboard — production, funnel, speed-to-lead, deal-type mix.
//
// Every report reads the in-memory allReferrals; no extra Firestore
// reads. The scope toggle (Mine / Team) filters the source list; the
// hook re-memoizes accordingly.

import { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { TrendingUp, Users, DollarSign, Zap, Clock, Activity } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { formatCurrency } from '../../lib/crmHelpers';

interface ReportsPanelProps {
  allReferrals: any[];
  currentUid?: string;
}

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9'];

function StatTile({
  icon: Icon, label, value, sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} className="text-slate-500"/>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
      {sub && <p className="text-[10px] font-bold text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportsPanel({ allReferrals, currentUid }: ReportsPanelProps) {
  const [scope, setScope] = useState<'mine' | 'team'>('team');
  const report = useReports({ allReferrals, currentUid, scope });

  return (
    <div className="animate-fade-in-up space-y-6 max-w-6xl">
      {/* Scope toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Production reports</h2>
          <p className="text-xs text-gray-500 mt-0.5">Numbers reflect the deals currently loaded on this device — no extra queries.</p>
        </div>
        <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1">
          <button onClick={() => setScope('mine')}
            className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition ${scope === 'mine' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            My deals
          </button>
          <button onClick={() => setScope('team')}
            className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition ${scope === 'team' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            Everything loaded
          </button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Users}      label="Active deals"        value={report.summary.totalActive}
          sub="in progress" />
        <StatTile icon={DollarSign} label="Funded (last 30d)"   value={formatCurrency(report.summary.fundedValueLast30d)}
          sub="rolling window" />
        <StatTile icon={DollarSign} label="Funded YTD"          value={formatCurrency(report.summary.fundedValueYtd)}
          sub={`${report.summary.totalFunded} deal${report.summary.totalFunded === 1 ? '' : 's'}`} />
        <StatTile icon={TrendingUp} label="Conversion"          value={`${report.summary.conversionPct}%`}
          sub="funded / non-lost" />
      </div>

      {/* Monthly production */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <DollarSign size={12}/> Funded volume — last 12 months
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Avg time to fund:&nbsp;
              <span className="text-slate-900 font-bold">
                {report.summary.avgDaysToFund != null ? `${report.summary.avgDaysToFund} days` : 'n/a'}
              </span>
            </p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.months} margin={{ top: 10, right: 6, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)}/>
              <Tooltip
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
                formatter={(v: number, name: string) => name === 'fundedVolume' ? [formatCurrency(v), 'Funded volume'] : [v, name]}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
              />
              <Bar dataKey="fundedVolume" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Two-column: funnel + deal-type mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-3">
            <Activity size={12}/> Conversion funnel
          </h3>
          <div className="space-y-2">
            {report.funnel.map((f, i) => (
              <div key={f.stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-900 font-bold">{f.stage}</span>
                  <span className="text-gray-500 font-medium">{f.count} · {f.pct}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(2, f.pct)}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
            Percentages are of your <span className="font-bold">non-lost</span> pipeline. A deal that reaches Funded is counted in every earlier stage.
          </p>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-3">
            <Zap size={12}/> Deal-type mix
          </h3>
          {report.dealTypeMix.length === 0 ? (
            <p className="text-xs text-gray-500">No deals yet.</p>
          ) : (
            <div className="space-y-2">
              {report.dealTypeMix.map((d, i) => {
                const maxCount = Math.max(1, ...report.dealTypeMix.map(x => x.count));
                const pct = (d.count / maxCount) * 100;
                return (
                  <div key={d.dealType}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-900 font-bold">{d.dealType}</span>
                      <span className="text-gray-500 font-medium">{d.count} · {formatCurrency(d.volume)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(2, pct)}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Speed-to-lead trend */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Clock size={12}/> Speed-to-lead — last 8 weeks
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Median hours from lead-in → first logged call.</p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report.speedToLead} margin={{ top: 10, right: 6, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => `${v}h`}/>
              <Tooltip
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
                formatter={(v: any, name: string) => name === 'medianHrs' ? [v == null ? 'n/a' : `${Math.round(v)}h`, 'Median'] : [v, name]}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
              />
              <Line
                type="monotone" dataKey="medianHrs"
                stroke="#10b981" strokeWidth={2.5}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <p className="text-[10px] text-gray-400 text-center">
        Reports reflect the pipeline currently loaded in this browser. Refresh the pipeline to include newly-imported or updated deals.
      </p>
    </div>
  );
}
