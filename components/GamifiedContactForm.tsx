'use client';

import React, { useState } from 'react';
import { ArrowRight, Home, DollarSign, TrendingUp, AlertCircle, ChevronLeft, ShieldCheck, Phone } from 'lucide-react';
import { LeadService } from '../services/LeadService';

type Step = 'GOAL' | 'DETAILS' | 'CONTACT' | 'SUCCESS';

const GOAL_OPTIONS = [
  { label: 'Buy a Property', icon: Home, val: 'Purchase' },
  { label: 'Refinance / Cash Out', icon: DollarSign, val: 'Refinance' },
  { label: 'Renewal Transfer', icon: TrendingUp, val: 'Renewal' },
  { label: 'Private / Bad Credit', icon: AlertCircle, val: 'Private Lending' },
];

const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
  'Prince Edward Island', 'Quebec', 'Saskatchewan',
];

const EMPLOYMENT_TYPES = ['Employed Full-Time', 'Self-Employed', 'Retired', 'Other'];

export default function GamifiedContactForm() {
  const [step, setStep] = useState<Step>('GOAL');
  const [formData, setFormData] = useState({
    goal: '',
    province: '',
    propertyValue: '',
    mortgageBalance: '',
    employmentType: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedTier, setSubmittedTier] = useState('');

  const setField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleGoalSelect = (val: string) => {
    setFormData(prev => ({ ...prev, goal: val }));
    setStep('DETAILS');
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

  // Spec: LTV is null for Purchase; lenderTier mapping (LTV-only since /contact does not collect credit).
  const computeLenderTier = () => {
    if (formData.goal === 'Purchase') return { ltv: null as number | null, tier: 'Purchase' };
    const pv = Number(formData.propertyValue) || 0;
    const mb = Number(formData.mortgageBalance) || 0;
    const ltv = pv > 0 ? Math.round((mb / pv) * 100) : null;
    if (formData.goal === 'Private Lending') return { ltv, tier: 'Private' };
    if (ltv != null && ltv > 80) return { ltv, tier: 'B-Lender' };
    return { ltv, tier: 'A-Lender' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) return setError('Please enter your first and last name.');
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) return setError('Please enter a valid 10-digit phone number.');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) return setError('Please enter a valid email address.');
    if (!formData.consent) return setError('Please confirm consent to proceed.');

    const { ltv, tier } = computeLenderTier();

    setIsSubmitting(true);
    setError('');

    // TrustedForm consent certificate (populated by the loader script on /contact)
    const trustedFormCertUrl = (document.getElementById('xxTrustedFormCertUrl') as HTMLInputElement | null)?.value || '';

    const result = await LeadService.submitLead({
      // Legacy fields kept so the existing CRM/email pipeline keeps working
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email,
      phone: cleanedPhone,
      serviceNeeded: formData.goal,
      city: formData.province || 'Contact Wizard',
      message: `Goal: ${formData.goal} · Province: ${formData.province}${formData.propertyValue ? ` · Value: $${Number(formData.propertyValue).toLocaleString()}` : ''}${formData.mortgageBalance && formData.goal !== 'Purchase' ? ` · Balance: $${Number(formData.mortgageBalance).toLocaleString()}` : ''}${ltv != null ? ` · LTV: ${ltv}%` : ''} · Tier: ${tier}${formData.employmentType ? ` · Employment: ${formData.employmentType}` : ''}`,
      consent: true,
      // Wizard extensions — the API persists these on the lead doc + CRM referral
      source: 'contact-wizard',
      goal: formData.goal,
      province: formData.province,
      propertyValue: Number(formData.propertyValue) || null,
      mortgageBalance: formData.goal === 'Purchase' ? null : (Number(formData.mortgageBalance) || null),
      ltv,
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
    setStep('SUCCESS');
  };

  // Step 2 Next is enabled only once we have the data we need to compute LTV / tier.
  const detailsValid = !!formData.province && !!formData.propertyValue && (formData.goal === 'Purchase' || !!formData.mortgageBalance);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative z-20 h-full min-h-[500px] flex flex-col justify-center border border-gray-100">

      {step !== 'SUCCESS' && (
        <div className="absolute top-8 left-8 right-8">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black transition-all duration-500 ease-out" style={{ width: step === 'GOAL' ? '33%' : step === 'DETAILS' ? '66%' : '100%' }}></div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 text-right">Step {step === 'GOAL' ? '1' : step === 'DETAILS' ? '2' : '3'} of 3</p>
        </div>
      )}

      {step === 'GOAL' && (
        <div className="mt-8 animate-fade-in">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-900">What is your mission?</h3>
          <p className="text-gray-500 text-sm mb-8">Select the option that best describes your needs.</p>
          <div className="grid grid-cols-1 gap-3">
            {GOAL_OPTIONS.map((opt) => (
              <button key={opt.val} onClick={() => handleGoalSelect(opt.val)} className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-black hover:bg-gray-50 transition text-left group w-full">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-white transition shrink-0"><opt.icon size={18} /></div>
                <span className="font-bold text-sm uppercase tracking-wide text-slate-900">{opt.label}</span>
                <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-black" />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'DETAILS' && (
        <div className="mt-8 animate-fade-in">
          <button onClick={() => setStep('GOAL')} className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-6 hover:text-black transition"><ChevronLeft size={12}/> Back</button>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-900">A few details.</h3>
          <p className="text-gray-500 text-sm mb-6">This helps us route your file to the right desk.</p>

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
            disabled={!detailsValid}
            onClick={() => setStep('CONTACT')}
            className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition shadow-xl mt-6 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 'CONTACT' && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 animate-fade-in">
          <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" />
          <button type="button" onClick={() => setStep('DETAILS')} className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-2 hover:text-black transition"><ChevronLeft size={12}/> Back</button>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-900">Final step.</h3>
            <p className="text-gray-500 text-sm mb-6">Where should we send your strategy?</p>
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
            {isSubmitting ? 'Submitting...' : 'Get My Strategy'} <ArrowRight size={16} />
          </button>
          <p className="text-[9px] text-center text-gray-400 mt-4 leading-relaxed">Your data is encrypted and never sold.</p>
        </form>
      )}

      {step === 'SUCCESS' && (
        <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in py-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-green-200 shadow-xl mx-auto">
            <ShieldCheck size={40} strokeWidth={2} />
          </div>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3 text-slate-900">Your file is being reviewed</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm">Expect a call from a licensed advisor within <strong>1 business hour</strong>.</p>

          <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Your Strategy Brief</p>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900"><span className="text-gray-500 font-medium">Goal: </span>{formData.goal || '—'}</p>
              <p className="text-sm font-bold text-slate-900"><span className="text-gray-500 font-medium">Lender Tier: </span>{submittedTier || '—'}</p>
            </div>
          </div>

          <a href="tel:+14372416392" className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition shadow-xl flex items-center justify-center gap-2">
            <Phone size={16} /> Call Us Now
          </a>
        </div>
      )}

    </div>
  );
}
