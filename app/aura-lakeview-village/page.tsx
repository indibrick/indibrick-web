import React from 'react';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { buildMetadata } from '../../lib/buildMetadata';
import {
  MapPin, Building2, ShieldCheck, Zap, ChevronDown,
  Waves, Car, TreePine, Star, ArrowRight,
  Shield, Landmark, Clock, Lock, FileText,
  Train, Compass, Trees,
} from 'lucide-react';

// Official Caivan AURA renders, served from /public/aura/
const HERO_IMG = '/aura/hero.jpg';
const GALLERY = {
  topAngle: '/aura/hero.jpg',
  parkSide: '/aura/living-room.jpg',
  interior: '/aura/kitchen.jpg',
  bathroom: '/aura/bathroom.jpg',
  community: '/aura/area-map.jpg',
};
const SITEPLAN = '/aura/area-map.jpg';

export const metadata = buildMetadata({
  title: 'AURA Lakeview Village Phase II — Mississauga Waterfront Towns by Caivan',
  description: 'Phase II of AURA Lakeview Village by Caivan — urban 2-storey towns on the Mississauga waterfront, from the mid $500s. Park-side living, minutes to Lake Ontario. VIP register today.',
  slug: '/aura-lakeview-village',
  image: '/aura/hero.jpg',
  keywords: [
    'AURA Lakeview Village',
    'AURA Mississauga',
    'Caivan AURA',
    'Mississauga pre-construction towns',
    'Mississauga waterfront townhomes',
    'Lakeview Village Mississauga',
    '2 storey towns Mississauga',
    'Mississauga new homes Phase 2',
    'Lakeshore Road East Mississauga',
    'pre-construction Mississauga 2026',
    'Port Credit pre-construction',
    'Long Branch pre-construction',
  ],
});

export default function AuraLakeviewVillagePage() {

  const projectSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: 'AURA Lakeview Village Phase II',
    description: 'Phase II of AURA Lakeview Village — a Caivan-built collection of urban 2-storey freehold towns on the Mississauga waterfront. Park-side living minutes from Lake Ontario, with priced units starting from the mid $500,000s.',
    url: 'https://indibrick.ca/aura-lakeview-village',
    image: [HERO_IMG, GALLERY.parkSide, GALLERY.interior, GALLERY.bathroom, GALLERY.community],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      price: '550000',
      availability: 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mississauga',
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Where is AURA Lakeview Village located?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AURA Lakeview Village is in the Lakeview Village masterplan community on the Mississauga waterfront, just east of Port Credit and minutes from Lake Ontario. The site sits inside one of the largest GTA waterfront redevelopments, with direct access to parkland, the Waterfront Trail, and future light-rail transit.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who is the developer of AURA Lakeview Village?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AURA Lakeview Village is built by Caivan Communities, an award-winning Ontario homebuilder known for low-rise communities across the GTA, Ottawa, and Niagara. Phase I of AURA sold out in a single day.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does an AURA Lakeview Village townhouse cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Phase II pricing for AURA Lakeview Village starts from the mid $500,000s for an urban 2-storey townhome. Exact pricing varies by floorplan, frontage, and finish package — current pricing is released to VIP registrants before public launch.',
        },
      },
      {
        '@type': 'Question',
        name: 'When is occupancy for AURA Lakeview Village Phase II?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Phase II of AURA Lakeview Village is launching to the public soon, with anticipated occupancy targeted within Caivan\'s standard 18–24 month construction window. VIP registrants receive the official occupancy schedule before launch.',
        },
      },
      {
        '@type': 'Question',
        name: 'What makes AURA Lakeview Village a good investment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AURA sits inside the Lakeview Village masterplan — a multi-billion-dollar waterfront redevelopment that will add parkland, retail, and transit infrastructure to South Mississauga over the next decade. Phase I sold out in one day, signalling strong end-user and investor demand. Buyers benefit from Mississauga waterfront scarcity and South-GTA price arbitrage vs. comparable Toronto product.',
        },
      },
    ],
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-slate-900 pb-0 selection:bg-pink-200">
      <JsonLd data={projectSchema} />
      <JsonLd data={faqSchema} />

      {/* --- 1. CINEMATIC HERO --- */}
      <section className="relative pt-32 pb-32 px-6 bg-slate-900 text-white overflow-hidden flex items-center min-h-[95vh]">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMG}
            alt="AURA Lakeview Village — Mississauga waterfront pre-construction towns by Caivan"
            className="w-full h-full object-cover opacity-55 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900" />
        </div>

        <div className="container mx-auto max-w-[1400px] relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-400/30 text-pink-300 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md">
                <Star size={14} className="fill-pink-400" /> Phase II — Coming Soon
              </div>

              <p className="text-pink-300 font-black uppercase tracking-[0.3em] text-xs mb-3">AURA Lakeview Village</p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.95] drop-shadow-2xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-100 via-pink-300 to-pink-500">Mississauga Waterfront. Park-Side Living.</span>
              </h1>

              <p className="text-base md:text-lg text-gray-300 font-medium leading-relaxed max-w-2xl mb-8">
                Urban 2-storey freehold towns on the Mississauga waterfront. Phase I sold out in <strong className="text-white">one day</strong>. Reserve your suite in Phase II before public launch and lock in the best frontage at the lowest VIP price.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 mb-10 border-l-4 border-pink-400 pl-6 bg-slate-900/40 backdrop-blur-sm py-4 rounded-r-2xl max-w-2xl">
                <div>
                  <p className="text-[10px] text-pink-300 font-black uppercase tracking-widest mb-1">Starting From</p>
                  <p className="text-3xl font-black text-white">Mid $500s</p>
                </div>
                <div>
                  <p className="text-[10px] text-pink-300 font-black uppercase tracking-widest mb-1">Home Type</p>
                  <p className="text-xl font-bold text-white mt-1">Urban 2-Storey Towns</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <a href="#vip-access" className="w-full sm:w-auto bg-gradient-to-r from-pink-400 to-pink-500 text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:from-pink-300 hover:to-pink-400 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(236,72,153,0.3)]">
                  Reserve VIP Allocation <Lock size={18} />
                </a>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-widest bg-slate-900/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                  <MapPin size={18} className="text-pink-400" /> Lakeview Village, Mississauga
                </div>
              </div>
            </div>

            {/* Fast Facts Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                <h3 className="font-black uppercase tracking-widest text-xs text-pink-400 mb-8 border-b border-white/10 pb-4 flex items-center gap-2">
                  <Zap size={16} /> Project Intelligence
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 text-sm font-bold">Developer</span>
                    <span className="text-white font-black text-right text-lg">Caivan</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 text-sm font-bold">Phase</span>
                    <span className="text-white font-black text-right text-lg">Phase II</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 text-sm font-bold">Home Type</span>
                    <span className="text-pink-300 font-black text-right text-lg">Freehold Towns</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="text-gray-400 text-sm font-bold">Phase I</span>
                    <span className="bg-pink-500 text-black px-4 py-1.5 rounded-lg font-black text-sm uppercase tracking-widest shadow-lg">Sold Out 1 Day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm font-bold">Lake Access</span>
                    <span className="text-white font-black text-right text-lg">Minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. PRICING / WHY NOW --- */}
      <section className="py-24 px-6 bg-white border-b border-gray-100 relative -mt-10 rounded-t-[3rem] z-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">Phase I Sold Out in One Day.</h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
              Phase II of AURA Lakeview Village launches to the public soon. VIP registrants get first allocation, the best frontages, and developer pricing before the public list goes live.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 hover:border-pink-400 transition duration-300 hover:shadow-2xl text-center group">
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">End Towns</h3>
              <p className="text-pink-600 font-black text-3xl mb-6">From Mid $500s</p>
              <p className="text-sm text-gray-500 font-medium mb-8">2-storey urban towns. Efficient layouts, low-maintenance ownership, freehold land — perfect for first-time buyers entering the Mississauga waterfront market.</p>
              <a href="#vip-access" className="inline-block border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition">Request Floor Plans</a>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 hover:border-pink-400 transition duration-300 shadow-2xl text-center group relative overflow-hidden transform md:-translate-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Highest Demand</div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase mt-6">Interior Towns</h3>
              <p className="text-pink-400 font-black text-3xl mb-6">Limited Allocation</p>
              <p className="text-sm text-gray-400 font-medium mb-8">The Phase I bestseller. Strongest investor cash flow per square foot, lowest entry point into the Caivan AURA project. Phase II inventory is capped — register early.</p>
              <a href="#vip-access" className="inline-block bg-pink-500 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-400 transition">Reserve Allocation</a>
            </div>

            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 hover:border-pink-400 transition duration-300 hover:shadow-2xl text-center group">
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">Park-Side Lots</h3>
              <p className="text-pink-600 font-black text-3xl mb-6">Premium Pricing</p>
              <p className="text-sm text-gray-500 font-medium mb-8">Backing directly onto the new Lakeview Village park system. Long-term hold favourites with the highest ceiling resale value. Limited frontage available.</p>
              <a href="#vip-access" className="inline-block border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition">Check Availability</a>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. VISUAL GALLERY (PLACEHOLDER ASSETS — REPLACE WITH OFFICIAL CAIVAN RENDERS) --- */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">Designed for Waterfront Living.</h2>
              <p className="text-lg text-gray-500 font-medium max-w-xl">Modern 2-storey towns wrapped around park-side greenways, minutes from the Mississauga shoreline. Architecture, materials and street-level frontage by Caivan.</p>
            </div>
            <a href="#vip-access" className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-pink-600 hover:text-pink-700 transition">
              Download Renders & Sitemap <ArrowRight size={14} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
            <div className="md:col-span-8 md:row-span-2 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY.topAngle} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="AURA Lakeview Village townhomes street view" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-8">
                <p className="text-pink-300 font-black uppercase tracking-widest text-[10px] mb-1">Architecture</p>
                <p className="text-white font-black uppercase tracking-widest text-2xl">Modern 2-Storey Towns</p>
              </div>
            </div>

            <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY.parkSide} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="AURA Lakeview Village interior — open-concept living and dining" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <p className="text-white font-black uppercase tracking-widest text-lg">Open-Concept Living</p>
              </div>
            </div>

            <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY.interior} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="AURA Lakeview Village designer kitchen render" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-6">
                <p className="text-white font-black uppercase tracking-widest text-lg">Designer Kitchens</p>
              </div>
            </div>

            <div className="md:col-span-6 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY.bathroom} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="AURA Lakeview Village spa-inspired bathroom render" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-8">
                <p className="text-pink-300 font-black uppercase tracking-widest text-[10px] mb-1">Interiors</p>
                <p className="text-white font-black uppercase tracking-widest text-xl">Spa-Inspired Baths</p>
              </div>
            </div>

            <div className="md:col-span-6 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY.community} className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" alt="AURA Lakeview Village location map — Mississauga waterfront, transit, retail" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-8">
                <p className="text-pink-300 font-black uppercase tracking-widest text-[10px] mb-1">Masterplan</p>
                <p className="text-white font-black uppercase tracking-widest text-xl">Connected & Walkable</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. LEAD MAGNET HOOK --- */}
      <section className="py-20 px-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">Floor Plans & Site Plan</h2>
          <p className="text-gray-400 font-medium mb-12 max-w-2xl mx-auto text-lg">
            Caivan has not yet released the Phase II floor plans to the public. Register through our VIP allocation to bypass the wait list and receive the full plans, frontage map, and price grid as soon as they ship.
          </p>

          <a href="#vip-access" className="block relative rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-white/10 bg-slate-800 group cursor-pointer">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-10 flex flex-col items-center justify-center transition group-hover:bg-slate-900/40">
              <div className="bg-pink-500 text-black w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(236,72,153,0.5)] group-hover:scale-110 transition duration-500">
                <Lock size={40} />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-2">VIP Only</h3>
              <p className="text-pink-300 font-bold uppercase tracking-widest text-sm bg-black/50 px-6 py-2 rounded-full">Click to Unlock Phase II Package</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITEPLAN} alt="AURA Lakeview Village site plan placeholder" className="w-full h-[500px] object-cover object-top opacity-30 grayscale" />
          </a>
        </div>
      </section>

      {/* --- 5. THE LAKEVIEW VILLAGE ADVANTAGE --- */}
      <section className="py-24 px-6 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">The Lakeview Village Advantage</h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Why end-users and investors are paying premium dollars for South Mississauga waterfront product.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
              <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                <Waves size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Mississauga Waterfront</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                AURA sits inside the Lakeview Village masterplan — a multi-billion-dollar waterfront redevelopment along Lake Ontario, steps from the Waterfront Trail and the future Hurontario LRT extension.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                <Trees size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Park-Side Living</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Phase II homes back directly onto the new community parkland and pedestrian greenways. Quiet street-level living without sacrificing urban walkability.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Caivan Quality</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Caivan is one of Ontario&apos;s largest privately-held homebuilders. Phase I of AURA sold out in a single day on the strength of Caivan&apos;s reputation for low-rise execution and resale value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 6. LOCATION + GOOGLE MAPS --- */}
      <section className="py-24 px-6 bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                <MapPin size={14} /> South Mississauga
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-6 leading-none">
                The Last Affordable Waterfront.
              </h2>
              <p className="text-lg text-gray-600 font-medium mb-8 leading-relaxed">
                Lakeview Village is one of the largest waterfront redevelopments in the GTA. AURA Phase II sits at the centre of new parkland, retail, and the future Hurontario LRT extension — with direct GO Train access into downtown Toronto in under 25 minutes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <Waves size={24} className="text-pink-500 mb-4" />
                  <p className="font-black text-slate-900 uppercase mb-1">Lake Ontario</p>
                  <p className="text-xs text-gray-500 font-medium">Steps from the Waterfront Trail and Marie Curtis Park beachfront.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <Landmark size={24} className="text-pink-500 mb-4" />
                  <p className="font-black text-slate-900 uppercase mb-1">Port Credit</p>
                  <p className="text-xs text-gray-500 font-medium">Mississauga&apos;s premier dining, marina and lakefront village minutes west.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <Compass size={24} className="text-pink-500 mb-4" />
                  <p className="font-black text-slate-900 uppercase mb-1">Sherway Gardens</p>
                  <p className="text-xs text-gray-500 font-medium">Premium retail, schools and Etobicoke amenities at the QEW.</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <Train size={24} className="text-blue-600 mb-4" />
                  <p className="font-black text-blue-900 uppercase mb-1">GO + LRT</p>
                  <p className="text-xs text-blue-800 font-medium">Direct GO commuter access plus the planned Hurontario LRT extension.</p>
                </div>
              </div>
            </div>

            <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-gray-100">
              {/* Google Maps embed pinned to Lakeview Village, Mississauga */}
              <iframe
                src="https://www.google.com/maps?q=Lakeview+Village+Mississauga+ON&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 grayscale hover:grayscale-0 transition duration-1000"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md text-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="bg-pink-500 text-black p-3 rounded-xl"><MapPin size={20} /></div>
                <div>
                  <p className="font-black uppercase text-sm">AURA Lakeview Village</p>
                  <p className="text-xs font-bold text-gray-500">Lakeview Village, Mississauga ON</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 7. VIP INCENTIVES --- */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Star size={32} className="fill-pink-500 text-pink-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-slate-900">VIP Allocation Perks</h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Reserve through our VIP allocation and unlock incentives that public buyers will never see.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
              <Clock className="text-pink-500 mb-6" size={40} />
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Extended Deposits</h3>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">Spread your deposit over the full pre-construction window. Keep your capital working for you instead of locked up.</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
              <Shield className="text-pink-500 mb-6" size={40} />
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Capped Levies</h3>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">Closing-cost protection — VIP allocations include capped development charges so you know your exact final price today.</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
              <FileText className="text-pink-500 mb-6" size={40} />
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Free Assignment</h3>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">Free assignment clause — sell your unit before close if your plans change. Maximum flexibility for investors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 8. AEO FAQ --- */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <ShieldCheck size={40} className="mx-auto text-pink-500 mb-6" />
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">AURA Lakeview Village FAQ</h2>
            <p className="text-gray-400 font-medium text-lg">The questions buyers are asking about Phase II.</p>
          </div>

          <div className="space-y-4">
            {faqSchema.mainEntity.map((faq, idx) => (
              <details key={idx} className="group bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition shadow-sm">
                <summary className="flex justify-between items-center font-black text-lg text-white list-none uppercase tracking-tight">
                  {faq.name}
                  <span className="text-pink-400 transition group-open:rotate-180"><ChevronDown size={20} /></span>
                </summary>
                <p className="text-gray-400 mt-6 leading-relaxed font-medium text-base border-t border-white/10 pt-6">
                  {faq.acceptedAnswer.text}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* --- 9. LEAD CAPTURE --- */}
      <section id="vip-access" className="py-32 px-6 bg-white relative">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-16 border border-slate-800 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -ml-20 -mb-20" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-pink-500 text-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(236,72,153,0.4)]">
                <Lock size={40} />
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white leading-none">
                Reserve Your Phase II Unit.
              </h2>
              <p className="text-gray-400 font-medium mb-12 max-w-xl mx-auto text-lg leading-relaxed">
                Phase I sold out in 24 hours. Register now to receive the official Phase II floor plans, price list, frontage map and VIP allocation timing — before the public release.
              </p>

              <div className="text-left max-w-lg mx-auto bg-white p-2 rounded-[2.5rem] shadow-2xl border border-gray-100">
                <LeadForm
                  type="Pre-Con"
                  title="VIP Registration — AURA Phase II"
                  subtitle="Floor plans, prices and allocation timing sent straight to your inbox."
                  ctaText="Reserve My Unit"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-6 font-medium">
                Listing presented by Purvi Srivastava, Realtor • 416-315-4481
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 10. MOBILE STICKY CTA --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <a href="#vip-access" className="w-full bg-pink-500 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition">
          Reserve Phase II Unit <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
