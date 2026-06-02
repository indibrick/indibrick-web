import React from 'react';
import Link from 'next/link';
import { ArrowRight, Phone, Lock } from 'lucide-react';

interface Props {
  calculatorName?: string;
}

/**
 * Unified end-of-calculator CTA. Drop-in card (no outer <section>) so it slots into
 * whatever wrapper each calculator already provides. Points to /apply for capture.
 */
export default function CalculatorLeadCTA({ calculatorName }: Props) {
  return (
    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl max-w-3xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3 leading-tight">
        Want a broker to run your actual numbers?
      </h2>
      <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-8">
        Our advisors review your file for free — no hard credit check required.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
        <Link
          href="/apply"
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-center py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/30"
        >
          <ArrowRight size={16} /> Get a Free Review
        </Link>
        <a
          href="tel:+14372416392"
          className="flex-1 bg-white text-slate-900 hover:bg-gray-100 text-center py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition shadow-lg"
        >
          <Phone size={16} /> Call Now
        </a>
      </div>

      <p className="text-[11px] text-gray-500 mt-6 text-center flex items-center justify-center gap-2 font-medium">
        <Lock size={11} /> 256-bit SSL · No hard credit check · Response in &lt; 1 hour
      </p>
      {calculatorName && (
        <p className="text-[10px] text-gray-600 mt-2 text-center font-bold uppercase tracking-widest">
          From the {calculatorName}
        </p>
      )}
    </div>
  );
}
