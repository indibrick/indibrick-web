'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, MapPin, CheckCircle, Settings, AlertCircle } from 'lucide-react';

export default function ClosingCostsCalculator() {
  // --- Inputs ---
  const [price, setPrice] = useState(900000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [isToronto, setIsToronto] = useState(true);
  const [isFtb, setIsFtb] = useState(true); // First Time Buyer
  
  // --- Adjustable Estimates (Advanced) ---
  const [legalFees, setLegalFees] = useState(1500);
  const [titleInsurance, setTitleInsurance] = useState(400);
  const [appraisalFee, setAppraisalFee] = useState(300);
  const [homeInspection, setHomeInspection] = useState(500);

  // --- Logic Engine ---
  const results = useMemo(() => {
    // 1. Down Payment
    const downPaymentAmount = Math.round(price * (downPaymentPercent / 100));
    
    // 2. LTT Calculation
    const calculateLTT = (amt: number) => {
      let tax = 0;
      if (amt > 2000000) tax += (amt - 2000000) * 0.025;
      if (amt > 400000) tax += (Math.min(amt, 2000000) - 400000) * 0.020;
      if (amt > 250000) tax += (Math.min(amt, 400000) - 250000) * 0.015;
      if (amt > 55000) tax += (Math.min(amt, 250000) - 55000) * 0.010;
      if (amt > 0) tax += Math.min(amt, 55000) * 0.005;
      return tax;
    };

    const provTax = calculateLTT(price);
    const muniTax = isToronto ? calculateLTT(price) : 0;
    
    // Rebates
    const provRebate = isFtb ? Math.min(provTax, 4000) : 0;
    const muniRebate = (isFtb && isToronto) ? Math.min(muniTax, 4475) : 0;
    
    const finalLTT = (provTax - provRebate) + (muniTax - muniRebate);

    // 3. PST on CMHC (Ontario Specific: 8%)
    // If down payment < 20%, user pays CMHC. PST on that premium is CASH on closing.
    let pstOnCmhc = 0;
    let cmhcPremium = 0;
    if (downPaymentPercent < 20) {
       // Rough estimate of premium rate for calculator speed
       let rate = 0.04; 
       if (downPaymentPercent >= 15) rate = 0.028;
       else if (downPaymentPercent >= 10) rate = 0.031;
       
       const mortgageAmt = price - downPaymentAmount;
       cmhcPremium = mortgageAmt * rate;
       pstOnCmhc = cmhcPremium * 0.08; // 8% Ontario PST
    }

    // 4. Totals
    const totalServices = legalFees + titleInsurance + appraisalFee + homeInspection;
    const totalClosingCosts = finalLTT + totalServices + pstOnCmhc;
    const totalCashRequired = downPaymentAmount + totalClosingCosts;

    // Chart Data
    const chartData = [
      { name: 'Land Transfer Tax', value: finalLTT, color: '#000000' },
      { name: 'Legal & Title', value: legalFees + titleInsurance, color: '#4b5563' },
      { name: 'Other Fees', value: appraisalFee + homeInspection, color: '#9ca3af' },
      { name: 'PST on CMHC', value: pstOnCmhc, color: '#dc2626' } // Red for "Surprise"
    ].filter(d => d.value > 0);

    return {
      downPaymentAmount,
      provTax, muniTax, provRebate, muniRebate,
      finalLTT,
      pstOnCmhc,
      totalClosingCosts,
      totalCashRequired,
      chartData
    };
  }, [price, downPaymentPercent, isToronto, isFtb, legalFees, titleInsurance, appraisalFee, homeInspection]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-black text-white p-8 md:p-10 flex justify-between items-end">
        <div>
           <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Total Cash-to-Close</h3>
           <p className="text-gray-400 text-sm font-medium">Don't get blindsided. Calculate every dollar needed on closing day.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        
        {/* LEFT: Inputs */}
        <div className="w-full lg:w-5/12 p-8 md:p-12 bg-gray-50 border-r border-gray-100 space-y-8">
           
           {/* Primary Inputs */}
           <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Purchase Price</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-4 rounded-xl border-none font-black text-lg shadow-sm focus:ring-2 focus:ring-black outline-none" />
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Down Payment %</label>
                    <input type="number" value={downPaymentPercent} onChange={e => setDownPaymentPercent(Number(e.target.value))} className="w-full p-4 rounded-xl border-none font-bold shadow-sm outline-none" />
                 </div>
                 <div className="flex items-center">
                    <p className="text-xs text-gray-500 font-medium leading-tight">
                       {downPaymentPercent < 20 ? <span className="text-red-600 font-bold">High Ratio (Insured)</span> : <span className="text-green-600 font-bold">Conventional</span>}
                    </p>
                 </div>
              </div>
           </div>

           {/* Toggles */}
           <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm cursor-pointer border border-transparent hover:border-black transition">
                 <span className="text-sm font-bold flex items-center gap-2"><MapPin size={16} /> Property in Toronto (416)</span>
                 <input type="checkbox" checked={isToronto} onChange={e => setIsToronto(e.target.checked)} className="w-5 h-5 text-black rounded" />
              </label>
              <label className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm cursor-pointer border border-transparent hover:border-black transition">
                 <span className="text-sm font-bold flex items-center gap-2"><CheckCircle size={16} /> First-Time Buyer</span>
                 <input type="checkbox" checked={isFtb} onChange={e => setIsFtb(e.target.checked)} className="w-5 h-5 text-black rounded" />
              </label>
           </div>

           {/* Advanced Inputs (Collapsible-ish) */}
           <div className="pt-6 border-t border-gray-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><Settings size={12} /> Service Estimates</p>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[9px] uppercase font-bold text-gray-400">Legal Fees</label>
                    <input type="number" value={legalFees} onChange={e => setLegalFees(Number(e.target.value))} className="w-full p-2 bg-white rounded-lg text-sm font-bold border border-gray-200" />
                 </div>
                 <div>
                    <label className="text-[9px] uppercase font-bold text-gray-400">Title Insurance</label>
                    <input type="number" value={titleInsurance} onChange={e => setTitleInsurance(Number(e.target.value))} className="w-full p-2 bg-white rounded-lg text-sm font-bold border border-gray-200" />
                 </div>
                 <div>
                    <label className="text-[9px] uppercase font-bold text-gray-400">Appraisal</label>
                    <input type="number" value={appraisalFee} onChange={e => setAppraisalFee(Number(e.target.value))} className="w-full p-2 bg-white rounded-lg text-sm font-bold border border-gray-200" />
                 </div>
                 <div>
                    <label className="text-[9px] uppercase font-bold text-gray-400">Home Inspection</label>
                    <input type="number" value={homeInspection} onChange={e => setHomeInspection(Number(e.target.value))} className="w-full p-2 bg-white rounded-lg text-sm font-bold border border-gray-200" />
                 </div>
              </div>
           </div>

        </div>

        {/* RIGHT: Results */}
        <div className="w-full lg:w-7/12 bg-white p-8 md:p-12">
           
           {/* Big Total */}
           <div className="mb-10 text-center lg:text-left">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Cash Required Day of Closing</p>
              <h2 className="text-5xl md:text-6xl font-black text-black tracking-tighter">${results.totalCashRequired.toLocaleString()}</h2>
              <div className="flex gap-4 justify-center lg:justify-start mt-4">
                 <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase text-gray-500">Down Payment: ${results.downPaymentAmount.toLocaleString()}</span>
                 <span className="px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase">Closing Costs: ${results.totalClosingCosts.toLocaleString()}</span>
              </div>
           </div>

           {/* The Breakdown */}
           <div className="grid md:grid-cols-2 gap-8 items-center">
              
              {/* Chart */}
              <div className="h-64 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                          data={results.chartData} 
                          innerRadius={60} 
                          outerRadius={80} 
                          paddingAngle={5} 
                          dataKey="value"
                       >
                          {results.chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Costs</span>
                    <span className="text-xl font-black">${results.totalClosingCosts.toLocaleString()}</span>
                 </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                    <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 bg-black rounded-full"></div> Land Transfer Tax</span>
                    <span>${results.finalLTT.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                    <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 bg-gray-600 rounded-full"></div> Legal & Title</span>
                    <span>${(legalFees + titleInsurance).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                    <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 bg-gray-400 rounded-full"></div> Appraisal/Inspection</span>
                    <span>${(appraisalFee + homeInspection).toLocaleString()}</span>
                 </div>
                 
                 {/* The Hidden Fee Highlight */}
                 {results.pstOnCmhc > 0 && (
                    <div className="flex justify-between items-center text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                       <span className="font-bold flex items-center gap-2 text-red-700">
                          <AlertCircle size={14} /> PST on CMHC
                       </span>
                       <span className="font-bold text-red-700">${Math.round(results.pstOnCmhc).toLocaleString()}</span>
                    </div>
                 )}
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}