'use client';

// Form-based workflow editor (Wave 2 MVP).
//
// Drag-drop canvas comes later — same underlying data model so we can
// upgrade the UI without touching the interpreter. This form gets you
// 90% of GHL's authoring capability at 10% of the frontend cost.
//
// Sections:
//   1. Basics — name, description, enabled
//   2. When — trigger + trigger-specific config
//   3. Only if — conditions (AND-only in v1; OR groups later)
//   4. Then — actions
//   5. Guardrails — debounce, daily-bucket

import { useMemo, useState } from 'react';
import { X, Plus, AlertCircle, Zap, Filter, Sparkles, Save, Trash2, ChevronDown } from 'lucide-react';
import {
  TRIGGER_TYPES, COMPARISON_OPERATORS, CONDITION_FIELDS, ACTION_TYPES,
} from '../../lib/workflowShape';
import type { WorkflowDoc } from '../../hooks/useWorkflows';
import WorkflowDryRunPanel from './WorkflowDryRunPanel';

interface WorkflowBuilderProps {
  initial?: Partial<WorkflowDoc>;
  onSave: (payload: Partial<WorkflowDoc>) => Promise<{ ok: boolean; errors?: string[] }>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

// Local editing shape — everything optional so partial edits work.
interface EditState {
  name: string;
  description: string;
  enabled: boolean;
  triggerType: string;
  triggerConfig: Record<string, any>;
  conditions: Array<{ field: string; operator: string; value?: any }>;
  actions: Array<{ type: string; config: Record<string, any> }>;
  debounceMinutes: number;
  dailyBucket: boolean;
}

const EMPTY_STATE: EditState = {
  name: '',
  description: '',
  enabled: true,
  triggerType: 'referral_status_changed',
  triggerConfig: {},
  conditions: [],
  actions: [{ type: 'notify_user', config: { severity: 'info', recipientUid: '{{assignedAgentId}}', title: '', body: '' } }],
  debounceMinutes: 0,
  dailyBucket: false,
};

function fromInitial(initial?: Partial<WorkflowDoc>): EditState {
  if (!initial) return { ...EMPTY_STATE };
  return {
    name: initial.name || '',
    description: initial.description || '',
    enabled: initial.enabled !== false,
    triggerType: initial.triggerType || 'referral_status_changed',
    triggerConfig: initial.triggerConfig || {},
    conditions: Array.isArray(initial.conditions) ? initial.conditions.map(c => ({ ...c })) : [],
    actions: Array.isArray(initial.actions) && initial.actions.length > 0
      ? initial.actions.map(a => ({ ...a, config: { ...(a.config || {}) } }))
      : [{ ...EMPTY_STATE.actions[0] }],
    debounceMinutes: typeof initial.debounceMinutes === 'number' ? initial.debounceMinutes : 0,
    dailyBucket: initial.dailyBucket === true,
  };
}

const SECTION_HEADER = 'text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2';

// Small label + input row helper.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}

// ─── Action-specific config forms ──────────────────────────────────

function ActionConfig({
  action, onChange,
}: {
  action: EditState['actions'][number];
  onChange: (next: EditState['actions'][number]) => void;
}) {
  const setCfg = (key: string, value: any) => onChange({ ...action, config: { ...action.config, [key]: value } });

  if (action.type === 'notify_user') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Recipient UID or {{assignedAgentId}}">
          <input type="text" value={action.config.recipientUid || '{{assignedAgentId}}'} onChange={e => setCfg('recipientUid', e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
        <Field label="Severity">
          <select value={action.config.severity || 'info'} onChange={e => setCfg('severity', e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
            <option value="info">Info</option><option value="warn">Warn</option><option value="urgent">Urgent</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Title">
            <input type="text" value={action.config.title || ''} onChange={e => setCfg('title', e.target.value)}
              placeholder="e.g. New Firm Sale from {{clientName}}"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Body">
            <textarea value={action.config.body || ''} onChange={e => setCfg('body', e.target.value)}
              rows={2} placeholder="Use {{clientName}}, {{status}}, {{loanAmount}}, etc."
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900 resize-none" />
          </Field>
        </div>
      </div>
    );
  }

  if (action.type === 'send_email') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <Field label="Recipient email or {{clientEmail}}">
            <input type="text" value={Array.isArray(action.config.to) ? action.config.to.join(', ') : (action.config.to || '{{clientEmail}}')}
              onChange={e => setCfg('to', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Subject">
            <input type="text" value={action.config.subject || ''} onChange={e => setCfg('subject', e.target.value)}
              placeholder="Update on your file, {{clientName}}"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="HTML body">
            <textarea value={action.config.html || action.config.body || ''} onChange={e => setCfg('html', e.target.value)}
              rows={4}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900 resize-none font-mono" />
          </Field>
        </div>
      </div>
    );
  }

  if (action.type === 'create_task') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Assignee UID or {{assignedAgentId}}">
          <input type="text" value={action.config.assigneeId || '{{assignedAgentId}}'} onChange={e => setCfg('assigneeId', e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
        <Field label="Due in (days from now)">
          <input type="number" min={0} max={90} value={action.config.dueOffsetDays ?? 1} onChange={e => setCfg('dueOffsetDays', Number(e.target.value))}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Task description">
            <input type="text" value={action.config.description || ''} onChange={e => setCfg('description', e.target.value)}
              placeholder="Call {{clientName}} about {{status}}"
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
          </Field>
        </div>
      </div>
    );
  }

  if (action.type === 'set_status') {
    return (
      <div className="grid grid-cols-1 gap-3">
        <Field label="Move the deal to this status">
          <input type="text" value={action.config.value || ''} onChange={e => setCfg('value', e.target.value)}
            placeholder="e.g. Contacted, Underwriting, Firm / Conditional"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
        <p className="text-[10px] text-gray-500 font-medium">
          Must exactly match one of your pipeline stages. Interpolates <code className="bg-gray-100 px-1 rounded">{"{{fields}}"}</code>.
        </p>
      </div>
    );
  }

  if (action.type === 'add_tag') {
    return (
      <div className="grid grid-cols-1 gap-3">
        <Field label="Lead tag to apply">
          <input type="text" value={action.config.value || ''} onChange={e => setCfg('value', e.target.value)}
            placeholder="e.g. Hot, Needs follow-up"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
      </div>
    );
  }

  if (action.type === 'webhook') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
        <Field label="Webhook URL (https)">
          <input type="text" value={action.config.url || ''} onChange={e => setCfg('url', e.target.value)}
            placeholder="https://your-endpoint.example.com/hook"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900 font-mono" />
        </Field>
        <Field label="Method">
          <select value={action.config.method || 'POST'} onChange={e => setCfg('method', e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
            <option value="POST">POST</option><option value="PUT">PUT</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <p className="text-[10px] text-gray-500 font-medium">
            Default payload = the full referral snapshot. Requests are HMAC-signed with <code className="bg-gray-100 px-1 rounded">X-Indibrick-Signature</code> when <code className="bg-gray-100 px-1 rounded">WEBHOOK_SIGNING_SECRET</code> env is set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800 flex items-center gap-2">
      <AlertCircle size={14} /> This action type isn't wired to the engine yet — save will be blocked. Pick a supported action.
    </div>
  );
}

// ─── Trigger-specific config forms ─────────────────────────────────

function TriggerConfig({ state, setState }: { state: EditState; setState: (next: EditState) => void }) {
  const setCfg = (key: string, value: any) =>
    setState({ ...state, triggerConfig: { ...state.triggerConfig, [key]: value } });

  if (state.triggerType === 'referral_status_changed') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Only when moving FROM (optional)">
          <input type="text" value={state.triggerConfig.fromStatus || ''} onChange={e => setCfg('fromStatus', e.target.value)}
            placeholder="e.g. Contacted"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
        <Field label="Only when moving TO (optional)">
          <input type="text" value={state.triggerConfig.toStatus || ''} onChange={e => setCfg('toStatus', e.target.value)}
            placeholder="e.g. Firm Sale"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
      </div>
    );
  }
  if (state.triggerType === 'referral_field_changed') {
    return (
      <div className="grid grid-cols-1 gap-3">
        <Field label="Watch field (dot-path)">
          <input type="text" value={state.triggerConfig.field || ''} onChange={e => setCfg('field', e.target.value)}
            placeholder="e.g. loanAmount"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
      </div>
    );
  }
  if (state.triggerType === 'lead_tag_added') {
    return (
      <div className="grid grid-cols-1 gap-3">
        <Field label="Only for this tag (optional)">
          <input type="text" value={state.triggerConfig.tag || ''} onChange={e => setCfg('tag', e.target.value)}
            placeholder="e.g. Hot"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
        </Field>
      </div>
    );
  }
  return null;
}

// ─── Main editor ───────────────────────────────────────────────────

export default function WorkflowBuilder({ initial, onSave, onCancel, onDelete }: WorkflowBuilderProps) {
  const [state, setState] = useState<EditState>(fromInitial(initial));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isNew = !initial?.id;
  const opNeedsValue = (op: string) => !['exists', 'not_exists'].includes(op);

  const addCondition = () =>
    setState({ ...state, conditions: [...state.conditions, { field: 'status', operator: 'equals', value: '' }] });
  const removeCondition = (i: number) =>
    setState({ ...state, conditions: state.conditions.filter((_, idx) => idx !== i) });
  const updateCondition = (i: number, patch: Partial<EditState['conditions'][number]>) =>
    setState({ ...state, conditions: state.conditions.map((c, idx) => idx === i ? { ...c, ...patch } : c) });

  const addAction = () =>
    setState({ ...state, actions: [...state.actions, { type: 'notify_user', config: { severity: 'info', recipientUid: '{{assignedAgentId}}' } }] });
  const removeAction = (i: number) =>
    setState({ ...state, actions: state.actions.filter((_, idx) => idx !== i) });
  const updateAction = (i: number, next: EditState['actions'][number]) =>
    setState({ ...state, actions: state.actions.map((a, idx) => idx === i ? next : a) });

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    const res = await onSave(state);
    setSaving(false);
    if (!res.ok) setErrors(res.errors || ['Save failed.']);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">{isNew ? 'New workflow' : 'Edit workflow'}</h2>
          <p className="text-xs text-gray-500 mt-0.5">User-authored automation. Every workflow inherits the engine's safeguards.</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-slate-900 p-1"><X size={20}/></button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50 custom-scrollbar">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-2 flex items-center gap-1"><AlertCircle size={11}/> Please fix</p>
            <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Basics */}
        <section className="bg-white p-4 rounded-2xl border border-gray-200">
          <h3 className={SECTION_HEADER}><Sparkles size={12}/> Basics</h3>
          <div className="mt-3 space-y-3">
            <Field label="Name">
              <input type="text" value={state.name} onChange={e => setState({ ...state, name: e.target.value })}
                placeholder="e.g. Ping broker when a Firm Sale lands"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <Field label="Description">
              <input type="text" value={state.description} onChange={e => setState({ ...state, description: e.target.value })}
                placeholder="Optional — helps other admins understand what this does"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={state.enabled} onChange={e => setState({ ...state, enabled: e.target.checked })}
                className="w-4 h-4 accent-slate-900" />
              <span className="font-bold text-slate-900">Enabled</span>
              <span className="text-xs text-gray-500">— unchecked = draft, engine ignores it</span>
            </label>
          </div>
        </section>

        {/* When (trigger) */}
        <section className="bg-white p-4 rounded-2xl border border-gray-200">
          <h3 className={SECTION_HEADER}><Zap size={12} className="text-amber-500"/> When</h3>
          <div className="mt-3 space-y-3">
            <Field label="Trigger">
              <select value={state.triggerType} onChange={e => setState({ ...state, triggerType: e.target.value, triggerConfig: {} })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <TriggerConfig state={state} setState={setState} />
          </div>
        </section>

        {/* Only if (conditions) */}
        <section className="bg-white p-4 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className={SECTION_HEADER}><Filter size={12} className="text-blue-600"/> Only if (all must match)</h3>
            <button onClick={addCondition} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Plus size={11}/> Add condition
            </button>
          </div>
          {state.conditions.length === 0 ? (
            <p className="text-xs text-gray-500 mt-3">No conditions — the workflow fires on every trigger.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {state.conditions.map((c, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr_auto] gap-2 items-end">
                    <Field label="Field">
                      <select value={c.field} onChange={e => updateCondition(i, { field: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900">
                        {CONDITION_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        <option value="custom">Custom (type field name)</option>
                      </select>
                    </Field>
                    <Field label="Operator">
                      <select value={c.operator} onChange={e => updateCondition(i, { operator: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900">
                        {COMPARISON_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Value">
                      <input type="text"
                        disabled={!opNeedsValue(c.operator)}
                        value={String(c.value ?? '')}
                        onChange={e => updateCondition(i, { value: e.target.value })}
                        placeholder={opNeedsValue(c.operator) ? 'e.g. Firm Sale' : '—'}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900 disabled:bg-gray-100 disabled:text-gray-400" />
                    </Field>
                    <button onClick={() => removeCondition(i)} className="p-2 text-red-500 hover:text-red-700 h-8"><Trash2 size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Then (actions) */}
        <section className="bg-white p-4 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className={SECTION_HEADER}><ChevronDown size={12} className="rotate-[-90deg] text-emerald-600"/> Then do</h3>
            <button onClick={addAction} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
              <Plus size={11}/> Add action
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {state.actions.map((a, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <select value={a.type} onChange={e => updateAction(i, { type: e.target.value, config: { ...a.config } })}
                    className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-slate-900 text-slate-900">
                    {ACTION_TYPES.map(t => <option key={t.value} value={t.value} disabled={!t.supported}>{t.label}</option>)}
                  </select>
                  <button onClick={() => removeAction(i)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={13}/></button>
                </div>
                <ActionConfig action={a} onChange={next => updateAction(i, next)} />
              </div>
            ))}
          </div>
        </section>

        {/* Guardrails */}
        <section className="bg-white p-4 rounded-2xl border border-gray-200">
          <h3 className={SECTION_HEADER}><AlertCircle size={12} className="text-slate-500"/> Guardrails</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Debounce (minutes)">
              <input type="number" min={0} max={1440} value={state.debounceMinutes}
                onChange={e => setState({ ...state, debounceMinutes: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <label className="flex items-end gap-2 text-sm pb-2">
              <input type="checkbox" checked={state.dailyBucket}
                onChange={e => setState({ ...state, dailyBucket: e.target.checked })}
                className="w-4 h-4 accent-slate-900" />
              <span className="font-bold text-slate-900 text-xs">Fire at most once per day per deal</span>
            </label>
          </div>
        </section>

        {/* Interpolation helper */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
          <p className="font-bold mb-1">Interpolation cheat sheet</p>
          <p>Use <code className="bg-white px-1 rounded">{"{{clientName}}"}</code>, <code className="bg-white px-1 rounded">{"{{status}}"}</code>, <code className="bg-white px-1 rounded">{"{{loanAmount}}"}</code>, <code className="bg-white px-1 rounded">{"{{clientEmail}}"}</code>, <code className="bg-white px-1 rounded">{"{{assignedAgentId}}"}</code> inside titles, bodies, and subjects.</p>
        </div>

        {/* Dry-run panel — Wave B.1. Evaluates the last-saved workflow
            against a sample referral (no writes) so authors preview the
            fire before enabling. Hidden until saved once. */}
        <WorkflowDryRunPanel workflowId={initial?.id} dirtyDraft={false} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
        <div>
          {onDelete && !isNew && (
            <button
              onClick={async () => {
                if (window.confirm('Archive this workflow? It will stop firing but stay in the audit trail.')) {
                  await onDelete();
                }
              }}
              className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <Trash2 size={11}/> Archive
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm disabled:opacity-50">
            <Save size={12}/> {saving ? 'Saving…' : (isNew ? 'Create workflow' : 'Save changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
