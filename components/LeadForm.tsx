'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LeadService } from '../services/LeadService';
import { ShieldCheck, Zap, AlertTriangle, RefreshCcw, ChevronDown, Lock } from 'lucide-react';

interface LeadFormProps {
  type?: 'General' | 'Mortgage' | 'Realtor' | 'Legal' | 'Contractor' | 'Pre-Con' | 'Commercial' | 'Insurance' | 'Investment' | 'GeneralInsurance';
  title?: string;
  subtitle?: string;
  ctaText?: string; 
}

const LeadForm: React.FC<LeadFormProps> = ({ 
  type = 'General', 
  title = 'Initiate Strategy', 
  subtitle = 'One form. One team. Complete 360° solution.',
  ctaText = 'Submit Request' 
}) => {
  const currentPath = usePathname() || '';
  const isCityPage = currentPath.includes('/mortgage-real-estate/') || currentPath.includes('/pre-construction-condos/');
  const pathCity = isCityPage ? currentPath.split('/')[2]?.replace(/-/g, ' ').toUpperCase() : '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceNeeded: type === 'General' ? 'Mortgage' : type,
    city: pathCity || '',
    message: '',
    consent: false
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Consent Check
    if (!formData.consent) {
      setError('Please confirm consent to proceed.');
      return;
    }

    // 2. STRICT 10-DIGIT PHONE VALIDATION
    const cleanedPhone = formData.phone.replace(/\D/g, ''); 
    if (cleanedPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    // 3. STRICT EMAIL VALIDATION (Regex)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address (e.g., name@domain.com).');
      return;
    }

    setError('');
    setLoading(true);
    
    const result = await LeadService.submitLead({
      ...formData,
      phone: cleanedPhone, 
      serviceNeeded: formData.serviceNeeded
    });

    if (result.success) {
      setLoading(false);
      setSubmitted(true);
      // Google Ads Conversion Event
      if (typeof window !== 'undefined' && (window as any).gtag) {
         (window as any).gtag('event', 'generate_lead', { 'event_category': 'form', 'event_label': 'PPC_Landing' });
      }
      setTimeout(() => {
        window.location.href = '/thank-you';
      }, 1000);
    } else {
      setLoading(false);
      setError('Connection failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    let value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;

    // REAL-TIME PHONE FORMATTER
    if (name === 'phone' && typeof value === 'string') {
      const cleaned = value.replace(/\D/g, ''); 
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      
      if (match) {
        value = !match[2] 
          ? match[1] 
          : `(${match[1]}) ${match[2]}` + (match[3] ? `-${match[3]}` : '');
      }
      
      if (value.length > 14) return;
    }

    setFormData({ ...formData, [name]: value });
    if (error) setError(''); 
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-gray-100 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-xl">
           <ShieldCheck className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight mb-3 text-slate-900">Request Secured</h3>
        <p className="text-gray-500 font-medium">An advisor will contact you shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-2xl border border-gray-100 relative overflow-hidden">
      
      {/* Decorative Top Line */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

      <div className="mb-8">
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">{title}</h3>
        <p className="text-gray-500 text-sm font-medium leading-relaxed">{subtitle}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Priority Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">I am interested in</label>
          <div className="relative group">
            <select
              name="serviceNeeded"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent transition outline-none appearance-none cursor-pointer"
              value={formData.serviceNeeded}
              onChange={handleChange}
            >
              <option value="Mortgage">Mortgage Financing</option>
              <option value="Realtor">Buying / Selling Real Estate</option>
              <option value="Pre-Con">Pre-Construction Investment</option>
              <option value="Commercial">Commercial Lending</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-blue-600 transition" size={18} />
          </div>
        </div>

        {/* Row 1: Name & City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent outline-none transition placeholder:text-gray-300"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">City</label>
            <input
              type="text"
              name="city"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent outline-none transition placeholder:text-gray-300"
              placeholder="e.g. Toronto"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Row 2: Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent outline-none transition placeholder:text-gray-300"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent outline-none transition placeholder:text-gray-300"
              placeholder="(416) 555-0199"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Goal / Strategy</label>
          <textarea
            name="message"
            rows={2}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-base text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent outline-none transition placeholder:text-gray-300 resize-none"
            placeholder="I am looking to buy a property..."
            value={formData.message}
            onChange={handleChange}
          ></textarea>
        </div>

        {/* Consent & Submit */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-start gap-3 mb-6">
            <input 
              type="checkbox" 
              name="consent"
              id="consent"
              checked={formData.consent}
              onChange={handleChange}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-600 shrink-0 cursor-pointer"
            />
            <label htmlFor="consent" className="text-[10px] md:text-xs text-gray-500 font-medium leading-relaxed cursor-pointer select-none">
              I authorize IndiBrick Financial to contact me via email/phone regarding this request.
            </label>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-xl mb-4 flex items-center gap-3 animate-shake">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <p className="text-red-700 text-xs font-bold uppercase tracking-wide">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white font-black uppercase text-xs md:text-sm tracking-[0.2em] py-5 rounded-2xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-3 ${loading ? 'opacity-80 cursor-wait' : ''}`}
          >
            {loading ? (
              <>
                <RefreshCcw className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                {ctaText} <Zap size={18} className="text-yellow-400 fill-yellow-400" />
              </>
            )}
          </button>
          
          <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
             <Lock size={12}/> 256-Bit SSL Secured & Private
          </p>
        </div>

      </form>
    </div>
  );
};

export default LeadForm;