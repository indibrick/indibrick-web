import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Building2, Factory, Store, HardHat, TrendingUp, 
  Briefcase, DollarSign, CheckCircle, ArrowRight, HelpCircle 
} from 'lucide-react';
import JsonLd from '../../components/JsonLd';
import LeadForm from '../../components/LeadForm';

export const metadata: Metadata = {
  title: 'Commercial Mortgages & Business Loans Ontario | Indibrick',
  description: 'Exclusive access to Commercial Lenders, Private Funds, and CSBFL Business Loans. Financing for Multi-Unit Residential, Industrial, Retail, and Construction projects.',
  keywords: ['Commercial Mortgage Broker Ontario', 'Business Loans Toronto', 'Multi-Family Mortgage Rates', 'Construction Financing', 'Small Business Loan Canada', 'Industrial Plaza Mortgage'],
};

export default function CommercialLendingPage() {
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        "name": "What is the minimum down payment for a commercial mortgage?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Typically 25-35%. However, with CMHC MLI Select financing for Multi-Unit Residential properties, we can secure financing with as little as 5% down payment."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer construction financing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We provide land acquisition and construction draws for infill housing, condo developments, and commercial plazas. We can fund up to 75% of the Loan-to-Cost (LTC)."
        }
      }
    ]
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={faqSchema} />

      {/* --- 1. HERO: CAPITAL FOR GROWTH --- */}
      <section className="relative pt-32 pb-24 px-6 bg-slate-900 text-white overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 animate-fade-in-up">
               <Building2 size={14} /> Institutional & Private Funds
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-none">
              Scale Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Empire.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-lg">
              We structure complex capital stacks for Ontario's most ambitious investors. Access <strong>CMHC MLI Select</strong>, Private Bridge Loans, and Business Capital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#apply" className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow-xl">
                 Get Deal Funded <ArrowRight size={14} />
              </a>
              <Link href="/contact" className="bg-transparent border-2 border-white/20 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition">
                 Book Strategy Call
              </Link>
            </div>
          </div>

          {/* Visual: The Deal Types */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition backdrop-blur-md">
                <Building2 size={32} className="text-blue-400 mb-4"/>
                <h3 className="font-bold text-lg mb-1">Multi-Family</h3>
                <p className="text-xs text-gray-400">5+ Units, Apartments, CMHC MLI Select</p>
             </div>
             <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition backdrop-blur-md translate-y-8">
                <Factory size={32} className="text-orange-400 mb-4"/>
                <h3 className="font-bold text-lg mb-1">Industrial</h3>
                <p className="text-xs text-gray-400">Warehousing, Manufacturing, Logistics</p>
             </div>
             <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition backdrop-blur-md">
                <Store size={32} className="text-green-400 mb-4"/>
                <h3 className="font-bold text-lg mb-1">Retail & Office</h3>
                <p className="text-xs text-gray-400">Plazas, Storefronts, Mixed-Use</p>
             </div>
             <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition backdrop-blur-md translate-y-8">
                <HardHat size={32} className="text-yellow-400 mb-4"/>
                <h3 className="font-bold text-lg mb-1">Development</h3>
                <p className="text-xs text-gray-400">Land Assembly, Construction, Infill</p>
             </div>
          </div>
        </div>
      </section>

      {/* --- 2. THE LENDING SUITE --- */}
      <section className="py-24 px-6 bg-white">
         <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">The Capital Stack</h2>
               <p className="text-gray-500 mt-4">We match the lender to the asset class.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               
               {/* 1. CMHC / INSTITUTIONAL */}
               <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-blue-600 group-hover:scale-110 transition">
                     <Building2 size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">CMHC Multi-Res</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                     The "Holy Grail" of investing. Access up to <strong>95% LTV</strong> and 50-year amortizations for energy-efficient apartment buildings.
                  </p>
                  <ul className="space-y-2">
                     <li className="text-xs font-bold text-slate-900 flex items-center gap-2"><CheckCircle size={14} className="text-blue-500"/> Rates from Prime - 0.20%</li>
                     <li className="text-xs font-bold text-slate-900 flex items-center gap-2"><CheckCircle size={14} className="text-blue-500"/> MLI Select Specialist</li>
                  </ul>
               </div>

               {/* 2. BUSINESS LOANS */}
               <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-indigo-600 group-hover:scale-110 transition">
                     <Briefcase size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">Business Lending</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                     Operating lines, equipment financing, and CSBFL (Small Business Loans) up to $1M. Keep your equity; finance the cash flow.
                  </p>
                  <ul className="space-y-2">
                     <li className="text-xs font-bold text-slate-900 flex items-center gap-2"><CheckCircle size={14} className="text-indigo-500"/> Unsecured Options Available</li>
                     <li className="text-xs font-bold text-slate-900 flex items-center gap-2"><CheckCircle size={14} className="text-indigo-500"/> 48-Hour Approval</li>
                  </ul>
               </div>

               {/* 3. PRIVATE BRIDGE */}
               <div className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:shadow-xl transition group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 text-slate-900 group-hover:scale-110 transition">
                     <DollarSign size={28} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">Private Bridge</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                     Fast, flexible capital for acquisitions, flips, or stabilizing a property before refinancing to an "A" lender.
                  </p>
                  <ul className="space-y-2">
                     <li className="text-xs font-bold text-slate-900 flex items-center gap-2"><CheckCircle size={14} className="text-slate-900"/> Interest Only Payments</li>
                     <li className="text-xs font-bold text-slate-900 flex items-center gap-2"><CheckCircle size={14} className="text-slate-900"/> No Income Docs Required</li>
                  </ul>
               </div>

            </div>
         </div>
      </section>

      {/* --- 3. AEO FAQ (VOICE SEARCH) --- */}
      <section className="py-20 px-6 bg-white border-y border-gray-100">
         <div className="container mx-auto max-w-4xl">
             <div className="flex items-center gap-3 mb-10 justify-center">
               <HelpCircle size={28} className="text-slate-900"/>
               <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Commercial Intelligence</h2>
            </div>
            <div className="space-y-4">
               <details className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer">
                  <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none text-slate-900">
                     What is the minimum down payment?
                     <span className="transition group-open:rotate-180 text-gray-400">▼</span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                     For standard commercial properties (retail, industrial), banks typically require <strong>25% to 35% down</strong>. However, for Owner-Occupied businesses, we can sometimes secure up to 100% financing via the CSBFL program (for leasehold/equipment) or 90% for property. Multi-Residential can go as low as 5% with CMHC.
                  </p>
               </details>
               <details className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer">
                  <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none text-slate-900">
                     How are commercial rates calculated?
                     <span className="transition group-open:rotate-180 text-gray-400">▼</span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                     Commercial rates are not posted like residential rates. They are risk-based. The rate depends on the "Strength of the Sponsor" (You), the "Debt Service Coverage Ratio" (The Property's Income), and the Asset Class. Currently, rates range from Prime + 0% to Prime + 2%.
                  </p>
               </details>
               <details className="group bg-gray-50 p-6 rounded-2xl border border-gray-100 cursor-pointer">
                  <summary className="flex justify-between items-center font-bold text-sm uppercase tracking-wide list-none text-slate-900">
                     Can I buy a business with no money down?
                     <span className="transition group-open:rotate-180 text-gray-400">▼</span>
                  </summary>
                  <p className="text-gray-500 mt-4 leading-relaxed text-sm">
                     It is rare, but possible using <strong>Vendor Take Back (VTB)</strong> mortgages. If the seller agrees to lend you a portion of the purchase price (e.g., 20%), and we finance the rest, you can significantly reduce your cash injection.
                  </p>
               </details>
            </div>
         </div>
      </section>

      {/* --- 4. LEAD FORM --- */}
      <section id="apply" className="py-24 px-6 bg-slate-50">
         <div className="container mx-auto max-w-5xl">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-200 grid md:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-6 text-slate-900 leading-none">
                     Submit Your <br/> Deal.
                  </h2>
                  <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                     Our commercial underwriters review deals within 4 hours. No obligation. We will tell you exactly what leverage is available.
                  </p>
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-900">
                     <Briefcase size={20}/>
                     <span>Brokerage Fees: Typically 1% - 3% (Disclosed Upfront)</span>
                  </div>
               </div>

               <LeadForm type="Commercial Lending" title="Request Term Sheet" subtitle="Confidential Review." />
            </div>
         </div>
      </section>

    </div>
  );
}