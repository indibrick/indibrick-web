'use client';

// Drip sequence editor — pick templates, set day offsets. Linear only
// (branching + open-triggered come with open tracking, a later wave).

import { useEffect, useMemo, useState } from 'react';
import { X, Save, Trash2, AlertCircle, Plus, ChevronUp, ChevronDown, Clock, Mail } from 'lucide-react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import type { DripSequenceDoc, DripStep } from '../../lib/dripShape';
import { useToast } from '../ui/ToastProvider';

interface DripSequenceEditorProps {
  currentUid: string | undefined;
  initial?: Partial<DripSequenceDoc>;
  onSave: (payload: Partial<DripSequenceDoc>) => Promise<{ ok: boolean; errors?: string[] }>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

interface EditState {
  name: string;
  description: string;
  enabled: boolean;
  respectSuppression: boolean;
  steps: DripStep[];
}

function fromInitial(initial?: Partial<DripSequenceDoc>): EditState {
  return {
    name: initial?.name || '',
    description: initial?.description || '',
    enabled: initial?.enabled !== false,
    respectSuppression: initial?.respectSuppression !== false,
    steps: Array.isArray(initial?.steps) && initial!.steps.length > 0
      ? initial!.steps.map(s => ({ ...s }))
      : [{ templateId: '', waitDaysAfterEnroll: 0, enabled: true }],
  };
}

export default function DripSequenceEditor({ currentUid, initial, onSave, onCancel, onDelete }: DripSequenceEditorProps) {
  const toast = useToast();
  const { templates } = useEmailTemplates(currentUid);
  const [state, setState] = useState<EditState>(fromInitial(initial));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isNew = !initial?.id;

  const emailTemplates = useMemo(() => templates.filter(t => t.channel === 'email' && !t.archivedAt), [templates]);

  // Reset editor when initial changes (mode switch).
  useEffect(() => { setState(fromInitial(initial)); }, [initial?.id]);

  const updateStep = (i: number, patch: Partial<DripStep>) =>
    setState(s => ({ ...s, steps: s.steps.map((st, idx) => idx === i ? { ...st, ...patch } : st) }));
  const addStep = () => {
    const lastWait = state.steps.length > 0 ? state.steps[state.steps.length - 1].waitDaysAfterEnroll : 0;
    setState(s => ({ ...s, steps: [...s.steps, { templateId: '', waitDaysAfterEnroll: lastWait + 3, enabled: true }] }));
  };
  const removeStep = (i: number) => setState(s => ({ ...s, steps: s.steps.filter((_, idx) => idx !== i) }));
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= state.steps.length) return;
    const next = [...state.steps];
    [next[i], next[j]] = [next[j], next[i]];
    setState(s => ({ ...s, steps: next }));
  };

  const save = async () => {
    setSaving(true);
    setErrors([]);
    const res = await onSave(state);
    setSaving(false);
    if (!res.ok) { setErrors(res.errors || ['Save failed']); return; }
    toast.success(isNew ? 'Sequence created.' : 'Sequence saved.');
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl border border-gray-200 shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">{isNew ? 'New drip sequence' : 'Edit drip sequence'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Send a series of emails over days after enrollment.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-slate-900 p-1"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50 custom-scrollbar">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-2 flex items-center gap-1"><AlertCircle size={11}/> Please fix</p>
              <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <section className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <label>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Name</span>
                <input type="text" value={state.name} onChange={e => setState(s => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Renewal nurture 4-touch"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
              </label>
              <label>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Description (optional)</span>
                <input type="text" value={state.description} onChange={e => setState(s => ({ ...s, description: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={state.enabled} onChange={e => setState(s => ({ ...s, enabled: e.target.checked }))}
                    className="w-4 h-4 accent-slate-900"/>
                  <span className="font-bold text-slate-900">Enabled</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={state.respectSuppression} onChange={e => setState(s => ({ ...s, respectSuppression: e.target.checked }))}
                    className="w-4 h-4 accent-slate-900"/>
                  <span className="font-bold text-slate-900">Respect suppression list</span>
                  <span className="text-xs text-gray-500">— strongly recommended</span>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-white p-4 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Steps · fires days after enrollment</h3>
              <button onClick={addStep}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus size={11}/> Add step
              </button>
            </div>

            {emailTemplates.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mb-3">
                No email templates yet — create at least one in the Campaigns tab before building a drip.
              </div>
            )}

            <div className="space-y-2">
              {state.steps.map((s, i) => {
                const tmpl = emailTemplates.find(t => t.id === s.templateId);
                return (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_120px_auto] gap-2 items-end">
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 pt-1">
                        <Clock size={10}/> Day
                      </div>
                      <label>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Template</span>
                        <select value={s.templateId} onChange={e => updateStep(i, { templateId: e.target.value })}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                          <option value="">Choose an email template…</option>
                          {emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject.slice(0, 40)}` : ''}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Wait days</span>
                        <input type="number" min={0} max={365}
                          value={s.waitDaysAfterEnroll}
                          onChange={e => updateStep(i, { waitDaysAfterEnroll: Number(e.target.value) })}
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
                      </label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-slate-900 disabled:opacity-30"><ChevronUp size={13}/></button>
                        <button onClick={() => moveStep(i, 1)} disabled={i === state.steps.length - 1} className="p-1 text-gray-400 hover:text-slate-900 disabled:opacity-30"><ChevronDown size={13}/></button>
                        <button onClick={() => removeStep(i)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={13}/></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pl-9">
                      <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={s.enabled !== false} onChange={e => updateStep(i, { enabled: e.target.checked })}
                          className="w-4 h-4 accent-slate-900"/>
                        <span className="font-bold text-slate-900">Send this step</span>
                      </label>
                      {tmpl && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><Mail size={10}/> {tmpl.name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-[10px] text-gray-500">
              First step at day 0 fires immediately on enrollment. Steps at the same day fire in list order.
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <div>
            {onDelete && !isNew && (
              <button
                onClick={async () => { if (window.confirm('Archive this sequence? Active enrollments will complete their current step then cancel on the next runner sweep.')) await onDelete(); }}
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
              <Save size={11}/> {saving ? 'Saving…' : (isNew ? 'Create sequence' : 'Save changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
