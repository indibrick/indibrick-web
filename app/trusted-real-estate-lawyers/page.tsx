'use client';

import React from 'react';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { 
  Scale, Smartphone, ShieldCheck, Users, 
  CheckCircle, XCircle, ArrowRight, Zap 
} from 'lucide-react';

export default function LawyersPage() {
  
  // --- AEO: LEGAL SERVICE SCHEMA ---
  const legalSchema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "name": "IndiBrick Real Estate Law Network",
    "description": "Tech-first real estate legal services in Ontario. Fixed pricing, digital signing, and dedicated success specialists.",
    "areaServed": "Ontario",
    "priceRange": "$$",
    "knowsAbout": ["Real Estate Closing", "Title Transfer", "Mortgage Refinance", "Pre-Construction Assignments"],
    "offers": {
      "@type": "Offer",
      "description": "Fixed Fee Real Estate Closing",
      "priceCurrency": "CAD"
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={legalSchema} />

      {/* --- 1. HERO: TECH-FIRST POSITIONING --- */}
      <section className="bg-black text-white pt-32 pb-24 relative overflow-hidden border-b border-white/10">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-blue-600/30 animate-pulse">
             <Smartphone size={14} /> Digital-First Legal
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
            Legal Closings <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Reinvented.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed mb-10">
            Stop chasing lawyers for updates. We partnered with an exclusive <strong>Tech-First Firm</strong> that gives you a <span className="text-white font-bold">Real-Time Portal</span>, fixed pricing, and zero friction.
          </p>
          <div className="flex justify-center gap-4">
             <button onClick={() => document.getElementById('quote')?.scrollIntoView({behavior: 'smooth'})} className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition">
                Get Fixed Quote
             </button>
          </div>
        </div>
      </section>

      {/* --- 2. THE PROBLEM VS SOLUTION (SEO/GEO CONTENT) --- */}
      <section className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               
               {/* The Old Way */}
               <div className="space-y-8">
                  <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">The "Old Law" Problem</h2>
                  <p className="text-gray-500 leading-relaxed">
                     Traditional firms operate on "billable hours" and outdated systems. This leads to anxiety, hidden costs, and radio silence when you need answers most.
                  </p>
                  
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
                     <div className="flex gap-4">
                        <XCircle className="text-red-500 shrink-0" />
                        <div>
                           <h4 className="font-bold text-red-900 text-sm uppercase">Unreasonable Payout Charges</h4>
                           <p className="text-xs text-red-800/70 mt-1">Lawyers often add "administrative fees" or "software charges" at the last minute, inflating your bill by hundreds.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <XCircle className="text-red-500 shrink-0" />
                        <div>
                           <h4 className="font-bold text-red-900 text-sm uppercase">Phone Tag</h4>
                           <p className="text-xs text-red-800/70 mt-1">"I'll call you back." You leave voicemails and wait days just to know if your file is ready.</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* The IndiBrick Way */}
               <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-8 relative z-10">The IndiBrick Standard</h2>
                  
                  <div className="space-y-6 relative z-10">
                     <div className="flex gap-4 items-start">
                        <div className="bg-blue-600 p-2 rounded-lg shrink-0"><Zap size={20}/></div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">The Client Portal</h4>
                           <p className="text-sm text-gray-400">Log in anytime. See your file status, upload docs, and track milestones instantly. No calling required.</p>
                        </div>
                     </div>
                     
                     <div className="flex gap-4 items-start">
                        <div className="bg-green-600 p-2 rounded-lg shrink-0"><ShieldCheck size={20}/></div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">Fixed, Transparent Pricing</h4>
                           <p className="text-sm text-gray-400">We negotiated market-competitive flat rates. The price we quote is the price you pay. Period.</p>
                        </div>
                     </div>

                     <div className="flex gap-4 items-start">
                        <div className="bg-purple-600 p-2 rounded-lg shrink-0"><Users size={20}/></div>
                        <div>
                           <h4 className="font-bold text-lg mb-1">Success Specialist</h4>
                           <p className="text-sm text-gray-400">You get a dedicated human guide, separate from the lawyer, whose only job is to ensure your smooth closing.</p>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* --- 3. SERVICES GRID --- */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
         <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">Legal Scope</h2>
               <p className="text-gray-500 mt-4">Comprehensive protection for every real estate transaction.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {[
                  { title: "Purchase & Sale", desc: "Standard residential closings for detached, condos, and towns." },
                  { title: "Refinance", desc: "Title transfer and mortgage registration for equity takeouts." },
                  { title: "Pre-Construction", desc: "Interim occupancy review and final closing for builder units." },
                  { title: "Private Lending", desc: "Independent Legal Advice (ILA) for private mortgage borrowers." },
                  { title: "Title Transfer", desc: "Adding or removing family members from property title." },
                  { title: "Status Certificate", desc: "Critical review of condo corp financials before you buy." }
               ].map((service, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition hover:border-black group">
                     <Scale className="w-8 h-8 mb-4 text-gray-400 group-hover:text-black transition" />
                     <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                     <p className="text-sm text-gray-500">{service.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- 4. LEAD FORM (CONVERSION) --- */}
      <section id="quote" className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-4xl">
            <div className="bg-blue-600 text-white rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
               {/* Decorative Circles */}
               <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

               <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">Get Your Fixed Quote.</h2>
                  <p className="text-blue-100 mb-10 max-w-xl mx-auto font-medium">
                     Don't sign the Agreement of Purchase and Sale without a lawyer's review. Connect with our tech-first partner today.
                  </p>
                  
                  <div className="bg-white text-slate-900 p-8 rounded-[2rem] shadow-lg max-w-lg mx-auto text-left">
                     <LeadForm 
                        type="Legal Services" 
                        title="Start Legal Review" 
                        subtitle="No obligation quote." 
                     />
                  </div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}