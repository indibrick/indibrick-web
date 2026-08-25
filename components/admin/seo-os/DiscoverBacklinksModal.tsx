'use client';
import { useState } from 'react';
import { X, Loader2, Link2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onDiscover: (input: { ourUrl: string; topic: string; maxProspects?: number })
    => Promise<{ ok: boolean; error?: string; written?: number; duplicatesSkipped?: number; costUsd?: number }>;
}

export default function DiscoverBacklinksModal({ onClose, onDiscover }: Props) {
  const [ourUrl, setOurUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [max, setMax] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const submit = async () => {
    if (!ourUrl.trim() || !topic.trim()) { setError('URL and topic required.'); return; }
    setBusy(true); setError(null); setFlash(null);
    const res = await onDiscover({ ourUrl: ourUrl.trim(), topic: topic.trim(), maxProspects: max });
    setBusy(false);
    if (!res.ok) { setError(res.error || 'Discovery failed.'); return; }
    setFlash(`Wrote ${res.written} · skipped ${res.duplicatesSkipped} dupes · $${(res.costUsd || 0).toFixed(4)}.`);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Link2 className="text-blue-600" size={18}/> Discover backlinks
          </h3>
          <button onClick={onClose} disabled={busy} className="text-neutral-400 hover:text-neutral-900 disabled:opacity-50"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Our page (target for the link)</span>
            <input type="url" value={ourUrl} onChange={e => setOurUrl(e.target.value)}
              placeholder="https://indibrick.ca/guides/first-time-home-buyer-ontario-2026"
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono text-xs"/>
          </label>
          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Topic</span>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Ontario first-time home buyer program"
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
          </label>
          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Max prospects</span>
            <input type="number" min={1} max={20} value={max} onChange={e => setMax(Number(e.target.value))}
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
          </label>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {flash && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{flash}</div>}
        </div>
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Uses Claude Opus + web search — ~$0.05–$0.15.</span>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50">Cancel</button>
            <button onClick={submit} disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin"/> : <Link2 size={14}/>}
              {busy ? 'Searching…' : 'Discover'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
