'use client';
// AI Visibility dashboard.
//
// Top: last-run summary + Run now button.
// Middle: per-engine citation-rate trend chart (Recharts).
// Bottom: latest snapshot grid (query × engine) with linked source URLs.
// Right rail: tracked query editor.

import { useMemo, useState } from 'react';
import { Radio, Loader2, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAiCitations, useLastRun } from '@/hooks/useAiCitations';
import { useTrackerQueries } from '@/hooks/useTrackerQueries';
import TrackerQueryList from './TrackerQueryList';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';

const ENGINE_COLORS: Record<string, string> = {
  perplexity:          '#0ea5e9',
  claude:              '#a78bfa',
  gemini:              '#f59e0b',
  chatgpt:             '#10b981',
  google_ai_overviews: '#ef4444',
};

const ENGINE_LABELS: Record<string, string> = {
  perplexity:          'Perplexity',
  claude:              'Claude',
  gemini:              'Gemini',
  chatgpt:             'ChatGPT',
  google_ai_overviews: 'AI Overviews',
};

function money(v: number) { return `$${v.toFixed(v < 1 ? 3 : 2)}`; }

export default function AiVisibilityDashboard() {
  const { lastRun, configuredEngines, loading: runLoading, refresh: refreshLast, runNow } = useLastRun();
  const { items: citations, loading: citLoading, refresh: refreshCitations } = useAiCitations({ sinceDays: 30 });
  const { items: queries } = useTrackerQueries();
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // Build a per-day per-engine citation-rate series for the trend chart.
  const trend = useMemo(() => {
    const byDay = new Map<string, Record<string, { cited: number; total: number }>>();
    for (const c of citations) {
      const day = String(c.timestamp || '').slice(0, 10);
      if (!day) continue;
      const entry = byDay.get(day) || {};
      const e = entry[c.engine] || { cited: 0, total: 0 };
      e.total += 1;
      if (c.cited) e.cited += 1;
      entry[c.engine] = e;
      byDay.set(day, entry);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, engines]) => {
        const row: Record<string, any> = { day };
        for (const [engine, v] of Object.entries(engines)) {
          row[engine] = v.total > 0 ? Math.round((v.cited / v.total) * 100) : 0;
        }
        return row;
      });
  }, [citations]);

  // Latest snapshot per (query, engine): most recent row wins.
  const snapshot = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of citations) {
      const key = `${c.queryNormalized}::${c.engine}`;
      const prior = map.get(key);
      if (!prior || String(prior.timestamp || '') < String(c.timestamp || '')) map.set(key, c);
    }
    return map;
  }, [citations]);

  // Cost tallies.
  const totalCost7d = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400_000;
    return citations
      .filter((c: any) => new Date(c.timestamp || 0).getTime() >= cutoff)
      .reduce((s, c: any) => s + (Number(c.estimatedCostUsd) || 0), 0);
  }, [citations]);
  const totalCost30d = useMemo(() =>
    citations.reduce((s, c: any) => s + (Number(c.estimatedCostUsd) || 0), 0), [citations]);

  const doRun = async () => {
    setRunning(true); setRunError(null);
    const res = await runNow();
    setRunning(false);
    if (!res.ok) setRunError(res.error || 'Run failed.');
    else refreshCitations();
  };

  const allEngines = ['perplexity', 'claude', 'gemini', 'chatgpt', 'google_ai_overviews'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">AI Visibility</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Continuous citation tracking across ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { refreshLast(); refreshCitations(); }}
            className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100">
            <RefreshCw size={12}/> Refresh
          </button>
          <button onClick={doRun} disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
            {running ? <Loader2 size={14} className="animate-spin"/> : <Radio size={14}/>}
            {running ? 'Running (up to a few min)…' : 'Run tracker now'}
          </button>
        </div>
      </div>

      {/* Configured engines strip */}
      <div className="flex flex-wrap gap-2 text-xs">
        {allEngines.map(e => {
          const on = configuredEngines.includes(e);
          return (
            <span key={e} className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${on ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
              {on ? '●' : <AlertTriangle size={11}/>}
              {ENGINE_LABELS[e] || e}
              {!on && <span className="text-[10px]">no key</span>}
            </span>
          );
        })}
      </div>

      {/* Last-run summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Last run</div>
          <div className="mt-1 text-sm text-neutral-900">
            {lastRun ? new Date(lastRun.startedAt).toLocaleString() : 'Never'}
          </div>
          {lastRun && <div className="text-xs text-neutral-500 mt-0.5">{lastRun.queriesProcessed} queries</div>}
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Cost · 7d</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{money(totalCost7d)}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Cost · 30d</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{money(totalCost30d)}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Tracked queries</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{queries.filter((q: any) => q.isActive).length}</div>
          <div className="text-xs text-neutral-500 mt-0.5">of {queries.length} total</div>
        </div>
      </div>

      {runError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{runError}</div>}

      {/* Chart + query list side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Citation rate · 30d</h3>
            <span className="text-xs text-neutral-500">% of queries citing indibrick.ca per day</span>
          </div>
          <div className="mt-3 h-72">
            {citLoading && <div className="text-sm text-neutral-500">Loading…</div>}
            {!citLoading && trend.length === 0 && (
              <div className="text-sm text-neutral-500 text-center pt-16">
                No runs yet. Add tracked queries + hit &quot;Run tracker now.&quot;
              </div>
            )}
            {trend.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8"/>
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `${v}%`}/>
                  <Tooltip formatter={(v: any) => `${v}%`}/>
                  <Legend/>
                  {allEngines.map(e => (
                    <Line key={e} type="monotone" dataKey={e}
                      name={ENGINE_LABELS[e] || e}
                      stroke={ENGINE_COLORS[e]}
                      dot={false} strokeWidth={2}/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div>
          <TrackerQueryList configuredEngines={configuredEngines}/>
        </div>
      </div>

      {/* Latest snapshot */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Latest snapshot</h3>
          <p className="text-xs text-neutral-500 mt-1">Most recent result per query × engine.</p>
        </div>
        {queries.length === 0 && (
          <div className="p-6 text-center text-sm text-neutral-500">Add a tracked query to populate this table.</div>
        )}
        {queries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                <tr>
                  <th className="px-3 py-2 text-left">Query</th>
                  {allEngines.map(e => (
                    <th key={e} className="px-3 py-2 text-center">{ENGINE_LABELS[e]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {queries.map((q: any) => (
                  <tr key={q.id}>
                    <td className="px-3 py-2">
                      <div className="text-sm text-neutral-900 truncate max-w-xs">{q.label || q.query}</div>
                      <div className="text-[10px] text-neutral-500 truncate max-w-xs">{q.query}</div>
                    </td>
                    {allEngines.map(e => {
                      const key = `${String(q.query).toLowerCase()}::${e}`;
                      const row = snapshot.get(key);
                      if (!row) return <td key={e} className="px-3 py-2 text-center text-xs text-neutral-300">—</td>;
                      if (row.errored) {
                        return <td key={e} className="px-3 py-2 text-center"><span className="text-[10px] text-red-700">error</span></td>;
                      }
                      return (
                        <td key={e} className="px-3 py-2 text-center">
                          {row.cited ? (
                            <div>
                              <span className="inline-flex items-center rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest">cited</span>
                              {row.citedUrls?.length > 0 && (
                                <a href={row.citedUrls[0]} target="_blank" rel="noreferrer"
                                  className="mt-1 block text-[10px] text-blue-600 hover:text-blue-800 truncate inline-flex items-center gap-1">
                                  ↗
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-400">no</span>
                          )}
                        </td>
                      );
                    })}
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
