'use client';

import React from 'react';
import LeadForm from '../../components/LeadForm';
import MortgageCalculator from '../../components/MortgageCalculator';
import JsonLd from '../../components/JsonLd';
import { 
  Zap, TrendingDown, ShieldCheck, 
  ArrowRight, CheckCircle, Smartphone 
} from 'lucide-react';
import Link from 'next/link';

export default function MortgagesPage() {
  // SEO & AEO: Financial Service Schema
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "IndiBrick Mortgage Strategy",
    "description": "Wholesale mortgage rates and strategic debt structuring for Ontario homeowners and investors.",
    "provider": { "@type": "Organization", "name": "IndiBrick Financial" },
    "areaServed": { "@type": "State", "name": "Ontario" },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Mortgage Services",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Residential Mortgages" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Private Lending" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Self-Employed Solutions" } }
      ]
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={pageSchema} />

      {/* 1. HERO SECTION: Authority & Promise */}
      <section className="bg-black text-white pt-32 pb-24 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-900 to-transparent pointer-events-none opacity-50"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
           <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-green-500/30 animate-pulse">
              <TrendingDown size={14} /> Wholesale Rates Active
           </div>
           <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-6 leading-none">
             Strategic <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Financing.</span>
           </h1>
           <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
             We don't just "shop the banks." We structure your debt to maximize tax efficiency and build long-term wealth. 
             Access <strong>50+ Lenders</strong> through one application.
           </p>

           <div className="flex flex-wrap justify-center gap-4">
              <a href="#calculator" className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition">
                 Run Payment Scenarios
              </a>
              <a href="#contact" className="border border-white/30 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition">
                 Speak to Advisor
              </a>
           </div>
        </div>
      </section>

      {/* 2. THE "WHY CHEAPER" SECTION (Trust Engine) */}
      <section className="py-24 bg-white border-b border-gray-100">
         <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-4xl font-black uppercase tracking-tight mb-6">Why our rates beat your bank.</h2>
                  <div className="prose prose-lg text-gray-500 mb-8">
                     <p>
                        When you walk into a bank branch, you pay <strong>Retail</strong> pricing. They have overhead, branches, and marketing budgets to cover.
                     </p>
                     <p>
                        IndiBrick operates on a <strong>Wholesale</strong> model. Because we fund millions in volume, lenders give us "insider discounts" (often 0.15% - 0.40% lower) to win our business. We pass that savings directly to you.
                     </p>
                  </div>
                  <ul className="space-y-4">
                     {[
                        'No Negotiation Needed (We give you the floor rate upfront)',
                        'Access to Monoline Lenders (Lower penalties than Big Banks)',
                        'Unbiased Advice (We don\'t work for the bank, we work for you)'
                     ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 font-bold text-black text-sm">
                           <CheckCircle className="text-green-500 shrink-0" size={20} /> {item}
                        </li>
                     ))}
                  </ul>
               </div>
               <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                  <div className="flex justify-between items-end mb-8">
                     <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">5-Year Fixed (Avg)</p>
                        <p className="text-4xl font-black text-gray-300 line-through decoration-red-400">4.89%</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">IndiBrick Exclusive</p>
                        <p className="text-5xl font-black text-black">3.99%</p>
                     </div>
                  </div>
                  <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden mb-2">
                     <div className="h-full bg-green-500 w-[80%]"></div>
                  </div>
                  <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400">Potential Savings: ~$4,500 / year</p>
               </div>
            </div>
         </div>
      </section>

      {/* 3. CALCULATOR SECTION (Full Width) */}
      <section id="calculator" className="py-24 bg-gray-50">
         <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-black">Precision Planner</h2>
               <p className="text-gray-500 text-lg">Stress test your budget before you shop.</p>
            </div>
            
            {/* The Un-Squeezed Calculator */}
            <div className="shadow-2xl rounded-[2.5rem] border border-white/50 bg-white">
               <MortgageCalculator />
            </div>
         </div>
      </section>

      {/* 4. AEO INTELLIGENCE (Voice Search Optimization) */}
      <section className="py-24 bg-white">
         <div className="container mx-auto px-6 max-w-4xl">
            <div className="flex items-center gap-2 mb-10">
               <Zap className="text-yellow-500 fill-yellow-500" size={24}/>
               <h2 className="text-2xl font-black uppercase tracking-tight">Strategic Intelligence</h2>
            </div>
            
            <div className="grid gap-12">
               <div>
                  <h3 className="text-xl font-black mb-3">Should I go Fixed or Variable in 2026?</h3>
                  <p className="text-gray-500 leading-relaxed">
                     It depends on your risk tolerance. <strong>Variable</strong> rates effectively "float" with the Bank of Canada. If rates drop, you save immediately. 
                     <strong>Fixed</strong> rates offer stability for 3-5 years. Currently, the spread suggests Variable may offer better long-term savings for qualified borrowers.
                  </p>
               </div>
               <div>
                  <h3 className="text-xl font-black mb-3">How does the Stress Test affect my approval?</h3>
                  <p className="text-gray-500 leading-relaxed">
                     Federal rules (B-20) require you to qualify at the <strong>Contract Rate + 2%</strong> or <strong>5.25%</strong>, whichever is higher. 
                     This reduces your buying power by ~20%. Our team uses credit unions and alternative lenders to bypass this test when necessary.
                  </p>
               </div>
               <div>
                  <h3 className="text-xl font-black mb-3">What is a Private Mortgage?</h3>
                  <p className="text-gray-500 leading-relaxed">
                     If the bank says no due to credit or income verification (self-employed), we use Private Funds. 
                     These are equity-based loans (usually 1-year terms) designed to bridge you until you qualify for a traditional 'A' lender.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* 5. DUAL CONVERSION SECTION (Choose Your Path) */}
      <section id="contact" className="py-24 bg-black text-white relative overflow-hidden">
         {/* Background Texture */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

         <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Choose Your Path</h2>
               <p className="text-gray-400">Ready to execute? Select the option that fits your speed.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               
               {/* OPTION A: DIGITAL (Fast) */}
               <div className="bg-white/10 backdrop-blur-sm p-10 rounded-[2.5rem] border border-white/10 hover:bg-white/15 transition group">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8">
                     <Smartphone size={32} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Start Online</h3>
                  <p className="text-gray-400 mb-8 min-h-[60px]">
                     I know what I want. Take me directly to the secure portal to upload documents and get pre-approved.
                  </p>
                  <a href="https://gopineapple.ca/muditchhura/preapproval" target="_blank" className="flex items-center justify-between bg-white text-black px-8 py-5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition">
                     Launch App <ArrowRight size={16} className="group-hover:translate-x-2 transition"/>
                  </a>
               </div>

               {/* OPTION B: ADVISORY (Strategic) */}
               <div className="bg-white text-black p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                  <div className="relative z-10">
                     <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-8">
                        <ShieldCheck size={32} />
                     </div>
                     <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Advisory Call</h3>
                     <p className="text-gray-500 mb-8 min-h-[60px]">
                        I have a complex situation (Self-Employed, Multi-Property, Private) and need a human strategy session first.
                     </p>
                     {/* Embedded Lead Form for Immediate Action */}
                     <div className="bg-gray-50 rounded-2xl p-1 border border-gray-200">
                        <LeadForm type="Mortgage" title="Book Strategy Call" subtitle="Direct access to a Senior Broker." />
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </section>

    </div>
  );
}