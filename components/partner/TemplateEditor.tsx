'use client';

// Editor for a single email/SMS template.

import { useMemo, useState } from 'react';
import { X, Save, Trash2, AlertCircle, Mail, MessageSquare } from 'lucide-react';
import { TEMPLATE_CATEGORIES, type EmailTemplateDoc, type TemplateChannel } from '../../lib/emailTemplateShape';
import { extractMergeTags } from '../../lib/mergeTags';
import { useToast } from '../ui/ToastProvider';

interface TemplateEditorProps {
  initial?: Partial<EmailTemplateDoc>;
  onSave: (payload: Partial<EmailTemplateDoc>) => Promise<{ ok: boolean; errors?: string[] }>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

interface EditState {
  name: string;
  category: string;
  channel: TemplateChannel;
  subject: string;
  body: string;
}

function fromInitial(initial?: Partial<EmailTemplateDoc>): EditState {
  return {
    name: initial?.name || '',
    category: initial?.category || 'nurture',
    channel: (initial?.channel as TemplateChannel) || 'email',
    subject: initial?.subject || '',
    body: initial?.body || '',
  };
}

export default function TemplateEditor({ initial, onSave, onCancel, onDelete }: TemplateEditorProps) {
  const toast = useToast();
  const [state, setState] = useState<EditState>(fromInitial(initial));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isNew = !initial?.id;

  const mergeTags = useMemo(() => extractMergeTags(state.body + ' ' + state.subject), [state.body, state.subject]);

  const save = async () => {
    setSaving(true);
    setErrors([]);
    const res = await onSave(state);
    setSaving(false);
    if (!res.ok) { setErrors(res.errors || ['Save failed']); return; }
    toast.success(isNew ? 'Template created.' : 'Template saved.');
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl border border-gray-200 shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">{isNew ? 'New template' : 'Edit template'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Use <code className="bg-gray-100 px-1 rounded">{'{{clientName}}'}</code> style tags to personalize.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-slate-900 p-1"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 custom-scrollbar">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-2 flex items-center gap-1"><AlertCircle size={11}/> Please fix</p>
              <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <section className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-3">
              <label>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Name (internal)</span>
                <input type="text" value={state.name} onChange={e => setState({ ...state, name: e.target.value })}
                  placeholder="e.g. Renewal 90-day nudge"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
              </label>
              <label>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Category</span>
                <select value={state.category} onChange={e => setState({ ...state, category: e.target.value })}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                  {TEMPLATE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <label>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Channel</span>
                <div className="grid grid-cols-2 gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                  <button type="button" onClick={() => setState({ ...state, channel: 'email' })}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition ${state.channel === 'email' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
                    <Mail size={11}/> Email
                  </button>
                  <button type="button" onClick={() => setState({ ...state, channel: 'sms' })}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition ${state.channel === 'sms' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
                    <MessageSquare size={11}/> SMS
                  </button>
                </div>
              </label>
            </div>

            {state.channel === 'email' && (
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Subject</span>
                <input type="text" value={state.subject} onChange={e => setState({ ...state, subject: e.target.value })}
                  placeholder="e.g. Your renewal is coming up, {{clientName}}"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
              </label>
            )}
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                Body {state.channel === 'email' ? '(HTML)' : '(plain text — kept under 160 chars per SMS segment)'}
              </span>
              <textarea rows={state.channel === 'email' ? 10 : 5} value={state.body}
                onChange={e => setState({ ...state, body: e.target.value })}
                placeholder={state.channel === 'email'
                  ? '<p>Hi {{clientName}},</p><p>Your policy renews in 90 days...</p>'
                  : 'Hi {{clientName}}, quick heads-up about your file...'}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900 resize-y font-mono" />
            </label>
          </section>

          {mergeTags.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <p className="font-bold mb-1">Merge tags this template uses ({mergeTags.length})</p>
              <div className="flex flex-wrap gap-1">
                {mergeTags.map(t => (
                  <code key={t} className="bg-white border border-blue-200 rounded px-1.5 py-0.5 text-[11px]">{`{{${t}}}`}</code>
                ))}
              </div>
              <p className="text-[10px] mt-2 opacity-75">Recipients missing any of these fields get an empty string in that slot.</p>
            </div>
          )}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700">
            <p className="font-bold mb-1">CASL note</p>
            <p>Every email you mass-send auto-appends a compliant footer with your name, brokerage, and an unsubscribe link — you don't need to add it here.</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <div>
            {onDelete && !isNew && (
              <button
                onClick={async () => { if (window.confirm('Archive this template?')) await onDelete(); }}
                className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-800 flex items-center gap-1">
                <Trash2 size={11}/> Archive
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} disabled={saving}
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2">Cancel</button>
            <button onClick={save} disabled={saving}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm disabled:opacity-50">
              <Save size={11}/> {saving ? 'Saving…' : (isNew ? 'Create template' : 'Save changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
