'use client';

import React from 'react';
import { X, MapPin, Bed, Bath, Home, CheckCircle } from 'lucide-react';
import { Property } from '../types';
import LeadForm from './LeadForm';

interface ListingModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export default function ListingModal({ property, isOpen, onClose }: ListingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Dark Overlay */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[800px] animate-fade-in-up">
        
        {/* Close Button (Mobile & Desktop) */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 bg-white/50 hover:bg-white text-black p-2 rounded-full transition"
        >
          <X size={20} />
        </button>

        {/* Left Column: Visuals & Info */}
        <div className="w-full md:w-1/2 bg-gray-50 flex flex-col overflow-y-auto">
           <div className="relative h-64 md:h-80 shrink-0">
             <img 
               src={property.imageUrl} 
               alt={property.title} 
               className="w-full h-full object-cover"
             />
             <div className="absolute bottom-4 left-4 bg-black text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                {property.purpose}
             </div>
           </div>

           <div className="p-8">
              <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">{property.title}</h2>
              <p className="text-xl font-bold text-gray-900 mb-6">${property.price.toLocaleString()}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                   <Bed size={18} /> {property.bedrooms} Bedrooms
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                   <Bath size={18} /> {property.bathrooms} Bathrooms
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                   <Home size={18} /> {property.type}
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                   <MapPin size={18} /> {property.city}
                </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Analysis</h3>
                 <p className="text-gray-600 leading-relaxed text-sm">
                   {property.description || `This exclusive ${property.purpose.toLowerCase()} opportunity in ${property.city} represents a prime investment. Featuring ${property.bedrooms} bedrooms and premium finishes, it is situated in a high-growth corridor perfect for appreciation.`}
                 </p>
                 <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-bold text-gray-700"><CheckCircle size={14} className="text-green-500"/> Verified Allocation</li>
                    <li className="flex items-center gap-2 text-xs font-bold text-gray-700"><CheckCircle size={14} className="text-green-500"/> Developer Approved</li>
                    <li className="flex items-center gap-2 text-xs font-bold text-gray-700"><CheckCircle size={14} className="text-green-500"/> Assignment Clauses Available</li>
                 </ul>
              </div>
           </div>
        </div>

        {/* Right Column: Lead Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white overflow-y-auto">
           <div className="mb-6">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Request Access</h3>
              <p className="text-gray-500 text-sm">Connect with a partner agent to view floor plans, deposit structure, and secure this unit.</p>
           </div>
           
           {/* Reuse LeadForm but pass specific title/subtitle if needed */}
           <LeadForm 
             type="Listing Inquiry" 
             title="" 
             subtitle="" 
           />
           <p className="text-[10px] text-gray-400 text-center mt-6">
             By submitting, you agree to our Terms of Use. VOW Data provided by Indibrick Network.
           </p>
        </div>

      </div>
    </div>
  );
}