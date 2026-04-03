'use client';

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  AlertCircle, CheckCircle, HelpCircle, Landmark, MapPin, 
  PieChart as PieChartIcon, ArrowRight, Building2, Flame, 
  Wallet, ChevronRight, Calculator, Plus, ArrowLeftRight
} from 'lucide-react';

type Frequency = 'Monthly' | 'Semi-Monthly' | 'Bi-Weekly' | 'Accelerated Bi-Weekly' | 'Weekly';

interface Scenario {
  id: string;
  name: string;
  price: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  rate: number;
  amortization: number;
  frequency: Frequency;
  isToronto: boolean;
  isFtb: boolean;
  propertyTaxRate: number;
  condoFees: number;
  monthlyHeat: number;
}

const DEFAULT_SCENARIO_A: Scenario = {
  id: 'A', name: 'Scenario A', price: 750000, downPaymentPercent: 20, downPaymentAmount: 150000,
  rate: 4.29, amortization: 25, frequency: 'Monthly', isToronto: false, isFtb: true,
  propertyTaxRate: 0.75, condoFees: 0, monthlyHeat: 150
};

const DEFAULT_SCENARIO_B: Scenario = {
  id: 'B', name: 'Scenario B', price: 850000, downPaymentPercent: 20, downPaymentAmount: 170000,
  rate: 4.29, amortization: 30, frequency: 'Monthly', isToronto: true, isFtb: true,
  propertyTaxRate: 0.75, condoFees: 400, monthlyHeat: 150
};

export default function MortgageCalculator() {
  // --- STATE ---
  const [activeScenarioId, setActiveScenarioId] = useState<'A' | 'B' | 'COMPARE'>('A');
  const [scenarioA, setScenarioA] = useState<Scenario>(DEFAULT_SCENARIO_A);
  const [scenarioB, setScenarioB] = useState<Scenario>(DEFAULT_SCENARIO_B);
  const [resultsView, setResultsView] = useState<'payment' | 'closing' | 'schedule'>('payment');

  const activeScenario = activeScenarioId === 'A' ? scenarioA : scenarioB;
  const setActiveScenarioData = activeScenarioId === 'A' ? setScenarioA : setScenarioB;

  // --- CORE ENGINE ---
  const calculateMortgage = (s: Scenario) => {
    // 1. CMHC Logic
    let cmhcRate = 0;
    const mortgagePrincipal = s.price - s.downPaymentAmount;
    
    if (s.downPaymentPercent < 20) {
      if (s.downPaymentPercent >= 15) cmhcRate = 0.028;
      else if (s.downPaymentPercent >= 10) cmhcRate = 0.031;
      else cmhcRate = 0.040;
    }
    
    const cmhcPremium = s.downPaymentPercent < 20 ? mortgagePrincipal * cmhcRate : 0;
    const pstOnCmhc = cmhcPremium * 0.08; // 8% Ontario PST paid in cash on closing
    const totalMortgage = mortgagePrincipal + cmhcPremium;

    // 2. PAYMENT CALCULATION
    const semiAnnualRate = Math.pow(1 + s.rate / 100 / 2, 2);
    let periodsPerYear = 12;
    if (s.frequency === 'Semi-Monthly') periodsPerYear = 24;
    if (s.frequency === 'Bi-Weekly' || s.frequency === 'Accelerated Bi-Weekly') periodsPerYear = 26;
    if (s.frequency === 'Weekly') periodsPerYear = 52;

    const periodicRate = Math.pow(semiAnnualRate, 1 / periodsPerYear) - 1;
    const totalPayments = s.amortization * periodsPerYear;

    let payment = 0;
    if (periodicRate > 0 && totalMortgage > 0) {
      payment = (totalMortgage * periodicRate) / (1 - Math.pow(1 + periodicRate, -totalPayments));
    }

    if (s.frequency === 'Accelerated Bi-Weekly' && totalMortgage > 0) {
      const monthlyPeriodic = Math.pow(semiAnnualRate, 1 / 12) - 1;
      const monthlyPaymentRaw = (totalMortgage * monthlyPeriodic) / (1 - Math.pow(1 + monthlyPeriodic, -(s.amortization * 12)));
      payment = monthlyPaymentRaw / 2;
    }

    // Equivalent monthly for standardization in charts/GDS
    const equivalentMonthlyPI = payment * (periodsPerYear / 12);

    // 3. LAND TRANSFER TAX (Ontario + Toronto)
    const calcLTT = (amt: number) => {
      let tax = 0;
      if (amt > 2000000) tax += (amt - 2000000) * 0.025;
      if (amt > 400000) tax += (Math.min(amt, 2000000) - 400000) * 0.020;
      if (amt > 250000) tax += (Math.min(amt, 400000) - 250000) * 0.015;
      if (amt > 55000) tax += (Math.min(amt, 250000) - 55000) * 0.010;
      if (amt > 0) tax += Math.min(amt, 55000) * 0.005;
      return tax;
    };

    const provTax = calcLTT(s.price);
    const muniTax = s.isToronto ? calcLTT(s.price) : 0;
    const provRebate = s.isFtb ? Math.min(provTax, 4000) : 0;
    const muniRebate = (s.isFtb && s.isToronto) ? Math.min(muniTax, 4475) : 0;
    const finalLTT = (provTax - provRebate) + (muniTax - muniRebate);

    // 4. CASH TO CLOSE
    const estLegalAndAppraisal = 1500;
    const totalClosingCosts = finalLTT + pstOnCmhc + estLegalAndAppraisal;
    const cashToClose = s.downPaymentAmount + totalClosingCosts;

    // 5. MONTHLY CARRYING COSTS
    const monthlyTaxes = (s.price * (s.propertyTaxRate / 100)) / 12;
    const totalMonthlyCarrying = equivalentMonthlyPI + monthlyTaxes + s.monthlyHeat + s.condoFees;

    // 6. QUALIFICATION LOGIC (Stress Test)
    const stressRate = Math.max(5.25, s.rate + 2.0);
    const stressSemiAnnual = Math.pow(1 + stressRate / 100 / 2, 2);
    const stressMonthlyRate = Math.pow(stressSemiAnnual, 1 / 12) - 1;
    const qualAmortization = s.downPaymentPercent < 20 ? 25 : s.amortization; 
    const stressMonthlyPayment = totalMortgage > 0 ? (totalMortgage * stressMonthlyRate) / (1 - Math.pow(1 + stressMonthlyRate, -(qualAmortization * 12))) : 0;
    
    // GDS Formula: (P&I + Taxes + Heat + 50% Condo Fees) / 0.39
    const annualHousingCost = (stressMonthlyPayment * 12) + (monthlyTaxes * 12) + (s.monthlyHeat * 12) + ((s.condoFees * 0.5) * 12);
    const incomeRequired = annualHousingCost / 0.39; 

    // Chart Data
    const chartData = [
      { name: 'Principal & Interest', value: equivalentMonthlyPI, color: '#0f172a' }, // Slate 900
      { name: 'Property Taxes', value: monthlyTaxes, color: '#3b82f6' }, // Blue 500
      { name: 'Heating', value: s.monthlyHeat, color: '#f59e0b' }, // Amber 500
      ...(s.condoFees > 0 ? [{ name: 'Condo Fees', value: s.condoFees, color: '#8b5cf6' }] : []) // Violet 500
    ];

    // Amortization Schedule
    const scheduleData = [];
    let bal = totalMortgage;
    for (let year = 1; year <= s.amortization; year++) {
      let interestYear = 0;
      let principalYear = 0;
      for (let p = 0; p < periodsPerYear; p++) {
        if (bal <= 0) break;
        const interest = bal * periodicRate;
        const principal = payment - interest;
        bal -= principal;
        interestYear += interest;
        principalYear += principal;
      }
      scheduleData.push({
        year: `Year ${year}`,
        Balance: Math.max(0, Math.round(bal)),
        Interest: Math.round(interestYear),
        Principal: Math.round(principalYear),
      });
    }

    return {
      ...s,
      payment, equivalentMonthlyPI, cmhcPremium, pstOnCmhc, totalMortgage, stressRate,
      incomeRequired, provTax, muniTax, provRebate, muniRebate, finalLTT,
      totalClosingCosts, cashToClose, monthlyTaxes, totalMonthlyCarrying, chartData, scheduleData
    };
  };

  const resultsA = useMemo(() => calculateMortgage(scenarioA), [scenarioA]);
  const resultsB = useMemo(() => calculateMortgage(scenarioB), [scenarioB]);
  
  const currentResult = activeScenarioId === 'A' ? resultsA : resultsB;

  // --- INPUT HANDLERS ---
  const updateField = (field: keyof Scenario, value: any) => {
    setActiveScenarioData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Special relationship handling for Price / DownPayment
      if (field === 'price') {
        updated.downPaymentAmount = Math.round((updated.downPaymentPercent / 100) * updated.price);
      } else if (field === 'downPaymentAmount') {
        let amt = value > updated.price ? updated.price : value;
        updated.downPaymentAmount = amt;
        updated.downPaymentPercent = Number(((amt / updated.price) * 100).toFixed(2));
      } else if (field === 'downPaymentPercent') {
        let pct = value > 100 ? 100 : value;
        updated.downPaymentPercent = pct;
        updated.downPaymentAmount = Math.round((pct / 100) * updated.price);
      }

      // Amortization cap for high ratio
      if (updated.downPaymentPercent < 20 && updated.amortization > 25) {
        updated.amortization = 25;
      }

      return updated;
    });
  };

  // --- STYLING CONSTANTS ---
  const labelClass = "block text-[13px] font-bold uppercase tracking-widest text-slate-600 mb-2";
  const inputClass = "w-full p-4 bg-white border border-gray-200 rounded-xl font-black text-slate-900 text-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition shadow-sm";

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col overflow-hidden font-sans">
      
      {/* --- SCENARIO HEADER --- */}
      <div className="bg-slate-50 border-b border-gray-200 p-4 md:px-10 flex gap-2 overflow-x-auto no-scrollbar">
         <button 
           onClick={() => setActiveScenarioId('A')}
           className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition flex-shrink-0 flex items-center gap-2 ${activeScenarioId === 'A' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:border-black'}`}
         >
            Scenario A
         </button>
         <button 
           onClick={() => setActiveScenarioId('B')}
           className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition flex-shrink-0 flex items-center gap-2 ${activeScenarioId === 'B' ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200 hover:border-black'}`}
         >
            Scenario B
         </button>
         <div className="w-px bg-gray-200 mx-2"></div>
         <button 
           onClick={() => setActiveScenarioId('COMPARE')}
           className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition flex-shrink-0 flex items-center gap-2 ${activeScenarioId === 'COMPARE' ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'}`}
         >
            <ArrowLeftRight size={14} /> Compare Side-by-Side
         </button>
      </div>

      {/* --- COMPARE VIEW --- */}
      {activeScenarioId === 'COMPARE' ? (
        <div className="p-6 md:p-12 animate-fade-in bg-gray-50/50">
           <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-8 text-center">Scenario Analysis</h2>
              
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white">
                       <tr>
                          <th className="p-6 font-bold uppercase tracking-widest text-[10px] text-slate-400 w-1/3">Metric</th>
                          <th className="p-6 font-black uppercase tracking-widest text-xs w-1/3 border-l border-white/10">Scenario A</th>
                          <th className="p-6 font-black uppercase tracking-widest text-xs w-1/3 border-l border-white/10">Scenario B</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       <tr className="hover:bg-gray-50 transition">
                          <td className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Purchase Price</td>
                          <td className="p-6 font-black text-lg text-slate-900 border-l border-gray-100">${resultsA.price.toLocaleString()}</td>
                          <td className="p-6 font-black text-lg text-slate-900 border-l border-gray-100">${resultsB.price.toLocaleString()}</td>
                       </tr>
                       <tr className="hover:bg-gray-50 transition">
                          <td className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Down Payment</td>
                          <td className="p-6 font-bold text-slate-700 border-l border-gray-100">${resultsA.downPaymentAmount.toLocaleString()} <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded ml-2">{resultsA.downPaymentPercent}%</span></td>
                          <td className="p-6 font-bold text-slate-700 border-l border-gray-100">${resultsB.downPaymentAmount.toLocaleString()} <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded ml-2">{resultsB.downPaymentPercent}%</span></td>
                       </tr>
                       <tr className="hover:bg-gray-50 transition">
                          <td className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Interest Rate</td>
                          <td className="p-6 font-bold text-slate-700 border-l border-gray-100">{resultsA.rate}% <span className="text-[10px] text-gray-400 block">{resultsA.amortization} Yr Amort.</span></td>
                          <td className="p-6 font-bold text-slate-700 border-l border-gray-100">{resultsB.rate}% <span className="text-[10px] text-gray-400 block">{resultsB.amortization} Yr Amort.</span></td>
                       </tr>
                       <tr className="bg-blue-50/50">
                          <td className="p-6 text-xs font-black text-blue-800 uppercase tracking-wider">Payment ({resultsA.frequency})</td>
                          <td className="p-6 font-black text-2xl text-blue-600 border-l border-blue-100">${Math.round(resultsA.payment).toLocaleString()}</td>
                          <td className="p-6 font-black text-2xl text-blue-600 border-l border-blue-100">${Math.round(resultsB.payment).toLocaleString()}</td>
                       </tr>
                       <tr className="hover:bg-gray-50 transition">
                          <td className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Cash to Close</td>
                          <td className="p-6 font-bold text-slate-700 border-l border-gray-100">${Math.round(resultsA.cashToClose).toLocaleString()}</td>
                          <td className="p-6 font-bold text-slate-700 border-l border-gray-100">${Math.round(resultsB.cashToClose).toLocaleString()}</td>
                       </tr>
                       <tr className="hover:bg-gray-50 transition">
                          <td className="p-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Income Required</td>
                          <td className="p-6 font-bold text-slate-700 border-l border-gray-100">~${Math.round(resultsA.incomeRequired).toLocaleString()}/yr</td>
                          <td className="p-6 font-bold text-slate-700 border-l border-gray-100">~${Math.round(resultsB.incomeRequired).toLocaleString()}/yr</td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      ) : (
        /* --- SINGLE SCENARIO VIEW --- */
        <div className="flex flex-col lg:flex-row w-full animate-fade-in">
          
          {/* LEFT COLUMN: INPUTS */}
          <div className="w-full lg:w-[45%] p-6 md:p-10 bg-gray-50 border-r border-gray-200 space-y-10">
            
            {/* Purchase Details */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-gray-200 pb-3">
                 <Building2 size={14} /> 1. Purchase Details
              </h3>
              
              <div>
                <div className="flex justify-between items-end mb-3">
                   <label className={labelClass}>Asking Price</label>
                   <div className="relative w-1/2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                      <input 
                        type="number" value={activeScenario.price} onChange={(e) => updateField('price', Number(e.target.value))} 
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg font-black text-lg focus:ring-2 focus:ring-blue-600 outline-none text-right transition shadow-sm" 
                      />
                   </div>
                </div>
                <input 
                   type="range" min="100000" max="3000000" step="10000" 
                   value={activeScenario.price} onChange={(e) => updateField('price', Number(e.target.value))} 
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                   <label className={labelClass}>Down Payment</label>
                   <div className="flex gap-2 w-[55%]">
                      <div className="relative w-full">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                         <input 
                           type="number" value={activeScenario.downPaymentAmount} onChange={(e) => updateField('downPaymentAmount', Number(e.target.value))} 
                           className="w-full pl-7 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black text-sm focus:ring-2 focus:ring-blue-600 outline-none text-right transition" 
                         />
                      </div>
                      <div className="relative w-20 shrink-0">
                         <input 
                           type="number" value={activeScenario.downPaymentPercent} onChange={(e) => updateField('downPaymentPercent', Number(e.target.value))} 
                           className="w-full pr-6 pl-2 py-2 bg-gray-50 border border-gray-200 rounded-lg font-black text-sm focus:ring-2 focus:ring-blue-600 outline-none text-right transition" 
                         />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                      </div>
                   </div>
                </div>
                <input 
                   type="range" min="5" max="100" step="1" 
                   value={activeScenario.downPaymentPercent} onChange={(e) => updateField('downPaymentPercent', Number(e.target.value))} 
                   className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                {activeScenario.downPaymentPercent < 20 && (
                   <div className="mt-4 flex items-start gap-2 text-blue-800 bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-600" />
                      <p className="text-[11px] font-medium leading-relaxed">
                         <strong>High-Ratio:</strong> ${Math.round(currentResult.cmhcPremium).toLocaleString()} CMHC premium added to mortgage.
                      </p>
                   </div>
                )}
              </div>
            </div>

            {/* Mortgage Details */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-gray-200 pb-3">
                 <Calculator size={14} /> 2. Mortgage Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Interest Rate</label>
                    <div className="relative">
                       <input 
                         type="number" step="0.01" value={activeScenario.rate} onChange={(e) => updateField('rate', Number(e.target.value))} 
                         className={inputClass} 
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Amortization</label>
                    <select 
                      value={activeScenario.amortization} onChange={(e) => updateField('amortization', Number(e.target.value))} 
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      {[15, 20, 25, 30].map(y => <option key={y} value={y} disabled={activeScenario.downPaymentPercent < 20 && y > 25}>{y} Years</option>)}
                    </select>
                  </div>
              </div>

              <div>
                 <label className={labelClass}>Payment Frequency</label>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {['Monthly', 'Semi-Monthly', 'Bi-Weekly', 'Accelerated Bi-Weekly'].map((freq) => (
                      <button 
                        key={freq} onClick={() => updateField('frequency', freq as Frequency)} 
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition shadow-sm border ${activeScenario.frequency === freq ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-500 border-gray-200 hover:border-slate-400'}`}
                      >
                        {freq.replace('Bi-Weekly', 'Bi-Wk').replace('Semi-Monthly', 'Semi-Mo')}
                      </button>
                    ))}
                 </div>
              </div>
            </div>

            {/* Carrying Costs & Taxes */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b border-gray-200 pb-3">
                 <Landmark size={14} /> 3. Property & Closing
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-2">Prop. Tax</label>
                    <div className="relative">
                       <input type="number" step="0.1" value={activeScenario.propertyTaxRate} onChange={(e) => updateField('propertyTaxRate', Number(e.target.value))} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-blue-600 shadow-sm" />
                       <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-2">Condo Fees</label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">$</span>
                       <input type="number" value={activeScenario.condoFees} onChange={(e) => updateField('condoFees', Number(e.target.value))} className="w-full pl-6 pr-3 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-blue-600 shadow-sm text-right" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-2">Heating/mo</label>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">$</span>
                       <input type="number" value={activeScenario.monthlyHeat} onChange={(e) => updateField('monthlyHeat', Number(e.target.value))} className="w-full pl-6 pr-3 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-blue-600 shadow-sm text-right" />
                    </div>
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                  <label className={`flex-1 flex items-center justify-between p-4 rounded-xl border cursor-pointer transition shadow-sm ${activeScenario.isToronto ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
                     <span className={`text-xs font-bold flex items-center gap-2 ${activeScenario.isToronto ? 'text-blue-900' : 'text-slate-700'}`}><MapPin size={14}/> Toronto (416)</span>
                     <input type="checkbox" checked={activeScenario.isToronto} onChange={e => updateField('isToronto', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  </label>
                  <label className={`flex-1 flex items-center justify-between p-4 rounded-xl border cursor-pointer transition shadow-sm ${activeScenario.isFtb ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-green-400'}`}>
                     <span className={`text-xs font-bold flex items-center gap-2 ${activeScenario.isFtb ? 'text-green-900' : 'text-slate-700'}`}><CheckCircle size={14}/> First-Time Buyer</span>
                     <input type="checkbox" checked={activeScenario.isFtb} onChange={e => updateField('isFtb', e.target.checked)} className="w-4 h-4 accent-green-600" />
                  </label>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: STICKY RESULTS PANEL */}
          <div className="w-full lg:w-[55%] bg-white flex flex-col relative">
            
            {/* Results Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/50 sticky top-0 z-20">
                <button onClick={() => setResultsView('payment')} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${resultsView === 'payment' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-slate-900 hover:bg-gray-50'}`}>
                  <Wallet size={14} /> Payments
                </button>
                <button onClick={() => setResultsView('closing')} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${resultsView === 'closing' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-slate-900 hover:bg-gray-50'}`}>
                  <Landmark size={14} /> Cash Needed
                </button>
                <button onClick={() => setResultsView('schedule')} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${resultsView === 'schedule' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:text-slate-900 hover:bg-gray-50'}`}>
                  <PieChartIcon size={14} /> Amortization
                </button>
            </div>

            <div className="p-6 md:p-10 flex-grow relative overflow-y-auto">
               
               {/* VIEW 1: PAYMENT BREAKDOWN */}
               {resultsView === 'payment' && (
                 <div className="animate-fade-in space-y-8">
                    
                    <div className="text-center md:text-left bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                       <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-2">Your {activeScenario.frequency} Payment</p>
                       <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-4">${Math.round(currentResult.payment).toLocaleString()}</h2>
                       <div className="flex flex-col md:flex-row items-center gap-4 text-xs font-medium text-slate-300">
                          <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">Base Loan: ${(currentResult.price - currentResult.downPaymentAmount).toLocaleString()}</span>
                          {currentResult.cmhcPremium > 0 && <span className="bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30">+ CMHC: ${Math.round(currentResult.cmhcPremium).toLocaleString()}</span>}
                          <span className="font-bold text-white">Total Mortgage: ${Math.round(currentResult.totalMortgage).toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                       <div className="h-48 relative">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie data={currentResult.chartData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                   {currentResult.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => `$${Math.round(value).toLocaleString()}/mo`} contentStyle={{borderRadius: '12px', border:'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                             </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                             <span className="text-[10px] uppercase font-bold text-slate-400">Total Monthly</span>
                             <span className="text-xl font-black text-slate-900">${Math.round(currentResult.totalMonthlyCarrying).toLocaleString()}</span>
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-gray-100 pb-2 mb-4">Monthly Breakdown (Est)</h4>
                          <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                             <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div> Principal & Interest</span>
                             <span>${Math.round(currentResult.equivalentMonthlyPI).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                             <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Property Taxes</span>
                             <span>${Math.round(currentResult.monthlyTaxes).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                             <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Heating</span>
                             <span>${currentResult.monthlyHeat.toLocaleString()}</span>
                          </div>
                          {currentResult.condoFees > 0 && (
                            <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                               <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div> Condo Fees</span>
                               <span>${currentResult.condoFees.toLocaleString()}</span>
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                       <Building2 size={24} className="text-blue-600 shrink-0" />
                       <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-blue-900 mb-1">Stress Test Qualification</h4>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            To qualify for this mortgage at the <strong>{currentResult.stressRate.toFixed(2)}%</strong> stress test benchmark, you will need an approximate household income of <strong>${Math.round(currentResult.incomeRequired).toLocaleString()} / year</strong>.
                          </p>
                       </div>
                    </div>
                 </div>
               )}

               {/* VIEW 2: CLOSING COSTS */}
               {resultsView === 'closing' && (
                 <div className="animate-fade-in space-y-8">
                    
                    <div className="text-center md:text-left mb-6">
                       <p className="text-[13px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Cash Needed</p>
                       <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">${Math.round(currentResult.cashToClose).toLocaleString()}</h2>
                    </div>

                    <div className="space-y-4">
                       
                       {/* Down Payment Block */}
                       <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex justify-between items-center">
                          <div>
                             <h4 className="font-black text-slate-900">Down Payment</h4>
                             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{currentResult.downPaymentPercent}% of Purchase Price</p>
                          </div>
                          <span className="font-black text-xl text-slate-900">${currentResult.downPaymentAmount.toLocaleString()}</span>
                       </div>

                       {/* Land Transfer Tax Details */}
                       <div className="border border-gray-200 rounded-2xl overflow-hidden">
                          <div className="bg-gray-50 p-5 flex justify-between items-center border-b border-gray-200">
                             <h4 className="font-black text-slate-900 flex items-center gap-2"><Landmark size={16} className="text-blue-600"/> Land Transfer Tax</h4>
                             <span className="font-black text-lg text-slate-900">${Math.round(currentResult.finalLTT).toLocaleString()}</span>
                          </div>
                          <div className="p-5 space-y-3 bg-white text-sm font-medium text-slate-600">
                             <div className="flex justify-between">
                                <span>Ontario Provincial Tax</span>
                                <span>${Math.round(currentResult.provTax).toLocaleString()}</span>
                             </div>
                             {currentResult.isToronto && (
                               <div className="flex justify-between">
                                  <span>Toronto Municipal Tax</span>
                                  <span>${Math.round(currentResult.muniTax).toLocaleString()}</span>
                               </div>
                             )}
                             {currentResult.isFtb && (
                               <div className="flex justify-between text-green-600 font-bold border-t border-gray-100 pt-2 mt-2">
                                  <span>First-Time Buyer Rebates</span>
                                  <span>-${Math.round(currentResult.provRebate + currentResult.muniRebate).toLocaleString()}</span>
                               </div>
                             )}
                          </div>
                       </div>

                       {/* PST on CMHC */}
                       {currentResult.pstOnCmhc > 0 && (
                          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex justify-between items-center">
                             <div>
                                <h4 className="font-black text-red-900 flex items-center gap-2"><AlertCircle size={16}/> PST on CMHC Premium</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mt-1">8% Ontario Tax Paid in Cash</p>
                             </div>
                             <span className="font-black text-xl text-red-700">${Math.round(currentResult.pstOnCmhc).toLocaleString()}</span>
                          </div>
                       )}

                       {/* Legal */}
                       <div className="bg-white border border-gray-200 rounded-2xl p-5 flex justify-between items-center">
                          <div>
                             <h4 className="font-black text-slate-900">Legal & Appraisal (Est)</h4>
                             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Lawyer fees, Title Insurance</p>
                          </div>
                          <span className="font-black text-lg text-slate-900">$1,500</span>
                       </div>

                    </div>
                 </div>
               )}

               {/* VIEW 3: AMORTIZATION SCHEDULE */}
               {resultsView === 'schedule' && (
                 <div className="h-full flex flex-col animate-fade-in min-h-[400px]">
                    <div className="mb-6 flex justify-between items-end">
                       <div>
                          <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Principal vs Interest</h3>
                          <p className="text-gray-500 text-sm font-medium">Over {activeScenario.amortization} Years</p>
                       </div>
                    </div>
                    <div className="flex-grow w-full -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={currentResult.scheduleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f172a" stopOpacity={0.8}/><stop offset="95%" stopColor="#0f172a" stopOpacity={0}/></linearGradient>
                            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                          </defs>
                          <XAxis dataKey="year" tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                          <Area type="monotone" dataKey="Principal" stroke="#0f172a" fillOpacity={1} fill="url(#colorPrincipal)" stackId="1" />
                          <Area type="monotone" dataKey="Interest" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInterest)" stackId="1" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                       <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Principal</p>
                          <p className="text-xl font-black text-slate-900">${currentResult.scheduleData.reduce((acc, cur) => acc + cur.Principal, 0).toLocaleString()}</p>
                       </div>
                       <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Total Interest Paid</p>
                          <p className="text-xl font-black text-blue-900">${currentResult.scheduleData.reduce((acc, cur) => acc + cur.Interest, 0).toLocaleString()}</p>
                       </div>
                    </div>
                 </div>
               )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}