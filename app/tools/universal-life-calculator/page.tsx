import React from 'react';
import UniversalLifeCalculator from '../../../components/calculators/UniversalLifeCalculator';
import JsonLd from '../../../components/JsonLd';
import CalculatorLeadCTA from '../../../components/CalculatorLeadCTA';
import { TrendingUp, Building2, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { buildMetadata } from '../../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Universal Life Insurance Calculator Canada — Tax-Free Investment Tool',
  description: 'Calculate tax-exempt growth and death benefits with our Universal Life Insurance Calculator. Model Corporate Insured Retirement Plans (IRP) and estate transfer strategies.',
  slug: '/tools/universal-life-calculator',
  keywords: ['Universal Life Insurance Calculator', 'Corporate IRP Calculator', 'Tax Free Investment Canada', 'Cash Value Life Insurance', 'Estate Planning Tool'],
});

export default function ULPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Universal Life Insurance Calculator",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "description": "Calculates the future cash value and death benefit of a Universal Life insurance policy in Canada.",
    "reviewedBy": [
      { "@type": "Person", "name": "Vikas Sharma", "jobTitle": "Investment & Insurance Advisor", "affiliation": { "@type": "Organization", "name": "Dream Home Finance + Life" } },
      { "@type": "Person", "name": "Mudit Chhura", "jobTitle": "Co-Founder", "affiliation": { "@type": "Organization", "name": "Dream Home Finance + Life" } }
    ]
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={pageSchema} />

      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* HERO */}
        <div className="text-center mb-16">
          <span className="bg-blue-50 text-blue-800 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block border border-blue-100">
            Canadian Tax Strategy
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none text-slate-900">
            Universal Life Insurance<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">Investment Calculator.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium leading-relaxed">
            The ultimate tool for high-net-worth investors and business owners. 
            Calculate how to grow wealth <strong>tax-exempt</strong> using the "Save & Compound" strategy.
          </p>
        </div>

        {/* CALCULATOR */}
        <div className="mb-24">
           <UniversalLifeCalculator />
        </div>

        {/* STRATEGY CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 border-t border-gray-100 pt-20">
            <div>
               <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Why the Wealthy Use This</h2>
               <div className="prose prose-lg text-gray-600">
                  <p>
                    In Canada, registered accounts like RRSPs and TFSAs have contribution limits. Once those are full, high-income earners and corporations face high taxes on investment growth (up to 50%+ on interest).
                  </p>
                  <p>
                    <strong>Universal Life Insurance</strong> creates an additional tax-sheltered bucket. It is effectively an "uncapped TFSA" wrapped inside an insurance contract.
                  </p>
               </div>
            </div>

            <div className="bg-gray-50 p-10 rounded-3xl border border-gray-100">
               <h3 className="font-black text-xl uppercase mb-8">How the Strategy Works</h3>
               <div className="space-y-8 relative">
                  <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                  <div className="relative pl-16">
                     <div className="absolute left-0 top-0 w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold z-10">1</div>
                     <h4 className="font-bold text-lg mb-2">Over-Fund the Policy</h4>
                     <p className="text-sm text-gray-600">You contribute more than the minimum insurance cost. The surplus cash goes into the investment fund.</p>
                  </div>
                  <div className="relative pl-16">
                     <div className="absolute left-0 top-0 w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold z-10">2</div>
                     <h4 className="font-bold text-lg mb-2">Compound Tax-Free</h4>
                     <p className="text-sm text-gray-600">The money grows without triggering capital gains taxes.</p>
                  </div>
               </div>
            </div>
        </div>

        {/* CTA */}
        <div className="mt-24">
           <CalculatorLeadCTA calculatorName="Universal Life Calculator" />
        </div>

      </div>
    </div>
  );
}