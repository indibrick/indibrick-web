'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, MapPin, Train, ShieldAlert, Building2, CheckCircle, ArrowRight, Star } from 'lucide-react';
import LeadForm from '@/components/LeadForm'; // Ensure this exists in your project

export default function LuxuryPickeringPPCPage() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="bg-[#0a0a0a] min-h-screen font-sans text-white selection:bg-amber-500 selection:text-black">
      
      {/* 1. HERO SECTION - CINEMATIC & LUXURY */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-12 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/PICKERING AD .png" 
            alt="1515 Pickering Parkway Pre-Construction Condos in Durham Region" 
            fill 
            className="object-cover opacity-40 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-amber-500/50 text-amber-400 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.3em] mb-8 backdrop-blur-md bg-black/30">
              <Star size={14} className="text-amber-400 fill-amber-400" /> Platinum VIP Access
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-300 to-gray-500">
              1515 Pickering <br /> Parkway
            </h1>
            <h2 className="text-2xl md:text-3xl font-light text-gray-300 mb-6">
              A bright future in the heart of Downtown Pickering.
            </h2>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed max-w-2xl font-light">
              Welcome to 1515 Pickering Parkway, where abundance and potential live right outside your door. Embrace a harmonious blend of nature and urban growth in the GTA's fastest-growing city. Seamless commutes, transit-oriented living, and thoughtfully curated amenities crafted by Sevoy Developments.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 border-y border-white/10 py-8">
              <div>
                <p className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-1">Developer</p>
                <p className="text-white font-medium">Sevoy Developments</p>
              </div>
              <div>
                <p className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-1">Storeys</p>
                <p className="text-white font-medium">40-Storey Landmark</p>
              </div>
              <div>
                <p className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-1">Pricing</p>
                <p className="text-white font-medium">From the $300s</p>
              </div>
              <div>
                <p className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-1">Occupancy</p>
                <p className="text-white font-medium">Summer 2028</p>
              </div>
            </div>
          </div>

          {/* THE GATE (LEAD CAPTURE) */}
          <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
             <div className="text-center mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">Unlock Investor Pricing</h3>
                <p className="text-sm text-gray-400 mt-3 font-light">Register now for exclusive floor plans, VIP incentives, and our custom mortgage pre-approval strategy.</p>
             </div>
             <LeadForm 
               type="Pre-Con" 
               title="" 
               subtitle="" 
               ctaText="Reveal VIP Package"
               className="theme-dark" // Assuming your LeadForm can take a dark theme prop
             />
          </div>
        </div>
      </section>

      {/* 2. SEO / AEO OPTIMIZED PROPERTY DETAILS */}
      <section className="py-24 bg-[#0f0f11]">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[600px] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5">
              <Image 
                src="/1515.png" 
                alt="1515 Pickering Parkway exterior rendering by Arcadis Architects" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight mb-6">A Landmark in the <span className="text-amber-400">Pickering Skyline</span></h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8 font-light">
                Designed by the renowned architectural firm Arcadis Architects Inc., 1515 Pickering Parkway seamlessly blends stylistic elegance with functional brilliance, evoking the timeless imagery of music. The building's striking black-and-white façade, reminiscent of piano keys, sets a new standard for modern living in Durham Region.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-amber-400 shrink-0">
                    <Train size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Transit-Oriented Excellence</h4>
                    <p className="text-gray-400 font-light">A mere 4-minute walk to Pickering GO Station. Enjoy a seamless 35-minute commute to Downtown Toronto Union Station via the GO Train.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-amber-400 shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Downtown Pickering Hub</h4>
                    <p className="text-gray-400 font-light">Located just steps from the Pickering Town Centre, residents have immediate access to over 200 retail stores, dining, and the upcoming Durham Live casino and entertainment district.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIFESTYLE & AMENITIES IMAGERY */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6 max-w-6xl text-center mb-16">
           <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Curated For Purposeful Living</h2>
           <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto">Discover over 12,000 square feet of unparalleled indoor and outdoor amenities designed to elevate your everyday experience.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-2 w-full max-w-[1400px] mx-auto px-2">
          <div className="relative h-[400px] md:h-[500px] group overflow-hidden rounded-xl">
            <Image 
              src="/1515-1.jpg" 
              alt="1515 Pickering Parkway Luxury Amenities" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
               <h3 className="text-2xl font-bold uppercase tracking-widest text-white">World-Class Facilities</h3>
            </div>
          </div>
          <div className="relative h-[400px] md:h-[500px] group overflow-hidden rounded-xl">
            <Image 
              src="/1515-2.jpg" 
              alt="1515 Pickering Parkway Suite Interiors" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
               <h3 className="text-2xl font-bold uppercase tracking-widest text-white">Modern & Refined Suites</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GATED CONTENT SECTION (THE VELVET ROPE) */}
      <section className="py-24 bg-[#0f0f11] border-y border-white/5 relative">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Exclusive Investor Assets</h2>
          <p className="text-gray-400 mb-12">Register above to bypass the velvet rope and access our proprietary financial models.</p>
          
          <div className="relative group">
            {/* Blurred background content */}
            <div className={`grid md:grid-cols-3 gap-6 transition-all duration-700 ${unlocked ? 'blur-none opacity-100' : 'blur-xl opacity-30 select-none pointer-events-none'}`}>
               {[1, 2, 3].map((item) => (
                 <div key={item} className="bg-white/5 border border-white/10 p-8 rounded-2xl text-left">
                   <div className="w-12 h-12 bg-amber-500/20 rounded-full mb-6"></div>
                   <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
                   <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
                   <div className="h-3 bg-white/10 rounded w-5/6"></div>
                 </div>
               ))}
            </div>

            {/* Lock Overlay */}
            {!unlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                 <div className="bg-amber-500 text-black p-5 rounded-full mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <Lock size={32} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Assets Locked</h3>
                 <p className="text-gray-400 font-light mb-6">Complete the registration form to unlock.</p>
                 <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   Register Now <ArrowRight size={16} />
                 </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. COMPLIANCE & LEGAL DISCLOSURE (CRITICAL FOR INDIBRICK) */}
      <section className="py-12 bg-black border-t border-white/5">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-start gap-4 text-gray-500 bg-white/5 p-6 rounded-2xl border border-white/10">
             <ShieldAlert size={24} className="shrink-0 text-amber-500/50" />
             <div className="space-y-4 text-[11px] font-medium uppercase tracking-widest leading-relaxed text-gray-400">
               <p>
                 <strong className="text-gray-300">Advertising & Regulatory Disclosure:</strong> This webpage is operated by IndiBrick Financial (Mortgage Brokerage Lic. #12830) strictly for lead generation, market intelligence, and real estate financing purposes. 
               </p>
               <p>
                 IndiBrick is <span className="text-gray-300">not</span> the builder, developer, or exclusive listing brokerage for 1515 Pickering Parkway. Sevoy Developments is the official developer. Real estate representation and trading services for this project are provided exclusively by our licensed Realtor partners registered with RECO.
               </p>
               <p>
                 By submitting your information, you explicitly consent to being contacted by IndiBrick for mortgage pre-approval services, and by our designated Realtor partner for property acquisition and VIP allocation. Prices, figures, and architectural renderings are subject to change without notice. E.&O.E.
               </p>
             </div>
          </div>
        </div>
      </section>

    </div>
  );
}