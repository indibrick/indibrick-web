import React from 'react';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { buildMetadata } from '../../lib/buildMetadata';
import {
  MapPin, Building2, ShieldCheck, Zap, ChevronDown,
  Utensils, Car, Star, ArrowRight,
  Beer, Snowflake, Flame, DollarSign, Lock, FileText,
  Train, Compass, Briefcase, Wallet, TrendingUp,
} from 'lucide-react';

// Listing photos for MLS X12933580, served from /public/listings/x12933580/
const HERO_IMG = '/listings/x12933580/dining.jpg';
const GALLERY = {
  diningRoom: '/listings/x12933580/dining.jpg',
  kitchen: '/listings/x12933580/prep-kitchen.jpg',
  tandoor: '/listings/x12933580/cooking-line.jpg',
};

export const metadata = buildMetadata({
  title: 'Turnkey Restaurant for Sale Hamilton (LLBO) — $110,000 · Landsdale',
  description: 'Turnkey restaurant business for sale in Hamilton (Landsdale, L8L 2X9) at $110,000. Fully equipped commercial kitchen including tandoor, hood, and refrigeration. LLBO beer license. 1,234 sqft retail. MLS X12933580.',
  slug: '/hamilton-restaurant-for-sale',
  image: '/listings/x12933580/dining.jpg',
  keywords: [
    'restaurant for sale Hamilton',
    'turnkey restaurant Hamilton',
    'Hamilton restaurant business for sale',
    'restaurant for sale Landsdale Hamilton',
    'LLBO restaurant Hamilton',
    'commercial restaurant L8L 2X9',
    'MLS X12933580',
    'sale of business Hamilton',
    'tandoor restaurant for sale',
    'Indian restaurant for sale Hamilton',
    'Hamilton commercial real estate',
    'C5a zoning Hamilton',
  ],
});

export default function HamiltonRestaurantForSalePage() {

  const listingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Turnkey Restaurant Business for Sale — Hamilton (LLBO)',
    description: 'Excellent opportunity to own a turnkey restaurant in Hamilton. High-traffic prime commercial location with a fully equipped commercial kitchen (stove, hood, tandoor, refrigeration), modern dining area, beer license (LLBO), and 1,234 sqft retail area. Surrounded by residential communities and thriving local businesses.',
    sku: 'MLS-X12933580',
    image: [HERO_IMG, GALLERY.diningRoom, GALLERY.kitchen],
    url: 'https://indibrick.ca/hamilton-restaurant-for-sale',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      price: '110000',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'Organization',
        name: 'IndiBrick Financial',
        url: 'https://indibrick.ca',
        telephone: '+1-437-241-6392',
      },
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'MLS#', value: 'X12933580' },
      { '@type': 'PropertyValue', name: 'Status', value: 'Active' },
      { '@type': 'PropertyValue', name: 'Property Type', value: 'Commercial — Sale of Business' },
      { '@type': 'PropertyValue', name: 'Use', value: 'Restaurant' },
      { '@type': 'PropertyValue', name: 'Zoning', value: 'C5a' },
      { '@type': 'PropertyValue', name: 'Retail Area', value: '1,234 sqft' },
      { '@type': 'PropertyValue', name: 'LLBO Beer License', value: 'Yes' },
      { '@type': 'PropertyValue', name: 'Community', value: 'Landsdale' },
      { '@type': 'PropertyValue', name: 'City', value: 'Hamilton' },
      { '@type': 'PropertyValue', name: 'Postal Code', value: 'L8L 2X9' },
      { '@type': 'PropertyValue', name: 'Lot Front', value: '47.75 ft' },
      { '@type': 'PropertyValue', name: 'Lot Depth', value: '100.00 ft' },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is included in the sale of this Hamilton restaurant?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The sale includes the full commercial kitchen — stove, exhaust hood, tandoor oven, and all refrigeration units — plus the modern dining area, all leasehold improvements, and the active LLBO beer license. Only the current owner\'s personal belongings are excluded. The business is fully turnkey and ready for immediate operation.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where exactly is the restaurant located?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The restaurant is in the Landsdale community of Hamilton, Ontario (postal code L8L 2X9), a high-traffic commercial corridor. The area is surrounded by established residential neighbourhoods and small businesses, generating consistent dine-in and takeout demand.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the price and what type of sale is this?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The asking price is $110,000 CAD as an active Sale of Business listing (MLS X12933580). This is a "Without Property" commercial sale — you are acquiring the operating business, leasehold improvements, equipment, and the LLBO license. The underlying real estate remains landlord-owned.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does the restaurant have a liquor license?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The restaurant holds an active LLBO (Liquor Licence and Control Act of Ontario) beer license. This is a significant value driver as new LLBO approvals typically take months — the buyer inherits an operational license on day one.',
        },
      },
      {
        '@type': 'Question',
        name: 'What financing options are available for buying a Hamilton restaurant?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Commercial business acquisitions can be financed through BDC loans, CSBFP (Canada Small Business Financing Program) loans up to $1M, or private commercial mortgages secured against business cash flow and assets. IndiBrick\'s commercial lending desk works with buyers to structure deals — typically 25–35% down, with the balance amortized over 5–10 years.',
        },
      },
    ],
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-slate-900 pb-0 selection:bg-amber-200">
      <JsonLd data={listingSchema} />
      <JsonLd data={faqSchema} />

      {/* --- 1. CINEMATIC HERO --- */}
      <section className="relative pt-32 pb-32 px-6 bg-slate-900 text-white overflow-hidden flex items-center min-h-[95vh]">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMG}
            alt="Turnkey restaurant for sale in Hamilton — fully equipped commercial kitchen and LLBO beer license"
            className="w-full h-full object-cover opacity-55 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900" />
        </div>

        <div className="container mx-auto max-w-[1400px] relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md">
                <Star size={14} className="fill-amber-500" /> Active Listing — MLS X12933580
              </div>

              <p className="text-amber-400 font-black uppercase tracking-[0.3em] text-xs mb-3">Sale of Business — Hamilton</p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.95] drop-shadow-2xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-600">Turnkey Restaurant. LLBO. $110,000.</span>
              </h1>

              <p className="text-base md:text-lg text-gray-300 font-medium leading-relaxed max-w-2xl mb-8">
                High-traffic Hamilton location in the Landsdale community. Fully equipped commercial kitchen with stove, exhaust hood, <strong className="text-white">tandoor</strong>, and refrigeration. Active <strong className="text-white">LLBO beer license</strong>. 1,234 sqft retail area. Ready for immediate operation — ideal for owner-operators or investors.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 mb-10 border-l-4 border-amber-500 pl-6 bg-slate-900/40 backdrop-blur-sm py-4 rounded-r-2xl max-w-2xl">
                <div>
                  <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-1">Asking Price</p>
                  <p className="text-3xl font-black text-white">$110,000</p>
                </div>
                <div>
                  <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-1">Type</p>
                  <p className="text-xl font-bold text-white mt-1">Sale of Business</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <a href="#request-package" className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:from-amber-300 hover:to-amber-400 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                  Request Full Package <Lock size={18} />
                </a>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-widest bg-slate-900/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                  <MapPin size={18} className="text-amber-500" /> Landsdale, Hamilton L8L 2X9
                </div>
              </div>
            </div>

            {/* Fast Facts Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                <h3 className="font-black uppercase tracking-widest text-xs text-amber-500 mb-8 border-b border-white/10 pb-4 flex items-center gap-2">
                  <Zap size={16} /> Listing Snapshot
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 text-sm font-bold">MLS #</span>
                    <span className="text-white font-black text-right text-lg">X12933580</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 text-sm font-bold">Retail Area</span>
                    <span className="text-white font-black text-right text-lg">1,234 sqft</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 text-sm font-bold">Zoning</span>
                    <span className="text-amber-400 font-black text-right text-lg">C5a</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 text-sm font-bold">LLBO</span>
                    <span className="bg-amber-500 text-black px-4 py-1.5 rounded-lg font-black text-sm uppercase tracking-widest shadow-lg">Yes — Beer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm font-bold">Status</span>
                    <span className="text-white font-black text-right text-lg">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. KEY ECONOMICS --- */}
      <section className="py-24 px-6 bg-white border-b border-gray-100 relative -mt-10 rounded-t-[3rem] z-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">Why This Restaurant.</h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
              Three reasons this listing prices below replacement cost — and why it disappears quickly when a serious operator finds it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 hover:border-amber-400 transition duration-300 hover:shadow-2xl text-center group">
              <Wallet size={36} className="text-amber-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Low Entry Cost</h3>
              <p className="text-amber-600 font-black text-3xl mb-6">$110,000</p>
              <p className="text-sm text-gray-500 font-medium mb-8">Sub-replacement value. A new build-out of this kitchen with hood, tandoor, refrigeration and LLBO approval would cost $250,000+ and take months.</p>
              <a href="#request-package" className="inline-block border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition">Run the Numbers</a>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 hover:border-amber-400 transition duration-300 shadow-2xl text-center group relative overflow-hidden transform md:-translate-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Highest Leverage</div>
              <Beer size={36} className="text-amber-400 mx-auto mb-4 mt-6" />
              <h3 className="text-2xl font-black text-white mb-2 uppercase">LLBO License</h3>
              <p className="text-amber-400 font-black text-3xl mb-6">Active</p>
              <p className="text-sm text-gray-400 font-medium mb-8">A new LLBO application from scratch takes months and isn&apos;t guaranteed. This sale transfers an already-active license — pour beer on day one.</p>
              <a href="#request-package" className="inline-block bg-amber-500 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition">Get the Full Brief</a>
            </div>

            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 hover:border-amber-400 transition duration-300 hover:shadow-2xl text-center group">
              <Utensils size={36} className="text-amber-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Fully Equipped</h3>
              <p className="text-amber-600 font-black text-3xl mb-6">Turnkey</p>
              <p className="text-sm text-gray-500 font-medium mb-8">Includes commercial stove, exhaust hood, tandoor oven, refrigeration units, dining room build-out. Plug in your menu and open.</p>
              <a href="#request-package" className="inline-block border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition">See What&apos;s Included</a>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. VISUAL GALLERY --- */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">The Space.</h2>
              <p className="text-lg text-gray-500 font-medium max-w-xl">Modern dining area, commercial-grade kitchen, and high-traffic Hamilton frontage. Built to operate, priced to acquire.</p>
            </div>
            <a href="#request-package" className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition">
              Request Full Photo Set <ArrowRight size={14} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
            <div className="md:col-span-8 md:row-span-2 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY.diningRoom} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="Modern dining area of the Hamilton restaurant for sale" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-8">
                <p className="text-amber-300 font-black uppercase tracking-widest text-[10px] mb-1">Front of House</p>
                <p className="text-white font-black uppercase tracking-widest text-2xl">Modern Dining Room</p>
              </div>
            </div>

            <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY.kitchen} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="Fully equipped commercial kitchen with hood and stove" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <p className="text-white font-black uppercase tracking-widest text-lg">Commercial Kitchen</p>
              </div>
            </div>

            <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY.tandoor} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="Tandoor oven included with sale" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <p className="text-white font-black uppercase tracking-widest text-lg">Tandoor Included</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- 4. INCLUSIONS / EXCLUSIONS --- */}
      <section className="py-24 px-6 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">What You Get.</h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">The full equipment, fit-out and license bundle included in the $110,000 purchase price.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                <Flame size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Commercial Kitchen</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Commercial stove, exhaust hood with code-compliant ventilation, and tandoor oven. Cleaned, serviced and ready for service.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                <Snowflake size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Refrigeration Units</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Full refrigeration package included — walk-in storage capacity plus prep-line under-counter units. Cooling and gas hot water heating already installed.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                <Beer size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Active LLBO License</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Beer license is active and transferable through the standard LLBO change-of-ownership process. No multi-month application delay for the buyer.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-[2rem] p-8 md:p-10 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Listing Details</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
              <div><span className="text-gray-500 font-medium">MLS #</span><br /><span className="font-black">X12933580</span></div>
              <div><span className="text-gray-500 font-medium">Price</span><br /><span className="font-black">$110,000</span></div>
              <div><span className="text-gray-500 font-medium">Status</span><br /><span className="font-black">Active</span></div>
              <div><span className="text-gray-500 font-medium">Listed</span><br /><span className="font-black">March 28, 2026</span></div>
              <div><span className="text-gray-500 font-medium">City</span><br /><span className="font-black">Hamilton</span></div>
              <div><span className="text-gray-500 font-medium">Community</span><br /><span className="font-black">Landsdale</span></div>
              <div><span className="text-gray-500 font-medium">Postal Code</span><br /><span className="font-black">L8L 2X9</span></div>
              <div><span className="text-gray-500 font-medium">Zoning</span><br /><span className="font-black">C5a</span></div>
              <div><span className="text-gray-500 font-medium">Property Type</span><br /><span className="font-black">Commercial</span></div>
              <div><span className="text-gray-500 font-medium">Type</span><br /><span className="font-black">Sale of Business</span></div>
              <div><span className="text-gray-500 font-medium">Use</span><br /><span className="font-black">Restaurant</span></div>
              <div><span className="text-gray-500 font-medium">Retail Area</span><br /><span className="font-black">1,234 sqft</span></div>
              <div><span className="text-gray-500 font-medium">Lot Front</span><br /><span className="font-black">47.75 ft</span></div>
              <div><span className="text-gray-500 font-medium">Lot Depth</span><br /><span className="font-black">100.00 ft</span></div>
              <div><span className="text-gray-500 font-medium">Heating</span><br /><span className="font-black">Gas Hot Water</span></div>
              <div><span className="text-gray-500 font-medium">Cooling</span><br /><span className="font-black">Yes</span></div>
            </div>
            <p className="text-[11px] text-gray-500 mt-6 leading-relaxed">
              <strong>Inclusions:</strong> Commercial kitchen equipment (stove, hood, tandoor, refrigeration units).<br />
              <strong>Exclusions:</strong> Personal belongings of the current owner.
            </p>
          </div>
        </div>
      </section>

      {/* --- 5. LOCATION + MAP --- */}
      <section className="py-24 px-6 bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                <MapPin size={14} /> Landsdale, Hamilton
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-6 leading-none">
                High-Traffic. Built-In Demand.
              </h2>
              <p className="text-lg text-gray-600 font-medium mb-8 leading-relaxed">
                Landsdale is one of Hamilton&apos;s established mixed-use corridors — dense residential catchment within a 1km walk, anchored by everyday traffic, and minutes from the Red Hill Valley Parkway and downtown Hamilton.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <Compass size={24} className="text-amber-500 mb-4" />
                  <p className="font-black text-slate-900 uppercase mb-1">Residential Catchment</p>
                  <p className="text-xs text-gray-500 font-medium">Dense surrounding neighbourhoods feeding consistent dine-in and takeout demand.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <Briefcase size={24} className="text-amber-500 mb-4" />
                  <p className="font-black text-slate-900 uppercase mb-1">Local Business Cluster</p>
                  <p className="text-xs text-gray-500 font-medium">Surrounded by thriving small businesses driving steady weekday foot traffic.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <Car size={24} className="text-amber-500 mb-4" />
                  <p className="font-black text-slate-900 uppercase mb-1">Highway Access</p>
                  <p className="text-xs text-gray-500 font-medium">Minutes from the Red Hill Valley Parkway and QEW for delivery and catering.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <Train size={24} className="text-blue-600 mb-4" />
                  <p className="font-black text-blue-900 uppercase mb-1">Transit</p>
                  <p className="text-xs text-blue-800 font-medium">HSR routes and Hamilton GO connecting daily commuters and weekend dining.</p>
                </div>
              </div>
            </div>

            <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-gray-100">
              <iframe
                src="https://www.google.com/maps?q=Landsdale+Hamilton+ON+L8L2X9&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 grayscale hover:grayscale-0 transition duration-1000"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md text-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="bg-amber-500 text-black p-3 rounded-xl"><MapPin size={20} /></div>
                <div>
                  <p className="font-black uppercase text-sm">Restaurant for Sale</p>
                  <p className="text-xs font-bold text-gray-500">Landsdale community · Hamilton ON · L8L 2X9</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 6. GROWTH LEVERS / WHY NOW --- */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <TrendingUp size={32} className="text-amber-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-slate-900">Future Growth Levers</h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">The current operator hasn&apos;t pulled every lever. Top-line upside the right buyer can unlock from day one.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
              <Utensils className="text-amber-500 mb-6" size={40} />
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Catering Channel</h3>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">Layer corporate and event catering onto the existing kitchen — the highest margin line in any independent restaurant.</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
              <Zap className="text-amber-500 mb-6" size={40} />
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Delivery Platforms</h3>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">Add UberEats / DoorDash / SkipTheDishes to monetize the dense residential catchment without changing your dine-in footprint.</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
              <DollarSign className="text-amber-500 mb-6" size={40} />
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Extended Hours</h3>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">Extend late-night service to capture the post-9pm Landsdale market — the LLBO license is already in place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 7. AEO FAQ --- */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <ShieldCheck size={40} className="mx-auto text-amber-500 mb-6" />
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">Buyer FAQ</h2>
            <p className="text-gray-400 font-medium text-lg">Direct answers to the questions every Hamilton restaurant buyer asks.</p>
          </div>

          <div className="space-y-4">
            {faqSchema.mainEntity.map((faq, idx) => (
              <details key={idx} className="group bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition shadow-sm">
                <summary className="flex justify-between items-center font-black text-lg text-white list-none uppercase tracking-tight">
                  {faq.name}
                  <span className="text-amber-500 transition group-open:rotate-180"><ChevronDown size={20} /></span>
                </summary>
                <p className="text-gray-400 mt-6 leading-relaxed font-medium text-base border-t border-white/10 pt-6">
                  {faq.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* --- 8. LEAD CAPTURE --- */}
      <section id="request-package" className="py-32 px-6 bg-white relative">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-16 border border-slate-800 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -ml-20 -mb-20" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-amber-500 text-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                <FileText size={40} />
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white leading-none">
                Request the Full Package.
              </h2>
              <p className="text-gray-400 font-medium mb-12 max-w-xl mx-auto text-lg leading-relaxed">
                Register below for the full listing brief — complete photo set, equipment list, financials disclosure, lease terms and showing booking.
              </p>

              <div className="text-left max-w-lg mx-auto bg-white p-2 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <LeadForm
                  type="Commercial"
                  title="Request Listing Package"
                  subtitle="Full brief sent within 1 business hour."
                  ctaText="Send Me the Brief"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-6 font-medium">
                MLS X12933580 • Listing presented by IndiBrick Financial • 437-241-6392
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 9. MOBILE STICKY CTA --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <a href="#request-package" className="w-full bg-amber-500 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition">
          Request Listing Package <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
