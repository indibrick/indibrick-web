'use client';

import React, { useState, useMemo } from 'react';
import { calculateIRDPenalty, calculate3MonthInterestPenalty, formatCAD } from '../../lib/mortgageEngine';
import { CurrencyInput, NumberInput, SliderInput, ToggleInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function PenaltyCalc() {
  const [balance, setBalance] = useState(400_000);
  const [contractRate, setContractRate] = useState(2.14);
  const [postedRate, setPostedRate] = useState(5.99);
  const [monthsRemaining, setMonthsRemaining] = useState(24);
  const [penaltyType, setPenaltyType] = useState<'fixed-big6' | 'fixed-monoline' | 'variable'>('fixed-big6');

  const result = useMemo(() => {
    const ird = calculateIRDPenalty({ balance, contractRatePercent: contractRate, comparableRatePercent: postedRate, monthsRemaining });
    const threeMonth = calculate3MonthInterestPenalty(balance, contractRate);

    let penalty = 0;
    let method = '';
    if (penaltyType === 'variable') {
      penalty = threeMonth;
      method = '3-month interest';
    } else if (penaltyType === 'fixed-monoline') {
      // Monolines typically use 3-month interest OR a simpler IRD calculation
      penalty = Math.max(threeMonth, ird * 0.5); // Illustrative — actual monoline formulas vary
      method = 'Higher of 3-month interest or IRD';
    } else {
      // Big 6 fixed uses full IRD or 3-mo, whichever is HIGHER
      penalty = Math.max(threeMonth, ird);
      method = 'Higher of IRD or 3-month interest';
    }

    const penaltyAsMonths = penalty / (balance * (contractRate / 100 / 12));
    const penaltyPercent = (penalty / balance) * 100;

    return { penalty, method, ird, threeMonth, penaltyAsMonths, penaltyPercent };
  }, [balance, contractRate, postedRate, monthsRemaining, penaltyType]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Your Mortgage</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Remaining Balance" value={balance} onChange={setBalance} step={5000} />
        <SliderInput label="Your Contract Rate" value={contractRate} onChange={setContractRate} min={1} max={10} step={0.01} format={n => `${n.toFixed(2)}%`} />

        <ToggleInput
          label="Lender Type"
          value={penaltyType}
          onChange={setPenaltyType}
          options={[
            { value: 'fixed-big6', label: 'Big 6 Fixed' },
            { value: 'fixed-monoline', label: 'Monoline Fixed' },
            { value: 'variable', label: 'Variable' },
          ]}
        />

        {penaltyType !== 'variable' && (
          <>
            <SliderInput
              label="Comparable Posted Rate"
              value={postedRate}
              onChange={setPostedRate}
              min={2} max={10} step={0.01}
              format={n => `${n.toFixed(2)}%`}
              helpText="ask your lender for their exact posted rate for your remaining term"
            />
            <NumberInput label="Months Remaining in Term" value={monthsRemaining} onChange={setMonthsRemaining} min={1} max={60} suffix="mo" />
          </>
        )}

        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-900">
          <p className="font-black mb-1">This is an estimate</p>
          <p>Every Canadian lender uses slightly different penalty formulas. Ask your lender for a written payout statement — that\'s the number you have to beat with a refi.</p>
        </div>
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Estimated Penalty"
            value={formatCAD(result.penalty)}
            sublabel={result.method}
            accent="red"
          />
          <ResultCard
            label="As % of Balance"
            value={`${result.penaltyPercent.toFixed(2)}%`}
            sublabel={`≈ ${result.penaltyAsMonths.toFixed(1)} months of interest`}
            accent="slate"
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Both methods side-by-side</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">Which formula produces the bigger penalty?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">IRD Penalty</p>
              <p className="text-2xl md:text-3xl font-black text-red-600 tabular-nums mb-2">{formatCAD(result.ird)}</p>
              <p className="text-xs text-gray-600 leading-relaxed">Balance × (contract rate − posted rate) × months ÷ 12. Standard for Big 6 fixed mortgages when rates have dropped since origination.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">3-Month Interest</p>
              <p className="text-2xl md:text-3xl font-black text-red-600 tabular-nums mb-2">{formatCAD(result.threeMonth)}</p>
              <p className="text-xs text-gray-600 leading-relaxed">Balance × (rate ÷ 12) × 3. Standard for variable mortgages and many monoline fixed mortgages regardless of rate direction.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">What to do with this number</p>
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <p>1. <strong className="text-slate-900">Ask your current lender for a written payout statement.</strong> That&apos;s the exact penalty they&apos;ll charge. Estimates from calculators are close but not perfect.</p>
            <p>2. <strong className="text-slate-900">Use the Refinance Calculator</strong> to see whether the penalty pencils out vs the interest savings from a lower rate.</p>
            <p>3. <strong className="text-slate-900">Consider blend-and-extend</strong> if you want to change terms without paying a penalty — your lender may offer it if you ask by name.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
