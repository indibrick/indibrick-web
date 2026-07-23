'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateAffordability, stressTestRate, formatCAD, formatPercent,
} from '../../lib/mortgageEngine';
import { CurrencyInput, PercentInput, SliderInput, ToggleInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function AffordabilityCalc() {
  const [income, setIncome] = useState(120_000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [downPayment, setDownPayment] = useState(80_000);
  const [rate, setRate] = useState(4.29);
  const [amortYears, setAmortYears] = useState(25);
  const [useStressTest, setUseStressTest] = useState(true);
  const [propertyType, setPropertyType] = useState<'house' | 'condo'>('house');

  const result = useMemo(() => {
    const condoFeesMonthly = propertyType === 'condo' ? 400 : 0;
    return calculateAffordability({
      householdIncome: income,
      monthlyDebts,
      downPayment,
      contractRatePercent: rate,
      amortYears,
      condoFeesMonthly,
      useStressTest,
    });
  }, [income, monthlyDebts, downPayment, rate, amortYears, useStressTest, propertyType]);

  // Also compute at contract rate (no stress) for comparison.
  const contractResult = useMemo(() => calculateAffordability({
    householdIncome: income,
    monthlyDebts,
    downPayment,
    contractRatePercent: rate,
    amortYears,
    condoFeesMonthly: propertyType === 'condo' ? 400 : 0,
    useStressTest: false,
  }), [income, monthlyDebts, downPayment, rate, amortYears, propertyType]);

  const qualifyingRate = stressTestRate(rate);
  const downPct = result.maxPurchasePrice > 0 ? (downPayment / result.maxPurchasePrice) * 100 : 0;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Your Financial Picture</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Household Income (annual)" value={income} onChange={setIncome} step={5000} />
        <CurrencyInput label="Monthly Debt Payments" value={monthlyDebts} onChange={setMonthlyDebts} step={50} helpText="car, LOC, credit card minimums" />
        <CurrencyInput label="Down Payment Ready" value={downPayment} onChange={setDownPayment} step={5000} />
        <SliderInput label="Interest Rate" value={rate} onChange={setRate} min={1} max={12} step={0.01} format={n => `${n.toFixed(2)}%`} />
        <SliderInput label="Amortization" value={amortYears} onChange={setAmortYears} min={5} max={35} step={1} format={n => `${n} yrs`} />

        <ToggleInput
          label="Property Type"
          value={propertyType}
          onChange={setPropertyType}
          options={[
            { value: 'house', label: 'House' },
            { value: 'condo', label: 'Condo' },
          ]}
        />

        <ToggleInput
          label="Stress Test"
          value={useStressTest ? 'on' : 'off'}
          onChange={v => setUseStressTest(v === 'on')}
          options={[
            { value: 'on', label: 'On (A-Lender)' },
            { value: 'off', label: 'Off (B-Lender)' },
          ]}
          helpText={useStressTest ? `qualifying at ${qualifyingRate.toFixed(2)}%` : `qualifying at ${rate.toFixed(2)}%`}
        />

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900">
          <p className="font-black mb-1">B-20 stress test</p>
          <p>Federally regulated A-lenders (Big 6, monolines) must qualify you at the greater of contract rate + 2% or 5.25%. B-lenders and credit unions have looser rules.</p>
        </div>
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Max Purchase Price"
            value={formatCAD(result.maxPurchasePrice)}
            sublabel={`Down payment: ${formatCAD(downPayment)} (${downPct.toFixed(1)}%)`}
            accent="slate"
          />
          <ResultCard
            label="Max Mortgage Amount"
            value={formatCAD(result.maxMortgage)}
            sublabel={`${useStressTest ? `Qualified at ${qualifyingRate.toFixed(2)}%` : `Qualified at contract ${rate.toFixed(2)}%`}`}
            accent="emerald"
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Ratio Health</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">Where you stand</h3>
          <div className="space-y-3">
            {/* GDS bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">GDS (Gross Debt Service)</span>
                <span className={`tabular-nums ${result.gdsUsed > 0.39 ? 'text-red-600' : 'text-emerald-700'}`}>{(result.gdsUsed * 100).toFixed(1)}% / 39%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${result.gdsUsed > 0.39 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (result.gdsUsed / 0.39) * 100)}%` }} />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Housing costs ÷ income</p>
            </div>
            {/* TDS bar */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">TDS (Total Debt Service)</span>
                <span className={`tabular-nums ${result.tdsUsed > 0.44 ? 'text-red-600' : 'text-emerald-700'}`}>{(result.tdsUsed * 100).toFixed(1)}% / 44%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${result.tdsUsed > 0.44 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (result.tdsUsed / 0.44) * 100)}%` }} />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Housing + all other debts ÷ income</p>
            </div>
          </div>
        </div>

        {/* Rate scenarios — how much house at three different rates */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Rate Sensitivity</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">How much house at 3 different rates</h3>
          <div className="grid grid-cols-3 gap-3">
            {[rate - 1, rate, rate + 1].map(r => {
              const s = calculateAffordability({
                householdIncome: income,
                monthlyDebts,
                downPayment,
                contractRatePercent: r,
                amortYears,
                condoFeesMonthly: propertyType === 'condo' ? 400 : 0,
                useStressTest,
              });
              const isCurrent = Math.abs(r - rate) < 0.001;
              return (
                <div key={r} className={`rounded-2xl p-4 border ${isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCurrent ? 'text-blue-700' : 'text-gray-500'}`}>
                    at {r.toFixed(2)}%
                  </p>
                  <p className={`text-lg md:text-xl font-black tracking-tight ${isCurrent ? 'text-slate-900' : 'text-slate-700'} tabular-nums`}>
                    {formatCAD(s.maxPurchasePrice)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Summary</p>
          <div className="mt-2 space-y-1">
            <ResultRow label="Qualifying rate used" value={formatPercent(useStressTest ? qualifyingRate : rate)} />
            <ResultRow label="Monthly payment (at max)" value={formatCAD(result.monthlyPaymentAtMax)} />
            <ResultRow label="Est. total monthly housing cost" value={formatCAD(result.monthlyPaymentAtMax + (result.maxPurchasePrice * 0.0075) / 12 + 150 + (propertyType === 'condo' ? 200 : 0))} />
            <ResultRow label="Max mortgage vs contract-rate max" value={`${formatCAD(result.maxMortgage - contractResult.maxMortgage)} ${result.maxMortgage < contractResult.maxMortgage ? 'less' : 'more'} vs contract rate`} color="text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
