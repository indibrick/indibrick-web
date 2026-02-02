
'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, ArrowRight, Calendar, ExternalLink } from 'lucide-react';
import { ContentService } from '../../services/ContentService';
import { NewsArticle } from '../../types';
import LeadForm from '../../components/LeadForm';

export default function MarketNewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      const articles = await ContentService.fetchNews();
      setNews(articles);
      setLoading(false);
    };
    loadNews();
  }, []);

  return (
    <div className="bg-white">
       {/* Hero */}
       <section className="bg-black text-white py-24 text-center border-b border-white/10">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">Market Intel</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Latest updates on interest rates, housing policy, and real estate trends affecting Ontario.
        </p>
      </section>

      <div className="container mx-auto px-6 py-24">
        {loading ? (
           <div className="text-center py-20">
             <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest">Loading Intel...</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-2 space-y-8">
                {news.length > 0 ? (
                  news.map((article) => (
                    <div key={article.id} className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 hover:border-black transition-all group">
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                          <div className="flex items-center gap-3">
                             <span className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                               {article.source}
                             </span>
                             <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                               <Calendar size={12} /> {new Date(article.date).toLocaleDateString()}
                             </div>
                          </div>
                       </div>
                       
                       <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-4 group-hover:underline decoration-2 underline-offset-4">
                         {article.title}
                       </h2>
                       
                       <p className="text-gray-600 font-medium leading-relaxed mb-8">
                         {article.summary}
                       </p>
                       
                       <a 
                         href={article.url} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-black hover:text-gray-600 transition"
                       >
                         Read Source <ExternalLink size={12} />
                       </a>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-[2rem]">
                     <Newspaper className="mx-auto text-gray-300 mb-4" size={48} />
                     <p className="text-gray-500 font-bold">No news articles found at this time.</p>
                  </div>
                )}
             </div>

             <div className="lg:col-span-1">
                <div className="sticky top-24">
                   <div className="bg-black text-white p-10 rounded-[2.5rem] mb-12 text-center">
                      <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Stay Informed</h3>
                      <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                        Markets move fast. Subscribe to our briefing to get rate alerts and policy changes delivered to your inbox.
                      </p>
                      <LeadForm title="Subscribe" subtitle="Join the newsletter" type="General" />
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}