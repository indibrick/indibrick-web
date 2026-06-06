import React from 'react';
import HSTRebateCalculator from '../../components/HSTRebateCalculator';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import JsonLd from '../../components/JsonLd';
import {
  Building2, AlertTriangle, CheckCircle, HelpCircle,
  ChevronDown, FileText, Landmark, Zap, ArrowRight
} from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Ontario HST Rebate Calculator 2026 — New Build & Rental Rebates',
  description: 'Calculate the exact HST Rebate for new build homes in Ontario. Learn about the new 100% GST removal for Purpose-Built Rentals and the NRRP Investor Rebate.',
  slug: '/hst-rebate-calculator',
  keywords: ['HST Rebate Calculator Ontario', 'New Housing Rebate Canada', 'Purpose Built Rental HST Rebate', 'NRRP Rebate Calculator', 'Pre-construction HST Investor'],
});

export default function HSTRebatePage() {

  // --- AEO & SEO SCHEMA FOR VOICE SEARCH ---
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the maximum HST New Housing Rebate in Ontario?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "In Ontario, the maximum provincial portion of the rebate is capped at $24,000 (which represents 75% of the 8% PST on a $400,000 purchase). The federal GST rebate maxes out at $6,300 but phases out to zero for homes priced over $450,000."
        }
      },
      {
        "@type": "Question",
        "name": "Do investors have to pay HST on pre-construction condos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. If you are buying a new build as an investment property, you must pay the full 13% HST on closing day. However, you can apply for the NRRP (New Residential Rental Property) Rebate to get up to $24,000 back from the CRA after you sign a 1-year lease with a tenant."
        }
      },
      {
        "@type": "Question",
        "name": "Did the government cancel HST on new homes recently?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The federal and Ontario governments recently removed the full 13% HST (100% Enhanced GST/HST Rebate), but ONLY for qualifying 'Purpose-Built Rental' housing (like new apartment buildings). Standard pre-construction condos purchased by individual investors still follow the standard $24,000 NRRP rebate rules."
        }
      }
    ]
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "IndiBrick HST Rebate Calculator",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "description": "Calculates the exact Federal and Provincial HST rebate for new construction homes and NRRP investment properties in Ontario."
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 pb-24">
      <JsonLd data={faqSchema} />
      <JsonLd data={softwareSchema} />

      {/* --- 1. HERO SECTION --- */}
      <section className="relative pt-32 pb-24 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none -ml-40 -mt-40"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
           <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              <Zap size={14} /> Updated for 2026 Regulations
           </div>
           <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
             HST New Housing <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Rebate Calculator.</span>
           </h1>
           <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
             Buying pre-construction in Ontario? Calculate your exact federal and provincial tax rebate instantly, and learn how to avoid the $24,000 "Investor Trap" on closing day.
           </p>
        </div>
      </section>

      {/* --- 2. THE CALCULATOR WIDGET --- */}
      <section className="relative z-20 -mt-12 px-6">
         <div className="container mx-auto max-w-5xl">
            <HSTRebateCalculator />
         </div>
      </section>

      {/* --- 3. RECENT LEGISLATION CHANGES (AEO/SEO HUB) --- */}
      <section className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-4xl">
            
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-4">The Recent HST Changes Explained</h2>
               <p className="text-lg text-gray-500 font-medium">What the news headlines didn't tell you about the "Tax Free" new builds.</p>
            </div>

            <div className="space-y-12">
               
               {/* Purpose Built Rental Change */}
               <div className="bg-slate-50 p-8 md:p-10 rounded-[2.5rem] border border-gray-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Building2 size={120}/></div>
                  <div className="relative z-10">
                     <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-4 inline-block border border-green-200">New Legislation</span>
                     <h3 className="text-2xl font-black text-slate-900 mb-4">The Enhanced 100% Rebate (Purpose-Built Rentals)</h3>
                     <div className="prose prose-slate text-gray-600 font-medium leading-relaxed">
                        <p>
                           Recently, the Federal Government (followed closely by the Ontario Provincial Government) announced the <strong>Enhanced GST/HST Rental Rebate</strong>. This effectively removes the full 13% HST on qualifying new housing.
                        </p>
                        <p>
                           <strong>The Catch:</strong> This does <em>not</em> apply to an individual investor buying a pre-construction condo to rent out. It strictly applies to <strong>"Purpose-Built Rental Housing."</strong> To qualify, the building must have at least 4 private apartment units (or 10 private rooms) and be held specifically as a long-term rental facility by the developer/owner.
                        </p>
                     </div>
                  </div>
               </div>

               {/* The Investor Trap (NRRP) */}
               <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border-2 border-amber-100 shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-amber-500" size={32}/>
                        <h3 className="text-2xl font-black text-slate-900">The $24,000 "Investor Trap"</h3>
                     </div>
                     <div className="prose prose-slate text-gray-600 font-medium leading-relaxed">
                        <p>
                           If you are buying a pre-construction home or condo from a builder, the price advertised is usually <strong>"HST Included."</strong> However, this assumes you will be living in the unit as your primary residence.
                        </p>
                        <p>
                           If you tell the builder (or your lawyer) that you plan to rent the unit out, <strong>you no longer qualify for the builder to credit the rebate upfront.</strong> On closing day, the builder will demand you pay the full HST (an unexpected ~$24,000+ cost). 
                        </p>
                        <p className="p-4 bg-amber-50 rounded-xl text-amber-900 border border-amber-200">
                           <strong>The Solution:</strong> You must bring this cash to closing. Once the transaction closes, you sign a 1-year lease with a tenant, and your accountant will file the <strong>NRRP (New Residential Rental Property) Rebate</strong> with the CRA to get your ~$24,000 back. It usually takes 4-8 weeks to receive the check.
                        </p>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* --- 4. AEO FAQ SECTION (VOICE SEARCH OPTIMIZED) --- */}
      <section className="py-24 px-6 bg-slate-900 text-white">
         <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
               <HelpCircle size={40} className="mx-auto text-blue-400 mb-6" />
               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Rebate Intelligence</h2>
               <p className="text-gray-400 font-medium">Clear answers for Canadian real estate investors.</p>
            </div>

            <div className="space-y-4">
               {faqSchema.mainEntity.map((faq, idx) => (
                  <details key={idx} className="group bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
                     <summary className="flex justify-between items-center font-bold text-lg list-none">
                        {faq.name}
                        <span className="text-blue-400 transition group-open:rotate-180"><ChevronDown size={20}/></span>
                     </summary>
                     <p className="text-gray-400 mt-4 leading-relaxed font-medium">
                        {faq.acceptedAnswer.text}
                     </p>
                  </details>
               ))}
               
               {/* Extra explicit FAQ */}
               <details className="group bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
                  <summary className="flex justify-between items-center font-bold text-lg list-none">
                     Can I claim the rebate if I assign the condo before closing?
                     <span className="text-blue-400 transition group-open:rotate-180"><ChevronDown size={20}/></span>
                  </summary>
                  <p className="text-gray-400 mt-4 leading-relaxed font-medium">
                     No. To claim the New Housing Rebate or the NRRP Rebate, you must actually close on the property and take title. If you "flip" the contract via an Assignment Sale before the building registers, you do not qualify for the rebate (and may face capital gains/business income taxes on the profit).
                  </p>
               </details>
            </div>
         </div>
      </section>

      {/* --- 5. LEAD CAPTURE (CLOSING STRATEGY) --- */}
      <section className="py-24 px-6 bg-gray-50 border-t border-gray-200">
         <div className="container mx-auto max-w-4xl">
            <CalculatorLeadCTA calculatorName="HST Rebate Calculator" />
         </div>
      </section>

    </div>
  );
}