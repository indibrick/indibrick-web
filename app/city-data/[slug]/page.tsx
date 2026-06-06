import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
// --- FIX: Use '@/' for robust imports ---
import CityGate from '@/components/CityGate';
import MarketTrendChart from '@/components/MarketTrendChart';
import JsonLd from '@/components/JsonLd';
import { MarketReportService } from '@/services/MarketReportService';
// ----------------------------------------
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { buildMetadata } from '@/lib/buildMetadata';

interface Props {
  params: { slug: string };
}

// 1. DYNAMIC SEO METADATA (Visible to Google)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = await MarketReportService.getReport(params.slug);
  if (!report) {
    return buildMetadata({
      title: 'City Not Found',
      description: 'The requested city market report could not be located.',
      slug: `/city-data/${params.slug}`,
    });
  }

  return buildMetadata({
    title: `${report.cityName} Real Estate Market Report 2026 — AI Forecast`,
    description: `Is now a good time to buy in ${report.cityName}? Access our 2026 AI-driven market analysis, price trends, and investor scores.`,
    slug: `/city-data/${params.slug}`,
  });
}

export default async function CityReportPage({ params }: Props) {
  const report = await MarketReportService.getReport(params.slug);
  if (!report) notFound();

  const reportSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${report.cityName} Market Analysis 2026`,
    "datePublished": new Date().toISOString(),
    "author": { "@type": "Organization", "name": "IndiBrick AI" }
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={reportSchema} />

      {/* --- PUBLIC TEASER SECTION (Visible to SEO & Humans) --- */}
      <div className="container mx-auto px-6 max-w-5xl mb-12">
         <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-100 pb-8">
            <div>
               <span className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                  Market Report
               </span>
               <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                  {report.cityName}
               </h1>
            </div>
            <div className="text-right mt-6 md:mt-0">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Home Price</p>
               <p className="text-4xl font-black">${report.averagePrice.toLocaleString()}</p>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-gray-50 p-6 rounded-2xl">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Listings</p>
               <p className="text-2xl font-black">{report.activeListings}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Days on Market</p>
               <p className="text-2xl font-black">{report.dom}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl col-span-2">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Market Status</p>
               <p className="text-xl font-black text-blue-600 uppercase">
                  {report.dom < 20 ? "Seller's Market 🔥" : "Balanced Market ⚖️"}
               </p>
            </div>
         </div>

         <div className="prose prose-lg mb-12">
            <h3>Executive Summary</h3>
            <p>{report.summary}</p>
         </div>
      </div>

      {/* --- GATED SECTION (Requires Email) --- */}
      <div className="container mx-auto px-6 max-w-5xl">
         <CityGate cityName={report.cityName}>
            
            {/* 1. AI FORECAST */}
            <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="bg-blue-600 p-2 rounded-lg"><Target size={20}/></div>
                     <h3 className="text-2xl font-black uppercase tracking-tight">Gemini AI™ Forecast</h3>
                  </div>
                  <p className="text-xl font-medium leading-relaxed text-blue-100 mb-8">
                     "{report.aiForecast}"
                  </p>
                  <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                     <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Buy/Sell Score</p>
                        <div className="flex items-end gap-2">
                           <span className="text-4xl font-black text-white">{report.buySellScore}</span>
                           <span className="text-sm font-bold text-gray-500 mb-2">/ 10</span>
                        </div>
                     </div>
                     <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Confidence</p>
                        <span className="text-green-400 font-bold uppercase tracking-wider text-sm">High</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* 2. INVESTOR HOTSPOTS */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
               <div className="bg-white border border-gray-200 p-8 rounded-[2.5rem] shadow-lg">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                     <AlertCircle className="text-red-500"/> Investor Hotspots
                  </h3>
                  <ul className="space-y-4">
                     {report.investorHotspots.map((spot, i) => (
                        <li key={i} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0">
                           <span className="font-bold text-slate-800">{spot}</span>
                           <span className="text-xs font-black bg-green-100 text-green-700 px-2 py-1 rounded">ROI +{12 - i}%</span>
                        </li>
                     ))}
                  </ul>
               </div>

               {/* 3. PRICE CHART (Reusing your component) */}
               <MarketTrendChart city={report.cityName} />
            </div>

         </CityGate>
      </div>
    </div>
  );
}