import React from 'react';
import ClosingCostsCalculator from '../../components/ClosingCostsCalculator';
import CalculatorLeadCTA from '../../components/CalculatorLeadCTA';
import { DollarSign, AlertTriangle, FileText } from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Closing Costs Calculator Ontario 2026 — True Cash Required',
  description: 'Calculate Land Transfer Tax, Legal Fees, and the hidden PST on CMHC insurance for 2026 closings.',
  slug: '/closing-costs-calculator',
  keywords: ['closing costs calculator ontario 2026', 'land transfer tax calculator', 'legal fees buying house'],
});

export default function ClosingCostsPage() {
  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 text-center border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-yellow-400">
            <DollarSign size={14} /> Cash Planning
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Closing Costs <br /> Calculator
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The bank approves the mortgage, but you must bring the cash. Calculate your true "Cash to Close" for 2026.
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
           <ClosingCostsCalculator />
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
           <h2 className="text-3xl font-black text-black mb-8 uppercase tracking-tight">The "Hidden" Costs Explained</h2>
           <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                 <h3 className="text-lg font-black mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-red-600"/> PST on CMHC</h3>
                 <p className="text-sm text-gray-600 leading-relaxed">
                    Most First-Time Buyers miss this. If you put less than 20% down, you need CMHC insurance. The <strong>8% PST</strong> must be paid in cash.
                 </p>
              </div>
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                 <h3 className="text-lg font-black mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-600"/> Adjustments</h3>
                 <p className="text-sm text-gray-600 leading-relaxed">
                    Reimbursing the seller for pre-paid Property Taxes or Utilities. We recommend budgeting <strong>$500 - $1,000</strong>.
                 </p>
              </div>
           </div>
           <div className="mt-12 text-center">
              <CalculatorLeadCTA calculatorName="Closing Costs Calculator" />
           </div>
        </div>
      </section>
    </div>
  );
}