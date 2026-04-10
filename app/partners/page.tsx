'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, Shield, Zap, Network, DollarSign, CheckCircle, 
  Loader2, ArrowRight, BarChart3, Lock, Users, Building, FileCheck, ArrowUpRight,
  TrendingUp, Scale, Workflow, ShieldCheck
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function PartnerEcosystemPage() {
  const [inquiry, setInquiry] = useState({ name: '', email: '', role: 'Real Estate Agent / Broker', intro: '' });
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryStatus('submitting');
    try {
      await addDoc(collection(db, 'partner_inquiries'), {
        ...inquiry,
        type: 'Unified Ecosystem Application',
        submittedAt: new Date().toISOString()
      });
      setInquiryStatus('success');
      setInquiry({ name: '', email: '', role: 'Real Estate Agent / Broker', intro: '' });
    } catch (err) {
      console.error(err);
      alert("Form submission blocked. Please update Firebase Security Rules.");
      setInquiryStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-20 relative">
      
      {/* Preserves your static header, hides footer for landing page focus */}
      <style dangerouslySetInnerHTML={{__html: `
        footer, [class*="fixed"][class*="bottom-"] { display: none !important; }
      `}} />

      {/* =========================================
          SECTION 1: HERO & EXISTING USER LOGINS (WHITE & SIMPLISTIC)
          ========================================= */}
      <section className="bg-white text-slate-900 pt-24 pb-20 md:pt-32 md:pb-24 px-6 relative overflow-hidden border-b border-gray-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-gray-50 to-white rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Minimalist Hero Pitch */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest mb-8 text-gray-500 shadow-sm">
              The IndiBrick Ecosystem
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6 text-slate-900">
              The Unified Architecture for <br className="hidden md:block"/>
              Origination & Capital.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
              Log in to your secure workspace below. Whether you are a top-producing agent tracking client pipelines, or an institutional fund deploying capital—welcome to your command center.
            </p>
          </div>

          {/* Minimalist Login Portals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
             
             {/* Partner CRM Login */}
             <Link href="/partner/login" className="group bg-white border border-gray-200 hover:border-blue-200 hover:shadow-[0_20px_60px_rgba(37,99,235,0.08)] rounded-[2.5rem] p-8 md:p-12 transition duration-500 relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition duration-500"></div>
                <div className="w-20 h-20 bg-blue-50 text-blue-600 border border-blue-100 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500 shadow-sm relative z-10">
                   <Briefcase size={36} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-3 relative z-10">Co-Brokerage CRM</h3>
                <p className="text-slate-500 font-medium mb-10 relative z-10 leading-relaxed">Secure portal for Realtors, Lawyers, and Mortgage Professionals to track client approvals.</p>
                <div className="mt-auto w-full bg-slate-900 text-white py-4.5 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 group-hover:bg-blue-600 transition shadow-lg relative z-10">
                   Access Partner Portal <ArrowRight size={50} />
                </div>
             </Link>

             {/* Lender Exchange Login */}
             <Link href="/lender/login" className="group bg-white border border-gray-200 hover:border-amber-200 hover:shadow-[0_20px_60px_rgba(245,158,11,0.08)] rounded-[2.5rem] p-8 md:p-12 transition duration-500 relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 left-0 w-40 h-40 bg-amber-50 rounded-full blur-3xl group-hover:bg-amber-100 transition duration-500"></div>
                <div className="w-20 h-20 bg-amber-50 text-amber-500 border border-amber-100 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500 shadow-sm relative z-10">
                   <Shield size={36} />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-3 relative z-10">BorrowDirect Exchange</h3>
                <p className="text-slate-500 font-medium mb-10 relative z-10 leading-relaxed">Institutional dashboard for Private Lenders, Family Offices, and MICs to deploy capital.</p>
                <div className="mt-auto w-full bg-slate-900 text-white py-4.5 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 group-hover:bg-amber-500 transition shadow-lg relative z-10">
                   Access Capital Market <ArrowRight size={50} />
                </div>
             </Link>

          </div>

        </div>
      </section>

      {/* =========================================
          SECTION 2: DEEP DIVE SEO/AEO PITCH (SCROLLABLE & DETAILED)
          ========================================= */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-24">
           
           {/* INTRODUCTORY THESIS */}
           <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">The IndiBrick Thesis</h2>
              <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed tracking-tight">
                 For decades, real estate origination and private capital deployment have existed in silos. Brokers lose deals to slow agent underwriting, while private funds waste resources sourcing unvetted opportunities. <strong className="text-black">We built the bridge.</strong>
              </p>
           </div>

           {/* PARTNER PITCH (BLUE ACCENTS) */}
           <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-16 items-center">
              <div className="w-full lg:w-1/2 space-y-8">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                    <Users size={14} /> Real Estate Professionals
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 leading-[1.05]">
                    Accelerate Closings. <br />
                    <span className="text-blue-600">Scale Your Revenue.</span>
                 </h2>
                 <p className="text-slate-600 font-medium leading-relaxed text-lg">
                    IndiBrick is the ultimate <strong className="text-slate-900">PropTech Co-Brokerage CRM</strong>. We empower modern Realtors, Brokers, and Legal Partners to bypass the friction of traditional financing. By integrating your pipeline directly into our digital brokerage, your clients get faster approvals, and you earn lucrative referral bonuses.
                 </p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-3">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Zap size={20}/></div>
                       <h4 className="font-black text-slate-900 text-lg leading-tight">Instant AI Underwriting</h4>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed">Our system pre-analyzes GDS/TDS ratios and stress-test limits instantly, guaranteeing conditional approvals before you even write the offer.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Network size={20}/></div>
                       <h4 className="font-black text-slate-900 text-lg leading-tight">Unified Pipeline Visibility</h4>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed">Eliminate "What's the status?" emails. You and your client get real-time tracking of appraisals and lender commitments inside your secure dashboard.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><TrendingUp size={20}/></div>
                       <h4 className="font-black text-slate-900 text-lg leading-tight">Co-Brokerage Payouts</h4>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed">Turn your existing network into a high-yield revenue stream with our transparent, per-file referral compensation structure.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Workflow size={20}/></div>
                       <h4 className="font-black text-slate-900 text-lg leading-tight">Seamless Handoffs</h4>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed">Simply input the client's basic details into the CRM. Our licensed underwriting team takes over the compliance, document collection, and funding.</p>
                    </div>
                 </div>
              </div>
              
              <div className="w-full lg:w-1/2 bg-gray-50 rounded-[2rem] p-10 border border-gray-200 flex flex-col justify-center relative overflow-hidden h-full min-h-[500px]">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                 <div className="relative z-10 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                       <CheckCircle className="text-green-500 shrink-0" size={24}/>
                       <div>
                          <p className="text-xs font-black uppercase text-gray-400">Milestone Reached</p>
                          <p className="font-bold text-slate-900">Appraisal Ordered & Paid</p>
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 ml-6">
                       <CheckCircle className="text-green-500 shrink-0" size={24}/>
                       <div>
                          <p className="text-xs font-black uppercase text-gray-400">Milestone Reached</p>
                          <p className="font-bold text-slate-900">Lender Commitment Issued</p>
                       </div>
                    </div>
                    <div className="bg-blue-600 p-6 rounded-2xl shadow-lg border border-blue-500 flex items-center gap-4 ml-12">
                       <DollarSign className="text-white shrink-0" size={24}/>
                       <div>
                          <p className="text-xs font-black uppercase text-blue-200 tracking-widest">Revenue Event</p>
                          <p className="font-bold text-white">File Funded • Referral Bonus Processing</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* LENDER PITCH (AMBER ACCENTS) */}
           <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-xl border border-gray-100 flex flex-col lg:flex-row-reverse gap-16 items-center">
              <div className="w-full lg:w-1/2 space-y-8">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">
                    <Building size={14} /> Institutional Capital
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 leading-[1.05]">
                    Algorithmic Vetting. <br />
                    <span className="text-amber-500">Alternative Yield.</span>
                 </h2>
                 <p className="text-slate-600 font-medium leading-relaxed text-lg">
                    BorrowDirect is an exclusive <strong className="text-slate-900">B2B Private Debt Marketplace</strong>. We provide family offices and high-net-worth funds with direct access to proprietary deal flow. Deploy capital into 1st and 2nd position real estate assets with absolute transparency.
                 </p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-3">
                       <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><FileCheck size={20}/></div>
                       <h4 className="font-black text-slate-900 text-lg leading-tight">Risk Filtering</h4>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed">Our proprietary AI engine filters high-risk applications before they reach the board. Review stringent LTV ratios and property appraisals upfront.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><Lock size={20}/></div>
                       <h4 className="font-black text-slate-900 text-lg leading-tight">Cryptographic Vault</h4>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed">Submit term sheets directly. Upon award, instantly unlock the borrower's secure document vault to finalize your diligence without delays.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><BarChart3 size={20}/></div>
                       <h4 className="font-black text-slate-900 text-lg leading-tight">100% Yield Protection</h4>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed">Set your own rates and lender fees. IndiBrick handles borrower administration, ensuring your proposed yield goes entirely to your fund.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><Scale size={20}/></div>
                       <h4 className="font-black text-slate-900 text-lg leading-tight">Legal Standardization</h4>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed">We package every deal with standardized compliance disclosures, ensuring a smooth handoff to your legal counsel for final registration.</p>
                    </div>
                 </div>
              </div>
              
              <div className="w-full lg:w-1/2 bg-slate-900 rounded-[2rem] p-10 border border-slate-800 flex flex-col justify-center relative overflow-hidden h-full min-h-[500px]">
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
                 <div className="relative z-10 space-y-6">
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/10 flex justify-between items-center backdrop-blur-sm">
                       <div>
                          <span className="px-2 py-1 bg-blue-500 text-white text-[9px] font-black uppercase rounded mb-2 inline-block">1st Position</span>
                          <p className="font-bold text-white text-lg">$850,000 Loan</p>
                          <p className="text-xs text-gray-400 font-medium">65% LTV • Detached Home</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Target Yield</p>
                          <p className="font-black text-amber-400 text-2xl">8.99%</p>
                       </div>
                    </div>
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/10 flex justify-between items-center backdrop-blur-sm">
                       <div>
                          <span className="px-2 py-1 bg-amber-500 text-black text-[9px] font-black uppercase rounded mb-2 inline-block">2nd Position</span>
                          <p className="font-bold text-white text-lg">$200,000 Loan</p>
                          <p className="text-xs text-gray-400 font-medium">75% LTV • Condo</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Target Yield</p>
                          <p className="font-black text-amber-400 text-2xl">12.00%</p>
                       </div>
                    </div>
                    <div className="pt-4 flex justify-center">
                       <button className="bg-amber-500 text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20">
                          Submit Term Sheet <ArrowUpRight size={16}/>
                       </button>
                    </div>
                 </div>
              </div>
           </div>

        </div>
      </section>

      {/* =========================================
          SECTION 3: APPLICATION FORM (BOTTOM)
          ========================================= */}
      <section className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] shadow-2xl p-10 md:p-16 relative overflow-hidden">
           {/* Dark Mode Application Box for contrast at the bottom */}
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-600/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-[300px] -mt-[300px]"></div>
           
           <div className="relative z-10 text-center mb-12">
              <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
                 <ShieldCheck size={32} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-4">Apply for Access</h2>
              <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
                 Join the IndiBrick ecosystem. Request your custom CRM workspace or institutional lender portfolio dashboard below.
              </p>
           </div>

           <div className="relative z-10 bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-md">
              {inquiryStatus === 'success' ? (
                 <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-12 rounded-2xl text-center flex flex-col items-center justify-center gap-4">
                    <CheckCircle size={56}/>
                    <div>
                       <p className="font-black text-2xl uppercase tracking-widest mb-2">Application Received</p>
                       <p className="text-sm text-green-200/80">Our Network Directors will review your credentials and contact you shortly.</p>
                    </div>
                 </div>
              ) : (
                 <form onSubmit={handleInquirySubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Full Name</label>
                          <input required type="text" placeholder="John Doe" value={inquiry.name} onChange={e=>setInquiry({...inquiry, name: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-white outline-none transition text-base text-white font-medium" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Professional Email</label>
                          <input required type="email" placeholder="name@company.com" value={inquiry.email} onChange={e=>setInquiry({...inquiry, email: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-white outline-none transition text-base text-white font-medium" />
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">I am applying as a...</label>
                       <select value={inquiry.role} onChange={e=>setInquiry({...inquiry, role: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-white outline-none transition text-base text-white font-medium appearance-none cursor-pointer">
                          <option>Real Estate Agent / Broker</option>
                          <option>Private Lender / Family Office / MIC</option>
                          <option>Real Estate Lawyer</option>
                          <option>Mortgage Professional</option>
                          <option>Financial Advisor / General Referral</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Business Overview & Goals</label>
                       <textarea required placeholder="Tell us about your volume, lending criteria, or how we can collaborate..." value={inquiry.intro} onChange={e=>setInquiry({...inquiry, intro: e.target.value})} rows={4} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-white outline-none transition text-base text-white font-medium resize-none" />
                    </div>
                    <button type="submit" disabled={inquiryStatus === 'submitting'} className="w-full bg-white hover:bg-gray-200 text-black py-5 rounded-xl font-black uppercase tracking-widest text-base transition flex justify-center items-center gap-3 mt-4 shadow-xl">
                       {inquiryStatus === 'submitting' ? <Loader2 size={20} className="animate-spin"/> : <ArrowUpRight size={20}/>}
                       {inquiryStatus === 'submitting' ? 'Transmitting...' : 'Submit Application'}
                    </button>
                 </form>
              )}
           </div>
        </div>
      </section>

    </div>
  );
}