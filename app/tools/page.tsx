import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  Calculator, DollarSign, Wallet, Shield, Lock, 
  ArrowRight, PieChart, Landmark, Building2, Percent, 
  RefreshCw, TrendingUp, MapPin, AlertTriangle, Sun
 } 
  from 'lucide-react';
import JsonLd from '../../components/JsonLd';

export const metadata: Metadata = {
  title: 'Financial Tools Hub | 10+ Canadian Mortgage & Wealth Calculators',
  description: 'The most comprehensive financial toolkit for Ontario homeowners. Calculate mortgage payments, land transfer tax, trigger rates, and mortgage penalties.',
  keywords: ['Mortgage Calculator Ontario', 'Land Transfer Tax Calculator', 'Trigger Rate Calculator', 'Mortgage Penalty Calculator', 'Universal Life Calculator'],
};

export default function ToolsPage() {
  // AEO Schema
  const toolsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "IndiBrick Financial Tools",
    "description": "A suite of 11 professional financial calculators for Canadian real estate and wealth planning.",
    "hasPart": [
      { "@type": "SoftwareApplication", "name": "Mortgage Payment Calculator", "url": "https://indibrick.ca/mortgage-payment-calculator" },
      { "@type": "SoftwareApplication", "name": "Reverse Mortgage Calculator", "url": "https://indibrick.ca/reverse-mortgage-calculator" },
      { "@type": "SoftwareApplication", "name": "Mortgage Penalty Calculator", "url": "https://indibrick.ca/mortgage-penalty-calculator" },
      { "@type": "SoftwareApplication", "name": "Land Transfer Tax Calculator", "url": "https://indibrick.ca/land-transfer-tax-calculator-ontario" }
    ]
  };

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <JsonLd data={toolsSchema} />

      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* HERO SECTION */}
        <div className="text-center mb-24">
          <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block border border-gray-200">
            Professional Grade
          </span>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-slate-900">
            Financial<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black">Engineering.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium leading-relaxed">
            Don't guess with your wealth. Use our institutional-grade engines to model your mortgage costs, penalties, and tax-exempt investment strategies.
          </p>
        </div>

        {/* --- SECTION 1: REAL ESTATE & LENDING --- */}
        <div className="mb-24">
           <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl"><Building2 size={24}/></div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Real Estate & Mortgages</h2>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Acquisition & Debt Strategy</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* 1. Reverse Mortgage (NEW - High Priority) */}
              <Link href="/reverse-mortgage-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full relative overflow-hidden">
                 <div className="absolute top-6 right-6 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                    Popular
                 </div>
                 <div className="mb-6 flex justify-between items-start">
                    <Sun size={32} className="text-orange-500 group-hover:text-black transition" />
                 </div>
                 <h3 className="text-xl font-black uppercase mb-2">Reverse Mortgage (55+)</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Calculate your tax-free equity release. No monthly payments required. Safe & regulated.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 2. Mortgage Payment */}
              <Link href="/mortgage-payment-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6 flex justify-between items-start">
                    <Calculator size={32} className="text-blue-600 group-hover:text-black transition" />
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Essential</span>
                 </div>
                 <h3 className="text-xl font-black uppercase mb-2">Mortgage Payment</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">The gold standard. Calculate monthly payments with accurate CMHC premiums and stress-test analysis.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>
              {/* Smith Maneuver (NEW) */}
              <Link href="/tools/smith-maneuver-calculator" className="group bg-slate-900 text-white rounded-[2rem] p-8 hover:shadow-2xl transition duration-300 flex flex-col h-full relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                 <div className="mb-6 flex justify-between items-start relative z-10">
                    <RefreshCw size={32} className="text-blue-400 group-hover:text-white transition" />
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">Tax Strategy</span>
                 </div>
                 <h3 className="text-xl font-black uppercase mb-2 relative z-10">Smith Maneuver™</h3>
                 <p className="text-sm text-gray-400 mb-8 leading-relaxed relative z-10">Turn your mortgage interest into a tax deduction. Model the transformation of Bad Debt to Good Debt.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 group-hover:gap-4 transition-all">
                    Launch Engine <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 3. Affordability */}
              <Link href="/affordability-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6"><Wallet size={32} className="text-blue-600 group-hover:text-black transition" /></div>
                 <h3 className="text-xl font-black uppercase mb-2">Affordability</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Determine your maximum purchase price based on income, debts, and current stress-test rules.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 4. Mortgage Penalty */}
              <Link href="/mortgage-penalty-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6 flex justify-between items-start">
                    <AlertTriangle size={32} className="text-red-500 group-hover:text-black transition" />
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Update</span>
                 </div>
                 <h3 className="text-xl font-black uppercase mb-2">Penalty Estimator</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Don't break blindly. Calculate IRD vs 3-Month Interest penalties instantly before you refinance.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 5. Land Transfer Tax */}
              <Link href="/land-transfer-tax-calculator-ontario" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6"><MapPin size={32} className="text-blue-600 group-hover:text-black transition" /></div>
                 <h3 className="text-xl font-black uppercase mb-2">Land Transfer Tax</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Calculate Ontario and Toronto LTT. Automatically applies First-Time Home Buyer rebates.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>
              
              {/* HST Rebate Calculator (NEW) */}
              <Link href="/hst-rebate-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full relative overflow-hidden">
                 <div className="absolute top-6 right-6 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                    New Builder
                 </div>
                 <div className="mb-6 flex justify-between items-start">
                    <Building2 size={32} className="text-blue-600 group-hover:text-black transition" />
                 </div>
                 <h3 className="text-xl font-black uppercase mb-2">HST Rebate Calculator</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Calculate exact New Build & NRRP investor rebates in Ontario. Avoid closing day surprises.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 6. Closing Costs */}
              <Link href="/closing-costs-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6"><DollarSign size={32} className="text-blue-600 group-hover:text-black transition" /></div>
                 <h3 className="text-xl font-black uppercase mb-2">Closing Costs</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Estimate total cash to close, including Legal Fees, Title Insurance, and the hidden PST on CMHC.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 7. Down Payment */}
              <Link href="/down-payment-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6"><PieChart size={32} className="text-blue-600 group-hover:text-black transition" /></div>
                 <h3 className="text-xl font-black uppercase mb-2">Down Payment</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Calculate minimum requirements (5% vs 20%) and visualize the impact on your monthly payment.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 8. Renewal Estimator */}
              <Link href="/mortgage-renewal-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6"><RefreshCw size={32} className="text-blue-600 group-hover:text-black transition" /></div>
                 <h3 className="text-xl font-black uppercase mb-2">Renewal Estimator</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Compare your bank's renewal offer against market rates. See how much switching could save you.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 9. Refinance / Equity */}
              <Link href="/refinance-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6"><TrendingUp size={32} className="text-blue-600 group-hover:text-black transition" /></div>
                 <h3 className="text-xl font-black uppercase mb-2">Refinance / Equity</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">Calculate savings by consolidating high-interest debt (credit cards) into your mortgage.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

              {/* 10. Trigger Rate */}
              <Link href="/trigger-rate-calculator" className="group bg-white rounded-[2rem] p-8 border border-gray-100 hover:border-black hover:shadow-2xl transition duration-300 flex flex-col h-full">
                 <div className="mb-6"><Percent size={32} className="text-red-500 group-hover:text-black transition" /></div>
                 <h3 className="text-xl font-black uppercase mb-2">Trigger Rate</h3>
                 <p className="text-sm text-gray-500 mb-8 leading-relaxed">For Variable Rate holders. Find the exact interest rate where your payment stops covering principal.</p>
                 <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                    Launch Tool <ArrowRight size={14}/>
                 </div>
              </Link>

           </div>
        </div>


        {/* --- SECTION 2: WEALTH & INSURANCE --- */}
        <div>
           <div className="flex items-center gap-4 mb-10 border-b border-gray-100 pb-6">
              <div className="p-3 bg-green-50 text-green-700 rounded-xl"><Landmark size={24}/></div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Wealth Strategy</h2>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Tax-Exempt Planning</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* 11. Universal Life */}
              <Link href="/tools/universal-life-calculator" className="group bg-gray-900 text-white rounded-[2.5rem] p-10 overflow-hidden hover:shadow-2xl transition duration-500 relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/30 transition duration-500"></div>
                 <div className="relative z-10 h-full flex flex-col">
                    <div className="mb-8"><Lock size={40} className="text-green-400" /></div>
                    <h3 className="text-3xl font-black uppercase mb-2">Universal Life</h3>
                    <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 w-fit">Corporate Strategy</div>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                       Model the "Corporate Insured Annuity". Calculate how to grow retained earnings tax-exempt and transfer them to your estate tax-free.
                    </p>
                    <span className="mt-auto flex items-center gap-2 font-bold text-green-400 uppercase tracking-widest text-xs group-hover:gap-4 transition-all">
                       Open Model <ArrowRight size={16}/>
                    </span>
                 </div>
              </Link>

              {/* 12. Segregated Funds */}
              <Link href="/tools/segregated-fund-calculator" className="group bg-green-50 rounded-[2.5rem] p-10 border border-green-100 hover:border-green-300 hover:shadow-xl transition duration-300 flex flex-col h-full">
                 <div className="mb-8"><Shield size={40} className="text-green-600" /></div>
                 <h3 className="text-3xl font-black uppercase mb-2 text-green-900">Estate Savings</h3>
                 <div className="inline-block bg-green-200 text-green-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 w-fit">Probate Bypass</div>
                 <p className="text-green-800/70 mb-8 leading-relaxed font-medium">
                    See exactly how much your estate saves by bypassing the 1.5% Probate Tax. Compare Mutual Fund returns vs. Segregated Fund guarantees.
                 </p>
                 <span className="mt-auto flex items-center gap-2 font-bold text-green-700 uppercase tracking-widest text-xs group-hover:gap-4 transition-all">
                    Open Model <ArrowRight size={16}/>
                 </span>
              </Link>

           </div>
        </div>

        {/* SEO CONTENT BLOCK (AEO) */}
        <div className="mt-32 pt-16 border-t border-gray-100 text-center max-w-4xl mx-auto">
           <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Why Accuracy Matters</h2>
           <p className="text-gray-500 leading-relaxed mb-8">
              Most online calculators use simple U.S. formulas. In Canada, mortgages compound semi-annually, not monthly. 
              Using a U.S. calculator can skew your payments by hundreds of dollars per year. 
              The <strong>IndiBrick Engine</strong> is built specifically for the Canadian <em>Interest Act</em>, ensuring your numbers match what you see on your official commitment letter.
           </p>
        </div>

      </div>
    </div>
  );
}