import React from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase'; 
import GamifiedContactForm from '@/components/GamifiedContactForm'; // <-- NEW FORM IMPORT
import { 
  ShieldCheck, CheckCircle, Phone, 
  Building2, Users, TrendingDown, Lock, 
  Briefcase, AlertCircle, LayoutGrid, Calculator, 
  Scale, Home
} from 'lucide-react';

// --- SERVER SIDE CONFIG ---
// ISR — 60s revalidate keeps live rates fresh; force-dynamic removed because
// it was silently overriding the revalidate above and forcing SSR on every hit.
export const revalidate = 60;

// --- CONSTANTS ---
const TOP_LENDERS = [
  'TD Bank', 'Scotiabank', 'BMO', 'Meridian', 
  'RFA', 'Desjardins', 'DUCA', 'First National'
];

// --- FETCH LOGIC ---
async function getHeadlineRate() {
  try {
    const docRef = doc(db, 'site_settings', 'mortgage_rates');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.insured_variable_5yr || '3.99'; 
    }
  } catch (e) {
    console.error("Rate fetch error:", e);
  }
  return '3.99'; 
}

export default async function LandingPage() {
  const rate = await getHeadlineRate();

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto font-sans text-slate-900 scroll-smooth">
      
      {/* 1. STICKY LANDING NAV */}
      <nav className="sticky top-0 left-0 w-full px-6 py-4 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
           
           {/* LOGO */}
           <Link href="/" className="flex items-center gap-3 group">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-black group-hover:opacity-80 transition" fill="currentColor">
                 <rect x="10" y="5" width="80" height="18" rx="2" />
                 <rect x="10" y="28" width="38" height="18" rx="2" />
                 <rect x="52" y="28" width="38" height="18" rx="2" />
                 <rect x="10" y="51" width="80" height="18" rx="2" />
                 <rect x="10" y="74" width="38" height="18" rx="2" />
                 <rect x="52" y="74" width="38" height="18" rx="2" />
              </svg>
              <div className="flex flex-col justify-center">
                <span className="text-2xl font-black tracking-tighter text-black uppercase leading-none">INDIBRICK</span>
              </div>
           </Link>

           <div className="flex items-center gap-4 md:gap-8">
              {/* LIVE RATE BADGE */}
              <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full">
                 <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live Insured 5-Yr Var</span>
                 </div>
                 <div className="h-4 w-px bg-gray-300"></div>
                 <span className="text-sm font-black text-blue-600">{rate}%</span>
              </div>

              {/* PHONE */}
              <a href="tel:4372416392" className="flex items-center gap-2 text-slate-900 hover:text-blue-600 transition">
                 <div className="bg-slate-900 text-white p-2 rounded-full hover:bg-blue-600 transition">
                    <Phone size={16} fill="currentColor" />
                 </div>
                 <span className="hidden lg:block text-sm font-bold">(437) 241-6392</span>
              </a>
           </div>
        </div>
      </nav>

      {/* 2. SPLIT SCREEN LAYOUT */}
      <div className="flex flex-col lg:flex-row min-h-screen">
         
         {/* LEFT SIDE: CONTENT SCROLL */}
         <div className="lg:w-3/5 bg-slate-50 relative order-2 lg:order-1">
            <div className="px-6 py-12 lg:p-20 max-w-2xl mx-auto lg:mr-16 lg:ml-auto space-y-16">
               
               {/* HERO */}
               <section>
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full mb-6">
                     <ShieldCheck size={14} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Authorized Wholesale Brokerage</span>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-6 text-slate-900">
                     Banks Have <br/>
                     <span className="text-gray-400 line-through decoration-red-500 decoration-4">Posted Rates.</span><br/>
                     <span className="text-blue-600">We Have Wholesale.</span>
                  </h1>

                  <p className="text-lg text-gray-600 font-medium leading-relaxed mb-8">
                     Stop negotiating with one branch manager. We force <strong>50+ lenders</strong>—including TD, Scotiabank, BMO, Meridian, RFA, Desjardins, DUCA, plus other lenders not available to retail—to compete for your mortgage.
                  </p>

                  {/* MOBILE RATE CARD */}
                  <div className="md:hidden bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingDown size={20} /></div>
                        <div>
                           <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Insured 5-Yr Variable</p>
                           <span className="text-2xl font-black text-slate-900">{rate}%</span>
                        </div>
                     </div>
                     <span className="text-[9px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded">Live Offer</span>
                  </div>
               </section>

               {/* AUTHORITY / LENDERS */}
               <section className="border-t border-gray-200 pt-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                     <Building2 size={14}/> Top Tier Access
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                     {TOP_LENDERS.map(bank => (
                        <div key={bank} className="h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[10px] font-black uppercase text-slate-800 shadow-sm hover:border-blue-300 hover:text-blue-700 transition">
                           {bank}
                        </div>
                     ))}
                  </div>
               </section>

               {/* ALTERNATIVE LENDING SECTION */}
               <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><AlertCircle size={20}/></div>
                     <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Not Qualifying at the Bank?</h3>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed relative z-10">
                     We specialize in <strong>"Story-Based Lending"</strong>. If your credit is bruised or your income is complex (Self-Employed/Business Owner), we have exclusive access to B-Lenders and Private Capital.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                     <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <Briefcase size={18} className="text-slate-400"/>
                        <div>
                           <p className="text-xs font-bold text-slate-900 uppercase">Self-Employed</p>
                           <p className="text-[10px] text-gray-400">Stated Income Programs</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <TrendingDown size={18} className="text-slate-400"/>
                        <div>
                           <p className="text-xs font-bold text-slate-900 uppercase">Low Credit / Beacon</p>
                           <p className="text-[10px] text-gray-400">Flexible Ratios Available</p>
                        </div>
                     </div>
                  </div>
               </section>

               {/* THE "ALL-IN-ONE HUB" TRUST SIGNALS */}
               <section>
                  <div className="flex items-center gap-2 mb-6">
                     <LayoutGrid size={18} className="text-blue-600"/>
                     <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">The Real Estate Ecosystem</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                     We aren't just mortgage brokers. We are an integrated financial hub. Clients get lifetime access to our premium tools and partner network.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     <Link href="/tools" target="_blank" className="group flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition text-center">
                        <Calculator size={20} className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-black">Calculators</span>
                     </Link>
                     <Link href="/trusted-real-estate-lawyers" target="_blank" className="group flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition text-center">
                        <Scale size={20} className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-black">Legal</span>
                     </Link>
                     <Link href="/commercial-auto-home-insurance" target="_blank" className="group flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition text-center">
                        <ShieldCheck size={20} className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-black">Insurance</span>
                     </Link>
                     <Link href="/realtor-network" target="_blank" className="group flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition text-center">
                        <Home size={20} className="text-gray-400 group-hover:text-blue-500 mb-2"/>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-black">Realtor Network</span>
                     </Link>
                  </div>
               </section>

            </div>
         </div>

         {/* RIGHT SIDE: STICKY FORM (Primary Conversion) */}
         <div className="lg:w-2/5 bg-white border-l border-gray-100 relative z-20 shadow-2xl lg:shadow-none order-1 lg:order-2">
            <div className="sticky top-20 h-auto lg:h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
               <div className="p-6 lg:p-12 max-w-lg mx-auto w-full">
                  
                  <div className="lg:hidden mb-6 text-center">
                     <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2 text-slate-900">
                        Stop Overpaying.
                     </h1>
                     <p className="text-sm text-gray-500">Find out your options below.</p>
                  </div>

                  {/* INJECT GAMIFIED FORM */}
                  <GamifiedContactForm />

                  <div className="mt-6 flex items-center justify-center gap-6 text-gray-400 grayscale opacity-70">
                     <div className="flex items-center gap-1.5"><Lock size={12}/><span className="text-[9px] font-bold uppercase tracking-widest">Bank-Grade Security</span></div>
                     <div className="flex items-center gap-1.5"><CheckCircle size={12}/><span className="text-[9px] font-bold uppercase tracking-widest">No Obligation</span></div>
                  </div>

               </div>
            </div>
         </div>

      </div>
    </div>
  );
}