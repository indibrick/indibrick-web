'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Wallet, AlertTriangle, TrendingUp, Info } from 'lucide-react';

export default function AffordabilityCalculator() {
  // --- Inputs ---
  const [income, setIncome] = useState(120000);
  const [coIncome, setCoIncome] = useState(0);
  const [downPayment, setDownPayment] = useState(100000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [monthlyLivingCosts, setMonthlyLivingCosts] = useState(2500);
  
  // --- Settings ---
  const [rate, setRate] = useState(4.99);
  const [taxRate, setTaxRate] = useState(1.0);
  const [heatCost, setHeatCost] = useState(150);

  // --- Logic Engine ---
  const results = useMemo(() => {
    const totalIncome = income + coIncome;
    const monthlyIncome = totalIncome / 12;
    
    // Stress Test & Ratios
    const qualifyingRate = Math.max(5.25, rate + 2.0);
    const MAX_GDS = 0.39;
    const MAX_TDS = 0.44;

    const maxHousingGDS = monthlyIncome * MAX_GDS;
    const maxHousingTDS = (monthlyIncome * MAX_TDS) - monthlyDebts;
    const maxAllowedHousingSpend = Math.min(maxHousingGDS, maxHousingTDS);
    
    // Reverse Engineer Mortgage
    const estPrice = totalIncome * 5; 
    const monthlyTaxEst = (estPrice * (taxRate / 100)) / 12;
    const maxAvailableForMortgage = maxAllowedHousingSpend - monthlyTaxEst - heatCost;

    let maxMortgage = 0;
    if (maxAvailableForMortgage > 0) {
      const semiAnnualRate = Math.pow(1 + qualifyingRate / 100 / 2, 2);
      const monthlyRate = Math.pow(semiAnnualRate, 1 / 12) - 1;
      const amortMonths = 25 * 12;
      maxMortgage = maxAvailableForMortgage * (1 - Math.pow(1 + monthlyRate, -amortMonths)) / monthlyRate;
    }

    const maxPurchasePrice = maxMortgage + downPayment;

    // Safe Number
    const estNetMonthly = monthlyIncome * 0.70; 
    const safeAvailableForHousing = estNetMonthly - monthlyLivingCosts - monthlyDebts;
    let safeMortgage = 0;
    
    if (safeAvailableForHousing > 0) {
       const semiAnnualContract = Math.pow(1 + rate / 100 / 2, 2);
       const monthlyContract = Math.pow(semiAnnualContract, 1 / 12) - 1;
       const amortMonths = 25 * 12;
       const safeForPrincipalInterest = safeAvailableForHousing - monthlyTaxEst - heatCost;
       if (safeForPrincipalInterest > 0) {
         safeMortgage = safeForPrincipalInterest * (1 - Math.pow(1 + monthlyContract, -amortMonths)) / monthlyContract;
       }
    }
    const safePurchasePrice = safeMortgage + downPayment;

    return {
      maxPrice: Math.round(maxPurchasePrice),
      safePrice: Math.round(safePurchasePrice),
      qualifyingRate: qualifyingRate.toFixed(2),
      chartData: [
        { name: 'Conservative Budget', value: Math.round(safePurchasePrice), type: 'safe' },
        { name: 'Max Qualification', value: Math.round(maxPurchasePrice), type: 'max' }
      ]
    };
  }, [income, coIncome, downPayment, monthlyDebts, monthlyLivingCosts, rate, taxRate, heatCost]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mt-12">
      <div className="bg-black text-white p-8 md:p-10 flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Buying Power Engine</h3>
          <p className="text-gray-400 text-sm font-medium">Compare what the bank will lend vs. what your budget allows.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-5/12 p-8 md:p-12 bg-gray-50 border-r border-gray-100 space-y-8">
           <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                <Wallet size={14} /> Annual Income (Gross)
              </h4>
              <div className="grid grid-cols-1 gap-4">
                 <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none" />
                 <input type="number" value={coIncome} onChange={(e) => setCoIncome(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none" />
              </div>
           </div>
           <hr className="border-gray-200" />
           <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                <AlertTriangle size={14} /> Monthly Outflows
              </h4>
              <input type="number" value={monthlyDebts} onChange={(e) => setMonthlyDebts(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none" placeholder="Debts" />
              <input type="number" value={monthlyLivingCosts} onChange={(e) => setMonthlyLivingCosts(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none bg-yellow-50 border-yellow-200" placeholder="Living Costs" />
           </div>
           <div className="relative">
              <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Down Payment</label>
              <input type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none" />
           </div>
        </div>

        <div className="w-full lg:w-7/12 bg-white flex flex-col p-8 md:p-12">
           <div className="grid grid-cols-2 gap-8 mb-12">
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Max Bank Qualification</p>
                 <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter">${results.maxPrice.toLocaleString()}</h2>
              </div>
              <div>
                 <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">"Sleep Well" Budget</p>
                 <h2 className="text-4xl md:text-5xl font-black text-green-600 tracking-tighter">${results.safePrice.toLocaleString()}</h2>
              </div>
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={results.chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 800, fill: '#aaa'}} axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: '#f9f9f9'}} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Purchasing Power']} />
                 <Bar dataKey="value" barSize={30} radius={[0, 10, 10, 0]}>
                   {results.chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.type === 'max' ? '#000000' : '#16a34a'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}