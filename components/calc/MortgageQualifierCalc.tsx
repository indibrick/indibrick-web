'use client';

// Mortgage Qualifier — the forward test.
//
// Every other calculator on this site answers "what would this cost" or "how
// much could I borrow". This one answers the question a lender actually asks:
// given THIS property and THIS debt load, do the ratios pass?
//
// Modelled on the federal Mortgage Qualifier Tool (FCAC) so the inputs map
// one-to-one to what a broker collects, with the ratio arithmetic shown rather
// than hidden — the breakdown is the part that tells a borrower which lever to
// pull when the answer is no.

import React, { useState, useMemo } from 'react';
import { qualifyMortgage, minimumDownPayment, formatCAD } from '../../lib/mortgageEngine';
import { CurrencyInput, PercentInput, SliderInput } from './inputs';
import { ResultCard, ResultRow } from './results';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

function RatioBar({ label, value, cap, hint }: { label: string; value: number; cap: number; hint: string }) {
  const pass = value <= cap;
  // Scale the bar so the cap sits at 75% of the track — keeps a failing ratio
  // visibly over the line instead of pinned at the end.
  const pct = Math.min((value / (cap / 0.75)) * 100, 100);
  const capPct = 75;
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-black uppercase tracking-widest text-slate-700">{label}</span>
        <span className={`text-sm font-black tabular-nums ${pass ? 'text-emerald-600' : 'text-red-600'}`}>
          {value.toFixed(1)}% <span className="text-gray-400 font-bold">/ {cap}% max</span>
        </span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pass ? 'bg-emerald-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-900" style={{ left: `${capPct}%` }} />
      </div>
      <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{hint}</p>
    </div>
  );
}

export default function MortgageQualifierCalc() {
  const [propertyValue, setPropertyValue] = useState(850_000);
  const [downPayment, setDownPayment] = useState(170_000);
  const [rate, setRate] = useState(4.29);
  const [amortYears, setAmortYears] = useState(25);
  const [income, setIncome] = useState(165_000);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(6_500);
  const [heatingMonthly, setHeatingMonthly] = useState(150);
  const [condoFeesMonthly, setCondoFeesMonthly] = useState(0);
  const [creditPayments, setCreditPayments] = useState(200);
  const [carPayments, setCarPayments] = useState(450);
  const [otherDebts, setOtherDebts] = useState(0);

  const r = useMemo(
    () =>
      qualifyMortgage({
        propertyValue,
        downPayment,
        contractRatePercent: rate,
        amortYears,
        householdIncomeAnnual: income,
        propertyTaxAnnual,
        heatingMonthly,
        condoFeesMonthly,
        creditPaymentsMonthly: creditPayments,
        carPaymentsMonthly: carPayments,
        otherDebtsMonthly: otherDebts,
      }),
    [propertyValue, downPayment, rate, amortYears, income, propertyTaxAnnual,
     heatingMonthly, condoFeesMonthly, creditPayments, carPayments, otherDebts],
  );

  const minDown = minimumDownPayment(propertyValue);
  const downShort = downPayment < minDown;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* INPUTS */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white rounded-3xl border border-gray-200 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">The property</p>
          <CurrencyInput label="Property value" value={propertyValue} onChange={setPropertyValue} step={10_000} />
          <CurrencyInput
            label="Down payment"
            value={downPayment}
            onChange={setDownPayment}
            step={5_000}
            helpText={`Minimum for this price: ${formatCAD(minDown)} (${((minDown / propertyValue) * 100).toFixed(1)}%)`}
          />
          <PercentInput label="Interest rate" value={rate} onChange={setRate} step={0.01} max={15}
            helpText="Your contract rate. The qualifying rate is calculated for you." />
          <SliderInput label="Amortization" value={amortYears} onChange={setAmortYears}
            min={5} max={30} step={5} format={(v) => `${v} years`} />
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Household income</p>
          <CurrencyInput label="Gross annual income" value={income} onChange={setIncome} step={5_000}
            helpText="Before tax, all borrowers combined." />
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Housing costs</p>
          <CurrencyInput label="Property tax (annual)" value={propertyTaxAnnual} onChange={setPropertyTaxAnnual} step={250} />
          <CurrencyInput label="Heating (monthly)" value={heatingMonthly} onChange={setHeatingMonthly} step={25}
            helpText="Lenders assume roughly $150/month if you don't know." />
          <CurrencyInput label="Condo fees (monthly)" value={condoFeesMonthly} onChange={setCondoFeesMonthly} step={50}
            helpText="Only 50% of this counts toward your ratios." />
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Monthly debt payments</p>
          <CurrencyInput label="Credit cards + lines of credit" value={creditPayments} onChange={setCreditPayments} step={50}
            helpText="Minimum payments. Lenders use 3% of a card balance if no minimum is stated." />
          <CurrencyInput label="Car loans + leases" value={carPayments} onChange={setCarPayments} step={50} />
          <CurrencyInput label="Other obligations" value={otherDebts} onChange={setOtherDebts} step={50}
            helpText="Student loans, support payments, other financing." />
        </div>
      </div>

      {/* RESULTS */}
      <div className="lg:col-span-3 space-y-5">
        {/* VERDICT */}
        <div className={`rounded-3xl p-7 border-2 ${r.qualifies ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-4">
            {r.qualifies
              ? <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={32} />
              : <XCircle className="text-red-600 shrink-0 mt-0.5" size={32} />}
            <div className="min-w-0">
              <p className={`text-2xl md:text-3xl font-black tracking-tight ${r.qualifies ? 'text-emerald-900' : 'text-red-900'}`}>
                {r.qualifies ? 'You qualify on the ratios' : 'This file does not pass'}
              </p>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {r.qualifies
                  ? `At ${formatCAD(propertyValue)} with ${formatCAD(downPayment)} down, both your GDS and TDS ratios sit inside A-lender limits when stress-tested at ${r.qualifyingRate.toFixed(2)}%.`
                  : r.failedOn.includes('DOWN_PAYMENT')
                    ? `Your down payment is below the federal minimum of ${formatCAD(r.minDownPaymentRequired)} for a ${formatCAD(propertyValue)} purchase.`
                    : r.failedOn.includes('UNINSURABLE')
                      ? `Above ${formatCAD(1_500_000)} mortgage default insurance is unavailable, so 20% down is a hard floor.`
                      : `Your ${r.failedOn.join(' and ')} ratio exceeds the A-lender cap at the stress-test rate of ${r.qualifyingRate.toFixed(2)}%.`}
              </p>
              {r.incomeNeededToQualify && (
                <p className="text-sm font-bold text-slate-900 mt-3">
                  Household income needed at this property: {formatCAD(r.incomeNeededToQualify)}
                  <span className="font-medium text-slate-600"> (you entered {formatCAD(income)})</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RATIOS */}
        <div className="bg-white rounded-3xl border border-gray-200 p-7">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">The two tests every A-lender runs</p>
          <RatioBar label="GDS — Gross Debt Service" value={r.gdsPercent} cap={r.gdsCapPercent}
            hint="Mortgage payment + property tax + heat + half your condo fees, over gross income." />
          <RatioBar label="TDS — Total Debt Service" value={r.tdsPercent} cap={r.tdsCapPercent}
            hint="Everything in GDS, plus every other monthly debt payment you carry." />
        </div>

        {/* STRESS TEST */}
        <div className="bg-slate-900 text-white rounded-3xl p-7">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">The stress test is doing the work</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Qualified at</p>
              <p className="text-3xl font-black tabular-nums">{r.qualifyingRate.toFixed(2)}%</p>
              <p className="text-xs text-gray-400 mt-1">{formatCAD(r.qualifyingMonthlyPayment)}/mo</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">You actually pay</p>
              <p className="text-3xl font-black tabular-nums text-emerald-400">{r.contractRate.toFixed(2)}%</p>
              <p className="text-xs text-gray-400 mt-1">{formatCAD(r.actualMonthlyPayment)}/mo</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-5 leading-relaxed">
            Under OSFI Guideline B-20 your ratios are measured at the greater of your contract rate plus two points, or 5.25%.
            That is {formatCAD(r.qualifyingMonthlyPayment - r.actualMonthlyPayment)}/month of headroom the lender wants to see you could absorb.
          </p>
        </div>

        {/* BREAKDOWN */}
        <div className="bg-white rounded-3xl border border-gray-200 p-7">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">How the numbers were built</p>
          <ResultRow label="Mortgage before insurance" value={formatCAD(r.mortgageAmount)} />
          {r.insured && (
            <ResultRow label={`Default insurance premium (${r.downPaymentPercent.toFixed(1)}% down)`} value={formatCAD(r.insurancePremium)} />
          )}
          <ResultRow label="Total mortgage" value={formatCAD(r.totalMortgage)} emphasis />
          <ResultRow label="Monthly gross income" value={formatCAD(r.monthlyIncome)} />
          <ResultRow label="Shelter cost used in GDS" value={formatCAD(r.shelterMonthly)} />
          <ResultRow label="Other monthly debts" value={formatCAD(r.totalDebtsMonthly)} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <ResultCard label="Down payment" value={`${r.downPaymentPercent.toFixed(1)}%`}
            sublabel={r.insured ? 'Insured — premium added' : 'Conventional — no insurance'} accent="slate" />
          <ResultCard label="Payment at your rate" value={formatCAD(r.actualMonthlyPayment)}
            sublabel={`${amortYears}-year amortization`} accent="slate" />
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          GDS and TDS caps of 39% and 44% are the conventional A-lender limits. Insured files are often allowed
          to 39/44 exactly, while some lenders stretch to 42/50 on strong credit. B-lenders regularly approve past
          those. A result of &quot;does not pass&quot; here means the file does not fit a prime lender at these inputs — not
          that it cannot be placed.
        </p>
      </div>
    </div>
  );
}
