import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ContentService } from '../../services/ContentService';
import JsonLd from '../../components/JsonLd';
import { 
  ArrowRight, BookOpen, Star, MapPin, 
  ShieldCheck, TrendingUp, Scale, Home
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Knowledge Command Center | Real Estate & Financial Strategy',
  description: 'The central authority for Ontario real estate strategy. Mortgage planning, insurance guides, and exclusive IndiBrick investment analysis.',
};

export const dynamic = 'force-dynamic';

export default async function KnowledgeHubPage() {
  const allPosts = await ContentService.fetchPosts();

  // 1. FILTER: Exclusives (Limit 2 for clean look)
  const exclusivePosts = allPosts
    .filter(p => ['IndiBrick Exclusive', 'Market Strategy'].includes(p.category) || p.title.includes('IndiBrick'))
    .slice(0, 2);

  // 2. FILTER: General Categories
  const mortgagePosts = allPosts.filter(p => p.category === 'Mortgage').slice(0, 5);
  const insurancePosts = allPosts.filter(p => p.category === 'Insurance' || p.category === 'Investment').slice(0, 5);
  const legalPosts = allPosts.filter(p => p.category === 'Legal' || p.category === 'Real Estate').slice(0, 5);

  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "IndiBrick Knowledge Hub",
    "description": "Comprehensive financial and real estate guides for Canadians.",
    "hasPart": [
      { "@type": "SiteNavigationElement", "name": "City Intelligence", "url": "https://indibrick.ca/blog/city-intelligence" },
      { "@type": "SiteNavigationElement", "name": "Mortgage Guides", "url": "https://indibrick.ca/mortgages" }
    ]
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={hubSchema} />

      {/* HERO */}
      <section className="bg-black text-white pt-32 pb-24 border-b border-white/10 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-white/20">
             <BookOpen size={14} /> Knowledge Command Center
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
            Strategy &<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">Execution.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Expert-led guides on mortgages, wealth preservation, and legal structuring. 
            We decode the complexity so you can execute with confidence.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24 space-y-24">
        
        {/* 1. INDIBRICK EXCLUSIVE (Featured) */}
        {exclusivePosts.length > 0 && (
          <section>
             <div className="flex items-center gap-3 mb-10">
                <Star className="text-black fill-black" size={24}/>
                <h2 className="text-2xl font-black uppercase tracking-tight">IndiBrick Exclusive</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {exclusivePosts.map(post => (
                   <Link key={post.id} href={`/blog/${post.slug}`} className="group relative bg-gray-900 text-white rounded-[2.5rem] p-10 overflow-hidden hover:shadow-2xl transition duration-500 min-h-[300px] flex flex-col">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition duration-500"></div>
                      <div className="relative z-10 mt-auto">
                         <span className="inline-block bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">{post.category}</span>
                         <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4 leading-tight group-hover:underline decoration-2 underline-offset-4">
                            {post.title}
                         </h3>
                         <p className="text-gray-400 line-clamp-2 text-sm font-medium">{post.excerpt}</p>
                      </div>
                   </Link>
                ))}
             </div>
          </section>
        )}

        {/* 2. CITY INTELLIGENCE (Redirect Block) */}
        <section>
           <Link href="/blog/city-intelligence" className="block bg-green-50 border border-green-100 rounded-[2.5rem] p-12 text-center group hover:bg-green-100 hover:border-green-200 transition duration-500">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white text-green-700 rounded-2xl shadow-sm mb-6 group-hover:scale-110 transition">
                 <MapPin size={32} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-green-900">City Intelligence Hub</h2>
              <p className="text-green-800/70 max-w-2xl mx-auto mb-8 font-medium">
                 Access granular market data, neighborhood reports, and local mortgage insights for Toronto, Vaughan, and the GTA.
              </p>
              <span className="inline-flex items-center gap-2 bg-green-700 text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest group-hover:bg-green-800 transition">
                 Open Regional Map <ArrowRight size={16} />
              </span>
           </Link>
        </section>

        {/* 3. GENERAL KNOWLEDGE BASE (Categorized) */}
        <section>
           <div className="flex items-center gap-3 mb-12">
              <BookOpen className="text-black" size={24}/>
              <h2 className="text-2xl font-black uppercase tracking-tight">General Knowledge Base</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              
              {/* Column 1: Mortgages */}
              <div>
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <Home size={20} className="text-blue-600"/>
                    <h3 className="font-black uppercase text-sm tracking-wide">Mortgage Strategy</h3>
                 </div>
                 <ul className="space-y-4">
                    {mortgagePosts.map(p => (
                       <li key={p.id}>
                          <Link href={`/blog/${p.slug}`} className="group block">
                             <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition text-sm leading-snug mb-1">{p.title}</h4>
                             <span className="text-[10px] text-gray-400 uppercase tracking-widest">Read Article</span>
                          </Link>
                       </li>
                    ))}
                 </ul>
                 <Link href="/mortgages" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mt-6 text-blue-600 hover:gap-2 transition-all">View All <ArrowRight size={10}/></Link>
              </div>

              {/* Column 2: Insurance & Wealth */}
              <div>
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <TrendingUp size={20} className="text-green-600"/>
                    <h3 className="font-black uppercase text-sm tracking-wide">Wealth & Insurance</h3>
                 </div>
                 <ul className="space-y-4">
                    {insurancePosts.map(p => (
                       <li key={p.id}>
                          <Link href={`/blog/${p.slug}`} className="group block">
                             <h4 className="font-bold text-gray-800 group-hover:text-green-600 transition text-sm leading-snug mb-1">{p.title}</h4>
                             <span className="text-[10px] text-gray-400 uppercase tracking-widest">Read Article</span>
                          </Link>
                       </li>
                    ))}
                 </ul>
                 <Link href="/investment-planning-wealth-growth" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mt-6 text-green-600 hover:gap-2 transition-all">View All <ArrowRight size={10}/></Link>
              </div>

              {/* Column 3: Legal & Closing */}
              <div>
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <Scale size={20} className="text-gray-600"/>
                    <h3 className="font-black uppercase text-sm tracking-wide">Legal & Closing</h3>
                 </div>
                 <ul className="space-y-4">
                    {legalPosts.map(p => (
                       <li key={p.id}>
                          <Link href={`/blog/${p.slug}`} className="group block">
                             <h4 className="font-bold text-gray-800 group-hover:text-black transition text-sm leading-snug mb-1">{p.title}</h4>
                             <span className="text-[10px] text-gray-400 uppercase tracking-widest">Read Article</span>
                          </Link>
                       </li>
                    ))}
                 </ul>
              </div>

           </div>
        </section>

      </div>
    </div>
  );
}