'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LeadForm from '../../components/LeadForm';
import AIIntakeForm from '../../components/AIIntakeForm';
import JsonLd from '../../components/JsonLd';
import { 
  TrendingDown, Shield, AlertTriangle, CheckCircle, 
  Banknote, Landmark, Percent, Lock, HelpCircle, 
  ChevronDown, ChevronUp, Activity, RefreshCw, ArrowRight, Home, Target, X, Clock, Info
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// --- 1. EXPANDED DATABASE MAPPING ---
const DEFAULT_RATES = {
  // Insured (Purchases < 20% down)
  insured_5yr_variable: '4.85',
  insured_5yr_fixed: '4.09',
  insured_3yr_fixed: '4.49',

  // Insurable Switch/Renewal (25yr amort, <$1M) - TIER 1
  insurable_under_65_5yr_variable: '4.95',
  insurable_under_65_5yr_fixed: '4.34',
  insurable_under_65_3yr_fixed: '4.64',

  // Insurable Switch/Renewal - TIER 2
  insurable_65_70_5yr_variable: '5.00',
  insurable_65_70_5yr_fixed: '4.39',
  insurable_65_70_3yr_fixed: '4.69',

  // Insurable Switch/Renewal - TIER 3
  insurable_70_80_5yr_variable: '5.05',
  insurable_70_80_5yr_fixed: '4.44',
  insurable_70_80_3yr_fixed: '4.74',

  // Uninsured (Purchases > 20% down & Refinances up to 30yr amort)
  uninsured_5yr_variable: '5.20',
  uninsured_5yr_fixed: '4.64',
  uninsured_3yr_fixed: '4.89',
  
  // Alternative
  b_lender: '5.49',
  private_1st: '6.99',
  second_mortgage: '8.99',

  // Compliance & Urgency
  lastUpdated: 'April 3, 2026'
};

const BENCHMARKS = {
  var_5yr: 6.10,
  fix_5yr: 4.84,
  fix_3yr: 5.15,
};

export default function RatesPage() {
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [loadingRates, setLoadingRates] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Toggle for 3-Year vs 5-Year Rates
  const [termToggle, setTermToggle] = useState<'5yr' | '3yr'>('5yr');

  // --- FULL-SCREEN QUOTER STATE ---
  const [quoteActive, setQuoteActive] = useState(false);
  const [quoteStep, setQuoteStep] = useState(1);
  const [qGoal, setQGoal] = useState<'Purchase' | 'Refinance' | 'Switch' | ''>('');
  const [qValue, setQValue] = useState('');
  const [qMortgage, setQMortgage] = useState('');
  const [qTerm, setQTerm] = useState('');
  const [qResultRate, setQResultRate] = useState('');
  const [formTab, setFormTab] = useState<'standard' | 'ai'>('standard');

  // Fetch Live Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'mortgage_rates');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRates({ ...DEFAULT_RATES, ...docSnap.data() });
        }
      } catch (e) {
        console.error("⚠️ Failed to fetch rates, using defaults:", e);
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
  }, []);

  const calcSave = (bankRate: number, ourRateStr: string) => {
    const ourRate = parseFloat(ourRateStr);
    if (isNaN(ourRate)) return "0.00";
    return (bankRate - ourRate).toFixed(2);
  };

  const toggleRow = (id: string) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  // Process the Personalized Quote
  const handleGenerateQuote = (selectedTerm: string) => {
    setQTerm(selectedTerm);
    const v = parseFloat(qValue) || 0;
    const m = parseFloat(qMortgage) || 0;
    const ltv = v > 0 ? (m / v) * 100 : 0;
    let finalRate = '0.00';

    if (qGoal === 'Purchase') {
       if (ltv > 80) finalRate = rates[`insured_${selectedTerm}` as keyof typeof rates] || rates.insured_5yr_fixed;
       else finalRate = rates[`uninsured_${selectedTerm}` as keyof typeof rates] || rates.uninsured_5yr_fixed;
    } else if (qGoal === 'Refinance') {
       finalRate = rates[`uninsured_${selectedTerm}` as keyof typeof rates] || rates.uninsured_5yr_fixed;
    } else if (qGoal === 'Switch') {
       if (ltv <= 65) finalRate = rates[`insurable_under_65_${selectedTerm}` as keyof typeof rates] || rates.insurable_under_65_5yr_fixed;
       else if (ltv <= 70) finalRate = rates[`insurable_65_70_${selectedTerm}` as keyof typeof rates] || rates.insurable_65_70_5yr_fixed;
       else finalRate = rates[`insurable_70_80_${selectedTerm}` as keyof typeof rates] || rates.insurable_70_80_5yr_fixed;
    }

    setQResultRate(finalRate);
    setQuoteStep(4);
  };

  const closeQuote = () => {
    setQuoteActive(false);
    setTimeout(() => { setQuoteStep(1); setQGoal(''); setQValue(''); setQMortgage(''); setFormTab('standard'); }, 300);
  };

  // --- DYNAMIC RATE TABLE DATA STRUCTURE ---
  const rateCategories = [
    {
      id: 'insured',
      title: 'Insured Mortgages',
      subtitle: 'For home purchases with less than 20% down payment.',
      icon: <Shield size={24} className="text-blue-500" />,
      color: 'blue',
      rates: termToggle === '5yr' ? [
        { id: 'ins_5v', name: '5-Year Variable', rate: rates.insured_5yr_variable, bench: BENCHMARKS.var_5yr, criteria: 'Mandatory CMHC default insurance. Max 25-year amortization. Property value must be under $1,000,000. Property must be owner-occupied.' },
        { id: 'ins_5f', name: '5-Year Fixed', rate: rates.insured_5yr_fixed, bench: BENCHMARKS.fix_5yr, criteria: 'Mandatory CMHC default insurance. Max 25-year amortization. Property value must be under $1,000,000. Property must be owner-occupied.' },
      ] : [
        { id: 'ins_3f', name: '3-Year Fixed', rate: rates.insured_3yr_fixed, bench: BENCHMARKS.fix_3yr, criteria: 'Mandatory CMHC default insurance. Max 25-year amortization. Property value must be under $1,000,000. Property must be owner-occupied.' },
      ]
    },
    {
      id: 'insurable',
      title: 'Insurable Mortgages (Renewals & Transfers)',
      subtitle: 'For switching lenders with 20%+ equity (Max 25-Yr Amortization).',
      icon: <RefreshCw size={24} className="text-green-500" />,
      color: 'green',
      rates: termToggle === '5yr' ? [
        { id: 'insur_65_5f', name: '5-Year Fixed (< 65% LTV)', rate: rates.insurable_under_65_5yr_fixed, bench: BENCHMARKS.fix_5yr, criteria: 'Property value under $1M. Max 25-year amortization. You must have at least 35% equity in the home. Lender pays insurance premium on backend.' },
        { id: 'insur_70_5f', name: '5-Year Fixed (65% - 70% LTV)', rate: rates.insurable_65_70_5yr_fixed, bench: BENCHMARKS.fix_5yr, criteria: 'Property value under $1M. Max 25-year amortization. You must have between 30% and 35% equity. Lender pays insurance premium on backend.' },
        { id: 'insur_80_5f', name: '5-Year Fixed (70% - 80% LTV)', rate: rates.insurable_70_80_5yr_fixed, bench: BENCHMARKS.fix_5yr, criteria: 'Property value under $1M. Max 25-year amortization. You must have between 20% and 30% equity. Lender pays insurance premium on backend.' },
        { id: 'insur_5v', name: '5-Year Variable', rate: rates.insurable_under_65_5yr_variable, bench: BENCHMARKS.var_5yr, criteria: 'Property value under $1M. Max 25-year amortization. Variable rates apply broadly across insurable tiers.' },
      ] : [
        { id: 'insur_65_3f', name: '3-Year Fixed (< 65% LTV)', rate: rates.insurable_under_65_3yr_fixed, bench: BENCHMARKS.fix_3yr, criteria: 'Property value under $1M. Max 25-year amortization. You must have at least 35% equity in the home. Lender pays insurance premium on backend.' },
        { id: 'insur_70_3f', name: '3-Year Fixed (65% - 70% LTV)', rate: rates.insurable_65_70_3yr_fixed, bench: BENCHMARKS.fix_3yr, criteria: 'Property value under $1M. Max 25-year amortization. You must have between 30% and 35% equity. Lender pays insurance premium on backend.' },
        { id: 'insur_80_3f', name: '3-Year Fixed (70% - 80% LTV)', rate: rates.insurable_70_80_3yr_fixed, bench: BENCHMARKS.fix_3yr, criteria: 'Property value under $1M. Max 25-year amortization. You must have between 20% and 30% equity. Lender pays insurance premium on backend.' },
      ]
    },
    {
      id: 'uninsured',
      title: 'Uninsured Mortgages',
      subtitle: 'For Refinances (pulling equity out) or 30-Year Amortizations.',
      icon: <Landmark size={24} className="text-slate-600" />,
      color: 'slate',
      rates: termToggle === '5yr' ? [
        { id: 'unins_5v', name: '5-Year Variable', rate: rates.uninsured_5yr_variable, bench: BENCHMARKS.var_5yr, criteria: 'Available for refinances up to 80% LTV, or purchases with 20%+ down payment wanting a 30-year amortization. Properties over $1M fall into this category.' },
        { id: 'unins_5f', name: '5-Year Fixed', rate: rates.uninsured_5yr_fixed, bench: BENCHMARKS.fix_5yr, criteria: 'Available for refinances up to 80% LTV, or purchases with 20%+ down payment wanting a 30-year amortization. Properties over $1M fall into this category.' },
      ] : [
        { id: 'unins_3f', name: '3-Year Fixed', rate: rates.uninsured_3yr_fixed, bench: BENCHMARKS.fix_3yr, criteria: 'Available for refinances up to 80% LTV, or purchases with 20%+ down payment wanting a 30-year amortization. Properties over $1M fall into this category.' },
      ]
    }
  ];

  // --- EXTENDED SEO & AEO JSON-LD SCHEMA ---
  const ratesSchema = {
    "@context": "https://schema.org",
    "@type": "Table",
    "about": "IndiBrick Live Rate Matrix - Ontario Mortgages",
    "mainEntity": [
      { "@type": "FinancialProduct", "name": "5-Year Variable (Insured)", "interestRate": rates.insured_5yr_variable, "provider": "IndiBrick Exclusive" },
      { "@type": "FinancialProduct", "name": "5-Year Fixed (Insurable Renewal)", "interestRate": rates.insurable_under_65_5yr_fixed, "provider": "IndiBrick Exclusive" },
      { "@type": "FinancialProduct", "name": "Private 1st Mortgage", "interestRate": rates.private_1st, "provider": "IndiBrick Private" }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the difference between Insured and Insurable mortgages?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Insured mortgages are for purchases with less than 20% down. The buyer pays CMHC insurance. Insurable mortgages are for renewals/switches with 20%+ equity; the lender pays the insurance, allowing them to offer lower rates."
        }
      },
      {
        "@type": "Question",
        "name": "Should I choose a Fixed or Variable rate in 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Historically, variable rates have outperformed fixed rates over a 25-year lifecycle. However, a Fixed rate provides stability. In the current 2026 environment, if the Bank of Canada signals rate cuts, a Variable rate may offer immediate savings."
        }
      },
      {
        "@type": "Question",
        "name": "Can I get a 30-year amortization?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, but it requires an Uninsured mortgage. You must have a 20% down payment (or 20% equity if refinancing). Uninsured rates are slightly higher than Insured rates."
        }
      },
      {
        "@type": "Question",
        "name": "What is the penalty for breaking a fixed mortgage?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Breaking a fixed-rate mortgage typically triggers an Interest Rate Differential (IRD) penalty, which can cost thousands of dollars. Variable rate mortgages usually only have a 3-month interest penalty."
        }
      }
    ]
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-32 pb-24 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <JsonLd data={ratesSchema} />
      <JsonLd data={faqSchema} />

      {/* --- FULL-SCREEN PERSONALIZED QUOTER OVERLAY --- */}
      {quoteActive && (
         <div className="fixed inset-0 z-[100] bg-slate-900 text-white overflow-y-auto animate-fade-in flex flex-col">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/10 relative z-10 bg-slate-900/80 backdrop-blur-md sticky top-0">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs">IB</div>
                  <span className="font-black uppercase tracking-widest text-sm">Rate Engine</span>
               </div>
               <button onClick={closeQuote} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition"><X size={20}/></button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-5xl mx-auto py-12">
               
               {/* Progress Bar */}
               {quoteStep < 4 && (
                 <div className="w-full max-w-sm mb-12">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                       <span>Step {quoteStep} of 3</span>
                       <span>{Math.round((quoteStep / 3) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${(quoteStep / 3) * 100}%`}}></div>
                    </div>
                 </div>
               )}

               {quoteStep === 1 && (
                 <div className="w-full max-w-2xl text-center animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">What is your primary goal?</h2>
                    <p className="text-blue-200/60 font-medium mb-12 text-lg">Rates are priced differently based on the transaction type.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <button onClick={() => { setQGoal('Purchase'); setQuoteStep(2); }} className="bg-white/5 border border-white/10 hover:border-blue-500 hover:bg-blue-500/10 p-8 rounded-3xl transition flex flex-col items-center gap-4 group">
                          <Home size={32} className="text-blue-400 group-hover:scale-110 transition"/>
                          <span className="font-black uppercase tracking-widest text-sm">Buy a Property</span>
                       </button>
                       <button onClick={() => { setQGoal('Switch'); setQuoteStep(2); }} className="bg-white/5 border border-white/10 hover:border-green-500 hover:bg-green-500/10 p-8 rounded-3xl transition flex flex-col items-center gap-4 group">
                          <RefreshCw size={32} className="text-green-400 group-hover:scale-110 transition"/>
                          <span className="font-black uppercase tracking-widest text-sm">Renewal / Switch</span>
                       </button>
                       <button onClick={() => { setQGoal('Refinance'); setQuoteStep(2); }} className="bg-white/5 border border-white/10 hover:border-amber-500 hover:bg-amber-500/10 p-8 rounded-3xl transition flex flex-col items-center gap-4 group">
                          <Banknote size={32} className="text-amber-400 group-hover:scale-110 transition"/>
                          <span className="font-black uppercase tracking-widest text-sm">Refinance / Equity</span>
                       </button>
                    </div>
                 </div>
               )}

               {quoteStep === 2 && (
                 <div className="w-full max-w-md text-center animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Let's check the math.</h2>
                    <p className="text-blue-200/60 font-medium mb-10">Lenders look at your Loan-to-Value (LTV) ratio.</p>
                    <div className="space-y-6 text-left">
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">{qGoal === 'Purchase' ? 'Purchase Price' : 'Estimated Home Value'}</label>
                          <input type="number" value={qValue} onChange={e=>setQValue(e.target.value)} placeholder="e.g. 800000" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition"/>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">{qGoal === 'Purchase' ? 'Down Payment Amount' : 'Current Mortgage Balance'}</label>
                          <input type="number" value={qMortgage} onChange={e=>setQMortgage(e.target.value)} placeholder="e.g. 160000" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition"/>
                       </div>
                       <button disabled={!qValue || !qMortgage} onClick={() => setQuoteStep(3)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-500 transition disabled:opacity-50 mt-4 flex items-center justify-center gap-2">
                          Continue <ArrowRight size={16}/>
                       </button>
                    </div>
                 </div>
               )}

               {quoteStep === 3 && (
                 <div className="w-full max-w-3xl text-center animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Select your term.</h2>
                    <p className="text-blue-200/60 font-medium mb-12">Fixed offers stability. Variable offers flexibility.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <button onClick={() => handleGenerateQuote('5yr_fixed')} className="bg-white/5 border border-white/10 hover:border-blue-500 hover:bg-white/10 p-8 rounded-3xl transition flex flex-col items-center gap-4">
                          <span className="font-black uppercase tracking-widest text-sm">5-Year Fixed</span>
                       </button>
                       <button onClick={() => handleGenerateQuote('3yr_fixed')} className="bg-white/5 border border-white/10 hover:border-blue-500 hover:bg-white/10 p-8 rounded-3xl transition flex flex-col items-center gap-4">
                          <span className="font-black uppercase tracking-widest text-sm">3-Year Fixed</span>
                       </button>
                       <button onClick={() => handleGenerateQuote('5yr_variable')} className="bg-white/5 border border-white/10 hover:border-blue-500 hover:bg-white/10 p-8 rounded-3xl transition flex flex-col items-center gap-4">
                          <span className="font-black uppercase tracking-widest text-sm text-blue-400">5-Year Variable</span>
                       </button>
                    </div>
                 </div>
               )}

               {/* TABBED INTERFACE FIX FOR SQUEEZED FORMS */}
               {quoteStep === 4 && (
                 <div className="w-full animate-fade-in-up flex flex-col lg:flex-row gap-12 items-start">
                    
                    {/* Results Presentation */}
                    <div className="w-full lg:w-5/12 text-center lg:text-left sticky top-32">
                       <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-green-500/30">
                          <CheckCircle size={14} /> Rate Unlocked
                       </div>
                       <h2 className="text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-2 text-white">
                          {qResultRate}%
                       </h2>
                       <p className="text-lg font-bold text-blue-400 mb-8 uppercase tracking-widest">{qTerm.replace(/_/g, ' ')} Rate</p>
                       <p className="text-slate-300 font-medium leading-relaxed mb-8">
                          Based on your <strong>{qGoal}</strong> profile and calculated Loan-to-Value, this is the lowest wholesale rate currently available for your scenario.
                       </p>
                       <ul className="space-y-4 text-left mb-8 hidden lg:block">
                          <li className="flex items-center gap-3 font-bold text-sm text-slate-300"><Target size={18} className="text-blue-500"/> Guaranteed for 120 Days</li>
                          <li className="flex items-center gap-3 font-bold text-sm text-slate-300"><Target size={18} className="text-blue-500"/> Pre-payment privileges included</li>
                       </ul>
                    </div>
                    
                    {/* Tabbed Lead Capture Container */}
                    <div className="w-full lg:w-7/12 bg-white text-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                       <div className="flex border-b border-gray-100 bg-gray-50/50">
                          <button 
                             onClick={() => setFormTab('standard')}
                             className={`flex-1 py-6 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${formTab === 'standard' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-400 hover:text-slate-900 hover:bg-gray-50'}`}
                          >
                             Standard Form
                          </button>
                          <button 
                             onClick={() => setFormTab('ai')}
                             className={`flex-1 py-6 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${formTab === 'ai' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-400 hover:text-slate-900 hover:bg-gray-50'}`}
                          >
                             <Activity size={14} className="animate-pulse text-blue-600" /> AI Assistant
                          </button>
                       </div>
                       <div className="p-2">
                          {formTab === 'standard' ? (
                             <div className="animate-fade-in">
                               <LeadForm type="Rate Hold" title="Secure Rate Hold" subtitle="No credit check required to lock this rate." ctaText="Lock My Rate" />
                             </div>
                          ) : (
                             <div className="animate-fade-in">
                               <AIIntakeForm />
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               )}

            </div>
         </div>
      )}

      {/* --- HERO SECTION --- */}
      <div className="container mx-auto px-6 max-w-7xl mb-16 text-center">
         <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block shadow-sm">
            Wholesale Pricing Matrix
         </span>
         <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-slate-900 leading-[0.9]">
            Stop Overpaying <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">The Banks.</span>
         </h1>
         <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-10 max-w-3xl mx-auto">
            We bypass retail branches and connect you directly to 40+ wholesale lenders. Secure "Status Pricing" for your next purchase, renewal, or refinance.
         </p>
         
         {/* THE ULTIMATE CTA BUTTON */}
         <button 
            onClick={() => { setQuoteActive(true); setQuoteStep(1); }} 
            className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_60px_rgba(37,99,235,0.6)] flex items-center justify-center gap-3 mx-auto hover:-translate-y-1 transition-all duration-300"
         >
            <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
            <span className="relative z-10 flex items-center gap-3">Get Personalized Rate Quote <ArrowRight size={18} /></span>
         </button>
      </div>

      {/* --- 1. THE TRUE NORTH STYLE RATE MATRIX --- */}
      <div className="container mx-auto px-4 md:px-6 max-w-5xl mb-24">
         
         <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 border-b border-gray-200 pb-4">
            <div className="mb-4 md:mb-0 text-center md:text-left">
               <h2 className="text-3xl font-black uppercase tracking-tight flex items-center justify-center md:justify-start gap-3 text-slate-900">
                  <Activity className="text-blue-600" /> Wholesale Rates
               </h2>
            </div>
            <div className="text-center md:text-right">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center md:justify-end gap-1.5">
                  <Clock size={12} className="text-blue-500"/> Last Updated: {rates.lastUpdated}
               </p>
            </div>
         </div>

         {/* 3-YEAR VS 5-YEAR TOGGLE */}
         <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex shadow-inner border border-gray-200">
               <button 
                 onClick={() => setTermToggle('5yr')} 
                 className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${termToggle === '5yr' ? 'bg-white text-slate-900 shadow-md scale-100' : 'text-gray-500 hover:text-slate-900 scale-95'}`}
               >
                 5-Year Terms
               </button>
               <button 
                 onClick={() => setTermToggle('3yr')} 
                 className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${termToggle === '3yr' ? 'bg-white text-slate-900 shadow-md scale-100' : 'text-gray-500 hover:text-slate-900 scale-95'}`}
               >
                 3-Year Terms
               </button>
            </div>
         </div>

         <div className="space-y-12">
            {rateCategories.map((category) => (
               <div key={category.id} className="bg-white border border-gray-200 rounded-[2rem] shadow-xl overflow-hidden">
                  
                  {/* Category Header */}
                  <div className={`bg-${category.color}-50/50 p-6 md:p-8 border-b border-gray-100 flex items-start gap-4`}>
                     <div className={`p-3 bg-white rounded-xl shadow-sm border border-gray-100 shrink-0`}>
                        {category.icon}
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{category.title}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">{category.subtitle}</p>
                     </div>
                  </div>

                  {/* Category Rates Table */}
                  <div className="flex flex-col">
                     {/* Desktop Header */}
                     <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <div className="col-span-4">Term / Product</div>
                        <div className="col-span-2 text-center">Bank Rate</div>
                        <div className="col-span-2 text-center text-blue-600">Our Rate</div>
                        <div className="col-span-2 text-center text-green-600">Savings</div>
                        <div className="col-span-2 text-right">Action</div>
                     </div>

                     {/* Rate Rows */}
                     {category.rates.map((row) => (
                        <React.Fragment key={row.id}>
                           {/* Main Row */}
                           <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 md:px-8 py-6 border-b border-gray-50 items-center hover:bg-gray-50/50 transition">
                              
                              <div className="col-span-4 flex flex-col md:block">
                                 <div className="flex justify-between items-center md:block">
                                    <p className="font-black text-slate-900 text-lg">{row.name}</p>
                                    <p className="text-3xl font-black text-slate-900 md:hidden">{row.rate}%</p>
                                 </div>
                                 {/* Interactive Info Toggle */}
                                 <button onClick={() => toggleRow(row.id)} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1 flex items-center gap-1 hover:text-blue-800 transition">
                                    <Info size={12}/> See Qualifications {expandedRow === row.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                 </button>
                              </div>

                              <div className="col-span-2 text-center hidden md:block">
                                 <span className="text-gray-400 line-through decoration-red-400 decoration-2 font-bold text-lg">{row.bench.toFixed(2)}%</span>
                              </div>
                              
                              <div className="col-span-2 text-center hidden md:block">
                                 <span className="text-3xl font-black text-slate-900">{row.rate}%</span>
                              </div>

                              <div className="col-span-2 text-left md:text-center mt-4 md:mt-0">
                                 {/* UI FIX: Removed Minus, Clear Positive Savings */}
                                 <div className="text-green-700 font-black flex items-center gap-1.5 text-[11px] bg-green-50 px-3 py-1.5 rounded-lg inline-flex border border-green-100 shadow-sm">
                                    <TrendingDown size={14} strokeWidth={3}/> ↓ {calcSave(row.bench, row.rate)}% vs Big 5
                                 </div>
                              </div>

                              <div className="col-span-2 text-right mt-4 md:mt-0">
                                 {/* UI FIX: Proper Button */}
                                 <button onClick={() => { setQuoteActive(true); setQuoteStep(1); }} className="w-full md:w-auto bg-blue-600 hover:bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-md transition hover:-translate-y-0.5">
                                    Apply
                                 </button>
                              </div>
                           </div>

                           {/* Expandable Details Dropdown */}
                           {expandedRow === row.id && (
                              <div className="px-6 md:px-8 py-5 bg-slate-50 border-b border-gray-100 animate-fade-in text-sm text-slate-600 font-medium leading-relaxed">
                                 <div className="flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5"/>
                                    <p><strong>Qualification Rules:</strong> {row.criteria}</p>
                                 </div>
                              </div>
                           )}
                        </React.Fragment>
                     ))}
                  </div>
               </div>
            ))}
         </div>

         {/* DISCLAIMER & CTA BANNER */}
         <div className="bg-slate-900 text-white rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-start gap-4">
               <AlertTriangle className="text-amber-400 shrink-0 mt-1" size={24} />
               <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
                  <strong>Rates fluctuate daily.</strong> The matrix above represents today's lowest available wholesale rates. They are subject to change without notice based on bond yields. Contact us to secure and lock your rate today.
               </p>
            </div>
            <button onClick={() => { setQuoteActive(true); setQuoteStep(1); }} className="relative z-10 shrink-0 w-full md:w-auto text-center bg-white text-slate-900 hover:bg-blue-50 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition">
               Apply Now
            </button>
         </div>
      </div>

      {/* --- 2. ALTERNATIVE LENDING --- */}
      <div className="container mx-auto px-6 max-w-7xl mb-24">
          <div className="flex items-center gap-4 mb-10 border-b border-gray-200 pb-6">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><AlertTriangle size={24}/></div>
            <div>
               <h2 className="text-3xl font-black uppercase tracking-tight">Flexible Solutions</h2>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Business for Self • Credit Repair • Asset Based</p>
            </div>
         </div>

         <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all duration-500 group flex flex-col">
               <div className="flex justify-between items-start mb-6">
                  <span className="bg-orange-50 border border-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Alternative "B"</span>
                  <Shield size={24} className="text-gray-300 group-hover:text-orange-500 transition"/>
               </div>
               <div className="mb-6"><span className="text-5xl font-black text-slate-900 tracking-tighter">{rates.b_lender}%</span><span className="text-lg font-bold text-gray-400">*</span></div>
               <h3 className="text-lg font-black uppercase tracking-tight mb-3">"Story Over Score"</h3>
               <p className="text-sm text-gray-500 leading-relaxed mb-8 flex-grow font-medium">Perfect for entrepreneurs with strong cash flow but low taxable income, or those recovering from life events.</p>
               <Link href="/bad-credit-private-mortgages" className="block text-center bg-gray-50 border border-gray-200 hover:border-black hover:bg-black hover:text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition">Check Eligibility</Link>
            </div>

            <div className="bg-slate-900 text-white border border-slate-800 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 group relative overflow-hidden flex flex-col">
               <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
               <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">Private Capital</span>
                  <Lock size={24} className="text-gray-500 group-hover:text-blue-400 transition"/>
               </div>
               <div className="mb-6 relative z-10"><span className="text-5xl font-black tracking-tighter">{rates.private_1st}%</span><span className="text-lg font-bold text-gray-500">*</span></div>
               <h3 className="text-lg font-black uppercase tracking-tight mb-3 relative z-10">Asset-Based Approval</h3>
               <p className="text-sm text-gray-400 leading-relaxed mb-8 flex-grow font-medium relative z-10">We prioritize property equity over traditional income documents. Ideal for bridge financing or quick acquisitions.</p>
               <Link href="/bad-credit-private-mortgages" className="block text-center bg-white/10 hover:bg-white hover:text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition relative z-10">View Options</Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all duration-500 group flex flex-col">
               <div className="flex justify-between items-start mb-6">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200">2nd Mortgage</span>
                  <Banknote size={24} className="text-gray-300 group-hover:text-green-500 transition"/>
               </div>
               <div className="mb-6"><span className="text-5xl font-black text-slate-900 tracking-tighter">{rates.second_mortgage}%</span><span className="text-lg font-bold text-gray-400">*</span></div>
               <h3 className="text-lg font-black uppercase tracking-tight mb-3">Unlock Equity</h3>
               <p className="text-sm text-gray-500 leading-relaxed mb-8 flex-grow font-medium">Keep your existing low-rate mortgage and add a second line for renovations, debt consolidation, or business capital.</p>
               <Link href="/bad-credit-private-mortgages" className="block text-center bg-gray-50 border border-gray-200 hover:border-black hover:bg-black hover:text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition">Unlock Cash</Link>
            </div>
         </div>
      </div>

      {/* --- 3. AEO / GEO CONTENT --- */}
      <div className="container mx-auto px-6 max-w-7xl mb-24">
         <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
               <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 text-slate-900">Rate Strategy</h2>
               <p className="text-slate-600 text-lg font-medium leading-relaxed mb-8">
                  The lowest rate isn't always the best mortgage. Penalties, portability, and restriction clauses can cost you thousands. We strip away the marketing fluff to find the true cost of borrowing.
               </p>
               
               {/* ENHANCED INSIDER TIP BOX */}
               <div className="border-l-[6px] border-blue-600 bg-blue-50 p-6 md:p-8 rounded-r-3xl shadow-sm relative mt-12 mb-8">
                  <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 inline-block shadow-md">
                     Insider Tip
                  </span>
                  <h4 className="font-black text-blue-900 uppercase tracking-tight text-lg mb-3">Variable vs Fixed 2026</h4>
                  <p className="text-sm text-blue-800 leading-relaxed font-medium">
                     With the Prime Rate holding steady, the spread between our Variable and Fixed rates is historic. This suggests a unique opportunity for strategic borrowers to ride the rate curve down over the next 3 years.
                  </p>
               </div>
            </div>

            <div className="space-y-4">
               <details className="group bg-white p-6 md:p-8 rounded-3xl border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition">
                  <summary className="flex justify-between items-center font-black text-sm md:text-base uppercase tracking-tight list-none text-slate-900">
                     What is an "Insurable" Mortgage?
                     <span className="transition group-open:rotate-180 bg-gray-50 p-2 rounded-full text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"><ChevronDown size={16}/></span>
                  </summary>
                  <div className="mt-6 text-slate-600 font-medium leading-relaxed text-sm space-y-4 border-t border-gray-100 pt-6">
                     <p><strong>Insured:</strong> For purchases with less than 20% down payment. You pay the default insurance premium (CMHC), which gives you access to the absolute lowest rates.</p>
                     <p><strong>Insurable:</strong> For <em>Renewals and Refinances</em> with 20%+ equity, a 25-year maximum amortization, and a property value under $1 Million. The <em>lender</em> pays the insurance premium in the background, allowing them to offer you a significantly lower rate than an Uninsured mortgage.</p>
                  </div>
               </details>

               <details className="group bg-white p-6 md:p-8 rounded-3xl border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition">
                  <summary className="flex justify-between items-center font-black text-sm md:text-base uppercase tracking-tight list-none text-slate-900">
                     What is the penalty for breaking a fixed mortgage?
                     <span className="transition group-open:rotate-180 bg-gray-50 p-2 rounded-full text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"><ChevronDown size={16}/></span>
                  </summary>
                  <p className="text-slate-600 font-medium mt-6 leading-relaxed text-sm border-t border-gray-100 pt-6">
                     Breaking a fixed-rate mortgage typically triggers an Interest Rate Differential (IRD) penalty, which can cost tens of thousands of dollars if rates have dropped since you signed. Variable rate mortgages usually only have a straightforward 3-month interest penalty.
                  </p>
               </details>

               <details className="group bg-white p-6 md:p-8 rounded-3xl border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition">
                  <summary className="flex justify-between items-center font-black text-sm md:text-base uppercase tracking-tight list-none text-slate-900">
                     Can I get a 30-year amortization?
                     <span className="transition group-open:rotate-180 bg-gray-50 p-2 rounded-full text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"><ChevronDown size={16}/></span>
                  </summary>
                  <p className="text-slate-600 font-medium mt-6 leading-relaxed text-sm border-t border-gray-100 pt-6">
                     Yes, but it requires an Uninsured mortgage. You must have a 20% down payment (or 20% equity if refinancing). Uninsured rates are slightly higher than Insured rates, but the longer amortization drastically lowers your monthly payment.
                  </p>
               </details>
            </div>
         </div>
      </div>

      {/* --- 4. BOTTOM CONTACT HUB (TABBED) --- */}
      <div className="container mx-auto px-6 max-w-5xl mb-16">
         <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
            <div className="bg-slate-900 p-12 text-center text-white relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-20" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
               <h2 className="relative z-10 text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Start Your Application</h2>
               <p className="relative z-10 text-blue-200 font-medium max-w-lg mx-auto">Choose how you want to proceed. Both options securely connect you to our underwriting team.</p>
            </div>
            
            <div className="flex border-b border-gray-100 bg-gray-50/50">
               <button 
                  onClick={() => setFormTab('standard')}
                  className={`flex-1 py-6 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${formTab === 'standard' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-slate-900 hover:bg-gray-50'}`}
               >
                  Standard Application
               </button>
               <button 
                  onClick={() => setFormTab('ai')}
                  className={`flex-1 py-6 text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${formTab === 'ai' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-slate-900 hover:bg-gray-50'}`}
               >
                  <Activity size={14} className="animate-pulse" /> AI Copilot
               </button>
            </div>

            <div className="p-6 md:p-12 bg-gray-50/30">
               {formTab === 'standard' ? (
                  <div className="animate-fade-in max-w-3xl mx-auto">
                    <LeadForm type="Rate Hold" title="Secure Rate Hold" subtitle="Submit your info to lock a rate for 120 days." ctaText="Submit Application" />
                  </div>
               ) : (
                  <div className="animate-fade-in max-w-3xl mx-auto">
                    <AIIntakeForm />
                  </div>
               )}
            </div>
         </div>
      </div>

    </div>
  );
}