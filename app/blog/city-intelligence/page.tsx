import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ContentService } from '../../../services/ContentService';
import { CityService } from '../../../services/CityService';
import { MapPin, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'City Intelligence | Real Estate Market Data by Region',
  description: 'Deep dives into Toronto, Vaughan, Mississauga, and GTA housing markets. Localized mortgage and investment analysis.',
};

export const dynamic = 'force-dynamic';

export default async function CityIntelligencePage() {
  const allPosts = await ContentService.fetchPosts();
  const cities = await CityService.getAllCities();

  // Filter for posts that mention a city in title or slug
  const cityPosts = allPosts.filter(p => {
    const target = (p.title + p.slug).toLowerCase();
    return cities.some(c => target.includes(c.slug) || target.includes(c.name.toLowerCase()));
  });

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="container mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-24">
           <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <MapPin size={14} /> Localized Alpha
           </div>
           <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">City Intelligence</h1>
           <p className="text-xl text-gray-500 max-w-2xl mx-auto">
             Real estate is local. Access granular market data, neighborhood guides, and mortgage insights for your specific region.
           </p>
        </div>

        {/* GRID */}
        {cityPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {cityPosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group block bg-gray-50 rounded-[2rem] overflow-hidden hover:shadow-xl transition duration-500">
                   <div className="h-56 bg-gray-200 relative">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700"
                      />
                      <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                         Regional Report
                      </div>
                   </div>
                   <div className="p-8">
                      <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                         <MapPin size={12} /> Ontario
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tight mb-4 group-hover:underline decoration-2 underline-offset-4">{post.title}</h3>
                      <p className="text-gray-500 text-sm mb-8 line-clamp-3">{post.excerpt}</p>
                      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black">
                         Read Analysis <ArrowRight size={14} />
                      </span>
                   </div>
                </Link>
             ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem]">
             <h3 className="text-xl font-bold text-gray-400">No City Reports Available.</h3>
             <p className="text-gray-500 mt-2">Our analysts are compiling the latest data. Check back soon.</p>
          </div>
        )}

      </div>
    </div>
  );
}