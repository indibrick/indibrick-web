'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, HelpCircle, TrendingDown, DollarSign, Calculator, RefreshCw } from 'lucide-react';

export default function PenaltyCalculator() {
  const [mortgageType, setMortgageType] = useState<'fixed' | 'variable'>('fixed');
  const [balance, setBalance] = useState(450000);
  const [currentRate, setCurrentRate] = useState(4.79);
  const [currentPostedRate, setCurrentPostedRate] = useState(4.29); // Comparison rate for remaining term
  const [monthsLeft, setMonthsLeft] = useState(36);
  const [result, setResult] = useState({ penalty: 0, method: '' });

  useEffect(() => {
    calculatePenalty();
  }, [mortgageType, balance, currentRate, currentPostedRate, monthsLeft]);

  const calculatePenalty = () => {
    // 1. Calculate 3 Months Interest (Standard for Variable, Minimum for Fixed)
    const threeMonthsInterest = (balance * (currentRate / 100)) / 4;

    if (mortgageType === 'variable') {
      setResult({ 
        penalty: Math.round(threeMonthsInterest), 
        method: '3 Months Interest' 
      });
      return;
    }

    // 2. Calculate IRD (Only for Fixed)
    // Formula: Balance * (YourRate - CurrentRate) * (TimeRemaining)
    const rateDifference = Math.max(0, currentRate - currentPostedRate);
    const yearsRemaining = monthsLeft / 12;
    const irdAmount = balance * (rateDifference / 100) * yearsRemaining;

    // 3. Determine the Greater Amount
    if (irdAmount > threeMonthsInterest) {
      setResult({ 
        penalty: Math.round(irdAmount), 
        method: 'Interest Rate Differential (IRD)' 
      });
    } else {
      setResult({ 
        penalty: Math.round(threeMonthsInterest), 
        method: '3 Months Interest (IRD was lower)' 
      });
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative">
      {/* Header */}
      <div className="bg-slate-900 p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 bg-red-500 rounded-lg text-white"><AlertTriangle size={20} /></div>
           <h3 className="text-xl font-black uppercase tracking-widest">Penalty Estimator</h3>
        </div>
        <p className="text-gray-400 text-sm font-medium">
           Banks charge a fee to break your contract early. Calculate the damage below.
        </p>
      </div>

      <div className="p-8 md:p-10">
        
        {/* Toggle Switch */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
           <button 
             onClick={() => setMortgageType('fixed')}
             className={`flex-1 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${
               mortgageType === 'fixed' ? 'bg-white shadow-md text-black' : 'text-gray-400 hover:text-gray-600'
             }`}
           >
             Fixed Rate
           </button>
           <button 
             onClick={() => setMortgageType('variable')}
             className={`flex-1 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${
               mortgageType === 'variable' ? 'bg-white shadow-md text-black' : 'text-gray-400 hover:text-gray-600'
             }`}
           >
             Variable Rate
           </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
           <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
                 Mortgage Balance <HelpCircle size={10} />
              </label>
              <div className="relative">
                 <DollarSign size={16} className="absolute top-4 left-4 text-gray-400"/>
                 <input 
                    type="number" 
                    value={balance} 
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 font-black text-lg focus:outline-none focus:ring-2 focus:ring-black transition"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Current Interest Rate %</label>
              <input 
                 type="number" 
                 step="0.01"
                 value={currentRate} 
                 onChange={(e) => setCurrentRate(Number(e.target.value))}
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 font-black text-lg focus:outline-none focus:ring-2 focus:ring-black transition"
              />
           </div>

           {mortgageType === 'fixed' && (
             <>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Months Remaining</label>
                  <input 
                     type="number" 
                     value={monthsLeft} 
                     onChange={(e) => setMonthsLeft(Number(e.target.value))}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 font-black text-lg focus:outline-none focus:ring-2 focus:ring-black transition"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
                     Comparison Rate % <HelpCircle size={10} className="text-gray-400" />
                  </label>
                  <input 
                     type="number" 
                     step="0.01"
                     value={currentPostedRate} 
                     onChange={(e) => setCurrentPostedRate(Number(e.target.value))}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 font-black text-lg focus:outline-none focus:ring-2 focus:ring-black transition"
                  />
                  <p className="text-[9px] text-gray-400 font-medium">Current posted rate for similar term.</p>
               </div>
             </>
           )}
        </div>

        {/* Result Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-20 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
           
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Estimated Break Fee</p>
           <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-2 tracking-tighter">
             ${result.penalty.toLocaleString()}
           </h2>
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Calculation: {result.method}
              </p>
           </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 font-medium mb-4">
               Don't pay this out of pocket. We can usually add this to your new mortgage.
            </p>
            <a href="/contact" className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition shadow-lg">
               <RefreshCw size={16} /> Strategy: Refinance & Save
            </a>
        </div>
      </div>
    </div>
  );
}