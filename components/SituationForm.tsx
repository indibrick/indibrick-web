'use client';

// Reusable lead-capture form for every /situations/* page. Each page passes
// a config (serviceNeeded label, extra fields, accent color, source tag)
// so the form renders situation-specific inputs but reuses the standard
// name/email/phone/consent scaffolding and the /api/leads/submit contract.
//
// Every submission lands in the CRM Inbox as a New Web Lead with the
// situation tag baked into `source` — makes campaign attribution trivial
// in the partner portal.

import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, Shield, ChevronDown } from 'lucide-react';

export type FieldType = 'text' | 'tel' | 'email' | 'number' | 'currency' | 'select' | 'textarea';

export interface ExtraField {
  name: string;             // internal key + posted to CRM inside `message`
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];       // for type: 'select'
  helpText?: string;        // small grey text under the label
  min?: number;
  max?: number;
  step?: number;
  half?: boolean;           // render at 50% width on desktop (pairs into a row)
}

export type AccentColor = 'blue' | 'emerald' | 'red' | 'amber' | 'purple';

interface Props {
  situationLabel: string;   // e.g. "Renewal Rescue" — used in success screen
  serviceNeeded: string;    // e.g. "Mortgage Renewal" — CRM serviceNeeded field
  sourceTag: string;        // e.g. "situations/mortgage-renewal" — CRM source
  goal?: string;            // Renewal | Purchase | Refinance | Other
  pageSource: string;       // "/situations/mortgage-renewal"
  submitLabel: string;      // Primary button copy
  successHeadline?: string;
  successBody?: string;
  extraFields?: ExtraField[];
  accent?: AccentColor;
  responseWindow?: string;  // e.g. "within 2 business hours"
  externalCTA?: { label: string; href: string; hint?: string };
  // Progressive disclosure. When true, all fields with `required: false`
  // are hidden behind an "Add more context" toggle. Reduces perceived
  // form length on high-friction pages (e.g. mobile / 11pm decline shoppers)
  // while still capturing the extra context if the user opens the drawer.
  collapseOptional?: boolean;
}

// Tailwind can't see interpolated class names, so every accent variant is
// spelled out statically here. To add a new accent, add a row and expose
// its key in AccentColor above.
const ACCENT_MAP: Record<AccentColor, { btn: string; ring: string; ringShadow: string; text: string; ringLight: string; check: string }> = {
  blue:    { btn: 'bg-blue-600 hover:bg-blue-500',       ring: 'focus:border-blue-500',    ringShadow: 'shadow-blue-500/30',    text: 'text-blue-600',    ringLight: 'border-blue-100',    check: 'accent-blue-600' },
  emerald: { btn: 'bg-emerald-600 hover:bg-emerald-500', ring: 'focus:border-emerald-500', ringShadow: 'shadow-emerald-500/30', text: 'text-emerald-600', ringLight: 'border-emerald-100', check: 'accent-emerald-600' },
  red:     { btn: 'bg-red-600 hover:bg-red-500',         ring: 'focus:border-red-500',     ringShadow: 'shadow-red-500/30',     text: 'text-red-600',     ringLight: 'border-red-100',     check: 'accent-red-600' },
  amber:   { btn: 'bg-amber-600 hover:bg-amber-500',     ring: 'focus:border-amber-500',   ringShadow: 'shadow-amber-500/30',   text: 'text-amber-700',   ringLight: 'border-amber-100',   check: 'accent-amber-600' },
  purple:  { btn: 'bg-purple-600 hover:bg-purple-500',   ring: 'focus:border-purple-500',  ringShadow: 'shadow-purple-500/30',  text: 'text-purple-600',  ringLight: 'border-purple-100',  check: 'accent-purple-600' },
};

export default function SituationForm({
  situationLabel,
  serviceNeeded,
  sourceTag,
  goal = 'Other',
  pageSource,
  submitLabel,
  successHeadline = 'On the way',
  successBody,
  extraFields = [],
  accent = 'blue',
  responseWindow = 'within 2 business hours',
  externalCTA,
  collapseOptional = false,
}: Props) {
  const [showOptional, setShowOptional] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const a = ACCENT_MAP[accent];

  function setExtra(key: string, value: string) {
    setExtraValues(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setErrorMsg('Please confirm consent to be contacted.'); return; }
    setStatus('submitting'); setErrorMsg('');

    // Build the CRM message: header + extra field values labeled by their
    // human label, so the broker opening the file sees "Bank that declined:
    // TD" instead of "declinedBank: TD".
    const lines = [`${situationLabel.toUpperCase()} REQUEST`];
    for (const f of extraFields) {
      const v = extraValues[f.name] || '';
      if (!v.trim()) continue;
      const display = f.type === 'currency' ? `$${Number(v).toLocaleString('en-CA')}` : v;
      lines.push(`${f.label}: ${display}`);
    }
    const message = lines.join('\n');

    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          serviceNeeded,
          message,
          pageSource,
          source: sourceTag,
          goal,
          province: 'ON',
          consentGiven: consent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Submission failed');
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={`bg-white rounded-3xl p-8 md:p-10 shadow-2xl border ${a.ringLight} text-center`}>
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-white" />
        </div>
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">{successHeadline}</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          {successBody || <>A licensed IndiBrick advisor will be in touch <strong>{responseWindow}</strong>.</>}
        </p>
        <p className="text-[11px] text-gray-400 mt-4 font-bold uppercase tracking-widest">
          No credit pull · No obligation
        </p>
        {externalCTA && (
          <div className={`mt-6 pt-6 border-t ${a.ringLight}`}>
            {externalCTA.hint && <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{externalCTA.hint}</p>}
            <a href={externalCTA.href} target="_blank" rel="noopener noreferrer"
               className={`inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-widest ${a.text} hover:opacity-80 transition`}>
              {externalCTA.label} <ArrowRight size={14}/>
            </a>
          </div>
        )}
      </div>
    );
  }

  // Split into required + optional streams for progressive disclosure. A
  // field is considered "optional" only when `required` is explicitly false
  // — undefined defaults to required, matching existing pages' expectations.
  const isOptional = (f: ExtraField) => f.required === false;
  const primaryFields = collapseOptional ? extraFields.filter(f => !isOptional(f)) : extraFields;
  const optionalFields = collapseOptional ? extraFields.filter(isOptional) : [];

  // Group a set of fields into rows of paired half-width fields for compact
  // desktop layout. Reused for both primary + optional streams.
  const rowsOf = (fields: ExtraField[]): ExtraField[][] => {
    const out: ExtraField[][] = [];
    let current: ExtraField[] = [];
    for (const f of fields) {
      if (f.half) {
        current.push(f);
        if (current.length === 2) { out.push(current); current = []; }
      } else {
        if (current.length) { out.push(current); current = []; }
        out.push([f]);
      }
    }
    if (current.length) out.push(current);
    return out;
  };
  const rows = rowsOf(primaryFields);
  const optionalRows = rowsOf(optionalFields);

  const inputClass = `w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none ${a.ring} focus:bg-white transition`;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 space-y-4">
      <div className="text-center mb-2">
        <p className={`text-[10px] font-black uppercase tracking-widest ${a.text} mb-1`}>Free · No credit pull</p>
        <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{submitLabel}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Your Name</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className={inputClass}/>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Phone</label>
          <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(416) 555-0100" className={inputClass}/>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Email</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className={inputClass}/>
      </div>

      {(() => {
        // Field-row renderer — reused for the primary row block and (when
        // collapseOptional is on) the "Add more context" drawer below.
        const renderRows = (rs: ExtraField[][]) => rs.map((row, i) => (
          <div key={i} className={row.length === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : ''}>
            {row.map(f => (
              <div key={f.name}>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  {f.label}
                  {f.helpText && <span className="text-gray-400 normal-case tracking-normal font-medium ml-1">({f.helpText})</span>}
                </label>
                {f.type === 'select' ? (
                  <select required={f.required !== false} value={extraValues[f.name] || ''} onChange={e => setExtra(f.name, e.target.value)} className={`${inputClass} cursor-pointer`}>
                    <option value="">Select…</option>
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea required={f.required !== false} value={extraValues[f.name] || ''} onChange={e => setExtra(f.name, e.target.value)} placeholder={f.placeholder} rows={3} className={inputClass}/>
                ) : f.type === 'currency' ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input required={f.required !== false} type="number" min={f.min ?? 0} step={f.step ?? 1000} value={extraValues[f.name] || ''} onChange={e => setExtra(f.name, e.target.value)} placeholder={f.placeholder} className={`${inputClass} pl-7`}/>
                  </div>
                ) : (
                  <input required={f.required !== false} type={f.type} min={f.min} max={f.max} step={f.step} value={extraValues[f.name] || ''} onChange={e => setExtra(f.name, e.target.value)} placeholder={f.placeholder} className={inputClass}/>
                )}
              </div>
            ))}
          </div>
        ));

        return (
          <>
            {renderRows(rows)}

            {collapseOptional && optionalRows.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOptional(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition text-left"
                >
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">
                    {showOptional ? 'Hide extra context' : 'Add more context (optional — routes your file faster)'}
                  </span>
                  <ChevronDown size={14} className={`text-gray-500 transition ${showOptional ? 'rotate-180' : ''}`} />
                </button>
                {showOptional && (
                  <div className="mt-3 space-y-4 animate-[fadeIn_.15s_ease-out]">
                    {renderRows(optionalRows)}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

      <label className="flex items-start gap-2 pt-1 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
          className={`mt-1 w-4 h-4 ${a.check} cursor-pointer`}/>
        <span className="text-[11px] text-gray-500 leading-relaxed">
          I agree to be contacted by an IndiBrick licensed advisor by email, phone, or SMS about my {situationLabel.toLowerCase()}. See our <a href="/privacy-policy" className="underline">Privacy Policy</a>.
        </span>
      </label>

      {errorMsg && <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`w-full ${a.btn} text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition shadow-lg ${a.ringShadow} disabled:opacity-60`}
      >
        {status === 'submitting' ? (<><Loader2 size={16} className="animate-spin"/> Sending…</>) : (<>{submitLabel} <ArrowRight size={16}/></>)}
      </button>

      {externalCTA && (
        <div className="pt-2 text-center">
          {externalCTA.hint && <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{externalCTA.hint}</p>}
          <a href={externalCTA.href} target="_blank" rel="noopener noreferrer"
             className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${a.text} hover:opacity-80 transition`}>
            {externalCTA.label} <ArrowRight size={12}/>
          </a>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest">
        <Shield size={11}/> FSRA-licensed · Response {responseWindow}
      </p>
    </form>
  );
}
