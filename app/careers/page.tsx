
'use client';

import React from 'react';
import LeadForm from '../../components/LeadForm';
import { Users, Briefcase, Zap, Globe } from 'lucide-react';

export default function CareersPage() {
  const perks = [
    { icon: <Zap size={24} />, title: 'High Commission', desc: 'Industry-leading split structures for top performers.' },
    { icon: <Briefcase size={24} />, title: 'Lead Support', desc: 'Direct access to IndiBrick qualified partner leads.' },
    { icon: <Users size={24} />, title: 'Elite Network', desc: 'Work alongside verified GTA Real Estate and Legal partners.' },
    { icon: <Globe size={24} />, title: 'Growth Potential', desc: 'Pathways to management and specialized advisory roles.' },
  ];

  return (
    <div className="bg-white">
      <section className="bg-black text-white py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-black mb-6">Join the IndiBrick Team</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            We're building the future of GTA home ownership. Join a mission-driven team of mortgage and property specialists.
          </p>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {perks.map((perk, i) => (
            <div key={i} className="p-8 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="mb-4 text-black">{perk.icon}</div>
              <h3 className="font-bold text-lg mb-2">{perk.title}</h3>
              <p className="text-gray-500 text-sm">{perk.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-black">Open Positions</h2>
            <div className="space-y-4">
               {['Senior Mortgage Advisor', 'Junior Mortgage Agent', 'Client Success Manager', 'Partner Relations Lead'].map((pos, i) => (
                 <div key={i} className="p-6 border border-gray-200 rounded-xl flex justify-between items-center group hover:border-black cursor-pointer transition">
                    <div>
                      <h4 className="font-bold text-lg text-black">{pos}</h4>
                      <p className="text-sm text-gray-500">Full-Time • GTA / Remote Friendly</p>
                    </div>
                    <span className="text-black font-bold group-hover:underline">Apply</span>
                 </div>
               ))}
            </div>
            <div className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-200">
               <h3 className="font-bold text-xl mb-4 text-black">Don't see a fit?</h3>
               <p className="text-gray-600 mb-6">We're always looking for talented individuals. Send us your resume anyway and we'll keep you on file for future opportunities.</p>
            </div>
          </div>

          <div>
             <LeadForm 
                type="General" 
                title="Apply Today" 
                subtitle="Upload your resume and tell us why you're a great fit for IndiBrick."
             />
          </div>
        </div>
      </section>
    </div>
  );
}
