import React from 'react';
import { Metadata } from 'next';
import MortgageRenewalCalculator from '../../components/MortgageRenewalCalculator';
import LeadForm from '../../components/LeadForm';

export const metadata: Metadata = {
  title: 'Mortgage Renewal Calculator | Compare Rates',
  description: 'Calculate your payment increase at renewal. Compare your bank offer vs. market broker rates.',
};

export default function RenewalPage() {
  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Renewal <br/> Calculator</h1>
      </section>
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl"><MortgageRenewalCalculator /></div>
      </section>
      <section className="py-20 bg-white container mx-auto px-6 max-w-3xl">
         <LeadForm type="Mortgage" title="Switch & Save" subtitle="Don't sign your bank's first offer." />
      </section>
    </div>
  );
}