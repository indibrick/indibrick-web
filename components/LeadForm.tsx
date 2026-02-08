'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LeadService } from '../services/LeadService';
import { ShieldCheck, Zap, AlertTriangle, RefreshCcw, ChevronDown } from 'lucide-react';

interface LeadFormProps {
  type?: 'General' | 'Mortgage' | 'Realtor' | 'Legal' | 'Contractor' | 'Pre-Con' | 'Commercial' | 'Insurance' | 'Investment' | 'GeneralInsurance';
  title?: string;
  subtitle?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ 
  type = 'General', 
  title = 'Initiate Strategy', 
  subtitle = 'One form. One team. Complete 360° solution.' 
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
    if (!formData.consent) {
      setError('Regulatory consent is required.');
      return;
    }
    setError('');
    setLoading(true);
    
    const result = await LeadService.submitLead({
      ...formData,
      serviceNeeded: formData.serviceNeeded
    });

    if (result.success) {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        window.location.href = '/thank-you';
      }, 1000);
    } else {
      setLoading(false);
      setError('Connection failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 text-center animate-fade-in">
        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4">
           <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight mb-2">Request Secured</h3>
        <p className="text-gray-500 font-medium text-sm">An advisor will contact you shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-gray-100">
      <div className="mb-5 md:mb-10 text-center md:text-left">
        <h3 className="text-xl md:text-3xl font-black text-black mb-1 md:mb-2 uppercase tracking-tight leading-none">{title}</h3>
        <p className="text-gray-500 text-[10px] md:text-sm font-medium">{subtitle}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6">
        
        {/* Priority Selection */}
        <div>
          <label className="block text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Priority Selection</label>
          <div className="relative">
            <select
              name="serviceNeeded"
              // text-base on mobile prevents iOS zoom, text-sm on desktop looks cleaner
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-base md:text-sm text-black focus:ring-2 focus:ring-black transition outline-none appearance-none"
              value={formData.serviceNeeded}
              onChange={handleChange}
            >
              <option value="Mortgage">Mortgage Financing</option>
              <option value="GeneralInsurance">Home/Auto Insurance</option>
              <option value="Insurance">Life Insurance</option>
              <option value="Commercial">Commercial Lending</option>
              <option value="Realtor">Real Estate (Buy/Sell)</option>
              <option value="Legal">Legal Services</option>
              <option value="Pre-Con">Pre-Construction</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Row 1: Name & City (Split on mobile to save vertical space) */}
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <div className="col-span-1">
            <label className="block text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-base md:text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:text-gray-300"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">City</label>
            <input
              type="text"
              name="city"
              required
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-base md:text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:text-gray-300"
              placeholder="e.g. Toronto"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Row 2: Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          <div>
            <label className="block text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-base md:text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:text-gray-300"
              placeholder="name@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-base md:text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:text-gray-300"
              placeholder="(000) 000-0000"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-[9px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Goal</label>
          <textarea
            name="message"
            rows={2} // Reduced rows on mobile default
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-base md:text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:text-gray-300 resize-none"
            placeholder="I want to buy/refinance..."
            value={formData.message}
            onChange={handleChange}
          ></textarea>
        </div>

        {/* Consent & Submit */}
        <div className="pt-2">
          <div className="flex items-start gap-2 mb-4">
            <input 
              type="checkbox" 
              name="consent"
              id="consent"
              checked={formData.consent}
              onChange={handleChange}
              className="mt-0.5 w-4 h-4 text-black border-gray-300 rounded focus:ring-black shrink-0"
            />
            <label htmlFor="consent" className="text-[9px] text-gray-400 font-bold uppercase tracking-wide leading-tight cursor-pointer">
              Consent to contact.
            </label>
          </div>

          {error && (
            <div className="bg-red-50 p-2 rounded-lg mb-3 flex items-center gap-2">
              <AlertTriangle className="text-red-500 shrink-0" size={14} />
              <p className="text-red-600 text-[9px] font-black uppercase">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-black text-white font-black uppercase text-xs tracking-[0.2em] py-4 rounded-xl hover:bg-gray-900 transition shadow-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? <RefreshCcw className="animate-spin" size={14} /> : <Zap size={14} />}
            {loading ? 'Sending...' : 'Get Quote'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default LeadForm;