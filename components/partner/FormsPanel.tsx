'use client';

// Forms dashboard: list + create + edit.

import { useState } from 'react';
import { Plus, FileText, CheckCircle, ExternalLink, Inbox } from 'lucide-react';
import { useForms } from '../../hooks/useForms';
import FormBuilder from './FormBuilder';
import FormSubmissionsPanel from './FormSubmissionsPanel';
import { EmptyState, LoadingState } from '../ui/StateFeedback';
import type { FormDoc } from '../../lib/formShape';

interface FormsPanelProps { isAdmin: boolean; }

function formatTs(ts: any): string {
  if (!ts) return '—';
  const ms = typeof ts === 'string' ? new Date(ts).getTime()
    : (typeof ts?.toMillis === 'function' ? ts.toMillis() : NaN);
  if (isNaN(ms)) return '—';
  return new Date(ms).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function FormsPanel({ isAdmin }: FormsPanelProps) {
  const { forms, loading, create, update, remove } = useForms();
  const [editing, setEditing] = useState<null | { mode: 'new' } | { mode: 'edit'; form: FormDoc }>(null);
  const [viewingSubs, setViewingSubs] = useState<null | { formId: string; formSlug: string }>(null);

  if (!isAdmin) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-xl mx-auto">
        <FileText size={22} className="text-blue-600 mx-auto mb-2"/>
        <p className="text-lg font-black text-slate-900">Forms — admin-only for now</p>
        <p className="text-sm text-gray-500 mt-2">Team-owner authoring lands with multi-tenant billing.</p>
      </div>
    );
  }

  const enabledCount = forms.filter(f => f.enabled).length;
  const totalSubmits = forms.reduce((acc, f) => acc + (f.submitCount || 0), 0);

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Live',       value: enabledCount,       sub: 'accepting submits' },
          { label: 'Submits',    value: totalSubmits,       sub: 'lifetime' },
          { label: 'Total',      value: forms.length,       sub: 'all forms' },
          { label: 'Archived',   value: forms.filter(f => (f as any).archivedAt).length, sub: 'inactive' },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-gray-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{s.value}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Lead-capture forms</h2>
          <p className="text-xs text-gray-500 mt-0.5">Every submission creates a referral + fires the rules engine + any matching workflows.</p>
        </div>
        <button onClick={() => setEditing({ mode: 'new' })}
          className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm">
          <Plus size={12}/> New form
        </button>
      </div>

      {loading && <LoadingState label="Loading forms"/>}

      {!loading && forms.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No forms yet"
          description="Build a form, share the /f/<slug> URL, and route submissions into a workflow."
          action={{ label: 'New form', onClick: () => setEditing({ mode: 'new' }) }}
        />
      )}

      {!loading && forms.length > 0 && (
        <div className="space-y-3">
          {forms.map(f => (
            <div key={f.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${f.enabled ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {f.enabled ? 'LIVE' : ((f as any).archivedAt ? 'ARCHIVED' : 'DRAFT')}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">/f/{f.slug}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">· {f.dealType || 'Mortgage'}</span>
                    {f.autoTag && <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">· tag: {f.autoTag}</span>}
                  </div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight truncate">{f.name}</h3>
                  <div className="flex items-center gap-4 flex-wrap text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">
                    <span>{(f.fields?.length || 0)} field{(f.fields?.length || 0) === 1 ? '' : 's'}</span>
                    <span>· {f.submitCount || 0} submit{f.submitCount === 1 ? '' : 's'}</span>
                    <span>· Updated {formatTs(f.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`/f/${f.slug}`} target="_blank" rel="noreferrer"
                    className="p-2 text-slate-500 hover:text-slate-900" title="Open public form">
                    <ExternalLink size={14}/>
                  </a>
                  <button onClick={() => setViewingSubs({ formId: f.id, formSlug: f.slug })}
                    className="p-2 text-slate-500 hover:text-slate-900 flex items-center gap-1" title="View submissions">
                    <Inbox size={14}/>
                    {(f.submitCount || 0) > 0 && <span className="text-[10px] font-black">{f.submitCount}</span>}
                  </button>
                  <button onClick={() => setEditing({ mode: 'edit', form: f })}
                    className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <FormBuilder
              initial={editing.mode === 'edit' ? editing.form : undefined}
              onSave={async (payload) => {
                const res = editing.mode === 'edit'
                  ? await update(editing.form.id, payload)
                  : await create(payload);
                if (res.ok) setEditing(null);
                return res;
              }}
              onCancel={() => setEditing(null)}
              onDelete={editing.mode === 'edit' ? async () => { await remove(editing.form.id); setEditing(null); } : undefined}
            />
          </div>
        </div>
      )}

      {viewingSubs && (
        <FormSubmissionsPanel
          formId={viewingSubs.formId}
          formSlug={viewingSubs.formSlug}
          onClose={() => setViewingSubs(null)}
        />
      )}

      {!loading && forms.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
          <CheckCircle size={14} />
          <span>Form submissions create a referral automatically, which fires the rules engine + any workflows you've built.</span>
        </div>
      )}
    </div>
  );
}
