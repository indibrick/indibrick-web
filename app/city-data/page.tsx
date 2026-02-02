import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '../../components/JsonLd';
import { CityService } from '../../services/CityService';
import { Map, BarChart2, Zap, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ontario Real Estate Market Data 2026 | AI Analysis for 100 Cities',
  description: 'Deep market intelligence powered by Gemini AI. Compare average home prices, market velocity, and investor scores for 100+ Ontario communities.',
};

export default async function CityDataHub() {
  const cities = await CityService.getAllCities();

  // Sort cities alphabetically
  const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));

  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Ontario City Market Reports",
    "description": "Monthly AI-generated real estate reports.",
    "publisher": { "@type": "Organization", "name": "IndiBrick" }
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={hubSchema} />

      {/* HERO */}
      <div className="container mx-auto px-6 max-w-7xl text-center mb-20">
         <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block border border-blue-100">
            Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
         </span>
         <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-6 text-slate-900 leading-none">
            Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Intelligence.</span>
         </h1>
         <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium leading-relaxed">
            We use advanced AI to analyze millions of data points across Ontario. Select a city to unlock price forecasts, "Buy/Sell" scores, and investor hotspots.
         </p>
      </div>

      {/* FEATURE CARDS */}
      <div className="container mx-auto px-6 max-w-6xl mb-24 grid md:grid-cols-3 gap-8">
         {[
            { icon: Zap, title: "AI Forecasts", text: "Predictive modeling for price movements in Q3/Q4 2026." },
            { icon: Map, title: "Hyper-Local", text: "Drill down from City level to specific investor pockets." },
            { icon: BarChart2, title: "Live Trends", text: "Real-time absorption rates and Days on Market (DOM)." }
         ].map((f, i) => (
            <div key={i} className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center">
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm text-black">
                  <f.icon size={24} />
               </div>
               <h3 className="text-lg font-black uppercase tracking-tight mb-2">{f.title}</h3>
               <p className="text-gray-500 text-sm">{f.text}</p>
            </div>
         ))}
      </div>

      {/* 100 CITY GRID */}
      <div className="container mx-auto px-6 max-w-7xl">
         <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-black uppercase tracking-tight">Select Region</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">{cities.length} Markets</span>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedCities.map((city) => (
               <Link 
                 key={city.slug} 
                 href={`/city-data/${city.slug}`}
                 className="group bg-white border border-gray-200 p-4 rounded-xl hover:bg-black hover:border-black hover:text-white transition duration-300 flex items-center justify-between"
               >
                  <span className="text-xs font-black uppercase tracking-wider truncate">{city.name}</span>
                  <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition" />
               </Link>
            ))}
         </div>
      </div>
    </div>
  );
}