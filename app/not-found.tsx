
import React from 'react';
import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8">
        <AlertTriangle size={48} className="text-white" />
      </div>
      <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">404 Error</h1>
      <p className="text-gray-400 text-xl font-medium mb-12">The page you are looking for has been moved or does not exist.</p>
      <Link href="/" className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition">
        Return to Headquarters
      </Link>
    </div>
  );
}
