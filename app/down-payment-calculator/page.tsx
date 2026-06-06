import React from 'react';
import DownPaymentCalculator from '../../components/DownPaymentCalculator';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Down Payment Calculator Canada — CMHC Insurance Rates',
  description: 'Calculate minimum down payment requirements (5% vs 20%) and estimate CMHC mortgage default insurance premiums.',
  slug: '/down-payment-calculator',
  keywords: ['down payment calculator', 'CMHC insurance calculator', 'minimum down payment Canada'],
});

export default function DownPaymentPage() {
  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Down Payment <br/> Calculator</h1>
      </section>
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl"><DownPaymentCalculator /></div>
      </section>
      <section className="py-20 bg-white container mx-auto px-6 max-w-3xl">
         <CalculatorLeadCTA calculatorName="Down Payment Calculator" />
      </section>
    </div>
  );
}