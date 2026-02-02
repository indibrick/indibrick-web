import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { 
  TrendingDown, Shield, AlertTriangle, CheckCircle, 
  Banknote, Landmark, Percent, Lock, HelpCircle, ChevronDown, Activity 
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// --- 1. SETUP & FETCHING LOGIC ---
export const revalidate = 60; // Re-fetch data every 60 seconds

export const metadata: Metadata = {
  title: 'Lowest Mortgage Rates Ontario | Live Rate Matrix',
  description: 'Compare our exclusive wholesale rates against the Big 5 Banks. We consistently beat TD, RBC, and Scotiabank by up to 1.50%. Bad credit & private options available.',
  keywords: ['Mortgage Rates Ontario', 'Best Mortgage Rates 2026', 'Private Mortgage Lenders', 'B Lender Rates', 'Lowest 5 Year Fixed'],
};

// Fallback rates in case DB is empty (Safety Net)
const DEFAULT_RATES = {
  insured_variable_5yr: '3.39',
  insured_fixed_5yr: '3.79',
  insured_fixed_3yr: '4.09',
  uninsured_fixed_5yr: '4.39',
  uninsured_variable_5yr: '4.59',
  b_lender: '4.79',
  private_1st: '5.49',
  second_mortgage: '4.99'
};

// Server-Side Fetch Function
async function getLiveRates() {
  try {
    const docRef = doc(db, 'site_settings', 'mortgage_rates');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_RATES, ...docSnap.data() };
    }
  } catch (e) {
    console.error("⚠️ Failed to fetch rates, using defaults:", e);
  }
  return DEFAULT_RATES;
}

// Helper to calculate savings (Bank Rate - Our Rate)
const calcSave = (bankRate: number, ourRateStr: string) => {
  const ourRate = parseFloat(ourRateStr);
  if (isNaN(ourRate)) return "0.00";
  return (bankRate - ourRate).toFixed(2);
};


// --- 2. THE COMPONENT ---

export default async function RatesPage() {
  const rates = await getLiveRates();

  // Benchmarks for Big 5 Banks (You can update these manually here if Banks shift drastically)
  const BENCHMARKS = {
    insured_var: 6.10,
    insured_fix: 4.84,
    insured_3yr: 5.15,
    uninsured_fix: 5.34,
    uninsured_var: 6.35
  };

  const ratesSchema = {
    "@context": "https://schema.org",
    "@type": "Table",
    "about": "IndiBrick Live Rate Matrix",
    "mainEntity": [
      { "@type": "FinancialProduct", "name": "5-Year Variable (Insured)", "interestRate": rates.insured_variable_5yr, "provider": "IndiBrick Exclusive" },
      { "@type": "FinancialProduct", "name": "5-Year Fixed (Insured)", "interestRate": rates.insured_fixed_5yr, "provider": "IndiBrick Exclusive" },
      { "@type": "FinancialProduct", "name": "Private 1st Mortgage", "interestRate": rates.private_1st, "provider": "IndiBrick Private" }
    ]
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={ratesSchema} />

      {/* --- HERO SECTION --- */}
      <div className="container mx-auto px-6 max-w-7xl mb-16">
         <div className="text-center max-w-4xl mx-auto">
            <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block border border-blue-100">
               Live Rate Matrix • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-slate-900 leading-[0.9]">
               Stop Overpaying <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">The Banks.</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed mb-12">
               We compare 40+ wholesale lenders to find "Status Pricing" that isn't available at your local branch.
            </p>
         </div>

         {/* --- 1. THE LIVE RATE MATRIX --- */}
         <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl overflow-hidden mb-24">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 md:p-10 flex flex-col md:flex-row justify-between items-end gap-6">
               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-2 flex items-center gap-3">
                     <Activity className="text-green-400" /> Prime Rates
                  </h2>
                  <p className="text-gray-400 text-sm font-medium">Comparing "Big 5" Posted Rates vs. IndiBrick Exclusive Channels.</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Lowest Insured Rate</p>
                  <p className="text-5xl font-black text-green-400">{rates.insured_variable_5yr}%<span className="text-lg text-gray-500 align-top">*</span></p>
               </div>
            </div>

            {/* THE TABLE */}
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Term / Product</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">Big 5 Bank Avg</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-blue-600">IndiBrick Rate</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-green-600">Your Savings</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     
                     {/* GROUP 1: INSURED (High Ratio) */}
                     <tr className="bg-blue-50/30">
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Percent size={18}/></div>
                              <div>
                                 <p className="font-bold text-slate-900">5-Year Variable</p>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-wider">Insured (Default)</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6 hidden md:table-cell">
                           <span className="text-gray-400 line-through decoration-red-400 decoration-2 font-medium">{BENCHMARKS.insured_var.toFixed(2)}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-2xl font-black text-blue-600">{rates.insured_variable_5yr}%</span>
                        </td>
                        <td className="p-6">
                           <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                              <TrendingDown size={12}/> -{calcSave(BENCHMARKS.insured_var, rates.insured_variable_5yr)}%
                           </span>
                        </td>
                        <td className="p-6">
                           <a href="#apply" className="text-xs font-black uppercase tracking-widest hover:underline">Apply</a>
                        </td>
                     </tr>

                     <tr className="hover:bg-gray-50 transition">
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Shield size={18}/></div>
                              <div>
                                 <p className="font-bold text-slate-900">5-Year Fixed</p>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-wider">Insured</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6 hidden md:table-cell">
                           <span className="text-gray-400 line-through font-medium">{BENCHMARKS.insured_fix.toFixed(2)}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-2xl font-black text-slate-900">{rates.insured_fixed_5yr}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-xs font-bold text-green-600">-{calcSave(BENCHMARKS.insured_fix, rates.insured_fixed_5yr)}%</span>
                        </td>
                        <td className="p-6"><a href="#apply" className="text-xs font-black uppercase tracking-widest hover:underline">Apply</a></td>
                     </tr>

                     <tr className="hover:bg-gray-50 transition">
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Shield size={18}/></div>
                              <div>
                                 <p className="font-bold text-slate-900">3-Year Fixed</p>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-wider">Insured</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6 hidden md:table-cell">
                           <span className="text-gray-400 line-through font-medium">{BENCHMARKS.insured_3yr.toFixed(2)}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-2xl font-black text-slate-900">{rates.insured_fixed_3yr}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-xs font-bold text-green-600">-{calcSave(BENCHMARKS.insured_3yr, rates.insured_fixed_3yr)}%</span>
                        </td>
                        <td className="p-6"><a href="#apply" className="text-xs font-black uppercase tracking-widest hover:underline">Apply</a></td>
                     </tr>

                     {/* GROUP 2: UNINSURED (Conventional) */}
                     <tr className="bg-gray-50/50">
                        <td colSpan={5} className="p-2 px-6 text-[9px] font-black uppercase tracking-widest text-gray-400">
                           Uninsured / 30-Year Amortization
                        </td>
                     </tr>

                     <tr className="hover:bg-gray-50 transition">
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Landmark size={18}/></div>
                              <div>
                                 <p className="font-bold text-slate-900">5-Year Fixed</p>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-wider">Uninsured</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6 hidden md:table-cell">
                           <span className="text-gray-400 line-through font-medium">{BENCHMARKS.uninsured_fix.toFixed(2)}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-2xl font-black text-slate-900">{rates.uninsured_fixed_5yr}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-xs font-bold text-green-600">-{calcSave(BENCHMARKS.uninsured_fix, rates.uninsured_fixed_5yr)}%</span>
                        </td>
                        <td className="p-6"><a href="#apply" className="text-xs font-black uppercase tracking-widest hover:underline">Apply</a></td>
                     </tr>

                     <tr className="hover:bg-gray-50 transition">
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="bg-gray-100 p-2 rounded-lg text-gray-500"><Landmark size={18}/></div>
                              <div>
                                 <p className="font-bold text-slate-900">5-Year Variable</p>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-wider">Uninsured</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6 hidden md:table-cell">
                           <span className="text-gray-400 line-through font-medium">{BENCHMARKS.uninsured_var.toFixed(2)}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-2xl font-black text-slate-900">{rates.uninsured_variable_5yr}%</span>
                        </td>
                        <td className="p-6">
                           <span className="text-xs font-bold text-green-600">-{calcSave(BENCHMARKS.uninsured_var, rates.uninsured_variable_5yr)}%</span>
                        </td>
                        <td className="p-6"><a href="#apply" className="text-xs font-black uppercase tracking-widest hover:underline">Apply</a></td>
                     </tr>
                  </tbody>
               </table>
            </div>
            <div className="bg-gray-50 p-4 text-center border-t border-gray-200">
               <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                  *Comparison based on Big 5 Bank Posted Rates vs IndiBrick Exclusive Partner Rates. Updated Daily.
               </p>
            </div>
         </div>

         {/* --- 2. ALTERNATIVE LENDING (Refined Psychology) --- */}
         <div className="mb-24">
             <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
               <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={24}/></div>
               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">Flexible Solutions</h2>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Business for Self • Credit Repair • Asset Based</p>
               </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               
               {/* CARD 1: B-LENDER */}
               <div className="bg-white border border-gray-200 rounded-[2rem] p-8 hover:shadow-xl transition group">
                  <div className="flex justify-between items-start mb-6">
                     <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        Alternative "B"
                     </span>
                     <Shield size={24} className="text-gray-300 group-hover:text-orange-500 transition"/>
                  </div>
                  <div className="mb-6">
                     <span className="text-5xl font-black text-slate-900">{rates.b_lender}%</span>
                     <span className="text-lg font-bold text-gray-400">*</span>
                  </div>
                  <h3 className="text-lg font-bold mb-4">"Story Over Score"</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-8">
                     Banks rely on algorithms; we rely on common sense. Perfect for entrepreneurs with strong cash flow but low taxable income, or those recovering from life events.
                  </p>
                  <ul className="space-y-3 mb-8">
                     <li className="text-xs font-bold text-gray-600 flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500"/> Extended Income Ratios
                     </li>
                     <li className="text-xs font-bold text-gray-600 flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500"/> 12-Month "Credit Rehab" Plan
                     </li>
                  </ul>
                  <Link href="/bad-credit-private-mortgages" className="block text-center bg-gray-50 hover:bg-black hover:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                     Check Eligibility
                  </Link>
               </div>

               {/* CARD 2: PRIVATE 1ST */}
               <div className="bg-slate-900 text-white border border-slate-800 rounded-[2rem] p-8 hover:shadow-xl transition group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                     <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        Private Capital
                     </span>
                     <Lock size={24} className="text-gray-500 group-hover:text-blue-400 transition"/>
                  </div>
                  <div className="mb-6 relative z-10">
                     <span className="text-5xl font-black">{rates.private_1st}%</span>
                     <span className="text-lg font-bold text-gray-500">*</span>
                  </div>
                  <h3 className="text-lg font-bold mb-4 relative z-10">Asset-Based Approval</h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-8 relative z-10">
                     We prioritize the equity in your property over traditional income documents. Ideal for bridge financing, quick acquisitions, or irregular income streams.
                  </p>
                  <ul className="space-y-3 mb-8 relative z-10">
                     <li className="text-xs font-bold text-gray-300 flex items-center gap-2">
                        <CheckCircle size={14} className="text-blue-500"/> Lenient Income Requirements
                     </li>
                     <li className="text-xs font-bold text-gray-300 flex items-center gap-2">
                        <CheckCircle size={14} className="text-blue-500"/> Fast & Flexible Terms
                     </li>
                  </ul>
                  <Link href="/bad-credit-private-mortgages" className="block text-center bg-white/10 hover:bg-white hover:text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition relative z-10">
                     View Options
                  </Link>
               </div>

               {/* CARD 3: SECOND MORTGAGE */}
               <div className="bg-white border border-gray-200 rounded-[2rem] p-8 hover:shadow-xl transition group">
                  <div className="flex justify-between items-start mb-6">
                     <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        2nd Mortgage
                     </span>
                     <Banknote size={24} className="text-gray-300 group-hover:text-green-500 transition"/>
                  </div>
                  <div className="mb-6">
                     <span className="text-5xl font-black text-slate-900">{rates.second_mortgage}%</span>
                     <span className="text-lg font-bold text-gray-400">*</span>
                  </div>
                  <h3 className="text-lg font-bold mb-4">Unlock Equity</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-8">
                     Keep your existing low-rate mortgage and add a second line for renovations, debt consolidation, or business capital.
                  </p>
                  <ul className="space-y-3 mb-8">
                     <li className="text-xs font-bold text-gray-600 flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Up to 85% LTV</li>
                     <li className="text-xs font-bold text-gray-600 flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Interest-Only Options</li>
                  </ul>
                  <Link href="/bad-credit-private-mortgages" className="block text-center bg-gray-50 hover:bg-black hover:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                     Unlock Cash
                  </Link>
               </div>

            </div>
         </div>

         {/* --- 3. AEO CONTENT (VOICE SEARCH) --- */}
         <div className="grid md:grid-cols-2 gap-16 items-start mb-24">
            <div>
               <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Rate Strategy</h2>
               <p className="text-gray-500 leading-relaxed mb-8">
                  The lowest rate isn't always the best mortgage. Penalties, portability, and restriction clauses can cost you thousands. We strip away the marketing fluff to find the true cost of borrowing.
               </p>
               <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h4 className="font-black text-blue-900 uppercase tracking-wide text-xs mb-2">IndiBrick Insider Tip:</h4>
                  <p className="text-sm text-blue-800">
                     <strong>Variable vs Fixed 2026:</strong> With the Prime Rate holding at 4.45%, the spread between our {rates.insured_variable_5yr}% Variable and Fixed rates is historic. This suggests a unique opportunity for borrowers to ride the rate curve down.
                  </p>
               </div>
            </div>

            <div className="space-y-4">
               <details className="group bg-white p-6 rounded-2xl border border-gray-100 cursor-pointer shadow-sm">
                  <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                     Why is the B-Lender rate higher?
                     <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                     B-Lenders (Alternative Lenders) take on higher risk by accepting clients with bruised credit or self-employed income that isn't fully declared on taxes. The rate premium ({rates.b_lender}% vs {rates.insured_variable_5yr}%) acts as insurance for the lender.
                  </p>
               </details>
               <details className="group bg-white p-6 rounded-2xl border border-gray-100 cursor-pointer shadow-sm">
                  <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none">
                     How fast can a Private Mortgage close?
                     <span className="transition group-open:rotate-180"><ChevronDown size={16}/></span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                     Extremely fast. Because Private Lenders focus on the property value (Equity) rather than your income documents, we can often issue a commitment letter in 24 hours and fund the deal in as little as 3-5 business days.
                  </p>
               </details>
            </div>
         </div>

         {/* --- 4. CTA SECTION --- */}
         <div id="apply" className="bg-black text-white rounded-[3rem] p-12 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-20" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
             <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Lock Your Rate.</h2>
                <p className="text-gray-400 mb-10">
                   Rates change daily. Submit a pre-approval request to hold this {rates.insured_variable_5yr}% rate for 120 days while you shop.
                </p>
                <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl">
                   <LeadForm type="Rate Hold" title="Secure Rate Hold" subtitle="No credit check required for estimate." />
                </div>
             </div>
         </div>

         <p className="mt-12 text-[10px] text-gray-400 text-center max-w-4xl mx-auto leading-relaxed">
            *Rates shown are for informational purposes only and subject to change without notice. 
            <strong>{rates.insured_variable_5yr}% Variable</strong> applies to High-Ratio (Insured) mortgages with less than 20% down payment, 5-year term. 
            <strong>{rates.b_lender}% B-Lender</strong> rate requires 20% down payment and 1% lender fee. 
            <strong>{rates.private_1st}% Private</strong> rate is interest-only, based on 65% LTV, 1-year term. 
            APR (Annual Percentage Rate) will vary based on fees and term length.
         </p>

      </div>
    </div>
  );
}