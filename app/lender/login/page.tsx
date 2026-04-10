'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../AdminContext'; 
import { Lock, Shield, Search, Network, CheckCircle, Loader2, BarChart3, Building, Landmark, ArrowRight, ListChecks, FileCheck, LockKeyhole, Banknote } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function LenderLoginPage() {
  const { login } = useAdmin();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [inquiry, setInquiry] = useState({ name: '', email: '', role: '', intro: '' });
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/lender');
    } catch (err: any) {
      console.error(err);
      setError('Invalid Institutional Credentials');
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
        type: 'Lender / Institutional',
        submittedAt: new Date().toISOString()
      });
      setInquiryStatus('success');
      setInquiry({ name: '', email: '', role: '', intro: '' });
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

      {/* Left Side: Long-Form Enterprise Sales Pitch */}
      <div className="w-full lg:w-[55%] xl:w-3/5 p-6 md:p-12 lg:p-20 flex flex-col gap-20">
        
        {/* Section 1: Hero */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest mb-8 shadow-sm border border-amber-200">
            <Shield size={14} /> Institutional Capital Network
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
            Smarter Capital Allocation. <br/>
            <span className="text-amber-600">Premium Alternative Yield.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
            BorrowDirect is the industry-leading <strong className="text-slate-900">B2B Private Debt Marketplace</strong>. We provide family offices, MICs, and high-net-worth funds with direct access to algorithmically-vetted, real estate-backed alternative investments. Bypass traditional fragmentation and deploy capital with unprecedented transparency.
          </p>
        </div>

        {/* Section 2: Core Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition">
            <BarChart3 className="text-amber-500 mb-4" size={28} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Target Yield</p>
            <p className="text-4xl font-black text-slate-900">8-12%</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition">
            <Landmark className="text-amber-500 mb-4" size={28} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Max LTV</p>
            <p className="text-4xl font-black text-slate-900">75%</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition col-span-2 md:col-span-1 flex flex-col justify-center">
            <Building className="text-amber-500 mb-4" size={28} />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Asset Classes</p>
            <p className="text-xl font-black text-slate-900 leading-tight">1st & 2nd Mortgages<br/><span className="text-slate-500 text-base">Resi & Commercial</span></p>
          </div>
        </div>

        {/* Section 3: How it Works (New Section) */}
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-10">The BorrowDirect Workflow</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><ListChecks size={80}/></div>
                 <span className="w-8 h-8 bg-amber-100 text-amber-700 font-black rounded-full flex items-center justify-center mb-4">1</span>
                 <h3 className="text-xl font-black text-slate-900 mb-2">AI Deal Vetting</h3>
                 <p className="text-slate-600 font-medium">Every mortgage application is rigorously pre-screened by our proprietary AI underwriter for LTV limits and exit strategy viability.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><FileCheck size={80}/></div>
                 <span className="w-8 h-8 bg-amber-100 text-amber-700 font-black rounded-full flex items-center justify-center mb-4">2</span>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Submit Term Sheets</h3>
                 <p className="text-slate-600 font-medium">Review anonymized executive summaries on the live market board and submit your proposed interest rate and lender fee.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><LockKeyhole size={80}/></div>
                 <span className="w-8 h-8 bg-amber-100 text-amber-700 font-black rounded-full flex items-center justify-center mb-4">3</span>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Unlock Client Vault</h3>
                 <p className="text-slate-600 font-medium">Upon award, the firewall drops. Gain instant access to the borrower's cryptographic document vault, containing appraisals and credit reports.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><Banknote size={80}/></div>
                 <span className="w-8 h-8 bg-amber-100 text-amber-700 font-black rounded-full flex items-center justify-center mb-4">4</span>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Fund & Earn</h3>
                 <p className="text-slate-600 font-medium">Communicate directly with our underwriting team through your secure CRM timeline to finalize conditions and deploy capital.</p>
              </div>
           </div>
        </div>

        {/* Section 4: Deep Dive Features */}
        <div className="space-y-12 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-200">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8 border-b border-gray-100 pb-6">Enterprise Infrastructure</h2>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-amber-100 text-amber-600 p-4 rounded-2xl shrink-0"><Search size={28} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Eliminate Broker Fragmentation</h3>
              <p className="text-slate-600 leading-relaxed font-medium text-lg">Stop relying on messy email chains and disorganized PDF attachments. The BorrowDirect platform centralizes the entire origination, underwriting, and funding process into one highly secure pipeline.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="bg-amber-100 text-amber-600 p-4 rounded-2xl shrink-0"><Network size={28} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Protect Your Yield</h3>
              <p className="text-slate-600 leading-relaxed font-medium text-lg">Set your own rates and lender fees. IndiBrick charges a standard administration fee directly to the borrower—meaning 100% of your proposed yield goes straight to your fund's bottom line.</p>
            </div>
          </div>
        </div>

        {/* Section 5: The Lead Form */}
        <div className="bg-slate-900 border border-slate-800 p-8 md:p-14 rounded-[3rem] text-white shadow-2xl relative overflow-hidden mt-4">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-black tracking-tight mb-4">Partner With IndiBrick</h2>
            <p className="text-slate-400 mb-12 font-medium text-xl">Request institutional access to our private debt marketplace and syndication network.</p>
            
            {inquiryStatus === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-12 rounded-3xl text-center flex flex-col items-center justify-center gap-5">
                 <CheckCircle size={56}/>
                 <div>
                    <p className="font-black text-2xl uppercase tracking-widest mb-3">Request Received</p>
                    <p className="text-base text-green-200/80">Our Capital Markets team will reach out shortly to verify your fund credentials.</p>
                 </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Primary Contact</label>
                     <input required type="text" placeholder="John Doe" value={inquiry.name} onChange={e=>setInquiry({...inquiry, name: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-amber-500 outline-none transition text-lg text-white font-medium" />
                  </div>
                  <div>
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Corporate Email</label>
                     <input required type="email" placeholder="investments@fund.com" value={inquiry.email} onChange={e=>setInquiry({...inquiry, email: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-amber-500 outline-none transition text-lg text-white font-medium" />
                  </div>
                </div>
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Institution Name & Title</label>
                   <input required type="text" placeholder="e.g. Managing Partner at Apex Capital" value={inquiry.role} onChange={e=>setInquiry({...inquiry, role: e.target.value})} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-amber-500 outline-none transition text-lg text-white font-medium" />
                </div>
                <div>
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">Target Lending Criteria</label>
                   <textarea required placeholder="Target loan sizes, preferred positions, geographic locations..." value={inquiry.intro} onChange={e=>setInquiry({...inquiry, intro: e.target.value})} rows={4} className="w-full py-4 px-5 bg-black/40 border border-slate-700 rounded-xl focus:border-amber-500 outline-none transition text-lg text-white font-medium resize-none" />
                </div>
                <button type="submit" disabled={inquiryStatus === 'submitting'} className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-xl font-black uppercase tracking-widest text-base transition flex justify-center items-center gap-3 mt-6 shadow-xl">
                  {inquiryStatus === 'submitting' ? <Loader2 size={24} className="animate-spin"/> : <ArrowRight size={24}/>}
                  {inquiryStatus === 'submitting' ? 'Transmitting...' : 'Submit Access Request'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="pb-10 pt-10 text-center">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} IndiBrick Financial Inc. • 256-bit Enterprise Encryption</p>
        </div>

      </div>

      {/* Right Side: Sticky Login Form */}
      <div className="w-full lg:w-[45%] xl:w-2/5 p-6 md:p-12 lg:p-16 lg:sticky lg:top-24 h-max flex flex-col justify-start border-t lg:border-t-0 lg:border-l border-gray-200 bg-white lg:bg-transparent">
        <div className="w-full max-w-lg mx-auto bg-white p-10 md:p-14 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100">
          
          <div className="mb-12 text-center lg:text-left">
             <div className="w-20 h-20 bg-slate-900 text-amber-500 flex items-center justify-center rounded-[1.5rem] mb-8 mx-auto lg:mx-0 shadow-inner">
               <Lock size={36} />
             </div>
             <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Fund Login</h2>
             <p className="text-slate-500 font-medium text-lg mt-3">Access your secure capital deployment dashboard.</p>
          </div>

          {/* UPGRADED INPUT SIZES */}
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Corporate Email</label>
              <input 
                type="email" 
                required
                className="w-full py-5 px-6 bg-gray-50 border border-gray-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl outline-none transition font-semibold text-lg text-slate-900 placeholder:text-gray-400"
                placeholder="name@fund.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Secure Password</label>
              <input 
                type="password" 
                required
                className="w-full py-5 px-6 bg-gray-50 border border-gray-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl outline-none transition font-semibold text-lg text-slate-900 placeholder:text-gray-400"
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
              {loading ? <Loader2 size={24} className="animate-spin"/> : <Shield size={24} className="group-hover:scale-110 transition" />}
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}