'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Download, CheckCircle } from 'lucide-react';
import { LeadService } from '../services/LeadService';

export default function ExitPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'offer' | 'success'>('offer');

  useEffect(() => {
    // Only run on desktop/large screens where mouse movements exist
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasTriggered) {
        // Check if we already showed it this session (cookie/localstorage)
        const alreadySeen = sessionStorage.getItem('exit_popup_seen');
        if (!alreadySeen) {
          setIsVisible(true);
          setHasTriggered(true);
          sessionStorage.setItem('exit_popup_seen', 'true');
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasTriggered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Capture Lead
    await LeadService.submitLead({
      name: 'Exit Intent Capture',
      email: email,
      phone: '000-000-0000',
      serviceNeeded: 'General',
      city: 'Ontario',
      message: 'User requested 2026 Insider Rate PDF via Exit Pop',
      consent: true
    });
    setStep('success');
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] max-w-lg w-full relative overflow-hidden shadow-2xl transform transition-all scale-100">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
        >
          <X size={20} />
        </button>

        {step === 'offer' ? (
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
               <FileText size={40} />
            </div>
            
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Wait! One Last Thing.</h2>
            <p className="text-gray-500 mb-8 font-medium">
               Don't leave without the data. Get our <strong>"2026 Insider Rate Sheet"</strong> sent to your inbox. It lists the unadvertised rates banks don't post online.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
               <input 
                 type="email" 
                 required
                 placeholder="Enter your email address..." 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center outline-none focus:ring-2 focus:ring-black"
               />
               <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition flex items-center justify-center gap-2">
                 <Download size={18} /> Send Me The PDF
               </button>
            </form>
            <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">No spam. Unsubscribe anytime.</p>
          </div>
        ) : (
          <div className="p-16 text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-tight">On Its Way!</h3>
            <p className="text-gray-500 mt-2">Check your inbox in 2 minutes.</p>
          </div>
        )}
      </div>
    </div>
  );
}