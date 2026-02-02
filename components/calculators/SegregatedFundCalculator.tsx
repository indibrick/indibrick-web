'use client';

import React, { useState } from 'react';
import LeadForm from '../LeadForm';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

export default function SegregatedFundCalculator() {
  // --- INPUTS ---
  const [initialInvestment, setInitialInvestment] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [years, setYears] = useState(20);
  const [returnRate, setReturnRate] = useState(6);
  const [guaranteeType, setGuaranteeType] = useState<'75/75' | '100/100'>('100/100');

  // --- CONSTANTS ---
  const PROBATE_RATE = 1.5; // Ontario Estate Admin Tax (1.5%)
  
  // Fees (MER)
  // Mutual Funds avg ~2.0%
  // Seg Funds avg ~2.5% (The cost of the guarantee)
  const MF_MER = 2.0;
  const SEG_MER = guaranteeType === '100/100' ? 2.8 : 2.4; // Higher fee for 100% guarantee

  // --- CALCULATIONS ---
  // 1. Total Cash Invested (Principal)
  const totalPrincipal = initialInvestment + (monthlyContribution * 12 * years);

  // 2. Guaranteed Minimum (The Safety Net)
  const guaranteeRatio = guaranteeType === '100/100' ? 1.0 : 0.75;
  const guaranteedAmount = totalPrincipal * guaranteeRatio;

  // 3. Future Value Logic (Compound Interest with Monthly Contributions)
  const calculateFV = (principal: number, monthly: number, rate: number, years: number, mer: number) => {
    const netRate = (rate - mer) / 100;
    const monthlyRate = netRate / 12;
    const numMonths = years * 12;

    // FV of Lump Sum
    const fvLump = principal * Math.pow(1 + monthlyRate, numMonths);
    
    // FV of Contributions: PMT * [((1 + r)^n - 1) / r]
    const fvMonthly = monthly * ((Math.pow(1 + monthlyRate, numMonths) - 1) / monthlyRate);

    return fvLump + fvMonthly;
  };

  // Values
  const mfValue = calculateFV(initialInvestment, monthlyContribution, returnRate, years, MF_MER);
  const segValue = calculateFV(initialInvestment, monthlyContribution, returnRate, years, SEG_MER);

  // 4. Estate Impact
  const probateLoss = mfValue * (PROBATE_RATE / 100);
  const mfNetEstate = mfValue - probateLoss;
  
  // Seg Fund: Higher of Market Value OR Guarantee (Bypasses Probate)
  const segNetEstate = Math.max(segValue, guaranteedAmount);

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
       {/* HEADER */}
       <div className="bg-gray-900 text-white p-8 md:p-10 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Estate Value Calculator</h2>
          <p className="text-gray-400">See the difference between a <span className="text-red-400">Taxable Mutual Fund</span> and a <span className="text-green-400">Guaranteed Segregated Fund</span>.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* LEFT: INPUTS (Cleaner Layout) */}
          <div className="lg:col-span-5 p-8 md:p-10 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col gap-8">
             
             {/* Guarantee Toggle */}
             <div>
               <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Select Protection Level</label>
               <div className="bg-white p-1 rounded-xl flex font-bold text-sm shadow-sm border border-gray-200">
                 <button 
                   onClick={() => setGuaranteeType('75/75')}
                   className={`flex-1 py-3 rounded-lg transition-all ${guaranteeType === '75/75' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                   75% Guarantee
                 </button>
                 <button 
                   onClick={() => setGuaranteeType('100/100')}
                   className={`flex-1 py-3 rounded-lg transition-all ${guaranteeType === '100/100' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                 >
                   100% Guarantee
                 </button>
               </div>
             </div>

             {/* Investment Inputs */}
             <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Lump Sum Deposit</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-4 top-4 text-gray-400" />
                      <input 
                        type="number" 
                        value={initialInvestment} 
                        onChange={(e) => setInitialInvestment(Number(e.target.value))}
                        className="w-full pl-10 p-3 bg-white rounded-xl border border-gray-200 font-bold focus:ring-2 ring-black outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Monthly Contribution</label>
                    <div className="relative">
                       <DollarSign size={16} className="absolute left-4 top-4 text-gray-400" />
                       <input 
                        type="number" 
                        value={monthlyContribution} 
                        onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                        className="w-full pl-10 p-3 bg-white rounded-xl border border-gray-200 font-bold focus:ring-2 ring-black outline-none transition"
                       />
                    </div>
                  </div>
                </div>

                {/* Sliders */}
                <div>
                   <div className="flex justify-between mb-2">
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Time Horizon</span>
                     <span className="font-bold">{years} Years</span>
                   </div>
                   <input 
                     type="range" min="5" max="40" 
                     value={years} onChange={(e) => setYears(Number(e.target.value))}
                     className="w-full accent-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                   />
                </div>
                <div>
                   <div className="flex justify-between mb-2">
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Est. Return</span>
                     <span className="font-bold">{returnRate}%</span>
                   </div>
                   <input 
                     type="range" min="2" max="12" step="0.5"
                     value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))}
                     className="w-full accent-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                   />
                </div>
             </div>

             {/* Dynamic Guarantee Badge */}
             <div className="mt-auto bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                   <ShieldCheck className="text-blue-600" size={24} />
                   <h4 className="font-black text-blue-900 uppercase text-sm">Your Safety Net</h4>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed mb-3">
                   Regardless of market performance, your beneficiaries are contractually guaranteed to receive at least:
                </p>
                <p className="text-2xl font-black text-blue-600">${guaranteedAmount.toLocaleString()}</p>
             </div>
          </div>

          {/* RIGHT: RESULTS (The "Aha!" Moment) */}
          <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-center gap-8 bg-white">
             
             {/* 1. THE LOSS (Mutual Fund) */}
             <div className="relative group">
                <div className="absolute inset-0 bg-red-50 rounded-3xl transform rotate-1 group-hover:rotate-0 transition duration-500"></div>
                <div className="relative bg-white border border-red-100 p-8 rounded-3xl shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={24}/></div>
                         <div>
                            <h3 className="font-black text-lg text-gray-900">Mutual Fund</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Probate Exposure</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Fee Lost to Gov</p>
                         <p className="text-3xl font-black text-red-500">-${probateLoss.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                      </div>
                   </div>
                   <p className="text-sm text-gray-500">
                      Your estate loses <strong>~1.5%</strong> of the total asset value to probate fees, plus potential legal delays of 6-12 months.
                   </p>
                </div>
             </div>

             {/* 2. THE WIN (Seg Fund) */}
             <div className="relative group">
                <div className="absolute inset-0 bg-green-50 rounded-3xl transform -rotate-1 group-hover:rotate-0 transition duration-500"></div>
                <div className="relative bg-black text-white p-8 rounded-3xl shadow-xl overflow-hidden">
                   {/* Background Glow */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 blur-3xl rounded-full -mr-16 -mt-16"></div>
                   
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500 text-white rounded-xl"><Lock size={24}/></div>
                            <div>
                               <h3 className="font-black text-xl">Segregated Fund</h3>
                               <p className="text-xs text-green-400 font-bold uppercase tracking-wider">100% Protected</p>
                            </div>
                         </div>
                      </div>

                      <div className="mb-6">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Estate Value (Net)</p>
                         <p className="text-5xl md:text-6xl font-black text-white tracking-tight">
                            ${segNetEstate.toLocaleString(undefined, {maximumFractionDigits:0})}
                         </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                         <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-400" />
                            <span className="text-sm font-bold text-gray-300">0% Probate Fees</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-400" />
                            <span className="text-sm font-bold text-gray-300">Paid in ~2 Weeks</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Lead Form Trigger */}
             <div className="text-center mt-4">
               <p className="text-xs text-gray-400 mb-4">
                 *Values are estimates based on {returnRate}% return and standard MERs. Mutual fund probate fees based on Ontario rates.
               </p>
               <LeadForm type="Insurance" title="Get Your Official Illustration" subtitle="See the exact fund codes and historical performance." />
             </div>

          </div>
       </div>
    </div>
  );
}