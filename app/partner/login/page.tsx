'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../../../AdminContext'; // Adjust path if necessary (../../AdminContext or @/AdminContext)
import { Lock, Briefcase, ArrowRight } from 'lucide-react';

export default function PartnerLoginPage() {
  const { login } = useAdmin();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // Login successful, send them to the main portal
      router.push('/partner');
    } catch (err: any) {
      console.error(err);
      setError('Invalid Email or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      
      {/* Left Side: Brand & Vision */}
      <div className="hidden md:flex w-1/2 bg-black text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">IndiBrick Partner Network</h1>
          <p className="text-gray-400 max-w-md">
            The central hub for top-tier Realtors, Lawyers, and Financial professionals. Track deals, manage referrals, and access exclusive inventory.
          </p>
        </div>
        <div className="z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Authorized Access Only</p>
          <p className="text-xs text-gray-600 mt-1">© 2026 Indibrick Inc.</p>
        </div>
        
        {/* Abstract Pattern */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-gray-900 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-gray-800 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-24 bg-gray-50">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          
          <div className="mb-10">
             <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-xl mb-6">
               <Briefcase size={24} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Partner Login</h2>
             <p className="text-slate-500 font-medium mt-2">Enter your credentials to access the workspace.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-xl outline-none transition font-bold"
                placeholder="name@agency.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Password</label>
              <input 
                type="password" 
                required
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-black rounded-xl outline-none transition font-bold"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">
                <Lock size={16} /> {error}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition flex items-center justify-center gap-2 group"
            >
              {loading ? 'Authenticating...' : (
                <>Enter Portal <ArrowRight size={18} className="group-hover:translate-x-1 transition" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Need access? <a href="/contact" className="text-black font-bold hover:underline">Contact Indibrick HQ</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}