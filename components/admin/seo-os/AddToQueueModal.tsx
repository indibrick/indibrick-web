'use client';
import { useState } from 'react';
import { X, Send, Loader2, Globe, MapPin } from 'lucide-react';

interface Props {
  contentId: string;
  contentTitle: string;
  onClose: () => void;
  onEnqueue: (contentId: string, destinations: string[])
    => Promise<{ ok: boolean; error?: string; enqueued?: number; skipped?: Array<{ destination: string; reason: string }> }>;
}

const OPTIONS = [
  {
    value: 'native',
    label: 'Native indibrick.ca',
    icon: Globe,
    body: 'Publishes as a blog post on the site. One-click, automated.',
  },
  {
    value: 'gbp',
    label: 'Google Business Profile',
    icon: MapPin,
    body: 'Generates a GBP post draft you paste into the GBP web UI (no API access needed).',
  },
];

export default function AddToQueueModal({ contentId, contentTitle, onClose, onEnqueue }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['native']));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const toggle = (v: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0) { setError('Pick at least one destination.'); return; }
    setBusy(true); setError(null); setFlash(null);
    const res = await onEnqueue(contentId, Array.from(selected));
    setBusy(false);
    if (!res.ok) { setError(res.error || 'Enqueue failed.'); return; }
    const parts = [`Enqueued ${res.enqueued || 0}`];
    if (res.skipped && res.skipped.length > 0) parts.push(`${res.skipped.length} skipped (already queued)`);
    setFlash(parts.join(' · '));
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Send className="text-blue-600" size={18}/> Send to publish queue
          </h3>
          <button onClick={onClose} disabled={busy} className="text-neutral-400 hover:text-neutral-900 disabled:opacity-50"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-neutral-600">
            <span className="text-neutral-500">Article:</span> <span className="font-medium text-neutral-900">{contentTitle}</span>
          </div>
          <div className="space-y-2">
            {OPTIONS.map(o => {
              const on = selected.has(o.value);
              return (
                <label key={o.value}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${on ? 'border-blue-600 bg-blue-50' : 'border-neutral-200 hover:border-neutral-400 bg-white'}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(o.value)} className="mt-1"/>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <o.icon size={14} className={on ? 'text-blue-600' : 'text-neutral-500'}/>
                      <span className="font-medium text-neutral-900">{o.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-neutral-600">{o.body}</div>
                  </div>
                </label>
              );
            })}
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {flash && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{flash}</div>}
        </div>
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={busy || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
            Enqueue
          </button>
        </div>
      </div>
    </div>
  );
}
