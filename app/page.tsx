import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import LeadForm from '../components/LeadForm';
import AIIntakeForm from '../components/AIIntakeForm'; // <-- NEW AI FORM IMPORT
import JsonLd from '../components/JsonLd';
import { 
  TrendingUp, Hammer, BarChart3, Scale, 
  ArrowRight, Layers, CheckCircle, HelpCircle, ChevronDown, Factory, Users, Sun, Percent, Activity, Zap, Ruler
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export const revalidate = 60; 

export const metadata: Metadata = {
  title: 'IndiBrick | The All-in-One Real Estate Ecosystem (Mortgage, Realty, Insurance)',
  description: 'Stop juggling professionals. IndiBrick consolidates Real Estate, Mortgages (3.39%*), Insurance, and Legal into one intelligent platform. The operating system for your wealth.',
  keywords: ['One Stop Shop Real Estate Ontario', 'Mortgage and Real Estate Bundle', 'Home Auto Insurance Ontario', 'Renovation Contractors Toronto', 'Real Estate Investing Strategy'],
};

const DEFAULT_RATES = {
  insured_variable_5yr: '3.39',
  insured_fixed_5yr: '3.79',
  insured_fixed_3yr: '4.09',
  uninsured_fixed_5yr: '4.39',
  uninsured_variable_5yr: '4.59',
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
    console.error("⚠️ Failed to fetch rates, using defaults:", e);
  }
  return DEFAULT_RATES;
}

export default async function HomePage() {
  const rates = await getLiveRates();

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "IndiBrick",
    "description": "Integrated Real Estate, Mortgage, Legal, and Wealth Management Firm.",
    "url": "https://indibrick.ca",
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      <JsonLd data={homeSchema} />

      {/* --- 1. HERO: FIXED MOBILE SPACING & DESKTOP HIERARCHY --- */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 px-6 border-b border-gray-100 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/60 rounded-full blur-[120px] -z-10 translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-[100px] -z-10 -translate-x-1/4 translate-y-1/4"></div>

        <div className="container mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 md:mb-8 animate-fade-in-up shadow-lg">
            <Layers size={12} className="text-blue-400" /> Real Estate • Mortgage • Legal • Wealth
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-6 leading-[1.0] md:leading-[0.9]">
            The Only Partner <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">You Need.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-4xl mx-auto font-medium leading-relaxed mb-10 md:mb-12">
            Stop coordinating between a Realtor, a Mortgage Broker, a Lawyer, and a Contractor. 
            We consolidated the entire property lifecycle into <span className="text-slate-900 font-bold">one intelligent platform</span>.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link href="/city-data" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3">
               <Activity size={16} className="text-blue-400" /> Start Market Intelligence
            </Link>
            <a href="#onboarding" className="bg-white text-slate-900 border border-gray-200 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition flex items-center justify-center gap-3">
               <TrendingUp size={16} /> Check Rates ({rates.insured_variable_5yr}%*)
            </a>
          </div>
        </div>
      </section>

      {/* --- 2. LIVE TICKER --- */}
      <div className="bg-slate-900 text-white overflow-hidden py-3 border-y border-slate-800">
        <div className="flex gap-12 animate-marquee whitespace-nowrap text-[10px] font-black uppercase tracking-widest opacity-80">
           <span className="flex items-center gap-2"><span className="text-green-400">●</span> Mortgage: {rates.insured_variable_5yr}%* (Low)</span>
           <span className="flex items-center gap-2"><span className="text-blue-400">●</span> Legal: Tech-Enabled Closings</span>
           <span className="flex items-center gap-2"><span className="text-green-400">●</span> Toronto Detached: $1.4M (-2.1%)</span>
           <span className="flex items-center gap-2"><span className="text-yellow-400">●</span> Renovations: Licensed Pros</span>
           <span className="flex items-center gap-2"><span className="text-purple-400">●</span> Wealth: Tax Strategy</span>
           <span className="flex items-center gap-2"><span className="text-green-400">●</span> Mortgage: {rates.insured_variable_5yr}%* (Low)</span>
        </div>
      </div>

      {/* --- 3. THE "ALL-IN-ONE" GRID --- */}
      <section className="py-20 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-7xl">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">Complete Vertical Integration</h2>
              <p className="text-slate-700 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                 We don't hand you off to third parties. We handle every stage of asset ownership in-house or through our exclusive verified partners.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* PILLAR 1: LENDING (BLUE) */}
              <Link href="/rates" className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:shadow-xl hover:border-blue-200 transition duration-300 group">
                 <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition">
                    <TrendingUp size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Finance</h3>
                 <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Wholesale Mortgages</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    We beat the banks using wholesale channels. Insured Mortgages, B-Lenders, and Private Capital.
                 </p>
              </Link>

              {/* PILLAR 2: DESIGN / ARCHITECTURE (SLATE) - REPLACED ACQUIRE */}
              <Link href="/architecture" className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:shadow-xl hover:border-slate-400 transition duration-300 group">
                 <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center mb-6 text-slate-800 group-hover:scale-110 transition">
                    <Ruler size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Design</h3>
                 <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Architecture & Permits</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Fast-track building permits, legal basements, and commercial layouts via our OAA Licensed Architect partners.
                 </p>
              </Link>

              {/* PILLAR 3: REALTOR NETWORK (INDIGO) */}
              <Link href="/realtor-network" className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition duration-300 group">
                 <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition">
                    <Users size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Partner</h3>
                 <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Realtor Network</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Buy or sell with confidence. We match you with top-tier local agents who understand investment strategy.
                 </p>
              </Link>

              {/* PILLAR 4: COMMERCIAL (BLUE) */}
              <Link href="/commercial-lending" className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:shadow-xl hover:border-blue-200 transition duration-300 group">
                 <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition">
                    <Factory size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Enterprise</h3>
                 <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Commercial Lending</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Multi-Res, Industrial, and Business Loans. Access Institutional & Private Funds.
                 </p>
              </Link>

              {/* PILLAR 5: CLOSE / LEGAL (INDIGO) - REPLACED PROTECT */}
              <Link href="/trusted-real-estate-lawyers" className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition duration-300 group">
                 <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition">
                    <Scale size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Close</h3>
                 <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Legal Services</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Tech-enabled real estate lawyers providing fixed-fee closings, title transfers, and digital signing portals.
                 </p>
              </Link>

              {/* PILLAR 6: WEALTH (SLATE) */}
              <Link href="/investment-planning-wealth-growth" className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:shadow-xl hover:border-slate-400 transition duration-300 group">
                 <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center mb-6 text-slate-800 group-hover:scale-110 transition">
                    <BarChart3 size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Grow</h3>
                 <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Tax Strategy</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Segregated Funds, RRSPs, and Universal Life Insurance. We structure your wealth to be tax-efficient.
                 </p>
              </Link>

           </div>
        </div>
      </section>

      {/* --- 4. WHY CONSOLIDATE (Clean Version) --- */}
      <section className="py-20 px-6 bg-white border-b border-gray-100">
         <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 text-slate-900">Why Consolidate?</h2>
               <p className="text-slate-600 text-lg">The "Siloed Model" of using different providers is outdated. Integration saves you money.</p>
            </div>
            
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
               <div className="grid md:grid-cols-3 gap-8">
                  <div>
                     <div className="bg-blue-600/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Layers size={20} className="text-blue-400"/></div>
                     <h3 className="font-bold text-lg mb-2">Strategy Alignment</h3>
                     <p className="text-gray-400 text-sm leading-relaxed">Your Mortgage Broker talks to your Wealth Advisor. We ensure your debt structure optimizes your tax refund.</p>
                  </div>
                  <div>
                     <div className="bg-green-600/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Percent size={20} className="text-green-400"/></div>
                     <h3 className="font-bold text-lg mb-2">Bundled Savings</h3>
                     <p className="text-gray-400 text-sm leading-relaxed">Get access to exclusive insurance rates and contractor pricing only available to IndiBrick clients.</p>
                  </div>
                  <div>
                     <div className="bg-purple-600/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Zap size={20} className="text-purple-400"/></div>
                     <h3 className="font-bold text-lg mb-2">Speed of Execution</h3>
                     <p className="text-gray-400 text-sm leading-relaxed">We move faster. Because all documents are internal, we can close deals in 48 hours that take banks weeks.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- 5. STANDALONE FAQ SECTION --- */}
      <section className="py-20 px-6 bg-gray-50 border-b border-gray-200">
         <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
               <HelpCircle size={40} className="mx-auto text-blue-600 mb-4" />
               <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Common Questions</h2>
            </div>
            
            <div className="space-y-4">
               <details className="group bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer shadow-sm hover:border-black transition">
                  <summary className="font-bold text-slate-900 text-lg list-none flex justify-between items-center">
                     Can I use IndiBrick for just one service?
                     <span className="text-gray-400 transition group-open:rotate-180"><ChevronDown size={20}/></span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed">
                     Absolutely. Start with our <strong>{rates.insured_variable_5yr}% Mortgage Rate</strong> or an <strong>Architecture Consult</strong>. Most clients naturally expand to other services once they see the value and efficiency we provide.
                  </p>
               </details>
               
               <details className="group bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer shadow-sm hover:border-black transition">
                  <summary className="font-bold text-slate-900 text-lg list-none flex justify-between items-center">
                     Are your contractors and architects licensed?
                     <span className="text-gray-400 transition group-open:rotate-180"><ChevronDown size={20}/></span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed">
                     Yes. Every partner in our network is fully vetted. Our architectural partners are OAA Licensed, and our contractors are fully insured with WSIB. We protect your asset by ensuring all work is up to code.
                  </p>
               </details>
               
               <details className="group bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer shadow-sm hover:border-black transition">
                  <summary className="font-bold text-slate-900 text-lg list-none flex justify-between items-center">
                     How does the "Wealth" pillar work?
                     <span className="text-gray-400 transition group-open:rotate-180"><ChevronDown size={20}/></span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed">
                     We go beyond real estate. We offer Segregated Funds (Creditor Protected Investments) and Universal Life Insurance to help you build tax-exempt wealth alongside your property portfolio.
                  </p>
               </details>
            </div>
         </div>
      </section>

      {/* --- 6. FINAL CTA: DUAL ONBOARDING OPTIONS --- */}
      <section id="onboarding" className="py-24 px-6 bg-slate-900 text-white border-t-4 border-blue-500 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

         <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
                  Begin Your Audit.
               </h2>
               <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
                  Choose your preferred path. Speak with a human strategist to review your portfolio, or use our AI to generate an instant document checklist.
               </p>
            </div>

            {/* THE DUAL FORMS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
               
               {/* Form 1: Human Interaction (Standard Lead Form) */}
               <div>
                  <div className="mb-6 flex items-center gap-3">
                     <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20">
                        <Users size={18} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">Human Expert</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">I want someone to call me to discuss</p>
                     </div>
                  </div>
                  <div className="text-slate-900">
                     <LeadForm 
                        type="Strategy Session" 
                        title="Book a Strategy Call" 
                        subtitle="A Senior Advisor will review your file and find hidden savings." 
                        ctaText="Request Call"
                     />
                  </div>
               </div>

               {/* Form 2: AI Intake (Instant Checklist) */}
               <div>
                  <div className="mb-6 flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Activity size={18} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">AI Assistant</h3>
                        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1">Get your document checklist now</p>
                     </div>
                  </div>
                  <div className="text-slate-900">
                     <AIIntakeForm />
                  </div>
               </div>

            </div>
         </div>
      </section>

      <footer className="bg-white py-8 border-t border-gray-100">
         <div className="container mx-auto px-6 text-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-loose">
               *Rates are subject to change. OAC. Services provided by IndiBrick Financial and licensed partners. 
               Mortgages via Pineapple Financial (Lic #12830). Insurance via licensed brokerage partners. 
               Investments via Segregated Funds/Insurance products.
            </p>
         </div>
      </footer>

    </div>
  );
}