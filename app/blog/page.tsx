import React from 'react';
import Link from 'next/link';
import { ContentService } from '../../services/ContentService';
import JsonLd from '../../components/JsonLd';
import GamifiedContactForm from '../../components/GamifiedContactForm';
import { ArrowRight, Calendar, Zap, BookOpen, ChevronRight } from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'IndiBrick Blog — Ontario Mortgage & Real Estate Intelligence',
  description: 'Weekly mortgage rate analysis, Ontario real estate market data and financial strategy from the IndiBrick team. Live TRREB stats, CREA HPI updates, and lender rate breakdowns for GTA homeowners and investors.',
  slug: '/blog',
  // titleAbsolute prevents the layout appending "| IndiBrick" — brand is
  // already in the title, no need for the double-bookend.
  titleAbsolute: true,
  keywords: [
    'Ontario mortgage blog',
    'Toronto real estate blog',
    'mortgage rate news Canada',
    'real estate market intelligence Ontario',
    'GTA housing market analysis',
    'IndiBrick blog',
  ],
});

// ISR — blog index regenerates hourly so new posts appear without a redeploy.
export const revalidate = 3600;

export default async function KnowledgeHubPage() {
  // --- 2. DATA FETCHING & SORTING ---
  const allPosts = await ContentService.fetchPosts();

  // Only show published posts publicly (legacy posts have no status field → treated as published)
  const publishedPosts = allPosts.filter((p: any) => p.status !== 'draft');

  // Sort all posts by date, newest first (Chronological Feed)
  const sortedPosts = publishedPosts.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
  });

  const featuredPost = sortedPosts[0];
  const feedPosts = sortedPosts.slice(1);

  // --- 3. AEO (ANSWER ENGINE OPTIMIZATION) SCHEMA ---
  // This tells Google, ChatGPT, and Perplexity exactly what this list is.
  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "IndiBrick Intelligence Hub",
    "description": "Chronological database of real estate and mortgage market intelligence.",
    "url": "https://indibrick.ca/blog",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": sortedPosts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://indibrick.ca/blog/${post.slug}`,
        "name": post.title,
        "description": post.excerpt
      }))
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 pt-24 pb-24">
      <JsonLd data={hubSchema} />

      <div className="container mx-auto max-w-7xl px-6">
          
          {/* HEADER */}
          <header className="mb-16 border-b border-gray-100 pb-12">
             <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                <BookOpen size={14} /> Market Intelligence
             </div>
             {/* Keyword-aligned H1 for ranking on "Ontario mortgage blog" /
                 "Toronto real estate blog". Old H1 was "The Terminal." —
                 great brand voice, invisible to search. Moved brand voice
                 into the kicker above and the paragraph below. */}
             <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none text-slate-900">
                IndiBrick <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Blog.</span>
             </h1>
             <p className="text-sm md:text-base text-gray-500 uppercase tracking-widest font-black mb-6">
                Ontario Mortgage &amp; Real Estate Intelligence
             </p>
             <p className="text-xl text-gray-500 max-w-2xl font-medium leading-relaxed">
                Chronological market data, mortgage rate analysis, and wealth preservation strategies. Updated in real-time by the IndiBrick team.
             </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
              
              {/* LEFT COLUMN: THE CHRONOLOGICAL FEED */}
              <main className="lg:col-span-7 xl:col-span-8 space-y-12">
                  
                  {/* FEATURED LATEST POST */}
                  {featuredPost && (
                      <article className="group">
                          <Link href={`/blog/${featuredPost.slug}`} className="block">
                              <div className="relative w-full aspect-video md:aspect-[21/9] rounded-[2rem] overflow-hidden mb-6 shadow-xl border border-gray-100">
                                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition z-10 duration-500" />
                                  <img 
                                      src={featuredPost.imageUrl} 
                                      alt={featuredPost.title} 
                                      className="w-full h-full object-cover transform group-hover:scale-105 transition duration-1000"
                                  />
                                  <div className="absolute top-6 left-6 z-20 bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                      <Zap size={12} className="text-yellow-400" /> Latest Release
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                                  <span className="text-blue-600">{featuredPost.category}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(featuredPost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                              </div>
                              
                              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4 group-hover:text-blue-600 transition leading-[1.1]">
                                  {featuredPost.title}
                              </h2>
                              <p className="text-gray-500 text-lg font-medium leading-relaxed mb-6">
                                  {featuredPost.excerpt}
                              </p>
                              
                              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-blue-600 transition border-b-2 border-black group-hover:border-blue-600 pb-1">
                                  Read Full Analysis <ArrowRight size={14} />
                              </span>
                          </Link>
                      </article>
                  )}

                  {/* THE ARCHIVE LIST */}
                  <div className="space-y-8 pt-8 border-t border-gray-100">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Intelligence Archive</h3>
                      
                      {feedPosts.map((post) => (
                          <article key={post.id} className="group">
                              <Link href={`/blog/${post.slug}`} className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-white p-4 rounded-3xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition duration-300 -mx-4">
                                  
                                  {/* Thumbnail */}
                                  <div className="w-full md:w-48 h-48 md:h-32 shrink-0 rounded-2xl overflow-hidden relative">
                                      <img 
                                          src={post.imageUrl} 
                                          alt={post.title} 
                                          className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" 
                                      />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-grow">
                                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                          <span className="text-blue-600">{post.category}</span>
                                          <span>•</span>
                                          <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                      </div>
                                      <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mb-2 group-hover:text-blue-600 transition leading-tight">
                                          {post.title}
                                      </h3>
                                      <p className="text-gray-500 text-sm font-medium line-clamp-2">
                                          {post.excerpt}
                                      </p>
                                  </div>

                                  {/* Arrow Icon */}
                                  <div className="hidden xl:flex shrink-0 w-12 h-12 rounded-full border border-gray-200 items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition duration-300">
                                      <ChevronRight size={20} />
                                  </div>
                              </Link>
                          </article>
                      ))}
                  </div>

              </main>

              {/* RIGHT COLUMN: STICKY GAMIFIED CONVERSION ENGINE */}
              <aside className="lg:col-span-5 xl:col-span-4">
                  <div className="sticky top-32">
                      
                      <div className="mb-6 flex items-center gap-3">
                          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white"><Zap size={16} className="fill-white"/></div>
                          <div>
                              <h3 className="font-black uppercase tracking-tight text-slate-900 leading-none">Execute Strategy</h3>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Get an exact action plan</p>
                          </div>
                      </div>

                      {/* INJECT GAMIFIED FORM HERE */}
                      <div className="relative">
                          {/* Add a subtle glow behind the form to make it pop */}
                          <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/10 to-purple-500/10 blur-xl -z-10 rounded-[3rem]"></div>
                          <GamifiedContactForm />
                      </div>

                  </div>
              </aside>

          </div>
      </div>
    </div>
  );
}