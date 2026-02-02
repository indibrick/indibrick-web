'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, TrendingUp, Home, Building2, Building, AlertCircle } from 'lucide-react';
import LeadForm from './LeadForm';
import ListingCard from './ListingCard';
import { PropertyService } from '../services/PropertyService';
import { Property } from '../types';

interface PreConCityClientProps {
  cityData: any;
}

export default function PreConCityClient({ cityData }: PreConCityClientProps) {
  // Safety check to prevent crashes if data is missing
  if (!cityData) return null;

  const cityName = cityData.cityName || cityData.name;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // LIVE LISTINGS STATE
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Real Properties on Mount
  useEffect(() => {
    const fetchListings = async () => {
      try {
        // Fetch listings that match the current city
        const data = await PropertyService.fetchFeatured(cityData.slug || cityName);
        setListings(data);
      } catch (err) {
        console.error("Failed to load listings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [cityData]);

  const categories = [
    { id: 'condos', name: 'Luxury Condos', icon: <Building2 size={40} />, desc: `High-rise living with premium amenities in the core of ${cityName}.` },
    { id: 'townhomes', name: 'Modern Townhomes', icon: <Home size={40} />, desc: `Spacious multi-level residences designed for families in ${cityName}.` },
    { id: 'freehold', name: 'Freehold Townhomes', icon: <Building size={40} />, desc: `No maintenance fees. Full ownership in established ${cityName} communities.` }
  ];

  return (
    <>
      {/* 1. HERO SECTION */}
      <section className="bg-black text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`https://source.unsplash.com/1600x900/?${cityName},city`}
            alt={`${cityName} Skyline`} 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
              <Zap size={14} className="text-white" /> Platinum Investor Network
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tighter uppercase">
              {cityName} Pre-Construction
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl font-medium">
              We connect you directly with the top projects in {cityName}. Secure your unit before it hits the general public with VIP pricing and floor plans.
            </p>
          </div>
        </div>
      </section>

      {/* 2. EXCLUSIVE INVENTORY GRID (POCKET LISTINGS) */}
      <section className="py-24 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-black mb-4 uppercase tracking-tighter">Exclusive Inventory</h2>
          <p className="text-gray-500 font-medium">Curated opportunities available through our partner network.</p>
        </div>

        {loading ? (
           <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((prop) => (
              <ListingCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-[3rem] border border-gray-100">
             <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
             <h3 className="text-xl font-bold text-gray-400">No Public Inventory</h3>
             <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
               Due to high demand in {cityName}, many of our projects sell out before public listing. Contact us below for off-market access.
             </p>
          </div>
        )}
      </section>

      {/* 3. CATEGORIES */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white p-10 rounded-[2rem] hover:shadow-xl transition-all duration-500 flex flex-col items-center text-center group">
                <div className="mb-6 text-black group-hover:scale-110 transition duration-500">{cat.icon}</div>
                <h3 className="text-2xl font-black text-black mb-4 uppercase tracking-tight">{cat.name}</h3>
                <p className="text-gray-500 mb-8 font-medium leading-relaxed">{cat.desc}</p>
                <button 
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    document.getElementById('connect-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-auto text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition"
                >
                  Request Access
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LEAD FORM */}
      <section id="connect-form" className="py-32">
        <div className="container mx-auto px-6">
           <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                 <h2 className="text-4xl md:text-6xl font-black text-black mb-4 uppercase tracking-tighter">
                   Request {selectedCategory || 'Project'} Access
                 </h2>
                 <p className="text-xl text-gray-500 font-medium">Complete the form to unlock floor plans, pricing, and financing strategy in {cityName}.</p>
              </div>
              <LeadForm 
                type="Pre-Con" 
                title={`Secure Your ${cityName} Unit`} 
                subtitle={`Connecting you with Mudit Chhura (Mortgage) & Local ${cityName} Real Estate Partners.`}
              />
           </div>
        </div>
      </section>
    </>
  );
}