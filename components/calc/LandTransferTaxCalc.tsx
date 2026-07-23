'use client';

import React, { useState, useMemo } from 'react';
import { calculateLTT, formatCAD } from '../../lib/mortgageEngine';
import { CurrencyInput, ToggleInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function LandTransferTaxCalc() {
  const [price, setPrice] = useState(750_000);
  const [isToronto, setIsToronto] = useState(true);
  const [isFTHB, setIsFTHB] = useState(true);

  const result = useMemo(() => calculateLTT({
    price,
    isToronto,
    isFirstTimeBuyer: isFTHB,
  }), [price, isToronto, isFTHB]);

  // Sample table across common price bands so the user sees LTT context.
  const priceBands = [500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000];

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Your Purchase</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Purchase Price" value={price} onChange={setPrice} step={10000} />

        <ToggleInput
          label="Location"
          value={isToronto ? 'toronto' : 'ontario'}
          onChange={v => setIsToronto(v === 'toronto')}
          options={[
            { value: 'ontario', label: 'Ontario' },
            { value: 'toronto', label: 'Toronto (416)' },
          ]}
          helpText={isToronto ? 'includes Municipal LTT' : 'Provincial only'}
        />

        <ToggleInput
          label="First-Time Buyer?"
          value={isFTHB ? 'yes' : 'no'}
          onChange={v => setIsFTHB(v === 'yes')}
          options={[
            { value: 'yes', label: 'Yes (rebate applies)' },
            { value: 'no', label: 'No' },
          ]}
        />

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900">
          <p className="font-black mb-1">First-time buyer rebates</p>
          <p>Ontario: up to <strong>$4,000</strong>. Toronto: up to <strong>$4,475</strong>. Combined max for a Toronto first-time buyer: <strong>$8,475</strong>.</p>
        </div>
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Total LTT Payable"
            value={formatCAD(result.netPayable)}
            sublabel={isFTHB && (result.ontarioRebate + result.torontoRebate) > 0
              ? `After ${formatCAD(result.ontarioRebate + result.torontoRebate)} FTHB rebate`
              : 'Before any rebates'}
            accent="slate"
          />
          <ResultCard
            label="As % of Purchase Price"
            value={`${((result.netPayable / price) * 100).toFixed(2)}%`}
            sublabel={`On a ${formatCAD(price)} home`}
            accent="blue"
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Line-by-line breakdown</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">Where the tax goes</h3>
          <div className="space-y-1">
            <ResultRow label="Ontario Provincial LTT" value={formatCAD(result.ontarioLTT)} />
            {isToronto && <ResultRow label="Toronto Municipal LTT" value={formatCAD(result.torontoLTT)} />}
            <ResultRow label="Gross LTT (before rebates)" value={formatCAD(result.totalLTT)} emphasis />
            {isFTHB && result.ontarioRebate > 0 && <ResultRow label="Ontario FTHB rebate" value={`− ${formatCAD(result.ontarioRebate)}`} color="text-emerald-700" />}
            {isFTHB && result.torontoRebate > 0 && <ResultRow label="Toronto FTHB rebate" value={`− ${formatCAD(result.torontoRebate)}`} color="text-emerald-700" />}
            <ResultRow label="Net payable at closing" value={formatCAD(result.netPayable)} emphasis color="text-slate-900" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Sample bands</p>
            <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-2">
              LTT at other price points ({isToronto ? 'Toronto' : 'Ontario'}, {isFTHB ? 'first-time buyer' : 'repeat buyer'})
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">Purchase Price</th>
                <th className="p-3 text-right text-[10px] font-black uppercase tracking-widest">LTT Payable</th>
                <th className="p-3 text-right text-[10px] font-black uppercase tracking-widest">% of Price</th>
              </tr>
            </thead>
            <tbody>
              {priceBands.map((p, i) => {
                const r = calculateLTT({ price: p, isToronto, isFirstTimeBuyer: isFTHB });
                return (
                  <tr key={p} className={i > 0 ? 'border-t border-gray-100' : ''}>
                    <td className="p-3 font-black text-slate-900 tabular-nums">{formatCAD(p)}</td>
                    <td className="p-3 text-right tabular-nums font-bold">{formatCAD(r.netPayable)}</td>
                    <td className="p-3 text-right tabular-nums text-gray-500">{((r.netPayable / p) * 100).toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
