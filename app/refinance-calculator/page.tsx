import React from 'react';
import { Metadata } from 'next';
import RefinanceCalculator from '../../components/RefinanceCalculator';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import { CheckCircle, HelpCircle, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Debt Consolidation Calculator Ontario | Mortgage Refinance Tool',
  description: 'Calculate how much you can save by rolling credit cards and loans into your mortgage. Use our Equity Takeout Calculator to lower monthly payments.',
  keywords: ['debt consolidation calculator mortgage', 'refinance to pay off debt', 'equity takeout calculator', 'mortgage refinance ontario', 'lower monthly payments'],
  openGraph: {
    title: 'Stop Overpaying Interest. Consolidate Your Debt.',
    description: 'See exactly how much you save by moving high-interest debt into a lower-rate mortgage.',
    type: 'website',
  },
};

export default function RefinancePage() {
  // AEO: FAQ Schema for Voice Search & AI Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I consolidate credit card debt into my mortgage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, in Canada you can refinance up to 80% of your home\'s value to pay off high-interest debts like credit cards and car loans. This is called an "Equity Takeout" or ETO.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does refinancing for debt hurt my credit score?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Initially, there is a small dip due to the credit check. However, paying off maxed-out credit cards significantly lowers your credit utilization ratio, which usually boosts your score within 30-60 days.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the maximum LTV for a refinance in Ontario?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The maximum Loan-to-Value (LTV) ratio for refinancing in Canada is 80%. You must keep at least 20% equity in your property.'
        }
      }
    ]
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Hero Header */}
      <section className="bg-black text-white py-20 text-center border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-green-400">
            <TrendingUp size={14} /> Wealth Optimizer
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Debt Consolidation <br /> Calculator
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stop paying 19% interest. Use your home equity to slash your monthly payments by up to 60%.
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
           <RefinanceCalculator />
        </div>
      </section>

      {/* GEO: Authoritative Content Block */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
           <div className="mb-16">
              <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">The "Bad Debt to Good Debt" Strategy</h2>
              <div className="prose prose-lg text-gray-600">
                <p className="mb-6">
                  Many homeowners sit on hundreds of thousands in equity while struggling with cash flow due to high-interest debt. 
                  Refinancing isn't just about getting a lower rate; it's about <strong>restructuring your liabilities</strong>.
                </p>
                <p>
                  By rolling a $20,000 credit card (at 19.99%) into your mortgage (at ~5.29%), you effectively convert "Bad Debt" (non-tax deductible, high interest) 
                  into "Secured Debt" (lowest possible interest).
                </p>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-12">
              <div>
                 <h3 className="text-xl font-black mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-green-600"/> Why Consolidate?</h3>
                 <ul className="space-y-4 text-sm text-gray-600 font-medium">
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span> Single monthly payment vs. multiple bills.</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span> Improve credit score by lowering utilization.</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span> Free up cash flow for investments.</li>
                 </ul>
              </div>
              <div>
                 <h3 className="text-xl font-black mb-4 flex items-center gap-2"><HelpCircle size={20} className="text-blue-600"/> Key Rules (Canada)</h3>
                 <ul className="space-y-4 text-sm text-gray-600 font-medium">
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span> <strong>Max 80% LTV:</strong> You can only pull equity up to 80% of value.</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span> <strong>Stress Test:</strong> You must requalify at the stress test rate (Rate + 2%).</li>
                    <li className="flex gap-3"><span className="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0"></span> <strong>Penalty:</strong> Check if your current mortgage has a breakage penalty.</li>
                 </ul>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
         <div className="container mx-auto px-6 max-w-3xl text-center">
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Ready to access your equity?</h2>
            <p className="text-gray-500 mb-10">
               We can often capitalize (add) the penalty into the new loan so you pay nothing out of pocket.
            </p>
            <CalculatorLeadCTA calculatorName="Refinance Calculator" />
         </div>
      </section>
    </div>
  );
}