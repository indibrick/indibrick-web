import React from 'react';
import SmithManeuverCalculator from '../../../components/calculators/SmithManeuverCalculator';
import CalculatorLeadCTA from '../../../components/CalculatorLeadCTA';
import JsonLd from '../../../components/JsonLd';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, Shield, TrendingUp, BookOpen } from 'lucide-react';
import { buildMetadata } from '../../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Smith Maneuver Calculator (2026) — Tax-Deductible Mortgage Strategy',
  description: 'Calculate your tax refunds with the Smith Manoeuvre. Model the conversion of your mortgage into a tax-deductible investment loan using our institutional-grade engine.',
  slug: '/tools/smith-maneuver-calculator',
  keywords: ['Smith Maneuver Calculator', 'Tax Deductible Mortgage Canada', 'Readvanceable Mortgage', 'Scotia STEP', 'TD FlexLine', 'Debt Conversion Strategy', 'Indibrick Tools'],
});

export default function SmithManeuverPage() {
  
  // AEO/GEO Schema for "How-To" and FAQ
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the Smith Maneuver?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Smith Maneuver is a legal Canadian financial strategy that converts non-deductible mortgage debt into tax-deductible investment debt. It involves re-borrowing the principal paid on your mortgage via a readvanceable HELOC to invest in income-generating assets."
        }
      },
      {
        "@type": "Question",
        "name": "Which mortgages work for the Smith Maneuver?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You require a 'Readvanceable Mortgage' that automatically increases your credit limit as you pay down principal. Examples include the Scotiabank STEP, TD Home Equity FlexLine, BMO Homeowner ReadiLine, and Manulife One."
        }
      },
      {
        "@type": "Question",
        "name": "Is interest on a HELOC tax deductible in Canada?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, provided the borrowed funds are used for the purpose of earning income from a business or property (like stocks, ETFs, or rental real estate). If you use the funds for personal expenses (cars, vacations), the interest is NOT deductible."
        }
      }
    ]
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-24 font-sans text-slate-900">
      <JsonLd data={pageSchema} />
      
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* BREADCRUMBS */}
        <div className="mb-8">
           <Link href="/tools" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition uppercase tracking-widest">
              <ArrowLeft size={12}/> Back to Tools
           </Link>
        </div>

        {/* HERO CONTENT */}
        <div className="max-w-4xl mb-12">
           <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
              Advanced Strategy
           </span>
           <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">
              The Smith Maneuver™ <br/> Calculator.
           </h1>
           <p className="text-xl text-gray-500 font-medium leading-relaxed">
              Stop paying your mortgage with after-tax dollars. This institutional-grade engine models how to convert your "Bad Debt" (Mortgage) into "Good Debt" (Investment Loan) to generate tax refunds and accelerate your net worth.
           </p>
        </div>

        {/* CALCULATOR APP */}
        <div className="mb-24">
           <SmithManeuverCalculator />
        </div>

        {/* INSTITUTIONAL KNOWLEDGE BANK (SEO/AEO) */}
        <div className="grid md:grid-cols-12 gap-16 border-t border-gray-200 pt-24">
            
            {/* LEFT COLUMN: TABLE OF CONTENTS & STICKY NAV (Optional visually, keeps structure clean) */}
            <div className="md:col-span-4 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm sticky top-32">
                    <h3 className="font-black uppercase tracking-widest text-xs text-gray-400 mb-6 flex items-center gap-2">
                        <BookOpen size={14}/> Strategy Guide
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> How it Works
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> The "Plain Jane" vs. Accelerator
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Compatible Mortgage Products
                        </li>
                        <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> CRA Compliance Rules
                        </li>
                    </ul>
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                            <strong>Did you know?</strong> Canadian homeowners have over $2 Trillion in "dead equity" sitting in their homes earning 0% return.
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: RICH CONTENT */}
            <div className="md:col-span-8 space-y-16">
               
               {/* 1. MECHANICS */}
               <section>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-6 text-slate-900">
                     The Mechanics of Debt Conversion
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                     In Canada, interest on your home mortgage is <strong>not tax-deductible</strong>. It is paid with after-tax dollars. However, interest on money borrowed to earn investment income <strong>is 100% tax-deductible</strong>.
                  </p>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                     The Smith Maneuver exploits this by using a <strong>Readvanceable Mortgage</strong>. This is a special product that combines a mortgage and a Home Equity Line of Credit (HELOC).
                  </p>
                  <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
                      <h4 className="font-black uppercase tracking-widest text-xs text-blue-600 mb-4">The Cycle</h4>
                      <ol className="space-y-4">
                          <li className="flex gap-4">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">1</span>
                              <p className="text-sm font-medium text-slate-700 pt-1">You make your regular mortgage payment.</p>
                          </li>
                          <li className="flex gap-4">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">2</span>
                              <p className="text-sm font-medium text-slate-700 pt-1">The bank automatically increases your HELOC limit by the exact amount of principal you just paid off.</p>
                          </li>
                          <li className="flex gap-4">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">3</span>
                              <p className="text-sm font-medium text-slate-700 pt-1">You withdraw that equity immediately and invest it in income-producing assets (stocks, ETFs, REITs).</p>
                          </li>
                          <li className="flex gap-4">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">4</span>
                              <p className="text-sm font-medium text-slate-700 pt-1">At tax time, you deduct the interest on the HELOC loan, generating a large tax refund.</p>
                          </li>
                      </ol>
                  </div>
               </section>

               {/* 2. COMPATIBLE PRODUCTS */}
               <section>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-6 text-slate-900">
                     Required Mortgage Products
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-6">
                     You cannot do this with a standard mortgage. You need a lender that offers automatic readvance. At Indibrick, we work with the following compliant products:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-3 font-bold text-slate-700 shadow-sm">
                          <CheckCircle className="text-green-500" size={18}/> Scotia STEP
                      </div>
                      <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-3 font-bold text-slate-700 shadow-sm">
                          <CheckCircle className="text-green-500" size={18}/> TD Home Equity FlexLine
                      </div>
                      <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-3 font-bold text-slate-700 shadow-sm">
                          <CheckCircle className="text-green-500" size={18}/> Manulife One
                      </div>
                      <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-3 font-bold text-slate-700 shadow-sm">
                          <CheckCircle className="text-green-500" size={18}/> BMO ReadiLine
                      </div>
                  </div>
               </section>

               {/* 3. RISKS & DISCLAIMERS */}
               <section>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-6 text-slate-900">
                     Risk Analysis
                  </h2>
                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <XCircle className="text-red-500 shrink-0 mt-1" size={24}/>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-1">Leverage Risk</h4>
                            <p className="text-sm text-gray-500">If the market drops, your loan balance remains the same. You can lose equity.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <XCircle className="text-red-500 shrink-0 mt-1" size={24}/>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-1">Interest Rate Risk</h4>
                            <p className="text-sm text-gray-500">HELOCs are variable rate products. If Prime rates rise, your cost of borrowing increases, potentially offsetting investment gains.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <XCircle className="text-red-500 shrink-0 mt-1" size={24}/>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-1">Call Risk</h4>
                            <p className="text-sm text-gray-500">Though rare, lenders can technically demand repayment of a HELOC at any time.</p>
                        </div>
                     </div>
                  </div>
               </section>

            </div>
        </div>

        {/* LEAD CAPTURE SECTION (SCROLL TARGET) */}
        <div id="strategy-form" className="mt-32">
            <CalculatorLeadCTA calculatorName="Smith Maneuver Calculator" />
        </div>

      </div>
    </div>
  );
}