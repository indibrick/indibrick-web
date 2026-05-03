import React from 'react';
import { Metadata } from 'next';
import { PropertyService } from '../../services/PropertyService';
import ListingsClient from '../../components/ListingsClient';
import { Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Curated Real Estate Opportunities | IndiBrick',
  description: 'Access off-market assignments, pre-construction allocations, and exclusive resale properties selected by our investment team.',
};

export const dynamic = 'force-dynamic';

export default async function ListingsPage() {
  // Fetch dynamic listings from Firebase
  const fetchedListings = await PropertyService.fetchProperties();

  // Manually injected VIP Funnel Listing
  const royalTuscanListing = {
    id: 'royal-tuscan-vip-manual',
    title: 'Royal Tuscan Residences',
    price: 390000,
    city: 'St. Catharines',
    address: '1024 Vansickle Rd N',
    bedrooms: 1,
    bathrooms: 1,
    type: 'Condo',
    purpose: 'Pre-Construction',
    imageUrl: '/rt-_0004_8-sunset-view-new-sky.jpg', // Using the beautiful sunset render
    landingPageUrl: '/royal-tuscan', // Routes directly to our new funnel!
    description: 'A boutique collection of 97 luxury condos and penthouses featuring Tuscan Revival architecture and ultra-quiet steel-and-concrete construction.',
    isFeatured: true,
    status: 'Active'
  };

  // Combine them, putting the Royal Tuscan funnel front and center
  const listings = [royalTuscanListing, ...fetchedListings];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section: "We did the work for you" messaging */}
      <section className="bg-black text-white pt-32 pb-32 text-center border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-white/20">
              <Zap size={14} className="text-yellow-400" /> Filtered from 15,000+ Projects
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
              The Top 1% of<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">The Market.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
              We analyze thousands of pre-construction and assignment opportunities every week. 
              These are the only ones that met our investment criteria.
            </p>
        </div>
      </section>

      {/* Client Component (Grid + Modal) */}
      <ListingsClient initialListings={listings as any} />
    </div>
  );
}