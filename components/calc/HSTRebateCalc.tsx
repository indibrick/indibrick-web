'use client';

import React, { useState, useMemo } from 'react';
import { calculateHSTRebate, formatCAD } from '../../lib/mortgageEngine';
import { CurrencyInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function HSTRebateCalc() {
  const [pricePreHST, setPricePreHST] = useState(600_000);

  const result = useMemo(() => calculateHSTRebate(pricePreHST), [pricePreHST]);

  const priceIncludingHST = pricePreHST + result.netHST;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1">Your New Home Purchase</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Price BEFORE HST" value={pricePreHST} onChange={setPricePreHST} step={5000} helpText="the builder&apos;s base price" />

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-900">
          <p className="font-black mb-1">Ontario New Housing HST Rebate</p>
          <p>Applies to new-build homes and condos where you or a close relation will live in the property. Not applicable to resale, investment properties, or short-term rentals.</p>
        </div>
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Total HST Rebate"
            value={formatCAD(result.totalRebate)}
            sublabel="Federal + Ontario portions combined"
            accent="emerald"
          />
          <ResultCard
            label="Net HST You Pay"
            value={formatCAD(result.netHST)}
            sublabel={`After rebates · Home total: ${formatCAD(priceIncludingHST)}`}
            accent="slate"
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2">Rebate breakdown</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">Where each rebate comes from</h3>
          <div className="space-y-1">
            <ResultRow label="Price before HST" value={formatCAD(pricePreHST)} />
            <ResultRow label="Full HST (13%)" value={formatCAD(pricePreHST * 0.13)} color="text-red-600" />
            <ResultRow label="Federal rebate (36% of 5% GST, phased out over $450k)" value={`− ${formatCAD(result.federalRebate)}`} color="text-emerald-700" />
            <ResultRow label="Ontario rebate (75% of 8% provincial, capped at $24k)" value={`− ${formatCAD(result.ontarioRebate)}`} color="text-emerald-700" />
            <ResultRow label="Total rebate" value={`− ${formatCAD(result.totalRebate)}`} emphasis color="text-emerald-700" />
            <ResultRow label="Net HST payable" value={formatCAD(result.netHST)} emphasis color="text-slate-900" />
            <ResultRow label="Total home cost (with HST)" value={formatCAD(priceIncludingHST)} emphasis />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-3xl p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-700 mb-2">Important nuance</p>
          <p className="text-sm text-purple-900 leading-relaxed">
            Most builders include the HST rebate in their advertised price — meaning the price you see is already NET of the rebate the builder claims on your behalf. If you buy pre-construction as an INVESTMENT (renting it out short- or long-term), you may lose eligibility and owe the rebate back. Talk to a real estate lawyer before signing an Agreement of Purchase and Sale on a pre-con unit you don&apos;t plan to live in.
          </p>
        </div>
      </div>
    </div>
  );
}
