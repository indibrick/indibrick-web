'use client';
import { useState } from 'react';
import { X, Loader2, Calendar as CalIcon } from 'lucide-react';

interface Props {
  onClose: () => void;
  onGenerate: (input: { keywords: string[]; startDate: string; daysCount?: number })
    => Promise<{ ok: boolean; error?: string; written?: number; costUsd?: number }>;
}

export default function GenerateCalendarModal({ onClose, onGenerate }: Props) {
  const [keywords, setKeywords] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const submit = async () => {
    const kw = keywords.split('\n').map(s => s.trim()).filter(Boolean);
    if (kw.length === 0) { setError('Add at least one keyword.'); return; }
    setBusy(true); setError(null); setFlash(null);
    const res = await onGenerate({ keywords: kw, startDate, daysCount: days });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'Generation failed.'); return; }
    setFlash(`Wrote ${res.written} items · $${(res.costUsd || 0).toFixed(4)}.`);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <CalIcon className="text-blue-600" size={18}/> Generate 30-day calendar
          </h3>
          <button onClick={onClose} disabled={busy} className="text-neutral-400 hover:text-neutral-900 disabled:opacity-50"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Seed keywords (one per line, up to 30)</span>
            <textarea value={keywords} onChange={e => setKeywords(e.target.value)} rows={8}
              placeholder={'first-time home buyer Ontario\nrenewal mortgage rates GTA\nHELOC vs refinance'}
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono text-xs"/>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Start date</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
            </label>
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Days</span>
              <input type="number" min={7} max={60} value={days} onChange={e => setDays(Number(e.target.value))}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
            </label>
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {flash && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{flash}</div>}
        </div>
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Uses Claude Sonnet — usually under $0.02.</span>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50">Cancel</button>
            <button onClick={submit} disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin"/> : <CalIcon size={14}/>}
              {busy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
