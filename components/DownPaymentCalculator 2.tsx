'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function DownPaymentCalculator() {
  const [price, setPrice] = useState(650000);
  const [userDownPayment, setUserDownPayment] = useState(0);

  const analysis = useMemo(() => {
    // 1. Calculate Minimum Required
    let minDown = 0;
    if (price <= 500000) minDown = price * 0.05;
    else if (price < 1000000) minDown = (500000 * 0.05) + ((price - 500000) * 0.10);
    else minDown = price * 0.20; // 1M+ requires 20%

    // 2. Logic for Active Down Payment
    const activeDown = Math.max(userDownPayment || minDown, minDown);
    const downPercent = (activeDown / price) * 100;
    
    // 3. CMHC Premium
    let cmhcRate = 0;
    if (price < 1000000 && downPercent < 20) {
       if (downPercent >= 15) cmhcRate = 0.0280;
       else if (downPercent >= 10) cmhcRate = 0.0310;
       else cmhcRate = 0.0400;
    }
    
    const mortgageAmount = price - activeDown;
    const cmhcPremium = mortgageAmount * cmhcRate;
    const totalMortgage = mortgageAmount + cmhcPremium;

    return { minDown, activeDown, downPercent, cmhcPremium, totalMortgage, cmhcRate };
  }, [price, userDownPayment]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
      <div className="bg-black text-white p-8">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Down Payment Analyzer</h3>
        <p className="text-gray-400 text-sm">Minimums & CMHC Insurance Calculator</p>
      </div>
      <div className="p-8 md:p-12 flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/2 space-y-6">
           <div>
             <label className="block text-xs font-black uppercase tracking-widest mb-2">Purchase Price</label>
             <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-black outline-none" />
           </div>
           <div>
             <label className="block text-xs font-black uppercase tracking-widest mb-2">Your Down Payment</label>
             <input type="number" value={analysis.activeDown} onChange={e => setUserDownPayment(Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-black outline-none" />
             <p className="text-[10px] text-gray-400 mt-2">Minimum required: <strong>${analysis.minDown.toLocaleString()}</strong></p>
           </div>
        </div>
        <div className="w-full md:w-1/2 bg-gray-50 rounded-2xl p-8">
           <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                 <p className="text-[10px] uppercase text-gray-500 font-bold">Mortgage Amount</p>
                 <p className="text-lg font-bold">${(price - analysis.activeDown).toLocaleString()}</p>
              </div>
              <div>
                 <p className="text-[10px] uppercase text-gray-500 font-bold">CMHC Tax ({ (analysis.cmhcRate * 100).toFixed(2) }%)</p>
                 <p className="text-lg font-bold text-red-600">+${Math.round(analysis.cmhcPremium).toLocaleString()}</p>
              </div>
           </div>
           <div className="pt-6 border-t border-gray-200">
             <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Loan Amount</p>
             <p className="text-4xl font-black tracking-tighter">${Math.round(analysis.totalMortgage).toLocaleString()}</p>
           </div>
        </div>
      </div>
    </div>
  );
}