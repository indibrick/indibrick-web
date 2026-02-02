import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Calculator, Sun, CheckCircle, HelpCircle, ArrowRight, 
  TrendingUp, ShieldCheck, DollarSign 
} from 'lucide-react';
import JsonLd from '../../components/JsonLd';
import ReverseMortgageCalculator from '../../components/calculators/ReverseMortgageCalculator';
import LeadForm from '../../components/LeadForm'; // <--- Added LeadForm Import

export const metadata: Metadata = {
  title: 'Reverse Mortgage Calculator Ontario (2026) | Calculate 55+ Payout',
  description: 'Instant Reverse Mortgage Calculator for Ontario. See exactly how much tax-free cash you can unlock from your home equity. No personal info required to calculate.',
  keywords: ['Reverse Mortgage Calculator Ontario', 'CHIP Calculator', 'Equity Release Calculator', 'How much reverse mortgage can I get', 'Senior Home Loan Calculator'],
};

export default function ReverseMortgageCalculatorPage() {
  
  // --- AEO & SEO SCHEMA ---
  const calculatorSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "IndiBrick Reverse Mortgage Calculator",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CAD"
    },
    "featureList": "Calculate loan-to-value for seniors 55+",
    "description": "Calculates available tax-free cash based on age, property value, and location in Ontario."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        "name": "How is the reverse mortgage amount calculated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The amount you qualify for is based on three factors: your age (must be 55+), your home's appraised value, and your property's location. Generally, the older you are, the higher percentage (up to 55%) you can borrow."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to make monthly interest payments?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. With a standard Reverse Mortgage in Canada, no monthly payments are required. Interest accrues and is added to the balance. You only repay the loan when you move, sell the home, or pass away."
        }
      }
    ]
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={calculatorSchema} />
      <JsonLd data={faqSchema} />

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 bg-slate-50 border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
           <div className="text-center mb-12">
              <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block border border-orange-200 animate-fade-in">
                 For Homeowners 55+
              </span>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-slate-900 leading-[0.95]">
                 Reverse Mortgage <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Calculator.</span>
              </h1>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                 Find out instantly how much tax-free cash you can unlock from your Ontario home. No credit check required to calculate.
              </p>
           </div>

           {/* THE TOOL WIDGET */}
           <div className="max-w-4xl mx-auto">
              <div className="relative">
                 <div className="absolute inset-0 bg-orange-500/10 rounded-[3rem] blur-3xl transform scale-95 translate-y-8"></div>
                 <ReverseMortgageCalculator />
              </div>
           </div>
        </div>
      </section>

      {/* --- AEO CONTENT: "HOW IT WORKS" FOR AI SEARCH --- */}
      <section className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-4 mb-10">
               <div className="p-3 bg-slate-900 text-white rounded-xl"><Calculator size={24}/></div>
               <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">How the Math Works</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
               <div>
                  <p className="text-gray-500 leading-relaxed mb-6">
                     In Canada, Reverse Mortgages are regulated to ensure you never owe more than your home is worth. The "LTV" (Loan-to-Value) limit is strictly capped.
                  </p>
                  <ul className="space-y-4">
                     <li className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5"/>
                        <div>
                           <span className="font-bold text-slate-900 block text-sm">Age Factor</span>
                           <span className="text-xs text-gray-500">The older you are, the more you get. A 55-year-old might qualify for 30%, while an 80-year-old could get 55%.</span>
                        </div>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5"/>
                        <div>
                           <span className="font-bold text-slate-900 block text-sm">Location Premium</span>
                           <span className="text-xs text-gray-500">Homes in major urban centers like Toronto, Vaughan, and Ottawa often qualify for higher limits due to stable liquidity.</span>
                        </div>
                     </li>
                  </ul>
               </div>

               <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                  <h3 className="font-black uppercase tracking-tight mb-4 text-sm flex items-center gap-2">
                     <TrendingUp size={16} className="text-blue-600"/> Equity Protection
                  </h3>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                     Unlike a HELOC, a reverse mortgage does not require monthly payments. Instead, the interest is added to the principal.
                  </p>
                  <div className="space-y-3">
                     <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">
                        <span>Home Value</span>
                        <span>$1,000,000</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">
                        <span>LTV Limit</span>
                        <span>55%</span>
                     </div>
                     <div className="flex justify-between text-sm font-black text-slate-900 uppercase tracking-wider pt-1">
                        <span>Max Cash</span>
                        <span className="text-green-600">$550,000</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- FAQ SECTION (VOICE SEARCH OPTIMIZED) --- */}
      <section className="py-24 px-6 bg-slate-50 border-t border-gray-200">
         <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
               <HelpCircle size={40} className="mx-auto text-slate-900 mb-4" />
               <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Calculator FAQ</h2>
            </div>
            
            <div className="space-y-4">
               <details className="group bg-white p-6 rounded-2xl border border-gray-200 cursor-pointer shadow-sm">
                  <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                     Does this affect my Old Age Security (OAS)?
                     <span className="text-gray-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                     No. The funds from a reverse mortgage are considered a <strong>loan advance</strong>, not income. Therefore, it is 100% tax-free and does not trigger a clawback of OAS or GIS (Guaranteed Income Supplement) benefits.
                  </p>
               </details>
               {/* Additional FAQs... */}
            </div>
         </div>
      </section>

      {/* --- LEAD FORM SECTION (Target of the Calculator Button) --- */}
      <section id="quote" className="py-24 px-6 bg-orange-50 border-t border-orange-100">
         <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
               <div className="text-center mb-10">
                  <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Claim Your Quote</h2>
                  <p className="text-gray-500">
                     Confirm your eligibility with a licensed advisor. No obligation.
                  </p>
               </div>
               <LeadForm type="Reverse Mortgage Calc Page" title="Get Official Quote" subtitle="Confidential Review." />
            </div>
         </div>
      </section>

    </div>
  );
}