'use client';
import { useState } from 'react';
import { Gauge, Plus, AlertTriangle } from 'lucide-react';
import { useSeoAudits } from '@/hooks/useSeoAudits';
import { bandForScore } from '@/lib/seoAuditShape';
import AuditRunModal from './AuditRunModal';

const BAND_COLOR: Record<string, string> = {
  excellent: 'text-emerald-700',
  good: 'text-blue-700',
  'needs-work': 'text-amber-700',
  broken: 'text-red-700',
};

export default function AuditsList() {
  const { items, loading, error, runAudit } = useSeoAudits();
  const [runOpen, setRunOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Audits</h1>
          <p className="mt-1 text-sm text-neutral-500">
            5-dimension SEO + GEO audit per URL. Issues auto-spawn fix items on the calendar.
          </p>
        </div>
        <button onClick={() => setRunOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Plus size={14}/> Run audit
        </button>
      </div>

      {loading && <div className="text-sm text-neutral-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <Gauge className="mx-auto mb-2 text-neutral-400" size={28}/>
          <p className="text-sm font-medium text-neutral-900">No audits yet.</p>
          <p className="text-xs text-neutral-500 mt-1">Point it at any URL — starting with your programmatic pages.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-3 py-2 text-left">URL</th>
                <th className="px-3 py-2 text-right">Overall</th>
                <th className="px-3 py-2 text-right">Schema</th>
                <th className="px-3 py-2 text-right">Meta</th>
                <th className="px-3 py-2 text-right">Index</th>
                <th className="px-3 py-2 text-right">Speed</th>
                <th className="px-3 py-2 text-right">GEO</th>
                <th className="px-3 py-2 text-right">Issues</th>
                <th className="px-3 py-2 text-left">Run at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((a: any) => {
                const band = bandForScore(a.overallScore || 0);
                return (
                  <tr key={a.id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 text-xs font-mono text-neutral-800 truncate max-w-md">{a.urlPath || a.url}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${BAND_COLOR[band]}`}>{a.overallScore}</td>
                    <td className="px-3 py-2 text-right text-xs">{a.subScores?.schema ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-xs">{a.subScores?.metadata ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-xs">{a.subScores?.indexability ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-xs">{a.subScores?.speed ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-xs">{a.subScores?.geoReadiness ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-xs inline-flex items-center gap-1 justify-end">
                      {(a.issues?.length || 0) > 0 && <AlertTriangle size={11} className="text-amber-600"/>}
                      {a.issues?.length || 0}
                    </td>
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {a.runAt ? new Date(a.runAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {runOpen && <AuditRunModal onClose={() => setRunOpen(false)} onRun={runAudit}/>}
    </div>
  );
}
