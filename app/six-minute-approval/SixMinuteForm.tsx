'use client';

// 1-Hour Approval Snapshot capture. Higher friction (income + down
// payment) than Renewal Rescue on purpose — this is a purchase-intent
// filter. GTA buyers who want a number, not a marketing email, get a
// callback from a licensed broker within one business hour. For visitors
// who'd rather self-serve, the page also links to the Pineapple instant
// pre-approval tool.

import React, { useState } from 'react';
import { ArrowRight, Check, Loader2, Shield, Clock } from 'lucide-react';

export default function SixMinuteForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [income, setIncome] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [employment, setEmployment] = useState('');
  const [creditRange, setCreditRange] = useState('');
  const [city, setCity] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setErrorMsg('Please confirm consent to receive your snapshot.'); return; }
    setStatus('submitting'); setErrorMsg('');

    const message = [
      `APPROVAL SNAPSHOT REQUEST (1-hour advisor callback)`,
      `Household income: ${income ? `$${Number(income).toLocaleString('en-CA')}` : 'not provided'}`,
      `Down payment ready: ${downPayment ? `$${Number(downPayment).toLocaleString('en-CA')}` : 'not provided'}`,
      `Employment: ${employment || 'not provided'}`,
      `Credit range: ${creditRange || 'not provided'}`,
      `City/region: ${city || 'not provided'}`,
    ].join('\n');

    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          serviceNeeded: 'Purchase — Pre-Approval',
          message,
          pageSource: '/six-minute-approval',
          source: '1-hour-approval-callback',
          goal: 'Purchase',
          province: 'ON',
          city: city.trim(),
          employmentType: employment,
          creditRange,
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
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Snapshot on the way</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          A licensed IndiBrick advisor will call you within <strong>1 business hour</strong> with your conditional qualification range and today's stress-tested rate.
        </p>
        <p className="text-[11px] text-gray-400 mt-4 font-bold uppercase tracking-widest">
          No credit pull for the snapshot · No obligation
        </p>
        <div className="mt-6 pt-6 border-t border-emerald-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Want it now, self-serve?</p>
          <a
            href="https://gopineapple.ca/muditchhura/preapproval"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition"
          >
            Try our instant pre-approval tool <ArrowRight size={14}/>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 space-y-4">
      <div className="text-center mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 flex items-center justify-center gap-1.5"><Clock size={12}/> Callback within 1 business hour</p>
        <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Get Your Approval Snapshot</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Your Name</label>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Phone</label>
          <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(416) 555-0100"
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Email</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com"
          className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Household Income</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input required type="number" min="0" step="1000" value={income} onChange={e => setIncome(e.target.value)}
              placeholder="120,000"
              className="w-full pl-7 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Down Payment Ready</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input required type="number" min="0" step="1000" value={downPayment} onChange={e => setDownPayment(e.target.value)}
              placeholder="50,000"
              className="w-full pl-7 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Employment</label>
          <select required value={employment} onChange={e => setEmployment(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer">
            <option value="">Select…</option>
            <option value="T4 Full-time">T4 Full-time</option>
            <option value="T4 Part-time">T4 Part-time</option>
            <option value="Self-employed (BFS)">Self-employed (BFS)</option>
            <option value="Commission">Commission</option>
            <option value="Contract">Contract</option>
            <option value="Retired / Pension">Retired / Pension</option>
            <option value="New to Canada">New to Canada</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Credit</label>
          <select required value={creditRange} onChange={e => setCreditRange(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer">
            <option value="">Select…</option>
            <option value="Excellent (720+)">Excellent (720+)</option>
            <option value="Good (680–719)">Good (680–719)</option>
            <option value="Fair (620–679)">Fair (620–679)</option>
            <option value="Bruised (below 620)">Bruised (below 620)</option>
            <option value="Not sure">Not sure</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Buying in <span className="text-gray-400 normal-case tracking-normal font-medium">(city or region)</span></label>
        <input required value={city} onChange={e => setCity(e.target.value)} placeholder="Toronto, Mississauga, Ottawa…"
          className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"/>
      </div>

      <label className="flex items-start gap-2 pt-1 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
          className="mt-1 w-4 h-4 accent-blue-600 cursor-pointer"/>
        <span className="text-[11px] text-gray-500 leading-relaxed">
          I agree to receive my Approval Snapshot and a callback from an IndiBrick licensed advisor within 1 business hour. See our <a href="/privacy" className="underline">Privacy Policy</a>.
        </span>
      </label>

      {errorMsg && <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/30 disabled:opacity-60"
      >
        {status === 'submitting' ? (<><Loader2 size={16} className="animate-spin"/> Sending to an advisor…</>) : (<>Get My Approval Snapshot <ArrowRight size={16}/></>)}
      </button>

      {/* Escape hatch for visitors who want the answer NOW, not in an hour.
          Sends them straight to the Pineapple co-branded pre-approval tool. */}
      <div className="pt-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Or skip the wait</p>
        <a
          href="https://gopineapple.ca/muditchhura/preapproval"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition"
        >
          Try our instant pre-approval tool <ArrowRight size={12}/>
        </a>
      </div>

      <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest">
        <Shield size={11}/> FSRA-licensed · No credit pull for the snapshot
      </p>
    </form>
  );
}
