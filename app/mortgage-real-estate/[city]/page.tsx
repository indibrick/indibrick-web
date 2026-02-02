import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { CityService } from '../../../services/CityService';
import LeadForm from '../../../components/LeadForm';
import Link from 'next/link';
import { 
  Zap, Shield, MapPin 
} from 'lucide-react';

// 1. DYNAMIC METADATA
export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const cityData = await CityService.getCityBySlug(params.city);

  if (!cityData) return { title: 'City Not Found' };

  return {
    title: `Mortgage Broker & Real Estate in ${cityData.name}, ON | IndiBrick`,
    description: cityData.metaDescription,
    openGraph: {
        title: `${cityData.name} Mortgage & Real Estate Hub`,
        description: cityData.intro.substring(0, 150),
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"]
    }
  };
}

// 2. STATIC PARAMS (Builds pages for all cities in DB at compile time)
export async function generateStaticParams() {
  const cities = await CityService.getAllCities();
  return cities.map((city) => ({
    city: city.slug,
  }));
}

// 3. MAIN PAGE COMPONENT
export default async function CityPage({ params }: { params: { city: string } }) {
  const cityData = await CityService.getCityBySlug(params.city);

  if (!cityData) {
    notFound();
  }

  // Schema Markup for Local SEO
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Best Mortgage Agent in ${cityData.name}`,
    "description": cityData.metaDescription,
    "image": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "telephone": "+14372416392",
    "url": `https://indibrick.ca/mortgage-real-estate/${cityData.slug}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityData.name,
      "addressRegion": "ON",
      "addressCountry": "CA"
    },
    "areaServed": {
      "@type": "City",
      "name": cityData.name
    }
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* HERO SECTION */}
      <section className="bg-black text-white pt-40 pb-32 relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img 
            src={`https://source.unsplash.com/1920x1080/?${cityData.name},city`}
            alt={cityData.name} 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
              <MapPin size={14} /> Regional Hub
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tighter uppercase">
              Mortgage & Homes in {cityData.name}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed max-w-3xl font-medium">
              Expert financing strategy and exclusive real estate access for the {cityData.name} market.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <a 
                href="https://gopineapple.ca/muditchhura/preapproval" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-black px-12 py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition text-center shadow-2xl flex items-center justify-center gap-3"
              >
                <Zap size={18} /> Start Pre-Approval
              </a>
              <Link 
                href="#contact-form"
                className="border-2 border-white/30 text-white px-12 py-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition text-center flex items-center justify-center gap-3"
              >
                Speak to Expert
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL INTRO */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-8">Market Analysis • {cityData.name} ON</h2>
            <div className="prose prose-xl max-w-none text-gray-600 font-medium leading-relaxed">
              <p className="mb-8">{cityData.intro}</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS GRID */}
      <section className="py-20 bg-gray-50 border-b border-gray-100">
         <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               <div className="bg-white p-8 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Avg Price</p>
                  <p className="text-2xl font-black text-black">{cityData.avgHomePrice}</p>
               </div>
               <div className="bg-white p-8 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Avg Rent</p>
                  <p className="text-2xl font-black text-black">{cityData.avgRent}</p>
               </div>
               <div className="bg-white p-8 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Trend</p>
                  <p className="text-2xl font-black text-green-600">{cityData.marketTrend}</p>
               </div>
               <div className="bg-white p-8 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Neighborhoods</p>
                  <p className="text-2xl font-black text-black">{cityData.neighborhoods.length}+</p>
               </div>
            </div>
         </div>
      </section>

      {/* SCENARIOS */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {cityData.scenarios.map((scenario, i) => (
              <div key={i} className="p-10 bg-gray-50 rounded-[2.5rem] hover:bg-black group transition-all duration-500">
                <h3 className="text-xl font-black text-black group-hover:text-white mb-4 uppercase tracking-tight">{scenario.title}</h3>
                <p className="text-gray-500 group-hover:text-gray-400 font-medium leading-relaxed">{scenario.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact-form" className="py-32 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-7xl font-black text-black mb-6 uppercase tracking-tighter leading-none">
                Execute Your Strategy in {cityData.name}
              </h2>
            </div>
            <LeadForm 
              title={`${cityData.name} Strategy Session`} 
              subtitle={`Connect and Advisor regarding ${cityData.name} real estate.`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}