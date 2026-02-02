import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BlogPost } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Tag, Calculator } from 'lucide-react';
import JsonLd from '@/components/JsonLd';

// Import Calculators for Injection
import MortgageCalculator from '@/components/MortgageCalculator';
import LandTransferTaxCalculator from '@/components/LandTransferTaxCalculator';
import ClosingCostsCalculator from '@/components/ClosingCostsCalculator';
import AffordabilityCalculator from '@/components/AffordabilityCalculator';

// 1. Fetch Post Logic (Server Side)
async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(collection(db, 'posts'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return { id: snapshot.docs[0].id, ...data } as BlogPost;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// 2. Metadata
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Article Not Found' };
  return {
    title: `${post.title} | IndiBrick Insights`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: [post.imageUrl || 'https://indibrick.ca/og-image.jpg'],
    },
  };
}

// 3. Helper: Choose Tool Based on Slug
function getContextualTool(slug: string, category: string) {
  const s = slug.toLowerCase();
  
  if (s.includes('land-transfer') || s.includes('ltt') || s.includes('closing-cost')) {
    return {
      title: "Calculate Your Exact Tax",
      component: <LandTransferTaxCalculator />
    };
  }
  if (s.includes('affordability') || s.includes('qualify') || s.includes('stress-test')) {
    return {
      title: "Check Your Buying Power",
      component: <AffordabilityCalculator />
    };
  }
  if (s.includes('closing') || s.includes('lawyer') || s.includes('cash')) {
    return {
      title: "Estimate Total Closing Cash",
      component: <ClosingCostsCalculator />
    };
  }
  // Default for Mortgage Category
  if (category === 'Mortgage' || s.includes('rate') || s.includes('payment')) {
    return {
      title: "Run Your Payment Scenarios",
      component: <MortgageCalculator />
    };
  }
  
  return null;
}

// 4. Page Component
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.imageUrl,
    datePublished: post.date,
    author: { '@type': 'Person', name: post.author || 'IndiBrick Team' },
    description: post.excerpt
  };

  const activeTool = getContextualTool(post.slug, post.category);

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={articleSchema} />

      {/* Header Image */}
      <div className="h-[40vh] relative bg-black">
         <div className="absolute inset-0 bg-black/50 z-10" />
         <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="container mx-auto px-6 max-w-4xl">
               <Link href="/blog" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm font-bold uppercase tracking-widest transition">
                  <ArrowLeft size={16} /> Back to Intel
               </Link>
               <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">{post.title}</h1>
               <div className="flex flex-wrap gap-6 text-white/80 text-sm font-medium">
                  <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(post.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-2"><User size={16} /> {post.author}</span>
                  <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full"><Tag size={14} /> {post.category}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Content Body */}
      <article className="py-20 px-6 container mx-auto max-w-3xl">
         <div className="prose prose-lg prose-slate max-w-none prose-headings:font-black prose-headings:text-black prose-p:text-gray-600 mb-12" dangerouslySetInnerHTML={{ __html: post.content }} />
         
         {/* CONTEXTUAL TOOL INJECTION */}
         {activeTool && (
           <div className="my-16 bg-gray-50 p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                 <div className="bg-black text-white p-3 rounded-xl"><Calculator size={24} /></div>
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">{activeTool.title}</h3>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Interactive Analysis</p>
                 </div>
              </div>
              {activeTool.component}
           </div>
         )}
      </article>

      {/* Call to Action */}
      <section className="bg-black text-white py-20">
         <div className="container mx-auto px-6 max-w-3xl text-center">
            <h3 className="text-3xl font-black uppercase tracking-tight mb-6">Execute This Strategy</h3>
            <p className="text-gray-400 mb-10 text-lg">Don't just read about it. Our team is ready to structure this deal for you.</p>
            <Link href="/contact" className="bg-white text-black px-12 py-5 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition">
               Book Strategy Call
            </Link>
         </div>
      </section>
    </div>
  );
}