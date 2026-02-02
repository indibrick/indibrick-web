import React from 'react';
import { Metadata } from 'next';
import LeadForm from '../../components/LeadForm';
import { ShieldCheck, Heart, Umbrella, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Insurance & Financial Protection Services for Homeowners | IndiBrick',
  description: 'Life and critical illness insurance solutions designed to protect families and homeowners. Speak with licensed insurance advisors today.',
};

export default function InsurancePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-black text-white py-24 md:py-32 relative overflow-hidden border-b border-white/10">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
              <ShieldCheck size={14} /> Asset Security
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-8 leading-tight tracking-tighter uppercase">
              Insurance & Financial <br /> Protection Services
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed max-w-2xl font-medium">
              We secure your financial foundation. Comprehensive life and critical illness coverage designed to protect your family, mortgage, and lifestyle.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          
          {/* Left Column: Content */}
          <div className="space-y-12">
            
            {/* Problem Awareness */}
            <div>
              <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">Protect Your Family, Not Just Your Mortgage</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Real financial protection is about ownership and flexibility. Many homeowners rely solely on lender-provided insurance, which often decreases in value while premiums remain static. We believe in personal insurance policies that you own, control, and can take with you, ensuring your family has a safety net that adapts to your life, not just your debt.
              </p>
            </div>

            {/* Services Offered */}
            <div className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
              <h2 className="text-2xl font-black text-black mb-8 uppercase tracking-tight">How We Help Protect Families & Homeowners</h2>
              <ul className="space-y-6">
                {[
                  'Term life insurance planning',
                  'Critical illness insurance education',
                  'Mortgage protection alternatives',
                  'Family income protection strategies'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="bg-black text-white p-2 rounded-lg"><Heart size={16} /></div>
                    <span className="font-bold text-gray-800">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Advisor Positioning (Mandatory) */}
            <div className="border-l-4 border-black pl-8 py-2">
              <h2 className="text-xl font-black text-black mb-4 uppercase tracking-tight flex items-center gap-2">
                <Users size={20} /> Guidance From Our In-House Licensed Insurance Advisors
              </h2>
              <p className="text-gray-600 font-medium leading-relaxed">
                Our in-house licensed insurance advisors help clients understand coverage options and choose solutions aligned with their family and financial goals.
              </p>
            </div>

            {/* Compliance Disclosure */}
            <div className="bg-gray-100 p-6 rounded-2xl">
              <div className="flex items-start gap-3">
                <Umbrella className="text-gray-400 shrink-0" size={20} />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed">
                  DISCLOSURE: Insurance products are offered through licensed professionals. Coverage is subject to underwriting and policy terms.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Lead Form */}
          <div className="lg:sticky lg:top-24 h-fit">
            <LeadForm 
              type="Insurance"
              title="Get Protected"
              subtitle="Speak with an Insurance Advisor about your coverage options."
            />
          </div>

        </div>
      </section>
    </div>
  );
}