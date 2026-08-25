'use client';
// Admin workflow list + inline editor for the shape defined in
// lib/workflowShape.ts. Purposefully bare-bones — one column of
// triggers, one column of actions, no visual builder / dnd. That's a
// full sprint on its own; this ships the CRUD path.

import { useState } from 'react';
import { Plus, Zap, Trash2, Save, X, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { useWorkflows, type WorkflowDoc } from '@/hooks/useWorkflows';
import {
  TRIGGER_TYPES, COMPARISON_OPERATORS, CONDITION_FIELDS, ACTION_TYPES,
} from '@/lib/workflowShape';

type EditorState =
  | { mode: 'closed' }
  | { mode: 'new' }
  | { mode: 'edit'; id: string };

function blankWorkflow(): Partial<WorkflowDoc> {
  return {
    name: '',
    description: '',
    enabled: true,
    triggerType: 'referral_created',
    triggerConfig: {},
    conditions: [],
    actions: [{ type: 'notify_user', config: {} }],
    debounceMinutes: 0,
    dailyBucket: false,
  };
}

interface PanelProps {
  // Non-admins see the list read-only + can toggle enable, but the
  // "new / edit / delete" affordances hide. The API also gates POST
  // to admin — this is a UX guard, the server is the enforcer.
  isAdmin?: boolean;
}

export default function WorkflowsPanel({ isAdmin = true }: PanelProps = {}) {
  const { workflows, loading, error, create, update, remove } = useWorkflows();
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-neutral-900">Workflows</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Trigger → conditions → actions. Fires on the events chosen and runs the interpreter server-side.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setEditor({ mode: 'new' })}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            <Plus size={14}/> New workflow
          </button>
        )}
      </div>

      {loading && <div className="text-sm text-neutral-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && workflows.length === 0 && editor.mode === 'closed' && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <Zap className="mx-auto mb-2 text-neutral-400" size={28}/>
          <p className="text-sm font-medium text-neutral-900">No workflows yet.</p>
          <p className="text-xs text-neutral-500 mt-1">Automate follow-ups, tag deals, notify agents, or fire webhooks when things change.</p>
        </div>
      )}

      {workflows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-3 py-2 text-left">On</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Trigger</th>
                <th className="px-3 py-2 text-left">Actions</th>
                <th className="px-3 py-2 text-right">Fired</th>
                <th className="px-3 py-2 text-right">Errors</th>
                <th className="px-3 py-2"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {workflows.map(w => (
                <tr key={w.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <button onClick={() => update(w.id, { enabled: !w.enabled })}
                      className={w.enabled ? 'text-emerald-600' : 'text-neutral-300'}>
                      {w.enabled ? <ToggleRight size={22}/> : <ToggleLeft size={22}/>}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-medium text-neutral-900">{w.name}</td>
                  <td className="px-3 py-2 text-neutral-600">
                    {TRIGGER_TYPES.find(t => t.value === w.triggerType)?.label || w.triggerType}
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{(w.actions || []).length}</td>
                  <td className="px-3 py-2 text-right">{w.firedCount || 0}</td>
                  <td className={`px-3 py-2 text-right ${(w.errorCount || 0) > 0 ? 'text-red-700' : ''}`}>{w.errorCount || 0}</td>
                  <td className="px-3 py-2 text-right">
                    {isAdmin && (
                      <>
                        <button onClick={() => setEditor({ mode: 'edit', id: w.id })}
                          className="text-xs text-neutral-600 hover:text-neutral-900 mr-3">Edit</button>
                        <button onClick={() => { if (confirm(`Delete "${w.name}"?`)) remove(w.id); }}
                          className="text-xs text-red-600 hover:text-red-800">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor.mode !== 'closed' && (
        <WorkflowEditor
          initial={editor.mode === 'new'
            ? blankWorkflow()
            : (workflows.find(w => w.id === editor.id) || blankWorkflow())}
          onSave={async (patch) => {
            const result = editor.mode === 'new'
              ? await create(patch)
              : await update(editor.id, patch);
            if (result.ok) setEditor({ mode: 'closed' });
            return result;
          }}
          onClose={() => setEditor({ mode: 'closed' })}
        />
      )}
    </div>
  );
}

interface EditorProps {
  initial: Partial<WorkflowDoc>;
  onSave: (patch: Partial<WorkflowDoc>) => Promise<{ ok: boolean; errors?: string[] }>;
  onClose: () => void;
}

function WorkflowEditor({ initial, onSave, onClose }: EditorProps) {
  const [w, setW] = useState<Partial<WorkflowDoc>>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const patch = (p: Partial<WorkflowDoc>) => setW(prev => ({ ...prev, ...p }));

  const setCondition = (i: number, p: Partial<{ field: string; operator: string; value: any }>) => {
    const conds = [...(w.conditions || [])];
    conds[i] = { ...conds[i], ...p };
    patch({ conditions: conds });
  };

  const setAction = (i: number, p: Partial<{ type: string; config: Record<string, any> }>) => {
    const acts = [...(w.actions || [])];
    acts[i] = { ...acts[i], ...p };
    patch({ actions: acts });
  };

  const submit = async () => {
    setSaving(true);
    setErrors([]);
    const result = await onSave(w);
    setSaving(false);
    if (!result.ok) setErrors(result.errors || ['Save failed.']);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-black text-neutral-900">
            {initial?.id ? 'Edit workflow' : 'New workflow'}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              {errors.map((e, i) => (
                <div key={i} className="flex gap-2 text-sm text-red-700"><AlertCircle size={14}/> {e}</div>
              ))}
            </div>
          )}

          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Name</span>
            <input type="text" value={w.name || ''} onChange={e => patch({ name: e.target.value })}
              className="mt-1 w-full p-2 border border-neutral-300 rounded-lg text-sm outline-none focus:border-neutral-900 text-neutral-900"
              placeholder="e.g. Notify me on new insurance lead"/>
          </label>

          <label className="block text-sm">
            <span className="text-neutral-700 font-medium">Description</span>
            <input type="text" value={w.description || ''} onChange={e => patch({ description: e.target.value })}
              className="mt-1 w-full p-2 border border-neutral-300 rounded-lg text-sm outline-none focus:border-neutral-900 text-neutral-900"/>
          </label>

          <div>
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Trigger</span>
              <select value={w.triggerType} onChange={e => patch({ triggerType: e.target.value })}
                className="mt-1 w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900">
                {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            {w.triggerType === 'referral_field_changed' && (
              <label className="block text-sm mt-2">
                <span className="text-neutral-700 text-xs">Field to watch</span>
                <input type="text" value={w.triggerConfig?.field || ''}
                  onChange={e => patch({ triggerConfig: { ...w.triggerConfig, field: e.target.value } })}
                  placeholder="e.g. loanAmount"
                  className="mt-1 w-full p-2 border border-neutral-300 rounded-lg text-sm outline-none focus:border-neutral-900 text-neutral-900"/>
              </label>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Conditions (all must match)</span>
              <button
                onClick={() => patch({ conditions: [...(w.conditions || []), { field: 'status', operator: 'equals', value: '' }] })}
                className="text-xs text-neutral-600 hover:text-neutral-900">+ Add condition</button>
            </div>
            <div className="mt-2 space-y-2">
              {(w.conditions || []).map((c, i) => {
                const noValue = c.operator === 'exists' || c.operator === 'not_exists';
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={c.field || ''} onChange={e => setCondition(i, { field: e.target.value })}
                      className="p-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 flex-1">
                      {CONDITION_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select value={c.operator || ''} onChange={e => setCondition(i, { operator: e.target.value })}
                      className="p-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900">
                      {COMPARISON_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input type="text" value={noValue ? '' : String(c.value ?? '')}
                      onChange={e => setCondition(i, { value: e.target.value })}
                      disabled={noValue}
                      className="p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 flex-1 disabled:bg-neutral-100"/>
                    <button onClick={() => patch({ conditions: (w.conditions || []).filter((_, idx) => idx !== i) })}
                      className="text-red-600 hover:text-red-800"><Trash2 size={14}/></button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">Actions</span>
              <button
                onClick={() => patch({ actions: [...(w.actions || []), { type: 'notify_user', config: {} }] })}
                className="text-xs text-neutral-600 hover:text-neutral-900">+ Add action</button>
            </div>
            <div className="mt-2 space-y-2">
              {(w.actions || []).map((a, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={a.type || ''} onChange={e => setAction(i, { type: e.target.value })}
                    className="p-2 border border-neutral-300 rounded-lg text-sm bg-white text-neutral-900 flex-1">
                    {ACTION_TYPES.map(t => (
                      <option key={t.value} value={t.value} disabled={!t.supported}>
                        {t.label}{!t.supported ? ' (unsupported)' : ''}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => patch({ actions: (w.actions || []).filter((_, idx) => idx !== i) })}
                    className="text-red-600 hover:text-red-800"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-neutral-700 font-medium">Debounce (minutes)</span>
              <input type="number" min={0} max={1440}
                value={w.debounceMinutes ?? 0}
                onChange={e => patch({ debounceMinutes: Number(e.target.value) })}
                className="mt-1 w-full p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900"/>
            </label>
            <label className="flex items-end gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={!!w.dailyBucket}
                onChange={e => patch({ dailyBucket: e.target.checked })}/>
              Daily bucket (max one fire per calendar day)
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
            <Save size={14}/> {saving ? 'Saving…' : 'Save workflow'}
          </button>
        </div>
      </div>
    </div>
  );
}
