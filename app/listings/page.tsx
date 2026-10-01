import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PropertyService } from '../../services/PropertyService';
import ListingsClient from '../../components/ListingsClient';
import { Zap, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';
import { DEVELOPMENTS } from '../../lib/developmentsData';

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

  // 3661 Keenan Crescent — open house co-hosted with the listing brokerage.
  // Listed by SUTTON GROUP QUANTUM REALTY INC.; IndiBrick is the mortgage side
  // only. The landing page carries the full attribution.
  const keenanCrescentListing = {
    id: 'keenan-crescent-w13835718',
    title: '3661 Keenan Crescent — Malton Backsplit on a Ravine Lot',
    price: 799900,
    city: 'Mississauga',
    address: '3661 Keenan Crescent, Mississauga (Malton) ON L4T 3M1',
    bedrooms: 3,
    bathrooms: 2,
    type: 'Detached',
    purpose: 'Resale',
    imageUrl: '/keenan/keenan-1.jpg',
    landingPageUrl: '/listings/3661-keenan-crescent',
    description: 'Offered for the first time in 50 years. Three-bedroom detached backsplit on a private ravine lot with no rear neighbours. Kitchen and baths renovated 2015; roof, furnace and A/C 2022. Open house Friday October 3, 2 to 4 PM. MLS W13835718, listed by Sutton Group Quantum Realty Inc.',
    isFeatured: true,
    status: 'Active'
  };

  // Combine — featured funnels first, then dynamic Firestore inventory
  const listings = [keenanCrescentListing, auraLakeviewListing, hamiltonRestaurantListing, royalTuscanListing, ...fetchedListings];

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

      {/* FEATURED NEW-BUILD COMMUNITIES — Simcoe County focus */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-800 mb-3">
                <Sparkles size={12}/> Featured new-build communities
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                South Barrie + Simcoe County pre-construction
              </h2>
              <p className="mt-2 text-sm md:text-base text-neutral-600 max-w-2xl">
                MIRA Towns, Vicinity by Mattamy Homes, Midhurst Valley, and every other active pre-construction release in the region — with real pricing pulled from official builder pages.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEVELOPMENTS.map(d => (
              <Link key={d.slug} href={`/listings/${d.slug}`}
                className="group relative rounded-3xl overflow-hidden border border-neutral-200 hover:border-slate-900 transition bg-white">
                <div className="relative h-48 md:h-56 bg-neutral-100">
                  <Image src={d.heroImageUrl} alt={d.name} fill unoptimized className="object-cover group-hover:scale-105 transition duration-500"/>
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center bg-white/90 text-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                      {d.status}
                    </span>
                    {d.builderOrDeveloper && (
                      <span className="inline-flex items-center bg-slate-900/80 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                        {d.builderOrDeveloper}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition">{d.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin size={12}/> {d.region}
                  </div>
                  <p className="mt-3 text-sm text-neutral-600 line-clamp-2">{d.tagline}</p>
                  {d.priceRange && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg">
                      <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Pricing</span>
                      <span className="text-sm font-black text-slate-900">{d.priceRange}</span>
                    </div>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-slate-900">
                    View community <ArrowRight size={12}/>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Client Component (Grid + Modal) */}
      <ListingsClient initialListings={listings as any} />
    </div>
  );
}