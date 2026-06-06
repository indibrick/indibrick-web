import React from 'react';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import {
  ShieldCheck, Truck, Home, Briefcase,
  Umbrella, AlertTriangle, CheckCircle, Car,
  PieChart, TrendingUp, Anchor
} from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Commercial, Auto & Home Insurance Ontario — RIBO Licensed Brokers',
  description: 'Get the cheapest and most comprehensive quotes for Business, Fleet, and Property insurance. Dedicated RIBO licensed advisors shopping 20+ markets for you.',
  slug: '/commercial-auto-home-insurance',
  keywords: ['Commercial Insurance Ontario', 'Auto Insurance Quote Toronto', 'Home Insurance Bundles', 'RIBO Licensed Broker', 'Business Liability Insurance', 'Fleet Insurance'],
});

export default function GeneralInsurancePage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "General Insurance Services",
    "provider": {
      "@type": "Organization",
      "name": "IndiBrick Insurance Network",
      "slogan": "Protected by RIBO Licensed Experts"
    },
    "areaServed": { "@type": "State", "name": "Ontario" },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Insurance Products",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial General Liability" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Auto Fleet" } },
        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "High-Value Home Insurance" } }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Why use a RIBO licensed broker instead of a bank?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A RIBO (Registered Insurance Brokers of Ontario) licensed broker works for YOU, not the insurance company. They have access to multiple markets (Intact, Aviva, Wawanesa, etc.) and are legally obligated to find you the best coverage for your needs, whereas a bank agent can only sell their own specific product."
        }
      },
      {
        "@type": "Question",
        "name": "How can I lower my commercial insurance premiums?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bundling commercial property with auto fleet policies is the most effective strategy. Additionally, increasing deductibles and installing monitored security systems can significantly reduce premiums."
        }
      }
    ]
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={pageSchema} />
      <JsonLd data={faqSchema} />

      {/* HERO SECTION */}
      <section className="container mx-auto px-6 mb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-200">
           <ShieldCheck size={14} /> RIBO Licensed Protection
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-6 text-slate-900 leading-none">
          Protect Your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-black">Empire & Assets.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium leading-relaxed">
          We don't just sell policies; we engineer risk management strategies. 
          Access exclusive commercial, auto, and home rates through our dedicated <strong>RIBO Licensed Advisory Partner</strong>.
        </p>
      </section>

      {/* THE RIBO ADVANTAGE (Trust Signal) */}
      <section className="bg-black text-white py-20 mb-24">
         <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-6">The Broker Advantage</h2>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">
                     Most people overpay for insurance because they buy from "Captive Agents" (Direct Banks/Insurers) who can only offer one price.
                  </p>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">
                     Our <strong>RIBO Licensed Partners</strong> act as your professional shopper. They scan 20+ of Canada's top insurers to find the "sweet spot" between price and protection.
                  </p>
                  <div className="flex gap-4">
                     <div className="flex flex-col items-center p-4 bg-white/10 rounded-xl w-32">
                        <span className="text-3xl font-black">20+</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Markets</span>
                     </div>
                     <div className="flex flex-col items-center p-4 bg-white/10 rounded-xl w-32">
                        <span className="text-3xl font-black">100%</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400">Unbiased</span>
                     </div>
                  </div>
               </div>
               
               {/* SVG CHART: Broker vs Agent */}
               <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-center text-gray-400">Market Access Comparison</h3>
                  <div className="flex items-end justify-center gap-8 h-48">
                     <div className="w-24 bg-red-500/20 rounded-t-xl relative group h-16">
                        <div className="absolute -top-8 left-0 w-full text-center text-xs font-bold text-red-400">1 Option</div>
                        <div className="absolute bottom-4 left-0 w-full text-center text-[10px] font-black uppercase text-white">Bank Agent</div>
                     </div>
                     <div className="w-24 bg-green-500 rounded-t-xl relative group h-full animate-pulse">
                        <div className="absolute -top-8 left-0 w-full text-center text-xs font-bold text-green-400">20+ Options</div>
                        <div className="absolute bottom-4 left-0 w-full text-center text-[10px] font-black uppercase text-black">RIBO Broker</div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* SERVICE PILLARS */}
      <section className="container mx-auto px-6 mb-24">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. COMMERCIAL */}
            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition duration-500">
               <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-8">
                  <Briefcase size={32} />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Commercial</h3>
               <p className="text-gray-500 mb-8 font-medium">Protect your balance sheet. Essential for contractors, fleet owners, and retail businesses.</p>
               <ul className="space-y-3 text-sm font-bold text-gray-700">
                  <li className="flex gap-3"><CheckCircle size={16} className="text-blue-600"/> Commercial General Liability (CGL)</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-blue-600"/> Fleet & Logistics</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-blue-600"/> Cyber & Errors/Omissions</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-blue-600"/> Builder's Risk</li>
               </ul>
            </div>

            {/* 2. HOME */}
            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition duration-500">
               <div className="w-16 h-16 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-8">
                  <Home size={32} />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Home & Property</h3>
               <p className="text-gray-500 mb-8 font-medium">More than just fire insurance. Comprehensive coverage for water damage, theft, and liability.</p>
               <ul className="space-y-3 text-sm font-bold text-gray-700">
                  <li className="flex gap-3"><CheckCircle size={16} className="text-green-600"/> High-Value Home Coverage</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-green-600"/> Rental Income Protection</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-green-600"/> Overland Water / Flood</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-green-600"/> Condo & Tenant Insurance</li>
               </ul>
            </div>

            {/* 3. AUTO */}
            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 hover:shadow-xl transition duration-500">
               <div className="w-16 h-16 bg-gray-200 text-gray-800 rounded-2xl flex items-center justify-center mb-8">
                  <Truck size={32} />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Auto & Fleet</h3>
               <p className="text-gray-500 mb-8 font-medium">From personal vehicles to heavy commercial fleets. We find the carriers with the lowest loss ratios.</p>
               <ul className="space-y-3 text-sm font-bold text-gray-700">
                  <li className="flex gap-3"><CheckCircle size={16} className="text-gray-800"/> Multi-Vehicle Discounts</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-gray-800"/> Commercial Fleet Rating</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-gray-800"/> Telematics Savings</li>
                  <li className="flex gap-3"><CheckCircle size={16} className="text-gray-800"/> Accident Forgiveness</li>
               </ul>
            </div>

         </div>
      </section>

      {/* DATA VISUALIZATION SECTION */}
      <section className="container mx-auto px-6 mb-24">
         <div className="bg-slate-900 text-white rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent pointer-events-none"></div>
            
            <div className="grid lg:grid-cols-2 gap-20 relative z-10">
               
               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-6">The "Bundle" Effect</h2>
                  <p className="text-slate-300 mb-8 text-lg">
                     Combining your Home and Auto policies is the single most effective way to lower premiums. 
                     Insurers reward loyalty with discounts ranging from 15% to 25%.
                  </p>
                  
                  {/* SVG INFOGRAPHIC: Bundle Savings */}
                  <div className="flex items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                     <div className="relative w-32 h-32">
                        {/* CSS Donut Chart */}
                        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                           <path className="text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                           <path className="text-blue-500" strokeDasharray="25, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-xl">
                           25%
                        </div>
                     </div>
                     <div>
                        <h4 className="font-bold text-white mb-1">Bundle Discount</h4>
                        <p className="text-xs text-slate-400">Average savings when combining Property + Vehicle with one carrier.</p>
                     </div>
                  </div>
               </div>

               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Ontario Risk Factor</h2>
                  <p className="text-slate-300 mb-8 text-lg">
                     Auto theft in the GTA has risen 40% year-over-year. Without proper "Waiver of Depreciation" coverage, you could be out thousands if your vehicle is stolen.
                  </p>
                  
                  <div className="space-y-4">
                     <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-300">Replacement Cost (Coverage)</span>
                        <div className="w-1/2 h-2 bg-slate-700 rounded-full overflow-hidden">
                           <div className="h-full bg-green-500 w-full"></div>
                        </div>
                        <span className="text-sm font-bold text-white">$65,000</span>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-300">Market Value (No Waiver)</span>
                        <div className="w-1/2 h-2 bg-slate-700 rounded-full overflow-hidden">
                           <div className="h-full bg-red-500 w-[70%]"></div>
                        </div>
                        <span className="text-sm font-bold text-white">$45,500</span>
                     </div>
                     <p className="text-xs text-red-400 font-bold text-right mt-2">Potential Loss: $19,500</p>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* LEAD FORM SECTION */}
      <section className="container mx-auto px-6 max-w-4xl">
         <div className="text-center mb-12">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Get A Quote Today</h2>
            <p className="text-gray-500">
               Fill out the form below. Our licensed RIBO advisor will shop the market and email you the top 3 lowest quotes within 24 hours.
            </p>
         </div>
         <LeadForm 
            type="GeneralInsurance" 
            title="Secure Your Assets" 
            subtitle="Commercial, Auto & Home Strategy." 
         />
      </section>

    </div>
  );
}