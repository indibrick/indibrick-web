'use client';

import React from 'react';
import Link from 'next/link';
import { Property } from '../types';
import { Bed, Bath, MapPin, ArrowRight, Zap } from 'lucide-react';

interface ListingCardProps {
  property: Property;
  onViewDetails?: (property: Property) => void;
}

export default function ListingCard({ property, onViewDetails }: ListingCardProps) {
  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-amber-500 transition-all duration-300 hover:shadow-2xl flex flex-col h-full">
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition z-10" />
        <img 
          src={property.imageUrl} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
        />
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-black">
          {property.purpose}
        </div>
        
        {/* Custom VIP Badge if it's a funnel page */}
        {property.landingPageUrl && (
          <div className="absolute top-4 right-4 z-20 bg-amber-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
             <Zap size={12} /> VIP Access
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-20 text-white">
           <p className="text-2xl font-black drop-shadow-lg">${property.price.toLocaleString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-black uppercase tracking-tight mb-1 group-hover:text-gray-600 transition">{property.title}</h3>
        <div className="flex items-center gap-1 text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">
           <MapPin size={12} /> {property.city} • {property.address}
        </div>

        <div className="flex gap-4 mb-6 border-t border-gray-100 pt-4">
           <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <Bed size={16} /> {property.bedrooms} Bed
           </div>
           <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <Bath size={16} /> {property.bathrooms} Bath
           </div>
        </div>

        {/* SMART ROUTING ACTION BUTTON */}
        {property.landingPageUrl ? (
           <Link 
             href={property.landingPageUrl}
             className="mt-auto w-full py-3 rounded-xl border border-amber-500 bg-amber-50 text-amber-600 font-black uppercase tracking-widest text-xs hover:bg-amber-500 hover:text-black transition flex items-center justify-center gap-2"
           >
             View Details <ArrowRight size={14} />
           </Link>
        ) : (
           <button 
             onClick={() => onViewDetails && onViewDetails(property)}
             className="mt-auto w-full py-3 rounded-xl border border-black text-black font-black uppercase tracking-widest text-xs hover:bg-black hover:text-white transition flex items-center justify-center gap-2"
           >
             View Details <ArrowRight size={14} />
           </button>
        )}
      </div>
    </div>
  );
}