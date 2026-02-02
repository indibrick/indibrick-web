'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle, TrendingDown } from 'lucide-react';
import { LeadService } from '../services/LeadService';

export default function RateWatch() {
  const [email, setEmail] = useState('');
  const [targetRate, setTargetRate] = useState('3.29');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // Submit as a specialized lead type
    const result = await LeadService.submitLead({
      name: 'Rate Watch Subscriber',
      email: email,
      phone: '000-000-0000', // Placeholder or optional
      serviceNeeded: 'General',
      city: 'Ontario',
      consent: true,
      message: `RATE WATCH ALERT: Notify me when rates drop below ${targetRate}%`
    });

    if (result.success) setStatus('success');
    else setStatus('idle'); // Handle error ideally
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex items-center gap-4 animate-fade-in">
        <div className="bg-green-100 p-3 rounded-full text-green-700"><CheckCircle size={24} /></div>
        <div>
          <h4 className="font-black text-green-900 uppercase text-xs tracking-widest">Alert Set</h4>
          <p className="text-green-800 text-sm">We'll text/email you the second rates drop.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/30 transition duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
           <Bell className="text-yellow-400 animate-pulse" size={24} />
           <h3 className="font-black uppercase tracking-tight text-xl">Never Miss a Drop</h3>
        </div>
        <p className="text-slate-400 mb-6 text-sm font-medium">
           The market moves fast. Set your target rate, and we'll notify you before the public knows.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
           <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/10">
              <TrendingDown size={18} className="text-white/50" />
              <span className="text-xs font-bold text-slate-400 uppercase">Notify if under:</span>
              <input 
                type="number" 
                step="0.01" 
                value={targetRate} 
                onChange={(e) => setTargetRate(e.target.value)}
                className="bg-transparent text-white font-black w-16 focus:outline-none text-right"
              />
              <span className="text-white font-black">%</span>
           </div>

           <input 
             type="email" 
             required 
             placeholder="Enter your email" 
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             className="w-full p-3 rounded-xl bg-white text-black font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
           />

           <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl transition shadow-lg">
              Set Rate Alert
           </button>
        </form>
      </div>
    </div>
  );
}