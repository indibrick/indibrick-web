'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TriggerRateCalculator() {
  const [balance, setBalance] = useState(500000);
  const [payment, setPayment] = useState(2500);
  const [frequency, setFrequency] = useState('Monthly');
  
  const calculateTriggerRate = () => {
    let paymentsPerYear = 12;
    if (frequency === 'Bi-Weekly') paymentsPerYear = 26;
    if (frequency === 'Weekly') paymentsPerYear = 52;
    if (frequency === 'Semi-Monthly') paymentsPerYear = 24;

    const triggerRate = ((payment * paymentsPerYear) / balance) * 100;
    return triggerRate.toFixed(2);
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row gap-12 items-center">
      <div className="w-full md:w-1/2 space-y-6">
        <div>
           <h3 className="text-2xl font-black uppercase tracking-tight text-black mb-2">Trigger Rate Analyzer</h3>
           <p className="text-gray-500 text-sm font-medium">Calculate the rate where payments stop covering principal.</p>
        </div>
        <div className="space-y-4">
          <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold text-black focus:ring-2 focus:ring-black outline-none" placeholder="Mortgage Balance" />
          <input type="number" value={payment} onChange={(e) => setPayment(Number(e.target.value))} className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold text-black focus:ring-2 focus:ring-black outline-none" placeholder="Fixed Payment" />
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold text-black focus:ring-2 focus:ring-black outline-none appearance-none">
              <option value="Monthly">Monthly</option>
              <option value="Semi-Monthly">Semi-Monthly</option>
              <option value="Bi-Weekly">Bi-Weekly</option>
              <option value="Weekly">Weekly</option>
          </select>
        </div>
      </div>
      <div className="w-full md:w-1/2 bg-black text-white rounded-[2rem] p-10 text-center relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-20"><AlertTriangle size={100} /></div>
         <span className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] block mb-4">Danger Zone Rate</span>
         <span className="text-6xl md:text-7xl font-black text-white tracking-tighter block mb-4">{calculateTriggerRate()}%</span>
      </div>
    </div>
  );
}