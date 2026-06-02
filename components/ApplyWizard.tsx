'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowRight, ChevronLeft, Home, RefreshCcw, DollarSign,
  AlertCircle, Phone, Sparkles, CheckCircle, TrendingDown,
} from 'lucide-react';
import { LeadService } from '../services/LeadService';

type Step = 'GOAL' | 'PROPERTY' | 'CREDIT' | 'CONTACT' | 'SUCCESS';

const APPLY_GOAL_OPTIONS = [
  { label: 'Refinance my mortgage', val: 'Refinance', icon: RefreshCcw },
  { label: 'Access my home equity', val: 'Home Equity', icon: DollarSign },
  { label: 'Consolidate debt into my mortgage', val: 'Debt Consolidation', icon: TrendingDown },
  { label: 'Buy a home', val: 'Purchase', icon: Home },
];

const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
  'Prince Edward Island', 'Quebec', 'Saskatchewan',
];

const CREDIT_RANGES = [
  { label: 'Excellent', sub: '720+', val: 'Excellent' },
  { label: 'Good', sub: '660–719', val: 'Good' },
  { label: 'Fair', sub: '600–659', val: 'Fair' },
  { label: 'Needs work', sub: 'Below 600', val: 'Needs work' },
];

const EMPLOYMENT_TYPES = ['Employed full-time', 'Self-employed', 'Retired', 'Other'];

// Tier-based confirmation copy + indicative rate (mirrors what's surfaced on /rates).
const TIER_CONFIRM: Record<string, { headline: string; rate: string; accent: string }> = {
  'A-Lender': { headline: 'Great news — you likely qualify for our best rates.', rate: 'Rates from 3.59%*', accent: 'from-green-500 to-emerald-600' },
  'B-Lender': { headline: 'Good news — we have lenders who specialize in your profile.', rate: 'Rates from 4.79%*', accent: 'from-blue-500 to-indigo-600' },
  'Private':  { headline: 'We can help — our private capital network is built for situations like yours.', rate: 'Rates from 5.49%*', accent: 'from-amber-500 to-orange-600' },
};

export default function ApplyWizard() {
  const [step, setStep] = useState<Step>('GOAL');
  const [formData, setFormData] = useState({
    goal: '',
    province: '',
    propertyValue: '',
    mortgageBalance: '',
    creditRange: '',
    employmentType: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedTier, setSubmittedTier] = useState('');
  const [submittedLtv, setSubmittedLtv] = useState<number | null>(null);

  const setField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleGoalSelect = (val: string) => {
    setFormData(prev => ({ ...prev, goal: val }));
    setStep('PROPERTY');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    let value = cleaned;
    if (match) {
      value = !match[2] ? match[1] : `${match[1]}-${match[2]}` + (match[3] ? `-${match[3]}` : '');
    }
    if (value.length > 12) return;
    setFormData(prev => ({ ...prev, phone: value }));
    if (error) setError('');
  };

  // Live LTV — recomputes as the agent types on Step 2. Null when goal is Purchase or values missing.
  const liveLtv = useMemo(() => {
    if (formData.goal === 'Purchase') return null;
    const pv = Number(formData.propertyValue) || 0;
    const mb = Number(formData.mortgageBalance) || 0;
    if (pv <= 0) return null;
    return Math.round((mb / pv) * 100);
  }, [formData.goal, formData.propertyValue, formData.mortgageBalance]);

  // Spec-accurate lenderTier (LTV + credit + goal). Buy a home → credit-only since LTV is unknown pre-offer.
  const computeApplyTier = (goal: string, creditVal: string, ltv: number | null): string => {
    if (goal === 'Purchase') {
      if (creditVal === 'Excellent' || creditVal === 'Good') return 'A-Lender';
      if (creditVal === 'Fair') return 'B-Lender';
      return 'Private';
    }
    if (creditVal === 'Needs work') return 'Private';
    const highLTV = ltv != null && ltv > 80;
    if (highLTV) {
      if (creditVal === 'Excellent' || creditVal === 'Good') return 'B-Lender';
      return 'Private';
    }
    if (creditVal === 'Excellent' || creditVal === 'Good') return 'A-Lender';
    if (creditVal === 'Fair') return 'B-Lender';
    return 'Private';
  };

  const propertyValid = !!formData.province && !!formData.propertyValue && (formData.goal === 'Purchase' || !!formData.mortgageBalance);
  const creditValid = !!formData.creditRange && !!formData.employmentType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) return setError('Please enter your first and last name.');
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) return setError('Please enter a valid 10-digit phone number.');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) return setError('Please enter a valid email address.');
    if (!formData.consent) return setError('Please confirm consent to proceed.');

    const ltv = liveLtv;
    const tier = computeApplyTier(formData.goal, formData.creditRange, ltv);

    setIsSubmitting(true);
    setError('');

    // TrustedForm consent certificate (populated by the loader script on /apply)
    const trustedFormCertUrl = (document.getElementById('xxTrustedFormCertUrl') as HTMLInputElement | null)?.value || '';

    const result = await LeadService.submitLead({
      // Legacy fields the existing CRM/email pipeline relies on
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email,
      phone: cleanedPhone,
      serviceNeeded: formData.goal,
      city: formData.province || 'Apply Wizard',
      message: `Goal: ${formData.goal} · Province: ${formData.province}${formData.propertyValue ? ` · Value: $${Number(formData.propertyValue).toLocaleString()}` : ''}${formData.mortgageBalance && formData.goal !== 'Purchase' ? ` · Balance: $${Number(formData.mortgageBalance).toLocaleString()}` : ''}${ltv != null ? ` · LTV: ${ltv}%` : ''} · Credit: ${formData.creditRange} · Tier: ${tier} · Employment: ${formData.employmentType}`,
      consent: true,
      // Wizard extensions — persisted on the lead + referral by /api/leads/submit
      source: 'apply-wizard',
      goal: formData.goal,
      province: formData.province,
      propertyValue: Number(formData.propertyValue) || null,
      mortgageBalance: formData.goal === 'Purchase' ? null : (Number(formData.mortgageBalance) || null),
      ltv,
      creditRange: formData.creditRange,
      employmentType: formData.employmentType,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      consentGiven: true,
      lenderTier: tier,
      trustedFormCertUrl,
    } as any);

    setIsSubmitting(false);
    if (!result.success) {
      setError('We could not submit your request. Please try again or call us directly.');
      return;
    }
    setSubmittedTier(tier);
    setSubmittedLtv(ltv);
    setStep('SUCCESS');
  };

  const stepIndex = step === 'GOAL' ? 1 : step === 'PROPERTY' ? 2 : step === 'CREDIT' ? 3 : 4;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl text-slate-900 relative border border-gray-100 overflow-hidden">

      {step !== 'SUCCESS' && (
        <div className="px-8 md:px-10 pt-8">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black transition-all duration-500 ease-out" style={{ width: `${(stepIndex / 4) * 100}%` }}></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 text-right">Step {stepIndex} of 4</p>
        </div>
      )}

      <div className="p-8 md:p-10">

        {/* STEP 1: GOAL */}
        {step === 'GOAL' && (
          <div className="animate-fade-in">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">What are you looking to do?</h3>
            <p className="text-gray-500 text-sm mb-8">Choose the option that matches your goal.</p>
            <div className="grid grid-cols-1 gap-3">
              {APPLY_GOAL_OPTIONS.map((opt) => (
                <button key={opt.val} onClick={() => handleGoalSelect(opt.val)} className="flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 bg-white hover:border-black hover:bg-gray-50 transition text-left group w-full">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-white transition shrink-0"><opt.icon size={20} /></div>
                  <span className="font-bold text-base uppercase tracking-wide text-slate-900">{opt.label}</span>
                  <ArrowRight size={18} className="ml-auto text-gray-300 group-hover:text-black" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: PROPERTY */}
        {step === 'PROPERTY' && (
          <div className="animate-fade-in">
            <button onClick={() => setStep('GOAL')} className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-6 hover:text-black transition"><ChevronLeft size={12}/> Back</button>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Tell us about the property.</h3>
            <p className="text-gray-500 text-sm mb-6">Used to estimate your loan-to-value ratio.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Province</label>
                <select required value={formData.province} onChange={e => setField('province', e.target.value)} className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition">
                  <option value="">Select your province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Estimated Property Value ($)</label>
                <input required type="number" inputMode="numeric" min={0} value={formData.propertyValue} onChange={e => setField('propertyValue', e.target.value)} placeholder="e.g. 750000" className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition placeholder:text-gray-300" />
              </div>

              {formData.goal !== 'Purchase' && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Remaining Mortgage Balance ($)</label>
                  <input required type="number" inputMode="numeric" min={0} value={formData.mortgageBalance} onChange={e => setField('mortgageBalance', e.target.value)} placeholder="e.g. 425000" className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition placeholder:text-gray-300" />
                </div>
              )}

              {formData.goal !== 'Purchase' && liveLtv != null && (
                <div className={`rounded-xl p-3 border flex items-center gap-2 animate-fade-in ${liveLtv > 80 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                  <Sparkles size={14} />
                  <p className="text-xs font-black uppercase tracking-widest">Estimated LTV: {liveLtv}%</p>
                </div>
              )}
              {formData.goal !== 'Purchase' && liveLtv != null && liveLtv > 80 && (
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed -mt-2">
                  High LTV — alternative lending options available.
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={!propertyValid}
              onClick={() => setStep('CREDIT')}
              className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition shadow-xl mt-6 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 3: CREDIT & EMPLOYMENT */}
        {step === 'CREDIT' && (
          <div className="animate-fade-in">
            <button onClick={() => setStep('PROPERTY')} className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-6 hover:text-black transition"><ChevronLeft size={12}/> Back</button>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Your profile.</h3>
            <p className="text-gray-500 text-sm mb-6">Self-reported — no hard credit check is run.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Credit Range</label>
                <div className="grid grid-cols-2 gap-2">
                  {CREDIT_RANGES.map(c => (
                    <button key={c.val} type="button" onClick={() => setField('creditRange', c.val)} className={`p-3 rounded-xl border-2 text-left transition ${formData.creditRange === c.val ? 'border-black bg-slate-900 text-white' : 'border-gray-100 bg-white text-slate-900 hover:border-black hover:bg-gray-50'}`}>
                      <p className="font-black text-xs uppercase tracking-wide">{c.label}</p>
                      <p className={`text-[10px] font-medium ${formData.creditRange === c.val ? 'text-gray-300' : 'text-gray-500'}`}>{c.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Employment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {EMPLOYMENT_TYPES.map(emp => (
                    <button key={emp} type="button" onClick={() => setField('employmentType', emp)} className={`p-3 rounded-xl border-2 text-left font-bold text-xs uppercase tracking-wide transition ${formData.employmentType === emp ? 'border-black bg-slate-900 text-white' : 'border-gray-100 bg-white text-slate-900 hover:border-black hover:bg-gray-50'}`}>{emp}</button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!creditValid}
              onClick={() => setStep('CONTACT')}
              className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition shadow-xl mt-6 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 4: CONTACT */}
        {step === 'CONTACT' && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" />
            <button type="button" onClick={() => setStep('CREDIT')} className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-2 hover:text-black transition"><ChevronLeft size={12}/> Back</button>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Where do we send your options?</h3>
              <p className="text-gray-500 text-sm mb-6">One licensed advisor reviews your file and calls within 1 business hour.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">First Name</label>
                <input required type="text" value={formData.firstName} onChange={e => setField('firstName', e.target.value)} className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition placeholder:text-gray-300" placeholder="Jane" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Last Name</label>
                <input required type="text" value={formData.lastName} onChange={e => setField('lastName', e.target.value)} className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition placeholder:text-gray-300" placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setField('email', e.target.value)} className={`w-full bg-gray-50 text-slate-900 border rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-1 transition placeholder:text-gray-300 ${error && error.includes('email') ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-black focus:ring-black'}`} placeholder="jane@example.com" />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Mobile Phone</label>
              <input required type="tel" value={formData.phone} onChange={handlePhoneChange} className={`w-full bg-gray-50 text-slate-900 border rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-1 transition placeholder:text-gray-300 ${error && error.includes('phone') ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-black focus:ring-black'}`} placeholder="416-000-0000" />
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none pt-2">
              <input type="checkbox" checked={formData.consent} onChange={e => setField('consent', e.target.checked)} className="mt-1 w-4 h-4 accent-black shrink-0" />
              <span className="text-[11px] text-gray-600 leading-relaxed">
                I consent to being contacted by a licensed mortgage professional. No hard credit check required.
              </span>
            </label>

            {error && (
              <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 animate-shake mt-2 mb-2">
                <AlertCircle className="text-red-500 shrink-0" size={18} />
                <p className="text-red-700 text-xs font-bold uppercase tracking-wide">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isSubmitting || !formData.consent} className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition shadow-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
              {isSubmitting ? 'Submitting...' : 'See My Options'} <ArrowRight size={16} />
            </button>
            <p className="text-[9px] text-center text-gray-400 mt-2 leading-relaxed">Your data is encrypted and never sold.</p>
          </form>
        )}

        {/* SUCCESS — tier-based confirmation */}
        {step === 'SUCCESS' && (() => {
          const cfg = TIER_CONFIRM[submittedTier] || TIER_CONFIRM['A-Lender'];
          return (
            <div className="text-center flex flex-col items-center animate-fade-in">
              <div className={`w-20 h-20 bg-gradient-to-br ${cfg.accent} rounded-full flex items-center justify-center text-white mb-6 shadow-xl`}>
                <CheckCircle size={40} strokeWidth={2} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3 text-slate-900 leading-tight">{cfg.headline}</h3>

              <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Your Snapshot</p>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-slate-900"><span className="text-gray-500 font-medium">Goal: </span>{formData.goal || '—'}</p>
                  {submittedLtv != null && <p className="text-sm font-bold text-slate-900"><span className="text-gray-500 font-medium">Estimated LTV: </span>{submittedLtv}%</p>}
                  <p className="text-sm font-bold text-slate-900"><span className="text-gray-500 font-medium">Lender Tier: </span>{submittedTier}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Indicative Rate</p>
                  <p className="text-2xl font-black text-slate-900">{cfg.rate}</p>
                </div>
              </div>

              <a href="tel:+14372416392" className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition shadow-xl flex items-center justify-center gap-2">
                <Phone size={16} /> Speak to Your Advisor Now
              </a>
              <p className="text-[11px] text-gray-500 font-medium mt-4">We&apos;ll also call you within 1 business hour.</p>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
