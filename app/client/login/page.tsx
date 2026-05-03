'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../../../firebase';
import { Lock, Loader2, ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ClientLoginPage() {
  const router = useRouter();
  const auth = getAuth(app);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/client/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          setError('Incorrect email or password. Check your welcome email.');
      } else {
          setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first, then click Forgot Password.");
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError("Failed to send reset email. Ensure your email address is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <style dangerouslySetInnerHTML={{__html: `header, footer { display: none !important; }`}} />

      {/* Left: Branding & Info */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white p-20 flex-col justify-between relative overflow-hidden">
         <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] -ml-40 -mt-40 pointer-events-none"></div>
         
         <div className="relative z-10">
            <h1 className="text-2xl font-black uppercase tracking-tighter mb-12">IndiBrick</h1>
            <h2 className="text-5xl font-black tracking-tight mb-6 leading-tight">
               Your Secure <br/><span className="text-blue-400">Financial Vault.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">
               Track your mortgage approval, upload sensitive documents, and view your closing timeline in a secure, TLS 1.3 encrypted environment.
            </p>
         </div>

         <div className="relative z-10 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm max-w-sm">
            <div className="flex items-center gap-3 mb-2">
               <ShieldCheck className="text-green-400" size={20} />
               <p className="font-bold text-sm">Bank-Level Security</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Your financial data is encrypted and strictly processed according to Canadian FINTRAC compliance standards.</p>
         </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
         
         <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 relative z-10">
            <div className="text-center mb-10">
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
                  <Lock size={28} />
               </div>
               <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">Client Portal</h3>
               <p className="text-sm text-slate-500 font-medium mt-2">Log in using the credentials emailed to you.</p>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 border border-red-100"><AlertTriangle size={14} className="shrink-0"/> {error}</div>}
            {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 border border-green-100"><CheckCircle size={14} className="shrink-0"/> {successMsg}</div>}

            <form onSubmit={handleLogin} className="space-y-6">
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                  <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500 focus:bg-white transition text-sm" placeholder="name@example.com" />
               </div>
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                     <button type="button" onClick={handleResetPassword} disabled={loading} className="text-[9px] font-bold text-blue-600 hover:text-slate-900 transition">
                        Forgot / Change Password?
                     </button>
                  </div>
                  <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-blue-500 focus:bg-white transition text-sm" placeholder="••••••••" />
               </div>
               <button disabled={loading} className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-xl font-black uppercase tracking-widest text-xs transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                  {loading ? 'Authenticating...' : 'Secure Login'}
               </button>
            </form>
         </div>
      </div>
    </div>
  );
}