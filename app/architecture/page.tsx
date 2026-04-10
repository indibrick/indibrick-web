'use client';

import React, { useState } from 'react';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { 
  Ruler, Building2, Home, FileCheck, CheckCircle, 
  ArrowRight, ShieldCheck, Zap, Layers, Calculator, 
  HelpCircle, ChevronDown, Compass 
} from 'lucide-react';

// --- AEO / SEO FAQ DATABASE ---
const ARCHITECTURE_FAQS = [
  {
    q: "Do I need a licensed Architect for a legal basement in Ontario?",
    a: "Yes, to legally rent out a secondary suite (like a basement apartment), you must obtain a building permit. This requires precise architectural drawings that comply with the Ontario Building Code (OBC), fire safety regulations, and local zoning bylaws. Our OAA-licensed partner ensures your drawings are approved without costly delays."
  },
  {
    q: "How does IndiBrick help me finance my renovation or custom build?",
    a: "This is our ecosystem advantage. While B'Pal Architecture Studio prepares your permit drawings, IndiBrick leverages proprietary AI to instantly underwrite your financing. We can structure a refinance, arrange a HELOC, or secure construction financing to fund your build without you having to shop around."
  },
  {
    q: "How long does it take to get a building permit?",
    a: "Permit timelines vary by municipality, but having 'Fast-Track' professional drawings drastically reduces delays. If drawings are incomplete, the city will issue revisions, costing you months. By using an OAA Architect, your package is complete and compliant from day one."
  },
  {
    q: "What is a 'Change of Use' permit for commercial spaces?",
    a: "If you are leasing a commercial space and changing its function (e.g., turning a retail store into a restaurant or a dental clinic), you must apply for a Change of Use permit. We provide the Occupancy Design Layouts required by the city to prove the new use meets fire, plumbing, and accessibility codes."
  },
  {
    q: "Can I get a loan based on the 'future value' of my renovated home?",
    a: "Yes. Using a 'Purchase Plus Improvements' or a construction draw mortgage, lenders will evaluate the architectural drawings and appraise the home based on what it will be worth *after* the renovations are complete. We handle the complex financing while the architect handles the design."
  }
];

export default function ArchitectureServicePage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const toggleFaq = (question: string) => {
    setOpenFaq(openFaq === question ? null : question);
  };

  // --- SEO SCHEMA ---
  const faqSchemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": ARCHITECTURE_FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const serviceSchemaData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "IndiBrick Architectural & Permit Services",
    "image": "https://indibrick.ca/logo.jpg",
    "description": "Fast-track building permit drawings, legal basement designs, and commercial occupancy layouts provided by OAA-licensed architects. Seamlessly integrated with IndiBrick's construction financing ecosystem.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mississauga",
      "addressRegion": "ON",
      "addressCountry": "CA"
    },
    "areaServed": "Ontario",
    "serviceType": ["Architectural Drawings", "Building Permits", "Legal Basements", "Commercial Design"]
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 pb-20">
      <JsonLd data={faqSchemaData} />
      <JsonLd data={serviceSchemaData} />

      {/* =========================================
          1. HERO SECTION (CLEAN, ENTERPRISE UI)
          ========================================= */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 px-6 bg-gray-50 overflow-hidden border-b border-gray-200">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-100 to-transparent rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40"></div>
        
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
           
           {/* Left Content */}
           <div className="w-full lg:w-[55%] animate-fade-in-up text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
                 <ShieldCheck size={14} className="text-blue-600" /> OAA Licensed Architect Partner
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[1.05] text-slate-900">
                Design. Permit. <br/>
                <span className="text-blue-600">Fund & Build.</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                IndiBrick has partnered exclusively with <strong>B'Pal Architecture Studio Inc.</strong> to provide fast-track building permit drawings. From legal basements to commercial clinics, we synchronize your architectural design directly with our AI-driven financing engine.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                 <a href="#apply" className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2">
                    Request Consultation <ArrowRight size={16}/>
                 </a>
                 <a href="#financing" className="w-full sm:w-auto bg-white border border-gray-200 text-slate-700 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:border-black hover:text-black transition flex items-center justify-center gap-2 shadow-sm">
                    <Calculator size={16}/> Explore Financing
                 </a>
              </div>
           </div>

           {/* Right: Feature Highlights */}
           <div className="w-full lg:w-[45%] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><Ruler size={140}/></div>
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-8 relative z-10">The Ecosystem Advantage</h3>
                 <ul className="space-y-6 relative z-10">
                    <li className="flex items-start gap-4">
                       <div className="bg-green-50 p-2 rounded-lg shrink-0 mt-1"><CheckCircle className="text-green-500" size={20}/></div>
                       <div>
                          <p className="font-bold text-lg text-slate-900">Fast-Track Approvals</p>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed">Avoid municipal delays. Expertly drafted drawings that clear zoning and building codes the first time.</p>
                       </div>
                    </li>
                    <li className="flex items-start gap-4">
                       <div className="bg-blue-50 p-2 rounded-lg shrink-0 mt-1"><Layers className="text-blue-500" size={20}/></div>
                       <div>
                          <p className="font-bold text-lg text-slate-900">Commercial & Residential</p>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed">From medical offices and restaurants to custom homes and legal secondary suites.</p>
                       </div>
                    </li>
                    <li className="flex items-start gap-4">
                       <div className="bg-amber-50 p-2 rounded-lg shrink-0 mt-1"><Zap className="text-amber-500" size={20}/></div>
                       <div>
                          <p className="font-bold text-lg text-slate-900">Integrated AI Financing</p>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed">We secure the equity and construction loans to fund the project while the architect draws the plans.</p>
                       </div>
                    </li>
                 </ul>
              </div>
           </div>

        </div>
      </section>

      {/* =========================================
          2. THE FINANCING INTEGRATION (AI PITCH)
          ========================================= */}
      <section id="financing" className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden border-y border-slate-800">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>

         <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
               <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500/30">
                  <Zap size={14} /> Capital Architecture
               </div>
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6 leading-[1.05]">
                  We fund the vision.
               </h2>
               <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
                  Great architectural plans are useless without the capital to execute them. By keeping your design and financing under one roof, IndiBrick ensures your project is actually viable.
               </p>
               <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <CheckCircle size={18} className="text-blue-400"/> Instant AI Equity Analysis (HELOCs & Refinances)
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <CheckCircle size={18} className="text-blue-400"/> Construction Draw Mortgages
                  </li>
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <CheckCircle size={18} className="text-blue-400"/> Purchase Plus Improvements Lending
                  </li>
               </ul>
            </div>
            
            <div className="w-full md:w-1/2 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md">
               <h3 className="text-xl font-black uppercase tracking-tight mb-6">Calculate Your Runway</h3>
               <p className="text-sm text-slate-400 font-medium mb-8">Use our equity engine to see exactly how much capital you can pull from your existing property to fund your renovations.</p>
               <a href="/tools/refinance-calculator" className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition shadow-lg shadow-blue-600/20">
                  Launch Equity Engine <ArrowRight size={16} className="inline ml-1 mb-0.5"/>
               </a>
            </div>
         </div>
      </section>

      {/* =========================================
          3. DESIGN SERVICES MATRIX
          ========================================= */}
      <section className="py-24 px-6 bg-white">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">Structural Blueprints</h2>
               <p className="text-lg font-medium text-slate-500">Expert architectural drawings for every asset class.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               
               {/* Residential */}
               <div className="bg-gray-50 p-10 md:p-14 rounded-[3rem] shadow-sm border border-gray-100 hover:border-blue-200 transition duration-500 group flex flex-col">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition duration-500"><Home size={32}/></div>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-6">Residential Design</h3>
                  <ul className="space-y-4 mb-8 flex-grow">
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><FileCheck size={18} className="text-blue-500"/> Legal Basement Apartments</li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><FileCheck size={18} className="text-blue-500"/> Separate Entrances & Walk-Ups</li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><FileCheck size={18} className="text-blue-500"/> Home Expansions & Second Stories</li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><FileCheck size={18} className="text-blue-500"/> Custom Home Designs & Rebuilds</li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><FileCheck size={18} className="text-blue-500"/> Site Plan Approvals</li>
                  </ul>
                  <p className="text-sm text-gray-500 font-medium bg-white p-5 rounded-2xl border border-gray-200 leading-relaxed">
                     Perfect for real estate investors looking to maximize ROI by legally adding secondary suites, or families looking to expand their square footage.
                  </p>
               </div>

               {/* Commercial */}
               <div className="bg-gray-50 p-10 md:p-14 rounded-[3rem] shadow-sm border border-gray-100 hover:border-slate-300 transition duration-500 group flex flex-col">
                  <div className="w-16 h-16 bg-white text-slate-800 rounded-2xl flex items-center justify-center mb-8 border border-gray-200 shadow-sm group-hover:scale-110 transition duration-500"><Building2 size={32}/></div>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-6">Commercial Planning</h3>
                  <ul className="space-y-4 mb-8 flex-grow">
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><Compass size={18} className="text-slate-800"/> Occupancy Design Layouts</li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><Compass size={18} className="text-slate-800"/> Restaurants & Take-Out Facilities</li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><Compass size={18} className="text-slate-800"/> Medical & Dental Clinics</li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><Compass size={18} className="text-slate-800"/> Day Care Facilities</li>
                     <li className="flex items-center gap-3 text-slate-700 font-bold"><Compass size={18} className="text-slate-800"/> Warehouses, Salons & Retail Units</li>
                  </ul>
                  <p className="text-sm text-gray-500 font-medium bg-white p-5 rounded-2xl border border-gray-200 leading-relaxed">
                     Ensure your business meets all local zoning, fire safety, plumbing, and building codes before you commit to a commercial lease.
                  </p>
               </div>

            </div>
         </div>
      </section>

      {/* =========================================
          4. MASSIVE AEO / SEO FAQ SECTION
          ========================================= */}
      <section className="py-24 px-6 bg-slate-50 border-t border-gray-200">
         <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest mb-4">
                  <HelpCircle size={14} /> Knowledge Base
               </div>
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-6">Permits & Design FAQs</h2>
               <p className="text-lg text-slate-500 font-medium">Everything you need to know about the Ontario Building Code, legal basements, and construction financing.</p>
            </div>

            <div className="space-y-4">
               {ARCHITECTURE_FAQS.map((faq, idx) => (
                  <details key={idx} className="group bg-white p-6 md:p-8 rounded-[2rem] border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition">
                     <summary className="flex justify-between items-center font-bold text-base md:text-lg text-slate-900 list-none pr-4">
                        {faq.q}
                        <span className="transition duration-300 group-open:rotate-180 bg-gray-50 p-2 rounded-full text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 shrink-0 ml-4">
                           <ChevronDown size={18}/>
                        </span>
                     </summary>
                     <div className="mt-6 text-slate-600 font-medium leading-relaxed text-sm md:text-base border-t border-gray-100 pt-6">
                        {faq.a}
                     </div>
                  </details>
               ))}
            </div>
         </div>
      </section>

      {/* =========================================
          5. CTA / LEAD FORM
          ========================================= */}
      <section id="apply" className="py-24 px-6 bg-white border-t border-gray-100">
         <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-4">Start Your Blueprint</h2>
               <p className="text-gray-500 font-medium text-lg">Connect with our licensed OAA architectural partner and financial underwriting team to map out your project.</p>
            </div>
            
            <div className="bg-white shadow-2xl rounded-[3rem] p-2 border border-gray-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
               <LeadForm 
                  type="Architecture" // Using a specific type or fallback to General 
                  title="Project Intake" 
                  subtitle="Provide the details of your property and what you want to build. We will review the zoning and get back to you with a strategy." 
                  ctaText="Request Architecture Consultation"
               />
            </div>
         </div>
      </section>

    </div>
  );
}