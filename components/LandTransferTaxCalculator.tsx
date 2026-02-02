'use client';

import React, { useState, useMemo } from 'react';
import { Building2, MapPin, CheckCircle } from 'lucide-react';

export default function LandTransferTaxCalculator() {
  const [price, setPrice] = useState(900000);
  const [isToronto, setIsToronto] = useState(true);
  const [isFtb, setIsFtb] = useState(true);

  const calculateTax = (amount: number) => {
    let tax = 0;
    if (amount > 2000000) tax += (amount - 2000000) * 0.025;
    if (amount > 400000) tax += (Math.min(amount, 2000000) - 400000) * 0.020;
    if (amount > 250000) tax += (Math.min(amount, 400000) - 250000) * 0.015;
    if (amount > 55000) tax += (Math.min(amount, 250000) - 55000) * 0.010;
    if (amount > 0) tax += (Math.min(amount, 55000)) * 0.005;
    return tax;
  };

  const results = useMemo(() => {
    const provincialTax = calculateTax(price);
    const municipalTax = isToronto ? calculateTax(price) : 0;
    
    // Rebates (Max $4,000 for ON, $4,475 for Toronto)
    const provincialRebate = isFtb ? Math.min(provincialTax, 4000) : 0;
    const municipalRebate = (isFtb && isToronto) ? Math.min(municipalTax, 4475) : 0;

    const totalTax = (provincialTax - provincialRebate) + (municipalTax - municipalRebate);

    return { provincialTax, municipalTax, provincialRebate, municipalRebate, totalTax };
  }, [price, isToronto, isFtb]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
      <div className="bg-black text-white p-8">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">LTT Estimator</h3>
        <p className="text-gray-400 text-sm">Ontario & Toronto Land Transfer Tax</p>
      </div>
      <div className="p-8 md:p-12 flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/2 space-y-6">
           <div>
             <label className="block text-xs font-black uppercase tracking-widest mb-2">Purchase Price</label>
             <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none focus:ring-2 focus:ring-black outline-none" />
           </div>
           <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition">
                 <input type="checkbox" checked={isToronto} onChange={e => setIsToronto(e.target.checked)} className="w-5 h-5 text-black" />
                 <span className="font-bold text-sm">Property is in Toronto (416)</span>
              </label>
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-black transition">
                 <input type="checkbox" checked={isFtb} onChange={e => setIsFtb(e.target.checked)} className="w-5 h-5 text-black" />
                 <span className="font-bold text-sm">I am a First-Time Home Buyer</span>
              </label>
           </div>
        </div>
        <div className="w-full md:w-1/2 bg-gray-50 rounded-2xl p-8">
           <div className="space-y-4 mb-8">
             <div className="flex justify-between text-sm"><span className="text-gray-500">Ontario Tax</span> <span className="font-bold">${results.provincialTax.toLocaleString()}</span></div>
             {isToronto && <div className="flex justify-between text-sm"><span className="text-gray-500">Toronto Tax</span> <span className="font-bold">${results.municipalTax.toLocaleString()}</span></div>}
             {isFtb && <div className="flex justify-between text-sm text-green-600"><span className="font-bold">Total Rebates</span> <span className="font-bold">-${(results.provincialRebate + results.municipalRebate).toLocaleString()}</span></div>}
           </div>
           <div className="pt-6 border-t border-gray-200">
             <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Tax Payable</p>
             <p className="text-4xl font-black tracking-tighter">${results.totalTax.toLocaleString()}</p>
             <p className="text-[10px] text-gray-400 mt-2">Added to your closing costs (cannot be added to mortgage).</p>
           </div>
        </div>
      </div>
    </div>
  );
}