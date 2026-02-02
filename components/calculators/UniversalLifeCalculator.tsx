'use client';

import React, { useState, useMemo } from 'react';
import LeadForm from '../LeadForm';
import { Shield, Lock, TrendingUp, DollarSign, AlertTriangle, User, Cigarette, CheckCircle, Info } from 'lucide-react';

// --- TYPES ---
type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';

const FREQUENCY_MULTIPLIERS: Record<Frequency, number> = {
  'weekly': 52,
  'bi-weekly': 26,
  'monthly': 12,
  'yearly': 1
};

// --- ACTUARIAL MATH ENGINE ---
const calculateULProjection = (
  startAge: number,
  faceAmount: number,
  contributionAmount: number,
  frequency: Frequency,
  yearsToPay: number,
  returnRate: number,
  isSmoker: boolean
) => {
  let currentAge = startAge;
  let cashValue = 0;
  let totalPremiums = 0;
  const results = [];

  // 1. Annualize Contribution
  const annualDeposit = contributionAmount * FREQUENCY_MULTIPLIERS[frequency];

  // 2. Constants
  const PREMIUM_TAX = 0.02; // 2% Prov Tax
  const ADMIN_FEE = 120; // $120/yr Policy Fee
  
  // 3. Investment Bonus
  const BONUS_RATE = 1.50; 
  const BONUS_START_YEAR = 10;

  // 4. YRT COST CURVE
  const getYRT_Rate = (age: number) => {
      if (age < 30) return 0.50 + ((age - 10) * 0.02); 
      if (age < 45) return 0.90 + ((age - 30) * 0.06); 
      if (age < 60) return 1.80 + ((age - 45) * 0.22); 
      if (age < 75) return 5.50 * Math.pow(1.09, (age - 60)); 
      if (age < 85) return 20.0 * Math.pow(1.10, (age - 75)); 
      return 60.0 * Math.pow(1.11, (age - 85)); 
  };

  const yearsToProject = 100 - startAge;

  for (let year = 1; year <= yearsToProject + 1; year++) {
    const isPaying = year <= yearsToPay;
    const premiumIn = isPaying ? annualDeposit : 0;
    
    // A. Net Premium
    const netPremium = premiumIn * (1 - PREMIUM_TAX); 
    
    // B. Add to Cash Value
    cashValue += netPremium;
    totalPremiums += premiumIn;

    // C. Deduct Admin Fee (Forever)
    cashValue -= ADMIN_FEE;

    // D. Deduct Cost of Insurance (FOREVER)
    const rawRate = getYRT_Rate(currentAge);
    const smokerLoad = isSmoker ? 2.1 : 1.0;
    const annualCOI = (faceAmount / 1000) * rawRate * smokerLoad;
    
    cashValue -= annualCOI;

    // E. Investment Growth
    let appliedRate = returnRate;
    if (year >= BONUS_START_YEAR) {
        appliedRate += BONUS_RATE; // Wealth Bonus
    }

    if (cashValue > 0) {
        const growth = cashValue * (appliedRate / 100);
        cashValue += growth;
    } else {
        cashValue = 0;
    }

    // F. Total Death Benefit
    const deathBenefit = faceAmount + cashValue;

    results.push({
      age: currentAge,
      year,
      premium: premiumIn,
      totalPremiums,
      coi: annualCOI,
      cashValue,
      deathBenefit,
      isLapsed: cashValue <= 0 && year > 2
    });

    currentAge++;
  }

  return results;
};

export default function UniversalLifeCalculator() {
  // --- INPUTS ---
  const [age, setAge] = useState(24);
  const [isSmoker, setIsSmoker] = useState(false);
  
  const [faceAmount, setFaceAmount] = useState(500000); 
  const [contributionAmount, setContributionAmount] = useState(200); 
  const [frequency, setFrequency] = useState<Frequency>('monthly'); 
  const [paymentYears, setPaymentYears] = useState(20); 
  const [returnRate, setReturnRate] = useState(7.3); 
  
  const [viewAge, setViewAge] = useState(100); 

  // --- CALCULATIONS ---
  const projection = useMemo(() => {
    return calculateULProjection(
      age, faceAmount, contributionAmount, frequency, paymentYears, returnRate, isSmoker
    );
  }, [age, faceAmount, contributionAmount, frequency, paymentYears, returnRate, isSmoker]);

  // Snapshot
  const snapshotCurrent = projection.find(p => p.age === viewAge) || projection[projection.length - 1];
  const netGain = snapshotCurrent.deathBenefit - snapshotCurrent.totalPremiums;
  const isUnderfunded = snapshotCurrent.isLapsed;

  const faceAmountOptions = [100000, 250000, 500000, 1000000, 1500000, 2000000, 5000000];

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="bg-gray-900 text-white p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
           <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-green-500 text-black text-[10px] font-black uppercase px-2 py-1 rounded">Actuarial Mode</span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Tax-Exempt Growth</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight flex items-center gap-3">
                 <Lock className="text-green-400" size={36} /> Family Asset Plan
              </h2>
           </div>
           
           <div className="text-right bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Cash Value (Age {viewAge})</p>
              {isUnderfunded ? (
                 <div className="text-red-400 font-bold flex items-center justify-end gap-2 text-xl"><AlertTriangle size={24}/> Lapsed</div>
              ) : (
                 <div className="text-4xl md:text-6xl font-black text-blue-400 tracking-tighter">
                   ${snapshotCurrent.cashValue.toLocaleString(undefined, {maximumFractionDigits:0})}
                 </div>
              )}
              <div className="flex justify-end items-center gap-4 mt-2">
                 <p className="text-[10px] text-gray-400 uppercase font-bold">Paid: <span className="text-white">${snapshotCurrent.totalPremiums.toLocaleString()}</span></p>
                 <p className="text-[10px] text-gray-400 uppercase font-bold">Total Payout: <span className="text-green-400">${snapshotCurrent.deathBenefit.toLocaleString(undefined, {maximumFractionDigits:0})}</span></p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT: CONTROLS */}
        <div className="lg:col-span-4 p-8 bg-gray-50 border-r border-gray-100 flex flex-col gap-8">
           
           {/* 1. PROFILE */}
           <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h4 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-4 flex items-center gap-2"><User size={14}/> Client Profile</h4>
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-500">Age</label>
                    <div className="flex items-center gap-3">
                       <button onClick={() => setAge(Math.max(0, age - 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-black hover:text-white transition font-bold">-</button>
                       <span className="font-black text-xl">{age}</span>
                       <button onClick={() => setAge(Math.min(75, age + 1))} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-black hover:text-white transition font-bold">+</button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2"><Cigarette size={14} className="text-gray-400" /><label className="text-[10px] font-bold text-gray-500">Smoker?</label></div>
                     <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setIsSmoker(false)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition ${!isSmoker ? 'bg-white shadow text-black' : 'text-gray-400'}`}>No</button>
                        <button onClick={() => setIsSmoker(true)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition ${isSmoker ? 'bg-black text-white shadow' : 'text-gray-400'}`}>Yes</button>
                     </div>
                  </div>
              </div>
           </div>

           {/* 2. CONTRIBUTION */}
           <div className="space-y-4">
              <h4 className="font-black uppercase text-xs tracking-widest text-gray-400 flex items-center gap-2"><DollarSign size={14}/> Contribution</h4>
              <div>
                 <label className="text-xs font-bold text-gray-500 mb-1 block">Amount</label>
                 <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <DollarSign size={14} className="absolute left-3 top-3.5 text-gray-400" />
                        <input type="number" step="50" value={contributionAmount} onChange={e => setContributionAmount(Number(e.target.value))} className="w-full pl-8 p-3 bg-white rounded-xl font-bold border border-gray-200 shadow-sm outline-none" />
                    </div>
                    <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} className="bg-white rounded-xl font-bold border border-gray-200 px-4 text-sm outline-none">
                       <option value="weekly">Weekly</option>
                       <option value="bi-weekly">Bi-Weekly</option>
                       <option value="monthly">Monthly</option>
                       <option value="yearly">Yearly</option>
                    </select>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-500">Payment Years</label><span className="text-xs font-black bg-black text-white px-2 py-1 rounded">{paymentYears} Years</span></div>
                 <input type="range" min="10" max="40" step="1" value={paymentYears} onChange={e => setPaymentYears(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
              </div>
           </div>

           {/* 3. SETTINGS */}
           <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="font-black uppercase text-xs tracking-widest text-gray-400 flex items-center gap-2"><Lock size={14}/> Setup</h4>
              <div>
                 <label className="text-xs font-bold text-gray-500 mb-1 block">Insurance Coverage</label>
                 <select value={faceAmount} onChange={e => setFaceAmount(Number(e.target.value))} className="w-full p-3 bg-white rounded-xl font-bold border border-gray-200 shadow-sm outline-none">
                     {faceAmountOptions.map((opt) => (<option key={opt} value={opt}>${(opt/1000).toFixed(0)}k (${opt.toLocaleString()})</option>))}
                 </select>
              </div>
              <div>
                 <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-500">Interest Rate</label><span className="text-xs font-black">{returnRate}%</span></div>
                 <input type="range" min="4" max="9" step="0.1" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
              </div>
              <div>
                 <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-500">View Age</label><span className="text-xs font-black text-blue-600">Age {viewAge}</span></div>
                 <input type="range" min={age + 1} max="100" step="1" value={viewAge} onChange={e => setViewAge(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
           </div>
        </div>

        {/* RIGHT: ANALYSIS */}
        <div className="lg:col-span-8 p-8 md:p-12 bg-white flex flex-col gap-8">
           {isUnderfunded && (
             <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700 font-bold">Policy Lapse Risk: Funding insufficient to cover late-stage costs.</p>
             </div>
           )}

           <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isUnderfunded ? 'opacity-50' : ''}`}>
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Total Cash Value</p>
                 <p className="text-3xl font-black text-blue-900 mb-1">${snapshotCurrent.cashValue.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                 <p className="text-[10px] font-bold text-blue-400">Your Liquidity</p>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">Total Death Benefit</p>
                 <p className="text-3xl font-black text-green-700 mb-1">${snapshotCurrent.deathBenefit.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                 <p className="text-[10px] font-bold text-green-600">Tax-Free Payout</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Profit Multiplier</p>
                 <p className="text-3xl font-black text-gray-500 mb-1">{(snapshotCurrent.deathBenefit / snapshotCurrent.totalPremiums).toFixed(1)}x</p>
                 <p className="text-[10px] font-bold text-gray-400">Return on Capital</p>
              </div>
           </div>

           {/* VISUAL LEDGER (COI Column Removed) */}
           <div className={`overflow-hidden rounded-2xl border border-gray-100 shadow-sm ${isUnderfunded ? 'opacity-50' : ''}`}>
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                 <h4 className="font-black uppercase text-xs tracking-widest text-gray-500">Projection (To Age 100)</h4>
                 <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                    <CheckCircle size={10} /> Projected Values
                 </div>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-white sticky top-0 shadow-sm z-10">
                       <tr>
                          <th className="p-4 font-bold text-xs uppercase text-gray-400">Age</th>
                          <th className="p-4 font-bold text-xs uppercase text-gray-400">Total Premium</th>
                          <th className="p-4 font-bold text-xs uppercase text-blue-600">Cash Value</th>
                          <th className="p-4 font-bold text-xs uppercase text-green-600">Death Benefit</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {projection.map((row) => (
                          <tr key={row.age} className={`hover:bg-gray-50 transition ${row.age === viewAge ? 'bg-yellow-50 ring-1 ring-inset ring-yellow-200' : ''}`}>
                             <td className="p-4 font-bold text-gray-500">{row.age}</td>
                             <td className="p-4 font-medium text-gray-900">${row.totalPremiums.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                             {/* COI Column Removed from View, Logic Remains in State */}
                             <td className="p-4 font-bold text-blue-900">${row.cashValue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                             <td className="p-4 font-black text-green-600">${row.deathBenefit.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* FINAL DISCLOSURE */}
           <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                  <Info size={14} className="text-blue-500"/>
                  <span className="text-xs font-bold text-blue-800 uppercase">Important Note</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed max-w-3xl mx-auto mb-6">
                 This calculator is for educational purposes only and provides hypothetical projections based on constant assumptions (e.g., {returnRate}% return). 
                 These figures are estimates and not guaranteed. Actual policy values will vary based on carrier performance, dividend scales, and age.
                 Please contact our advisors for an official carrier illustration.
              </p>
              <div className="max-w-md mx-auto">
                <LeadForm type="Insurance" title="Get Official Illustration" subtitle="Our advisors will create a compliant PDF." />
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}