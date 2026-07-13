'use client';

// Debt Consolidation / Refi Payout capture. The math sells itself — the
// form just harvests the inputs so the broker can build the side-by-side.
// We ask for the debt breakdown because that's the entire story: high-APR
// unsecured debt refinanced into low-rate home equity.

import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, Shield } from 'lucide-react';

export default function RefiPayoutForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mortgageBalance, setMortgageBalance] = useState('');
  const [homeValue, setHomeValue] = useState('');
  const [creditCardDebt, setCreditCardDebt] = useState('');
  const [otherDebt, setOtherDebt] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Live preview of the pain so the visitor sees a real number before they
  // even submit. Assumes 22% APR on the credit-card side — conservative,
  // most CIBC/RBC/TD unsecured lines are 19.99%–24.99% in 2026.
  const ccMonthlyInterest = (Number(creditCardDebt) || 0) * 0.22 / 12;
  const heMonthlyInterest = (Number(creditCardDebt) || 0) * 0.075 / 12; // ~HELOC prime + 0.5
  const monthlyDelta = Math.max(0, ccMonthlyInterest - heMonthlyInterest);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setErrorMsg('Please confirm consent to receive your plan.'); return; }
    setStatus('submitting'); setErrorMsg('');

    const message = [
      `REFI PAYOUT PLAN REQUEST`,
      `Mortgage balance: ${mortgageBalance ? `$${Number(mortgageBalance).toLocaleString('en-CA')}` : 'not provided'}`,
      `Home value (estimate): ${homeValue ? `$${Number(homeValue).toLocaleString('en-CA')}` : 'not provided'}`,
      `Credit card debt: ${creditCardDebt ? `$${Number(creditCardDebt).toLocaleString('en-CA')}` : 'not provided'}`,
      `Other unsecured debt: ${otherDebt ? `$${Number(otherDebt).toLocaleString('en-CA')}` : 'not provided'}`,
      `Postal code: ${postalCode || 'not provided'}`,
    ].join('\n');

    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          serviceNeeded: 'Refinance / Debt Consolidation',
          message,
          pageSource: '/refi-payout-plan',
          source: 'refi-payout-plan',
          goal: 'Refinance',
          province: 'ON',
          city: postalCode.trim(),
          mortgageBalance: mortgageBalance ? Number(mortgageBalance) : null,
          propertyValue: homeValue ? Number(homeValue) : null,
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
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-emerald-100 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-white" />
        </div>
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Plan on the way</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          A licensed IndiBrick broker will email your <strong>Refi Payout Plan</strong> — current vs consolidated payment, break-even month on any penalty, and five-year cash-flow delta — within <strong>24 hours</strong>.
        </p>
        <p className="text-[11px] text-gray-400 mt-4 font-bold uppercase tracking-widest">
          No credit pull · No obligation
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 space-y-4">
      <div className="text-center mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Free · No credit pull</p>
        <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Get Your Refi Payout Plan</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Your Name</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition"/>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Phone</label>
          <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(416) 555-0100"
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition"/>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Email</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com"
          className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Mortgage Balance</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input required type="number" min="0" step="1000" value={mortgageBalance} onChange={e => setMortgageBalance(e.target.value)}
              placeholder="450,000"
              className="w-full pl-7 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition"/>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Home Value (estimate)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input required type="number" min="0" step="1000" value={homeValue} onChange={e => setHomeValue(e.target.value)}
              placeholder="850,000"
              className="w-full pl-7 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition"/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Credit Card Debt</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input required type="number" min="0" step="500" value={creditCardDebt} onChange={e => setCreditCardDebt(e.target.value)}
              placeholder="60,000"
              className="w-full pl-7 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition"/>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Other Debt <span className="text-gray-400 normal-case tracking-normal font-medium">(LOCs, loans)</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input type="number" min="0" step="500" value={otherDebt} onChange={e => setOtherDebt(e.target.value)}
              placeholder="15,000"
              className="w-full pl-7 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition"/>
          </div>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Postal Code</label>
        <input required value={postalCode} onChange={e => setPostalCode(e.target.value.toUpperCase())}
          placeholder="M5V 3A8" maxLength={7}
          className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition"/>
      </div>

      {/* Live preview — the visitor sees the pain before they hit submit. */}
      {monthlyDelta > 50 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-baseline justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Est. monthly cash flow back</p>
            <p className="text-[11px] text-gray-500">Based on your inputs · 22% → 7.5% APR delta</p>
          </div>
          <p className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-700 tabular-nums">
            +${Math.round(monthlyDelta).toLocaleString('en-CA')}/mo
          </p>
        </div>
      )}

      <label className="flex items-start gap-2 pt-1 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
          className="mt-1 w-4 h-4 accent-emerald-600 cursor-pointer"/>
        <span className="text-[11px] text-gray-500 leading-relaxed">
          I agree to receive my Refi Payout Plan and follow-up from an IndiBrick licensed broker. See our <a href="/privacy" className="underline">Privacy Policy</a>.
        </span>
      </label>

      {errorMsg && <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/30 disabled:opacity-60"
      >
        {status === 'submitting' ? (<><Loader2 size={16} className="animate-spin"/> Building your plan…</>) : (<>Show Me My Refi Payout <ArrowRight size={16}/></>)}
      </button>

      <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest">
        <Shield size={11}/> FSRA-licensed · Delivered in &lt; 24 hours
      </p>
    </form>
  );
}
