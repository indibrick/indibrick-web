'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';

const MinimalNav: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="container mx-auto max-w-6xl px-4 md:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-black tracking-tighter text-slate-900 text-lg">
          indibrick<span className="text-blue-600">.</span>
        </Link>
        <div className="flex items-center gap-2">
          <a
            href="tel:+14372416392"
            className="hidden sm:inline-flex items-center gap-1.5 text-slate-900 hover:text-blue-600 px-3 py-1.5 text-xs font-black uppercase tracking-widest transition"
          >
            <Phone size={12} /> 437-241-6392
          </a>
          <Link
            href="/apply"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
          >
            Apply <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default MinimalNav;
