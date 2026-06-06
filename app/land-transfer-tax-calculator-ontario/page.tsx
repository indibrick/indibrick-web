import React from 'react';
import LandTransferTaxCalculator from '../../components/LandTransferTaxCalculator';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Ontario Land Transfer Tax Calculator 2026 — Toronto Rebates',
  description: 'Calculate Land Transfer Tax for Ontario and Toronto. Includes First-Time Home Buyer rebates up to $8,475. Accurate for 2026 rates.',
  slug: '/land-transfer-tax-calculator-ontario',
  keywords: ['land transfer tax calculator ontario 2026', 'toronto ltt calculator', 'first time home buyer rebate'],
});

export default function LTTPage() {
  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Land Transfer Tax <br/> Calculator</h1>
        <p className="text-gray-400">Calculate closing costs for Toronto (416) and Ontario for 2026.</p>
      </section>
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl"><LandTransferTaxCalculator /></div>
      </section>
      <section className="py-20 bg-white container mx-auto px-6 max-w-4xl">
         <h2 className="text-3xl font-black mb-6">How Rebates Work in 2026</h2>
         <p className="text-gray-600 mb-10">First-time buyers in Ontario get a rebate up to <strong>$4,000</strong>. If you buy in Toronto, you get an additional rebate of up to <strong>$4,475</strong>, for a total of $8,475 in savings.</p>
         <CalculatorLeadCTA calculatorName="Land Transfer Tax Calculator" />
      </section>
    </div>
  );
}