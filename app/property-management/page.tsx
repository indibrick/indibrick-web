
'use client';

import React from 'react';
import LeadForm from '../../components/LeadForm';
import { Building2, UserCheck, TrendingUp } from 'lucide-react';

export default function PropertyManagementPage() {
  return (
    <div className="bg-white">
      <section className="bg-black text-white py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">Passive Ownership</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Turn your investment property into a hands-off asset.
        </p>
      </section>

      <section className="py-24 container mx-auto px-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-8">
               <UserCheck className="w-12 h-12 mx-auto mb-4 text-black" />
               <h3 className="font-black text-xl mb-2">Tenant Vetting</h3>
               <p className="text-gray-500">Rigorous credit and background checks to ensure reliable income.</p>
            </div>
            <div className="text-center p-8">
               <Building2 className="w-12 h-12 mx-auto mb-4 text-black" />
               <h3 className="font-black text-xl mb-2">24/7 Maintenance</h3>
               <p className="text-gray-500">We handle the midnight calls so you don't have to.</p>
            </div>
            <div className="text-center p-8">
               <TrendingUp className="w-12 h-12 mx-auto mb-4 text-black" />
               <h3 className="font-black text-xl mb-2">Rent Collection</h3>
               <p className="text-gray-500">Automated deposits directly to your account.</p>
            </div>
         </div>

         <div className="max-w-3xl mx-auto">
            <LeadForm type="General" title="Get a Management Quote" subtitle="Property Management services provided by our licensed third-party partners." />
         </div>
      </section>
    </div>
  );
}
