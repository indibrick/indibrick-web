
'use client';

import React from 'react';
import Link from 'next/link';
import { CITIES } from '../../data/cityData';
import { MapPin, ArrowRight, Building2, TrendingUp } from 'lucide-react';

export default function LocationsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-24 md:py-32 relative overflow-hidden border-b border-white/10">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
              <MapPin size={14} /> Regional Authority
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-8 leading-tight tracking-tighter uppercase">
              The Ontario Operating Hub
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed max-w-2xl font-medium">
              A comprehensive mortgage and real estate network serving every corner of the Greater Toronto Area.
            </p>
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {CITIES.map((city) => (
               <Link 
                 key={city.slug} 
                 href={`/mortgage-real-estate/${city.slug}`}
                 className="group p-10 bg-gray-50 border border-gray-100 rounded-[2.5rem] hover:bg-black hover:border-black transition-all duration-500 shadow-sm hover:shadow-2xl flex flex-col h-full"
               >
                 <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black shadow-sm group-hover:bg-white transition-colors duration-500">
                       <MapPin size={24} />
                    </div>
                    <div className="bg-black text-white px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-colors duration-500">
                       Local Hub
                    </div>
                 </div>
                 
                 <h2 className="text-3xl font-black text-black group-hover:text-white mb-4 uppercase tracking-tighter transition-colors duration-500">
                   {city.name}
                 </h2>
                 
                 <p className="text-gray-500 group-hover:text-gray-400 mb-10 transition-colors duration-500 font-medium leading-relaxed flex-grow">
                   {city.description}
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4 mb-10 border-t border-gray-100 pt-8 group-hover:border-white/10 transition-colors">
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-500">Avg Price</p>
                       <p className="text-lg font-black text-black group-hover:text-white">{city.avgHomePrice}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-500">Trend</p>
                       <div className="flex items-center gap-2 text-black group-hover:text-white">
                          <TrendingUp size={14} />
                          <p className="text-xs font-bold uppercase tracking-widest">Steady</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-auto flex items-center justify-between">
                    <span className="text-black group-hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors">Explore Local Hub</span>
                    <ArrowRight size={20} className="text-black group-hover:text-white group-hover:translate-x-2 transition-all duration-500" />
                 </div>
               </Link>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
}
