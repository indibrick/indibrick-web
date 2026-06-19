import React from 'react';
import { PRE_CON_CITIES } from '../../../data/cityData';
import { notFound } from 'next/navigation';
import PreConCityClient from '../../../components/PreConCityClient';

// ISR — re-generate each city page at most once an hour.
export const revalidate = 3600;

// Pre-render every city in the static dataset at build time so Google sees
// fully-rendered HTML on first crawl. Unknown slugs still SSR on demand.
export async function generateStaticParams() {
  return PRE_CON_CITIES.map((c) => ({ city: c.slug }));
}

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