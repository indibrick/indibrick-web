'use client';

import React, { useState, useMemo } from 'react';
import { calculatePayment, calculateAmortizationSchedule, bucketByYear, formatCAD, formatPercent } from '../../lib/mortgageEngine';
import { CurrencyInput, PercentInput, SliderInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function RenewalCalc() {
  const [balance, setBalance] = useState(400_000);
  const [remainingAmort, setRemainingAmort] = useState(20);
  const [bankOffer, setBankOffer] = useState(5.79);
  const [brokerRate, setBrokerRate] = useState(4.29);
  const [termYears, setTermYears] = useState(5);

  const result = useMemo(() => {
    const bankPayment = calculatePayment(balance, bankOffer, remainingAmort, 'monthly');
    const brokerPayment = calculatePayment(balance, brokerRate, remainingAmort, 'monthly');
    const monthlyDelta = bankPayment - brokerPayment;
    const annualDelta = monthlyDelta * 12;

    // Total interest over the CHOSEN TERM (not full amortization) — the
    // renewal window is a 5-year commitment, not a 25-year one.
    const bankSchedule = calculateAmortizationSchedule({ principal: balance, annualRatePercent: bankOffer, amortYears: remainingAmort, frequency: 'monthly' });
    const brokerSchedule = calculateAmortizationSchedule({ principal: balance, annualRatePercent: brokerRate, amortYears: remainingAmort, frequency: 'monthly' });
    const termPeriods = termYears * 12;
    const bankTermInterest = bankSchedule.slice(0, termPeriods).reduce((s, r) => s + r.interest, 0);
    const brokerTermInterest = brokerSchedule.slice(0, termPeriods).reduce((s, r) => s + r.interest, 0);
    const termSavings = bankTermInterest - brokerTermInterest;

    const bankBalanceEnd = bankSchedule[termPeriods - 1]?.balance || 0;
    const brokerBalanceEnd = brokerSchedule[termPeriods - 1]?.balance || 0;
    const balanceEndDelta = bankBalanceEnd - brokerBalanceEnd;

    return {
      bankPayment, brokerPayment, monthlyDelta, annualDelta,
      bankTermInterest, brokerTermInterest, termSavings,
      bankBalanceEnd, brokerBalanceEnd, balanceEndDelta,
    };
  }, [balance, remainingAmort, bankOffer, brokerRate, termYears]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Your Renewal</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Remaining Mortgage Balance" value={balance} onChange={setBalance} step={5000} />
        <SliderInput label="Remaining Amortization" value={remainingAmort} onChange={setRemainingAmort} min={5} max={30} step={1} format={n => `${n} yrs`} />
        <SliderInput label="Bank's Renewal Offer" value={bankOffer} onChange={setBankOffer} min={2} max={10} step={0.01} format={n => `${n.toFixed(2)}%`} />
        <SliderInput label="Broker Channel Rate" value={brokerRate} onChange={setBrokerRate} min={2} max={10} step={0.01} format={n => `${n.toFixed(2)}%`} />
        <SliderInput label="New Term Length" value={termYears} onChange={setTermYears} min={1} max={10} step={1} format={n => `${n}-yr term`} />

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900">
          <p className="font-black mb-1">120-day rate hold</p>
          <p>Every Canadian A-lender will lock a rate for up to 120 days before your maturity date at no cost. Shop early — protect against a rise, capture any drop.</p>
        </div>
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Monthly Savings (Broker vs Bank)"
            value={formatCAD(result.monthlyDelta)}
            sublabel={`${formatCAD(result.annualDelta)}/year in payment`}
            accent="emerald"
          />
          <ResultCard
            label={`Interest Saved Over ${termYears}-yr Term`}
            value={formatCAD(result.termSavings)}
            sublabel={`Balance at term end: ${formatCAD(result.balanceEndDelta)} less`}
            accent="emerald"
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-900 text-white">
            <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Metric</div>
            <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-red-400 text-center">Bank offer @ {bankOffer.toFixed(2)}%</div>
            <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-emerald-400 text-center">Broker @ {brokerRate.toFixed(2)}%</div>
          </div>
          {[
            { label: 'Monthly payment', bank: formatCAD(result.bankPayment), broker: formatCAD(result.brokerPayment) },
            { label: `Total interest over ${termYears}-yr term`, bank: formatCAD(result.bankTermInterest), broker: formatCAD(result.brokerTermInterest) },
            { label: `Balance at end of ${termYears}-yr term`, bank: formatCAD(result.bankBalanceEnd), broker: formatCAD(result.brokerBalanceEnd) },
          ].map((row, i) => (
            <div key={row.label} className={`grid grid-cols-3 items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="p-4 md:p-5 font-bold text-slate-900 text-sm">{row.label}</div>
              <div className="p-4 md:p-5 text-center font-black text-red-500 tabular-nums">{row.bank}</div>
              <div className="p-4 md:p-5 text-center font-black text-emerald-600 tabular-nums">{row.broker}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Verdict</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-3">
            {result.termSavings > 500 ? 'Switch — the math is clear.' : result.termSavings > 100 ? 'Marginal. Talk to the broker before deciding.' : 'The bank offer is competitive.'}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {result.termSavings > 500
              ? `Switching to the broker channel rate saves you ${formatCAD(result.termSavings)} over the ${termYears}-year term. Legal costs are typically covered by the new lender on insured switches; on uninsured, budget $500–$1,000 in legal fees — still well below the savings.`
              : result.termSavings > 100
              ? `The savings exist but are modest. Consider whether the switch is worth the effort — a licensed broker can also ask your current bank's retention team to match the broker rate, which sometimes works.`
              : `Your bank's offer is within striking distance of the broker channel. Sign it or have a broker verify a better option exists before it expires.`}
          </p>
        </div>
      </div>
    </div>
  );
}
