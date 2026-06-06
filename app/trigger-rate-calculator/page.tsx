import React from 'react';
import TriggerRateCalculator from '../../components/TriggerRateCalculator';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import { AlertTriangle } from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Trigger Rate Calculator for Variable Mortgages',
  description: 'Find out at what interest rate your variable mortgage payments stop covering principal (Negative Amortization risk).',
  slug: '/trigger-rate-calculator',
  keywords: ['trigger rate calculator', 'variable mortgage negative amortization', 'Canada trigger rate'],
});

export default function TriggerRatePage() {
  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 text-center border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-red-400">
            <AlertTriangle size={14} /> Risk Analysis
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Trigger Rate <br /> Analyzer
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Protect yourself from negative amortization. Know your safety line.
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
           <TriggerRateCalculator />
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
           <h2 className="text-3xl font-black mb-6">Hit Your Trigger Rate?</h2>
           <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
             If your current rate is higher than your trigger rate, your principal is growing every month. 
             We can help you refinance to a fixed rate or extend your amortization to lower payments.
           </p>
           <CalculatorLeadCTA calculatorName="Trigger Rate Calculator" />
        </div>
      </section>
    </div>
  );
}