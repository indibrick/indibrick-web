'use client';

import React, { useState, useMemo } from 'react';
import { calculateClosingCosts, formatCAD } from '../../lib/mortgageEngine';
import { CurrencyInput, ToggleInput } from './inputs';
import { ResultCard, ResultRow } from './results';

export default function ClosingCostsCalc() {
  const [price, setPrice] = useState(750_000);
  const [downPayment, setDownPayment] = useState(150_000);
  const [isToronto, setIsToronto] = useState(true);
  const [isFTHB, setIsFTHB] = useState(true);
  const [isNewBuild, setIsNewBuild] = useState(false);

  const result = useMemo(() => calculateClosingCosts({
    price, downPayment, isToronto, isFirstTimeBuyer: isFTHB, isNewBuild,
  }), [price, downPayment, isToronto, isFTHB, isNewBuild]);

  const totalWithDown = result.totalCashRequired + downPayment;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      {/* INPUTS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 space-y-5 h-fit">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Your Purchase</p>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">Inputs</h2>
        </div>

        <CurrencyInput label="Purchase Price" value={price} onChange={setPrice} step={5000} />
        <CurrencyInput label="Down Payment" value={downPayment} onChange={setDownPayment} step={1000} />

        <ToggleInput
          label="Location"
          value={isToronto ? 'toronto' : 'ontario'}
          onChange={v => setIsToronto(v === 'toronto')}
          options={[
            { value: 'ontario', label: 'Ontario' },
            { value: 'toronto', label: 'Toronto (416)' },
          ]}
        />

        <ToggleInput
          label="First-Time Buyer"
          value={isFTHB ? 'yes' : 'no'}
          onChange={v => setIsFTHB(v === 'yes')}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ]}
        />

        <ToggleInput
          label="Property Type"
          value={isNewBuild ? 'new' : 'resale'}
          onChange={v => setIsNewBuild(v === 'new')}
          options={[
            { value: 'resale', label: 'Resale' },
            { value: 'new', label: 'New Build' },
          ]}
          helpText={isNewBuild ? 'skip inspection + appraisal' : 'includes inspection + appraisal'}
        />
      </div>

      {/* OUTPUTS */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultCard
            label="Total Cash Required at Closing"
            value={formatCAD(totalWithDown)}
            sublabel={`Down + closing costs`}
            accent="slate"
          />
          <ResultCard
            label="Closing Costs Only"
            value={formatCAD(result.totalCashRequired)}
            sublabel={`${((result.totalCashRequired / price) * 100).toFixed(2)}% of purchase price`}
            accent="blue"
            size="md"
          />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Line-by-line breakdown</p>
          <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-4">Every cash-out-of-pocket cost</h3>
          <div className="space-y-1">
            <ResultRow label="Down payment" value={formatCAD(downPayment)} emphasis />
            <ResultRow label="Land Transfer Tax (net)" value={formatCAD(result.landTransferTax)} />
            {result.pstOnCMHC > 0 && <ResultRow label="Ontario 8% PST on CMHC" value={formatCAD(result.pstOnCMHC)} color="text-red-600" />}
            <ResultRow label="Legal fees + disbursements" value={formatCAD(result.legalFees)} />
            <ResultRow label="Title insurance" value={formatCAD(result.titleInsurance)} />
            {result.appraisal > 0 && <ResultRow label="Home appraisal" value={formatCAD(result.appraisal)} />}
            {result.homeInspection > 0 && <ResultRow label="Home inspection" value={formatCAD(result.homeInspection)} />}
            <ResultRow label="Prepaid adjustments (est.)" value={formatCAD(result.adjustments)} helpText="property tax + utility credits to seller" />
            <ResultRow label="Total cash required" value={formatCAD(totalWithDown)} emphasis color="text-slate-900" />
          </div>
        </div>

        {result.cmhcPremium > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">CMHC premium (financed, not cash)</p>
            <p className="text-2xl font-black tabular-nums text-slate-900">{formatCAD(result.cmhcPremium)}</p>
            <p className="text-xs text-amber-900 mt-2 leading-relaxed">
              Added to your mortgage balance — you don&apos;t pay this in cash. But the 8% Ontario PST on it ({formatCAD(result.pstOnCMHC)}) IS cash — included in the total above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
