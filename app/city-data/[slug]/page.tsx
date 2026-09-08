import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
// --- FIX: Use '@/' for robust imports ---
import CityGate from '@/components/CityGate';
import JsonLd from '@/components/JsonLd';
import { MarketReportService } from '@/services/MarketReportService';
// ----------------------------------------
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { buildMetadata } from '@/lib/buildMetadata';
import { CityService } from '@/services/CityService';

interface Props {
  params: { slug: string };
}

// ISR — market reports refresh hourly; report-data ages slowly so this is plenty.
export const revalidate = 3600;

// Pre-render ONLY cities that have a real stored market report.
//
// This previously pre-rendered all ~41 cities, which was safe only because
// MarketReportService returned hardcoded mock data for every miss — so
// every city published the same invented $1.05M / 432-listings / 18-DOM
// report. Now that the mock is gone, a city without a report 404s, and
// pre-rendering a known-404 wastes build time and generates soft-404
// signals in Search Console. Cities gain a page automatically once their
// report lands in Firestore.
export async function generateStaticParams() {
  const cities = await CityService.getAllCities();
  const withReports = await Promise.all(
    cities.map(async (c) => ((await MarketReportService.getReport(c.slug)) ? c.slug : null)),
  );
  return withReports.filter((slug): slug is string => slug !== null).map((slug) => ({ slug }));
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

  // NOINDEX until the underlying data has a cited source.
  //
  // The outright fabrications are gone — the constant-valued six-month price
  // chart, the "ROI +12%" figures that were literally `12 - arrayIndex`, and
  // the hardcoded "Confidence: HIGH" were all removed. What remains comes from
  // the `market_reports` Firestore collection, which is sparsely populated and
  // carries no source attribution, so these pages are not yet something to put
  // in front of search or answer engines on a regulated site.
  //
  // noindex,follow rather than deletion: the pages stay live and readable and
  // any inbound link equity still flows. Remove this flag once the reports
  // carry a named, dated source.
  return buildMetadata({
    title: `${report.cityName} Real Estate Market Report 2026`,
    description: `Market context for ${report.cityName}, Ontario — pricing, velocity and buyer considerations for 2026.`,
    slug: `/city-data/${params.slug}`,
    noindex: true,
  });
}

export default async function CityReportPage({ params }: Props) {
  const report = await MarketReportService.getReport(params.slug);
  if (!report) notFound();

  // Author is the licensed brokerage entity, not "IndiBrick AI".
  // Advertising machine authorship on YMYL financial content actively
  // suppresses E-E-A-T — Google's quality raters are instructed to weigh
  // who is accountable for the claims, and "AI" is not an accountable
  // party. Reference the single Organization node declared in layout.tsx
  // so the credential graph (FSRA #12830) resolves.
  const reportSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${report.cityName} Market Analysis 2026`,
    "datePublished": report.reportDate || new Date().toISOString(),
    "author": { "@id": "https://indibrick.ca/#organization" },
    "publisher": { "@id": "https://indibrick.ca/#organization" },
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

                        </li>
                     ))}
                  </ul>
               </div>

               {/* 3. PRICE CHART (Reusing your component) */}
            </div>

         </CityGate>
      </div>
    </div>
  );
}