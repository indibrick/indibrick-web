'use client';
import { useState } from 'react';
import { Plus, FileText, Trash2, DollarSign } from 'lucide-react';
import { useSeoContent } from '@/hooks/useSeoContent';
import type { SeoContentStatus } from '@/lib/seoContentShape';
import GenerateContentModal from './GenerateContentModal';
import ContentEditor from './ContentEditor';

const STATUS_TABS: Array<{ value: SeoContentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  in_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  published: 'bg-blue-100 text-blue-800',
};

export default function ContentList() {
  const [statusFilter, setStatusFilter] = useState<SeoContentStatus | 'all'>('all');
  const { items, loading, error, generate, update, remove } = useSeoContent(statusFilter);
  const [genOpen, setGenOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const totalCost = items.reduce((sum, i: any) => sum + (Number(i.generationCostUsd) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Content</h1>
          <p className="mt-1 text-sm text-neutral-500">AI-drafted articles + review pipeline. Draft → In review → Approved → Published.</p>
        </div>
        <button onClick={() => setGenOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Plus size={14}/> Generate article
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="inline-flex bg-white border border-neutral-200 rounded-xl p-1">
          {STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setStatusFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${statusFilter === t.value ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-neutral-500 inline-flex items-center gap-1">
          <DollarSign size={11}/> Generation spend in view: ${totalCost.toFixed(2)}
        </span>
      </div>

      {loading && <div className="text-sm text-neutral-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <FileText className="mx-auto mb-2 text-neutral-400" size={28}/>
          <p className="text-sm font-medium text-neutral-900">No articles yet.</p>
          <p className="text-xs text-neutral-500 mt-1">Generate your first — Claude drafts it in under 30 seconds.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Target</th>
                <th className="px-3 py-2 text-right">GEO</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((i: any) => (
                <tr key={i.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <button onClick={() => setEditId(i.id)}
                      className="font-medium text-neutral-900 hover:text-blue-600 text-left">
                      {i.title || '(untitled)'}
                    </button>
                    <div className="text-[10px] text-neutral-400 font-mono truncate max-w-md">{i.slug}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[i.status] || 'bg-neutral-100 text-neutral-700'}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-600">
                    {[i.target?.city, i.target?.propertyType, i.target?.priceRange].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">{i.geoReadinessScore ?? '—'}</td>
                  <td className="px-3 py-2 text-right text-xs text-neutral-500">
                    {typeof i.generationCostUsd === 'number' ? `$${i.generationCostUsd.toFixed(4)}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {i.status !== 'published' && (
                      <button onClick={() => { if (confirm(`Delete "${i.title}"?`)) remove(i.id); }}
                        className="text-red-600 hover:text-red-800"><Trash2 size={14}/></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {genOpen && <GenerateContentModal onClose={() => setGenOpen(false)} onGenerate={generate}/>}
      {editId && <ContentEditor id={editId} onClose={() => setEditId(null)} onUpdate={update}/>}
    </div>
  );
}
