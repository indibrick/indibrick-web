'use client';

// Shared waitlist form used by both /for-realtors and
// /for-insurance-agents. Different vocabulary per kind but identical
// mechanics. Posts to /api/partner/waitlist and shows the scarcity
// counter fetched from the same endpoint.

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, Lock, ArrowRight } from 'lucide-react';

interface WaitlistFormProps {
  kind: 'realtor' | 'insurance_agent';
  accentClass?: string;   // e.g. 'bg-blue-600' or 'bg-emerald-600' for CTA
  brokerageLabel?: string; // 'Brokerage' vs 'Agency'
  volumeLabel?: string;    // 'Sides / yr' vs 'Policies bound / yr'
  volumeHint?: string;
}

interface Capacity {
  totalSpots: number;
  spotsRemaining: number;
  territory: string;
}

export default function WaitlistForm({
  kind,
  accentClass = 'bg-blue-600 hover:bg-blue-500',
  brokerageLabel = 'Brokerage',
  volumeLabel = 'Deals / year',
  volumeHint = 'ballpark is fine',
}: WaitlistFormProps) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    brokerage: '', territory: '', volume: '', notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; spotsRemaining: number; totalSpots: number } | null>(null);
  const [capacity, setCapacity] = useState<Capacity | null>(null);

  useEffect(() => {
    // Fetch scarcity counter. Failure = show the form without the badge.
    fetch(`/api/partner/waitlist?kind=${kind}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCapacity(d); })
      .catch(() => {});
  }, [kind]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/partner/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, kind }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setStatus('error'); setError(data.error || 'Submission failed.'); return; }
      setResult({ status: data.status, spotsRemaining: data.spotsRemaining, totalSpots: data.totalSpots });
      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setError('Network error. Please retry.');
    }
  };

  if (status === 'success' && result) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
          <CheckCircle size={28} className="text-emerald-600" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          {result.status === 'active' ? "You're in." : "You're on the list."}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {result.status === 'active'
            ? 'Our team will reach out within 2 business hours to walk you through onboarding.'
            : `The current cohort is full. You'll be reviewed as spots open. Watch for an email from ${kind === 'realtor' ? 'partners@indibrick.ca' : 'insurance@indibrick.ca'}.`}
        </p>
        <div className="border-t border-gray-100 pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <Lock size={10}/> We never share your info · PIPEDA compliant
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="mb-5">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Request access</h3>
        <p className="text-sm text-gray-600">Two business hours max response. Ontario partners only.</p>
        {capacity && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"/>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
              {capacity.spotsRemaining > 0
                ? `${capacity.spotsRemaining} of ${capacity.totalSpots} ${capacity.territory} spots open`
                : `${capacity.territory} cohort full — waitlist only`}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <label>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Full name *</span>
          <input
            type="text" required value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black text-slate-900"
          />
        </label>
        <label>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Email *</span>
          <input
            type="email" required value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black text-slate-900"
          />
        </label>
        <label>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Mobile</span>
          <input
            type="tel" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black text-slate-900"
          />
        </label>
        <label>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">{brokerageLabel}</span>
          <input
            type="text" value={form.brokerage}
            onChange={e => setForm(p => ({ ...p, brokerage: e.target.value }))}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black text-slate-900"
          />
        </label>
        <label>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Primary territory</span>
          <input
            type="text" value={form.territory}
            onChange={e => setForm(p => ({ ...p, territory: e.target.value }))}
            placeholder="e.g. Toronto core, Peel Region"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black text-slate-900"
          />
        </label>
        <label>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">{volumeLabel}</span>
          <input
            type="text" value={form.volume}
            onChange={e => setForm(p => ({ ...p, volume: e.target.value }))}
            placeholder={volumeHint}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black text-slate-900"
          />
        </label>
      </div>
      <label className="block mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Anything we should know?</span>
        <textarea
          rows={2} value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          placeholder="Current CRM, specialty carriers, cross-sell goals — optional."
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm outline-none focus:border-black text-slate-900 resize-none"
        />
      </label>

      {error && <p className="text-xs text-red-600 font-bold mb-3">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`w-full ${accentClass} text-white px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2`}
      >
        {status === 'submitting' ? (<><Loader2 className="animate-spin" size={14}/> Submitting…</>) : (<>Request access <ArrowRight size={14}/></>)}
      </button>
      <p className="text-[10px] text-gray-500 font-medium text-center mt-3 flex items-center justify-center gap-1">
        <Lock size={10}/> No spam · PIPEDA-compliant · Unsubscribe anytime
      </p>
    </form>
  );
}
