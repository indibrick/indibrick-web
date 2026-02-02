'use client';

import React from 'react';
import Image from 'next/image'; // Ensure you have project images in public folder or remove placeholders
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { 
  Hammer, HardHat, Ruler, ClipboardCheck, 
  Home, LayoutDashboard, Clock, ShieldCheck, 
  Banknote, ArrowRight 
} from 'lucide-react';

export default function ContractorsPage() {

  // --- AEO/GEO: CONTRACTOR SCHEMA ---
  // This helps AI answer: "Best renovation contractors in Ontario"
  const contractorSchema = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "name": "IndiBrick Renovation Network",
    "description": "Vetted general contractors for home renovations, kitchen remodeling, basement finishing, and commercial build-outs in Ontario.",
    "areaServed": "Ontario",
    "priceRange": "$$$",
    "openingHours": "Mo-Fr 09:00-17:00",
    "makesOffer": [
        "Kitchen Renovation", 
        "Basement Finishing", 
        "Bathroom Remodeling", 
        "Commercial Leaseholds", 
        "Legal Second Suites"
    ]
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
      <JsonLd data={contractorSchema} />

      {/* --- 1. HERO: THE VALUE PROPOSITION --- */}
      <section className="pt-32 pb-24 px-6 bg-slate-900 text-white relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -ml-20 -mt-20"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-yellow-500/20 animate-pulse">
             <HardHat size={14} /> Vetted & Insured Pros
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none">
            Renovations <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Done Right.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed mb-10">
            Don't gamble with your home. We connect you with <strong>Pre-Vetted General Contractors</strong> who deliver on time, on budget, and up to code.
          </p>
          <div className="flex justify-center">
             <button onClick={() => document.getElementById('quote')?.scrollIntoView({behavior: 'smooth'})} className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition shadow-lg shadow-white/10">
                Schedule No-Obligation Quote
             </button>
          </div>
        </div>
      </section>

      {/* --- 2. THE PAIN POINTS (AEO: "Why hire a GC?") --- */}
      <section className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               
               {/* The Problem */}
               <div className="space-y-8">
                  <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">The "Renovation Nightmare" Ends Here.</h2>
                  <p className="text-gray-500 text-lg leading-relaxed">
                     Most homeowners fear three things: <strong>Ghosting contractors, surprise costs, and endless delays.</strong> We built the IndiBrick Network to eliminate these risks entirely.
                  </p>
                  
                  <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 space-y-6">
                     <div className="flex gap-4 items-start">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600 shrink-0"><Clock size={20}/></div>
                        <div>
                           <h4 className="font-bold text-red-900 text-sm uppercase">The Delay Trap</h4>
                           <p className="text-sm text-red-800/70 mt-1">"Two weeks" turns into two months. We don't tolerate loose timelines.</p>
                        </div>
                     </div>
                     <div className="flex gap-4 items-start">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600 shrink-0"><Banknote size={20}/></div>
                        <div>
                           <h4 className="font-bold text-red-900 text-sm uppercase">The Budget Creep</h4>
                           <p className="text-sm text-red-800/70 mt-1">Low-ball quotes that double once the walls are open. We enforce transparent estimates.</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* The Solution (IndiBrick Vetting) */}
               <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-gray-200 relative overflow-hidden">
                  <h3 className="text-2xl font-black uppercase mb-8 relative z-10">The Vetting Standard</h3>
                  <div className="space-y-6 relative z-10">
                     {[
                        { icon: ShieldCheck, title: "Fully Insured & WSIB", desc: "If they aren't covered, they don't step on your property." },
                        { icon: ClipboardCheck, title: "Permit Experts", desc: "We handle the city paperwork. Legal basement suites, structural changes, and zoning." },
                        { icon: Ruler, title: "Detailed Contracts", desc: "Scope of work is defined in writing. No ambiguity." }
                     ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                           <item.icon className="text-slate-900 shrink-0" size={24} />
                           <div>
                              <h4 className="font-bold text-sm uppercase">{item.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* --- 3. SERVICES (GEO KEYWORDS) --- */}
      <section className="py-24 bg-slate-900 text-white">
         <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Build & Renovate</h2>
               <p className="text-gray-400 max-w-2xl mx-auto">
                  From legal second suites to luxury kitchen overhauls, our partners specialize in high-ROI improvements.
               </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
               {[
                  { icon: Home, title: "Full Home Renovation", desc: "Gut jobs, layout restructuring, and complete modernizations." },
                  { icon: LayoutDashboard, title: "Legal Basements", desc: "Turn your basement into a rental income suite. Fire separation, egress windows, and permits." },
                  { icon: Hammer, title: "Kitchens & Baths", desc: "High-end finishes, custom cabinetry, and plumbing reconfiguration." },
                  { icon: HardHat, title: "Commercial Build-Outs", desc: "Office leaseholds, retail spaces, and restaurant fit-outs." },
                  { icon: Ruler, title: "Additions", desc: "Expanding footprint, second-story top-ups, and structural framing." },
                  { icon: ClipboardCheck, title: "Project Management", desc: "We oversee the trades so you don't have to." }
               ].map((service, i) => (
                  <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition group cursor-default">
                     <service.icon className="w-10 h-10 mb-6 text-yellow-400 group-hover:scale-110 transition" />
                     <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                     <p className="text-sm text-gray-400">{service.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- 4. HOW IT WORKS (AEO: "Process of hiring a contractor") --- */}
      <section className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">The IndiBrick Process</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 z-0"></div>

                {[
                    { step: "01", title: "Site Visit", desc: "We meet at your property to assess feasibility and take measurements." },
                    { step: "02", title: "Fixed Quote", desc: "You receive a detailed breakdown of materials, labor, and timelines." },
                    { step: "03", title: "Build & Update", desc: "Work begins. You get regular photo updates via our digital portal." }
                ].map((item, i) => (
                    <div key={i} className="relative z-10 bg-white p-6 text-center">
                        <div className="w-24 h-24 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-xl border-8 border-white">
                            {item.step}
                        </div>
                        <h4 className="font-black text-xl mb-2 uppercase">{item.title}</h4>
                        <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                ))}
            </div>
         </div>
      </section>

      {/* --- 5. LEAD FORM --- */}
      <section id="quote" className="py-24 px-6 bg-gray-50 border-t border-gray-200">
         <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-slate-900">
                  Ready to Build?
               </h2>
               <p className="text-xl text-gray-500 font-medium">
                  Get a detailed quote from a partner who actually shows up.
               </p>
            </div>
            
            <div className="bg-white text-slate-900 p-8 md:p-12 rounded-[2.5rem] max-w-lg mx-auto shadow-2xl border border-gray-100">
               <LeadForm 
                  type="Contractor Quote" 
                  title="Request Estimate" 
                  subtitle="No cost. No obligation." 
               />
            </div>
         </div>
      </section>

    </div>
  );
}