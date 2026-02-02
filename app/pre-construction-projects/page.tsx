
'use client';

import React, { useState } from 'react';
import { PROPERTIES } from '../../constants';
import ListingCard from '../../components/ListingCard';
import LeadForm from '../../components/LeadForm';
import { Lock, FileText, CheckCircle, ShieldAlert, Zap, Info } from 'lucide-react';

export default function PreConstructionPage() {
  const [unlocked, setUnlocked] = useState(false);
  const preConProps = PROPERTIES.filter(p => p.purpose === 'Pre-Construction');

  const handleUnlock = () => {
    setUnlocked(true);
  };

  return (
    <div>
      <div className="bg-black text-white py-24 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
              <Zap size={14} className="text-white" /> Platinum Access Channel
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-8 leading-tight tracking-tighter uppercase">
              Pre-Construction Projects
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-2xl font-medium">
              Navigating the GTA's pre-construction landscape requires a financing-first strategy. We provide the education and connections to buy with confidence.
            </p>
            <div className="flex flex-wrap gap-6 border-t border-white/10 pt-10">
               <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                 <CheckCircle size={14} className="text-white" /> Tarion Warranty Education
               </span>
               <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                 <CheckCircle size={14} className="text-white" /> Assignment Sale Strategies
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Block - MANDATORY */}
      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-white p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
             <div className="flex items-center gap-4 mb-8">
                <div className="bg-black text-white p-3 rounded-xl">
                   <Info size={24} />
                </div>
                <h2 className="text-2xl font-black text-black uppercase tracking-tight">The Pre-Con Reality Check</h2>
             </div>
             <div className="space-y-6 text-gray-600 font-medium leading-relaxed">
                <p>
                  Buying pre-construction is a long-term play. Unlike resale, you aren't just buying a home; you are buying a contract. Most builders require a firm mortgage commitment letter or a pre-approval from a recognized lender before they confirm your unit.
                </p>
                <p>
                  Our ecosystem ensures your financing is architected <strong>before</strong> you sign the Agreement of Purchase and Sale. We analyze deposit structures, closing cost caps, and potential HST rebates so there are no surprises in 3-5 years.
                </p>
             </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          <div className="lg:col-span-2 space-y-16">
            <h2 className="text-3xl font-black text-black mb-12 uppercase tracking-tighter">Current Monitored Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {preConProps.map(p => (
                <div key={p.id} className="relative group">
                  <ListingCard property={p} />
                  {!unlocked && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-8 text-center rounded-xl">
                       <button onClick={handleUnlock} className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-2xl">
                          <Lock size={16} /> Unlock Floor Plans
                       </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={`transition-all duration-700 ${unlocked ? 'opacity-100 translate-y-0' : 'opacity-20 blur-sm grayscale pointer-events-none'}`}>
               <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Gated Investor Resources</h3>
               <div className="space-y-4">
                 {[
                   'Confidential Platinum Price List - Q3 2024',
                   'Deposit Structure Breakdowns (Extended)',
                   'Assignment Clause Analysis'
                 ].map((title, i) => (
                   <div key={i} className="bg-white p-8 rounded-3xl border border-gray-200 flex justify-between items-center hover:border-black transition cursor-pointer group shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition">
                           <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-black uppercase tracking-tight">{title}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Hub Document</p>
                        </div>
                      </div>
                      <button className="bg-gray-100 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-black group-hover:text-white transition">Download</button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 h-fit">
              {!unlocked ? (
                <LeadForm 
                  type="Pre-Con" 
                  title="Unlock Project Intel" 
                  subtitle="Submit the form to gain access to confidential floor plans, builder pricing, and financing qualification." 
                />
              ) : (
                <div className="bg-black text-white p-12 rounded-[3rem] text-center shadow-2xl">
                   <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
                      <CheckCircle size={40} className="text-white" />
                   </div>
                   <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Identity Verified</h3>
                   <p className="text-gray-400 mb-10 leading-relaxed font-medium">You now have access to gated project data. A specialist will reach out shortly to discuss your investment strategy and builder incentives.</p>
                   <button onClick={() => setUnlocked(false)} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition">Reset Session</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Builder Disclaimer */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto flex items-start gap-4">
             <ShieldAlert className="text-gray-300 shrink-0" size={24} />
             <div className="space-y-4">
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                 <strong>LEGAL ADVERTISING NOTICE:</strong> Pre-construction projects are advertised as a service to connect buyers with builder-partner developments. IndiBrick.ca and Mudit Chhura (Mortgage Agent Level 1, Pineapple License 12830) are not the project builders, developers, or their exclusive sales representatives.
               </p>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                 All project information, including pricing, floor plans, and square footage, is subject to change by the builder without notice. No pricing or ROI is guaranteed. Buyers are encouraged to seek legal counsel for all contract reviews.
               </p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
