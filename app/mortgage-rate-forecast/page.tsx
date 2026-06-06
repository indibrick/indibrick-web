import React from 'react';
import Link from 'next/link';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Ontario Mortgage Rate Forecast 2026 — Bond Yield Analysis',
  description: 'Live analysis of the 5-Year Canada Bond Yield vs. Fixed Mortgage Rates. Expert predictions for 2026 interest rate cuts.',
  slug: '/mortgage-rate-forecast',
  keywords: ['Mortgage Rate Forecast 2026', 'Canada Bond Yields', 'Prime Rate Prediction', 'Will mortgage rates go down'],
});

export default function ForecastPage() {
  const forecastSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Ontario Mortgage Rate Forecast: 2026 Outlook",
    "datePublished": new Date().toISOString(),
    "author": { "@type": "Organization", "name": "IndiBrick Market Intelligence" },
    "publisher": { "@type": "Organization", "name": "IndiBrick" }
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={forecastSchema} />

      {/* HERO */}
      <div className="container mx-auto px-6 max-w-5xl text-center mb-20">
         <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 animate-pulse">
            <Activity size={14} /> Live Market Data
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-none text-slate-900">
           Rate Forecast <br/><span className="text-gray-300">2026.</span>
         </h1>
         <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            Don't guess. We track the <strong>5-Year Bond Yield</strong> daily to predict Fixed Rate movements before the banks announce them.
         </p>
      </div>

      {/* DASHBOARD GRID */}
      <div className="container mx-auto px-6 max-w-6xl mb-24">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: BOND YIELD */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
                     <TrendingDown size={14} className="text-red-500"/> Leading Indicator
                  </div>
                  <h3 className="text-4xl font-black mb-2">3.12%</h3>
                  <p className="text-sm font-medium text-gray-400">5-Year Gov Bond Yield</p>
                  <div className="mt-8 pt-8 border-t border-white/10">
                     <p className="text-xs leading-relaxed text-gray-400">
                        <strong>Signal:</strong> Bonds are trading lower, suggesting Fixed Rates should drop by 0.10% - 0.15% soon.
                     </p>
                  </div>
               </div>
            </div>

            {/* CARD 2: VARIABLE SPREAD */}
            <div className="bg-gray-100 p-8 rounded-[2.5rem] relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 text-gray-500 text-xs font-bold uppercase tracking-widest">
                     <TrendingUp size={14} className="text-green-600"/> Prime Rate Gap
                  </div>
                  <h3 className="text-4xl font-black mb-2 text-black">-0.90%</h3>
                  <p className="text-sm font-medium text-gray-500">Variable Discount (Prime - X)</p>
                  <div className="mt-8 pt-8 border-t border-gray-200">
                     <p className="text-xs leading-relaxed text-gray-500">
                        <strong>Signal:</strong> Lenders are aggressive. We are seeing discounts as deep as Prime - 1.10% for high-ratio files.
                     </p>
                  </div>
               </div>
            </div>

            {/* CARD 3: THE VERDICT */}
            <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 text-blue-200 text-xs font-bold uppercase tracking-widest">
                     <AlertTriangle size={14} /> The Strategy
                  </div>
                  <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">Float then Fix?</h3>
                  <p className="text-sm font-medium text-blue-100">Current Recommendation</p>
                  <div className="mt-8 pt-8 border-t border-blue-500">
                     <p className="text-xs leading-relaxed text-blue-100">
                        The spread between Fixed and Variable is narrowing. Short-term variable strategies are risky but offer higher upside if BoC cuts aggressively.
                     </p>
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* ANALYSIS CONTENT */}
      <div className="container mx-auto px-6 max-w-4xl">
         <div className="prose prose-lg prose-headings:font-black prose-p:text-gray-600 mb-16">
            <h2>The "Bond Yield" Correlation Explained</h2>
            <p>
               Banks don't pick fixed rates out of thin air. They base them on the <strong>Government of Canada 5-Year Bond Yield</strong> plus a spread (profit margin).
            </p>
            <p>
               Right now, the Bond Yield is hovering around 3.12%. Typically, banks price 5-year fixed mortgages about 1.50% above this yield. That means "Fair Value" for a fixed mortgage is roughly <strong>4.62%</strong>.
            </p>
            <p>
               However, <Link href="/rates">our exclusive rates</Link> are beating this spread because of volume discounts. We are seeing lenders cut into their own margins to win market share.
            </p>
         </div>

         <div className="bg-gray-50 p-12 rounded-[3rem] border border-gray-100 text-center">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Don't time the market alone.</h2>
            <p className="text-gray-500 mb-8">Get notified instantly when our "Buy Signal" flashes.</p>
            <LeadForm type="General" title="Join the Watchlist" subtitle="Weekly market intelligence briefing." />
         </div>
      </div>
    </div>
  );
}