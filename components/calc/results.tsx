'use client';

// Result display primitives — result cards, key-value rows, charts.
// Every calculator's output area is built from these.

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { formatCAD } from '../../lib/mortgageEngine';

// ─── ResultCard — the big-number hero output ─────────────────────────

interface ResultCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: 'blue' | 'emerald' | 'red' | 'amber' | 'purple' | 'slate';
  size?: 'lg' | 'md';
}

const ACCENT_MAP = {
  blue:    { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700' },
  emerald: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
  red:     { bg: 'bg-red-50 border-red-100', text: 'text-red-700' },
  amber:   { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
  purple:  { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700' },
  slate:   { bg: 'bg-slate-900 border-slate-800 text-white', text: 'text-white' },
};

export function ResultCard({ label, value, sublabel, accent = 'slate', size = 'lg' }: ResultCardProps) {
  const a = ACCENT_MAP[accent];
  return (
    <div className={`rounded-3xl border ${a.bg} p-6 md:p-8`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${accent === 'slate' ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`${size === 'lg' ? 'text-4xl md:text-6xl' : 'text-2xl md:text-4xl'} font-black tracking-tighter tabular-nums ${a.text}`}>{value}</p>
      {sublabel && <p className={`text-xs md:text-sm mt-1 ${accent === 'slate' ? 'text-gray-400' : 'text-gray-500'} font-medium`}>{sublabel}</p>}
    </div>
  );
}

// ─── ResultRow — labeled key-value row ────────────────────────────────

interface ResultRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
  color?: string;
}

export function ResultRow({ label, value, emphasis, color }: ResultRowProps) {
  return (
    <div className={`flex items-baseline justify-between py-2.5 border-b border-gray-100 last:border-0 ${emphasis ? 'font-black' : ''}`}>
      <span className={`text-sm ${emphasis ? 'text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm md:text-base tabular-nums ${color || (emphasis ? 'text-slate-900' : 'text-slate-800')} font-black`}>{value}</span>
    </div>
  );
}

// ─── PrincipalVsInterestChart — area chart of amort over years ────────

interface PrincipalVsInterestChartProps {
  data: { year: number; principal: number; interest: number; balance: number }[];
  height?: number;
}

export function PrincipalVsInterestChart({ data, height = 280 }: PrincipalVsInterestChartProps) {
  // Convert to cumulative for the "how the balance shrinks" story.
  let cumPrincipal = 0;
  const chartData = data.map(d => {
    cumPrincipal += d.principal;
    return {
      year: d.year,
      'Cumulative Principal': Math.round(cumPrincipal),
      'Remaining Balance': Math.round(d.endingBalance),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
          </linearGradient>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4}/>
            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Year', position: 'insideBottom', offset: -5, fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: any) => formatCAD(v)} labelFormatter={l => `Year ${l}`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="Cumulative Principal" stroke="#10b981" fill="url(#pg)" strokeWidth={2} />
        <Area type="monotone" dataKey="Remaining Balance" stroke="#f43f5e" fill="url(#bg)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── PaymentBreakdownPie — where each monthly payment goes ────────────

interface PaymentBreakdownPieProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}

export function PaymentBreakdownPie({ data, height = 280 }: PaymentBreakdownPieProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) => `${((value / total) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip formatter={(v: any) => formatCAD(v)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── AmortizationTable — year-by-year breakdown ─────────────────────

interface AmortizationTableProps {
  years: { year: number; principal: number; interest: number; endingBalance: number }[];
  initialCollapsed?: boolean;
}

export function AmortizationTable({ years, initialCollapsed = true }: AmortizationTableProps) {
  const [open, setOpen] = React.useState(!initialCollapsed);
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-gray-50 transition text-left"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Schedule</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Amortization by Year — {years.length} yrs</h3>
        </div>
        <span className={`text-blue-600 text-2xl font-black transition ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3 md:p-4 text-left text-[10px] font-black uppercase tracking-widest">Year</th>
                <th className="p-3 md:p-4 text-right text-[10px] font-black uppercase tracking-widest">Principal</th>
                <th className="p-3 md:p-4 text-right text-[10px] font-black uppercase tracking-widest">Interest</th>
                <th className="p-3 md:p-4 text-right text-[10px] font-black uppercase tracking-widest">Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y, i) => (
                <tr key={y.year} className={i > 0 ? 'border-t border-gray-100' : ''}>
                  <td className="p-3 md:p-4 font-black text-slate-900">Year {y.year}</td>
                  <td className="p-3 md:p-4 text-right tabular-nums text-emerald-700">{formatCAD(y.principal)}</td>
                  <td className="p-3 md:p-4 text-right tabular-nums text-red-600">{formatCAD(y.interest)}</td>
                  <td className="p-3 md:p-4 text-right tabular-nums font-bold text-slate-900">{formatCAD(y.endingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
