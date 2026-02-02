import React from 'react';
import { PRE_CON_CITIES } from '../../../data/cityData';
import { notFound } from 'next/navigation';
import PreConCityClient from '../../../components/PreConCityClient';

// FORCE DYNAMIC RENDERING FOR SSR
export const dynamic = 'force-dynamic';

export default function PreConCityPage({ params }: { params: { city: string } }) {
  const citySlug = params.city;
  const cityData = PRE_CON_CITIES.find(c => c.slug === citySlug);
  
  if (!cityData) {
      return notFound();
  }

  return (
    <div className="bg-white">
      <PreConCityClient cityData={cityData} />
    </div>
  );
}