'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../AdminContext'; 
import { Lock, Briefcase, Zap, Handshake, CheckCircle, Loader2, Star, Clock, Users, ArrowRight, DollarSign, Rocket, SearchCheck, Wallet, ShieldCheck, AlertTriangle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function PartnerLoginPage() {
  const { login } = useAdmin();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [inquiry, setInquiry] = useState({ name: '', email: '', role: 'Real Estate Agent', intro: '' });
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/partner');
    } catch (err: any) {
      console.error(err);
      setError('Invalid Access Credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryStatus('submitting');
    try {
      await addDoc(collection(db, 'partner_inquiries'), {
        ...inquiry,
        type: 'Referral Partner / Agent',
        submittedAt: new Date().toISOString()
      });
      setInquiryStatus('success');
      setInquiry({ name: '', email: '', role: 'Real Estate Agent', intro: '' });
    } catch (err) {
      console.error(err);
      alert("Form submission blocked. Please update Firebase Security Rules.");
      setInquiryStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans pt-20 lg:pt-24 relative">
      
      {/* Keeps your static header untouched */}
      <style dangerouslySetInnerHTML={{__html: `
        footer, [class*="fixed"][class*="bottom-"] { display: none !important; }
      `}} />

      {/* Left Side: Long-Form Enterprise Partner Pitch (Pushed to bottom on mobile, left on desktop) */}
      <div className="w-full lg:w-[55%] xl:w-3/5 p-6 md:p-12 lg:p-20 flex flex-col gap-20 order-2 lg:order-1">
        
        {/* Section 1: Hero */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest mb-8 shadow-sm border border-blue-200">
            <Briefcase size={14} /> Enterprise Partner Network
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
            Close deals faster. <br/>
            <span className="text-blue-600">Unlock New Revenue.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
            Welcome to the ultimate <strong className="text-slate-900">PropTech Co-Brokerage CRM</strong>. IndiBrick combines a highly intuitive lead management pipeline with algorithmic mortgage underwriting to elevate your client experience. Connect your clients with a closing experience they will actually rave about.
          </p>
        </div>

        {/* Section 2: Core Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition">
            <Star className="text-blue-500 mb-4 fill-blue-500" size={28} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Satisfaction</p>
            <p className="text-4xl font-black text-slate-900">4.9/5</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition">
            <Clock className="text-blue-500 mb-4" size={28} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Approvals</p>
            <p className="text-4xl font-black text-slate-900">24 Hrs</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition col-span-2 md:col-span-1 flex flex-col justify-center">
            <Users className="text-blue-500 mb-4" size={28} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Ecosystem</p>
            <p className="text-xl font-black text-slate-900 leading-tight">Realtors, Lawyers<br/><span className="text-slate-500 text-base">& Mortgage Pros</span></p>
          </div>
        </div>

        {/* Section 3: How it Works for Partners */}
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-10">Your Pipeline Workflow</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><Rocket size={80}/></div>
                 <span className="w-8 h-8 bg-blue-100 text-blue-700 font-black rounded-full flex items-center justify-center mb-4">1</span>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Inject Lead</h3>
                 <p className="text-slate-600 font-medium">Add your buyer or seller to the CRM. Assign them directly to IndiBrick HQ or route them to a specific mortgage/legal partner in the network.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><SearchCheck size={80}/></div>
                 <span className="w-8 h-8 bg-blue-100 text-blue-700 font-black rounded-full flex items-center justify-center mb-4">2</span>
                 <h3 className="text-xl font-black text-slate-900 mb-2">AI Underwriting</h3>
                 <p className="text-slate-600 font-medium">Use the built-in Deal Analyzer to instantly verify GDS/TDS ratios before you even write the offer, saving everyone time.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><ShieldCheck size={80}/></div>
                 <span className="w-8 h-8 bg-blue-100 text-blue-700 font-black rounded-full flex items-center justify-center mb-4">3</span>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Track Milestones</h3>
                 <p className="text-slate-600 font-medium">Watch the deal move from 'Received' to 'Firm Sale' in real-time. Communicate directly with the underwriter inside the shared deal timeline.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><Wallet size={80}/></div>
                 <span className="w-8 h-8 bg-blue-100 text-blue-700 font-black rounded-full flex items-center justify-center mb-4">4</span>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Earn Referral Bonuses</h3>
                 <p className="text-slate-600 font-medium">Track your Funded YTD volume right on your dashboard. Enjoy lucrative payouts for every mortgage securely closed through the ecosystem.</p>
              </div>
           </div>
        </div>

        {/* Section 4: Deep Dive Features */}
        <div className="space-y-12 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-200">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8 border-b border-gray-100 pb-6">The Tech Advantage</h2>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl shrink-0"><Zap size={28} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Tech-Enabled Mortgage Origination</h3>
              <p className="text-slate-600 leading-relaxed font-medium text-lg">Stop waiting on slow traditional lenders. Our digital brokerage uses an AI Deal Analyzer to pre-qualify scenarios instantly, guaranteeing blazing-fast conditional approvals for your buyers to keep your deals from falling apart.</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl shrink-0"><Handshake size={28} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Unified Co-Brokerage CRM</h3>
              <p className="text-slate-600 leading-relaxed font-medium text-lg">Eliminate the "What's the status?" phone calls. Both you and your client get real-time visibility into every milestone, document request, and approval stage directly in your portal.</p>
            </div>
          </div>
        </div>

        {/* Section 5: The Lead Form */}
        <div className="bg-slate-900 border border-slate-800 p-8 md:p-14 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mt-4">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-40 -mt-40"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tight mb-4">Apply for Partnership</h2>
            <p className="text-slate-400 mb-12 font-medium text-xl">Join the IndiBrick ecosystem and request your custom CRM workspace below.</p>
            
            {inquiryStatus === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-5">
                 <CheckCircle size={56}/>
                 <div>
                    <p className="font-black text-2xl uppercase tracking-widest mb-3">Application Received</p>
                    <p className="text-base text-green-200/80">Our Network Directors will reach out shortly to configure your pipeline.</p>
                 </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Full Name</label>
                     <input required type="text" placeholder="John Doe" value={inquiry.name} onChange={e=>setInquiry({...inquiry, name: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-blue-500 outline-none transition text-lg text-white font-medium" />
                  </div>
                  <div>
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Professional Email</label>
                     <input required type="email" placeholder="name@brokerage.com" value={inquiry.email} onChange={e=>setInquiry({...inquiry, email: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-blue-500 outline-none transition text-lg text-white font-medium" />
                  </div>
                </div>
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Primary Profession</label>
                   <select value={inquiry.role} onChange={e=>setInquiry({...inquiry, role: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-blue-500 outline-none transition text-lg text-white font-medium appearance-none cursor-pointer">
                      <option>Real Estate Agent / Broker</option>
                      <option>Real Estate Lawyer</option>
                      <option>Mortgage Professional</option>
                      <option>Financial Advisor / General Referral</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Brokerage & Business Overview</label>
                   <textarea required placeholder="Tell us about your volume, your brokerage, and how we can collaborate..." value={inquiry.intro} onChange={e=>setInquiry({...inquiry, intro: e.target.value})} rows={4} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-blue-500 outline-none transition text-lg text-white font-medium resize-none" />
                </div>
                <button type="submit" disabled={inquiryStatus === 'submitting'} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-xl font-black uppercase tracking-widest text-base transition flex justify-center items-center gap-3 mt-6 shadow-xl">
                  {inquiryStatus === 'submitting' ? <Loader2 size={24} className="animate-spin"/> : <ArrowRight size={24}/>}
                  {inquiryStatus === 'submitting' ? 'Transmitting...' : 'Submit Partnership Request'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="pb-10 pt-10 text-center">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} IndiBrick Financial Inc. • 256-bit Enterprise Encryption</p>
        </div>

      </div>

      {/* Right Side: Sticky Login Form (Pulled to top on mobile) */}
      <div className="w-full lg:w-[45%] xl:w-2/5 p-6 md:p-12 lg:p-16 lg:sticky lg:top-24 h-max flex flex-col justify-start border-b lg:border-b-0 lg:border-l border-gray-200 bg-white lg:bg-transparent order-1 lg:order-2">
        <div className="w-full max-w-lg mx-auto bg-white p-10 md:p-14 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100">
          
          <div className="mb-12 text-center lg:text-left">
             <div className="w-20 h-20 bg-blue-50 text-blue-600 flex items-center justify-center rounded-[1.5rem] mb-8 mx-auto lg:mx-0 shadow-inner border border-blue-100">
               <Briefcase size={36} />
             </div>
             <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Partner Login</h2>
             <p className="text-slate-500 font-medium text-lg mt-3">Access your secure workspace and pipeline.</p>
          </div>

          {/* UPGRADED INPUT SIZES */}
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Corporate Email</label>
              <input 
                type="email" 
                required
                className="w-full py-5 px-6 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-2xl outline-none transition font-semibold text-lg text-slate-900 placeholder:text-gray-400"
                placeholder="name@brokerage.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Secure Password</label>
              <input 
                type="password" 
                required
                className="w-full py-5 px-6 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 rounded-2xl outline-none transition font-semibold text-lg text-slate-900 placeholder:text-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-5 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 border border-red-100">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-base hover:bg-black transition flex items-center justify-center gap-3 group shadow-2xl shadow-slate-900/20 disabled:opacity-50 mt-8"
            >
              {loading ? <Loader2 size={24} className="animate-spin"/> : <Briefcase size={24} className="group-hover:scale-110 transition" />}
              {loading ? 'Authenticating...' : 'Access Workspace'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}