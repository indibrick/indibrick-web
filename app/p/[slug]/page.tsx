'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, Calculator, MessageSquare, Loader2, Activity, Target, 
  CheckCircle, Lock, Building2, Clock, ArrowRight, UserCheck, Star, BrainCircuit 
} from 'lucide-react';
import AIIntakeForm from '@/components/AIIntakeForm';

export default function PartnerLandingPage({ params }: { params: { slug: string } }) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'intake' | 'analyzer'>('intake');
  
  // Analyzer State
  const [analyzerForm, setAnalyzerForm] = useState({ income: '', downPayment: '', propertyValue: '', creditScore: '', debts: '', notes: '' });
  const [analyzerStatus, setAnalyzerStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analyzerResult, setAnalyzerResult] = useState<any>(null);

  // Format the slug into a clean name (e.g., "mudit-chhura" -> "Mudit Chhura")
  const partnerName = params.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // --- ANALYZER LOGIC ---
  const handleAnalyzeDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzerForm.income.trim() || !analyzerForm.propertyValue.trim()) return;
    
    setAnalyzerStatus('loading');
    setAnalyzerResult(null);

    const scenarioString = `Income: $${analyzerForm.income}. Down Payment: $${analyzerForm.downPayment}. Property Value: $${analyzerForm.propertyValue}. Credit: ${analyzerForm.creditScore}. Debts: $${analyzerForm.debts}. Notes: ${analyzerForm.notes}`;

    try {
        const res = await fetch('/api/partner/deal-analyzer', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario: scenarioString, partnerName: partnerName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAnalyzerResult(data);
        setAnalyzerStatus('success');
    } catch (err: any) {
        setAnalyzerStatus('error');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-900 selection:bg-blue-600 selection:text-white pb-20">
      
      {/* 1. PREMIUM CO-BRANDED HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto max-w-7xl py-4 px-6 flex justify-between items-center">
            
            {/* IndiBrick Logo - Uses actual website logo from public folder */}
            <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="IndiBrick Financial" 
                  className="h-40 md:h-40 w-auto object-contain"
                  onError={(e) => {
                    // Fallback just in case logo.png isn't found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="hidden font-black uppercase tracking-tighter text-2xl text-slate-900">IndiBrick</span>
            </div>

            {/* Partner Trust Badge */}
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 py-1.5 px-4 rounded-full">
                <ShieldCheck size={16} className="text-blue-600" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-800">
                   Verified Partner Portal
                </span>
            </div>
        </div>
      </header>

      {/* 2. SPLIT-SCREEN MAIN LAYOUT */}
      <main className="container mx-auto max-w-7xl px-6 pt-12 md:pt-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
         
         {/* LEFT COLUMN: TRUST & VALUE PROPOSITION */}
         <div className="lg:col-span-5 space-y-10">
            
            {/* Partner Profile Card */}
            <div>
               <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-md">
                  <Star size={12} className="fill-white" /> Exclusive Access
               </div>
               
               <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6">
                  Welcome to your private financing portal with <span className="text-blue-600">{partnerName}</span>.
               </h1>
               
               <p className="text-base text-slate-600 leading-relaxed font-medium mb-8">
                  <strong>{partnerName}</strong> has partnered with IndiBrick Financial to bypass retail bank branches, giving you direct access to wholesale mortgage rates and intelligent AI underwriting.
               </p>
            </div>

            {/* The IndiBrick Advantage */}
            <div className="space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">The IndiBrick Advantage</h3>
               
               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                     <Building2 size={20} />
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-900 mb-1">50+ Top Canadian Lenders</h4>
                     <p className="text-sm text-slate-500 font-medium">We instantly compare rates from TD, Scotiabank, MCAP, First National, and exclusive private lenders.</p>
                  </div>
               </div>

               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                     <Clock size={20} />
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-900 mb-1">Fast-Tracked Approvals</h4>
                     <p className="text-sm text-slate-500 font-medium">Our AI-assisted underwriting engine pre-screens your file to secure faster approvals and fewer conditions.</p>
                  </div>
               </div>

               <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                     <Lock size={20} />
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-900 mb-1">Bank-Level Security</h4>
                     <p className="text-sm text-slate-500 font-medium">Your data is secured using TLS 1.3 encryption and processed strictly within FINTRAC compliance standards.</p>
                  </div>
               </div>
            </div>

            {/* Lender Banner */}
            <div className="pt-8 mt-8 border-t border-gray-200">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 text-center lg:text-left">Trusted Access To</p>
               <div className="flex flex-wrap justify-center lg:justify-start gap-6 opacity-40 grayscale">
                  {/* Generic placeholder text that looks like lender logos */}
                  <span className="text-xl font-black tracking-tighter">TD</span>
                  <span className="text-xl font-black tracking-tighter text-red-600">Scotiabank</span>
                  <span className="text-xl font-black tracking-tighter">MCAP</span>
                  <span className="text-xl font-black tracking-tighter">First National</span>
                  <span className="text-xl font-black tracking-tighter">Equitable</span>
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN: THE INTERACTIVE CONSOLE */}
         <div className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden relative">
               
               {/* Console Header Tabs */}
               <div className="flex border-b border-gray-100 bg-gray-50/50">
                  <button 
                     onClick={() => setActiveTab('intake')}
                     className={`flex-1 py-6 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-b-2 ${activeTab === 'intake' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-400 hover:text-slate-900 hover:bg-gray-50'}`}
                  >
                     <MessageSquare size={16} /> Client Pre-Approval
                  </button>
                  <button 
                     onClick={() => setActiveTab('analyzer')}
                     className={`flex-1 py-6 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-b-2 ${activeTab === 'analyzer' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-400 hover:text-slate-900 hover:bg-gray-50'}`}
                  >
                     <Calculator size={16} /> Advisor Deal Analyzer
                  </button>
               </div>

               <div className="p-6 md:p-10">
                  
                  {/* TAB 1: AI INTAKE (CLIENT MODE) */}
                  {activeTab === 'intake' && (
                     <div className="animate-fade-in-up">
                        <div className="text-center mb-8">
                           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                              <UserCheck size={24} />
                           </div>
                           <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Intake Copilot</h2>
                           <p className="text-gray-500 font-medium text-sm mt-2 max-w-sm mx-auto">Chat securely with our AI assistant. We will evaluate your goals and instantly generate a secure document vault specifically for {partnerName}.</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-3xl p-2 md:p-4 border border-gray-100 shadow-inner">
                           {/* We pass the partnerId to the form so the lead routes directly to them! */}
                           <AIIntakeForm partnerId={params.slug} />
                        </div>
                     </div>
                  )}

                  {/* TAB 2: AI DEAL ANALYZER (PRESENTATION MODE) */}
                  {activeTab === 'analyzer' && (
                     <div className="animate-fade-in-up">
                        
                        {!analyzerResult && (
                           <>
                              <div className="text-center mb-8">
                                 <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <BrainCircuit size={24} />
                                 </div>
                                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Live Scenario Underwriting</h2>
                                 <p className="text-gray-500 font-medium text-sm mt-2 max-w-md mx-auto">Calculate approval odds instantly using real-time Bank of Canada B-20 stress test metrics.</p>
                              </div>
                              
                              <form onSubmit={handleAnalyzeDeal} className="space-y-6">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Annual Income ($)</label>
                                        <input required type="number" placeholder="e.g. 120000" value={analyzerForm.income} onChange={e=>setAnalyzerForm({...analyzerForm, income: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Down Payment ($)</label>
                                        <input required type="number" placeholder="e.g. 50000" value={analyzerForm.downPayment} onChange={e=>setAnalyzerForm({...analyzerForm, downPayment: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Target Property Value ($)</label>
                                        <input required type="number" placeholder="e.g. 600000" value={analyzerForm.propertyValue} onChange={e=>setAnalyzerForm({...analyzerForm, propertyValue: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Est. Credit Score</label>
                                        <input required type="number" placeholder="e.g. 680" value={analyzerForm.creditScore} onChange={e=>setAnalyzerForm({...analyzerForm, creditScore: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition shadow-sm" />
                                    </div>
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Total Monthly Debts ($)</label>
                                    <input type="number" placeholder="e.g. 450 (Car loan, credit cards)" value={analyzerForm.debts} onChange={e=>setAnalyzerForm({...analyzerForm, debts: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition shadow-sm" />
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Scenario Context (Optional)</label>
                                    <textarea rows={2} placeholder="e.g. Self-employed, needs B-Lender option." value={analyzerForm.notes} onChange={e=>setAnalyzerForm({...analyzerForm, notes: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-slate-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition resize-none shadow-sm" />
                                 </div>

                                 <button disabled={analyzerStatus === 'loading'} className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-xl font-black uppercase tracking-widest text-sm transition disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl">
                                    {analyzerStatus === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                                    {analyzerStatus === 'loading' ? 'Running Analytics...' : 'Run Scenario Analysis'}
                                 </button>
                              </form>
                           </>
                        )}

                        {/* RESULTS VIEW */}
                        {analyzerResult && (
                           <div className="animate-fade-in flex flex-col">
                               <div className="flex justify-between items-center mb-6">
                                  <h3 className="font-black text-xl tracking-tight text-slate-900 flex items-center gap-2">
                                     <CheckCircle className="text-green-500"/> Analysis Complete
                                  </h3>
                                  <button onClick={() => setAnalyzerResult(null)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-slate-900 transition">
                                     New Scenario
                                  </button>
                               </div>

                               <div className="grid grid-cols-2 gap-4 mb-6">
                                  <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center border border-gray-200 shadow-sm">
                                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Est. GDS Ratio</p>
                                     <p className="text-4xl font-black text-slate-900 tracking-tighter">{analyzerResult.gds}</p>
                                  </div>
                                  <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center border border-gray-200 shadow-sm">
                                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Est. TDS Ratio</p>
                                     <p className="text-4xl font-black text-slate-900 tracking-tighter">{analyzerResult.tds}</p>
                                  </div>
                               </div>

                               <div className="mb-6 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                  <h4 className="font-black uppercase tracking-tight text-[11px] text-blue-800 mb-3 flex items-center gap-2"><ShieldCheck size={14}/> Underwriter Verdict</h4>
                                  <p className="text-slate-800 text-sm leading-relaxed font-medium">
                                     {analyzerResult.analysis}
                                  </p>
                               </div>

                               <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                                  <h4 className="font-black uppercase tracking-tight text-[11px] text-slate-400 mb-4 flex items-center gap-2"><Target size={14}/> Recommended Path</h4>
                                  <ul className="space-y-4">
                                     {analyzerResult.actionPlan.map((step: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-bold">
                                           <span className="font-black text-white bg-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-md">{i+1}</span>
                                           <span className="leading-relaxed">{step}</span>
                                        </li>
                                     ))}
                                  </ul>
                               </div>
                           </div>
                        )}
                     </div>
                  )}

               </div>
            </div>
         </div>
      </main>
    </div>
  );
}