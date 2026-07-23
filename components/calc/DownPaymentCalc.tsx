'use client';

import React, { useState, useMemo } from 'react';
import { calculateCMHCPremium, calculatePayment, formatCAD } from '../../lib/mortgageEngine';
import { CurrencyInput, SliderInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function DownPaymentCalc() {
  const [price, setPrice] = useState(750_000);
  const [downPayment, setDownPayment] = useState(150_000);
  const [rate, setRate] = useState(4.29);
  const [amortYears, setAmortYears] = useState(25);

  const result = useMemo(() => {
    const downPct = price > 0 ? (downPayment / price) * 100 : 0;

    // Minimum down under Canadian rules: 5% on first $500k, 10% on $500k–$1.5M,
    // 20% on anything over $1.5M.
    let minDown = 0;
    if (price <= 500_000) minDown = price * 0.05;
    else if (price <= 1_500_000) minDown = 500_000 * 0.05 + (price - 500_000) * 0.10;
    else minDown = price * 0.20;
    const minDownPct = (minDown / price) * 100;

    const isInsured = downPct < 20;
    const cmhcPremium = calculateCMHCPremium(price, downPayment);
    const mortgageAmount = price - downPayment + cmhcPremium;
    const monthlyPayment = calculatePayment(mortgageAmount, rate, amortYears, 'monthly');

    // Compare across the 4 canonical down-payment tiers.
    const tiers = [5, 10, 20, 25].map(pct => {
      const dp = price * (pct / 100);
      if (dp < minDown) return null;
      const cmhc = calculateCMHCPremium(price, dp);
      const mortgage = price - dp + cmhc;
      const pmt = calculatePayment(mortgage, rate, amortYears, 'monthly');
      return { pct, downPayment: dp, cmhc, mortgage, pmt, insured: pct < 20 };
    }).filter((t): t is NonNullable<typeof t> => t !== null);

    return { downPct, minDown, minDownPct, isInsured, cmhcPremium, mortgageAmount, monthlyPayment, tiers };
  }, [price, downPayment, rate, amortYears]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Your Down Payment</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Home Price" value={price} onChange={setPrice} step={5000} />
        <CurrencyInput label="Down Payment" value={downPayment} onChange={setDownPayment} step={1000} helpText={`${result.downPct.toFixed(1)}% · minimum is ${formatCAD(result.minDown)} (${result.minDownPct.toFixed(1)}%)`} />
        <SliderInput label="Interest Rate" value={rate} onChange={setRate} min={1} max={12} step={0.01} format={n => `${n.toFixed(2)}%`} />
        <SliderInput label="Amortization" value={amortYears} onChange={setAmortYears} min={5} max={35} step={1} format={n => `${n} yrs`} />

        {downPayment < result.minDown && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-900">
            <p className="font-black mb-1">Below minimum down payment</p>
            <p>Canadian minimums: 5% on first $500k, 10% on $500k–$1.5M, 20% over $1.5M. You need at least {formatCAD(result.minDown)}.</p>
          </div>
        )}

        {result.isInsured && downPayment >= result.minDown && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <p className="font-black mb-1">CMHC insurance required</p>
            <p>Down under 20% requires mortgage default insurance. Premium: {formatCAD(result.cmhcPremium)} (added to mortgage balance). Plus 8% PST on the premium paid in cash at closing.</p>
          </div>
        )}
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Mortgage Amount"
            value={formatCAD(result.mortgageAmount)}
            sublabel={result.isInsured ? `Includes ${formatCAD(result.cmhcPremium)} CMHC premium` : 'Uninsured / conventional'}
            accent="slate"
          />
          <ResultCard
            label="Monthly Payment"
            value={formatCAD(result.monthlyPayment)}
            sublabel={`At ${rate.toFixed(2)}% over ${amortYears} yrs`}
            accent="blue"
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Down payment side-by-side</p>
            <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900">How much you save by putting more down</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">Down %</th>
                <th className="p-3 text-right text-[10px] font-black uppercase tracking-widest">Down $</th>
                <th className="p-3 text-right text-[10px] font-black uppercase tracking-widest">CMHC</th>
                <th className="p-3 text-right text-[10px] font-black uppercase tracking-widest">Mortgage</th>
                <th className="p-3 text-right text-[10px] font-black uppercase tracking-widest">Monthly Payment</th>
              </tr>
            </thead>
            <tbody>
              {result.tiers.map((t, i) => (
                <tr key={t.pct} className={`${i > 0 ? 'border-t border-gray-100' : ''} ${Math.abs(t.pct - result.downPct) < 1 ? 'bg-blue-50' : ''}`}>
                  <td className="p-3 font-black text-slate-900 tabular-nums">{t.pct}%{t.insured && <span className="ml-2 text-[9px] text-amber-700 font-bold">INSURED</span>}</td>
                  <td className="p-3 text-right tabular-nums">{formatCAD(t.downPayment)}</td>
                  <td className="p-3 text-right tabular-nums text-red-600">{t.cmhc > 0 ? formatCAD(t.cmhc) : '—'}</td>
                  <td className="p-3 text-right tabular-nums">{formatCAD(t.mortgage)}</td>
                  <td className="p-3 text-right tabular-nums font-black">{formatCAD(t.pmt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Summary</p>
          <div className="mt-2 space-y-1">
            <ResultRow label="Home price" value={formatCAD(price)} />
            <ResultRow label="Your down payment" value={`${formatCAD(downPayment)} (${result.downPct.toFixed(1)}%)`} />
            <ResultRow label="Minimum down required" value={`${formatCAD(result.minDown)} (${result.minDownPct.toFixed(1)}%)`} />
            <ResultRow label="Mortgage insurance" value={result.isInsured ? 'Required' : 'Not required'} />
            <ResultRow label="Total mortgage" value={formatCAD(result.mortgageAmount)} emphasis />
          </div>
        </div>
      </div>
    </div>
  );
}
