import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Sun, ShieldCheck, DollarSign, Home, Heart, 
  CheckCircle, HelpCircle, ArrowRight, BrainCircuit 
} from 'lucide-react';
import JsonLd from '../../components/JsonLd';
import LeadForm from '../../components/LeadForm';
import ReverseMortgageCalculator from '../../components/calculators/ReverseMortgageCalculator';

export const metadata: Metadata = {
  title: 'Reverse Mortgage Calculator Ontario (55+) | Indibrick',
  description: 'Calculate your tax-free cash eligibility. Access up to 55% of your home\'s value with no monthly payments. Safe, secure, and regulated.',
  keywords: ['Reverse Mortgage Calculator', 'CHIP Reverse Mortgage Ontario', 'Senior Home Equity Loan', 'No Monthly Payment Mortgage'],
};

export default function ReverseMortgagePage() {
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        "name": "Do I lose ownership of my home with a reverse mortgage?",
        "acceptedAnswer": { "@type": "Answer", "text": "No. You remain the owner of your home..." }
      }
    ]
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={faqSchema} />

      {/* --- 1. HERO SECTION (With Calculator) --- */}
      <section className="relative pt-32 pb-24 px-6 bg-[#FFF8F0] overflow-hidden">
        <div className="container mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center relative z-10">
          
          {/* Left: Sales Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
               <Sun size={14} /> For Homeowners 55+
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-[0.95] tracking-tight">
              Your Home is <br/> 
              <span className="text-orange-500">Your Pension.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">
              Access up to 55% of your home's value in <strong>Tax-Free Cash</strong>. 
              No monthly payments. No selling. Stay in the home you love.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#quote" className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-xl">
                 Get Official Quote <ArrowRight size={14} />
              </a>
              <Link href="/contact" className="bg-white border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                 Talk to Advisor
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm font-bold text-gray-500">
               <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-600"/> Regulated by Canadian Banks</span>
               <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-600"/> No Negative Equity Guarantee</span>
            </div>
          </div>
          
          {/* Right: The Gamified Calculator */}
          <div className="relative">
             <div className="absolute inset-0 bg-orange-200 rounded-[3rem] blur-3xl opacity-30"></div>
             <ReverseMortgageCalculator />
          </div>

        </div>
      </section>

      {/* --- 2. BENEFITS GRID --- */}
      <section className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">Why Reverse Mortgage?</h2>
               <p className="text-gray-500 mt-4">The smartest way to fund retirement for asset-rich Canadians.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900">
                     <DollarSign size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">100% Tax-Free</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                     The money is a loan advance, not income. It is <strong>not taxable</strong> and does not affect your OAS or GIS benefits.
                  </p>
               </div>
               
               <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900">
                     <Home size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">No Monthly Payments</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                     You are not required to make mortgage payments (principal or interest) for as long as you live in the home.
                  </p>
               </div>

               <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900">
                     <Heart size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">Stay in Control</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                     You maintain title and ownership. You can sell at any time. You never owe more than the home's value.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* --- 3. HOW IT WORKS --- */}
      <section className="py-24 px-6 bg-slate-900 text-white">
         <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-4xl font-black uppercase tracking-tight mb-8">How it Works</h2>
                  <div className="space-y-8">
                     <div className="flex gap-6">
                        <span className="text-6xl font-black text-white/10">1</span>
                        <div>
                           <h4 className="text-xl font-bold mb-2 text-white">Qualification</h4>
                           <p className="text-gray-400 text-sm">You must be 55+ and own your home. The amount you qualify for depends on your age, home value, and location.</p>
                        </div>
                     </div>
                     <div className="flex gap-6">
                        <span className="text-6xl font-black text-white/10">2</span>
                        <div>
                           <h4 className="text-xl font-bold mb-2 text-white">Receive Funds</h4>
                           <p className="text-gray-400 text-sm">Take the money as a lump sum, monthly income, or a line of credit. Use it to pay off debts, renovate, or gift to children.</p>
                        </div>
                     </div>
                     <div className="flex gap-6">
                        <span className="text-6xl font-black text-white/10">3</span>
                        <div>
                           <h4 className="text-xl font-bold mb-2 text-white">Enjoy Life</h4>
                           <p className="text-gray-400 text-sm">Make no payments. Interest accrues quietly in the background. Repay only when you move or sell.</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                     <CheckCircle className="text-green-500"/> Popular Uses
                  </h3>
                  <ul className="space-y-4">
                     {['Pay off existing mortgage & debts', 'Home renovations (Accessibility)', 'Help children buy their first home', 'Travel and healthcare expenses', 'Supplement monthly pension income'].map((use, i) => (
                        <li key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl text-sm font-bold text-gray-300">
                           <CheckCircle size={16} className="text-orange-500 shrink-0"/> {use}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </div>
      </section>

      {/* --- 4. FAQ --- */}
      <section className="py-24 px-6 bg-white border-b border-gray-100">
         <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
               <HelpCircle size={40} className="mx-auto text-slate-900 mb-4" />
               <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Common Concerns</h2>
            </div>
            <div className="space-y-4">
               <details className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer">
                  <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                     Will the bank take my house?
                     <span className="text-gray-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                     Absolutely not. You remain the owner. The bank simply registers a mortgage against the property, just like a regular loan. You cannot be forced to move as long as you maintain the property and pay your property taxes.
                  </p>
               </details>
               <details className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer">
                  <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                     What if my spouse is under 55?
                     <span className="text-gray-400 transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                     Both homeowners must typically be on title. If one spouse is under 55, you may still qualify, but the amount you can borrow will be based on the age of the younger spouse.
                  </p>
               </details>
            </div>
         </div>
      </section>

      {/* --- 5. BOTTOM CTA: LEAD FORM --- */}
      <section id="quote" className="py-24 px-6 bg-orange-50">
         <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
               <div className="text-center mb-10">
                  <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Get Your Official Quote</h2>
                  <p className="text-gray-500">
                     Prefer to speak to someone? Fill out this form for a confidential call.
                  </p>
               </div>
               <LeadForm type="Reverse Mortgage" title="Check Eligibility" subtitle="No obligation. Confidential." />
            </div>
         </div>
      </section>

    </div>
  );
}