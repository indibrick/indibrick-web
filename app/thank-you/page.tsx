
'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, Phone, Calendar, ArrowRight, BookOpen } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-20 px-6">
      <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-black text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl mb-8">
          <CheckCircle size={48} />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-black tracking-tighter uppercase leading-none">
          MISSION RECEIVED.
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
          Your request has been routed to our specialist network. 
          An advisor will contact you within <span className="text-black font-black">24 hours</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 text-left">
           <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start gap-4">
              <div className="bg-black text-white p-3 rounded-xl shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="font-black uppercase text-xs tracking-widest mb-2">Check Your Email</h3>
                <p className="text-sm text-gray-500">We've sent a confirmation with the next steps of your custom financing strategy.</p>
              </div>
           </div>
           
           <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start gap-4">
              <div className="bg-black text-white p-3 rounded-xl shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="font-black uppercase text-xs tracking-widest mb-2">Call Direct</h3>
                <p className="text-sm text-gray-500 font-bold text-black">Need it faster? Dial (437) 241-6392 to speak with us now.</p>
              </div>
           </div>
        </div>

        <div className="pt-16 border-t border-gray-100 flex flex-col items-center">
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-6">Continue Exploring the Ecosystem</p>
           <div className="flex flex-wrap justify-center gap-4">
             <Link href="/services" className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 transition">
               <BookOpen size={14} /> Mortgage Hub
             </Link>
             <Link href="/listings" className="flex items-center gap-2 bg-white text-black border border-black px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition">
               View Listings <ArrowRight size={14} />
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
