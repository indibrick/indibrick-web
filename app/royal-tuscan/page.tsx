import React from 'react';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import {
  MapPin, Building2, ShieldCheck, Zap, ChevronDown,
  Wine, Car, TreePine, Star, CheckCircle, ArrowRight,
  Shield, Landmark, Hammer, Clock, Lock, FileText,
  Train, Compass
} from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Royal Tuscan Masterpiece Residences — VIP Pricing & Floor Plans',
  description: 'Invest in Royal Tuscan St. Catharines. Discover boutique steel & concrete condos and penthouses by Wilshire Development from the $390s. Get VIP access to floor plans and pricing.',
  slug: '/royal-tuscan',
  image: '/rt-_0004_8-sunset-view-new-sky.jpg',
  keywords: ['Royal Tuscan', 'Royal Tuscan St Catharines', 'Pre-construction Condos Niagara', '1024 Vansickle Road North', 'Steel and concrete condos', 'Wilshire Development Services', 'Palazzo Royale', 'Grapeview Condos', 'Niagara Escarpment Real Estate'],
});

export default function RoyalTuscanPage() {

  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": "Royal Tuscan Masterpiece Residences",
    "description": "A boutique collection of 97 luxury condos and penthouses featuring Tuscan Revival architecture and ultra-quiet steel-and-concrete construction in St. Catharines, Niagara.",
    "url": "https://indibrick.ca/royal-tuscan",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "CAD",
      "price": "398000",
      "availability": "https://schema.org/PreOrder",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "1024 Vansickle Road North",
      "addressLocality": "St. Catharines",
      "addressRegion": "ON",
      "postalCode": "L2S 2X3",
      "addressCountry": "CA"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Where is the Royal Tuscan located?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Royal Tuscan is located at 1024 Vansickle Road North in St. Catharines, Ontario. It is situated in the Grapeview/Martindale neighbourhood, just minutes from Twelve Mile Creek, Ridley College, and world-class Niagara wineries."
        }
      },
      {
        "@type": "Question",
        "name": "What makes Royal Tuscan's construction unique?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Unlike standard wood-frame mid-rises, Royal Tuscan by Wilshire Development uses commercial-grade steel and concrete construction. This provides superior acoustic noise-proofing (1/2 extra inch thick walls), enhanced fire safety, and long-term structural durability."
        }
      },
      {
        "@type": "Question",
        "name": "What are the prices for Royal Tuscan condos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pricing for Royal Tuscan currently starts from the upper $300,000s for 1-bedroom suites, ranging up to over $1M for expansive 3-bedroom Palazzo Royale penthouses with private rooftop terraces."
        }
      }
    ]
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-slate-900 pb-0 selection:bg-amber-200">
      <JsonLd data={projectSchema} />
      <JsonLd data={faqSchema} />

      {/* --- 1. CINEMATIC HERO SECTION --- */}
      <section className="relative pt-32 pb-32 px-6 bg-slate-900 text-white overflow-hidden flex items-center min-h-[95vh]">
        <div className="absolute inset-0 z-0">
          <img 
            src="/rt-_0004_8-sunset-view-new-sky.jpg" 
            alt="Royal Tuscan Masterpiece Residences Exterior - Sunset View" 
            className="w-full h-full object-cover opacity-50 scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900"></div>
        </div>
        
        <div className="container mx-auto max-w-[1400px] relative z-10">
           <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8">
                  <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md">
                     <Star size={14} className="fill-amber-500" /> VIP Platinum Phase Now Open
                  </div>
                  
                  {/* Official Logo Integration */}
                  <div className="mb-6 max-w-[280px] md:max-w-[350px]">
                     <img 
                        src="/royal-logo-web.png" 
                        alt="Royal Tuscan Logo" 
                        className="w-full h-auto drop-shadow-2xl"
                     />
                  </div>

                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.95] drop-shadow-2xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-600">Masterpiece Residences.</span>
                  </h1>
                  
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 mb-10 border-l-4 border-amber-500 pl-6 bg-slate-900/40 backdrop-blur-sm py-4 rounded-r-2xl max-w-2xl">
                     <div>
                        <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-1">Starting From</p>
                        <p className="text-3xl font-black text-white">$390's</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-1">Construction</p>
                        <p className="text-xl font-bold text-white mt-1">Steel & Concrete</p>
                     </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                     <a href="#vip-access" className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:from-amber-300 hover:to-amber-400 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                        Unlock Investor Package <Lock size={18}/>
                     </a>
                     <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-widest bg-slate-900/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                        <MapPin size={18} className="text-amber-500"/> 1024 Vansickle Rd N
                     </div>
                  </div>
              </div>

              {/* Fast Facts Card */}
              <div className="lg:col-span-4 hidden lg:block">
                 <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <h3 className="font-black uppercase tracking-widest text-xs text-amber-500 mb-8 border-b border-white/10 pb-4 flex items-center gap-2">
                       <Zap size={16}/> Project Intelligence
                    </h3>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <span className="text-gray-400 text-sm font-bold">Developer</span>
                          <span className="text-white font-black text-right text-lg">Wilshire / Palazzo Royale</span>
                       </div>
                       <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <span className="text-gray-400 text-sm font-bold">Storeys / Units</span>
                          <span className="text-white font-black text-right text-lg">5 Storeys • 97 Suites</span>
                       </div>
                       <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <span className="text-gray-400 text-sm font-bold">Structure</span>
                          <span className="text-amber-400 font-black text-right text-lg">Steel & Concrete</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm font-bold">Est. Occupancy</span>
                          <span className="bg-white text-black px-4 py-1.5 rounded-lg font-black text-sm uppercase tracking-widest shadow-lg">Late 2026</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- 2. AFFORDABLE LUXURY: SUITES & PRICING --- */}
      <section className="py-24 px-6 bg-white border-b border-gray-100 relative -mt-10 rounded-t-[3rem] z-20">
         <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">Attainable Luxury.</h2>
               <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Unlike downtown Toronto pre-cons, Royal Tuscan offers true European luxury without the millionaire price tag. Perfect for first-time buyers and savvy investors.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 hover:border-amber-400 transition duration-300 hover:shadow-2xl text-center group">
                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">1 Bedroom</h3>
                  <p className="text-amber-600 font-black text-3xl mb-6">From $390's</p>
                  <p className="text-sm text-gray-500 font-medium mb-8">Ideal for young professionals and pure rental investments. Efficient layouts with zero wasted space.</p>
                  <a href="#vip-access" className="inline-block border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition">View Floor Plans</a>
               </div>
               
               <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 hover:border-amber-400 transition duration-300 shadow-2xl text-center group relative overflow-hidden transform md:-translate-y-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Most Popular</div>
                  <h3 className="text-2xl font-black text-white mb-2 uppercase mt-6">1 Bed + Den</h3>
                  <p className="text-amber-400 font-black text-3xl mb-6">From $450's</p>
                  <p className="text-sm text-gray-400 font-medium mb-8">The ultimate hybrid. Includes a dedicated workspace or secondary sleeping area. Highest ROI potential.</p>
                  <a href="#vip-access" className="inline-block bg-amber-500 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition">View Floor Plans</a>
               </div>

               <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 hover:border-amber-400 transition duration-300 hover:shadow-2xl text-center group">
                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">2 Bedrooms</h3>
                  <p className="text-amber-600 font-black text-3xl mb-6">From $550's</p>
                  <p className="text-sm text-gray-500 font-medium mb-8">Spacious corner units designed for downsizers and families. Massive windows and split layouts.</p>
                  <a href="#vip-access" className="inline-block border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition">View Floor Plans</a>
               </div>
            </div>
         </div>
      </section>

      {/* --- 3. IMMERSIVE VISUAL GALLERY (Using Local Assets) --- */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
         <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
               <div>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">European Craftsmanship</h2>
                  <p className="text-lg text-gray-500 font-medium max-w-xl">Every suite features 9ft ceilings, wide-plank flooring, and chef-inspired kitchens wrapped in a stunning Tuscan Revival facade.</p>
               </div>
               <a href="#vip-access" className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition">
                  Download Feature Sheet <ArrowRight size={14}/>
               </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
               {/* Left Big Image - Top Angle Front View */}
               <div className="md:col-span-8 md:row-span-2 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
                  <img 
                    src="/rt-_0001_3-top-angle-front-view-1.jpg" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" 
                    alt="Royal Tuscan Masterpiece Architecture" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-8">
                     <p className="text-amber-400 font-black uppercase tracking-widest text-[10px] mb-1">Architecture</p>
                     <p className="text-white font-black uppercase tracking-widest text-2xl">Tuscan Revival Facade</p>
                  </div>
               </div>
               
               {/* Right Top Image - Right Side View */}
               <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
                  <img 
                    src="/rt-_0000_6-right-side-view-1.jpg" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" 
                    alt="Royal Tuscan Side Profile" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-6">
                     <p className="text-white font-black uppercase tracking-widest text-lg">Steel & Concrete Build</p>
                  </div>
               </div>
               
               {/* Right Middle Image - Left Side View */}
               <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
                  <img 
                    src="/rt-_0002_5-left-side-view-1.jpg" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" 
                    alt="Royal Tuscan Design" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-6">
                     <p className="text-white font-black uppercase tracking-widest text-lg">Exclusive Enclave</p>
                  </div>
               </div>
               
               {/* Bottom Left - Aerial Night View */}
               <div className="md:col-span-6 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
                  <img 
                    src="/rt-_0003_9-arial-night-1.jpg" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" 
                    alt="Royal Tuscan Aerial Night View" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-8">
                     <p className="text-amber-400 font-black uppercase tracking-widest text-[10px] mb-1">St. Catharines</p>
                     <p className="text-white font-black uppercase tracking-widest text-xl">Stunning Nightscapes</p>
                  </div>
               </div>

               {/* Bottom Right - Party Hall */}
               <div className="md:col-span-6 rounded-[2.5rem] overflow-hidden relative group shadow-lg">
                  <img 
                    src="/rt-_0000_Party-Hall.jpg" 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-1000" 
                    alt="Royal Tuscan Party Hall" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex flex-col justify-end p-8">
                     <p className="text-amber-400 font-black uppercase tracking-widest text-[10px] mb-1">Amenities</p>
                     <p className="text-white font-black uppercase tracking-widest text-xl">Boutique Party Hall</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- 4. THE LEAD MAGNET HOOK (BLURRED FLOORPLANS) --- */}
      <section className="py-20 px-6 bg-slate-900 relative overflow-hidden">
         <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="container mx-auto max-w-5xl relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">Official Floor Plans Released</h2>
            <p className="text-gray-400 font-medium mb-12 max-w-2xl mx-auto text-lg">We have the developer's private allocation list. Register below to bypass the public line and view exact suite dimensions and floor premiums.</p>
            
            <a href="#vip-access" className="block relative rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-white/10 bg-slate-800 group cursor-pointer">
               <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-10 flex flex-col items-center justify-center transition group-hover:bg-slate-900/40">
                  <div className="bg-amber-500 text-black w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.5)] group-hover:scale-110 transition duration-500">
                     <Lock size={40} />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Restricted Access</h3>
                  <p className="text-amber-400 font-bold uppercase tracking-widest text-sm bg-black/50 px-6 py-2 rounded-full">Click to Unlock Full Investor Package</p>
               </div>
               {/* Using local site plan / floor plan image */}
               <img 
                 src="/Site-Plan.png" 
                 alt="Royal Tuscan Site Plan" 
                 className="w-full h-[500px] object-cover object-top opacity-30 grayscale" 
               />
            </a>
         </div>
      </section>

      {/* --- 5. THE NIAGARA ADVANTAGE & AMENITIES --- */}
      <section className="py-24 px-6 bg-gray-50 border-b border-gray-200">
         <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-4">The Niagara Advantage</h2>
               <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Why institutional investors and lifestyle buyers are migrating to the Royal Tuscan in St. Catharines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
               <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                     <Hammer size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Steel & Concrete Build</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                     Unlike 90% of low-rise builds that use wood framing, Royal Tuscan uses commercial-grade steel and concrete. Enjoy absolute silence with 1/2" extra thick walls and superior structural integrity.
                  </p>
               </div>
               
               <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                     <Car size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Underground EV Parking</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                     Secure, heated underground parking complete with EV charging stations and dedicated bicycle racks, ensuring your vehicles are safe year-round.
                  </p>
               </div>

               <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition duration-500 group">
                  <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
                     <TreePine size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Courtyard Greenspace</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                     A serene, private garden retreat exclusively for residents, offering a tranquil escape right in the heart of your home.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* --- 6. LOCATION & LIVE GOOGLE MAPS --- */}
      <section className="py-24 px-6 bg-white border-b border-gray-200">
         <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               <div>
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                     <MapPin size={14} /> The Grapeview Hub
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-6 leading-none">
                     Perfectly Positioned.
                  </h2>
                  <p className="text-lg text-gray-600 font-medium mb-8 leading-relaxed">
                     St. Catharines is experiencing a massive economic influx. With the expansion of the GO Train network connecting directly to Toronto, property values at 1024 Vansickle Road North are uniquely positioned for high appreciation.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <Compass size={24} className="text-amber-500 mb-4"/>
                        <p className="font-black text-slate-900 uppercase mb-1">Martindale Pond</p>
                        <p className="text-xs text-gray-500 font-medium">Lush greenery and waterfront trails right in your backyard.</p>
                     </div>
                     <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <Landmark size={24} className="text-amber-500 mb-4"/>
                        <p className="font-black text-slate-900 uppercase mb-1">Ridley College</p>
                        <p className="text-xs text-gray-500 font-medium">Minutes from Canada's most prestigious private boarding school.</p>
                     </div>
                     <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <Wine size={24} className="text-amber-500 mb-4"/>
                        <p className="font-black text-slate-900 uppercase mb-1">Niagara Wineries</p>
                        <p className="text-xs text-gray-500 font-medium">World-class dining, estates, and entertainment down the highway.</p>
                     </div>
                     <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                        <Train size={24} className="text-blue-600 mb-4"/>
                        <p className="font-black text-blue-900 uppercase mb-1">GO Transit Hub</p>
                        <p className="text-xs text-blue-800 font-medium">Direct commuter access connecting Niagara to Downtown Toronto.</p>
                     </div>
                  </div>
               </div>

               {/* REAL GOOGLE MAPS EMBED */}
               <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-gray-100">
                  <iframe 
                     src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2909.123456789!2d-79.2612345!3d43.1512345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDA5JzA0LjQiTiA3OcKwMTUnNDAuNCJX!5e0!3m2!1sen!2sca!4v1610000000000!5m2!1sen!2sca" 
                     width="100%" 
                     height="100%" 
                     style={{ border: 0 }} 
                     allowFullScreen={false} 
                     loading="lazy" 
                     referrerPolicy="no-referrer-when-downgrade"
                     className="absolute inset-0 grayscale hover:grayscale-0 transition duration-1000"
                  ></iframe>
                  
                  {/* Floating Map Label */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md text-slate-900 p-4 rounded-2xl shadow-xl flex items-center gap-4">
                     <div className="bg-amber-500 text-black p-3 rounded-xl"><MapPin size={20}/></div>
                     <div>
                        <p className="font-black uppercase text-sm">Royal Tuscan Residences</p>
                        <p className="text-xs font-bold text-gray-500">1024 Vansickle Rd N, St. Catharines</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- 7. VIP INCENTIVES (THE "WHY NOW") --- */}
      <section className="py-24 px-6 bg-[#FAFAFA]">
         <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16">
               <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Star size={32} className="fill-amber-500 text-amber-500" />
               </div>
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-slate-900">Limited VIP Incentives</h2>
               <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Registering today unlocks tens of thousands of dollars in developer concessions not available to the public.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
                  <Clock className="text-amber-500 mb-6" size={40}/>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Extended Deposits</h3>
                  <p className="text-gray-600 mb-6 font-medium leading-relaxed">Keep your capital liquid longer. Pay your deposit in small, manageable tranches over 18+ months instead of upfront.</p>
               </div>
               <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
                  <Shield className="text-amber-500 mb-6" size={40}/>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Capped Levies</h3>
                  <p className="text-gray-600 mb-6 font-medium leading-relaxed">Protect yourself from closing day surprises. We cap municipal development charges so you know your exact closing costs today.</p>
               </div>
               <div className="bg-white border border-gray-200 shadow-sm hover:shadow-xl transition p-10 rounded-[2.5rem]">
                  <FileText className="text-amber-500 mb-6" size={40}/>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-slate-900">Free Assignment</h3>
                  <p className="text-gray-600 mb-6 font-medium leading-relaxed">Plans change? You have the legal right to sell ("assign") your contract before the building is even finished, maximizing flexibility.</p>
               </div>
            </div>
         </div>
      </section>

      {/* --- 8. AEO FAQ SECTION (VOICE SEARCH OPTIMIZED) --- */}
      <section className="py-24 px-6 bg-slate-900 text-white">
         <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
               <ShieldCheck size={40} className="mx-auto text-amber-500 mb-6" />
               <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">Investor Intelligence</h2>
               <p className="text-gray-400 font-medium text-lg">Direct answers to the most searched questions about Royal Tuscan.</p>
            </div>

            <div className="space-y-4">
               {faqSchema.mainEntity.map((faq, idx) => (
                  <details key={idx} className="group bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/10 transition shadow-sm">
                     <summary className="flex justify-between items-center font-black text-lg text-white list-none uppercase tracking-tight">
                        {faq.name}
                        <span className="text-amber-500 transition group-open:rotate-180"><ChevronDown size={20}/></span>
                     </summary>
                     <p className="text-gray-400 mt-6 leading-relaxed font-medium text-base border-t border-white/10 pt-6">
                        {faq.acceptedAnswer.text}
                     </p>
                  </details>
               ))}
            </div>
         </div>
      </section>

      {/* --- 9. THE ULTIMATE LEAD CAPTURE --- */}
      <section id="vip-access" className="py-32 px-6 bg-white relative">
         <div className="container mx-auto max-w-5xl">
            <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-8 md:p-16 border border-slate-800 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20"></div>
               <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -ml-20 -mb-20"></div>
               
               <div className="relative z-10">
                  <div className="w-20 h-20 bg-amber-500 text-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                     <Lock size={40} />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white leading-none">
                     Unlock The Investor Package.
                  </h2>
                  <p className="text-gray-400 font-medium mb-12 max-w-xl mx-auto text-lg leading-relaxed">
                     Register below for immediate, unrestricted access to the official Royal Tuscan price list, floor plans, and VIP developer incentives.
                  </p>
                  
                  <div className="text-left max-w-lg mx-auto bg-white p-2 rounded-[2.5rem] shadow-2xl border border-gray-100">
                     <LeadForm 
                        type="Pre-Con" 
                        title="VIP Registration" 
                        subtitle="Receive the Royal Tuscan package straight to your inbox." 
                        ctaText="Unlock Floor Plans"
                     />
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- 10. MOBILE STICKY CTA --- */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
         <a 
            href="#vip-access" 
            className="w-full bg-amber-500 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
         >
            Unlock Floor Plans & Prices <ArrowRight size={16}/>
         </a>
      </div>

    </div>
  );
}