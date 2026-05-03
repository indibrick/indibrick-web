'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, Info, CheckCircle, Home, Briefcase } from 'lucide-react';

export default function HSTRebateCalculator() {
  const [basePrice, setBasePrice] = useState(750000);
  const [propertyUse, setPropertyUse] = useState<'primary' | 'investment'>('primary');

  const analysis = useMemo(() => {
    const price = Number(basePrice) || 0;

    // 1. Calculate Gross HST
    const gstAmount = price * 0.05;
    const pstAmount = price * 0.08;
    const totalGrossHst = gstAmount + pstAmount;

    // 2. Calculate Federal (GST) Rebate
    // 36% of GST up to max $6,300. Phases out completely at $450,000.
    let fedRebate = 0;
    if (price <= 350000) {
      fedRebate = gstAmount * 0.36;
    } else if (price > 350000 && price < 450000) {
      fedRebate = 6300 * ((450000 - price) / 100000);
    } else {
      fedRebate = 0;
    }

    // 3. Calculate Provincial (PST) Rebate (Ontario)
    // 75% of PST up to a maximum of $24,000 (Maxes out at $400k purchase price, but does NOT phase out above it)
    let provRebate = 0;
    if (price <= 400000) {
      provRebate = pstAmount * 0.75;
    } else {
      provRebate = 24000;
    }

    const totalRebate = fedRebate + provRebate;
    const netHst = totalGrossHst - totalRebate;
    const finalPrice = price + netHst;

    return { gstAmount, pstAmount, totalGrossHst, fedRebate, provRebate, totalRebate, netHst, finalPrice };
  }, [basePrice]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
      
      {/* LEFT: INPUTS */}
      <div className="w-full lg:w-5/12 bg-gray-50 p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-gray-200">
         <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600 text-white rounded-xl"><Calculator size={20}/></div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">HST Engine</h3>
         </div>

         <div className="space-y-8">
            <div>
               <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Base Purchase Price (Before Tax)</label>
               <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-lg">$</span>
                  <input 
                     type="number" 
                     value={basePrice} 
                     onChange={e => setBasePrice(Number(e.target.value))} 
                     className="w-full p-4 pl-10 bg-white border border-gray-200 rounded-xl font-black text-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm text-slate-900"
                  />
               </div>
            </div>

            <div>
               <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Intended Property Use</label>
               <div className="flex gap-2">
                  <button 
                     onClick={() => setPropertyUse('primary')}
                     className={`flex-1 py-4 px-2 rounded-xl font-bold text-xs md:text-sm transition flex flex-col items-center justify-center gap-2 border-2 ${propertyUse === 'primary' ? 'bg-blue-50 border-blue-600 text-blue-800' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                     <Home size={20}/> Primary Residence
                  </button>
                  <button 
                     onClick={() => setPropertyUse('investment')}
                     className={`flex-1 py-4 px-2 rounded-xl font-bold text-xs md:text-sm transition flex flex-col items-center justify-center gap-2 border-2 ${propertyUse === 'investment' ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                     <Briefcase size={20}/> Investment / Rental
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* RIGHT: RESULTS */}
      <div className="w-full lg:w-7/12 p-8 md:p-12 bg-white flex flex-col justify-center">
         
         <div className="mb-10 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Final Purchase Price (With Net HST)</p>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">${Math.round(analysis.finalPrice).toLocaleString()}</h2>
         </div>

         <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
               <span className="text-sm font-bold text-slate-600">Base Price</span>
               <span className="font-black text-slate-900">${analysis.finalPrice > 0 ? Number(basePrice).toLocaleString() : '0'}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
               <span className="text-sm font-bold text-slate-600">Gross HST (13%)</span>
               <span className="font-black text-red-500">+ ${Math.round(analysis.totalGrossHst).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
               <span className="text-sm font-bold text-green-800 flex items-center gap-2"><CheckCircle size={16}/> Total HST Rebate</span>
               <span className="font-black text-green-700 text-lg">- ${Math.round(analysis.totalRebate).toLocaleString()}</span>
            </div>
         </div>

         {/* CRITICAL INVESTOR WARNING */}
         {propertyUse === 'investment' ? (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
               <h4 className="font-black uppercase tracking-widest text-[10px] text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle size={14}/> Investor Warning: Cash Required
               </h4>
               <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  Because this is an investment property, builders <strong>will not</strong> credit the ${Math.round(analysis.totalRebate).toLocaleString()} rebate upfront. You must pay the full gross price (${Math.round(basePrice + analysis.totalGrossHst).toLocaleString()}) on closing day, and apply to the CRA for the NRRP rebate after you sign a 1-year lease with a tenant.
               </p>
            </div>
         ) : (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl">
               <h4 className="font-black uppercase tracking-widest text-[10px] text-blue-800 mb-2 flex items-center gap-2">
                  <Info size={14}/> Builder Credit Applied
               </h4>
               <p className="text-xs text-blue-900 font-medium leading-relaxed">
                  As this is your primary residence, the builder will typically assign the ${Math.round(analysis.totalRebate).toLocaleString()} rebate directly to themselves, meaning you only pay the "Net Price" on closing day.
               </p>
            </div>
         )}

      </div>
    </div>
  );
}