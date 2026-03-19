'use client';

import React, { useState } from 'react';
import { ArrowRight, Check, Home, DollarSign, TrendingUp, AlertCircle, ChevronLeft } from 'lucide-react';
import { LeadService } from '../services/LeadService'; 

type Step = 'GOAL' | 'TIMELINE' | 'DETAILS' | 'SUCCESS';

// --- DATA CONSTANTS ---
const GOAL_OPTIONS = [
  { label: 'Buy a Property', icon: Home, val: 'Purchase' },
  { label: 'Refinance / Cash Out', icon: DollarSign, val: 'Refinance' },
  { label: 'Renewal Transfer', icon: TrendingUp, val: 'Renewal' },
  { label: 'Private / Bad Credit', icon: AlertCircle, val: 'Private Lending' },
];

const TIMELINE_OPTIONS = [
  'Immediately (Accepted Offer)', 
  'Within 30 Days', 
  '3 - 6 Months', 
  'Just Researching'
];

export default function GamifiedContactForm() {
  const [step, setStep] = useState<Step>('GOAL');
  const [formData, setFormData] = useState({
    goal: '',
    timeline: '',
    name: '',
    phone: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(''); 

  // --- HANDLERS ---
  const handleSelect = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'goal') setStep('TIMELINE');
    if (field === 'timeline') setStep('DETAILS');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // REAL-TIME PHONE FORMATTER
    const cleaned = value.replace(/\D/g, ''); 
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (match) {
      value = !match[2] 
        ? match[1] 
        : `(${match[1]}) ${match[2]}` + (match[3] ? `-${match[3]}` : '');
    }
    
    if (value.length > 14) return;

    setFormData({ ...formData, phone: value });
    if (error) setError(''); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. STRICT 10-DIGIT PHONE VALIDATION
    const cleanedPhone = formData.phone.replace(/\D/g, ''); 
    if (cleanedPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    // 2. STRICT EMAIL VALIDATION (Regex)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address (e.g., name@domain.com).');
      return;
    }

    setIsSubmitting(true);
    setError(''); 
    
    await LeadService.submitLead({
       name: formData.name,
       email: formData.email,
       phone: cleanedPhone, 
       serviceNeeded: formData.goal,
       city: 'Gamified Form',
       message: `Timeline: ${formData.timeline}`,
       consent: true
    });
    
    setIsSubmitting(false);
    setStep('SUCCESS');
  };

  // --- UI ---
  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative z-20 h-full min-h-[500px] flex flex-col justify-center border border-gray-100">
      
      {/* PROGRESS BAR */}
      {step !== 'SUCCESS' && (
        <div className="absolute top-8 left-8 right-8">
           <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black transition-all duration-500 ease-out"
                style={{ width: step === 'GOAL' ? '33%' : step === 'TIMELINE' ? '66%' : '100%' }}
              ></div>
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 text-right">
              Step {step === 'GOAL' ? '1' : step === 'TIMELINE' ? '2' : '3'} of 3
           </p>
        </div>
      )}

      {/* STEP 1: GOAL */}
      {step === 'GOAL' && (
        <div className="mt-8 animate-fade-in">
           <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-900">What is your mission?</h3>
           <p className="text-gray-500 text-sm mb-8">Select the option that best describes your needs.</p>
           
           <div className="grid grid-cols-1 gap-3">
              {GOAL_OPTIONS.map((opt) => (
                <button
                   key={opt.val}
                   onClick={() => handleSelect('goal', opt.val)}
                   className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 bg-white hover:border-black hover:bg-gray-50 transition text-left group w-full"
                >
                   <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-white transition shrink-0">
                      <opt.icon size={18} />
                   </div>
                   <span className="font-bold text-sm uppercase tracking-wide text-slate-900">{opt.label}</span>
                   <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-black" />
                </button>
              ))}
           </div>
        </div>
      )}

      {/* STEP 2: TIMELINE */}
      {step === 'TIMELINE' && (
        <div className="mt-8 animate-fade-in">
           <button onClick={() => setStep('GOAL')} className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-6 hover:text-black transition">
              <ChevronLeft size={12}/> Back
           </button>
           <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-900">When do you need funds?</h3>
           <p className="text-gray-500 text-sm mb-8">This helps us prioritize your file.</p>
           
           <div className="grid grid-cols-1 gap-3">
              {TIMELINE_OPTIONS.map((opt) => (
                <button
                   key={opt}
                   onClick={() => handleSelect('timeline', opt)}
                   className="p-5 rounded-xl border-2 border-gray-100 bg-white hover:border-black hover:bg-gray-50 transition text-left font-bold text-sm uppercase tracking-wide text-slate-900 w-full"
                >
                   {opt}
                </button>
              ))}
           </div>
        </div>
      )}

      {/* STEP 3: CONTACT DETAILS */}
      {step === 'DETAILS' && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 animate-fade-in">
           <button type="button" onClick={() => setStep('TIMELINE')} className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-2 hover:text-black transition">
              <ChevronLeft size={12}/> Back
           </button>
           
           <div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-900">Final Step.</h3>
              <p className="text-gray-500 text-sm mb-6">Where should we send your strategy?</p>
           </div>

           <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Full Name</label>
              <input 
                 required
                 type="text" 
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition placeholder:text-gray-300"
                 placeholder="Jane Doe"
              />
           </div>
           
           <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Mobile Phone</label>
              <input 
                 required
                 type="tel" 
                 value={formData.phone}
                 onChange={handlePhoneChange}
                 className={`w-full bg-gray-50 text-slate-900 border rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-1 transition placeholder:text-gray-300 ${error && error.includes('phone') ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-black focus:ring-black'}`}
                 placeholder="(437) 241-6392"
              />
           </div>

           <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Email Address</label>
              <input 
                 required
                 type="email" 
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})}
                 className={`w-full bg-gray-50 text-slate-900 border rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-1 transition placeholder:text-gray-300 ${error && error.includes('email') ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-black focus:ring-black'}`}
                 placeholder="jane@example.com"
              />
           </div>

           {/* VALIDATION ERROR DISPLAY */}
           {error && (
             <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 animate-shake mt-2 mb-2">
               <AlertCircle className="text-red-500 shrink-0" size={18} />
               <p className="text-red-700 text-xs font-bold uppercase tracking-wide">{error}</p>
             </div>
           )}

           <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition shadow-xl mt-4 flex items-center justify-center gap-2"
           >
              {isSubmitting ? 'Analyzing...' : 'Get My Strategy'} <ArrowRight size={16} />
           </button>
           
           <p className="text-[9px] text-center text-gray-400 mt-4 leading-relaxed">
             By clicking above, you agree to our privacy policy. Your data is encrypted and never sold.
           </p>
        </form>
      )}

      {/* SUCCESS STATE */}
      {step === 'SUCCESS' && (
        <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
           <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-green-200 shadow-xl">
              <Check size={40} strokeWidth={4} />
           </div>
           <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-900">Received!</h3>
           <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
              We have received your request. A Senior Advisor is reviewing your file and will contact you at <strong>{formData.phone}</strong> shortly.
           </p>
           <button onClick={() => { setStep('GOAL'); setFormData({ goal: '', timeline: '', name: '', phone: '', email: '' }); }} className="text-xs font-bold underline text-black">Start Over</button>
        </div>
      )}

    </div>
  );
}