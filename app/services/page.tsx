import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { 
  TrendingUp, Map, Shield, Hammer, BarChart3, Scale, 
  ArrowRight, Layers, CheckCircle, BrainCircuit, XCircle, Sun, Factory, Users 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Real Estate Ecosystem | Mortgage, Insurance, Renovation & Wealth',
  description: 'IndiBrick is the first fully integrated Real Estate Operating System in Ontario. We consolidate Mortgages, Realty, Insurance, Renovations, and Legal into one efficient platform.',
  keywords: ['Integrated Real Estate Services', 'One Stop Shop Real Estate Toronto', 'Mortgage and Renovation Bundle', 'Real Estate Asset Management', 'IndiBrick Ecosystem'],
};

export default function ServicesPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Real Estate Ecosystem",
    "provider": {
      "@type": "Organization",
      "name": "IndiBrick Financial"
    },
    "areaServed": "Ontario"
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={serviceSchema} />

      {/* --- HERO --- */}
      <section className="pt-32 pb-20 px-6 border-b border-gray-100 bg-slate-50/50">
        <div className="container mx-auto max-w-6xl text-center">
           <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-4 block animate-fade-in-up">The Old Model is Broken</span>
           <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">
             Fragmentation is <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Expensive.</span>
           </h1>
           <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium leading-relaxed mb-12">
             Most investors lose thousands in "friction costs" by coordinating between a Realtor, a Broker, an Insurer, and a Contractor who don't talk to each other. 
             <strong className="text-slate-900 block mt-2">We built the Operating System that connects them all.</strong>
           </p>
        </div>
      </section>

      {/* --- THE GRID --- */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              
              {/* 1. FINANCE */}
              <Link href="/rates" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-blue-200 transition duration-500 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
                       <TrendingUp size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Finance</h3>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Wholesale Mortgages</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Access rates up to 0.40% lower than the banks. Includes Private & Second Mortgages.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-blue-600 transition-all">
                       Check Rates <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

              {/* 2. ACQUIRE */}
              <Link href="/city-data" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-green-200 transition duration-500 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-gray-300">
                       <Map size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Acquire</h3>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-4">AI Market Data</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Find "Alpha" markets. Analysis of 100+ cities for appreciation and cash flow.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-green-600 transition-all">
                       Explore Data <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

              {/* 3. PARTNER (REALTOR NETWORK) - NEW */}
              <Link href="/realtor-network" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-black transition duration-500 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-gray-400">
                       <Users size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Partner</h3>
                    <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-4">Realtor Network</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Buy or sell with confidence. We match you with top-tier local agents who understand investment strategy.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-black transition-all">
                       Find Agent <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

              {/* 4. ENTERPRISE (COMMERCIAL) */}
              <Link href="/commercial-lending" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-indigo-200 transition duration-500 relative overflow-hidden">
                 <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">New</div>
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                       <Factory size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Enterprise</h3>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-4">Commercial Lending</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Multi-Res, Industrial, and Business Loans. Institutional & Private Funds.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-indigo-600 transition-all">
                       Capital Stack <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

              {/* 5. PROTECT */}
              <Link href="/commercial-auto-home-insurance" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-cyan-200 transition duration-500 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-cyan-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-200">
                       <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Protect</h3>
                    <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest mb-4">Insurance Bundles</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Link your mortgage and insurance to unlock volume discounts on Home & Auto.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-cyan-600 transition-all">
                       Get Quote <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

              {/* 6. RETIRE (REVERSE) */}
              <Link href="/reverse-mortgages" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-orange-200 transition duration-500 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-200">
                       <Sun size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Retire</h3>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4">Reverse Mortgage</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Unlock 55% of home equity tax-free. No monthly payments required. (55+)
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-orange-600 transition-all">
                       Calculate <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

              {/* 7. IMPROVE */}
              <Link href="/renovation-contractors" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-yellow-200 transition duration-500 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-yellow-500 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-200">
                       <Hammer size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Improve</h3>
                    <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-4">Value-Add Reno</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Contractors for legal basements and flips, focused on Appraisal Lift.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-yellow-600 transition-all">
                       Find Contractor <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

              {/* 8. GROW */}
              <Link href="/investment-planning-wealth-growth" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-purple-200 transition duration-500 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200">
                       <BarChart3 size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Grow</h3>
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-4">Wealth Strategy</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Structure liquid wealth using Segregated Funds and Tax-Exempt Insurance.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-purple-600 transition-all">
                       Build Wealth <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

              {/* 9. CLOSE */}
              <Link href="/trusted-real-estate-lawyers" className="group bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-red-200 transition duration-500 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-red-200">
                       <Scale size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Close</h3>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-4">Legal Support</p>
                    <p className="text-gray-500 text-xs leading-relaxed mb-6">
                       Partner lawyers for Purchase, Refinance, and Title Transfer.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-transparent group-hover:border-red-600 transition-all">
                       Find Lawyer <ArrowRight size={12}/>
                    </span>
                 </div>
              </Link>

           </div>
        </div>
      </section>

    </div>
  );
}