'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingDown, AlertCircle, DollarSign, ArrowRight } from 'lucide-react';

export default function RefinanceCalculator() {
  // --- Property & Mortgage State ---
  const [homeValue, setHomeValue] = useState(1000000);
  const [currentMortgageBalance, setCurrentMortgageBalance] = useState(400000);
  const [currentMortgagePayment, setCurrentMortgagePayment] = useState(2400); // User's actual current payment
  
  // --- Refinance Settings ---
  const [newRate, setNewRate] = useState(5.29); // Conservative Refi Rate
  const [newAmortization, setNewAmortization] = useState(30); // Reset to 30 years to max cashflow

  // --- Debt Stack State ---
  const [debts, setDebts] = useState([
    { id: 1, name: 'Credit Card (Visa)', balance: 15000, payment: 450, rate: 19.99 },
    { id: 2, name: 'Car Loan', balance: 25000, payment: 620, rate: 8.99 },
    { id: 3, name: 'Line of Credit', balance: 10000, payment: 300, rate: 11.50 }
  ]);

  // --- Handlers ---
  const addDebt = () => {
    const newId = debts.length > 0 ? Math.max(...debts.map(d => d.id)) + 1 : 1;
    setDebts([...debts, { id: newId, name: 'New Debt', balance: 0, payment: 0, rate: 0 }]);
  };

  const updateDebt = (id: number, field: string, value: any) => {
    setDebts(debts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDebt = (id: number) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  // --- The Engine ---
  const calculation = useMemo(() => {
    // 1. Constraints
    const maxLTV = 0.80;
    const maxRefinanceAmount = homeValue * maxLTV;
    const equityAvailable = maxRefinanceAmount - currentMortgageBalance;

    // 2. Debt Totals
    const totalDebtBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalDebtMonthlyPayment = debts.reduce((sum, d) => sum + d.payment, 0);
    
    // 3. New Scenario
    const newMortgagePrincipal = currentMortgageBalance + totalDebtBalance;
    const isPossible = newMortgagePrincipal <= maxRefinanceAmount;

    // Calculate New Payment (PMT)
    const monthlyRate = newRate / 100 / 12; // Simple monthly compounding for estimate
    const numPayments = newAmortization * 12;
    let newMortgagePayment = 0;
    
    if (monthlyRate > 0) {
      newMortgagePayment = (newMortgagePrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
    }

    // 4. Savings Analysis
    const totalCurrentMonthlyOutflow = currentMortgagePayment + totalDebtMonthlyPayment;
    const monthlySavings = totalCurrentMonthlyOutflow - newMortgagePayment;
    const annualSavings = monthlySavings * 12;

    return {
      maxRefinanceAmount,
      equityAvailable,
      totalDebtBalance,
      newMortgagePrincipal,
      isPossible,
      newMortgagePayment,
      totalCurrentMonthlyOutflow,
      monthlySavings,
      annualSavings
    };
  }, [homeValue, currentMortgageBalance, currentMortgagePayment, newRate, newAmortization, debts]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="bg-black text-white p-8 md:p-10 text-center">
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Debt Consolidation Engine</h3>
        <p className="text-gray-400 text-sm font-medium">Merge your high-interest debts into one lower mortgage payment.</p>
      </div>

      <div className="flex flex-col xl:flex-row">
        
        {/* LEFT: Inputs */}
        <div className="w-full xl:w-7/12 p-8 md:p-12 space-y-10 bg-gray-50 border-r border-gray-100">
           
           {/* Section 1: Property & Mortgage */}
           <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-black border-b border-gray-200 pb-2">1. Your Property</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Estimated Home Value</label>
                    <input type="number" value={homeValue} onChange={e => setHomeValue(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Current Mtg Balance</label>
                    <input type="number" value={currentMortgageBalance} onChange={e => setCurrentMortgageBalance(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Current Monthly Payment</label>
                    <input type="number" value={currentMortgagePayment} onChange={e => setCurrentMortgagePayment(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">New Refinance Rate (%)</label>
                    <input type="number" step="0.01" value={newRate} onChange={e => setNewRate(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold focus:border-black outline-none" />
                 </div>
              </div>
           </div>

           {/* Section 2: Bad Debt Stack */}
           <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                 <h4 className="text-xs font-black uppercase tracking-widest text-red-600">2. Debts to Pay Off</h4>
                 <button onClick={addDebt} className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-bold uppercase tracking-wide hover:bg-gray-800 transition flex items-center gap-1">
                    <Plus size={12} /> Add Debt
                 </button>
              </div>
              
              <div className="space-y-3">
                 {debts.map((debt) => (
                    <div key={debt.id} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                       <div className="col-span-4 md:col-span-3">
                          <input type="text" placeholder="Name" value={debt.name} onChange={e => updateDebt(debt.id, 'name', e.target.value)} className="w-full text-xs font-bold border-none outline-none focus:ring-0 text-gray-700" />
                       </div>
                       <div className="col-span-3 md:col-span-3">
                          <label className="block text-[8px] font-bold text-gray-400 uppercase">Balance</label>
                          <input type="number" value={debt.balance} onChange={e => updateDebt(debt.id, 'balance', Number(e.target.value))} className="w-full text-sm font-bold border-none outline-none focus:ring-0" />
                       </div>
                       <div className="col-span-3 md:col-span-3">
                          <label className="block text-[8px] font-bold text-gray-400 uppercase">Monthly Pmt</label>
                          <input type="number" value={debt.payment} onChange={e => updateDebt(debt.id, 'payment', Number(e.target.value))} className="w-full text-sm font-bold border-none outline-none focus:ring-0 text-red-600" />
                       </div>
                       <div className="col-span-1 md:col-span-2 hidden md:block">
                          <label className="block text-[8px] font-bold text-gray-400 uppercase">Rate %</label>
                          <input type="number" value={debt.rate} onChange={e => updateDebt(debt.id, 'rate', Number(e.target.value))} className="w-full text-sm font-bold border-none outline-none focus:ring-0 text-gray-400" />
                       </div>
                       <div className="col-span-2 md:col-span-1 text-right">
                          <button onClick={() => removeDebt(debt.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

        </div>

        {/* RIGHT: Analysis Panel */}
        <div className="w-full xl:w-5/12 bg-white flex flex-col">
           
           <div className="p-8 md:p-12 flex-grow flex flex-col justify-center relative overflow-hidden">
              {/* Conditional Success/Fail State */}
              {calculation.isPossible ? (
                 <div className="space-y-8 relative z-10">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Monthly Savings</p>
                       <h2 className="text-6xl font-black text-green-500 tracking-tighter flex items-center gap-2">
                          <TrendingDown size={48} className="text-green-500" />
                          ${Math.round(calculation.monthlySavings).toLocaleString()}
                       </h2>
                       <p className="text-green-600 font-bold text-sm mt-2">
                          That's ${Math.round(calculation.annualSavings).toLocaleString()} extra cash in your pocket per year.
                       </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500 uppercase">Current Total Payments</span>
                          <span className="text-lg font-bold text-red-500 line-through decoration-2">${Math.round(calculation.totalCurrentMonthlyOutflow).toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-black uppercase">New Consolidated Payment</span>
                          <span className="text-xl font-black text-black">${Math.round(calculation.newMortgagePayment).toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                          <span>New Mortgage Balance</span>
                          <span>Max 80% LTV Limit</span>
                       </div>
                       <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-black rounded-full" 
                             style={{ width: `${(calculation.newMortgagePrincipal / calculation.maxRefinanceAmount) * 100}%` }}
                          ></div>
                       </div>
                       <div className="flex justify-between text-xs font-bold">
                          <span>${calculation.newMortgagePrincipal.toLocaleString()}</span>
                          <span>${calculation.maxRefinanceAmount.toLocaleString()}</span>
                       </div>
                    </div>

                    <button className="w-full py-4 bg-black text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition shadow-xl flex items-center justify-center gap-2">
                       Start Refinance Application <ArrowRight size={14} />
                    </button>
                 </div>
              ) : (
                 <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-red-50 rounded-full text-red-500 mb-2">
                       <AlertCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-black uppercase">Equity Limit Reached</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">
                       You cannot borrow more than 80% of your home's value ($ {calculation.maxRefinanceAmount.toLocaleString()}). Try removing some debts or increasing your home value estimate.
                    </p>
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}