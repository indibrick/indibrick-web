'use client';
// Split-view editor: metadata on the left, HTML body on the right.
// Status transition buttons in the footer.

import { useEffect, useState } from 'react';
import { X, Save, Loader2, CheckCircle, RotateCcw, Send } from 'lucide-react';
import { useSeoContentDoc } from '@/hooks/useSeoContent';
import { usePublishQueue } from '@/hooks/usePublishQueue';
import type { SeoContentDoc, SeoContentStatus } from '@/lib/seoContentShape';
import AddToQueueModal from './AddToQueueModal';

interface Props {
  id: string;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<SeoContentDoc>) => Promise<{ ok: boolean; error?: string }>;
}

const STATUS_LABELS: Record<SeoContentStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  approved: 'Approved',
  published: 'Published',
};
const STATUS_COLORS: Record<SeoContentStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  in_review: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  published: 'bg-blue-100 text-blue-800',
};

export default function ContentEditor({ id, onClose, onUpdate }: Props) {
  const { item, loading, error } = useSeoContentDoc(id);
  const { enqueue } = usePublishQueue();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setSlug(item.slug || '');
      setExcerpt(item.excerpt || '');
      setBodyHtml(item.bodyHtml || '');
    }
  }, [item]);

  if (loading) return <FullscreenLoader label="Loading…"/>;
  if (error) return <ErrorScreen msg={error} onClose={onClose}/>;
  if (!item) return null;

  const status = (item.status || 'draft') as SeoContentStatus;
  const isPublished = status === 'published';

  const save = async (extraPatch: Partial<SeoContentDoc> = {}) => {
    setSaving(true); setSaveError(null);
    const res = await onUpdate(id, { title, slug, excerpt, bodyHtml, ...extraPatch });
    setSaving(false);
    if (!res.ok) { setSaveError(res.error || 'Save failed.'); return false; }
    setFlash('Saved.');
    setTimeout(() => setFlash(null), 1800);
    return true;
  };

  const transition = async (next: SeoContentStatus) => {
    const ok = await save({ status: next });
    if (ok) setFlash(`Moved to ${STATUS_LABELS[next]}.`);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/80 flex items-stretch">
      <div className="bg-white w-full h-full flex flex-col">
        <div className="border-b border-neutral-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <span className="truncate text-sm text-neutral-600">{title || 'Untitled'}</span>
            {item.aiModel && <span className="text-[10px] text-neutral-400 font-mono">{item.aiModel}</span>}
          </div>
          <div className="flex items-center gap-2">
            {flash && <span className="text-xs text-emerald-700">{flash}</span>}
            {saveError && <span className="text-xs text-red-700">{saveError}</span>}
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-900 p-1"><X size={18}/></button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] overflow-hidden">
          {/* LEFT: metadata */}
          <aside className="border-r border-neutral-200 overflow-y-auto p-5 space-y-4 bg-neutral-50">
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Title</span>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                disabled={isPublished}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 disabled:bg-neutral-100"/>
            </label>
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Slug</span>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                disabled={isPublished}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono text-xs disabled:bg-neutral-100"/>
            </label>
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Excerpt / meta description</span>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
                rows={3}
                className="mt-1 w-full p-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
              <span className="text-[10px] text-neutral-500">{excerpt.length}/160</span>
            </label>

            <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1 text-xs">
              <div className="font-black uppercase tracking-widest text-neutral-500">Target</div>
              {item.target?.keywordPrimary && <div>Keyword: <span className="text-neutral-900">{item.target.keywordPrimary}</span></div>}
              {item.target?.city && <div>City: {item.target.city}</div>}
              {item.target?.propertyType && <div>Type: {item.target.propertyType}</div>}
              {item.target?.priceRange && <div>Price: {item.target.priceRange}</div>}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1 text-xs">
              <div className="font-black uppercase tracking-widest text-neutral-500">AEO signal</div>
              <div>GEO readiness: <span className="text-neutral-900">{item.geoReadinessScore ?? '—'}</span> / 100</div>
              <div>Direct-answer blocks: <span className="text-neutral-900">{item.aeoDirectAnswerBlocks ?? '—'}</span></div>
            </div>

            {typeof item.generationCostUsd === 'number' && (
              <div className="rounded-lg border border-neutral-200 bg-white p-3 text-[11px] text-neutral-500">
                Generation cost: ${item.generationCostUsd.toFixed(4)} · {item.generationInputTokens || 0} in / {item.generationOutputTokens || 0} out
              </div>
            )}
          </aside>

          {/* RIGHT: body HTML */}
          <div className="overflow-hidden flex flex-col">
            <div className="border-b border-neutral-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-50">
              Body HTML
            </div>
            <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
              disabled={isPublished}
              className="flex-1 p-4 text-sm text-neutral-900 font-mono outline-none resize-none disabled:bg-neutral-50"
              placeholder="<p>Direct-answer opener…</p>"/>
          </div>
        </div>

        <div className="border-t border-neutral-200 px-6 py-3 flex items-center justify-between bg-white">
          <div className="text-xs text-neutral-500">
            {isPublished ? 'Published — read-only.' : 'Edits save on demand; status moves through review gates.'}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => save()} disabled={saving || isPublished}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-neutral-700 hover:bg-neutral-100 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Save
            </button>
            {status === 'draft' && (
              <button onClick={() => transition('in_review')} disabled={saving}
                className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                Send to review
              </button>
            )}
            {status === 'in_review' && (
              <>
                <button onClick={() => transition('draft')} disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-neutral-700 hover:bg-neutral-100 disabled:opacity-50">
                  <RotateCcw size={12}/> Back to draft
                </button>
                <button onClick={() => transition('approved')} disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                  <CheckCircle size={12}/> Approve
                </button>
              </>
            )}
            {status === 'approved' && (
              <button onClick={() => setQueueOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                <Send size={12}/> Send to publish queue
              </button>
            )}
            {status === 'published' && (
              <span className="text-xs text-blue-700">Published — see Publish tab for the live URL.</span>
            )}
          </div>
        </div>
      </div>

      {queueOpen && item && (
        <AddToQueueModal
          contentId={id}
          contentTitle={item.title || 'Untitled'}
          onClose={() => setQueueOpen(false)}
          onEnqueue={enqueue}
        />
      )}
    </div>
  );
}

function FullscreenLoader({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/80 flex items-center justify-center text-white gap-2">
      <Loader2 size={16} className="animate-spin"/> {label}
    </div>
  );
}

function ErrorScreen({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md">
        <div className="text-red-700 text-sm">{msg}</div>
        <button onClick={onClose} className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-xs text-white">Close</button>
      </div>
    </div>
  );
}
