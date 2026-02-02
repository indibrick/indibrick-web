'use client';

import React, { useState } from 'react';
import { Property } from '../types';
import ListingCard from './ListingCard';
import ListingModal from './ListingModal';
import { Search, AlertCircle } from 'lucide-react';

interface ListingsClientProps {
  initialListings: Property[];
}

export default function ListingsClient({ initialListings }: ListingsClientProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <>
      <section className="container mx-auto px-6 py-12 -mt-16 relative z-20">
        {/* Stats Bar to give "High Volume" Impression */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <Search size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Market Coverage</p>
                    <p className="text-lg font-black text-black">Scanning 14,500+ Ontario Projects</p>
                </div>
            </div>
            <div className="h-px w-full md:w-px md:h-12 bg-gray-100"></div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Curated Selection</p>
                <p className="text-lg font-black text-black">Top {initialListings.length} "IndiBrick Select" Picks</p>
            </div>
        </div>

        {/* Listings Grid */}
        {initialListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {initialListings.map((property) => (
              <ListingCard 
                key={property.id} 
                property={property} 
                onViewDetails={(prop) => setSelectedProperty(prop)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-gray-100">
             <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
             <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-2">Inventory Loading</h3>
             <p className="text-gray-500">Connecting to partner network...</p>
          </div>
        )}
      </section>

      {/* The Popup Modal */}
      {selectedProperty && (
        <ListingModal 
          property={selectedProperty} 
          isOpen={!!selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}
    </>
  );
}