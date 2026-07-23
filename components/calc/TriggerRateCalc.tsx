'use client';

import React, { useState, useMemo } from 'react';
import { calculatePayment, calculateTriggerRate, formatCAD, formatPercent } from '../../lib/mortgageEngine';
import { CurrencyInput, PercentInput, NumberInput, SliderInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function TriggerRateCalc() {
  const [balance, setBalance] = useState(500_000);
  const [originalRate, setOriginalRate] = useState(2.65);
  const [originalAmort, setOriginalAmort] = useState(25);
  const [currentPrimeRate, setCurrentPrimeRate] = useState(7.20);
  const [discount, setDiscount] = useState(0.90);

  const result = useMemo(() => {
    // Fixed-payment variable: monthly payment stays constant, interest rate floats.
    const monthlyPayment = calculatePayment(balance, originalRate, originalAmort, 'monthly');
    const triggerRate = calculateTriggerRate({ currentBalance: balance, monthlyPayment });
    const currentContractRate = currentPrimeRate - discount;
    const distanceToTrigger = triggerRate - currentContractRate;

    // If already at trigger, calculate the payment shock needed to get back to normal amort.
    const shockedPayment = calculatePayment(balance, currentContractRate, originalAmort, 'monthly');
    const paymentShock = shockedPayment - monthlyPayment;

    return { monthlyPayment, triggerRate, currentContractRate, distanceToTrigger, shockedPayment, paymentShock };
  }, [balance, originalRate, originalAmort, currentPrimeRate, discount]);

  const atTrigger = result.currentContractRate >= result.triggerRate;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Your Variable Mortgage</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Current Mortgage Balance" value={balance} onChange={setBalance} step={5000} />
        <SliderInput label="Original Contract Rate" value={originalRate} onChange={setOriginalRate} min={1} max={6} step={0.01} format={n => `${n.toFixed(2)}%`} helpText="the rate you had at origination" />
        <SliderInput label="Original Amortization" value={originalAmort} onChange={setOriginalAmort} min={15} max={35} step={1} format={n => `${n} yrs`} />
        <SliderInput label="Current Prime Rate" value={currentPrimeRate} onChange={setCurrentPrimeRate} min={2} max={12} step={0.05} format={n => `${n.toFixed(2)}%`} />
        <SliderInput label="Your Prime Discount" value={discount} onChange={setDiscount} min={0} max={2} step={0.05} format={n => `Prime − ${n.toFixed(2)}`} />

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-900">
          <p className="font-black mb-1">Fixed-payment variable</p>
          <p>This calc assumes your payment stayed fixed as rates rose (the most common variable structure). If your payment auto-adjusted with rates, you have less to worry about — check with your lender.</p>
        </div>
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Your Trigger Rate"
            value={`${result.triggerRate.toFixed(2)}%`}
            sublabel="At this rate, your payment stops covering the interest"
            accent={atTrigger ? 'red' : 'amber'}
          />
          <ResultCard
            label={atTrigger ? 'AT / PAST TRIGGER' : 'Distance to Trigger'}
            value={atTrigger ? '⚠ Now' : `${result.distanceToTrigger.toFixed(2)}%`}
            sublabel={`Current contract rate: ${result.currentContractRate.toFixed(2)}%`}
            accent={atTrigger ? 'red' : 'emerald'}
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Payment shock to restore normal amortization</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">If your lender resets your payment</h3>
          <div className="space-y-1">
            <ResultRow label="Original monthly payment" value={formatCAD(result.monthlyPayment)} />
            <ResultRow label="Restored monthly payment (at current rate)" value={formatCAD(result.shockedPayment)} color="text-red-600" />
            <ResultRow label="Monthly payment shock" value={`+${formatCAD(result.paymentShock)}`} emphasis color="text-red-600" />
            <ResultRow label="Annual payment shock" value={`+${formatCAD(result.paymentShock * 12)}`} color="text-red-600" />
          </div>
        </div>

        {atTrigger && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-2">You are at or past trigger</p>
            <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-3">Your options</h3>
            <ol className="space-y-2 text-sm text-slate-700 leading-relaxed list-decimal list-inside">
              <li><strong className="text-slate-900">Increase your payment</strong> to at least cover interest — prevents negative amortization.</li>
              <li><strong className="text-slate-900">Make a lump-sum principal payment</strong> — reduces the balance the trigger is calculated against.</li>
              <li><strong className="text-slate-900">Switch to a fixed rate</strong> — locks your payment at a predictable level. Talk to a broker about the fixed vs stay-variable math.</li>
              <li><strong className="text-slate-900">Extend amortization</strong> — some lenders will re-amortize back to 25/30 years, reducing the payment. Contact your lender.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
