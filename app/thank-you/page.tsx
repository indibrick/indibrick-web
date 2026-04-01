'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Zap, ShieldCheck, ArrowRight, Clock, Building2 } from 'lucide-react';

export default function ThankYouPage() {
  
  // Scroll to top on load for mobile friendliness
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-32 px-6 font-sans">
      <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in">
        
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-200 mb-8">
          <CheckCircle size={48} />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
          Request <br className="md:hidden"/> <span className="text-green-500">Received.</span>
        </h1>
        
        <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
          Your profile is securely in our system. A Senior Advisor will review your details and contact you shortly to build your strategy.
        </p>

        {/* --- SALES ORIENTED FAST-TRACK BOX --- */}
        <div className="bg-white p-8 md:p-14 rounded-[3rem] shadow-2xl border border-gray-100 mt-16 relative overflow-hidden text-left">
           
           {/* Cinematic Glow */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
           
           <div className="relative z-10 grid lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-3">
                 <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 animate-pulse">
                    <Zap size={14} className="fill-blue-600" /> Fast-Track Your File
                 </div>
                 
                 <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-4 leading-tight">
                    Lock Your Rate <br/> Instantly.
                 </h2>
                 
                 <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                    Why wait? You can skip the line by completing your secure digital application right now. Lock in today's lowest wholesale rates for 120 days. <strong>Takes 3 minutes. No impact on your credit score.</strong>
                 </p>

                 <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-6 mb-8 lg:mb-0">
                    <div className="flex items-center gap-3">
                       <ShieldCheck size={24} className="text-green-500" />
                       <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Bank-Level Security</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Clock size={24} className="text-blue-500" />
                       <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">24hr Underwriting</span>
                    </div>
                 </div>
              </div>

              {/* The Massive Button */}
              <div className="lg:col-span-2 flex justify-center lg:justify-end">
                 <a 
                   href="https://gopineapple.ca/muditchhura/preapproval" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="w-full h-full min-h-[160px] bg-slate-900 text-white p-8 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-600 transition duration-300 shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center text-center gap-4 group"
                 >
                   <span className="text-xl md:text-2xl">Apply Online<br/>Now</span>
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                      <ArrowRight size={24} />
                   </div>
                 </a>
              </div>
           </div>
        </div>

        {/* --- SECONDARY NAVIGATION --- */}
        <div className="pt-16 flex flex-col items-center">
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-6">Or continue exploring</p>
           <div className="flex flex-wrap justify-center gap-4">
             <Link href="/rates" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition uppercase tracking-widest bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-xl">
               View Live Rates
             </Link>
             <Link href="/listings" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition uppercase tracking-widest bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-xl">
               Exclusive Listings
             </Link>
           </div>
        </div>

      </div>
    </div>
  );
}