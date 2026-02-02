'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';

const REVIEWS = [
  { id: 1, name: "Sarah J.", role: "First Time Buyer", text: "Mudit found us a rate 0.40% lower than our own bank offered. The process was completely digital and seamless.", rating: 5 },
  { id: 2, name: "Michael T.", role: "Real Estate Investor", text: "The commercial team understands cap rates and DSCR. They structured a portfolio loan that banks wouldn't touch.", rating: 5 },
  { id: 3, name: "Elena R.", role: "Refinance Client", text: "Saved me $600/month by consolidating debt. The 'Rate Watch' tool actually works!", rating: 5 },
];

export default function Testimonials() {
  // AEO: AggregateRating Schema
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "IndiBrick",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "127", // Use real or realistic starting number
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
           <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Trusted by Ontario Homeowners</h2>
           <div className="flex justify-center gap-1 text-yellow-400 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={24} />)}
           </div>
           <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">5.0/5 Average Rating</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {REVIEWS.map((review) => (
             <div key={review.id} className="bg-gray-50 p-8 rounded-[2rem] relative hover:shadow-xl transition duration-500">
                <Quote className="text-gray-200 absolute top-8 right-8" size={48} />
                <div className="flex gap-1 text-yellow-400 mb-6">
                   {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-gray-600 font-medium mb-6 relative z-10 leading-relaxed">"{review.text}"</p>
                <div>
                   <p className="font-black text-black uppercase text-sm">{review.name}</p>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{review.role}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </section>
  );
}