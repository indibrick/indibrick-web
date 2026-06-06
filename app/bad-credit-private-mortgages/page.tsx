import React from 'react';
import Link from 'next/link';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  ShieldAlert, CheckCircle, Unlock, Banknote,
  Briefcase, TrendingUp, AlertTriangle, HelpCircle, ChevronDown, ArrowRight
} from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Bad Credit Mortgages & Private Lenders Ontario — Approval in 24h',
  description: 'Denied by the bank? We specialize in Bad Credit, Self-Employed, and Private Mortgages. Rates from 4.79%*. No income verification options available. Approved on Equity, not Credit.',
  slug: '/bad-credit-private-mortgages',
  keywords: ['Bad Credit Mortgage Ontario', 'Private Lender Toronto', 'B Lender Mortgage Rates', 'Self Employed Mortgage No Income Verification', 'Second Mortgage Ontario', 'Stop Power of Sale'],
});

// --- DATA FETCHING ---
const DEFAULT_RATES = {
  b_lender: '4.79',
  private_1st: '5.49',
  second_mortgage: '4.99'
};

async function getLiveRates() {
  try {
    const docRef = doc(db, 'site_settings', 'mortgage_rates');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_RATES, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Using Default Rates", e);
  }
  return DEFAULT_RATES;
}

export default async function AlternativeLendingPage() {
  const rates = await getLiveRates();

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": "Alternative Mortgage Lending",
    "description": "Mortgage solutions for borrowers who do not qualify for traditional bank financing due to credit, income, or debt ratios.",
    "interestRate": rates.b_lender,
    "provider": { "@type": "Organization", "name": "IndiBrick Financial" },
    "areaServed": "Ontario"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        "name": "What is the difference between a B-Lender and a Private Lender?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A B-Lender is a regulated financial institution (like a bank) that allows for higher debt ratios and bruised credit, typically offering rates around 4.79%. A Private Lender is an individual or investment corporation that lends purely based on property equity, ignoring credit scores entirely, with rates starting around 5.49%."
        }
      },
      {
        "@type": "Question",
        "name": "Can I get a mortgage with bad credit in Ontario?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. If you have at least 20% equity (down payment) in a property, you can qualify for a mortgage regardless of your credit score (even with bankruptcy or consumer proposal) through our Private Lending network."
        }
      }
    ]
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={pageSchema} />
      <JsonLd data={faqSchema} />

      {/* --- 1. HERO: THE RESCUE --- */}
      <section className="relative pt-32 pb-20 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-fade-in-up">
             <ShieldAlert size={14} /> Bank Declined? We Approve.
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
            Your Credit Score <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Is Not Your Story.</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
            Traditional banks use a "Pass/Fail" computer algorithm. We use common sense. 
            If you have equity or cash flow, we have a lender.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <a href="#solutions" className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition shadow-xl flex items-center justify-center gap-3">
               <Unlock size={16} /> View Solutions
            </a>
          </div>
        </div>
      </section>

      {/* --- 2. THE PROBLEM VS SOLUTION --- */}
      <section className="py-24 px-6 bg-white border-b border-gray-100">
         <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-6">Why you were declined</h2>
                  <p className="text-gray-500 leading-relaxed mb-8">
                     Banks must follow strict federal "Stress Test" rules (B-20 Guidelines). They cannot approve you if:
                  </p>
                  <ul className="space-y-4">
                     <li className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                        <AlertTriangle className="text-red-500 shrink-0" size={20}/>
                        <span className="text-sm font-bold text-red-900">Your Declared Income is too low (Self-Employed)</span>
                     </li>
                     <li className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                        <AlertTriangle className="text-red-500 shrink-0" size={20}/>
                        <span className="text-sm font-bold text-red-900">Your Credit Score is under 600</span>
                     </li>
                     <li className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                        <AlertTriangle className="text-red-500 shrink-0" size={20}/>
                        <span className="text-sm font-bold text-red-900">Your Debt Ratios (GDS/TDS) exceed 39%/44%</span>
                     </li>
                  </ul>
               </div>
               <div className="bg-green-50 rounded-[2.5rem] p-10 border border-green-100">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-green-900 mb-6 flex items-center gap-2">
                     <CheckCircle size={28}/> The IndiBrick Fix
                  </h3>
                  <p className="text-green-800 font-medium mb-8">
                     We access <strong>Non-Federally Regulated Lenders</strong> (Credit Unions, MICs, Privates) who do not have to follow the stress test.
                  </p>
                  <div className="space-y-6">
                     <div className="flex justify-between items-center border-b border-green-200 pb-4">
                        <span className="font-bold text-green-900 text-sm uppercase">Max GDS/TDS Ratio</span>
                        <span className="font-black text-xl text-green-700">60% +</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-green-200 pb-4">
                        <span className="font-bold text-green-900 text-sm uppercase">Min Credit Score</span>
                        <span className="font-black text-xl text-green-700">None (N/A)</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="font-bold text-green-900 text-sm uppercase">Income Proof</span>
                        <span className="font-black text-xl text-green-700">Bank Statements</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- 3. THE PRODUCTS (DYNAMIC RATES) --- */}
      <section id="solutions" className="py-24 px-6 bg-gray-50">
         <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">Choose Your Path</h2>
               <p className="text-gray-500">We match you to the lowest cost capital available for your situation.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               
               {/* OPTION A: B-LENDER */}
               <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl transition group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
                  <div className="mb-6">
                     <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Best Value</span>
                     <h3 className="text-3xl font-black mt-4 mb-2">B-Lender</h3>
                     <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-slate-900">{rates.b_lender}%</span>
                        <span className="text-sm font-bold text-gray-400">*</span>
                     </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                     For "Near Prime" borrowers. Great for Self-Employed or minor credit bruises.
                  </p>
                  <ul className="space-y-3 mb-8">
                     <li className="text-xs font-bold text-gray-700 flex items-center gap-2"><CheckCircle size={14} className="text-orange-500"/> Min 20% Down Payment</li>
                     <li className="text-xs font-bold text-gray-700 flex items-center gap-2"><CheckCircle size={14} className="text-orange-500"/> 1% Lender Fee</li>
                     <li className="text-xs font-bold text-gray-700 flex items-center gap-2"><CheckCircle size={14} className="text-orange-500"/> 1-2 Year Term (Bridge)</li>
                  </ul>
                  <a href="#apply" className="block text-center bg-gray-50 hover:bg-slate-900 hover:text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                     Check B-Lender Eligibility
                  </a>
               </div>

               {/* OPTION B: PRIVATE LENDER */}
               <div className="bg-slate-900 text-white border border-slate-800 rounded-[2.5rem] p-8 hover:shadow-2xl transition group relative overflow-hidden transform md:-translate-y-4">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                     <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Easiest Approval</span>
                     <h3 className="text-3xl font-black mt-4 mb-2">Private 1st</h3>
                     <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black">{rates.private_1st}%</span>
                        <span className="text-sm font-bold text-gray-400">*</span>
                     </div>
                     <p className="text-sm text-gray-400 mb-8 mt-4 leading-relaxed">
                        Pure equity lending. We don't look at income docs or credit scores. If the house has value, you are approved.
                     </p>
                     <ul className="space-y-3 mb-8">
                        <li className="text-xs font-bold text-gray-300 flex items-center gap-2"><CheckCircle size={14} className="text-blue-500"/> No Credit Check Required</li>
                        <li className="text-xs font-bold text-gray-300 flex items-center gap-2"><CheckCircle size={14} className="text-blue-500"/> Interest-Only Payments</li>
                        <li className="text-xs font-bold text-gray-300 flex items-center gap-2"><CheckCircle size={14} className="text-blue-500"/> Close in 48 Hours</li>
                     </ul>
                     <a href="#apply" className="block text-center bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/50">
                        Get Instant Quote
                     </a>
                  </div>
               </div>

               {/* OPTION C: SECOND MORTGAGE */}
               <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl transition group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-purple-500"></div>
                  <div className="mb-6">
                     <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Cash Out</span>
                     <h3 className="text-3xl font-black mt-4 mb-2">2nd Mortgage</h3>
                     <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-slate-900">{rates.second_mortgage}%</span>
                        <span className="text-sm font-bold text-gray-400">*</span>
                     </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                     Keep your existing low bank rate. Add a second loan behind it to access cash for debts or renovations.
                  </p>
                  <ul className="space-y-3 mb-8">
                     <li className="text-xs font-bold text-gray-700 flex items-center gap-2"><CheckCircle size={14} className="text-purple-500"/> Up to 85% LTV</li>
                     <li className="text-xs font-bold text-gray-700 flex items-center gap-2"><CheckCircle size={14} className="text-purple-500"/> Consolidate 20%+ Interest Debts</li>
                     <li className="text-xs font-bold text-gray-700 flex items-center gap-2"><CheckCircle size={14} className="text-purple-500"/> Flexible Open Terms</li>
                  </ul>
                  <a href="#apply" className="block text-center bg-gray-50 hover:bg-slate-900 hover:text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                     Unlock Equity
                  </a>
               </div>

            </div>
         </div>
      </section>

      {/* --- 4. AEO: VOICE SEARCH OPTIMIZATION --- */}
      <section className="py-20 px-6 bg-white border-y border-gray-100">
         <div className="container mx-auto max-w-4xl">
             <div className="flex items-center gap-3 mb-8">
               <HelpCircle size={28} className="text-slate-900"/>
               <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Strategic Analysis</h2>
            </div>
            <div className="space-y-4">
               <details className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer">
                  <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                     Will a B-Lender Mortgage hurt my credit?
                     <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                     No. In fact, it helps. B-Lenders report your payments to the credit bureau just like a bank. By moving your high-interest credit card debt into a lower-rate B-Mortgage, you lower your utilization ratio, which can <strong>boost your credit score by 50-100 points</strong> in 12 months.
                  </p>
               </details>
               <details className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer">
                  <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                     How do I exit a Private Mortgage?
                     <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                     Private mortgages are temporary (usually 1 year). We build your "Exit Strategy" on Day 1. This typically involves fixing your credit or declaring more income over the next 12 months, so we can refinance you back to an "A" Lender (Bank) at renewal.
                  </p>
               </details>
               <details className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer">
                  <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                     Are there hidden fees?
                     <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                     Alternative lending has different costs than banks. B-Lenders charge a <strong>1% Lender Fee</strong>. Private Lenders charge a fee depending on risk (usually 1-2%). We disclose 100% of these fees in writing upfront in your "Cost of Borrowing" document.
                  </p>
               </details>
            </div>
         </div>
      </section>

      {/* --- 5. LEAD FORM (CONVERSION) --- */}
      <section id="apply" className="py-24 px-6 bg-slate-900 text-white">
         <div className="container mx-auto max-w-5xl grid md:grid-cols-2 gap-16 items-center">
            <div>
               <span className="text-red-400 font-bold uppercase tracking-widest text-xs mb-2 block">Don't Accept "No"</span>
               <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 leading-none">
                  Get Approved <br/>Today.
               </h2>
               <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                  We don't need perfect credit. We just need a property with equity. 
                  Submit your details for a confidential review by a Senior Underwriter.
               </p>
               <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm font-bold text-gray-300">
                     <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400"><CheckCircle size={14}/></div>
                     No Credit Check for Quote
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-gray-300">
                     <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400"><CheckCircle size={14}/></div>
                     Same-Day Commitment Letter
                  </li>
               </ul>
            </div>

            <div className="bg-white text-slate-900 p-8 rounded-[2.5rem] shadow-2xl">
               <LeadForm type="Alternative Lending" title="Check Eligibility" subtitle="Confidential. No obligation." />
            </div>
         </div>
      </section>

    </div>
  );
}