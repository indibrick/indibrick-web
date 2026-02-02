import React from 'react';
import { Metadata } from 'next';
import { Shield, Lock, FileText, Eye, Share2, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | IndiBrick Real Estate Ecosystem',
  description: 'How IndiBrick protects your financial data and how we share information within our ecosystem of Mortgages, Real Estate, and Insurance partners.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-4xl">
        
        {/* Header */}
        <div className="mb-12 border-b border-gray-100 pb-8">
           <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              <Shield size={12} className="text-blue-400" /> Data Protection
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tight">Privacy Policy</h1>
           <p className="text-gray-500 font-medium">
             Last Updated: <span className="text-slate-900 font-bold">January 2026</span>
           </p>
        </div>
        
        <div className="prose prose-lg max-w-none text-gray-600">
          
          {/* 1. Introduction */}
          <section className="mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
               <Globe size={24} className="text-blue-600"/> 1. The Ecosystem Model
            </h2>
            <p>
              <strong>IndiBrick</strong> ("We", "Us", "The Platform") operates as an integrated Real Estate Operating System. 
              We are partnered with <strong>Dream Home + Life</strong> and powered by <strong>Pineapple Financial</strong> for mortgage origination.
            </p>
            <p>
              Unlike traditional brokerage sites, IndiBrick acts as a central hub connecting Mortgage Financing, Real Estate Acquisition, 
              Insurance Protection, and Wealth Strategy. This policy outlines how your data moves securely between these pillars to provide 
              a seamless, all-in-one experience.
            </p>
          </section>

          {/* 2. Collection */}
          <section className="mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
               <FileText size={24} className="text-blue-600"/> 2. Information We Collect
            </h2>
            <p>To provide accurate financial engineering and quotes, we collect:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-blue-600">
               <li><strong>Identity Data:</strong> Name, email, phone number, and government ID (when required for FINTRAC compliance).</li>
               <li><strong>Financial Data:</strong> Income, debts, assets, credit score approximations, and down payment sources.</li>
               <li><strong>Property Data:</strong> Addresses, property values, mortgage balances, and renovation requirements.</li>
               <li><strong>Digital Data:</strong> IP addresses, calculator inputs, and behavior on our AI Market Intelligence tools.</li>
            </ul>
          </section>

          {/* 3. Usage */}
          <section className="mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
               <Eye size={24} className="text-blue-600"/> 3. How We Use Your Data
            </h2>
            <p>We use your data to "Engineer" your financial strategy. This includes:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-blue-600">
               <li>Calculating accurate mortgage affordability and qualification (Stress Test).</li>
               <li>Generating AI-driven property valuation and market reports.</li>
               <li>Determining eligibility for insurance bundles (Home + Auto) to lower premiums.</li>
               <li>Structuring tax-efficient wealth strategies (e.g., Smith Manoeuvre, Corporate Insurance).</li>
            </ul>
          </section>

          {/* 4. Sharing (Crucial for Ecosystem) */}
          <section className="mb-12 bg-slate-50 p-8 rounded-3xl border border-gray-100">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
               <Share2 size={24} className="text-blue-600"/> 4. Sharing with Vetted Partners
            </h2>
            <p className="mb-4">
              IndiBrick is an aggregator. To fulfill your requests (e.g., "Get a Renovation Quote" or "Find a Realtor"), 
              we share necessary data with our <strong>Vetted Partner Network</strong>. We do not sell data to cold-callers.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
               <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase">Mortgage Lenders</h3>
                  <p className="text-xs">Banks, Credit Unions, and Private Lenders (via Pineapple Financial) to secure your loan.</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase">Realtor Network</h3>
                  <p className="text-xs">Top 1% Agents matched to your specific neighborhood profile for buying/selling.</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase">Insurers</h3>
                  <p className="text-xs">Licensed Insurance Brokerages to provide bundled Home, Auto, and Life quotes.</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase">Contractors</h3>
                  <p className="text-xs">Licensed renovation pros, only when you request a project estimate.</p>
               </div>
            </div>
          </section>

          {/* 5. Security & CASL */}
          <section className="mb-12">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
               <Lock size={24} className="text-blue-600"/> 5. Security & CASL Compliance
            </h2>
            <p>
               <strong>Security:</strong> All data transmitted via IndiBrick is encrypted using TLS 1.3 standards. We utilize Google Cloud secure infrastructure to store sensitive information.
            </p>
            <p className="mt-4">
               <strong>CASL (Anti-Spam):</strong> By submitting a form (Calculator, Contact, or Lead Form), you provide express consent to receive electronic communications from IndiBrick and the specific partners required to fulfill your request. You may unsubscribe at any time.
            </p>
          </section>

          {/* 6. Contact */}
          <section>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">6. Contact & Compliance Officer</h2>
            <p>
              If you wish to withdraw consent or request a copy of your data, please contact our privacy officer:
            </p>
            <div className="mt-6 p-6 bg-slate-900 text-white rounded-2xl inline-block pr-12">
               <p className="font-bold uppercase tracking-widest text-xs text-gray-400 mb-1">Email</p>
               <a href="mailto:privacy@indibrick.ca" className="text-xl font-bold hover:text-blue-400 transition">privacy@indibrick.ca</a>
               
               <p className="font-bold uppercase tracking-widest text-xs text-gray-400 mb-1 mt-6">Head Office</p>
               <p className="text-lg font-bold">60 Pippin Road, Unit 34,<br/>Vaughan, ON L4K 4M8</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}