'use client';

// Campaigns tab: template library on the left, mass-send composer on
// the right. Everything happens in one screen so the flow from
// "pick template → filter recipients → preview → send" is one click
// per step.

import { useState } from 'react';
import { Plus, Mail, MessageSquare, Send, Eye, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { authedPost } from '../../lib/apiClient';
import { useToast } from '../ui/ToastProvider';
import { EmptyState, LoadingState } from '../ui/StateFeedback';
import TemplateEditor from './TemplateEditor';
import { TEMPLATE_CATEGORIES, type EmailTemplateDoc } from '../../lib/emailTemplateShape';

interface CampaignsPanelProps {
  currentUid: string | undefined;
  displayName: string;
}

interface PreviewResult {
  channel: 'email' | 'sms';
  recipientCount: number;
  samples: Array<{ referralId: string; clientName?: string; clientEmail?: string; clientPhone?: string; subject?: string; body?: string }>;
  templateName?: string;
}

export default function CampaignsPanel({ currentUid, displayName }: CampaignsPanelProps) {
  const toast = useToast();
  const { templates, loading, create, update, remove } = useEmailTemplates(currentUid);
  const [editing, setEditing] = useState<null | { mode: 'new' } | { mode: 'edit'; tmpl: EmailTemplateDoc }>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Recipient filter state.
  const [filter, setFilter] = useState<{ status: string; leadTag: string; dealType: string }>({ status: '', leadTag: '', dealType: '' });
  const [brokerageName, setBrokerageName] = useState('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastBatch, setLastBatch] = useState<{ id: string; queued: number } | null>(null);

  const active = templates.find(t => t.id === selectedId) || null;

  const runPreview = async () => {
    if (!active) { toast.warn('Pick a template first.'); return; }
    setPreviewing(true);
    setPreview(null);
    setLastBatch(null);
    try {
      const res = await authedPost('/api/partner/mass-send/preview', {
        templateId: active.id,
        recipientFilter: {
          status: filter.status || undefined,
          leadTag: filter.leadTag || undefined,
          dealType: filter.dealType || undefined,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error('Preview failed', data.error); return; }
      setPreview(data);
    } catch (e: any) { toast.error('Network error', e?.message); }
    finally { setPreviewing(false); }
  };

  const runSend = async () => {
    if (!active || !preview) return;
    if (!window.confirm(`Send this to ${preview.recipientCount} recipient${preview.recipientCount === 1 ? '' : 's'}?`)) return;
    setSending(true);
    try {
      const res = await authedPost('/api/partner/mass-send', {
        templateId: active.id,
        recipientFilter: {
          status: filter.status || undefined,
          leadTag: filter.leadTag || undefined,
          dealType: filter.dealType || undefined,
        },
        senderName: displayName,
        brokerageName,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error('Send failed', data.error); return; }
      setLastBatch({ id: data.batchId, queued: data.queued });
      setPreview(null);
      toast.success(`Queued ${data.queued} send${data.queued === 1 ? '' : 's'}.`, 'Delivery is handled by the transactional email pipe.');
    } catch (e: any) { toast.error('Network error', e?.message); }
    finally { setSending(false); }
  };

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Campaigns</h2>
          <p className="text-xs text-gray-500 mt-0.5">Pick a template, filter recipients, preview, send. CASL footer auto-appended.</p>
        </div>
        <button onClick={() => setEditing({ mode: 'new' })}
          className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm">
          <Plus size={12}/> New template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        {/* Template library */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Your templates</p>
          </div>
          <div className="max-h-[520px] overflow-y-auto custom-scrollbar p-2">
            {loading && <LoadingState label="Loading templates"/>}
            {!loading && templates.length === 0 && (
              <EmptyState
                icon={Mail}
                title="No templates yet"
                description="Build a template — welcome email, renewal nudge, listing alert, closing checklist. Reuse across campaigns."
                action={{ label: 'New template', onClick: () => setEditing({ mode: 'new' }) }}
                compact
              />
            )}
            {!loading && templates.filter(t => !t.archivedAt).map(t => {
              const isSelected = t.id === selectedId;
              const catLabel = TEMPLATE_CATEGORIES.find(c => c.value === t.category)?.label || t.category;
              return (
                <div key={t.id}
                  onClick={() => { setSelectedId(t.id); setPreview(null); setLastBatch(null); }}
                  className={`p-3 rounded-xl border mb-2 cursor-pointer transition ${isSelected ? 'bg-slate-50 border-slate-900' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {t.channel === 'sms' ? <MessageSquare size={11} className="text-slate-500"/> : <Mail size={11} className="text-slate-500"/>}
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{catLabel}</span>
                    {(t.usageCount ?? 0) > 0 && <span className="text-[9px] font-bold text-gray-400">· sent {t.usageCount}x</span>}
                  </div>
                  <p className="text-sm font-black text-slate-900 truncate">{t.name}</p>
                  {t.subject && <p className="text-[11px] text-gray-500 truncate mt-0.5">{t.subject}</p>}
                  <button onClick={(e) => { e.stopPropagation(); setEditing({ mode: 'edit', tmpl: t }); }}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 mt-2">
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Composer */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4">
          {!active && (
            <EmptyState
              icon={Send}
              title="Pick a template on the left"
              description="Or create a new one, then filter recipients + preview before sending."
              compact
            />
          )}
          {active && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {active.channel === 'sms' ? <MessageSquare size={14} className="text-slate-700"/> : <Mail size={14} className="text-slate-700"/>}
                <p className="text-sm font-black text-slate-900">{active.name}</p>
                {active.subject && <span className="text-[11px] text-gray-500">· "{active.subject}"</span>}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Filter recipients (all optional)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Status</span>
                    <input type="text" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}
                      placeholder="e.g. Contacted"
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                  </label>
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Lead tag</span>
                    <input type="text" value={filter.leadTag} onChange={e => setFilter({ ...filter, leadTag: e.target.value })}
                      placeholder="e.g. Hot"
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                  </label>
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Deal type</span>
                    <select value={filter.dealType} onChange={e => setFilter({ ...filter, dealType: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                      <option value="">Any</option>
                      <option>Mortgage</option><option>Real Estate</option><option>Insurance</option><option>Legal</option>
                    </select>
                  </label>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">Funded + Lost deals excluded automatically. Cap: 500 recipients per send.</p>
              </div>

              <div>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Brokerage name (for CASL footer)</span>
                  <input type="text" value={brokerageName} onChange={e => setBrokerageName(e.target.value)}
                    placeholder="e.g. Sutton Group West Coast"
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={runPreview} disabled={previewing}
                  className="bg-white border border-gray-200 hover:border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition disabled:opacity-50">
                  {previewing ? <Loader2 size={11} className="animate-spin"/> : <Eye size={11}/>} Preview
                </button>
                {preview && (
                  <button onClick={runSend} disabled={sending || preview.recipientCount === 0}
                    className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm disabled:opacity-50">
                    {sending ? <Loader2 size={11} className="animate-spin"/> : <Send size={11}/>}
                    Send to {preview.recipientCount}
                  </button>
                )}
              </div>

              {preview && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                    Preview · {preview.recipientCount} match{preview.recipientCount === 1 ? '' : 'es'}
                  </p>
                  {preview.recipientCount === 0 && <p className="text-xs text-red-700">No recipients match — loosen the filter.</p>}
                  {preview.samples.map((s, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 text-xs">
                      <p className="font-bold text-slate-900">{s.clientName || '(no name)'} · <span className="text-gray-500 font-medium">{s.clientEmail || s.clientPhone}</span></p>
                      {s.subject && <p className="mt-1 text-slate-700 font-medium">Subject: {s.subject}</p>}
                      <p className="mt-1 text-slate-600 whitespace-pre-wrap font-mono text-[10.5px] max-h-32 overflow-y-auto">
                        {(s.body || '').slice(0, 500)}{(s.body || '').length > 500 ? '…' : ''}
                      </p>
                    </div>
                  ))}
                  {preview.samples.length < preview.recipientCount && (
                    <p className="text-[10px] text-gray-500">…plus {preview.recipientCount - preview.samples.length} more not shown.</p>
                  )}
                </div>
              )}

              {lastBatch && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle size={14}/>
                  Queued {lastBatch.queued} send{lastBatch.queued === 1 ? '' : 's'} · batch <code className="bg-white border border-emerald-200 rounded px-1">{lastBatch.id}</code>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <TemplateEditor
          initial={editing.mode === 'edit' ? editing.tmpl : undefined}
          onSave={async payload => {
            const res = editing.mode === 'edit'
              ? await update(editing.tmpl.id, payload)
              : await create(payload);
            if (res.ok) setEditing(null);
            return res;
          }}
          onCancel={() => setEditing(null)}
          onDelete={editing.mode === 'edit' ? async () => { await remove(editing.tmpl.id); setEditing(null); } : undefined}
        />
      )}

      <p className="text-[10px] text-gray-400 text-center">
        Recipient scope is your own book. Funded + Lost deals excluded. Rate limit: 500 recipients per hour per sender.
      </p>
    </div>
  );
}
