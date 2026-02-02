import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import LeadForm from '../../components/LeadForm';
import AffordabilityCalculator from '../../components/AffordabilityCalculator';
import JsonLd from '../../components/JsonLd';
import { 
  Users, Search, MapPin, Handshake, ShieldCheck, 
  TrendingUp, CheckCircle, AlertTriangle, HelpCircle, 
  ArrowRight, DollarSign, Calculator 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Top 1% Realtor Network Ontario | Exclusive Off-Market Listings',
  description: 'Don\'t just browse MLS. Get matched with a top-tier local Realtor who specializes in investment properties and off-market deals. Pre-approval included.',
  keywords: ['Best Realtors Toronto', 'Investment Realtor Ontario', 'Off-Market Listings Toronto', 'Real Estate Agent Referral', 'Buy Home Ontario'],
};

export default function RealtorNetworkPage() {
  
  // --- AEO & SEO SCHEMA ---
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Real Estate Referral Service",
    "provider": {
      "@type": "Organization",
      "name": "IndiBrick Financial"
    },
    "areaServed": "Ontario",
    "description": "We match homebuyers with vetted top 1% real estate agents and provide pre-approval financing."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        "name": "Why should I get pre-approved before finding a Realtor?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most top agents will not work with buyers who lack a verified budget. A pre-approval gives you a 'hard cap' on your purchase price, protects your deposit, and strengthens your offer negotiation power."
        }
      },
      {
        "@type": "Question",
        "name": "Does it cost money to use the Realtor Network?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Using our matching service is free for buyers. In Ontario, the real estate commission is typically paid by the seller, so you get expert representation at no direct cost to you."
        }
      }
    ]
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />

      {/* --- 1. HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 bg-slate-900 text-white overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -z-10 translate-x-1/4 -translate-y-1/4"></div>
        
        <div className="container mx-auto max-w-6xl text-center relative z-10">
           <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-fade-in-up">
              <Users size={12} className="text-blue-400" /> Vetted Partner Network
           </div>
           
           <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
             Who You Work With <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Matters.</span>
           </h1>
           
           <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed mb-10">
             The average agent sells 4 homes a year. <span className="text-white font-bold">Our partners sell 40+.</span> 
             <br className="hidden md:block" />
             We match you with the top 1% of negotiators in your specific target neighborhood.
           </p>

           <div className="flex flex-col sm:flex-row justify-center gap-4">
             <a href="#match" className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition shadow-xl flex items-center justify-center gap-3">
                <Search size={16} /> Find My Agent
             </a>
             <a href="#budget" className="bg-transparent border border-white/30 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition flex items-center justify-center gap-3">
                <Calculator size={16} /> Check Budget First
             </a>
           </div>
        </div>
      </section>

      {/* --- 2. THE "BUDGET FIRST" REALITY CHECK (Refactored Layout) --- */}
      <section id="budget" className="py-24 px-6 bg-slate-50 border-b border-gray-200">
         <div className="container mx-auto max-w-5xl">
            
            {/* 2a. Text & Buttons (Centered) */}
            <div className="text-center mb-16 max-w-3xl mx-auto">
               <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                   <AlertTriangle size={14} /> Stop "Window Shopping"
               </div>
               <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-6">
                   Don't View Homes <br/> Without a Budget.
               </h2>
               <p className="text-gray-600 text-lg leading-relaxed mb-8">
                   Going to open houses without a Pre-Approval is dangerous. You risk falling in love with a home you can't buy, or worse—losing your deposit because financing fell through.
               </p>

               {/* CTA Button */}
               <div className="flex justify-center mb-10">
                  <Link href="/contact" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow-xl hover:-translate-y-1">
                     Get Official Pre-Approval Letter
                  </Link>
               </div>

               {/* Selling Points Grid */}
               <ul className="grid sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <li className="flex gap-4">
                     <CheckCircle size={20} className="text-green-500 shrink-0 mt-1"/>
                     <div>
                        <strong className="text-slate-900 block text-sm uppercase tracking-wide mb-1">Negotiating Power</strong>
                        <span className="text-xs text-gray-500 leading-relaxed block">Sellers accept offers from pre-approved buyers over higher offers from unverified buyers.</span>
                     </div>
                  </li>
                  <li className="flex gap-4">
                     <CheckCircle size={20} className="text-green-500 shrink-0 mt-1"/>
                     <div>
                        <strong className="text-slate-900 block text-sm uppercase tracking-wide mb-1">Rate Hold Protection</strong>
                        <span className="text-xs text-gray-500 leading-relaxed block">Lock in today's rate for 120 days while you shop. If rates go up, you are safe.</span>
                     </div>
                  </li>
               </ul>
            </div>

            {/* 2b. The Calculator Widget (Full Width) */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-gray-100 transform hover:-translate-y-1 transition duration-500 relative">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
               <div className="p-8 md:p-12">
                  <div className="text-center mb-10">
                      <h3 className="font-black uppercase tracking-widest text-slate-900 mb-2">Step 1: Calculate Buying Power</h3>
                      <p className="text-gray-400 text-sm">Estimate your maximum mortgage based on your current income and debts.</p>
                  </div>
                  {/* Providing full container width for the calculator */}
                  <div className="max-w-4xl mx-auto">
                     <AffordabilityCalculator />
                  </div>
               </div>
            </div>

         </div>
      </section>

      {/* --- 3. THE VALUE PROPOSITION --- */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-4">The "Pocket Listing" Advantage</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                 The best deals often sell before they ever hit MLS. Our partner agents have deep networks that give you early access.
              </p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900 group-hover:scale-110 transition">
                    <Search size={28} />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight mb-4">Off-Market Access</h3>
                 <p className="text-gray-500 text-sm leading-relaxed">
                    See "Coming Soon" listings and exclusive assignments 2-4 weeks before the public.
                 </p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900 group-hover:scale-110 transition">
                    <TrendingUp size={28} />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight mb-4">Investor Lens</h3>
                 <p className="text-gray-500 text-sm leading-relaxed">
                    We don't match you with "hobby" agents. Our partners understand Cap Rates, ROI, and Tenant Laws.
                 </p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900 group-hover:scale-110 transition">
                    <Handshake size={28} />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight mb-4">Master Negotiators</h3>
                 <p className="text-gray-500 text-sm leading-relaxed">
                    Data-backed offer strategies that win bidding wars without overpaying.
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* --- 4. EXTENSIVE FAQ --- */}
      <section className="py-24 px-6 bg-slate-900 text-white">
         <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
               <HelpCircle size={40} className="mx-auto text-blue-400 mb-6" />
               <h2 className="text-3xl font-black uppercase tracking-tight">Expert Advice</h2>
               <p className="text-gray-400 mt-4">Answers to common questions about finding an agent and buying in Ontario.</p>
            </div>

            <div className="space-y-6">
               <details className="group bg-white/5 p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
                  <summary className="font-bold text-lg flex justify-between items-center list-none">
                     Do I really need a Realtor to buy a house?
                     <span className="text-blue-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-gray-400 mt-4 leading-relaxed">
                     Technically, no. But in practice, buying without one is risky. A Realtor protects your legal interests, navigates the complex paperwork, and negotiates price based on comparable data you don't have access to. Plus, as a buyer, their service is usually free to you.
                  </p>
               </details>

               <details className="group bg-white/5 p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
                  <summary className="font-bold text-lg flex justify-between items-center list-none">
                     How much does this service cost?
                     <span className="text-blue-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-gray-400 mt-4 leading-relaxed">
                     <strong>Zero.</strong> Our matching service is 100% free for homebuyers. The Realtor is compensated by the seller at closing. We simply ensure you are paired with a high-performance agent rather than a random one.
                  </p>
               </details>

               <details className="group bg-white/5 p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
                  <summary className="font-bold text-lg flex justify-between items-center list-none">
                     What is the difference between Pre-Qualification and Pre-Approval?
                     <span className="text-blue-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-gray-400 mt-4 leading-relaxed">
                     A Pre-Qualification is a rough estimate based on what you <em>say</em> you earn. A Pre-Approval is a verified commitment from a lender based on credit checks and document review. <strong className="text-white">Listing agents respect Pre-Approvals; they ignore Pre-Qualifications.</strong>
                  </p>
               </details>

               <details className="group bg-white/5 p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
                  <summary className="font-bold text-lg flex justify-between items-center list-none">
                     Can you match me with an agent for Pre-Construction?
                     <span className="text-blue-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-gray-400 mt-4 leading-relaxed">
                     Yes. Buying pre-construction requires a specialized agent who understands Platinum Access, interim occupancy fees, and assignment clauses. We have specific partners who focus solely on new developments.
                  </p>
               </details>
            </div>
         </div>
      </section>

      {/* --- 5. FINAL CTA: LEAD FORM --- */}
      <section id="match" className="py-24 px-6 bg-blue-600">
         <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 text-center">
               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-4">
                  Find Your Perfect Match
               </h2>
               <p className="text-gray-500 mb-10 max-w-lg mx-auto">
                  Tell us where you want to buy, and we'll introduce you to the #1 specialist for that neighborhood.
               </p>
               <div className="text-left">
                  <LeadForm type="Realtor Match" title="Start Search" subtitle="No obligation. Confidential." />
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}