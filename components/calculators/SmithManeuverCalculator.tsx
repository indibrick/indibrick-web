'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, AlertCircle, 
  ArrowRight, RefreshCw, CheckCircle, Lock, Settings, BarChart2,
  XCircle, Info, Calculator, FileText, PieChart, Wallet, CreditCard, ChevronRight, Phone
} from 'lucide-react';
import LeadForm from '../LeadForm';

// ... (Keep existing TYPES and TAX ENGINE code exactly as is) ...
// --- TYPES ---
interface YearResult {
  year: number;
  mortgageBalance: number;
  deductibleLoan: number;
  portfolioValue: number;
  netWorth: number;
  mortgageInterestPaid: number;
  helocInterestPaid: number;
  taxRefund: number; 
  monthlyMortgagePayment: number;
  monthlyHelocPayment: number;
  totalMonthlyPayment: number; 
  isCapped: boolean;
}

// --- TAX ENGINE (2025 Estimates) ---
const calculateMarginalTaxRate = (income: number): number => {
  let fedRate = 0;
  if (income <= 57375) fedRate = 0.15;
  else if (income <= 114750) fedRate = 0.205;
  else if (income <= 177882) fedRate = 0.26;
  else if (income <= 253414) fedRate = 0.29;
  else fedRate = 0.33;

  let provRate = 0;
  if (income <= 52886) provRate = 0.0505;
  else if (income <= 105775) provRate = 0.0915;
  else if (income <= 150000) provRate = 0.1116;
  else if (income <= 220000) provRate = 0.1216;
  else provRate = 0.1316;

  let surtaxBuffer = 0;
  if (income > 85000) surtaxBuffer = 0.015; 
  if (income > 150000) surtaxBuffer = 0.03;

  return (fedRate + provRate + surtaxBuffer) * 100;
};

export default function SmithManeuverCalculator() {
  // --- STATE VARIABLES (Keep exactly as previous version) ---
  const [annualIncome, setAnnualIncome] = useState(140000);
  const [propertyValue, setPropertyValue] = useState(1000000);
  const [mortgageBalance, setMortgageBalance] = useState(600000);
  const [mortgageRate, setMortgageRate] = useState(4.49);
  const [amortization, setAmortization] = useState(25);
  const [helocRate, setHelocRate] = useState(5.95);
  const [initialLumpSum, setInitialLumpSum] = useState(0); 
  const [monthlyPrepayment, setMonthlyPrepayment] = useState(0);
  const [capitalizeInterest, setCapitalizeInterest] = useState(false); 
  const [totalReturn, setTotalReturn] = useState(8.0);
  const [applyRefund, setApplyRefund] = useState(true);

  // --- VALIDATION (Keep exactly as previous version) ---
  const marginalTaxRate = useMemo(() => calculateMarginalTaxRate(annualIncome), [annualIncome]);
  const ltvPercent = (mortgageBalance / propertyValue) * 100;
  const isEligible = ltvPercent <= 80;
  const maxPlanLimit = propertyValue * 0.80; 
  const maxRevolvingLimit = propertyValue * 0.65; 
  const availableEquity = Math.max(0, Math.min(maxPlanLimit - mortgageBalance, maxRevolvingLimit));

  useEffect(() => {
    if (initialLumpSum > availableEquity) setInitialLumpSum(availableEquity);
  }, [availableEquity, initialLumpSum]);

  // --- CORE ENGINE (Keep exactly as previous version) ---
  const projection = useMemo(() => {
    if (!isEligible) return [];
    const results: YearResult[] = [];
    let currentMortgage = mortgageBalance;
    let currentLoan = initialLumpSum; 
    let currentPortfolio = initialLumpSum; 
    
    const monthlyMortgageRate = mortgageRate / 100 / 12;
    const monthlyHelocRate = helocRate / 100 / 12;
    const monthlyTotalReturn = totalReturn / 100 / 12;
    
    const basePayment = (mortgageBalance * monthlyMortgageRate) / (1 - Math.pow(1 + monthlyMortgageRate, -amortization * 12));

    for (let year = 1; year <= 30; year++) {
      let yearMortgageInterest = 0;
      let yearHelocInterest = 0;
      let yearEndMortgagePmt = 0;
      let yearEndHelocPmt = 0;
      let hitCap = false;
      
      for (let m = 1; m <= 12; m++) {
        if (currentMortgage > 0) {
          const interestPart = currentMortgage * monthlyMortgageRate;
          const regularPrincipal = basePayment - interestPart;
          const totalPrincipalPaydown = regularPrincipal + monthlyPrepayment;
          const actualPaydown = Math.min(totalPrincipalPaydown, currentMortgage);
          currentMortgage -= actualPaydown;
          yearMortgageInterest += interestPart;

          const roomInHeloc = maxRevolvingLimit - currentLoan;
          if (roomInHeloc > 0) {
              const reborrowAmount = Math.min(actualPaydown, roomInHeloc);
              currentLoan += reborrowAmount;
              currentPortfolio += reborrowAmount;
          } else {
              hitCap = true;
          }
        }
        currentPortfolio *= (1 + monthlyTotalReturn);
        const monthlyInterestCost = currentLoan * monthlyHelocRate;
        yearHelocInterest += monthlyInterestCost;

        if (capitalizeInterest) {
            const roomInHeloc = maxRevolvingLimit - currentLoan;
            if (roomInHeloc >= monthlyInterestCost) { currentLoan += monthlyInterestCost; } 
            else { hitCap = true; }
        }
        if (m === 12) {
             yearEndMortgagePmt = currentMortgage > 0 ? (basePayment + monthlyPrepayment) : 0;
             yearEndHelocPmt = monthlyInterestCost;
        }
      }
      const grossRefund = yearHelocInterest * (marginalTaxRate / 100);
      if (applyRefund && grossRefund > 0) {
        if (currentMortgage > 0) {
            const prepay = Math.min(grossRefund, currentMortgage);
            currentMortgage -= prepay;
            const roomInHeloc = maxRevolvingLimit - currentLoan;
            if (roomInHeloc > 0) {
                 const reborrow = Math.min(prepay, roomInHeloc);
                 currentLoan += reborrow;
                 currentPortfolio += reborrow;
            }
        } else { currentPortfolio += grossRefund; }
      }
      results.push({
        year,
        mortgageBalance: Math.max(0, currentMortgage),
        deductibleLoan: currentLoan,
        portfolioValue: currentPortfolio,
        netWorth: (propertyValue + currentPortfolio) - (currentMortgage + currentLoan),
        mortgageInterestPaid: yearMortgageInterest,
        helocInterestPaid: yearHelocInterest,
        taxRefund: grossRefund,
        monthlyMortgagePayment: yearEndMortgagePmt,
        monthlyHelocPayment: yearEndHelocPmt,
        totalMonthlyPayment: yearEndMortgagePmt + yearEndHelocPmt,
        isCapped: hitCap
      });
    }
    return results;
  }, [isEligible, mortgageBalance, propertyValue, initialLumpSum, mortgageRate, amortization, helocRate, monthlyPrepayment, capitalizeInterest, marginalTaxRate, totalReturn, applyRefund, maxRevolvingLimit]);

  const year25 = projection[24] || { portfolioValue: 0, deductibleLoan: 0, taxRefund: 0, totalMonthlyPayment: 0 };
  const netBenefit = year25.portfolioValue - year25.deductibleLoan;

  // --- SCROLL HANDLER ---
  const scrollToForm = () => {
    const formElement = document.getElementById('strategy-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden font-sans">
      
      {/* 1. PREMIUM HEADER (Same as before) */}
      <div className={`p-8 md:p-12 relative overflow-hidden transition-colors duration-700 ${isEligible ? 'bg-slate-900' : 'bg-red-900'}`}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
           <div>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border ${isEligible ? 'bg-green-500 text-black border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-red-500 text-white border-red-400'}`}>
                 {isEligible ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                 {isEligible ? "Strategy Eligible" : "Equity Required"}
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4 text-white">
                 Wealth<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Accelerator.</span>
              </h2>
              {isEligible ? (
                  <p className="text-blue-200 font-medium text-sm max-w-md leading-relaxed">
                      Transform your mortgage interest into a tax refund. Based on your <strong>${annualIncome.toLocaleString()}</strong> income, your marginal tax efficiency is <strong>{marginalTaxRate.toFixed(2)}%</strong>.
                  </p>
              ) : (
                  <p className="text-red-200 font-medium text-sm">
                      Your Loan-to-Value is {ltvPercent.toFixed(1)}%. You need at least 20% equity to unlock this strategy.
                  </p>
              )}
           </div>
           
           {isEligible && (
               <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md text-right shadow-2xl relative group hover:bg-white/10 transition duration-500">
                  <div className="absolute -top-4 -right-4 bg-green-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg rotate-3 group-hover:rotate-0 transition">Projected Gain</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Net Benefit (25 Years)</div>
                  <div className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">
                     ${netBenefit.toLocaleString(undefined, {maximumFractionDigits:0})}
                  </div>
                  <div className="flex justify-end gap-6 text-[10px] font-bold uppercase tracking-widest">
                     <div>
                        <span className="text-gray-500 block mb-1">Assets</span>
                        <span className="text-green-400 text-lg">${year25.portfolioValue.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                     </div>
                     <div>
                        <span className="text-gray-500 block mb-1">Loans</span>
                        <span className="text-red-400 text-lg">${year25.deductibleLoan.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                     </div>
                  </div>
               </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12">
        
        {/* 2. INPUTS PANEL (Keep exactly as previous version) */}
        <div className="xl:col-span-4 bg-slate-50 border-r border-gray-200 p-6 md:p-8 flex flex-col gap-8 max-h-[1000px] overflow-y-auto custom-scrollbar">
           
           {/* A. CLIENT PROFILE */}
           <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-widest text-slate-400 flex items-center gap-2"><FileText size={14}/> 1. Client Profile</h4>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-2">Annual Household Income</label>
                    <div className="relative group">
                       <DollarSign size={16} className="absolute left-4 top-3.5 text-gray-400"/>
                       <input type="number" value={annualIncome} onChange={e => setAnnualIncome(Number(e.target.value))} className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-bold text-sm border-0 focus:ring-2 ring-blue-600 transition text-slate-900" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-2">Property Value</label>
                    <div className="relative group">
                       <DollarSign size={16} className="absolute left-4 top-3.5 text-gray-400"/>
                       <input type="number" value={propertyValue} onChange={e => setPropertyValue(Number(e.target.value))} className="w-full pl-10 p-3 bg-slate-50 rounded-xl font-bold text-sm border-0 focus:ring-2 ring-blue-600 transition text-slate-900" />
                    </div>
                 </div>
              </div>
           </div>

           {/* B. MORTGAGE (With LTV Meter) */}
           <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-widest text-slate-400 flex items-center gap-2"><Lock size={14}/> 2. Mortgage Details</h4>
              <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 ${!isEligible ? 'ring-2 ring-red-100' : ''}`}>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-2">Current Balance</label>
                    <input type="number" value={mortgageBalance} onChange={e => setMortgageBalance(Number(e.target.value))} className={`w-full p-3 rounded-xl font-bold text-sm border-0 focus:ring-2 ${!isEligible ? 'bg-red-50 text-red-600 ring-red-200' : 'bg-slate-50 ring-blue-600 text-slate-900'}`} />
                    {!isEligible && <p className="text-[10px] text-red-500 font-bold mt-2 flex items-center gap-1"><AlertCircle size={12}/> Max allowed: ${(maxPlanLimit).toLocaleString()}</p>}
                 </div>
                 <div className="pt-2">
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400">Loan-to-Value</span>
                        <span className={`text-[10px] font-black ${isEligible ? 'text-green-600' : 'text-red-600'}`}>{ltvPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                        <div className="absolute left-[65%] top-0 bottom-0 w-0.5 bg-slate-300 z-10"></div>
                        <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-red-300 z-10"></div>
                        <div className={`h-full transition-all duration-700 ${isEligible ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-red-500'}`} style={{width: `${Math.min(100, ltvPercent)}%`}} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-bold text-slate-500 block mb-2">Rate (%)</label><input type="number" step="0.1" value={mortgageRate} onChange={e => setMortgageRate(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm border-0 focus:ring-2 ring-blue-600 text-slate-900" /></div>
                    <div><label className="text-[10px] font-bold text-slate-500 block mb-2">Amortization</label><input type="number" value={amortization} onChange={e => setAmortization(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm border-0 focus:ring-2 ring-blue-600 text-slate-900" /></div>
                 </div>
              </div>
           </div>

           {/* C. STRATEGY (With Sliders) */}
           <div className={`space-y-4 transition-all duration-500 ${!isEligible ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <h4 className="font-black uppercase text-xs tracking-widest text-slate-400 flex items-center gap-2"><RefreshCw size={14}/> 3. The Strategy</h4>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                 <div><label className="text-[10px] font-bold text-slate-500 block mb-2">HELOC Rate (%)</label><input type="number" step="0.1" value={helocRate} onChange={e => setHelocRate(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm border-0 focus:ring-2 ring-blue-600 text-slate-900" /></div>
                 <div>
                    <div className="flex justify-between mb-2"><label className="text-[10px] font-bold text-slate-500">Initial Lump Sum</label><span className="text-[10px] font-black text-blue-600">${initialLumpSum.toLocaleString()}</span></div>
                    <input type="range" min="0" max={availableEquity} step="1000" value={initialLumpSum} onChange={e => setInitialLumpSum(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <div className="text-right text-[9px] text-slate-400 mt-1 font-medium">Max: ${availableEquity.toLocaleString()}</div>
                 </div>
                 <div className="space-y-4 pt-2 border-t border-gray-50">
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setCapitalizeInterest(!capitalizeInterest)}>
                        <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-900">Capitalize Interest</span><span className="text-[9px] text-slate-400">Use HELOC to pay interest</span></div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${capitalizeInterest ? 'bg-slate-900' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${capitalizeInterest ? 'translate-x-5' : ''}`} /></div>
                    </div>
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setApplyRefund(!applyRefund)}>
                        <div className="flex flex-col"><span className="text-[11px] font-bold text-slate-900">Reinvest Refund</span><span className="text-[9px] text-slate-400">Apply tax refund to mortgage</span></div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${applyRefund ? 'bg-green-500' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${applyRefund ? 'translate-x-5' : ''}`} /></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* 3. VISUALIZATION (RIGHT) */}
        <div className="xl:col-span-8 p-6 md:p-8 flex flex-col gap-8 bg-white min-h-[600px]">
           
           {!isEligible ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                   <div className="bg-slate-50 p-8 rounded-full mb-6"><Lock size={64} className="text-slate-300" /></div>
                   <h3 className="text-3xl font-black text-slate-300 uppercase tracking-tighter mb-2">Strategy Locked</h3>
                   <p className="text-slate-400 max-w-md font-medium">Please adjust your mortgage balance or property value to reach 80% LTV or lower.</p>
               </div>
           ) : (
               <>
                   {/* MONTHLY BREAKDOWN CARDS */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-slate-200 transition">
                           <div className="flex items-center gap-3 mb-4">
                               <div className="p-2 bg-white rounded-lg shadow-sm text-slate-900"><Wallet size={18}/></div>
                               <h4 className="font-black uppercase text-xs tracking-widest text-slate-500">Year 1 Snapshot</h4>
                           </div>
                           <div className="space-y-3">
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-500 font-medium">Mortgage Payment</span>
                                   <span className="font-bold text-slate-900">${projection[0].monthlyMortgagePayment.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-blue-600 font-medium">Inv. Loan Interest</span>
                                   <span className="font-bold text-blue-600">+${projection[0].monthlyHelocPayment.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                               </div>
                               <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Monthly</span>
                                   <span className="font-black text-xl text-slate-900">${projection[0].totalMonthlyPayment.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                               </div>
                           </div>
                       </div>

                       <div className="bg-green-50 rounded-2xl p-6 border border-green-100 hover:border-green-200 transition">
                           <div className="flex items-center gap-3 mb-4">
                               <div className="p-2 bg-white rounded-lg shadow-sm text-green-600"><TrendingUp size={18}/></div>
                               <h4 className="font-black uppercase text-xs tracking-widest text-green-700">Wealth Velocity</h4>
                           </div>
                           <div className="space-y-3">
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-green-800 font-medium">Est. Annual Tax Refund</span>
                                   <span className="font-bold text-green-700">+${projection[0].taxRefund.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-green-800/70 font-medium">Refund Reinvested?</span>
                                   <span className="font-bold text-green-700">{applyRefund ? "Yes (Accelerated)" : "No"}</span>
                               </div>
                               <div className="border-t border-green-200 pt-2">
                                   <p className="text-[10px] text-green-800 leading-tight">*Refund increases annually as your deductible loan balance grows.</p>
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* LEDGER TABLE */}
                   <div className="flex-grow overflow-hidden rounded-2xl border border-gray-100 shadow-lg flex flex-col">
                      <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                         <h4 className="font-black uppercase text-xs tracking-widest text-slate-500 flex items-center gap-2"><BarChart2 size={14}/> 30-Year Ledger</h4>
                      </div>
                      <div className="overflow-auto flex-grow h-[450px] custom-scrollbar bg-slate-50/50">
                         <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-white sticky top-0 shadow-sm z-10">
                               <tr>
                                  <th className="p-4 font-bold text-[9px] uppercase tracking-wider text-slate-400">Year</th>
                                  <th className="p-4 font-bold text-[9px] uppercase tracking-wider text-red-400">Mortgage Bal</th>
                                  <th className="p-4 font-bold text-[9px] uppercase tracking-wider text-blue-500">HELOC</th>
                                  <th className="p-4 font-bold text-[9px] uppercase tracking-wider text-green-600">Portfolio</th>
                                  <th className="p-4 font-bold text-[9px] uppercase tracking-wider text-orange-400 text-right">Tax Refund</th>
                                  {/* SPLIT PAYMENTS COLUMN */}
                                  <th className="p-4 font-bold text-[9px] uppercase tracking-wider text-slate-500 bg-slate-50 text-right border-l border-slate-100">Mortgage P&I</th>
                                  <th className="p-4 font-bold text-[9px] uppercase tracking-wider text-blue-500 bg-slate-50 text-right">HELOC Int.</th>
                                  <th className="p-4 font-bold text-[9px] uppercase tracking-wider text-slate-800 bg-slate-100 text-right">Total Pmt</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                               {projection.map((row) => (
                                  <tr key={row.year} className="hover:bg-white transition group">
                                     <td className="p-4 font-bold text-slate-400 group-hover:text-blue-600">{row.year}</td>
                                     <td className="p-4 font-bold text-slate-900">${row.mortgageBalance.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                     <td className="p-4 font-medium text-blue-600">
                                        ${row.deductibleLoan.toLocaleString(undefined, {maximumFractionDigits:0})}
                                        {row.isCapped && <span className="ml-1 text-[8px] bg-red-100 text-red-600 px-1 rounded font-bold">MAX</span>}
                                     </td>
                                     <td className="p-4 font-black text-green-600">${row.portfolioValue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                     <td className="p-4 font-medium text-orange-500 text-xs text-right">+${row.taxRefund.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                     <td className="p-4 font-medium text-slate-400 text-xs text-right border-l border-slate-100 bg-slate-50/50">${row.monthlyMortgagePayment.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                     <td className="p-4 font-bold text-blue-600 text-xs text-right bg-slate-50/50">${row.monthlyHelocPayment.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                     <td className="p-4 font-black text-slate-800 text-xs text-right bg-slate-100 group-hover:bg-blue-50 transition">${row.totalMonthlyPayment.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                   
                   {/* UPDATED CALL TO ACTION: JUMPS TO FORM */}
                   <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden text-center group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-20 transition duration-500"></div>
                      
                      <h3 className="relative z-10 text-2xl font-black uppercase tracking-tight mb-3">Is your mortgage tax-deductible?</h3>
                      <p className="relative z-10 text-blue-200 text-sm mb-8 max-w-xl mx-auto leading-relaxed">
                         The Smith Maneuver requires a specific type of "Readvanceable Mortgage" (e.g., TD FlexLine, Scotia STEP, Manulife One). 
                         Standard mortgages do not work. Let our team audit your current mortgage for eligibility.
                      </p>
                      
                      <div className="relative z-10 max-w-sm mx-auto">
                         <button 
                            onClick={scrollToForm}
                            className="flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition hover:scale-105 active:scale-95 shadow-xl w-full"
                         >
                            <Phone size={16} className="text-blue-600"/> Book Strategy Call
                         </button>
                         <p className="text-[10px] text-gray-500 mt-4">
                            *Consultation is free. No obligation.
                         </p>
                      </div>
                   </div>
               </>
           )}
        </div>

      </div>
    </div>
  );
}