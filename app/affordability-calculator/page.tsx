import React from 'react';
import { Metadata } from 'next';
import AffordabilityCalculator from '../../components/AffordabilityCalculator';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import { Wallet, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Home Affordability Calculator: "Max" vs "Safe" | IndiBrick',
  description: 'Determine your true home buying power in Ontario. Compare bank qualification limits against your actual safe monthly budget.',
  keywords: ['affordability calculator', 'how much house can i afford', 'gds tds calculator'],
};

export default function AffordabilityPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: 'IndiBrick Affordability Engine',
    description: 'Calculates maximum mortgage qualification based on income and debts.',
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <section className="bg-black text-white py-20 text-center border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            <Wallet size={14} /> Buying Power
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            How Much House <br /> Can I Afford?
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The bank tells you what they will lend. We tell you what you can actually afford.
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
           <AffordabilityCalculator />
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
           <div className="bg-yellow-50 p-8 rounded-3xl border border-yellow-100 flex gap-6">
              <div className="bg-yellow-400 text-black p-3 rounded-xl h-fit"><Info size={24} /></div>
              <div>
                 <h3 className="font-black text-xl mb-2 text-yellow-900">The "House Poor" Trap</h3>
                 <p className="text-yellow-800/80 leading-relaxed font-medium">
                   Most calculators only show you the Maximum Qualification (GDS/TDS). This ignores your car payments, daycare, and lifestyle. 
                   Our "Safe Budget" number protects your cash flow. Always aim for the green bar, not the black one.
                 </p>
              </div>
           </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 border-t border-gray-100">
         <div className="container mx-auto px-6 max-w-3xl">
            <CalculatorLeadCTA calculatorName="Affordability Calculator" />
         </div>
      </section>
    </div>
  );
}