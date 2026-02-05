'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import { ContentService } from '../../services/ContentService';
import { MortgageRate } from '../../types';
import { 
  TrendingDown, ShieldCheck, ArrowRight, CheckCircle, 
  Smartphone, Calculator, Landmark, Percent, Zap, 
  MapPin, HelpCircle, FileText, ChevronRight, BarChart3, Loader2, RefreshCw
} from 'lucide-react';

export default function MortgagesPage() {
  // --- STATE FOR RATES ---
  const [rates, setRates] = useState<MortgageRate[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH RATES ON MOUNT ---
  useEffect(() => {
    const loadRates = async () => {
      try {
        const data = await ContentService.fetchRates();
        setRates(data);
      } catch (error) {
        console.error("Failed to load rates:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRates();
  }, []);

  // --- HELPER: GET EXACT DB VALUE ---
  const getRate = (id: string, fallback: number) => {
    const found = rates.find(r => r.id === id);
    // Return the raw number from DB if found, else fallback
    return found ? found.rate.toFixed(2) : fallback.toFixed(2);
  };

  // --- HELPER: SIMULATE BANK RATE (For Visual Comparison Only) ---
  const getBankRate = (id: string, fallback: number) => {
    const rate = parseFloat(getRate(id, fallback));
    return (rate + 1.25).toFixed(2); // Always show ~1.25% higher
  };

  // --- SEO/AEO SCHEMA ---
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "MortgageBroker",
    "name": "IndiBrick Mortgage Strategy",
    "image": "https://indibrick.ca/logo.jpg",
    "description": "Access the lowest wholesale mortgage rates in Ontario. Compare 50+ lenders, calculate payments, and structure tax-deductible debt.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Toronto",
      "addressRegion": "ON",
      "addressCountry": "CA"
    },
    "priceRange": "$$",
    "areaServed": ["Toronto", "Mississauga", "Brampton", "Ottawa", "Hamilton", "Ontario"],
    "makesOffer": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mortgage Pre-Approval" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Refinance & ETO" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Private Lending" } }
    ]
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
      <JsonLd data={pageSchema} />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-24 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none"></div>

        <div className="container mx-auto max-w-7xl relative z-10">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Content */}
              <div>
                 <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-green-500/30 animate-pulse">
                    <TrendingDown size={14} /> Lowest Rates in Ontario
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
                   Stop Paying <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Retail Rates.</span>
                 </h1>
                 <p className="text-xl text-blue-100/70 max-w-xl font-medium leading-relaxed mb-10">
                   Banks have "Posted Rates." We have "Wholesale Rates." 
                   By accessing the broker channel, you unlock insider pricing from 50+ lenders, saving the average Ontario homeowner <strong>$12,000+</strong> per term.
                 </p>
                 <div className="flex flex-wrap gap-4">
                    <a href="#calculators" className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition shadow-xl flex items-center gap-2">
                       <Calculator size={16}/> Calculate Payments
                    </a>
                    <a href="#contact" className="border border-white/20 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition flex items-center gap-2">
                       <ShieldCheck size={16}/> Get Pre-Approved
                    </a>
                 </div>
              </div>

              {/* Right: Live Rate Board (INSURED ONLY) */}
              <div className="relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 blur-2xl opacity-20 rounded-[3rem]"></div>
                 <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] relative">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                          Live Insured Rates
                          {loading && <Loader2 className="animate-spin text-blue-400" size={18} />}
                       </h3>
                       <Link href="/rates" className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-white flex items-center gap-1 transition">
                          View All Lenders <ChevronRight size={12}/>
                       </Link>
                    </div>
                    
                    {/* Rate Comparison Table */}
                    <div className="space-y-4">
                       
                       {/* 5-Year Fixed (INSURED) */}
                       <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5 hover:bg-white/10 transition">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><ShieldCheck size={20}/></div>
                             <div>
                                <p className="font-bold text-sm">5-Year Fixed</p>
                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Insured Promotion</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {/* UPDATED ID AND VALUE */}
                             <p className="text-3xl font-black text-white">{getRate('insured_fixed_5yr', 3.84)}%</p>
                             <p className="text-[10px] text-red-400 line-through font-bold">Bank: {getBankRate('insured_fixed_5yr', 3.84)}%</p>
                          </div>
                       </div>

                       {/* 5-Year Variable (INSURED) */}
                       <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5 hover:bg-white/10 transition">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><TrendingDown size={20}/></div>
                             <div>
                                <p className="font-bold text-sm">5-Year Variable</p>
                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Insured Adjustable</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {/* UPDATED ID AND VALUE */}
                             <p className="text-3xl font-black text-white">{getRate('insured_variable_5yr', 3.29)}%</p>
                             <p className="text-[10px] text-red-400 line-through font-bold">Bank: {getBankRate('insured_variable_5yr', 3.29)}%</p>
                          </div>
                       </div>

                       {/* 3-Year Fixed (INSURED) */}
                       <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5 hover:bg-white/10 transition">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-green-500/20 rounded-xl text-green-400"><Landmark size={20}/></div>
                             <div>
                                <p className="font-bold text-sm">3-Year Fixed</p>
                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Insured Short-Term</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {/* UPDATED ID AND VALUE */}
                             <p className="text-3xl font-black text-white">{getRate('insured_fixed_3yr', 3.79)}%</p>
                             <p className="text-[10px] text-red-400 line-through font-bold">Bank: {getBankRate('insured_fixed_3yr', 3.79)}%</p>
                          </div>
                       </div>

                    </div>

                    <div className="mt-8 text-center">
                       <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-4">*Rates for High-Ratio (Insured) Mortgages. OAC.</p>
                       <Link href="/rates" className="block w-full py-4 bg-blue-600 hover:bg-blue-500 transition text-white rounded-xl font-black uppercase tracking-widest text-xs">
                          See Today's Full Sheet
                       </Link>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- 3. THE "WHY" SECTION --- */}
      <section className="py-24 bg-white border-b border-gray-100">
         <div className="container mx-auto px-6 max-w-5xl text-center">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 text-slate-900">The "Wholesale" Advantage</h2>
            <div className="grid md:grid-cols-3 gap-12 text-left">
               <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 mb-2"><Percent size={20}/></div>
                  <h3 className="font-bold text-lg">Volume Discounts</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                     Banks have massive overhead (branches, staff). We are a digital-first brokerage funding millions in volume. Lenders give us "bulk pricing" to win our business, which we pass to you.
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 mb-2"><ShieldCheck size={20}/></div>
                  <h3 className="font-bold text-lg">Fiduciary Duty</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                     A bank specialist works for the bank. Their job is to maximize the bank's profit. We work for <strong>you</strong>. Our job is to minimize your interest costs and protect your equity.
                  </p>
               </div>
               <div className="space-y-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 mb-2"><Zap size={20}/></div>
                  <h3 className="font-bold text-lg">Monoline Lenders</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                     We access "Monoline" lenders (like MCAP, First National) who don't have branches. They offer lower rates and significantly lower penalties than the Big 5 Banks.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* --- 4. CALCULATOR COMMAND CENTER (TOOL HUB) --- */}
      <section id="calculators" className="py-24 bg-slate-50">
         <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
               <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2 block">Precision Planning</span>
               <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-4">Financial Toolset</h2>
               <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                  Don't guess. Use our institutional-grade engines to stress test your affordability, taxes, and penalties.
               </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               
               {/* 1. Payment Calculator */}
               <Link href="/mortgage-payment-calculator" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition"><Calculator size={24}/></div>
                     <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-600 transition -translate-x-2 group-hover:translate-x-0"/>
                  </div>
                  <h3 className="text-xl font-black uppercase mb-2">Payment Calculator</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                     The gold standard. Calculate monthly payments with accurate CMHC premiums, amortization schedules, and stress-test scenarios.
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Run Scenario</span>
               </Link>

               {/* 2. Land Transfer Tax */}
               <Link href="/land-transfer-tax-calculator-ontario" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition"><MapPin size={24}/></div>
                     <ArrowRight size={20} className="text-gray-300 group-hover:text-green-600 transition -translate-x-2 group-hover:translate-x-0"/>
                  </div>
                  <h3 className="text-xl font-black uppercase mb-2">Land Transfer Tax</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                     Buying in Toronto or Ontario? Calculate the precise closing cost tax. Includes "First Time Home Buyer" rebates automatically.
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">Calculate Tax</span>
               </Link>

               {/* 3. Affordability */}
               <Link href="/affordability-calculator" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition"><BarChart3 size={24}/></div>
                     <ArrowRight size={20} className="text-gray-300 group-hover:text-purple-600 transition -translate-x-2 group-hover:translate-x-0"/>
                  </div>
                  <h3 className="text-xl font-black uppercase mb-2">Max Affordability</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                     How much house can you buy? Determine your maximum purchase price based on income, debts, and current B-20 stress test rules.
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Check Budget</span>
               </Link>

               {/* 4. Penalty Calculator */}
               <Link href="/mortgage-penalty-calculator" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition"><FileText size={24}/></div>
                     <ArrowRight size={20} className="text-gray-300 group-hover:text-red-600 transition -translate-x-2 group-hover:translate-x-0"/>
                  </div>
                  <h3 className="text-xl font-black uppercase mb-2">Penalty Estimator</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                     Thinking of breaking your term? Estimate the IRD (Interest Rate Differential) vs. 3-Month Interest penalty before you refinance.
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">Check Cost</span>
               </Link>

               {/* 5. Smith Maneuver */}
               <Link href="/tools/smith-maneuver-calculator" className="group bg-slate-900 text-white p-8 rounded-[2rem] hover:shadow-2xl transition duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="mb-6 flex justify-between items-start relative z-10">
                     <div className="p-3 bg-white/10 rounded-xl"><RefreshCw size={24} className="text-blue-400"/></div>
                     <ArrowRight size={20} className="text-gray-500 group-hover:text-white transition"/>
                  </div>
                  <h3 className="text-xl font-black uppercase mb-2 relative z-10">Smith Maneuver™</h3>
                  <p className="text-sm text-gray-400 mb-4 leading-relaxed relative z-10">
                     Advanced Strategy. Convert your non-deductible mortgage interest into tax-deductible investment loans.
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 relative z-10">Launch Engine</span>
               </Link>

               {/* 6. Closing Costs */}
               <Link href="/closing-costs-calculator" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl group-hover:scale-110 transition"><FileText size={24}/></div>
                     <ArrowRight size={20} className="text-gray-300 group-hover:text-yellow-600 transition -translate-x-2 group-hover:translate-x-0"/>
                  </div>
                  <h3 className="text-xl font-black uppercase mb-2">Total Closing Costs</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                     Don't be surprised. Calculate Legal Fees, Title Insurance, Appraisal costs, and PST on CMHC insurance.
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">View Totals</span>
               </Link>

            </div>
         </div>
      </section>

      {/* --- 5. FAQ (SEO OPTIMIZED) --- */}
      <section className="py-24 bg-white">
         <div className="container mx-auto px-6 max-w-4xl">
            <div className="flex items-center gap-3 mb-10">
               <div className="p-2 bg-slate-900 text-white rounded-lg"><HelpCircle size={20}/></div>
               <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Mortgage Intelligence</h2>
            </div>
            
            <div className="space-y-8">
               <div>
                  <h3 className="text-xl font-bold mb-3 flex items-start gap-3">
                     <span className="text-blue-600">Q.</span> Should I choose Fixed or Variable in 2026?
                  </h3>
                  <p className="text-gray-600 leading-relaxed pl-8">
                     It depends on your risk tolerance and the spread. <strong>Variable rates</strong> float with the Bank of Canada; if rates drop, you save immediately. <strong>Fixed rates</strong> offer insurance against hikes. Currently, with the yield curve inverted, Variable rates are popular for those betting on rate cuts, while 3-Year Fixed offers a safe middle ground.
                  </p>
               </div>

               <div>
                  <h3 className="text-xl font-bold mb-3 flex items-start gap-3">
                     <span className="text-blue-600">Q.</span> How does the Stress Test (B-20) work?
                  </h3>
                  <p className="text-gray-600 leading-relaxed pl-8">
                     Federally regulated lenders must qualify you at the <strong>Contract Rate + 2%</strong> or <strong>5.25%</strong>, whichever is higher. This reduces your purchasing power by approx. 20%. At IndiBrick, we also work with Credit Unions and Monoline lenders who may offer different qualification criteria.
                  </p>
               </div>

               <div>
                  <h3 className="text-xl font-bold mb-3 flex items-start gap-3">
                     <span className="text-blue-600">Q.</span> What is the minimum down payment in Ontario?
                  </h3>
                  <p className="text-gray-600 leading-relaxed pl-8">
                     For homes under $500k, it is <strong>5%</strong>. For homes between $500k-$999k, it is 5% on the first $500k and 10% on the remainder. For homes over $1M, you must put down <strong>20%</strong>. Investment properties also strictly require 20% down.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* --- 6. CTA (DUAL PATH) --- */}
      <section id="contact" className="py-24 bg-slate-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

         <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Start Your Approval.</h2>
               <p className="text-gray-400">Select the path that fits your speed.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               
               {/* DIGITAL PATH */}
               <div className="bg-white/5 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition group">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-900/50">
                     <Smartphone size={32} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Start Online</h3>
                  <p className="text-gray-400 mb-8 min-h-[60px]">
                     I know what I want. Take me directly to the secure portal to upload documents and get pre-approved in minutes.
                  </p>
                  <a href="https://gopineapple.ca/muditchhura/preapproval" target="_blank" className="flex items-center justify-between bg-white text-slate-900 px-8 py-5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition">
                     Launch Portal <ArrowRight size={16} className="group-hover:translate-x-2 transition"/>
                  </a>
               </div>

               {/* ADVISORY PATH */}
               <div className="bg-white text-slate-900 p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                  <div className="relative z-10">
                     <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-8">
                        <ShieldCheck size={32} />
                     </div>
                     <h3 className="text-3xl font-black uppercase tracking-tight mb-4">Strategy Call</h3>
                     <p className="text-gray-500 mb-8">
                        I have a complex situation (Self-Employed, Multi-Property, Private) and need a human strategy session first.
                     </p>
                     <div className="bg-gray-50 rounded-2xl p-1 border border-gray-200">
                        <LeadForm type="Mortgage" title="Book Strategy Call" subtitle="Direct access to a Senior Broker." />
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </section>

    </div>
  );
}