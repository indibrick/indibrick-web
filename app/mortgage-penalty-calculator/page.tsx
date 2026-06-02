'use client';

import React from 'react';
import PenaltyCalculator from '../../components/PenaltyCalculator';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import JsonLd from '../../components/JsonLd';
import { ShieldAlert, BookOpen, CheckCircle, TrendingDown } from 'lucide-react'; // Added TrendingDown

export default function PenaltyCalculatorPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How is a mortgage penalty calculated in Canada?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For variable rate mortgages, the penalty is typically 3 months of interest. For fixed rate mortgages, lenders charge the greater of 3 months interest or the Interest Rate Differential (IRD)."
        }
      },
      {
        "@type": "Question",
        "name": "What is the Interest Rate Differential (IRD)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "IRD is the difference between your current interest rate and the lender's current posted rate for the remainder of your term. Lenders charge this to recoup the lost interest income."
        }
      }
    ]
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={faqSchema} />

      {/* HERO */}
      <div className="container mx-auto px-6 max-w-6xl mb-20">
         <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
               <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-red-100">
                  <ShieldAlert size={14} /> Exit Strategy Tool
               </div>
               <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none text-slate-900">
                 The Cost of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">Freedom.</span>
               </h1>
               <p className="text-xl text-gray-500 font-medium leading-relaxed mb-8">
                  Breaking a mortgage early triggers penalties. Use our calculator to determine if refinancing at a lower rate saves you more than the penalty costs.
               </p>
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                     <div className="bg-green-100 p-2 rounded-full text-green-700"><CheckCircle size={16} /></div>
                     <p className="text-sm font-bold text-gray-600">Accurate IRD Logic (Fixed Rates)</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="bg-green-100 p-2 rounded-full text-green-700"><CheckCircle size={16} /></div>
                     <p className="text-sm font-bold text-gray-600">3-Month Interest Check (Variable)</p>
                  </div>
               </div>
            </div>

            {/* THE CALCULATOR WIDGET */}
            <div className="relative z-10">
               <PenaltyCalculator />
               {/* Decorative Blur */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
            </div>
         </div>
      </div>

      {/* CONTENT & STRATEGY SECTION */}
      <section className="bg-gray-50 py-24 border-t border-gray-100">
         <div className="container mx-auto px-6 max-w-4xl">
            
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black uppercase tracking-tight mb-4">How to lower your penalty</h2>
               <p className="text-gray-500">Banks don't tell you this, but penalties are negotiable or avoidable.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
               <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black mb-3 flex items-center gap-2"><BookOpen size={20} className="text-blue-500"/> The "Blend & Extend"</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                     Instead of breaking the mortgage, ask your lender to "blend" your current rate with the new lower rate. This usually triggers <strong>zero penalty</strong> because you stay with the same bank.
                  </p>
               </div>
               <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black mb-3 flex items-center gap-2"><BookOpen size={20} className="text-blue-500"/> Port Your Mortgage</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                     Moving houses? You can move your existing mortgage to the new property. You avoid the penalty completely, and only pay the new rate on any *extra* money you borrow.
                  </p>
               </div>
            </div>

            {/* AEO FAQ Section */}
            <div className="mb-16">
               <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Common Questions</h3>
               <div className="space-y-6">
                  <details className="group bg-white p-6 rounded-2xl border border-gray-100 cursor-pointer">
                     <summary className="flex justify-between items-center font-bold text-lg list-none">
                        What is the "Posted Rate" vs "Discounted Rate"?
                        <span className="transition group-open:rotate-180"><TrendingDown size={16}/></span>
                     </summary>
                     <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                        Banks use an artificially high "Posted Rate" (e.g., 6.54%) to calculate penalties, even if your actual rate is 4.50%. This creates a massive IRD penalty. This is why "Big Bank" fixed mortgages are risky.
                     </p>
                  </details>
                  <details className="group bg-white p-6 rounded-2xl border border-gray-100 cursor-pointer">
                     <summary className="flex justify-between items-center font-bold text-lg list-none">
                        Can I write off the penalty on my taxes?
                        <span className="transition group-open:rotate-180"><TrendingDown size={16}/></span>
                     </summary>
                     <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                        If the property is an <strong>Investment Property</strong> (rental), yes, the penalty is generally tax-deductible. For your primary residence, unfortunately, it is not.
                     </p>
                  </details>
               </div>
            </div>

            <CalculatorLeadCTA calculatorName="Mortgage Penalty Calculator" />

         </div>
      </section>
    </div>
  );
}