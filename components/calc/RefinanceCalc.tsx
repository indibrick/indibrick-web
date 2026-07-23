'use client';

// Refinance Calculator — realtor.ca / MPC parity.
//
// Feature set beyond the basic version:
//   • Explicit closing-cost inputs: legal, appraisal, discharge, title
//   • Penalty toggle (fixed → IRD with posted-rate slider, variable → 3-mo)
//   • New-term output row (matches the payment calc's "term snapshot")
//   • Break-even math accounts for penalty + ALL closing costs (not just penalty)
//   • Side-by-side old vs new mortgage comparison table
//   • Cash-out (equity take-out) modeled correctly against new balance
//   • Interest savings computed over the NEW TERM (not full amort — that's
//     what a broker's client actually cares about at renewal decision time)
//   • URL deep-link params via useUrlState

import React, { useMemo } from 'react';
import {
  calculatePayment, calculateAmortizationSchedule,
  calculateIRDPenalty, calculate3MonthInterestPenalty,
  formatCAD, formatPercent, PERIODS_PER_YEAR,
} from '../../lib/mortgageEngine';
import { CurrencyInput, NumberInput, SliderInput, SelectInput, ToggleInput } from './inputs';
import { ResultCard, ResultRow } from './results';
import { useUrlState } from './useUrlState';

const TERM_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: '1 year' },
  { value: '2', label: '2 years' },
  { value: '3', label: '3 years' },
  { value: '4', label: '4 years' },
  { value: '5', label: '5 years' },
  { value: '7', label: '7 years' },
  { value: '10', label: '10 years' },
];

export default function RefinanceCalc() {
  const [s, set] = useUrlState({
    // Current mortgage
    balance: 400_000,
    curRate: 2.14,
    curAmort: 20,      // remaining amort
    monthsLeft: 24,    // months remaining in current term
    penaltyType: 'fixed' as 'fixed' | 'variable',
    postedRate: 5.99,  // for IRD calc
    // New mortgage
    newRate: 4.29,
    newAmort: 25,
    newTerm: '5',
    cashOut: 0,        // equity take-out on top of balance
    // Closing costs
    legalFees: 1500,
    appraisalFee: 500,
    dischargeFee: 300,
    titleInsurance: 300,
    rollCostsIn: true, // add penalty + costs to new mortgage vs pay cash
  });

  const result = useMemo(() => {
    // ── Penalty ──
    const penalty = s.penaltyType === 'fixed'
      ? calculateIRDPenalty({
          balance: s.balance,
          contractRatePercent: s.curRate,
          comparableRatePercent: s.postedRate,
          monthsRemaining: s.monthsLeft,
        })
      : calculate3MonthInterestPenalty(s.balance, s.curRate);

    // ── Closing costs (excluding penalty which is separate) ──
    const closingCosts = s.legalFees + s.appraisalFee + s.dischargeFee + s.titleInsurance;
    const totalCosts = penalty + closingCosts;

    // ── New loan amount ──
    // If costs are rolled in, they're added to the new mortgage balance.
    // If paid in cash, only the cash-out is added.
    const newLoanAmount = s.balance + s.cashOut + (s.rollCostsIn ? totalCosts : 0);
    const cashRequiredAtClose = s.rollCostsIn ? 0 : totalCosts;

    // ── Payments ──
    // Old payment continues on old balance + old rate + REMAINING amort.
    const oldPayment = calculatePayment(s.balance, s.curRate, s.curAmort, 'monthly');
    // New payment on new balance + new rate + new amort.
    const newPayment = calculatePayment(newLoanAmount, s.newRate, s.newAmort, 'monthly');
    const monthlyDelta = oldPayment - newPayment; // positive if refi is cheaper
    const annualDelta = monthlyDelta * 12;

    // ── Interest over TERM (the decision window) ──
    const termYears = parseInt(s.newTerm);
    const termMonths = termYears * 12;
    const oldSchedule = calculateAmortizationSchedule({
      principal: s.balance, annualRatePercent: s.curRate, amortYears: s.curAmort, frequency: 'monthly',
    });
    const newSchedule = calculateAmortizationSchedule({
      principal: newLoanAmount, annualRatePercent: s.newRate, amortYears: s.newAmort, frequency: 'monthly',
    });
    const oldInterestOverTerm = oldSchedule.slice(0, termMonths).reduce((sum, r) => sum + r.interest, 0);
    const newInterestOverTerm = newSchedule.slice(0, termMonths).reduce((sum, r) => sum + r.interest, 0);
    const interestSavedOverTerm = oldInterestOverTerm - newInterestOverTerm;

    // ── Balance at end of term ──
    const oldBalanceAtTerm = oldSchedule[termMonths - 1]?.balance || s.balance;
    const newBalanceAtTerm = newSchedule[termMonths - 1]?.balance || newLoanAmount;

    // ── Break-even ──
    // Time it takes for accumulated monthly savings to exceed the total refi cost.
    // Only meaningful when monthlyDelta > 0.
    const breakEvenMonths = monthlyDelta > 0 ? totalCosts / monthlyDelta : Infinity;

    // ── Net savings over the new term ──
    // Interest saved − penalty − closing costs.
    const netSavingsOverTerm = interestSavedOverTerm - totalCosts;

    // ── Verdict ──
    let verdict: 'win' | 'marginal' | 'lose';
    if (netSavingsOverTerm > 5000) verdict = 'win';
    else if (netSavingsOverTerm > 0) verdict = 'marginal';
    else verdict = 'lose';

    return {
      penalty, closingCosts, totalCosts, newLoanAmount, cashRequiredAtClose,
      oldPayment, newPayment, monthlyDelta, annualDelta,
      oldInterestOverTerm, newInterestOverTerm, interestSavedOverTerm,
      oldBalanceAtTerm, newBalanceAtTerm,
      breakEvenMonths, netSavingsOverTerm, verdict,
    };
  }, [s]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Current Mortgage</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">What you have now</h2>
        </div>

        <CurrencyInput label="Current Balance" value={s.balance} onChange={v => set({ balance: v })} step={5000} />
        <SliderInput label="Current Contract Rate" value={s.curRate} onChange={v => set({ curRate: v })} min={1} max={10} step={0.01} format={n => `${n.toFixed(2)}%`} />
        <SliderInput label="Remaining Amortization" value={s.curAmort} onChange={v => set({ curAmort: v })} min={1} max={30} step={1} format={n => `${n} yrs`} />
        <NumberInput label="Months Remaining in Term" value={s.monthsLeft} onChange={v => set({ monthsLeft: v })} min={1} max={60} suffix="mo" />

        <ToggleInput
          label="Current Mortgage Type"
          value={s.penaltyType}
          onChange={v => set({ penaltyType: v })}
          options={[
            { value: 'fixed', label: 'Fixed (IRD)' },
            { value: 'variable', label: 'Variable (3-mo)' },
          ]}
        />

        {s.penaltyType === 'fixed' && (
          <SliderInput
            label="Lender's Comparable Posted Rate"
            value={s.postedRate}
            onChange={v => set({ postedRate: v })}
            min={2} max={10} step={0.01}
            format={n => `${n.toFixed(2)}%`}
            helpText="ask your lender for this exact number"
          />
        )}

        <div className="border-t border-gray-100 pt-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">New Mortgage</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">What you're switching to</h2>
        </div>

        <SliderInput label="New Rate" value={s.newRate} onChange={v => set({ newRate: v })} min={1} max={10} step={0.01} format={n => `${n.toFixed(2)}%`} />
        <SliderInput label="New Amortization" value={s.newAmort} onChange={v => set({ newAmort: v })} min={5} max={35} step={1} format={n => `${n} yrs`} />
        <SelectInput label="New Term Length" value={s.newTerm} onChange={v => set({ newTerm: v })} options={TERM_OPTIONS} helpText="commitment window" />
        <CurrencyInput label="Cash Out (equity take-out)" value={s.cashOut} onChange={v => set({ cashOut: v })} step={5000} helpText="renos, debt consolidation, etc." />

        <details className="pt-2 group">
          <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 flex items-center gap-2">
            <span className="text-emerald-600 text-lg group-open:rotate-45 transition inline-block">+</span>
            Closing costs (defaults are typical Ontario)
          </summary>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <CurrencyInput label="Legal Fees" value={s.legalFees} onChange={v => set({ legalFees: v })} step={100} />
            <CurrencyInput label="Appraisal" value={s.appraisalFee} onChange={v => set({ appraisalFee: v })} step={50} />
            <CurrencyInput label="Discharge Fee" value={s.dischargeFee} onChange={v => set({ dischargeFee: v })} step={50} helpText="from old lender" />
            <CurrencyInput label="Title Insurance" value={s.titleInsurance} onChange={v => set({ titleInsurance: v })} step={50} />
          </div>
          <div className="mt-3">
            <ToggleInput
              label="How are costs handled?"
              value={s.rollCostsIn ? 'roll' : 'cash'}
              onChange={v => set({ rollCostsIn: v === 'roll' })}
              options={[
                { value: 'roll', label: 'Roll into mortgage' },
                { value: 'cash', label: 'Pay in cash at close' },
              ]}
            />
          </div>
        </details>
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        {/* Headline result */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Total Cost to Refinance"
            value={formatCAD(result.totalCosts)}
            sublabel={`Penalty ${formatCAD(result.penalty)} + closing ${formatCAD(result.closingCosts)}${s.rollCostsIn ? ' · rolled into mortgage' : ' · paid in cash'}`}
            accent="red"
          />
          <ResultCard
            label={result.netSavingsOverTerm > 0 ? `Net Savings Over ${s.newTerm}-yr Term` : `Net Cost Over ${s.newTerm}-yr Term`}
            value={formatCAD(Math.abs(result.netSavingsOverTerm))}
            sublabel={result.netSavingsOverTerm > 0 ? `Interest saved after all costs` : `Costs exceed interest savings`}
            accent={result.netSavingsOverTerm > 0 ? 'emerald' : 'red'}
            size="md"
          />
        </div>

        {/* Side-by-side comparison */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-900 text-white">
            <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Metric</div>
            <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-red-400 text-center">Current @ {s.curRate.toFixed(2)}%</div>
            <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-emerald-400 text-center">New @ {s.newRate.toFixed(2)}%</div>
          </div>
          {[
            { label: 'Balance', current: formatCAD(s.balance), refi: formatCAD(result.newLoanAmount) },
            { label: 'Monthly payment', current: formatCAD(result.oldPayment), refi: formatCAD(result.newPayment) },
            { label: `Interest over ${s.newTerm}-yr term`, current: formatCAD(result.oldInterestOverTerm), refi: formatCAD(result.newInterestOverTerm) },
            { label: `Balance at end of ${s.newTerm}-yr term`, current: formatCAD(result.oldBalanceAtTerm), refi: formatCAD(result.newBalanceAtTerm) },
          ].map((row, i) => (
            <div key={row.label} className={`grid grid-cols-3 items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="p-4 md:p-5 font-bold text-slate-900 text-sm">{row.label}</div>
              <div className="p-4 md:p-5 text-center font-black text-red-500 tabular-nums text-sm md:text-base">{row.current}</div>
              <div className="p-4 md:p-5 text-center font-black text-emerald-600 tabular-nums text-sm md:text-base">{row.refi}</div>
            </div>
          ))}
        </div>

        {/* Break-even + verdict */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Break-even math</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">Does the refi pencil out?</h3>
          <div className="space-y-1">
            <ResultRow label="Monthly savings" value={formatCAD(Math.max(0, result.monthlyDelta))} color={result.monthlyDelta > 0 ? 'text-emerald-700' : 'text-red-600'} />
            <ResultRow label="Annual savings" value={formatCAD(Math.max(0, result.annualDelta))} />
            <ResultRow
              label="Break-even month"
              value={isFinite(result.breakEvenMonths) ? `Month ${Math.ceil(result.breakEvenMonths)}` : 'Never (no monthly savings)'}
              emphasis
            />
            <ResultRow label={`Interest saved over ${s.newTerm}-yr term`} value={formatCAD(result.interestSavedOverTerm)} color={result.interestSavedOverTerm > 0 ? 'text-emerald-700' : 'text-red-600'} />
            <ResultRow label="Less: total refinance cost" value={`− ${formatCAD(result.totalCosts)}`} color="text-red-600" />
            <ResultRow
              label={`Net savings over ${s.newTerm}-yr term`}
              value={formatCAD(result.netSavingsOverTerm)}
              emphasis
              color={result.netSavingsOverTerm > 0 ? 'text-emerald-700' : 'text-red-600'}
            />
            {!s.rollCostsIn && result.cashRequiredAtClose > 0 && (
              <ResultRow label="Cash required at closing" value={formatCAD(result.cashRequiredAtClose)} color="text-amber-700" />
            )}
          </div>
        </div>

        <div className={`rounded-3xl p-5 md:p-6 border ${
          result.verdict === 'win' ? 'bg-emerald-50 border-emerald-200'
          : result.verdict === 'marginal' ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
            result.verdict === 'win' ? 'text-emerald-700'
            : result.verdict === 'marginal' ? 'text-amber-700'
            : 'text-red-700'
          }`}>Verdict</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-3">
            {result.verdict === 'win' ? 'Refi wins clearly.' : result.verdict === 'marginal' ? 'Refi wins by a slim margin.' : 'Wait or renegotiate at renewal.'}
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {result.verdict === 'win'
              ? `Even after the ${formatCAD(result.totalCosts)} total cost, you save ${formatCAD(result.netSavingsOverTerm)} in interest over the ${s.newTerm}-year new term. Break-even lands at month ${Math.ceil(result.breakEvenMonths)} — well within the ${parseInt(s.newTerm) * 12}-month term.`
              : result.verdict === 'marginal'
              ? `Marginal win. Consider whether the new rate might drop further before you commit, or ask your current lender for a blend-and-extend at zero penalty first.`
              : `The total cost (${formatCAD(result.totalCosts)}) exceeds the interest savings (${formatCAD(result.interestSavedOverTerm)}). Wait until renewal (${s.monthsLeft} months) or negotiate blend-and-extend with your current lender.`}
          </p>
        </div>
      </div>
    </div>
  );
}
