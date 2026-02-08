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
      <div className="bg-white p-8 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-gray-100 text-center animate-fade-in">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
           <ShieldCheck className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">Request Secured</h3>
        <p className="text-gray-500 font-medium text-sm">An advisor will contact you shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-xl border border-gray-100">
      <div className="mb-6 md:mb-10">
        <h3 className="text-2xl md:text-3xl font-black text-black mb-2 uppercase tracking-tight leading-none">{title}</h3>
        <p className="text-gray-500 text-xs md:text-sm font-medium">{subtitle}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div>
          <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 md:mb-2">Priority Selection</label>
          <div className="relative">
            <select
              name="serviceNeeded"
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-gray-50 border-none rounded-xl font-bold text-sm text-black focus:ring-2 focus:ring-black transition outline-none appearance-none"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 md:mb-2">Your Name</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-gray-50 border-none rounded-xl font-bold text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:font-medium"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 md:mb-2">City</label>
            <input
              type="text"
              name="city"
              required
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-gray-50 border-none rounded-xl font-bold text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:font-medium"
              placeholder="e.g. Toronto"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 md:mb-2">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-gray-50 border-none rounded-xl font-bold text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:font-medium"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 md:mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full px-4 py-3 md:px-5 md:py-4 bg-gray-50 border-none rounded-xl font-bold text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:font-medium"
              placeholder="(000) 000-0000"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-1 md:mb-2">Brief Summary</label>
          <textarea
            name="message"
            rows={3}
            className="w-full px-4 py-3 md:px-5 md:py-4 bg-gray-50 border-none rounded-xl font-bold text-sm text-black focus:ring-2 focus:ring-black outline-none placeholder:font-medium"
            placeholder="Tell us what you need..."
            value={formData.message}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="flex items-start gap-3 py-4 border-y border-gray-100">
          <input 
            type="checkbox" 
            name="consent"
            id="consent"
            checked={formData.consent}
            onChange={handleChange}
            className="mt-0.5 w-5 h-5 text-black border-gray-300 rounded-lg focus:ring-black shrink-0"
          />
          <label htmlFor="consent" className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight cursor-pointer select-none">
            I consent to be contacted by IndiBrick and its RIBO licensed partners.
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={16} />
            <p className="text-red-600 text-[10px] font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-black text-white font-black uppercase text-xs md:text-sm tracking-[0.2em] py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-gray-800 transition shadow-xl flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <RefreshCcw className="animate-spin" size={16} />
              Sending...
            </>
          ) : (
            <>
              <Zap size={16} />
              Get Verified Quote
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LeadForm;