'use client';
import { useState } from 'react';
import { Link2, Plus, Trash2, ExternalLink, Check, X } from 'lucide-react';
import { useBacklinks } from '@/hooks/useBacklinks';
import DiscoverBacklinksModal from './DiscoverBacklinksModal';

const STATUS_TABS = [
  { value: '',          label: 'All' },
  { value: 'new',       label: 'New' },
  { value: 'approved',  label: 'Approved' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'landed',    label: 'Landed' },
  { value: 'rejected',  label: 'Rejected' },
];

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-neutral-100 text-neutral-700',
  approved:  'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  landed:    'bg-emerald-100 text-emerald-800',
  rejected:  'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<string, string> = {
  guest_post: 'Guest post',
  resource_link: 'Resource link',
  citation: 'Citation',
  directory: 'Directory',
};

export default function BacklinkList() {
  const [status, setStatus] = useState('');
  const { items, loading, error, discover, update, remove } = useBacklinks({ status: status || undefined });
  const [discOpen, setDiscOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Backlinks</h1>
          <p className="mt-1 text-sm text-neutral-500">Prospected targets with topic-fit + anchor-safety + page-relevance scores. Human review before outreach.</p>
        </div>
        <button onClick={() => setDiscOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Plus size={14}/> Discover prospects
        </button>
      </div>

      <div className="inline-flex bg-white border border-neutral-200 rounded-xl p-1">
        {STATUS_TABS.map(t => (
          <button key={t.value} onClick={() => setStatus(t.value)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${status === t.value ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-neutral-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <Link2 className="mx-auto mb-2 text-neutral-400" size={28}/>
          <p className="text-sm font-medium text-neutral-900">No prospects here.</p>
          <p className="text-xs text-neutral-500 mt-1">Point Claude at a topic and it&apos;ll search the web for real candidates.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-3 py-2 text-left">Prospect</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-right">Fit</th>
                <th className="px-3 py-2 text-right">Anchor</th>
                <th className="px-3 py-2 text-right">Page rel.</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((b: any) => (
                <tr key={b.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <a href={b.url} target="_blank" rel="noreferrer"
                      className="text-neutral-900 hover:text-blue-600 inline-flex items-center gap-1 truncate max-w-md">
                      <span className="truncate">{b.domain}</span> <ExternalLink size={11} className="text-neutral-400"/>
                    </a>
                    {b.agentNotes && <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{b.agentNotes}</div>}
                    <div className="text-[10px] text-neutral-400 mt-1">→ {b.targetOurUrl}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-600">{TYPE_LABELS[b.prospectType] || b.prospectType}</td>
                  <td className="px-3 py-2 text-right text-xs">{b.topicFitScore}</td>
                  <td className="px-3 py-2 text-right text-xs">{b.anchorSafetyScore}</td>
                  <td className="px-3 py-2 text-right text-xs">{b.pageRelevanceScore}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[b.reviewStatus] || 'bg-neutral-100 text-neutral-700'}`}>
                      {b.reviewStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {b.reviewStatus === 'new' && (
                      <>
                        <button onClick={() => update(b.id, { reviewStatus: 'approved' })}
                          className="text-emerald-700 hover:text-emerald-900 mr-2" title="Approve"><Check size={14}/></button>
                        <button onClick={() => update(b.id, { reviewStatus: 'rejected' })}
                          className="text-red-600 hover:text-red-800 mr-2" title="Reject"><X size={14}/></button>
                      </>
                    )}
                    {b.reviewStatus === 'approved' && (
                      <button onClick={() => update(b.id, { reviewStatus: 'contacted' })}
                        className="text-xs text-amber-700 hover:text-amber-900 mr-2">Mark contacted</button>
                    )}
                    {b.reviewStatus === 'contacted' && (
                      <button onClick={() => update(b.id, { reviewStatus: 'landed' })}
                        className="text-xs text-emerald-700 hover:text-emerald-900 mr-2">Mark landed</button>
                    )}
                    <button onClick={() => { if (confirm('Delete prospect?')) remove(b.id); }}
                      className="text-red-600 hover:text-red-800"><Trash2 size={12}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {discOpen && <DiscoverBacklinksModal onClose={() => setDiscOpen(false)} onDiscover={discover}/>}
    </div>
  );
}
