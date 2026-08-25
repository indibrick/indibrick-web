'use client';

// Editor for the current user's custom deal-field definitions.

import { useState } from 'react';
import { X, Plus, Trash2, Save, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { CUSTOM_FIELD_TYPES, type CustomFieldDef } from '../../lib/customFieldsShape';
import { authedFetch } from '../../lib/apiClient';
import { useToast } from '../ui/ToastProvider';

interface CustomFieldsModalProps {
  onClose: () => void;
  initial: CustomFieldDef[];
  onSaved: (defs: CustomFieldDef[]) => void;
}

function slugKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'field';
}

export default function CustomFieldsModal({ onClose, initial, onSaved }: CustomFieldsModalProps) {
  const toast = useToast();
  const [defs, setDefs] = useState<CustomFieldDef[]>(initial.map(d => ({ ...d, options: d.options ? [...d.options] : undefined })));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<CustomFieldDef>) =>
    setDefs(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  const remove = (i: number) => setDefs(prev => prev.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= defs.length) return;
    const next = [...defs]; [next[i], next[j]] = [next[j], next[i]]; setDefs(next);
  };
  const add = () => setDefs(prev => [...prev, { key: `field_${prev.length + 1}`, label: 'New field', type: 'text' }]);

  const save = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const res = await authedFetch('/api/partner/custom-fields', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors || [data.error || 'Save failed']);
        setSaving(false);
        return;
      }
      toast.success(defs.length === 0 ? 'Custom fields cleared.' : `Saved ${defs.length} field${defs.length === 1 ? '' : 's'}.`);
      onSaved(data.defs || defs);
      onClose();
    } catch (e: any) {
      toast.error('Network error', e?.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Custom deal fields</h2>
            <p className="text-xs text-gray-500 mt-0.5">Track your own per-deal data. Values appear on the deal modal.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 p-1"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2 custom-scrollbar">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-2 flex items-center gap-1"><AlertCircle size={11}/> Please fix</p>
              <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          {defs.map((d, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 items-end">
                <label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Label</span>
                  <input type="text" value={d.label}
                    onChange={e => {
                      const label = e.target.value;
                      // Auto-derive key from label the first time the label
                      // is being set (key was still auto-generated).
                      const nextKey = d.key.startsWith('field_') && /^field_\d+$/.test(d.key)
                        ? slugKey(label)
                        : d.key;
                      update(i, { label, key: nextKey });
                    }}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
                </label>
                <label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Key (internal)</span>
                  <input type="text" value={d.key}
                    onChange={e => update(i, { key: slugKey(e.target.value) })}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900 font-mono" />
                </label>
                <label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Type</span>
                  <select value={d.type}
                    onChange={e => update(i, { type: e.target.value as any, options: e.target.value === 'select' ? (d.options || []) : undefined })}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                    {CUSTOM_FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-slate-900 disabled:opacity-30"><ChevronUp size={14}/></button>
                  <button onClick={() => move(i, 1)} disabled={i === defs.length - 1} className="p-1 text-gray-400 hover:text-slate-900 disabled:opacity-30"><ChevronDown size={14}/></button>
                  <button onClick={() => remove(i)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                </div>
              </div>
              {d.type === 'select' && (
                <label className="block mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Options (comma-separated)</span>
                  <input type="text" value={(d.options || []).join(', ')}
                    onChange={e => update(i, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="Buyer, Seller, Both"
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
                </label>
              )}
            </div>
          ))}
          <button onClick={add}
            className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-slate-900 rounded-xl p-3 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 transition flex items-center justify-center gap-1">
            <Plus size={12}/> Add field
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <p className="text-[10px] text-gray-500 font-medium">
            {defs.length} of 25 field{defs.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={saving}
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2">Cancel</button>
            <button onClick={save} disabled={saving}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm disabled:opacity-50">
              <Save size={11}/> {saving ? 'Saving…' : 'Save fields'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
