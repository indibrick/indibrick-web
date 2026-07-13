'use client';

// Instant Renewal Rescue capture. Three fields only — email + mortgage
// balance + renewal month — because the anti-pattern for this segment is a
// 12-field wizard that reads as another bank application. On submit, we
// POST to /api/leads/submit (which already writes to Firestore + injects
// into the CRM inbox), then show a success card so the visitor sees the
// "Report on the way" reassurance without a hard page nav.

import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, Shield } from 'lucide-react';

const RENEWAL_MONTHS = (() => {
  // Build the next 24 months forward from the current month so the picker
  // stays fresh without a rebuild.
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
    out.push({ value, label });
  }
  return out;
})();

export default function RenewalRescueForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('');
  const [renewalMonth, setRenewalMonth] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setErrorMsg('Please confirm consent to receive your report.'); return; }
    setStatus('submitting'); setErrorMsg('');

    // The CRM expects (name, phone, serviceNeeded). We fold the renewal
    // context into `message` + `notes` so the agent opening the file sees
    // exactly the balance + renewal month + current rate the visitor entered.
    const message = [
      `RENEWAL RESCUE REPORT REQUEST`,
      `Mortgage balance: ${balance ? `$${Number(balance).toLocaleString('en-CA')}` : 'not provided'}`,
      `Renewal month: ${renewalMonth ? RENEWAL_MONTHS.find(m => m.value === renewalMonth)?.label : 'not provided'}`,
      `Current rate: ${currentRate ? `${currentRate}%` : 'not provided'}`,
    ].join('\n');

    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          serviceNeeded: 'Mortgage Renewal',
          message,
          pageSource: '/renewal-rescue',
          source: 'renewal-rescue-report',
          goal: 'Renewal',
          province: 'ON',
          mortgageBalance: balance ? Number(balance) : null,
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
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Report on the way</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          A licensed IndiBrick broker will email your <strong>Renewal Rescue Report</strong> within 2 business hours — the exact side-by-side of your bank's likely offer vs today's broker-channel rates, and the 5-year interest delta on your balance.
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
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Free · No credit pull</p>
        <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Get Your Renewal Rescue Report</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Your Name</label>
          <input required value={name} onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Phone</label>
          <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="(416) 555-0100"
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Email</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="jane@example.com"
          className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Mortgage Balance</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input required type="number" min="0" step="1000" value={balance} onChange={e => setBalance(e.target.value)}
              placeholder="450,000"
              className="w-full pl-7 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Renewal Month</label>
          <select required value={renewalMonth} onChange={e => setRenewalMonth(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer">
            <option value="">Select…</option>
            {RENEWAL_MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Rate <span className="text-gray-400 normal-case tracking-normal font-medium">(optional — helps with accuracy)</span></label>
        <div className="relative">
          <input type="number" step="0.01" min="0" max="15" value={currentRate} onChange={e => setCurrentRate(e.target.value)}
            placeholder="2.14"
            className="w-full p-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
        </div>
      </div>

      <label className="flex items-start gap-2 pt-1 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
          className="mt-1 w-4 h-4 accent-blue-600 cursor-pointer"/>
        <span className="text-[11px] text-gray-500 leading-relaxed">
          I agree to receive my Renewal Rescue Report and follow-up from an IndiBrick licensed broker by email, phone, or SMS. I can unsubscribe anytime. See our <a href="/privacy" className="underline">Privacy Policy</a>.
        </span>
      </label>

      {errorMsg && <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/30 disabled:opacity-60"
      >
        {status === 'submitting' ? (<><Loader2 size={16} className="animate-spin"/> Preparing your report…</>) : (<>See My Renewal Savings <ArrowRight size={16}/></>)}
      </button>

      <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest">
        <Shield size={11}/> FSRA-licensed · Response in &lt; 2 hours
      </p>
    </form>
  );
}
