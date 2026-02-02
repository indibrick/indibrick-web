'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ArrowRight, CheckCircle } from 'lucide-react';
import { LeadService } from '../services/LeadService';

interface CityGateProps {
  children: React.ReactNode;
  cityName: string;
}

export default function CityGate({ children, cityName }: CityGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check LocalStorage on mount
    const access = localStorage.getItem('indibrick_vip_access');
    if (access === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Capture Lead
    await LeadService.submitLead({
      name: 'Market Report Subscriber',
      email: email,
      phone: '000-000-0000',
      city: cityName,
      serviceNeeded: 'Market Report Access',
      consent: true,
      message: `User unlocked 2026 Market Data for ${cityName}`
    });

    // 2. Set Cookie/Local Storage
    localStorage.setItem('indibrick_vip_access', 'true');
    localStorage.setItem('user_email', email);

    // 3. Unlock UI
    setTimeout(() => {
        setIsUnlocked(true);
        setLoading(false);
    }, 800);
  };

  if (isUnlocked) {
    return (
      <div className="relative animate-fade-in">
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest mb-6 inline-flex items-center gap-2">
            <Unlock size={14} /> VIP Access Active
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 1. BLURRED PREVIEW OF CONTENT */}
      <div className="blur-sm select-none opacity-30 pointer-events-none h-[400px] overflow-hidden">
        {children}
      </div>

      {/* 2. THE LOCK OVERLAY */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-lg w-full text-center mx-4">
           <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
           </div>
           <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Unlock {cityName} Data</h3>
           <p className="text-gray-500 mb-8 font-medium">
              Access Gemini AI forecasts, 5-year price trends, and investor "Hotspot" scores. 
              <br/><span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 block">Enter email once. Unlock all 100 cities.</span>
           </p>

           <form onSubmit={handleUnlock} className="flex flex-col gap-3">
              <input 
                type="email" 
                required 
                placeholder="Enter your email..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-black transition"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Unlocking...' : 'View Full Report'} <ArrowRight size={16} />
              </button>
           </form>
           
           <div className="mt-6 flex justify-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> No Spam</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> Instant Access</span>
           </div>
        </div>
      </div>
    </div>
  );
}