'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/firebase'; // <--- FIXED
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BlogPost } from '@/types'; // <--- FIXED
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Tag, Calculator, Clock, Share2, ArrowRight, ShieldCheck } from 'lucide-react';
import JsonLd from '@/components/JsonLd'; // <--- FIXED
import LeadForm from '@/components/LeadForm'; // <--- FIXED

// Import Calculators (FIXED IMPORTS)
import MortgageCalculator from '@/components/MortgageCalculator';
import LandTransferTaxCalculator from '@/components/LandTransferTaxCalculator';
import ClosingCostsCalculator from '@/components/ClosingCostsCalculator';
import AffordabilityCalculator from '@/components/AffordabilityCalculator';

// --- 1. DATA FETCHING ---
async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(collection(db, 'posts'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    
    let date = new Date().toISOString();
    if (data.date && typeof data.date.toDate === 'function') {
        date = data.date.toDate().toISOString();
    } else if (data.date) {
        date = new Date(data.date).toISOString();
    }

    return { id: snapshot.docs[0].id, ...data, date } as BlogPost;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// --- 2. TOOL SELECTOR ---
function getContextualTool(slug: string, category: string) {
  const s = slug.toLowerCase();
  
  if (s.includes('land-transfer') || s.includes('ltt')) {
    return {
      title: "Ontario Land Transfer Tax Calculator",
      subtitle: "Calculate your exact closing costs and rebates.",
      component: <LandTransferTaxCalculator />
    };
  }
  if (s.includes('affordability') || s.includes('qualify') || s.includes('income')) {
    return {
      title: "Maximum Affordability Engine",
      subtitle: "Stress-test your income against 2026 banking rules.",
      component: <AffordabilityCalculator />
    };
  }
  if (s.includes('closing') || s.includes('cost')) {
    return {
      title: "Total Cash Required",
      subtitle: "Estimate legal fees, adjustments, and land taxes.",
      component: <ClosingCostsCalculator />
    };
  }
  if (category === 'Mortgage' || s.includes('rate') || s.includes('payment') || s.includes('refinance')) {
    return {
      title: "Mortgage Payment Scenarios",
      subtitle: "Model your monthly payments at different rates.",
      component: <MortgageCalculator />
    };
  }
  
  return null;
}

// --- 3. PAGE COMPONENT ---
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const activeTool = getContextualTool(post.slug, post.category);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.imageUrl,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'IndiBrick Financial' },
    description: post.excerpt
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
      <JsonLd data={articleSchema} />

      {/* --- PROGRESS BAR --- */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-100 z-50">
        <div className="h-full bg-blue-600 w-0 animate-scroll-progress"></div>
      </div>

      {/* --- HEADER SECTION --- */}
      <header className="pt-32 pb-12 px-6 bg-white border-b border-gray-100">
         <div className="container mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition">
                    <ArrowLeft size={12} /> Intelligence Hub
                </Link>
                <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-400">
                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-500">{post.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> 5 Min Read</span>
                </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-8 max-w-4xl">
                {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm border-t border-gray-100 pt-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">IB</div>
                    <div>
                        <p className="font-bold text-slate-900 leading-tight">IndiBrick Research</p>
                        <p className="text-gray-500 text-xs">Financial Strategy Team</p>
                    </div>
                </div>
                <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                <div className="text-gray-500 font-medium">
                    Published <span className="text-slate-900">{new Date(post.date).toLocaleDateString()}</span>
                </div>
            </div>
         </div>
      </header>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="container mx-auto max-w-7xl px-6 py-12 md:py-20">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
            
            {/* LEFT COLUMN: Article Content */}
            <main className="lg:col-span-8">
                
                <div className="mb-12 rounded-[2rem] overflow-hidden shadow-2xl bg-gray-100 relative aspect-video">
                    <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-1000" 
                    />
                </div>

                <div className="prose prose-lg md:prose-xl prose-slate max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 
                    prose-p:text-gray-600 prose-p:leading-relaxed prose-p:font-medium
                    prose-a:text-blue-600 prose-a:no-underline prose-a:font-bold hover:prose-a:underline
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                    prose-img:rounded-3xl prose-img:shadow-lg">
                    
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>

                {/* INJECTED TOOL */}
                {activeTool && (
                    <div className="mt-20 mb-20 -mx-6 md:-mx-12 p-6 md:p-12 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                        <div className="relative z-10 mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/50">
                                <Calculator size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{activeTool.title}</h3>
                                <p className="text-blue-200 text-sm font-medium">{activeTool.subtitle}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-1 shadow-inner">
                            {activeTool.component}
                        </div>
                    </div>
                )}
            </main>

            {/* RIGHT COLUMN: Sticky Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
                <div className="sticky top-32">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-slate-900">Need this executed?</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            Reading is research. Execution is wealth. Our team can structure this exact strategy for your portfolio.
                        </p>
                        <a href="/contact" className="block w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition shadow-lg mb-4">
                            Book Strategy Call
                        </a>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Free • No Obligation</p>
                    </div>

                    <div className="mt-8 bg-gray-50 p-8 rounded-[2rem] border border-gray-100 hidden lg:block">
                        <h4 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-6">Related Intel</h4>
                        <div className="flex flex-wrap gap-2">
                            {['Mortgage', 'Tax Strategy', 'Legal', 'Market Data'].map(tag => (
                                <Link key={tag} href={`/blog`} className="bg-white px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition shadow-sm">
                                    {tag}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
         </div>
      </div>

      {/* --- FOOTER CTA (Mobile Fallback) --- */}
      <section className="lg:hidden py-16 px-6 bg-slate-900 text-white text-center">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Ready to act?</h3>
          <p className="text-gray-400 mb-8 text-sm">Turn this insight into a funded deal.</p>
          <a href="/contact" className="inline-block bg-white text-black px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs">
              Book Call
          </a>
      </section>
    </div>
  );
}