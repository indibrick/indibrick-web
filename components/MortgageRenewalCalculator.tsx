'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function MortgageRenewalCalculator() {
  const [balance, setBalance] = useState(450000);
  const [oldRate, setOldRate] = useState(2.99);
  const [newRate, setNewRate] = useState(5.09);
  const [amortization, setAmortization] = useState(20);

  const calculatePayment = (r: number) => {
    const monthlyRate = r / 100 / 12;
    const months = amortization * 12;
    return (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  };

  const oldPmt = calculatePayment(oldRate);
  const newPmt = calculatePayment(newRate);
  const difference = newPmt - oldPmt;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
      <div className="bg-black text-white p-8">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Renewal Shock Test</h3>
        <p className="text-gray-400 text-sm">Compare your old rate vs. market rates</p>
      </div>
      <div className="p-8 md:p-12 flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/2 space-y-6">
           <input type="number" placeholder="Balance" value={balance} onChange={e => setBalance(Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" />
           <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Old Rate %" value={oldRate} onChange={e => setOldRate(Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" />
              <input type="number" placeholder="New Rate %" value={newRate} onChange={e => setNewRate(Number(e.target.value))} className="w-full p-4 bg-gray-50 rounded-xl font-bold border-none outline-none" />
           </div>
        </div>
        <div className="w-full md:w-1/2 bg-gray-50 rounded-2xl p-8 flex flex-col justify-center text-center">
           <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Monthly Increase</p>
           <h2 className="text-5xl font-black text-red-600 tracking-tighter">+${Math.round(difference).toLocaleString()}</h2>
           <p className="text-sm font-bold text-gray-500 mt-2">Per Month</p>
        </div>
      </div>
    </div>
  );
}