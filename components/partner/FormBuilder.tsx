'use client';

// Form builder — fields + behavior editor for a single /forms doc.

import { useState } from 'react';
import { X, Plus, AlertCircle, Save, Trash2, ChevronUp, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { FIELD_TYPES, REFERRAL_MAPPED_FIELDS, type FormDoc, type FormField, type DedupePolicy } from '../../lib/formShape';

interface FormBuilderProps {
  initial?: Partial<FormDoc>;
  onSave: (payload: Partial<FormDoc>) => Promise<{ ok: boolean; errors?: string[] }>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

interface EditState {
  slug: string;
  name: string;
  headline: string;
  subheadline: string;
  submitLabel: string;
  successMessage: string;
  enabled: boolean;
  fields: FormField[];
  autoTag: string;
  dealType: 'Mortgage' | 'Real Estate' | 'Legal' | 'Insurance';
  redirectUrl: string;
  notifyEmails: string;
  dedupePolicy: DedupePolicy;
  requireCaptcha: boolean;
}

function fromInitial(initial?: Partial<FormDoc>): EditState {
  return {
    slug: initial?.slug || '',
    name: initial?.name || '',
    headline: initial?.headline || '',
    subheadline: initial?.subheadline || '',
    submitLabel: initial?.submitLabel || 'Submit',
    successMessage: initial?.successMessage || 'Thanks — we\'ll be in touch shortly.',
    enabled: initial?.enabled !== false,
    fields: Array.isArray(initial?.fields) && initial!.fields.length > 0
      ? initial!.fields.map(f => ({ ...f, options: [...(f.options || [])] }))
      : [
          { key: 'name', label: 'Full name', type: 'text', required: true, mapTo: 'clientName' },
          { key: 'email', label: 'Email', type: 'email', required: true, mapTo: 'clientEmail' },
          { key: 'phone', label: 'Phone', type: 'phone', required: false, mapTo: 'clientPhone' },
        ],
    autoTag: initial?.autoTag || '',
    dealType: (initial?.dealType as any) || 'Mortgage',
    redirectUrl: initial?.redirectUrl || '',
    notifyEmails: (initial?.notifyEmails || []).join(', '),
    dedupePolicy: (initial?.dedupePolicy as DedupePolicy) || 'append',
    requireCaptcha: initial?.requireCaptcha === true,
  };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}

export default function FormBuilder({ initial, onSave, onCancel, onDelete }: FormBuilderProps) {
  const [state, setState] = useState<EditState>(fromInitial(initial));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isNew = !initial?.id;

  const updateField = (i: number, patch: Partial<FormField>) =>
    setState({ ...state, fields: state.fields.map((f, idx) => idx === i ? { ...f, ...patch } : f) });
  const removeField = (i: number) =>
    setState({ ...state, fields: state.fields.filter((_, idx) => idx !== i) });
  const addField = () =>
    setState({ ...state, fields: [...state.fields, { key: `field_${state.fields.length + 1}`, label: 'New field', type: 'text' }] });
  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= state.fields.length) return;
    const next = [...state.fields];
    [next[i], next[j]] = [next[j], next[i]];
    setState({ ...state, fields: next });
  };

  const publicUrl = state.slug ? `${typeof window !== 'undefined' ? window.location.origin : 'https://indibrick.ca'}/f/${state.slug}` : '';

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    const payload: Partial<FormDoc> = {
      ...state,
      notifyEmails: state.notifyEmails.split(',').map(s => s.trim()).filter(Boolean),
    };
    const res = await onSave(payload);
    setSaving(false);
    if (!res.ok) setErrors(res.errors || ['Save failed.']);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">{isNew ? 'New form' : 'Edit form'}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Public URL: <code className="bg-gray-100 px-1 rounded text-slate-900">{publicUrl || '/f/(pick a slug)'}</code></p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-slate-900 p-1"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50 custom-scrollbar">
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-2 flex items-center gap-1"><AlertCircle size={11}/> Please fix</p>
            <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Basics */}
        <section className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Basics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Admin name (internal)">
              <input type="text" value={state.name}
                onChange={e => {
                  const name = e.target.value;
                  setState(p => ({ ...p, name, slug: isNew && !p.slug ? slugify(name) : p.slug }));
                }}
                placeholder="e.g. Homepage renewal form"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <Field label="Slug (public URL segment)">
              <input type="text" value={state.slug}
                disabled={!isNew}
                onChange={e => setState({ ...state, slug: slugify(e.target.value) })}
                placeholder="renewal-check"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900 font-mono disabled:bg-gray-100" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Headline (shown to visitors)">
                <input type="text" value={state.headline}
                  onChange={e => setState({ ...state, headline: e.target.value })}
                  placeholder="Get a mortgage renewal review"
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Subheadline (optional)">
                <input type="text" value={state.subheadline}
                  onChange={e => setState({ ...state, subheadline: e.target.value })}
                  placeholder="A licensed IndiBrick broker will call within 2 hours."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
              </Field>
            </div>
            <Field label="Submit button label">
              <input type="text" value={state.submitLabel}
                onChange={e => setState({ ...state, submitLabel: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <Field label="Success message (shown on submit)">
              <input type="text" value={state.successMessage}
                onChange={e => setState({ ...state, successMessage: e.target.value })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <label className="md:col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={state.enabled}
                onChange={e => setState({ ...state, enabled: e.target.checked })}
                className="w-4 h-4 accent-slate-900" />
              <span className="font-bold text-slate-900">Enabled</span>
              <span className="text-xs text-gray-500">— unchecked = form URL returns 410</span>
            </label>
          </div>
        </section>

        {/* Fields */}
        <section className="bg-white p-4 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Fields</h3>
            <button onClick={addField}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Plus size={11}/> Add field
            </button>
          </div>
          <div className="space-y-2">
            {state.fields.map((f, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                  <Field label="Key (internal)">
                    <input type="text" value={f.key}
                      onChange={e => updateField(i, { key: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900 font-mono" />
                  </Field>
                  <Field label="Label">
                    <input type="text" value={f.label}
                      onChange={e => updateField(i, { label: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900" />
                  </Field>
                  <Field label="Type">
                    <select value={f.type}
                      onChange={e => updateField(i, { type: e.target.value as any })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900">
                      {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Maps to (referral field)">
                    <select value={f.mapTo || ''}
                      onChange={e => updateField(i, { mapTo: (e.target.value || undefined) as any })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900">
                      <option value="">— extras only —</option>
                      {REFERRAL_MAPPED_FIELDS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveField(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-slate-900 disabled:opacity-30"><ChevronUp size={13}/></button>
                    <button onClick={() => moveField(i, 1)} disabled={i === state.fields.length - 1} className="p-1 text-gray-400 hover:text-slate-900 disabled:opacity-30"><ChevronDown size={13}/></button>
                    <button onClick={() => removeField(i)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={13}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <Field label="Placeholder">
                    <input type="text" value={f.placeholder || ''}
                      onChange={e => updateField(i, { placeholder: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900" />
                  </Field>
                  <label className="flex items-center gap-2 text-xs pt-4">
                    <input type="checkbox" checked={!!f.required}
                      onChange={e => updateField(i, { required: e.target.checked })}
                      className="w-4 h-4 accent-slate-900" />
                    <span className="font-bold text-slate-900">Required</span>
                  </label>
                  {f.type === 'select' && (
                    <Field label="Options (comma-separated)">
                      <input type="text" value={(f.options || []).join(', ')}
                        onChange={e => updateField(i, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="Option A, Option B"
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900" />
                    </Field>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Behavior on submit */}
        <section className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">On submit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Deal type on created referral">
              <select value={state.dealType} onChange={e => setState({ ...state, dealType: e.target.value as any })}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                <option value="Mortgage">Mortgage</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Insurance">Insurance</option>
                <option value="Legal">Legal</option>
              </select>
            </Field>
            <Field label="Auto-tag on submit (optional)">
              <input type="text" value={state.autoTag} onChange={e => setState({ ...state, autoTag: e.target.value })}
                placeholder="e.g. Renewal 2026"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <Field label="Redirect URL (optional)">
              <input type="text" value={state.redirectUrl} onChange={e => setState({ ...state, redirectUrl: e.target.value })}
                placeholder="https://your-thank-you-page.com"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <Field label="Notify emails (comma-separated, max 5)">
              <input type="text" value={state.notifyEmails} onChange={e => setState({ ...state, notifyEmails: e.target.value })}
                placeholder="broker@indibrick.ca"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900" />
            </Field>
            <div className="md:col-span-2">
              <Field label="When the same email or phone submits again">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'append',        title: 'Append to existing',  hint: 'Add a timeline entry, don\'t create a new deal.' },
                    { v: 'skip',          title: 'Skip silently',        hint: 'Log the submission, no CRM impact.' },
                    { v: 'always_create', title: 'Always create new',    hint: 'Every submit is a fresh deal (renewal-style forms).' },
                  ] as { v: DedupePolicy; title: string; hint: string }[]).map(opt => (
                    <label key={opt.v} className={`cursor-pointer rounded-xl p-2.5 border text-left transition ${state.dedupePolicy === opt.v ? 'border-slate-900 bg-slate-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="dedupePolicy" value={opt.v}
                        checked={state.dedupePolicy === opt.v}
                        onChange={() => setState({ ...state, dedupePolicy: opt.v })}
                        className="sr-only" />
                      <p className="text-[11px] font-black text-slate-900">{opt.title}</p>
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">{opt.hint}</p>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-start gap-2 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-200">
                <input type="checkbox" checked={state.requireCaptcha}
                  onChange={e => setState({ ...state, requireCaptcha: e.target.checked })}
                  className="w-4 h-4 accent-slate-900 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-slate-900">Require CAPTCHA (Cloudflare Turnstile)</p>
                  <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                    Verifies each submission is human before creating a referral. Requires the <code className="bg-white px-1 rounded">TURNSTILE_SECRET_KEY</code> + <code className="bg-white px-1 rounded">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> env vars — enable this now and set the env when you're ready to go live.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Embed */}
        {state.slug && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
            <p className="font-bold flex items-center gap-1"><Copy size={12}/> Embed snippet</p>
            <pre className="bg-white border border-blue-200 rounded p-2 text-[11px] overflow-x-auto"><code>{`<iframe src="${publicUrl}" style="border:0;width:100%;height:640px" title="${state.name}"></iframe>`}</code></pre>
            <p className="flex items-center gap-1">
              <ExternalLink size={11}/>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="underline">Open the public URL</a>
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
        <div>
          {onDelete && !isNew && (
            <button
              onClick={async () => { if (window.confirm('Archive this form? Existing submissions stay.')) await onDelete(); }}
              className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-800 flex items-center gap-1">
              <Trash2 size={11}/> Archive
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm disabled:opacity-50">
            <Save size={12}/> {saving ? 'Saving…' : (isNew ? 'Create form' : 'Save changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
