import React from 'react';
import MortgageCalculator from '../../components/MortgageCalculator';
import GamifiedContactForm from '../../components/GamifiedContactForm';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import JsonLd from '../../components/JsonLd';
import {
  Calculator, CheckCircle, AlertTriangle, TrendingUp, Shield, ChevronDown
} from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Canada Mortgage Payment Calculator 2026 — Land Transfer Tax & Stress Test',
  description: 'The most robust mortgage calculator in Canada. Instantly calculate monthly payments, CMHC insurance, Ontario Land Transfer Tax, and exact income required to pass the 2026 Stress Test.',
  slug: '/mortgage-payment-calculator',
  keywords: ['canada mortgage calculator 2026', 'ontario land transfer tax calculator', 'realtor mortgage payment', 'stress test calculator', 'cmhc premium calculator', 'cash to close calculator'],
});

export default function MortgagePaymentPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'IndiBrick Advanced Mortgage Calculator',
    description: 'Calculates monthly mortgage payments, CMHC insurance, and Land Transfer Tax for Ontario properties. Includes 2026 Stress Test qualification logic.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { "@type": "Offer", "price": "0", "priceCurrency": "CAD" },
    featureList: "Mortgage Payment, CMHC Premium, Land Transfer Tax, GDS/TDS Ratios, Stress Test Qualifier",
    author: { "@type": "Organization", "name": "IndiBrick Financial" }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the Mortgage Stress Test rate for 2026?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'As of 2026, the Mortgage Stress Test requires you to qualify at the higher of 5.25% or your contract rate plus 2.00%. For example, if you get a rate of 4.29%, you must prove you can afford payments at 6.29%.'
        }
      },
      {
        '@type': 'Question',
        name: 'How are closing costs calculated in Ontario?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Closing costs typically require 1.5% to 4% of the purchase price. This includes your Down Payment, Provincial Land Transfer Tax, Municipal Land Transfer Tax (if in Toronto), Legal Fees (~$1500), and 8% PST on any CMHC insurance premium.'
        }
      }
    ]
  };

  return (
    <div className="bg-white">
      <JsonLd data={jsonLd} />
      <JsonLd data={faqSchema} />
      
      {/* --- 1. HERO SECTION --- */}
      <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
             <Calculator size={14} /> Official 2026 Underwriting Rules
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
            The Most Accurate <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Calculator in Canada.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Most online calculators leave you blind. Calculate your exact payments, CMHC premiums, Land Transfer Tax, and the <strong>exact income required</strong> to pass the Stress Test.
          </p>
        </div>
      </section>

      {/* --- 2. THE CALCULATOR --- */}
      <section className="py-16 md:py-24 bg-gray-50 border-y border-gray-200" id="calculator">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
           <MortgageCalculator />
        </div>
      </section>

      {/* --- 3. GAMIFIED FUNNEL: "DON'T QUALIFY?" --- */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
         <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><AlertTriangle size={24}/></div>
                     <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                        Income Too Low <br/>For The Bank?
                     </h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                     The calculator above uses strict Big Bank rules (39% GDS limit). 
                     If you are Self-Employed, have bruised credit, or write off a lot of income, <strong>you will fail the stress test</strong>.
                     <br/><br/>
                     We have access to Alternative "B-Lenders" that allow up to <strong>50% debt ratios</strong> and stated income programs.
                  </p>
                  <ul className="space-y-4 mb-8">
                     <li className="flex items-center gap-3 font-bold text-slate-900">
                        <CheckCircle size={20} className="text-green-500"/> Escape the 5.25% Stress Test
                     </li>
                     <li className="flex items-center gap-3 font-bold text-slate-900">
                        <CheckCircle size={20} className="text-green-500"/> Use Bank Statements for Income
                     </li>
                  </ul>
               </div>
               
               {/* Replaced old LeadForm with the Gamified Form */}
               <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/10 rounded-[3rem] transform rotate-3 scale-105"></div>
                  <GamifiedContactForm />
               </div>
            </div>
         </div>
      </section>

      {/* --- 4. AEO CONTENT (VOICE SEARCH OPTIMIZATION) --- */}
      <section className="py-24 px-6 bg-slate-900 text-white">
         <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Underwriting 101</h2>
               <p className="text-gray-400">How banks actually calculate your "Cash to Close" in 2026.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div>
                     <h3 className="flex items-center gap-3 text-lg font-bold mb-3">
                        <TrendingUp size={20} className="text-blue-400"/> The Hidden PST on CMHC
                     </h3>
                     <p className="text-sm text-gray-400 leading-relaxed">
                        If you put down less than 20%, your CMHC insurance premium is added to your mortgage. <strong>However</strong>, in Ontario, the 8% PST on that premium must be paid in physical cash on closing day.
                     </p>
                  </div>
                  <div>
                     <h3 className="flex items-center gap-3 text-lg font-bold mb-3">
                        <Shield size={20} className="text-green-400"/> Double Land Transfer Tax
                     </h3>
                     <p className="text-sm text-gray-400 leading-relaxed">
                        Buying in Toronto (416)? You pay both Provincial and Municipal Land Transfer Taxes. First-Time Buyers receive a rebate of up to $8,475 to help offset this.
                     </p>
                  </div>
               </div>

               <div className="space-y-4">
                  <details className="group bg-white/5 border border-white/10 p-6 rounded-2xl cursor-pointer transition hover:bg-white/10">
                     <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                        What is GDS vs TDS?
                        <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                     </summary>
                     <p className="text-gray-400 text-xs mt-4 leading-relaxed">
                        <strong>GDS (Gross Debt Service):</strong> Your Housing Costs (Mortgage + Tax + Heat) divided by Income. Max allowed is 39%.<br/><br/>
                        <strong>TDS (Total Debt Service):</strong> Housing Costs + Other Debts (Car Loans, Credit Cards) divided by Income. Max allowed is 44%.
                     </p>
                  </details>
                  <details className="group bg-white/5 border border-white/10 p-6 rounded-2xl cursor-pointer transition hover:bg-white/10">
                     <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                        How can I increase my approval?
                        <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                     </summary>
                     <p className="text-gray-400 text-xs mt-4 leading-relaxed">
                        1. <strong>Clear Debts:</strong> Paying off a $400/month car loan increases your mortgage affordability by over $80,000.<br/>
                        2. <strong>Add a Co-Signer:</strong> Blending incomes instantly lowers your GDS/TDS ratios.<br/>
                        3. <strong>Shop Wholesale Rates:</strong> Lower rates mean lower stress-test benchmarks.
                     </p>
                  </details>
               </div>
            </div>
         </div>
      </section>

      {/* --- 5. CTA SECTION (AI INTAKE) --- */}
      <section className="py-24 px-6 bg-gray-50 border-t border-gray-200">
         <div className="container mx-auto max-w-3xl text-center">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4 block">Ready to execute?</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 text-slate-900">
               Get Your Official Pre-Approval.
            </h2>
            <p className="text-gray-500 mb-12 max-w-xl mx-auto">
               Chat with our secure AI Copilot to generate your custom document checklist and secure today's lowest wholesale rates.
            </p>
            
            <CalculatorLeadCTA calculatorName="Mortgage Payment Calculator" />
         </div>
      </section>

    </div>
  );
}