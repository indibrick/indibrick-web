'use client';
// CRUD for the tracked query set. Per-query engine toggles.

import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { useTrackerQueries } from '@/hooks/useTrackerQueries';
import type { CitationEngine, QueryCategory } from '@/lib/aiCitationQueryShape';

const ENGINES: Array<{ value: CitationEngine; label: string }> = [
  { value: 'perplexity',          label: 'Perplexity' },
  { value: 'claude',              label: 'Claude' },
  { value: 'gemini',              label: 'Gemini' },
  { value: 'chatgpt',             label: 'ChatGPT' },
  { value: 'google_ai_overviews', label: 'AI Overviews' },
];

const CATEGORY_COLORS: Record<QueryCategory, string> = {
  brand: 'bg-blue-100 text-blue-800',
  keyword: 'bg-emerald-100 text-emerald-800',
  competitor: 'bg-purple-100 text-purple-800',
};

interface Props { configuredEngines: string[]; }

export default function TrackerQueryList({ configuredEngines }: Props) {
  const { items, loading, error, create, update, remove } = useTrackerQueries();
  const [showAdd, setShowAdd] = useState(false);
  const [newQuery, setNewQuery] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<QueryCategory>('brand');
  const [newEngines, setNewEngines] = useState<Set<CitationEngine>>(new Set(['perplexity', 'claude']));
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setLocalError(null);
    const res = await create({
      query: newQuery,
      label: newLabel || undefined,
      category: newCategory,
      isActive: true,
      enabledEngines: Array.from(newEngines),
    });
    setBusy(false);
    if (!res.ok) { setLocalError(res.error || 'Create failed.'); return; }
    setShowAdd(false); setNewQuery(''); setNewLabel('');
  };

  const configured = new Set(configuredEngines);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Tracked queries</h3>
          <p className="text-xs text-neutral-500 mt-1">{items.length} total · {items.filter(i => i.isActive).length} active</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
          <Plus size={12}/> Add query
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 space-y-3">
          <input value={newQuery} onChange={e => setNewQuery(e.target.value)}
            placeholder='e.g. "best mortgage broker in Vaughan"'
            className="w-full p-2 border border-neutral-300 rounded text-sm text-neutral-900"/>
          <div className="grid grid-cols-2 gap-2">
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Optional friendly label"
              className="p-2 border border-neutral-300 rounded text-sm text-neutral-900"/>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value as QueryCategory)}
              className="p-2 border border-neutral-300 rounded text-sm bg-white text-neutral-900">
              <option value="brand">Brand</option>
              <option value="keyword">Keyword</option>
              <option value="competitor">Competitor</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {ENGINES.map(e => {
              const on = newEngines.has(e.value);
              const isConfigured = configured.has(e.value);
              return (
                <label key={e.value}
                  className={`inline-flex items-center gap-1 text-xs rounded border px-2 py-1 cursor-pointer ${on ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-neutral-300 text-neutral-700'} ${!isConfigured ? 'opacity-60' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => {
                    setNewEngines(prev => {
                      const next = new Set(prev);
                      if (next.has(e.value)) next.delete(e.value); else next.add(e.value);
                      return next;
                    });
                  }}/>
                  {e.label}
                  {!isConfigured && <AlertTriangle size={10} className="text-amber-600" title="no API key set"/>}
                </label>
              );
            })}
          </div>
          {localError && <div className="text-xs text-red-700">{localError}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-xs text-neutral-600 hover:text-neutral-900">Cancel</button>
            <button onClick={submit} disabled={busy || !newQuery.trim()}
              className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading && <div className="p-4 text-sm text-neutral-500">Loading…</div>}
      {error && <div className="p-4 text-sm text-red-600">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="p-6 text-center text-sm text-neutral-500">
          No tracked queries yet — add your brand terms + a few target keywords to start.
        </div>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-neutral-100">
          {items.map((q: any) => (
            <li key={q.id} className="px-4 py-3 flex items-center gap-3">
              <button onClick={() => update(q.id, { isActive: !q.isActive })}
                className={q.isActive ? 'text-emerald-600' : 'text-neutral-300'}
                title={q.isActive ? 'Active' : 'Paused'}>
                {q.isActive ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 truncate">{q.label || q.query}</div>
                <div className="text-xs text-neutral-500 truncate">{q.query}</div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${CATEGORY_COLORS[q.category as QueryCategory] || 'bg-neutral-100 text-neutral-700'}`}>
                    {q.category}
                  </span>
                  {(q.enabledEngines || []).map((e: string) => (
                    <span key={e} className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${configured.has(e) ? 'border-neutral-300 text-neutral-600' : 'border-amber-300 text-amber-700'}`}>
                      {e.replace('google_ai_overviews', 'aio')}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => { if (confirm(`Delete "${q.label || q.query}"?`)) remove(q.id); }}
                className="text-red-600 hover:text-red-800"><Trash2 size={12}/></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
