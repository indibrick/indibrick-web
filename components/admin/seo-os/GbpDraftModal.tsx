'use client';
// GBP draft modal — shapes the content into a GBP-post-shaped preview
// with a copy button + a "mark as posted" flow the operator uses AFTER
// they've pasted into the GBP web UI.

import { useEffect, useMemo, useState } from 'react';
import { X, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { authedGet, authedFetch } from '../../../lib/apiClient';
import { prepareGbpDraft, type GbpDraft } from '../../../lib/publishers/gbpDraft';

interface Props {
  queueItemId: string;
  contentId: string;
  onClose: () => void;
  onDone: () => void;   // called when the operator marks as posted (refetch queue)
}

export default function GbpDraftModal({ queueItemId, contentId, onClose, onDone }: Props) {
  const [content, setContent] = useState<any>(null);
  const [ctaOverride, setCtaOverride] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    authedGet(`/api/admin/seo-os/content/${encodeURIComponent(contentId)}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        setContent(data);
      })
      .catch((e: any) => setError(e?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  }, [contentId]);

  const draft: GbpDraft | null = useMemo(() => {
    if (!content) return null;
    return prepareGbpDraft(content, { ctaUrl: ctaOverride.trim() || undefined });
  }, [content, ctaOverride]);

  const copyToClipboard = async () => {
    if (!draft) return;
    const text = [draft.title, '', draft.body, draft.ctaUrl ? '\n' + draft.ctaUrl : ''].join('\n').trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { setError('Clipboard blocked — copy the text manually below.'); }
  };

  const markPosted = async () => {
    setBusy(true); setError(null);
    try {
      const nowIso = new Date().toISOString();
      // 1) Mark queue row published.
      const r = await authedFetch(`/api/admin/seo-os/publish-queue/${encodeURIComponent(queueItemId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published', publishedAt: nowIso }),
      });
      if (!r.ok) throw new Error(`Queue update ${r.status}`);
      // 2) Stamp seoContent.publishedTo[] so the surface tracks it.
      //    Use the content PATCH endpoint which permits status but not
      //    publishedTo — for now we do that via a dedicated helper if
      //    it exists, otherwise skip and the queue row is enough for
      //    the console. Keeping it simple: skip the array update here;
      //    the queue row is the source of truth for GBP.
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Mark-as-posted failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[95vh] rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            GBP post draft
            <a href="https://business.google.com/posts" target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
              Open GBP <ExternalLink size={11}/>
            </a>
          </h3>
          <button onClick={onClose} disabled={busy} className="text-neutral-400 hover:text-neutral-900 disabled:opacity-50"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {loading && <div className="text-sm text-neutral-500">Loading…</div>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {draft && (
            <>
              {draft.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                  {draft.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1"><AlertTriangle size={11} className="mt-0.5"/> {w}</div>
                  ))}
                </div>
              )}

              <div className="rounded-lg border border-neutral-200 bg-white">
                <div className="border-b border-neutral-100 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Title (summary)</span>
                  <span className={`text-[10px] ${draft.charCounts.title > 58 ? 'text-red-600' : 'text-neutral-500'}`}>{draft.charCounts.title}/58</span>
                </div>
                <div className="px-3 py-2 text-sm text-neutral-900">{draft.title}</div>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-white">
                <div className="border-b border-neutral-100 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Body</span>
                  <span className={`text-[10px] ${draft.charCounts.body > 1500 ? 'text-red-600' : 'text-neutral-500'}`}>{draft.charCounts.body}/1500</span>
                </div>
                <div className="px-3 py-2 text-sm text-neutral-900 whitespace-pre-wrap max-h-64 overflow-y-auto">{draft.body}</div>
              </div>

              <label className="block text-sm">
                <span className="text-neutral-700 font-medium">CTA URL</span>
                <input type="url" value={ctaOverride || draft.ctaUrl || ''}
                  onChange={e => setCtaOverride(e.target.value)}
                  placeholder="https://indibrick.ca/…"
                  className="mt-1 w-full p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 font-mono text-xs"/>
              </label>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                <div className="font-medium">Manual paste flow:</div>
                <ol className="list-decimal list-inside mt-1 space-y-0.5">
                  <li>Click <strong>Copy post text</strong> below</li>
                  <li>Open your Google Business Profile → Posts → Add update</li>
                  <li>Paste the text, attach a photo if you have one, set the CTA URL</li>
                  <li>Publish on Google, then click <strong>Mark as posted</strong> back here</li>
                </ol>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-2">
          <button onClick={copyToClipboard} disabled={!draft}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-neutral-700 hover:bg-neutral-100 disabled:opacity-50">
            {copied ? <Check size={12} className="text-emerald-600"/> : <Copy size={12}/>}
            {copied ? 'Copied' : 'Copy post text'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50">Cancel</button>
            <button onClick={markPosted} disabled={busy || !draft}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
              {busy ? 'Saving…' : 'Mark as posted'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
