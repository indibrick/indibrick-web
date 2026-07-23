'use client';

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  calculateReverseMortgageAmount, projectReverseMortgageBalance, formatCAD, formatPercent,
} from '../../lib/mortgageEngine';
import { CurrencyInput, NumberInput, SliderInput, ToggleInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function ReverseMortgageCalc() {
  const [homeValue, setHomeValue] = useState(900_000);
  const [age, setAge] = useState(68);
  const [spouseAge, setSpouseAge] = useState(65);
  const [existingMortgage, setExistingMortgage] = useState(0);
  const [rate, setRate] = useState(7.5);
  const [projectionYears, setProjectionYears] = useState(10);

  const result = useMemo(() => {
    const youngest = Math.min(age, spouseAge);
    const maxAmount = calculateReverseMortgageAmount({ homeValue, youngestBorrowerAge: youngest });
    const netCashAvailable = Math.max(0, maxAmount - existingMortgage);
    const ltvPercent = homeValue > 0 ? (maxAmount / homeValue) * 100 : 0;

    // Balance projection at compounded interest
    const projection = projectReverseMortgageBalance({
      initialAmount: netCashAvailable,
      annualRatePercent: rate,
      years: projectionYears,
    });

    // Home value projection at 3% annual appreciation (conservative Ontario)
    const homeAppreciation = 0.03;
    const chartData = projection.map(p => ({
      year: p.year,
      'RM Balance': Math.round(p.balance),
      'Home Value (3% growth)': Math.round(homeValue * Math.pow(1 + homeAppreciation, p.year)),
    }));

    // Final residual equity after projection years
    const finalHomeValue = homeValue * Math.pow(1 + homeAppreciation, projectionYears);
    const finalRMBalance = projection[projection.length - 1]?.balance || 0;
    const residualEquity = finalHomeValue - finalRMBalance;
    const residualEquityPct = finalHomeValue > 0 ? (residualEquity / finalHomeValue) * 100 : 0;

    return { maxAmount, netCashAvailable, ltvPercent, youngest, chartData, finalHomeValue, finalRMBalance, residualEquity, residualEquityPct };
  }, [homeValue, age, spouseAge, existingMortgage, rate, projectionYears]);

  const eligible = result.youngest >= 55;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Your Home & Age</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Home Value" value={homeValue} onChange={setHomeValue} step={10000} />
        <SliderInput label="Your Age" value={age} onChange={setAge} min={55} max={95} step={1} format={n => `${n} years`} />
        <SliderInput label="Spouse Age (if applicable)" value={spouseAge} onChange={setSpouseAge} min={45} max={95} step={1} format={n => `${n} years`} />
        <CurrencyInput label="Existing Mortgage Balance" value={existingMortgage} onChange={setExistingMortgage} step={5000} helpText="paid off from RM proceeds" />
        <SliderInput label="Reverse Mortgage Rate" value={rate} onChange={setRate} min={4} max={12} step={0.1} format={n => `${n.toFixed(1)}%`} />
        <SliderInput label="Projection Years" value={projectionYears} onChange={setProjectionYears} min={1} max={30} step={1} format={n => `${n} years`} />

        {!eligible && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-900">
            <p className="font-black mb-1">Not eligible</p>
            <p>Both borrowers must be 55+ to qualify for a Canadian reverse mortgage.</p>
          </div>
        )}
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Max Reverse Mortgage Amount"
            value={formatCAD(result.maxAmount)}
            sublabel={`${result.ltvPercent.toFixed(0)}% of home value · based on youngest borrower age ${result.youngest}`}
            accent="amber"
          />
          <ResultCard
            label="Net Tax-Free Cash Available"
            value={formatCAD(result.netCashAvailable)}
            sublabel={existingMortgage > 0 ? `After paying off ${formatCAD(existingMortgage)} existing mortgage` : 'No existing mortgage'}
            accent="emerald"
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Balance projection</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">RM balance vs home value over {projectionYears} years</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={result.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rmg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="hvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'Year', position: 'insideBottom', offset: -5, fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCAD(v)} labelFormatter={l => `Year ${l}`} />
              <Area type="monotone" dataKey="Home Value (3% growth)" stroke="#10b981" fill="url(#hvg)" strokeWidth={2}/>
              <Area type="monotone" dataKey="RM Balance" stroke="#f59e0b" fill="url(#rmg)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-gray-500 mt-3 text-center">Home appreciation modeled at 3%/yr (conservative long-run Ontario average). Actual results depend on your local market.</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Estimated equity after {projectionYears} years</p>
          <div className="space-y-1">
            <ResultRow label="Projected home value" value={formatCAD(result.finalHomeValue)} color="text-emerald-700" />
            <ResultRow label="Projected RM balance" value={formatCAD(result.finalRMBalance)} color="text-amber-700" />
            <ResultRow label="Estimated residual equity" value={`${formatCAD(result.residualEquity)} (${result.residualEquityPct.toFixed(0)}% of home value)`} emphasis />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Key protection</p>
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong className="text-slate-900">No-negative-equity guarantee:</strong> Provided you meet your property tax + insurance + maintenance obligations, you will never owe more than the fair market value of your home — even if the balance projection in the chart exceeds it.
          </p>
        </div>
      </div>
    </div>
  );
}
