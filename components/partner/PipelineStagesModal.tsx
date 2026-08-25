'use client';

// Editor for the current user's custom pipeline stages.
//
// Behavior:
//   - Empty list = fall back to the role default (shown as read-only
//     preview so the user knows what they're overriding).
//   - Any non-empty list is used as-is by the pipeline + kanban + deal
//     modal status dropdown. Order is meaningful — determines kanban
//     column order and the progress-bar % computation.
//   - Save PUTs to /api/partner/pipeline-stages.

import { useState } from 'react';
import { X, Save, Plus, Trash2, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { authedFetch } from '../../lib/apiClient';
import { useToast } from '../ui/ToastProvider';

interface PipelineStagesModalProps {
  onClose: () => void;
  initial: string[] | null;
  defaults: string[];        // role-based fallback shown for reference
  onSaved: (stages: string[] | null) => void;
}

export default function PipelineStagesModal({ onClose, initial, defaults, onSaved }: PipelineStagesModalProps) {
  const toast = useToast();
  const [stages, setStages] = useState<string[]>(initial && initial.length > 0 ? [...initial] : [...defaults]);
  const [saving, setSaving] = useState(false);

  const usingDefaults = initial === null || initial.length === 0;

  const update = (i: number, v: string) => setStages(s => s.map((x, idx) => idx === i ? v : x));
  const remove = (i: number) => setStages(s => s.filter((_, idx) => idx !== i));
  const add = () => setStages(s => [...s, 'New stage']);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= stages.length) return;
    const next = [...stages]; [next[i], next[j]] = [next[j], next[i]]; setStages(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const clean = stages.map(s => s.trim()).filter(Boolean);
      const res = await authedFetch('/api/partner/pipeline-stages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error('Save failed', data.error); setSaving(false); return; }
      toast.success('Pipeline stages saved.');
      onSaved(clean.length === 0 ? null : clean);
      onClose();
    } catch (e: any) {
      toast.error('Network error', e?.message);
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    setSaving(true);
    try {
      const res = await authedFetch('/api/partner/pipeline-stages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: [] }),
      });
      if (!res.ok) { toast.error('Reset failed'); setSaving(false); return; }
      toast.success('Reverted to default stages.');
      onSaved(null);
      onClose();
    } catch {
      toast.error('Network error');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Pipeline stages</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {usingDefaults ? 'Currently using role defaults — edit + save to override.' : 'Your custom stages.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 p-1"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar space-y-2">
          {stages.map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-6">{i + 1}</span>
              <input
                type="text" value={s}
                onChange={e => update(i, e.target.value)}
                className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"
              />
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-slate-900 disabled:opacity-30"><ChevronUp size={14}/></button>
              <button onClick={() => move(i, 1)} disabled={i === stages.length - 1} className="p-1 text-gray-400 hover:text-slate-900 disabled:opacity-30"><ChevronDown size={14}/></button>
              <button onClick={() => remove(i)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
            </div>
          ))}
          <button onClick={add}
            className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-slate-900 rounded-xl p-3 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 transition flex items-center justify-center gap-1">
            <Plus size={12}/> Add stage
          </button>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <p className="font-bold mb-1">Role default (for reference)</p>
            <p className="text-blue-800">{defaults.join(' → ')}</p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <button onClick={resetToDefault} disabled={saving}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 flex items-center gap-1 disabled:opacity-50">
            <RotateCcw size={11}/> Reset to default
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={saving}
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2">
              Cancel
            </button>
            <button onClick={save} disabled={saving || stages.length === 0}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm disabled:opacity-50">
              <Save size={11}/> {saving ? 'Saving…' : 'Save stages'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
