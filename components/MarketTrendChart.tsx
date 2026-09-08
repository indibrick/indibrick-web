'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTrendChartProps {
  city: string;
}

// Mock Data for visualization (This would eventually be dynamic)
const MOCK_DATA = [
  { month: 'Aug', price: 1050000 },
  { month: 'Sep', price: 1080000 },
  { month: 'Oct', price: 1065000 },
  { month: 'Nov', price: 1020000 },
  { month: 'Dec', price: 990000 },
  { month: 'Jan', price: 1015000 },
];

export default function MarketTrendChart({ city }: MarketTrendChartProps) {
  const maxPrice = Math.max(...MOCK_DATA.map(d => d.price)) * 1.1;
  const minPrice = Math.min(...MOCK_DATA.map(d => d.price)) * 0.9;
  
  const getHeight = (price: number) => {
    return ((price - minPrice) / (maxPrice - minPrice)) * 100;
  };

  const currentPrice = MOCK_DATA[MOCK_DATA.length - 1].price;
  const lastMonthPrice = MOCK_DATA[MOCK_DATA.length - 2].price;
  const diff = currentPrice - lastMonthPrice;
  const percentChange = ((diff / lastMonthPrice) * 100).toFixed(1);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
      <div className="flex justify-between items-start mb-8">
        <div>
           <h3 className="text-2xl font-black uppercase tracking-tight">{city} Market Pulse</h3>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Detached Price (6 Mo)</p>
        </div>
        <div className={`text-right ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
           <p className="text-3xl font-black">${(currentPrice / 1000).toFixed(0)}k</p>
           <p className="text-xs font-bold uppercase tracking-widest flex items-center justify-end gap-1">
             {diff > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {percentChange}% MoM
           </p>
        </div>
      </div>

      <div className="h-48 flex items-end justify-between gap-2 md:gap-4 relative px-2">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
           <div className="border-t border-dashed border-gray-400 w-full h-0"></div>
           <div className="border-t border-dashed border-gray-400 w-full h-0"></div>
           <div className="border-t border-dashed border-gray-400 w-full h-0"></div>
        </div>

        {MOCK_DATA.map((d, i) => (
          <div key={i} className="flex flex-col items-center w-full group relative z-10">
             <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition bg-black text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap">
                ${(d.price / 1000).toFixed(0)}k
             </div>
             <div 
               className="w-full md:w-8 bg-blue-100 rounded-t-xl relative overflow-hidden group-hover:bg-blue-600 transition duration-300"
               style={{ height: `${getHeight(d.price)}%` }}
             >
                <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-200 group-hover:bg-blue-500"></div>
             </div>
             <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase">{d.month}</p>
          </div>
        ))}
      </div>
    </div>
  );
}