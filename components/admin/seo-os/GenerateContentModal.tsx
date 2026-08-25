'use client';
// Generate-content dialog. Blocking modal — Claude call takes 10-30
// seconds on a long article, and we want the operator focused on the
// result.

import { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';

interface Props {
  onClose: () => void;
  onGenerate: (input: Record<string, any>) => Promise<{ ok: boolean; error?: string; id?: string; costUsd?: number }>;
}

export default function GenerateContentModal({ onClose, onGenerate }: Props) {
  const [keyword, setKeyword] = useState('');
  const [secondary, setSecondary] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState('');
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!keyword.trim()) { setError('Primary keyword required.'); return; }
    setBusy(true); setError(null);
    const input = {
      keywordPrimary: keyword.trim(),
      keywordSecondary: secondary.split(',').map(s => s.trim()).filter(Boolean),
      city: city.trim() || undefined,
      propertyType: propertyType.trim() || undefined,
      priceRange: priceRange.trim() || undefined,
      competitorUrls: competitorUrls.split('\n').map(s => s.trim()).filter(Boolean),
      extraContext: extra.trim() || undefined,
    };
    const res = await onGenerate(input);
    setBusy(false);
    if (!res.ok) setError(res.error || 'Generation failed.');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[95vh] rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <Sparkles className="text-blue-600" size={18}/> Generate SEO article
          </h3>
          <button onClick={onClose} disabled={busy} className="text-neutral-400 hover:text-neutral-900 disabled:opacity-50"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Primary keyword *</span>
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder='e.g. "first-time home buyer Ontario"'
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
          </label>

          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Secondary keywords <span className="text-neutral-400 font-normal">(comma-separated, optional)</span></span>
            <input type="text" value={secondary} onChange={e => setSecondary(e.target.value)}
              placeholder="CMHC insurance, stress test, RRSP HBP"
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">City</span>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                placeholder="toronto"
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
            </label>
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Property type</span>
              <input type="text" value={propertyType} onChange={e => setPropertyType(e.target.value)}
                placeholder="condo"
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
            </label>
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Price range</span>
              <input type="text" value={priceRange} onChange={e => setPriceRange(e.target.value)}
                placeholder="under-500k"
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Competitor URLs to reference <span className="text-neutral-400 font-normal">(one per line, optional)</span></span>
            <textarea value={competitorUrls} onChange={e => setCompetitorUrls(e.target.value)}
              rows={3}
              placeholder="https://competitor.ca/page"
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono text-xs"/>
          </label>

          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Extra context <span className="text-neutral-400 font-normal">(optional)</span></span>
            <textarea value={extra} onChange={e => setExtra(e.target.value)}
              rows={2}
              placeholder="e.g. angle to emphasize, audience, tone notes"
              className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
          </label>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Uses Claude Opus — ~$0.02–$0.10 per article.</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50">Cancel</button>
            <button onClick={submit} disabled={busy || !keyword.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
              {busy ? 'Generating (10-30s)…' : 'Generate draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
