'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LeadForm from '../../components/LeadForm';
import AIIntakeForm from '../../components/AIIntakeForm';
import JsonLd from '../../components/JsonLd';
import { 
  TrendingDown, ShieldCheck, ArrowRight, CheckCircle, 
  Smartphone, Calculator, Landmark, Percent, Zap, 
  MapPin, HelpCircle, FileText, ChevronDown, BarChart3, 
  Loader2, RefreshCw, Home, Building2, Briefcase, Shield, Activity, Users, Scale, ChevronRight, Banknote
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path if necessary

// --- DEFAULT RATES (Used while Firebase loads) ---
const DEFAULT_RATES = {
  insured_5yr_fixed: '4.09',
  insured_5yr_variable: '4.85',
  insured_3yr_fixed: '4.49',
  insurable_under_65_5yr_fixed: '4.34',
  lastUpdated: 'Today'
};

// --- MASSIVE AEO / SEO FAQ DATABASE (35+ Questions) ---
const MORTGAGE_FAQS = [
  {
    category: "General & Qualification",
    questions: [
      { q: "What is the difference between a Mortgage Broker and a Bank?", a: "A bank specialist works for the bank and can only offer their specific retail products at their posted rates. A mortgage agent works for you. Our partnered Pineapple Financial agents have fiduciary access to over 50+ lenders (including top banks, credit unions, and monoline lenders) to secure wholesale pricing and unbiased terms." },
      { q: "How does the B-20 Stress Test work in Canada?", a: "Federally regulated lenders must qualify you at a rate higher than your actual contract rate to ensure you can handle future rate hikes. Currently, you must qualify at your contract rate plus 2.0%, or 5.25%, whichever is higher." },
      { q: "What is a Monoline Lender?", a: "Monoline lenders are financial institutions that solely focus on mortgages. They don't have retail branches, which means they have vastly lower overhead. They pass these savings on through lower interest rates and significantly fairer penalty calculations compared to the Big 5 banks." },
      { q: "What is the minimum down payment required in Ontario?", a: "For homes under $500,000, the minimum is 5%. For homes between $500,000 and $999,999, it is 5% on the first $500k and 10% on the remainder. For homes $1 Million and over, a strict 20% down payment is required." },
      { q: "What is CMHC Insurance and when do I pay it?", a: "CMHC (or Sagen/Canada Guaranty) is default insurance required by law if your down payment is less than 20%. The premium is calculated as a percentage of your loan (usually 2.8% to 4.0%) and is added directly to your mortgage balance." },
      { q: "How much are closing costs in Ontario?", a: "A safe estimate is 1.5% to 2% of the purchase price. This includes Land Transfer Tax (provincial, plus municipal if in Toronto), legal fees ($1,500-$2,000), title insurance, appraisal fees, and PST on your CMHC premium if applicable." },
      { q: "Can I use gifted money for a down payment?", a: "Yes. Immediate family members (parents, grandparents, siblings) can gift you funds for a down payment. The lender will require a signed 'Gift Letter' confirming the money is not a loan and does not need to be repaid." },
      { q: "What is a collateral charge vs standard charge mortgage?", a: "A standard charge registers the exact amount of your mortgage. A collateral charge allows the lender to register up to 125% of the home's value, making it easier to borrow more money later without legal fees, but making it harder to switch lenders at renewal." }
    ]
  },
  {
    category: "Rates, Terms & Penalties",
    questions: [
      { q: "Should I choose a Fixed or Variable rate?", a: "Fixed rates provide payment stability and protect against Bank of Canada rate hikes. Variable rates float with the Prime rate; historically, they cost less over a 25-year period and offer much lower penalties to break, but require a stomach for market fluctuations." },
      { q: "What is an Insured vs Insurable mortgage?", a: "Insured mortgages are for purchases with <20% down. Insurable mortgages are for renewals or refinances with 20%+ equity where the property value is under $1M and amortization is 25 years or less. The lender buys portfolio insurance in the background, offering you lower rates." },
      { q: "What is the penalty for breaking a fixed-rate mortgage?", a: "It is the greater of 3-months interest OR the Interest Rate Differential (IRD). The IRD is a complex calculation banks use to recoup lost interest, and it can cost tens of thousands of dollars if rates have dropped since you signed. Variable rates strictly use a 3-month interest penalty." },
      { q: "Can I lock in a rate before finding a house?", a: "Yes. Getting pre-approved allows our Pineapple agents to lock in a fixed rate for up to 120 days. If rates go up, you are protected. If rates drop before you close, we simply float you down to the new, lower rate." },
      { q: "What does 'Amortization' mean?", a: "Amortization is the total lifespan it takes to pay off the mortgage entirely (typically 25 or 30 years). Your 'Term' is the length of your current contract and rate guarantee (usually 3 or 5 years)." },
      { q: "Can I get a 30-year amortization?", a: "Yes, provided you have at least a 20% down payment (an 'Uninsured' mortgage). Extending to 30 years lowers your monthly payment significantly and increases the maximum loan amount you can qualify for." },
      { q: "What are prepayment privileges?", a: "Most A-lender mortgages include 20/20 prepayment privileges. This means every year, you can increase your regular payment by 20%, and drop a lump sum of up to 20% of the original principal directly onto the balance without penalty." },
      { q: "What happens at the end of my mortgage term?", a: "Your mortgage 'matures.' Your current lender will send a renewal offer. Do NOT sign it immediately. We will shop your remaining balance across the wholesale market to ensure you aren't paying a loyalty premium." }
    ]
  },
  {
    category: "Refinancing & Equity",
    questions: [
      { q: "What is a mortgage refinance?", a: "Refinancing replaces your current mortgage with a new one. It allows you to pull out cash from your home equity, lower your interest rate, extend your amortization to lower payments, or consolidate high-interest debts." },
      { q: "How much equity can I take out of my home?", a: "Canadian regulations allow you to refinance up to 80% of your home's current appraised value, minus your existing mortgage balance." },
      { q: "Does refinancing require a stress test?", a: "Yes. Even if you stay with your current lender, pulling out additional equity qualifies as a new mortgage application and is subject to the B-20 stress test." },
      { q: "What is a HELOC (Home Equity Line of Credit)?", a: "A HELOC is a revolving line of credit secured against your home. You only pay interest on what you use, and the rate floats with Prime. You can access up to 65% of your home's value via a standalone HELOC." },
      { q: "Can I use a refinance to pay off credit cards?", a: "Yes, this is called debt consolidation. By rolling 20% credit card debt into a ~5% mortgage, you drastically reduce your monthly outflows and save thousands in interest, improving your monthly cash flow." },
      { q: "What is the Smith Maneuver?", a: "It is a legal tax strategy in Canada. You use a readvanceable mortgage (like a HELOC combo) to convert your non-deductible primary residence mortgage interest into tax-deductible investment loan interest." },
      { q: "Can I use equity to buy a second property?", a: "Absolutely. We can set up a HELOC or refinance your primary residence to pull out the 20% down payment required to purchase an investment property or cottage." }
    ]
  },
  {
    category: "Alternative & Private Lending",
    questions: [
      { q: "What is a B-Lender?", a: "B-Lenders (Alternative Lenders) are regulated institutions that offer mortgages to clients who don't fit the strict A-lender box. They focus on 'story over score', accommodating self-employed individuals with low declared income or clients with bruised credit." },
      { q: "How do self-employed mortgages work?", a: "Traditional banks require 2 years of Notice of Assessments (NOAs). We utilize 'Stated Income' programs with B-Lenders, allowing us to use 6-12 months of your business bank statements to prove your true cash flow for qualification." },
      { q: "What is a Private Mortgage?", a: "A private mortgage is funded by an individual or investment syndicate. It is strictly asset-based, meaning approval relies on the equity in the home rather than your income or credit score. They are ideal for quick bridge financing or emergency funds." },
      { q: "What are the fees for private mortgages?", a: "Private mortgages have higher interest rates (typically 7% to 12%) and include lender fees and broker fees (ranging from 1% to 3% of the loan amount). These are short-term solutions (1-2 years) designed to bridge you until you can return to traditional lending." },
      { q: "What is a Second Mortgage?", a: "A second mortgage sits behind your primary mortgage. It allows you to access equity without breaking your first mortgage (preserving your low fixed rate). It is usually funded by private lenders or specialized MICs." },
      { q: "How do I fix my credit to get an A-Lender mortgage?", a: "We place clients in short-term B-lender or private solutions while working with them to pay off collections, lower utilization, and establish new trade lines. Once the credit score recovers (usually 12-24 months), we refinance them back to a prime bank rate." },
      { q: "Can I get a mortgage after a consumer proposal or bankruptcy?", a: "Yes. Most A-lenders require you to be fully discharged for 2 years with re-established credit. However, our Alternative and Private lenders can fund you the day after discharge, or even pay out the proposal through equity." }
    ]
  }
];

export default function MortgagesPage() {
  const [formTab, setFormTab] = useState<'standard' | 'ai'>('standard');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  
  // Firebase Rates State
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [loadingRates, setLoadingRates] = useState(true);

  // Fetch Live Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const docRef = doc(db, 'site_settings', 'mortgage_rates');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRates({ ...DEFAULT_RATES, ...docSnap.data() });
        }
      } catch (e) {
        console.error("⚠️ Failed to fetch rates, using defaults:", e);
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
  }, []);

  const toggleFaq = (question: string) => {
    setOpenFaq(openFaq === question ? null : question);
  };

  // --- SEO SCHEMA ---
  const faqSchemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": MORTGAGE_FAQS.flatMap(category => 
      category.questions.map(q => ({
        "@type": "Question",
        "name": q.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": q.a
        }
      }))
    )
  };

  const serviceSchemaData = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "IndiBrick Ecosystem - Mortgages",
    "image": "https://indibrick.ca/logo.jpg",
    "description": "Enterprise real estate ecosystem in Ontario. Mortgages originated by licensed mortgage agents, real estate via vetted partners, and tech-enabled legal closings.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Toronto",
      "addressRegion": "ON",
      "addressCountry": "CA"
    },
    "areaServed": "Ontario",
    "serviceType": ["Mortgage Pre-Approval", "Refinance", "Private Lending", "Real Estate Ecosystem"]
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 selection:bg-blue-600 selection:text-white pb-20">
      <JsonLd data={faqSchemaData} />
      <JsonLd data={serviceSchemaData} />

      {/* =========================================
          1. CLEAN, PROFESSIONAL HERO SECTION (WHITE UI)
          ========================================= */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 px-6 bg-white overflow-hidden border-b border-gray-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-blue-50 to-white rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
           <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              
              {/* Left Content: The Pitch */}
              <div className="w-full lg:w-[55%] text-center lg:text-left animate-fade-in-up">
                 <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
                    <ShieldCheck size={14} className="text-blue-600" /> Licensed Origination
                 </div>
                 
                 <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6 leading-[1.05] text-slate-900">
                   Stop Paying <br className="hidden lg:block"/>
                   Retail Rates.
                 </h1>
                 
                 <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                   Welcome to the modern real estate ecosystem. Your mortgage is structured by <strong className="text-slate-900">licensed mortgage agents</strong> accessing 50+ wholesale lenders. We then seamlessly integrate vetted realtors and tech-based legal partners for a flawless closing.
                 </p>
                 
                 <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <a href="#apply" className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2">
                       Start Approval <ArrowRight size={16}/>
                    </a>
                    <a href="#calculators" className="w-full sm:w-auto bg-white border border-gray-200 text-slate-700 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:border-black hover:text-black transition flex items-center justify-center gap-2 shadow-sm">
                       <Calculator size={16}/> Calculators
                    </a>
                 </div>
              </div>

              {/* Right: Clean Live Rate Widget */}
              <div className="w-full lg:w-[45%] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                 <div className="bg-white border border-gray-200 shadow-xl rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
                    
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                       <div>
                         <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                            <Activity className="text-blue-600" size={18} /> Live Wholesale Rates
                         </h3>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ontario Market • {rates.lastUpdated}</p>
                       </div>
                       {loadingRates && <Loader2 className="animate-spin text-blue-500" size={16} />}
                    </div>
                    
                    <div className="space-y-3">
                       {/* 5-Year Fixed */}
                       <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition">
                          <div>
                             <p className="font-black text-slate-900 text-sm">5-Year Fixed</p>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Insured</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-black text-blue-600">{rates.insured_5yr_fixed}%</p>
                          </div>
                       </div>

                       {/* 5-Year Variable */}
                       <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition">
                          <div>
                             <p className="font-black text-slate-900 text-sm">5-Year Variable</p>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Insured</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-black text-blue-600">{rates.insured_5yr_variable}%</p>
                          </div>
                       </div>

                       {/* 3-Year Fixed */}
                       <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition">
                          <div>
                             <p className="font-black text-slate-900 text-sm">3-Year Fixed</p>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Insured</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xl font-black text-blue-600">{rates.insured_3yr_fixed}%</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 text-center flex flex-col items-center">
                       <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-3 font-bold">*Rates are for high-ratio purchases. OAC. Subject to change.</p>
                       <Link href="/rates" className="text-xs font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 transition flex items-center gap-1">
                          View Full Rate Matrix <ChevronRight size={14}/>
                       </Link>
                    </div>

                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* =========================================
          2. THE ECOSYSTEM ADVANTAGE
          ========================================= */}
      <section className="py-20 bg-gray-50 border-b border-gray-100">
         <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">The IndiBrick Ecosystem</h2>
               <p className="text-slate-600 font-medium text-lg max-w-2xl mx-auto">We don't just secure your financing. We orchestrate the entire transaction using top-tier professionals and modern technology.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6"><Percent size={24}/></div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Wholesale Mortgages</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium mb-6">Our licensed Pineapple Financial agents access "monoline" lenders and credit unions to secure volume-discounted rates you cannot get at a retail branch.</p>
                  <a href="#apply" className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1 hover:text-slate-900 transition">Get Pre-Approved <ArrowRight size={12}/></a>
               </div>
               
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6"><Users size={24}/></div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Vetted Realtors</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium mb-6">Once your budget is locked, we seamlessly connect you with top 1% local real estate agents who understand your specific financial parameters and negotiation strategy.</p>
                  <a href="#apply" className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1 hover:text-slate-900 transition">Connect with Agent <ArrowRight size={12}/></a>
               </div>

               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6"><Scale size={24}/></div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Tech-Based Legal</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium mb-6">Skip the archaic paperwork. We partner with modern, tech-enabled real estate lawyers to ensure a digital, secure, and stress-free closing day.</p>
                  <a href="/trusted-real-estate-lawyers" className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1 hover:text-slate-900 transition">View Legal Partner <ArrowRight size={12}/></a>
               </div>
            </div>
         </div>
      </section>

      {/* =========================================
          3. CORE FINANCIAL PRODUCTS
          ========================================= */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
         <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Capital Solutions</h2>
            <p className="text-lg font-medium text-slate-500">Expert debt structuring for every scenario.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-xl transition duration-300 flex flex-col group">
               <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition"><Home size={24}/></div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3">Pre-Approvals</h3>
               <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed flex-grow">Walk into negotiations with bulletproof confidence. We stress-test your income and lock in wholesale rates for 120 days to protect you against market hikes.</p>
               <a href="#apply" className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 flex items-center gap-2 transition">Apply Now <ArrowRight size={14}/></a>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-xl transition duration-300 flex flex-col group">
               <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition"><Banknote size={24}/></div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3">Refinance & Equity</h3>
               <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed flex-grow">Restructure your debt. Pull up to 80% of your home's equity to buy investment properties, fund renovations, or consolidate high-interest credit cards.</p>
               <a href="#apply" className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 flex items-center gap-2 transition">Calculate Equity <ArrowRight size={14}/></a>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-xl transition duration-300 flex flex-col group">
               <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition"><RefreshCw size={24}/></div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3">Switch & Renewals</h3>
               <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed flex-grow">Never accept your bank's initial renewal letter. We shop your remaining balance across the wholesale market. Switching lenders is highly incentivized.</p>
               <a href="#apply" className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 flex items-center gap-2 transition">Transfer Mortgage <ArrowRight size={14}/></a>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-xl transition duration-300 flex flex-col group">
               <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition"><Briefcase size={24}/></div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3">Business For Self</h3>
               <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed flex-grow">Instead of relying on your Notice of Assessment, we use 6-12 months of business bank statements to prove true cash flow via Alternative B-Lenders.</p>
               <a href="#apply" className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 flex items-center gap-2 transition">BFS Application <ArrowRight size={14}/></a>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-xl transition duration-300 flex flex-col group">
               <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition"><Shield size={24}/></div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3">Private Mortgages</h3>
               <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed flex-grow">Strictly asset-based lending. If you have bad credit or tax arrears, we deploy capital based on property equity, ignoring standard income metrics.</p>
               <a href="#apply" className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 flex items-center gap-2 transition">Access Capital <ArrowRight size={14}/></a>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-xl transition duration-300 flex flex-col group">
               <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition"><Building2 size={24}/></div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-3">Investor Portfolios</h3>
               <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed flex-grow">Scale your acquisitions. We structure financing for rental properties, multi-residential units, and implement tax-efficient debt strategies.</p>
               <a href="#apply" className="text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 flex items-center gap-2 transition">Investor Strategy <ArrowRight size={14}/></a>
            </div>

         </div>
      </section>

      {/* =========================================
          4. CALCULATOR COMMAND CENTER
          ========================================= */}
      <section id="calculators" className="py-24 bg-slate-50 border-y border-gray-200">
         <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
               <span className="text-blue-600 font-bold uppercase tracking-widest text-[10px] mb-2 block">Precision Planning</span>
               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900 mb-4">Financial Toolset</h2>
               <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                  Don't guess. Use our institutional-grade engines to stress test your affordability, taxes, and penalties.
               </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Link href="/mortgage-payment-calculator" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-black hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-gray-50 text-slate-900 rounded-xl group-hover:scale-110 transition"><Calculator size={24}/></div>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">Payment Calculator</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Calculate monthly payments with accurate CMHC premiums and amortization schedules.</p>
               </Link>

               <Link href="/land-transfer-tax-calculator-ontario" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-black hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-gray-50 text-slate-900 rounded-xl group-hover:scale-110 transition"><MapPin size={24}/></div>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">Land Transfer Tax</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Buying in Ontario? Calculate the precise closing tax and automatically factor in First-Time Buyer rebates.</p>
               </Link>

               <Link href="/affordability-calculator" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-black hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-gray-50 text-slate-900 rounded-xl group-hover:scale-110 transition"><BarChart3 size={24}/></div>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">Max Affordability</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Determine your maximum purchase price based on income, debts, and current B-20 stress test rules.</p>
               </Link>

               <Link href="/mortgage-penalty-calculator" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-black hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-gray-50 text-slate-900 rounded-xl group-hover:scale-110 transition"><FileText size={24}/></div>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">Penalty Estimator</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Thinking of breaking your term? Estimate the IRD vs. 3-Month Interest penalty before you refinance.</p>
               </Link>

               <Link href="/tools/smith-maneuver-calculator" className="group bg-slate-900 text-white p-8 rounded-[2rem] hover:shadow-2xl transition duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="mb-6 flex justify-between items-start relative z-10">
                     <div className="p-3 bg-white/10 rounded-xl"><RefreshCw size={24} className="text-blue-400"/></div>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2 relative z-10">Smith Maneuver™</h3>
                  <p className="text-sm text-gray-400 mb-4 leading-relaxed relative z-10">Advanced Strategy. Convert your non-deductible mortgage interest into tax-deductible investment loans.</p>
               </Link>

               <Link href="/closing-costs-calculator" className="group bg-white p-8 rounded-[2rem] border border-gray-100 hover:border-black hover:shadow-xl transition duration-300">
                  <div className="mb-6 flex justify-between items-start">
                     <div className="p-3 bg-gray-50 text-slate-900 rounded-xl group-hover:scale-110 transition"><Landmark size={24}/></div>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">Total Closing Costs</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">Calculate Legal Fees, Title Insurance, Appraisal costs, and PST on CMHC insurance to avoid surprises.</p>
               </Link>
            </div>
         </div>
      </section>

      {/* =========================================
          5. MASSIVE AEO / SEO FAQ SECTION
          ========================================= */}
      <section className="py-24 px-6 bg-white">
         <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">
                  <HelpCircle size={14} /> Knowledge Base
               </div>
               <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-6">Mortgage Intelligence</h2>
               <p className="text-lg text-slate-500 font-medium">Everything you need to know about the Canadian mortgage market, underwriting rules, and alternative lending.</p>
            </div>

            <div className="space-y-12">
               {MORTGAGE_FAQS.map((category, idx) => (
                  <div key={idx}>
                     <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6 border-b border-gray-100 pb-3">
                        {category.category}
                     </h3>
                     <div className="space-y-4">
                        {category.questions.map((faq, fIdx) => (
                           <details key={fIdx} className="group bg-gray-50 p-6 md:p-8 rounded-[2rem] border border-gray-100 cursor-pointer hover:border-gray-300 transition">
                              <summary className="flex justify-between items-center font-bold text-sm md:text-base text-slate-900 list-none pr-4">
                                 {faq.q}
                                 <span className="transition duration-300 group-open:rotate-180 bg-white shadow-sm p-2 rounded-full text-gray-500 group-hover:text-black shrink-0 ml-4">
                                    <ChevronDown size={16}/>
                                 </span>
                              </summary>
                              <div className="mt-6 text-slate-600 font-medium leading-relaxed text-sm md:text-base border-t border-gray-200 pt-6">
                                 {faq.a}
                              </div>
                           </details>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* =========================================
          6. BOTTOM COMMAND CENTER (TABBED FORMS)
          ========================================= */}
      <section id="apply" className="py-24 px-6 bg-slate-50 border-t border-gray-200">
         <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
               
               <div className="p-12 text-center text-slate-900 relative z-10 border-b border-gray-100">
                  <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Start Your Application</h2>
                  <p className="text-slate-500 font-medium max-w-xl mx-auto text-lg">
                     Choose how you want to proceed. Both options securely connect you directly to a licensed Pineapple agent for processing.
                  </p>
               </div>
               
               <div className="flex bg-gray-50 relative z-10 border-b border-gray-200">
                  <button 
                     onClick={() => setFormTab('standard')}
                     className={`flex-1 py-6 text-xs md:text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${formTab === 'standard' ? 'border-slate-900 text-slate-900 bg-white' : 'border-transparent text-gray-400 hover:text-slate-900 hover:bg-white/50'}`}
                  >
                     <FileText size={16} /> Standard Form
                  </button>
                  <button 
                     onClick={() => setFormTab('ai')}
                     className={`flex-1 py-6 text-xs md:text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 border-b-2 ${formTab === 'ai' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-400 hover:text-slate-900 hover:bg-white/50'}`}
                  >
                     <Activity size={16} className="animate-pulse text-blue-500" /> AI Intake
                  </button>
               </div>

               <div className="p-6 md:p-12 bg-white relative z-10">
                  {formTab === 'standard' ? (
                     <div className="animate-fade-in max-w-3xl mx-auto">
                       <LeadForm 
                          type="Mortgage" 
                          title="Secure Application" 
                          subtitle="Submit your details below. A licensed agent will review your file and lock in your wholesale rate." 
                          ctaText="Submit File" 
                       />
                     </div>
                  ) : (
                     <div className="animate-fade-in max-w-3xl mx-auto">
                       <AIIntakeForm />
                     </div>
                  )}
               </div>

            </div>
         </div>
      </section>

    </div>
  );
}