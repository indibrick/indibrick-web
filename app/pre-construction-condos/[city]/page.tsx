import React from 'react';
import { Metadata } from 'next';
import { PRE_CON_CITIES } from '../../../data/cityData';
import { notFound } from 'next/navigation';
import PreConCityClient from '../../../components/PreConCityClient';
import { buildMetadata } from '../../../lib/buildMetadata';

// ISR — re-generate each city page at most once an hour.
export const revalidate = 3600;

// Pre-render every city in the static dataset at build time so Google sees
// fully-rendered HTML on first crawl. Unknown slugs still SSR on demand.
export async function generateStaticParams() {
  return PRE_CON_CITIES.map((c) => ({ city: c.slug }));
}

/**
 * This route previously exported NO metadata at all, so all ~40 city pages
 * inherited the root layout's title and description verbatim — identical title
 * tags, identical meta descriptions and no per-page canonical across the whole
 * set. That alone is enough for "Crawled – currently not indexed".
 *
 * The deeper problem is that the page body carries no per-city content either:
 * three fixed category cards ("Luxury Condos", "Modern Townhomes", "Freehold
 * Townhomes") with the city name interpolated, plus a lead form. There are no
 * named projects, no builders, no addresses, no prices, no occupancy dates.
 *
 * So these pages ship noindex,follow until they carry real inventory. To make
 * them indexable, add a per-city project list (name, builder, address,
 * price-from, occupancy, deposit structure) — sourced from builder platform
 * feeds or a maintained data file — and remove the robots override below.
 */
export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const cityData = PRE_CON_CITIES.find((c) => c.slug === params.city);
  if (!cityData) {
    return buildMetadata({
      title: 'Pre-Construction City Not Found',
      description: 'The requested pre-construction city could not be located.',
      slug: `/pre-construction-condos/${params.city}`,
    });
  }

  const meta = buildMetadata({
    title: `Pre-Construction Condos & Towns in ${cityData.cityName}, Ontario`,
    description: `Register for pre-construction condo and townhome releases in ${cityData.cityName}, Ontario. Floor plans, deposit structures and builder-direct pricing, with FSRA-licensed mortgage support for the closing.`,
    slug: `/pre-construction-condos/${params.city}`,
    titleAbsolute: true,
  });

  // No per-city inventory data yet — see the note above.
  meta.robots = { index: false, follow: true };
  return meta;
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