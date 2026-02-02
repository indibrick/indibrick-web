'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Calendar, Database } from 'lucide-react';

export default function AdminMarketIntelligence() {
  const [macroTrend, setMacroTrend] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [status, setStatus] = useState('idle');
  const [targetPeriod, setTargetPeriod] = useState('');

  useEffect(() => {
    // Calculate previous month for display
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    setTargetPeriod(date.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    await fetch('/api/admin/generate-market-reports', {
        method: 'POST',
        body: JSON.stringify({ macroTrend, adminKey }),
    });
    
    setStatus('success');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-12">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] shadow-xl p-12 border border-gray-100">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-10">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-black text-white rounded-2xl">
                 <Zap size={32} />
              </div>
              <div>
                 <h1 className="text-3xl font-black uppercase tracking-tight">Intelligence Hub</h1>
                 <p className="text-gray-500 font-medium">Monthly Data Generator</p>
              </div>
           </div>
           
           {/* TARGET DATE BADGE */}
           <div className="bg-blue-50 border border-blue-100 px-6 py-4 rounded-2xl text-right">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Target Period</p>
              <div className="flex items-center gap-2 text-blue-900 font-black text-xl">
                 <Calendar size={20} /> {targetPeriod}
              </div>
           </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-2xl mb-8">
           <p className="text-sm text-yellow-800 font-medium">
              <strong>Protocol:</strong> Run this on the <strong>7th</strong> of the month. 
              Real Estate Boards release official data between the 3rd and 5th. Running on the 7th ensures the AI has the most accurate "vibe" of what just happened.
           </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
           <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                 Macro Trend Context ({targetPeriod})
              </label>
              <textarea 
                value={macroTrend}
                onChange={(e) => setMacroTrend(e.target.value)}
                rows={4}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={`Example: ${targetPeriod} saw a surprising uptick in volume. Fixed rates dropped slightly, bringing buyers off the sidelines in the GTA...`}
                required
              />
           </div>

           <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Admin Key</label>
              <input 
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                required
              />
           </div>

           <button 
             type="submit" 
             disabled={status === 'loading'}
             className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition"
           >
             {status === 'loading' ? 'Analyzing 100 Cities...' : `Generate ${targetPeriod} Reports`}
           </button>
        </form>

      </div>
    </div>
  );
}