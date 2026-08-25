'use client';
// Calendar view — grid grouped by day. Simple list-per-day is easier
// to skim than a full month grid at this stage; can grow into a
// month grid later once volume warrants.

import { useMemo, useState } from 'react';
import { Plus, Sparkles, Check, Trash2, FileText } from 'lucide-react';
import { useSeoCalendar } from '@/hooks/useSeoCalendar';
import GenerateCalendarModal from './GenerateCalendarModal';

const TYPE_COLORS: Record<string, string> = {
  blog: 'bg-blue-100 text-blue-800',
  gbp_post: 'bg-purple-100 text-purple-800',
  fix: 'bg-red-100 text-red-800',
  refresh: 'bg-amber-100 text-amber-800',
  backlink: 'bg-emerald-100 text-emerald-800',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-neutral-600',
  in_progress: 'text-amber-700',
  completed: 'text-emerald-700 line-through',
  skipped: 'text-neutral-400 line-through',
};

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}
function isoIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CalendarView() {
  const [from, setFrom] = useState(isoToday());
  const [to, setTo] = useState(isoIn(30));
  const { items, loading, error, generate, update, remove, spawnContent } = useSeoCalendar({ from, to });
  const [genOpen, setGenOpen] = useState(false);
  const [spawning, setSpawning] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const i of items) {
      const arr = map.get(i.scheduledDate) || [];
      arr.push(i);
      map.set(i.scheduledDate, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Calendar</h1>
          <p className="mt-1 text-sm text-neutral-500">30-day SEO action plan — blog, GBP posts, fixes, refreshes, backlinks.</p>
        </div>
        <button onClick={() => setGenOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Sparkles size={14}/> Generate 30-day plan
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs text-neutral-500 inline-flex items-center gap-1">
          From
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="p-1.5 border border-neutral-300 rounded text-xs text-neutral-900"/>
        </label>
        <label className="text-xs text-neutral-500 inline-flex items-center gap-1">
          To
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="p-1.5 border border-neutral-300 rounded text-xs text-neutral-900"/>
        </label>
      </div>

      {loading && <div className="text-sm text-neutral-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <Plus className="mx-auto mb-2 text-neutral-400" size={28}/>
          <p className="text-sm font-medium text-neutral-900">No items in this range.</p>
          <p className="text-xs text-neutral-500 mt-1">Generate a 30-day plan from a keyword list to seed the schedule.</p>
        </div>
      )}

      <div className="space-y-4">
        {byDay.map(([day, dayItems]) => (
          <div key={day} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            <div className="px-4 py-2 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <div className="text-sm font-medium text-neutral-900">
                {new Date(day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-widest">{dayItems.length} items</div>
            </div>
            <ul className="divide-y divide-neutral-100">
              {dayItems.map((it: any) => (
                <li key={it.id} className="px-4 py-3 flex items-center gap-3 hover:bg-neutral-50">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${TYPE_COLORS[it.type] || 'bg-neutral-100 text-neutral-700'}`}>
                    {it.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${STATUS_COLORS[it.status] || ''}`}>{it.title}</div>
                    {it.brief && <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{it.brief}</div>}
                    {it.linkedContentId && <div className="text-[10px] text-blue-600 mt-1">Linked draft {it.linkedContentId.slice(0, 8)}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(it.type === 'blog' || it.type === 'gbp_post') && !it.linkedContentId && (
                      <button
                        onClick={async () => {
                          setSpawning(it.id);
                          const res = await spawnContent(it.id);
                          setSpawning(null);
                          if (!res.ok) alert(res.error || 'Spawn failed');
                        }}
                        disabled={spawning === it.id}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="Generate content draft from this item">
                        <FileText size={12}/> {spawning === it.id ? '…' : 'Draft'}
                      </button>
                    )}
                    {it.status !== 'completed' && (
                      <button onClick={() => update(it.id, { status: 'completed' })}
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900" title="Mark complete">
                        <Check size={12}/>
                      </button>
                    )}
                    <button onClick={() => { if (confirm('Delete this item?')) remove(it.id); }}
                      className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {genOpen && <GenerateCalendarModal onClose={() => setGenOpen(false)} onGenerate={generate}/>}
    </div>
  );
}
