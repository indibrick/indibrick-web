'use client';
import { useState } from 'react';
import { X, Loader2, Gauge } from 'lucide-react';

interface Props {
  onClose: () => void;
  onRun: (url: string, skipAeo: boolean) => Promise<{ ok: boolean; error?: string; result?: any; auditId?: string }>;
}

export default function AuditRunModal({ onClose, onRun }: Props) {
  const [url, setUrl] = useState('');
  const [skipAeo, setSkipAeo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    if (!url.trim()) { setError('URL required.'); return; }
    setBusy(true); setError(null); setResult(null);
    const res = await onRun(url.trim(), skipAeo);
    setBusy(false);
    if (!res.ok) { setError(res.error || 'Audit failed.'); return; }
    setResult(res.result);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[95vh] rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Gauge className="text-blue-600" size={18}/> Run audit
          </h3>
          <button onClick={onClose} disabled={busy} className="text-neutral-400 hover:text-neutral-900 disabled:opacity-50"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">URL to audit</span>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://indibrick.ca/real-estate/toronto/condo/under-500k"
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono text-xs"/>
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            <input type="checkbox" checked={skipAeo} onChange={e => setSkipAeo(e.target.checked)}/>
            Skip AEO scoring (skips the Claude call — faster + free, but GEO sub-score is heuristic only)
          </label>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {result && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <div className="text-sm font-medium text-emerald-900">
                Overall score: <span className="text-2xl">{result.overallScore}</span>/100
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {Object.entries(result.subScores).map(([k, v]) => (
                  <div key={k} className="text-neutral-700">
                    <div className="text-[10px] font-black uppercase tracking-widest">{k}</div>
                    <div className="text-neutral-900">{String(v)}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-neutral-600">
                {result.issues?.length || 0} issues · {result.spawnedCalendarItemIds?.length || 0} fix items added to calendar
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50">Close</button>
          <button onClick={submit} disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin"/> : <Gauge size={14}/>}
            {busy ? 'Running (10-20s)…' : 'Run audit'}
          </button>
        </div>
      </div>
    </div>
  );
}
