import React from 'react';
import { Metadata } from 'next';
import MortgageCalculator from '../../components/MortgageCalculator';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { 
  Calculator, CheckCircle, AlertTriangle, HelpCircle, 
  TrendingUp, Shield, ChevronDown, Unlock 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ontario Mortgage Payment Calculator (2026) | True Stress Test Analysis',
  description: 'Most accurate Mortgage Calculator in Canada. Calculates GDS/TDS ratios (39%/44%), CMHC premiums, and Land Transfer Tax. See if you qualify at 3.39%* rates.',
  keywords: ['mortgage calculator ontario', 'mortgage payment calculator toronto', 'stress test calculator 2026', 'cmhc insurance calculator', 'gds tds calculator'],
  openGraph: {
    title: 'Ontario Mortgage Payment Calculator | Bank-Grade Accuracy',
    description: 'Don\'t guess. Run the official 2026 Stress Test numbers with IndiBrick.',
    type: 'website',
  },
};

export default function MortgagePaymentPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'IndiBrick Mortgage & Stress Test Calculator',
    description: 'Calculates monthly mortgage payments, CMHC insurance, and Land Transfer Tax for Ontario properties. Includes 2026 Stress Test qualification logic.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { "@type": "Offer", "price": "0", "priceCurrency": "CAD" },
    featureList: "Mortgage Payment, CMHC Premium, Land Transfer Tax, GDS/TDS Ratios",
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
          text: 'As of 2026, the Mortgage Stress Test requires you to qualify at the higher of 5.25% or your contract rate plus 2.00%. For example, if you get a rate of 3.39%, you must prove you can afford payments at 5.39%.'
        }
      },
      {
        '@type': 'Question',
        name: 'What income is required for a $500k mortgage in Ontario?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Based on 2026 rates (~3.39%) and a 25-year amortization, you typically need a household income of approximately $105,000 to $115,000 to pass the GDS (Gross Debt Service) ratio of 39%, assuming minimal other debts.'
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
        {/* Background Mesh */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
             <Calculator size={14} /> Official 2026 Methodology
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
            The Truth About <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Your Affordability.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Most online calculators are wrong. They don't factor in the <strong>Stress Test (5.25%+)</strong> or the <strong>39% GDS Limit</strong>. 
            We do. See exactly what the bank sees.
          </p>
        </div>
      </section>

      {/* --- 2. THE CALCULATOR (USP) --- */}
      <section className="py-20 bg-gray-50 border-y border-gray-200" id="calculator">
        <div className="container mx-auto px-6 max-w-7xl">
           <MortgageCalculator />
        </div>
      </section>

      {/* --- 3. MARKETING PSYCHOLOGY: THE "DON'T QUALIFY?" BLOCK --- */}
      <section className="py-20 px-6 bg-white">
         <div className="container mx-auto max-w-5xl">
            <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 md:p-12">
               <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                  <div className="max-w-2xl">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-100 p-3 rounded-xl text-red-600"><AlertTriangle size={24}/></div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                           Did the Calculator say "Declined"?
                        </h2>
                     </div>
                     <p className="text-gray-600 leading-relaxed mb-6">
                        <strong>Don't panic.</strong> The calculator above uses strict "A-Lender" (Big Bank) rules—specifically the 39% GDS and 44% TDS ratios. 
                        If you are Self-Employed, have bruised credit, or high income deductions, you may not fit this box.
                     </p>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm font-bold text-slate-900">
                           <CheckCircle size={16} className="text-green-500"/> We have lenders with <span className="underline decoration-green-500 decoration-2">50% GDS / 50% TDS</span> limits.
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-slate-900">
                           <CheckCircle size={16} className="text-green-500"/> We have "Stated Income" programs for Business Owners.
                        </li>
                     </ul>
                  </div>
                  <div className="w-full md:w-auto">
                     <a href="/rates" className="block w-full md:w-auto text-center bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest transition shadow-xl hover:-translate-y-1">
                        View B-Lender Options
                     </a>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- 4. AEO CONTENT (VOICE SEARCH OPTIMIZATION) --- */}
      <section className="py-20 px-6 bg-slate-900 text-white">
         <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Methodology Breakdown</h2>
               <p className="text-gray-400">How banks actually calculate your approval amount in 2026.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div>
                     <h3 className="flex items-center gap-3 text-lg font-bold mb-3">
                        <TrendingUp size={20} className="text-blue-400"/> The "Stress Test"
                     </h3>
                     <p className="text-sm text-gray-400 leading-relaxed">
                        Even if your rate is <strong>3.39%</strong>, the bank must calculate your affordability as if your rate was <strong>5.39%</strong> (Contract + 2%). This safety buffer ensures you can afford the home if rates rise.
                     </p>
                  </div>
                  <div>
                     <h3 className="flex items-center gap-3 text-lg font-bold mb-3">
                        <Shield size={20} className="text-green-400"/> CMHC Premiums
                     </h3>
                     <p className="text-sm text-gray-400 leading-relaxed">
                        If you put down less than 20%, you must pay Default Insurance. On a $500k home with 5% down ($25k), the insurance is roughly <strong>$19,000</strong> (4%), which is added to your mortgage amount.
                     </p>
                  </div>
               </div>

               <div className="space-y-4">
                  <details className="group bg-white/5 border border-white/10 p-6 rounded-2xl cursor-pointer">
                     <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                        What is GDS vs TDS?
                        <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                     </summary>
                     <p className="text-gray-400 text-xs mt-4 leading-relaxed">
                        <strong>GDS (Gross Debt Service):</strong> Your Housing Costs (Mortgage + Tax + Heat) divided by Income. Max allowed is 39%.<br/><br/>
                        <strong>TDS (Total Debt Service):</strong> Housing Costs + Other Debts (Car Loans, Credit Cards) divided by Income. Max allowed is 44%.
                     </p>
                  </details>
                  <details className="group bg-white/5 border border-white/10 p-6 rounded-2xl cursor-pointer">
                     <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                        How can I lower my monthly payment?
                        <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                     </summary>
                     <p className="text-gray-400 text-xs mt-4 leading-relaxed">
                        1. <strong>Increase Down Payment:</strong> Putting 20% down avoids CMHC fees and allows for a 30-year amortization (lowering payments).<br/>
                        2. <strong>Shop Wholesale Rates:</strong> A 0.50% lower rate can save ~$200/month.<br/>
                        3. <strong>Clear Debts:</strong> Paying off a $400/month car loan increases your mortgage affordability by ~$100,000.
                     </p>
                  </details>
               </div>
            </div>
         </div>
      </section>

      {/* --- 5. CTA SECTION --- */}
      <section className="py-24 px-6 bg-gray-50 border-t border-gray-200">
         <div className="container mx-auto max-w-4xl text-center">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4 block">Ready to proceed?</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 text-slate-900">
               Get a Rate Hold.
            </h2>
            <p className="text-gray-500 mb-12 max-w-xl mx-auto">
               Secure today's lowest rate (3.39%*) for 120 days while you shop. No commitment required.
            </p>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-lg mx-auto">
               <LeadForm type="Rate Hold" title="Lock My Rate" subtitle="Protect your buying power." />
            </div>
         </div>
      </section>

    </div>
  );
} 