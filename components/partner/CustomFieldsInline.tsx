'use client';

// Inline renderer for a deal's custom-field values, shown in the deal
// modal. Reads defs from the current user's customDealFields; values
// from referral.customFields.{key}. Edits save via the standard
// referrals PATCH endpoint under `customFields` (which is in the
// allowlist for both the API and firestore.rules).

import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { authedPatch } from '../../lib/apiClient';
import { useToast } from '../ui/ToastProvider';
import type { CustomFieldDef } from '../../lib/customFieldsShape';

interface CustomFieldsInlineProps {
  referralId: string;
  defs: CustomFieldDef[];
  initialValues: Record<string, any>;
  canEdit: boolean;
  onSaved: (values: Record<string, any>) => void;
}

function coerce(type: string, raw: any): any {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (type === 'number' || type === 'currency') {
    const n = Number(String(raw).replace(/[^\d.-]/g, ''));
    return isNaN(n) ? undefined : n;
  }
  if (type === 'checkbox') return !!raw;
  return String(raw);
}

export default function CustomFieldsInline({ referralId, defs, initialValues, canEdit, onSaved }: CustomFieldsInlineProps) {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, any>>(initialValues || {});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset when deal changes.
  useEffect(() => {
    setValues(initialValues || {});
    setDirty(false);
  }, [referralId, initialValues]);

  if (!defs || defs.length === 0) return null;

  const setV = (key: string, v: any) => {
    setValues(prev => ({ ...prev, [key]: v }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Coerce every value to its declared type + drop empties so we
      // don't store noise. Server-side field-allowlist blocks anything
      // outside customFields — arbitrary keys inside customFields are
      // fine because it's an opaque bag.
      const cleaned: Record<string, any> = {};
      for (const def of defs) {
        const v = coerce(def.type, values[def.key]);
        if (v !== undefined) cleaned[def.key] = v;
      }
      const res = await authedPatch(`/api/partner/referrals/${referralId}`, { customFields: cleaned });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error('Save failed', data.error); setSaving(false); return; }
      toast.success('Custom fields saved.');
      setDirty(false);
      onSaved(cleaned);
    } catch (e: any) {
      toast.error('Network error', e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Custom fields</h4>
        {dirty && canEdit && (
          <button onClick={save} disabled={saving}
            className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm disabled:opacity-50">
            {saving ? <Loader2 size={11} className="animate-spin"/> : <Save size={11}/>} Save
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {defs.map(d => {
          const v = values[d.key] ?? '';
          const commonCls = 'w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-slate-900 text-slate-900 disabled:opacity-50';
          return (
            <label key={d.key} className={d.type === 'textarea' ? 'md:col-span-2' : ''}>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">{d.label}</span>
              {d.type === 'textarea' ? (
                <textarea rows={2} value={v} disabled={!canEdit} onChange={e => setV(d.key, e.target.value)} className={commonCls + ' resize-none'} />
              ) : d.type === 'checkbox' ? (
                <label className="flex items-center gap-2 pt-1">
                  <input type="checkbox" checked={!!v} disabled={!canEdit} onChange={e => setV(d.key, e.target.checked)} className="w-4 h-4 accent-slate-900"/>
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
              ) : d.type === 'select' ? (
                <select value={v} disabled={!canEdit} onChange={e => setV(d.key, e.target.value)} className={commonCls}>
                  <option value="">Choose…</option>
                  {(d.options || []).map((o, i) => <option key={i} value={o}>{o}</option>)}
                </select>
              ) : d.type === 'date' ? (
                <input type="date" value={v} disabled={!canEdit} onChange={e => setV(d.key, e.target.value)} className={commonCls}/>
              ) : d.type === 'number' || d.type === 'currency' ? (
                <input type="number" inputMode="decimal" value={v} disabled={!canEdit} onChange={e => setV(d.key, e.target.value)} className={commonCls}/>
              ) : (
                <input type="text" value={v} disabled={!canEdit} onChange={e => setV(d.key, e.target.value)} className={commonCls}/>
              )}
              {d.helpText && <p className="text-[10px] text-gray-500 mt-1">{d.helpText}</p>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
