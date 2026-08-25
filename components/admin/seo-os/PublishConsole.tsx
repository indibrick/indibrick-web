'use client';
import { useState } from 'react';
import { Send, Loader2, Trash2, X, RotateCcw, ExternalLink, Globe, MapPin } from 'lucide-react';
import { usePublishQueue } from '@/hooks/usePublishQueue';
import GbpDraftModal from './GbpDraftModal';

const STATUS_TABS = [
  { value: '',          label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'publishing',label: 'Publishing' },
  { value: 'published', label: 'Published' },
  { value: 'failed',    label: 'Failed' },
  { value: 'canceled',  label: 'Canceled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-neutral-100 text-neutral-700',
  publishing: 'bg-amber-100 text-amber-800',
  published:  'bg-emerald-100 text-emerald-800',
  failed:     'bg-red-100 text-red-800',
  canceled:   'bg-neutral-100 text-neutral-500',
};

const DEST_META: Record<string, { label: string; icon: any }> = {
  native: { label: 'indibrick.ca', icon: Globe },
  gbp:    { label: 'GBP',          icon: MapPin },
};

export default function PublishConsole() {
  const [status, setStatus] = useState('');
  const { items, loading, error, publishNow, patch, remove } = usePublishQueue(status || undefined);
  const [pubbing, setPubbing] = useState<string | null>(null);
  const [gbpFor, setGbpFor] = useState<{ id: string; contentId: string } | null>(null);

  const handlePublish = async (id: string, destination: string, contentId: string) => {
    if (destination === 'gbp') {
      setGbpFor({ id, contentId });
      return;
    }
    setPubbing(id);
    const res = await publishNow(id);
    setPubbing(null);
    if (!res.ok) alert(res.error || 'Publish failed');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">Publish</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Approved content queued for publication. Native publishes are one-click; GBP is copy-to-clipboard so no Google Partner-API approval needed.
        </p>
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
          <Send className="mx-auto mb-2 text-neutral-400" size={28}/>
          <p className="text-sm font-medium text-neutral-900">Queue is empty.</p>
          <p className="text-xs text-neutral-500 mt-1">Open an approved article and hit &quot;Send to publish queue.&quot;</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-3 py-2 text-left">Content</th>
                <th className="px-3 py-2 text-left">Destination</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Live URL</th>
                <th className="px-3 py-2 text-right"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((r: any) => {
                const dest = DEST_META[r.destination] || { label: r.destination, icon: Globe };
                const DestIcon = dest.icon;
                return (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 text-xs text-neutral-600 font-mono">{r.contentId.slice(0, 12)}…</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-800">
                        <DestIcon size={12}/> {dest.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[r.status] || 'bg-neutral-100 text-neutral-700'}`}>
                        {r.status}
                      </span>
                      {r.failReason && <div className="text-[10px] text-red-700 mt-1">{r.failReason}</div>}
                    </td>
                    <td className="px-3 py-2">
                      {r.publishedUrl ? (
                        <a href={r.publishedUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 truncate max-w-xs">
                          <span className="truncate">{r.publishedUrl}</span> <ExternalLink size={11}/>
                        </a>
                      ) : <span className="text-xs text-neutral-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {r.status === 'pending' && (
                        <button onClick={() => handlePublish(r.id, r.destination, r.contentId)}
                          disabled={pubbing === r.id}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1 disabled:opacity-50 mr-1">
                          {pubbing === r.id ? <Loader2 size={11} className="animate-spin"/> : <Send size={11}/>}
                          {r.destination === 'gbp' ? 'Open draft' : 'Publish now'}
                        </button>
                      )}
                      {r.status === 'failed' && (
                        <button onClick={() => publishNow(r.id)}
                          className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 mr-2">
                          <RotateCcw size={11}/> Retry
                        </button>
                      )}
                      {(r.status === 'pending' || r.status === 'failed') && (
                        <button onClick={() => patch(r.id, { status: 'canceled' })}
                          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 mr-2">
                          <X size={11}/> Cancel
                        </button>
                      )}
                      {r.status !== 'publishing' && (
                        <button onClick={() => { if (confirm('Delete queue entry?')) remove(r.id); }}
                          className="text-red-600 hover:text-red-800" title="Delete"><Trash2 size={12}/></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {gbpFor && (
        <GbpDraftModal queueItemId={gbpFor.id} contentId={gbpFor.contentId}
          onClose={() => setGbpFor(null)}
          onDone={() => { /* usePublishQueue auto-refreshes via patch call inside modal */ }}/>
      )}
    </div>
  );
}
