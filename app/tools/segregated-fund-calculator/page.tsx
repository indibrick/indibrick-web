import React from 'react';
import { Metadata } from 'next';
import SegregatedFundCalculator from '../../../components/calculators/SegregatedFundCalculator';
import JsonLd from '../../../components/JsonLd';
import { Shield, Lock, EyeOff, Gavel, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Segregated Fund Calculator | 75/100 Guarantee & Estate Bypass',
  description: 'Calculate probate savings with Segregated Funds in Ontario. Protect your principal with 100% Death Benefit Guarantees and creditor protection.',
  keywords: ['Segregated Fund Calculator', 'Probate Fees Ontario', '75/100 Guarantee', 'Seg Funds vs Mutual Funds', 'Estate Planning Canada'],
};

export default function SegFundPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the 100/100 Guarantee?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A 100/100 guarantee means 100% of your initial deposit is guaranteed at maturity (usually 15 years) and 100% is guaranteed upon death. Even if the market drops 50%, your beneficiaries receive the full original amount."
        }
      },
      {
        "@type": "Question",
        "name": "How do Segregated Funds bypass probate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Because they are insurance contracts, you can name a beneficiary directly. This allows the funds to flow directly to them upon death, bypassing the estate and the 1.5% Ontario Estate Administration Tax."
        }
      }
    ]
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={faqSchema} />

      {/* HERO */}
      <div className="container mx-auto px-6 max-w-6xl mb-24 text-center">
        <span className="bg-green-100 text-green-800 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block border border-green-200">
          Wealth Preservation
        </span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-none text-slate-900">
          Market Growth.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400">Zero Risk to Principal.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium leading-relaxed">
          Segregated Funds combine the growth potential of mutual funds with the security of insurance. 
          <strong>Guarantee your capital</strong> and bypass the 1.5% probate tax.
        </p>
      </div>

      {/* CALCULATOR SECTION */}
      <div className="container mx-auto px-6 max-w-6xl mb-32">
        <SegregatedFundCalculator />
      </div>

      {/* THREE PILLARS OF PROTECTION */}
      <section className="bg-gray-50 py-24 border-y border-gray-100">
         <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black uppercase tracking-tight mb-4">The 3 Layers of Defense</h2>
               <p className="text-gray-500">Why business owners and HNIs choose Segregated Funds over Mutual Funds.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               {/* 1. ESTATE */}
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                     <Gavel size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase mb-3">Estate Bypass</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                     Avoid the 1.5% Ontario Probate Fee. Funds pay out directly to beneficiaries in approx. 2 weeks, versus 6-12 months for probated assets.
                  </p>
                  <ul className="space-y-2 text-xs font-bold text-gray-500">
                     <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> No Legal Fees</li>
                     <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> No Delays</li>
                  </ul>
               </div>

               {/* 2. CREDITOR */}
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                     <Shield size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase mb-3">Creditor Protection</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                     If you designate a "preferred class" beneficiary (Spouse/Child), your assets are generally protected from creditors in bankruptcy or lawsuits.
                  </p>
                  <ul className="space-y-2 text-xs font-bold text-gray-500">
                     <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Ideal for Business Owners</li>
                     <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Professional Liability Shield</li>
                  </ul>
               </div>

               {/* 3. PRIVACY */}
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center mb-6">
                     <EyeOff size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase mb-3">Total Privacy</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                     Wills are public documents once probated. Segregated fund designations are private contracts between you and the insurer.
                  </p>
                  <ul className="space-y-2 text-xs font-bold text-gray-500">
                     <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> No Public Record</li>
                     <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Confidential Payouts</li>
                  </ul>
               </div>
            </div>
         </div>
      </section>

      {/* THE GUARANTEE EXPLAINED */}
      <section className="py-24 container mx-auto px-6 max-w-5xl">
         <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
               <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Understanding the Guarantee</h2>
               <p className="text-lg text-gray-600 mb-6 font-medium">
                  Unlike Mutual Funds, where you can lose 100% of your money, Segregated Funds place a "floor" under your investment.
               </p>
               
               <div className="space-y-6">
                  <div className="bg-green-50 p-6 rounded-2xl border-l-4 border-green-500">
                     <h4 className="font-black text-green-900 uppercase text-sm mb-2">Death Benefit Guarantee</h4>
                     <p className="text-sm text-green-800">
                        If you pass away and the market is down, your beneficiaries receive the <strong>Guaranteed Amount</strong> (75% or 100% of deposits), not the lower market value.
                     </p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-2xl border-l-4 border-blue-500">
                     <h4 className="font-black text-blue-900 uppercase text-sm mb-2">Maturity Guarantee</h4>
                     <p className="text-sm text-blue-800">
                        If you hold the fund for the contract term (e.g. 15 years) and the market is down, the insurer tops you up to your guaranteed principal.
                     </p>
                  </div>
               </div>
            </div>

            <div className="w-full md:w-1/2 bg-gray-900 text-white p-10 rounded-3xl">
               <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Guarantee Options</h3>
               
               <div className="space-y-8">
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center font-black text-xl shrink-0">75</div>
                     <div>
                        <p className="font-bold text-lg mb-1">The "Growth" Option (75/75)</p>
                        <p className="text-gray-400 text-sm">Lower fees (MER). Guarantees 75% of your capital at death or maturity. Best for long-term growth.</p>
                     </div>
                  </div>
                  
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center font-black text-xl shrink-0">100</div>
                     <div>
                        <p className="font-bold text-lg mb-1 text-yellow-400">The "Estate" Option (100/100)</p>
                        <p className="text-gray-400 text-sm">Higher fees. Guarantees 100% of your capital. If you invest $500k, your family gets at least $500k, period.</p>
                     </div>
                  </div>
               </div>

               <Link href="/contact" className="mt-10 w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                  Talk to an Advisor <ArrowRight size={16}/>
               </Link>
            </div>
         </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="bg-gray-50 py-24 border-t border-gray-100">
         <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-center text-3xl font-black uppercase tracking-tight mb-12">Asset Class Comparison</h2>
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-gray-900 text-white">
                        <th className="p-6 text-xs font-black uppercase tracking-widest">Feature</th>
                        <th className="p-6 text-xs font-black uppercase tracking-widest text-green-400">Segregated Fund</th>
                        <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Mutual Fund</th>
                        <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">GIC</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-600">
                     <tr>
                        <td className="p-6 text-black font-bold">Principal Guarantee</td>
                        <td className="p-6 text-green-600 font-bold">75% - 100%</td>
                        <td className="p-6">0%</td>
                        <td className="p-6">100%</td>
                     </tr>
                     <tr className="bg-gray-50">
                        <td className="p-6 text-black font-bold">Probate Fees</td>
                        <td className="p-6 text-green-600 font-bold">Bypasses (0%)</td>
                        <td className="p-6">Subject to 1.5%</td>
                        <td className="p-6">Subject to 1.5%</td>
                     </tr>
                     <tr>
                        <td className="p-6 text-black font-bold">Creditor Protection</td>
                        <td className="p-6 text-green-600 font-bold">Potential</td>
                        <td className="p-6">No</td>
                        <td className="p-6">No</td>
                     </tr>
                     <tr className="bg-gray-50">
                        <td className="p-6 text-black font-bold">Privacy</td>
                        <td className="p-6 text-green-600 font-bold">100% Private</td>
                        <td className="p-6">Public (Probate)</td>
                        <td className="p-6">Public (Probate)</td>
                     </tr>
                     <tr>
                        <td className="p-6 text-black font-bold">Market Growth</td>
                        <td className="p-6 text-green-600 font-bold">Yes (Equity/Bond)</td>
                        <td className="p-6">Yes</td>
                        <td className="p-6">No (Fixed Low Rate)</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>
      </section>
    </div>
  );
}