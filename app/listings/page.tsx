import React from 'react';
import { PropertyService } from '../../services/PropertyService';
import ListingsClient from '../../components/ListingsClient';
import { Zap } from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Curated Real Estate Opportunities',
  description: 'Access off-market assignments, pre-construction allocations, and exclusive resale properties selected by our investment team.',
  slug: '/listings',
  keywords: ['off-market real estate Ontario', 'pre-construction listings', 'exclusive resale properties', 'curated real estate opportunities'],
});

// ISR — listings index regenerates hourly; static HTML on first crawl.
export const revalidate = 3600;

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

  // AURA Lakeview Village (Caivan) — Phase II pre-con
  const auraLakeviewListing = {
    id: 'aura-lakeview-vip-manual',
    title: 'AURA Lakeview Village — Phase II',
    price: 550000,
    city: 'Mississauga',
    address: 'Lakeview Village, Mississauga ON',
    bedrooms: 3,
    bathrooms: 2,
    type: 'Townhouse',
    purpose: 'Pre-Construction',
    imageUrl: '/aura/hero.jpg',
    landingPageUrl: '/aura-lakeview-village',
    description: 'Phase II of AURA Lakeview Village by Caivan — urban 2-storey freehold towns on the Mississauga waterfront. Phase I sold out in one day. From the mid $500s.',
    isFeatured: true,
    status: 'Active'
  };

  // Hamilton Restaurant — turnkey commercial sale of business (MLS X12933580)
  const hamiltonRestaurantListing = {
    id: 'hamilton-restaurant-x12933580',
    title: 'Turnkey Restaurant for Sale (LLBO) — Hamilton',
    price: 110000,
    city: 'Hamilton',
    address: 'Landsdale, Hamilton ON L8L 2X9',
    bedrooms: 0,
    bathrooms: 0,
    type: 'Commercial',
    purpose: 'Sale of Business',
    imageUrl: '/listings/x12933580/dining.jpg',
    landingPageUrl: '/hamilton-restaurant-for-sale',
    description: 'Active LLBO beer license. Fully equipped commercial kitchen (stove, hood, tandoor, refrigeration). 1,234 sqft retail in a high-traffic Landsdale corridor. MLS X12933580.',
    isFeatured: true,
    status: 'Active'
  };

  // Combine — featured funnels first, then dynamic Firestore inventory
  const listings = [auraLakeviewListing, hamiltonRestaurantListing, royalTuscanListing, ...fetchedListings];

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