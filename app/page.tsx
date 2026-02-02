import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import LeadForm from '../components/LeadForm';
import JsonLd from '../components/JsonLd';
import { 
  TrendingUp, Map, ArrowRight, Shield, 
  Zap, Calculator, Activity, DollarSign, Lock, BarChart3, 
  CheckCircle, HelpCircle, ChevronDown, Layers, Briefcase, Hammer, Home, Scale, Users, Percent 
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// --- IMPORTANT: MAKES THE PAGE LIVE ---
// This forces Next.js to check Firebase for new rates every 60 seconds.
export const revalidate = 60; 

export const metadata: Metadata = {
  title: 'IndiBrick | The All-in-One Real Estate Ecosystem (Mortgage, Realty, Insurance)',
  description: 'Stop juggling professionals. IndiBrick consolidates Real Estate, Mortgages (3.39%*), Insurance, and Renovations into one intelligent platform. The operating system for your wealth.',
  keywords: ['One Stop Shop Real Estate Ontario', 'Mortgage and Real Estate Bundle', 'Home Auto Insurance Ontario', 'Renovation Contractors Toronto', 'Real Estate Investing Strategy'],
};

// --- RATE FETCHING LOGIC ---
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
    "description": "Integrated Real Estate, Mortgage, Insurance, and Wealth Management Firm.",
    "url": "https://indibrick.ca",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Holistic Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Real Estate Brokerage" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mortgage Financing" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Insurance Protection" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Renovation Services" } }
      ]
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={homeSchema} />

      {/* --- 1. HERO: THE UNIFIED ECOSYSTEM --- */}
      <section className="relative pt-32 pb-20 px-6 border-b border-gray-100 overflow-hidden">
        {/* Cinematic Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/60 rounded-full blur-[120px] -z-10 translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-[100px] -z-10 -translate-x-1/4 translate-y-1/4"></div>

        <div className="container mx-auto max-w-7xl text-center">
          {/* USP BADGE */}
          <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in-up shadow-lg">
            <Layers size={12} className="text-blue-400" /> Real Estate • Mortgage • Insurance • Wealth
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">
            The Only Partner <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">You Need.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-500 max-w-4xl mx-auto font-medium leading-relaxed mb-12">
            Stop coordinating between a Realtor, a Mortgage Broker, an Insurance Agent, and a Contractor. 
            We consolidated the entire property lifecycle into <span className="text-slate-900 font-bold">one intelligent platform</span>.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link href="/city-data" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3">
               <Activity size={16} className="text-blue-400" /> Start Market Intelligence
            </Link>
            <Link href="/rates" className="bg-white text-slate-900 border border-gray-200 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition flex items-center justify-center gap-3">
               <TrendingUp size={16} /> Check Rates ({rates.insured_variable_5yr}%*)
            </Link>
          </div>
        </div>
      </section>

      {/* --- 2. LIVE TICKER (Social Proof) --- */}
      <div className="bg-slate-900 text-white overflow-hidden py-3 border-y border-slate-800">
        <div className="flex gap-12 animate-marquee whitespace-nowrap text-[10px] font-black uppercase tracking-widest opacity-80">
           <span className="flex items-center gap-2"><span className="text-green-400">●</span> Mortgage: {rates.insured_variable_5yr}%* (Low)</span>
           <span className="flex items-center gap-2"><span className="text-blue-400">●</span> Insurance: Bundled Savings</span>
           <span className="flex items-center gap-2"><span className="text-green-400">●</span> Toronto Detached: $1.4M (-2.1%)</span>
           <span className="flex items-center gap-2"><span className="text-yellow-400">●</span> Renovations: Licensed Pros</span>
           <span className="flex items-center gap-2"><span className="text-purple-400">●</span> Wealth: Tax Strategy</span>
           <span className="flex items-center gap-2"><span className="text-green-400">●</span> Mortgage: {rates.insured_variable_5yr}%* (Low)</span>
           <span className="flex items-center gap-2"><span className="text-blue-400">●</span> Insurance: Bundled Savings</span>
        </div>
      </div>

      {/* --- 2.5 RATE SPOTLIGHT (NEW FEATURE) --- */}
      <section className="bg-gray-50 pt-16 pb-8 px-6">
         <div className="container mx-auto max-w-5xl">
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-gray-100 transform -translate-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    
                    {/* Header */}
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Market Data
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Wholesale Rate Monitor</h2>
                        <p className="text-gray-500 text-xs font-medium mt-1">Exclusive rates beating Big 5 Banks.</p>
                    </div>

                    {/* Rate Grid */}
                    <div className="flex flex-wrap justify-center gap-4 w-full md:w-auto">
                        
                        {/* CARD 1: THE HERO (Lowest) */}
                        <div className="bg-slate-900 text-white p-6 rounded-2xl min-w-[160px] text-center shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">5-Year Variable</p>
                            <div className="flex items-start justify-center gap-1">
                                <span className="text-4xl font-black tracking-tighter text-green-400">{rates.insured_variable_5yr}</span>
                                <span className="text-xs font-bold mt-1">%</span>
                            </div>
                            <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest mt-1">Lowest Rate</p>
                        </div>

                        {/* CARD 2: Fixed */}
                        <div className="bg-gray-50 p-6 rounded-2xl min-w-[140px] text-center border border-gray-100 group hover:border-black transition">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">5-Year Fixed</p>
                            <div className="flex items-start justify-center gap-1">
                                <span className="text-3xl font-black tracking-tighter text-slate-900">{rates.insured_fixed_5yr}</span>
                                <span className="text-xs font-bold mt-1 text-gray-500">%</span>
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Insured</p>
                        </div>

                        {/* CARD 3: 3-Year */}
                        <div className="bg-gray-50 p-6 rounded-2xl min-w-[140px] text-center border border-gray-100 group hover:border-black transition hidden sm:block">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">3-Year Fixed</p>
                            <div className="flex items-start justify-center gap-1">
                                <span className="text-3xl font-black tracking-tighter text-slate-900">{rates.insured_fixed_3yr}</span>
                                <span className="text-xs font-bold mt-1 text-gray-500">%</span>
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Short Term</p>
                        </div>

                    </div>

                    {/* CTA */}
                    <div>
                        <Link href="/rates" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-slate-900 hover:bg-black hover:text-white transition shadow-sm">
                            <ArrowRight size={20} />
                        </Link>
                    </div>

                </div>
            </div>
         </div>
      </section>

      {/* --- 3. THE "ALL-IN-ONE" GRID (The Core USP) --- */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-4">Complete Vertical Integration</h2>
              <p className="text-gray-500 font-medium max-w-2xl mx-auto">
                 We don't hand you off to third parties. We handle every stage of asset ownership in-house or through our exclusive verified partners.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
              
              {/* PILLAR 1: LENDING */}
              <Link href="/rates" className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition duration-300 group">
                 <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition">
                    <TrendingUp size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Finance</h3>
                 <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4">Mortgages from {rates.insured_variable_5yr}%*</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    We beat the banks using wholesale channels. From Insured Mortgages to Private Lending and Second Mortgages.
                 </p>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">Compare Rates <ArrowRight size={12}/></span>
              </Link>

              {/* PILLAR 2: REAL ESTATE */}
              <Link href="/city-data" className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition duration-300 group">
                 <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition">
                    <Map size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Acquire</h3>
                 <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">AI Market Intelligence</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Don't guess. Use our AI-driven reports to find undervalued cities, distress deals, and pre-construction assignments.
                 </p>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">View Market Data <ArrowRight size={12}/></span>
              </Link>

              {/* PILLAR 2.5: REALTOR NETWORK (NEW) */}
              <Link href="/realtor-network" className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition duration-300 group">
                 <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition">
                    <Users size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Partner</h3>
                 <p className="text-xs font-bold text-black uppercase tracking-widest mb-4">Realtor Network</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Buy or sell with confidence. We match you with top-tier local agents who understand investment strategy.
                 </p>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">Find Agent <ArrowRight size={12}/></span>
              </Link>

              {/* PILLAR 3: INSURANCE */}
              <Link href="/commercial-auto-home-insurance" className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition duration-300 group">
                 <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition">
                    <Shield size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Protect</h3>
                 <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Home • Auto • Commercial</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Protect your asset. We bundle your Home, Auto, and Commercial insurance to unlock deep discounts.
                 </p>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">Get Quote <ArrowRight size={12}/></span>
              </Link>

              {/* PILLAR 4: WEALTH */}
              <Link href="/investment-planning-wealth-growth" className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition duration-300 group">
                 <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition">
                    <BarChart3 size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Grow</h3>
                 <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-4">Investments & Tax Strategy</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Segregated Funds, RRSPs, and Universal Life Insurance. We structure your wealth to be tax-efficient.
                 </p>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">Build Wealth <ArrowRight size={12}/></span>
              </Link>

              {/* PILLAR 5: RENOVATION */}
              <Link href="/renovation-contractors" className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition duration-300 group">
                 <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6 text-yellow-600 group-hover:scale-110 transition">
                    <Hammer size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Improve</h3>
                 <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-4">Vetted Contractors</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Increase property value. Access our network of trusted contractors for legal basements, flips, and repairs.
                 </p>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">Find Contractor <ArrowRight size={12}/></span>
              </Link>

              {/* PILLAR 6: LEGAL */}
              <Link href="/trusted-real-estate-lawyers" className="bg-white rounded-[2rem] p-8 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition duration-300 group">
                 <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-600 group-hover:scale-110 transition">
                    <Scale size={28} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Close</h3>
                 <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-4">Legal Support</p>
                 <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Seamless closing. Our partner lawyers specialize in real estate transactions, ensuring your title is clean.
                 </p>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">Legal Support <ArrowRight size={12}/></span>
              </Link>

           </div>
        </div>
      </section>

      {/* --- 4. AEO/GEO POWER BLOCK (The "Why") --- */}
      <section className="py-20 px-6 bg-white border-y border-gray-100">
         <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-slate-900">Why consolidate with IndiBrick?</h2>
               <p className="text-gray-500">The "Siloed Model" of using different providers is outdated. Integration saves you money.</p>
            </div>
            
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
               <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <div className="bg-blue-600/20 p-3 rounded-xl h-fit"><Layers size={24} className="text-blue-400"/></div>
                        <div>
                           <h3 className="font-bold text-lg mb-2">Strategy alignment</h3>
                           <p className="text-gray-400 text-sm leading-relaxed">
                              Your Mortgage Broker talks to your Wealth Advisor. We ensure your debt structure optimizes your tax refund.
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="bg-green-600/20 p-3 rounded-xl h-fit"><DollarSign size={24} className="text-green-400"/></div>
                        <div>
                           <h3 className="font-bold text-lg mb-2">Bundled Savings</h3>
                           <p className="text-gray-400 text-sm leading-relaxed">
                              Get access to exclusive insurance rates and contractor pricing only available to IndiBrick clients.
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="bg-purple-600/20 p-3 rounded-xl h-fit"><Zap size={24} className="text-purple-400"/></div>
                        <div>
                           <h3 className="font-bold text-lg mb-2">Speed of Execution</h3>
                           <p className="text-gray-400 text-sm leading-relaxed">
                              We move faster. Because all documents are internal, we can close deals in 48 hours that take banks weeks.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* FAQ / VOICE SEARCH BAIT */}
                  <div className="bg-white/10 rounded-3xl p-6 border border-white/10">
                     <h4 className="font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2"><HelpCircle size={14}/> Common Questions</h4>
                     <div className="space-y-4">
                        <details className="group cursor-pointer">
                           <summary className="font-bold text-sm flex justify-between items-center list-none">
                              Can I use IndiBrick for just one service?
                              <span className="transition group-open:rotate-180"><ChevronDown size={14}/></span>
                           </summary>
                           <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                              Absolutely. Start with our <strong>{rates.insured_variable_5yr}% Mortgage Rate</strong> or a <strong>Home Insurance Quote</strong>. Most clients naturally expand to other services once they see the value and efficiency we provide.
                           </p>
                        </details>
                        <hr className="border-white/10"/>
                        <details className="group cursor-pointer">
                           <summary className="font-bold text-sm flex justify-between items-center list-none">
                              Are your contractors licensed?
                              <span className="transition group-open:rotate-180"><ChevronDown size={14}/></span>
                           </summary>
                           <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                              Yes. Every partner in our Renovation network is vetted, insured, and licensed. We protect your asset by ensuring all work is up to code and adds tangible market value.
                           </p>
                        </details>
                        <hr className="border-white/10"/>
                        <details className="group cursor-pointer">
                           <summary className="font-bold text-sm flex justify-between items-center list-none">
                              How does the "Wealth" pillar work?
                              <span className="transition group-open:rotate-180"><ChevronDown size={14}/></span>
                           </summary>
                           <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                              We go beyond real estate. We offer Segregated Funds (Creditor Protected Investments) and Universal Life Insurance to help you build tax-exempt wealth alongside your property portfolio.
                           </p>
                        </details>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- 5. CALL TO ACTION --- */}
      <section className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-5xl grid md:grid-cols-2 gap-16 items-center">
            <div>
               <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2 block">One Platform. Total Control.</span>
               <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 leading-none text-slate-900">
                  Begin Your <br/>Audit.
               </h2>
               <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                  We will analyze your current Mortgage, Insurance policies, and Investment portfolio to find hidden savings and growth opportunities.
               </p>
               <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                     <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={14}/></div>
                     Unified Financial Strategy
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                     <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={14}/></div>
                     Access {rates.insured_variable_5yr}%* Rate Tier
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-gray-700">
                     <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={14}/></div>
                     Insurance Bundle Review
                  </li>
               </ul>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-8 rounded-[2.5rem] shadow-xl">
               <LeadForm type="Strategy Session" title="Full Ecosystem Audit" subtitle="Speak to a Senior Strategist." />
            </div>
         </div>
      </section>

      <footer className="bg-white py-8 border-t border-gray-100">
         <div className="container mx-auto px-6 text-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-loose">
               *Rates are subject to change. OAC. Services provided by IndiBrick Financial and licensed partners. 
               Mortgages via Pineapple Financial. Insurance via licensed brokerage partners. 
               Investments via Segregated Funds/Insurance products.
            </p>
         </div>
      </footer>

    </div>
  );
}