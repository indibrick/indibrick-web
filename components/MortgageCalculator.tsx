'use client';

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lock, Unlock, Download, AlertCircle, TrendingUp, CheckCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';

type Frequency = 'Monthly' | 'Bi-Weekly' | 'Accelerated Bi-Weekly' | 'Weekly';

export default function MortgageCalculator() {
  // --- STATE ---
  const [price, setPrice] = useState(750000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [downPaymentAmount, setDownPaymentAmount] = useState(150000);
  const [rate, setRate] = useState(3.39); // Default to your lowest rate
  const [amortization, setAmortization] = useState(25);
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [isGated, setIsGated] = useState(true);
  const [view, setView] = useState<'Payment' | 'Schedule'>('Payment');

  // --- HANDLERS ---
  const handlePriceChange = (val: number) => {
    setPrice(val);
    setDownPaymentAmount(Math.round((downPaymentPercent / 100) * val));
  };

  const handleDownPayAmountChange = (val: number) => {
    setDownPaymentAmount(val);
    setDownPaymentPercent(Number(((val / price) * 100).toFixed(2)));
  };

  // --- THE CALCULATION ENGINE ---
  const calculation = useMemo(() => {
    // 1. CMHC Logic (High Ratio Insurance)
    let cmhcRate = 0;
    const mortgagePrincipal = price - downPaymentAmount;
    
    if (downPaymentPercent < 20) {
      if (downPaymentPercent >= 15) cmhcRate = 0.028;
      else if (downPaymentPercent >= 10) cmhcRate = 0.031;
      else cmhcRate = 0.040;
    }
    
    const cmhcPremium = downPaymentPercent < 20 ? mortgagePrincipal * cmhcRate : 0;
    const totalMortgage = mortgagePrincipal + cmhcPremium;

    // 2. ACTUAL PAYMENT CALCULATION (User's Scenario)
    const semiAnnualRate = Math.pow(1 + rate / 100 / 2, 2);
    
    let periodsPerYear = 12;
    if (frequency === 'Bi-Weekly' || frequency === 'Accelerated Bi-Weekly') periodsPerYear = 26;
    if (frequency === 'Weekly') periodsPerYear = 52;

    const periodicRate = Math.pow(semiAnnualRate, 1 / periodsPerYear) - 1;
    const totalPayments = amortization * periodsPerYear;

    let payment = 0;
    if (periodicRate > 0) {
      payment = (totalMortgage * periodicRate) / (1 - Math.pow(1 + periodicRate, -totalPayments));
    }

    if (frequency === 'Accelerated Bi-Weekly') {
      const monthlyPeriodic = Math.pow(semiAnnualRate, 1 / 12) - 1;
      const monthlyPaymentRaw = (totalMortgage * monthlyPeriodic) / (1 - Math.pow(1 + monthlyPeriodic, -(amortization * 12)));
      payment = monthlyPaymentRaw / 2;
    }

    // 3. QUALIFICATION LOGIC (Bank View)
    const stressRate = Math.max(5.25, rate + 2.0);
    const stressSemiAnnual = Math.pow(1 + stressRate / 100 / 2, 2);
    const stressMonthlyRate = Math.pow(stressSemiAnnual, 1 / 12) - 1;
    
    const qualAmortization = downPaymentPercent < 20 ? 25 : amortization; 
    const qualMonths = qualAmortization * 12;
    
    const stressMonthlyPayment = (totalMortgage * stressMonthlyRate) / (1 - Math.pow(1 + stressMonthlyRate, -qualMonths));

    const annualTax = price * 0.01; 
    const annualHeat = 150 * 12;
    const annualHousingCost = (stressMonthlyPayment * 12) + annualTax + annualHeat;
    
    const incomeRequired = annualHousingCost / 0.39;

    // 4. Schedule Data
    const scheduleData = [];
    let balance = totalMortgage;
    for (let year = 1; year <= amortization; year++) {
      let interestYear = 0;
      let principalYear = 0;
      for (let p = 0; p < periodsPerYear; p++) {
        if (balance <= 0) break;
        const interest = balance * periodicRate;
        const principal = payment - interest;
        balance -= principal;
        interestYear += interest;
        principalYear += principal;
      }
      scheduleData.push({
        year: `Year ${year}`,
        Balance: Math.max(0, Math.round(balance)),
        Interest: Math.round(interestYear),
        Principal: Math.round(principalYear),
      });
    }

    return {
      payment,
      cmhcPremium,
      totalMortgage,
      stressRate,
      schedule: scheduleData,
      incomeRequired
    };
  }, [price, downPaymentAmount, downPaymentPercent, rate, amortization, frequency]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col xl:flex-row">
      
      {/* LEFT: INPUTS */}
      <div className="w-full xl:w-5/12 p-8 md:p-12 bg-gray-50 border-r border-gray-100 space-y-8">
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Property Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => handlePriceChange(Number(e.target.value))} 
                className="w-full pl-8 pr-4 py-4 bg-white border border-gray-200 rounded-xl font-black text-lg focus:ring-2 focus:ring-black outline-none transition" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Down Payment ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                <input 
                  type="number" 
                  value={downPaymentAmount} 
                  onChange={(e) => handleDownPayAmountChange(Number(e.target.value))} 
                  className="w-full pl-8 pr-4 py-4 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:border-black" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Percent (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={downPaymentPercent} 
                  onChange={(e) => { setDownPaymentPercent(Number(e.target.value)); setDownPaymentAmount(Math.round((Number(e.target.value) / 100) * price)); }} 
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:border-black" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Rate (%)</label>
              <input 
                type="number" 
                step="0.01" 
                value={rate} 
                onChange={(e) => setRate(Number(e.target.value))} 
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:border-black" 
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Amortization</label>
              <select 
                value={amortization} 
                onChange={(e) => setAmortization(Number(e.target.value))} 
                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:border-black appearance-none"
              >
                {[15, 20, 25, 30].map(y => <option key={y} value={y}>{y} Years</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Payment Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {['Monthly', 'Bi-Weekly', 'Accelerated Bi-Weekly', 'Weekly'].map((freq) => (
                <button 
                  key={freq} 
                  onClick={() => setFrequency(freq as Frequency)} 
                  className={`py-3 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${frequency === freq ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-black'}`}
                >
                  {freq.replace('Bi-Weekly', 'Bi-Wk')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {downPaymentPercent < 20 && (
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
              <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                 <p className="text-xs font-bold text-blue-900 mb-1">High Ratio Mortgage</p>
                 <p className="text-[10px] text-blue-800 leading-relaxed">
                    Because your down payment is under 20%, <strong>${Math.round(calculation.cmhcPremium).toLocaleString()}</strong> in CMHC insurance has been added to your loan.
                 </p>
              </div>
           </div>
        )}

      </div>

      {/* RIGHT: RESULTS */}
      <div className="w-full xl:w-7/12 bg-white flex flex-col">
         
         <div className="flex border-b border-gray-100">
            <button onClick={() => setView('Payment')} className={`flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] transition ${view === 'Payment' ? 'bg-white text-black border-b-2 border-black' : 'bg-gray-50 text-gray-400'}`}>Payment Breakdown</button>
            <button onClick={() => setView('Schedule')} className={`flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] transition ${view === 'Schedule' ? 'bg-white text-black border-b-2 border-black' : 'bg-gray-50 text-gray-400'}`}>Amortization Curve</button>
         </div>

         <div className="flex-grow p-8 md:p-12 flex flex-col justify-center relative">
            
            {view === 'Payment' && (
              <div className="space-y-10 text-center animate-fade-in">
                 
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your {frequency} Payment</p>
                    <h2 className="text-5xl md:text-7xl font-black text-black tracking-tighter">
                       ${calculation.payment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h2>
                    {calculation.cmhcPremium > 0 && <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Total Loan: ${calculation.totalMortgage.toLocaleString()}</p>}
                 </div>

                 <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                    <div className="flex items-center justify-center gap-2 mb-4">
                       <p className="text-xs font-black uppercase tracking-widest text-gray-500">Income Required to Qualify</p>
                       <HelpCircle size={12} className="text-gray-400" />
                    </div>
                    <p className="text-3xl font-black text-slate-900 mb-2">
                       ~${Math.round(calculation.incomeRequired).toLocaleString()} / yr
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
                       Based on 39% GDS Ratio at the Stress Test Rate of <strong>{calculation.stressRate.toFixed(2)}%</strong>.
                    </p>
                 </div>

                 {/* --- ALTERNATIVE LENDING CTA (Redirects to New Page) --- */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <Link href="/rates" className="bg-green-50 p-4 rounded-xl border border-green-100 cursor-pointer hover:bg-green-100 transition group">
                       <div className="flex items-center gap-2 mb-1">
                          <CheckCircle size={16} className="text-green-600"/>
                          <p className="text-xs font-black uppercase text-green-900">I make this income</p>
                       </div>
                       <p className="text-[10px] text-green-800">Great! You likely qualify for "A" rates.</p>
                       <span className="text-[10px] font-bold underline mt-2 block group-hover:text-green-700">Get Pre-Approved &rarr;</span>
                    </Link>
                    
                    <Link href="/bad-credit-private-mortgages" className="bg-orange-50 p-4 rounded-xl border border-orange-100 cursor-pointer hover:bg-orange-100 transition group block">
                       <div className="flex items-center gap-2 mb-1">
                          <AlertCircle size={16} className="text-orange-600"/>
                          <p className="text-xs font-black uppercase text-orange-900">Income too high?</p>
                       </div>
                       <p className="text-[10px] text-orange-800">Don't stress. We have lenders with flexible ratios.</p>
                       <span className="text-[10px] font-bold underline mt-2 block group-hover:text-orange-700">View Alternative Solutions &rarr;</span>
                    </Link>
                 </div>

              </div>
            )}

            {view === 'Schedule' && (
              <div className="h-full flex flex-col animate-fade-in">
                 <div className="relative flex-grow min-h-[300px] w-full">
                    {isGated ? (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
                         <Lock className="w-12 h-12 text-black mb-4" />
                         <h4 className="text-xl font-black uppercase tracking-tight mb-2">Unlock 25-Year Report</h4>
                         <p className="text-gray-500 mb-6 text-sm max-w-xs">See exactly how much interest you save with {frequency} payments.</p>
                         <button onClick={() => setIsGated(false)} className="bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 shadow-xl">
                            Reveal Data
                         </button>
                      </div>
                    ) : null}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={calculation.schedule} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#000000" stopOpacity={0.8}/><stop offset="95%" stopColor="#000000" stopOpacity={0}/></linearGradient>
                          <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/><stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/></linearGradient>
                        </defs>
                        <XAxis dataKey="year" hide /><YAxis hide /><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                        <Area type="monotone" dataKey="Principal" stroke="#000000" fillOpacity={1} fill="url(#colorPrincipal)" />
                        <Area type="monotone" dataKey="Interest" stroke="#82ca9d" fillOpacity={1} fill="url(#colorInterest)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 {!isGated && (
                    <div className="mt-6 text-center">
                       <p className="text-xs text-green-600 font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                          <Unlock size={14} /> Full Data Unlocked
                       </p>
                       <div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-4 rounded-xl">
                          <div>
                             <p className="text-[9px] font-bold text-gray-400 uppercase">Total Interest (25 Yr)</p>
                             <p className="text-lg font-black">${calculation.schedule.reduce((acc, cur) => acc + cur.Interest, 0).toLocaleString()}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-gray-400 uppercase">Principal Paid</p>
                             <p className="text-lg font-black">${calculation.schedule.reduce((acc, cur) => acc + cur.Principal, 0).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            )}
         </div>
      </div>
    </div>
  );
}