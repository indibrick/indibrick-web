'use client';

import React from 'react';
import { Phone, MessageSquare, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function MobileStickyBar() {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-6 md:hidden z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex gap-3">
      
      {/* 1. Quick Action: SMS/Text (High Response) */}
      <a 
        href="sms:+14372416392" // Replace with actual SMS capable number
        className="flex-1 bg-black text-white rounded-xl py-3 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-gray-800 active:scale-95 transition"
      >
        <MessageSquare size={16} /> Text Agent
      </a>

      {/* 2. Primary Action: Check Rates */}
      <Link 
        href="/rates"
        className="flex-1 bg-red-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-red-700 active:scale-95 transition"
      >
        <TrendingDown size={16} /> Check Rates
      </Link>

    </div>
  );
}