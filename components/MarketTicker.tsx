'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

export default function MarketTicker() {
  // In a real app, these could be fetched from your AdminContext or an API
  const metrics = [
    { label: 'Prime Rate', value: '5.95%', trend: 'down', change: '-0.25%' },
    { label: '5-Yr Bond Yield', value: '3.12%', trend: 'up', change: '+0.04%' },
    { label: 'Qualifying Rate (B-20)', value: '5.25%', trend: 'flat', change: '0.00%' },
    { label: 'Avg Toronto Detached', value: '$1.45M', trend: 'down', change: '-2.1%' },
    { label: 'TSX Capped REIT', value: '168.40', trend: 'up', change: '+1.2%' },
  ];

  return (
    <div className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest py-2 overflow-hidden border-b border-white/10 relative z-50">
      <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
        {/* Duplicate the list to ensure seamless infinite scroll */}
        {[...metrics, ...metrics, ...metrics].map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-slate-400">{m.label}:</span>
            <span className="text-white font-black">{m.value}</span>
            <span className={`flex items-center ${
                m.trend === 'up' ? 'text-green-400' : 
                m.trend === 'down' ? 'text-red-400' : 'text-gray-500'
            }`}>
              {m.trend === 'up' && <TrendingUp size={10} className="mr-1" />}
              {m.trend === 'down' && <TrendingDown size={10} className="mr-1" />}
              {m.trend === 'flat' && <Activity size={10} className="mr-1" />}
              {m.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}