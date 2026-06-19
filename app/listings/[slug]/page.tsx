import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Bed, Bath, MapPin, ArrowRight, Phone, ShieldCheck } from 'lucide-react';
import { PropertyService } from '../../../services/PropertyService';
import LeadForm from '../../../components/LeadForm';
import JsonLd from '../../../components/JsonLd';
import { buildMetadata } from '../../../lib/buildMetadata';
import type { Property } from '../../../types';

// ISR — each listing page regenerates at most once an hour. Pricing/status
// changes propagate within that window; Google still sees pre-rendered HTML.
export const revalidate = 3600;

interface Props {
  params: { slug: string };
}

// Look up by slug field first, then fall back to the Firestore doc id.
async function getProperty(slug: string): Promise<Property | null> {
  const all = await PropertyService.fetchProperties();
  return all.find((p: any) => p.slug === slug) || all.find((p) => p.id === slug) || null;
}

export async function generateStaticParams() {
  try {
    const all = await PropertyService.fetchProperties();
    return all.map((p: any) => ({ slug: p.slug || p.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await getProperty(params.slug);
  if (!property) {
    return buildMetadata({
      title: 'Listing Not Found',
      description: 'The requested property listing could not be located.',
      slug: `/listings/${params.slug}`,
    });
  }
  const price = property.price ? `$${property.price.toLocaleString()}` : 'Price on request';
  return buildMetadata({
    title: `${property.title} — ${property.city}, ON · ${price}`,
    description: property.description
      || `${property.bedrooms} bed · ${property.bathrooms} bath · ${property.type} for sale at ${property.address}, ${property.city}. Listed at ${price} via IndiBrick.`,
    slug: `/listings/${params.slug}`,
    image: property.imageUrl,
    keywords: [
      `${property.city} real estate`,
      `${property.city} ${property.type}`,
      `${property.type} for sale ${property.city}`,
      `${property.bedrooms} bedroom ${property.city}`,
      property.address,
    ],
  });
}

export default async function ListingDetailPage({ params }: Props) {
  const property = await getProperty(params.slug);
  if (!property) notFound();

  const priceLabel = property.price ? `$${property.price.toLocaleString()}` : 'Price on request';

  const listingSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description || `${property.bedrooms} bed ${property.type} for sale in ${property.city}.`,
    url: `https://indibrick.ca/listings/${params.slug}`,
    image: property.imageUrl ? [property.imageUrl] : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      price: String(property.price || 0),
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={listingSchema} />

      {/* --- HERO --- */}
      <section className="relative pt-28 md:pt-32 pb-16 px-6 bg-slate-900 text-white overflow-hidden">
        {property.imageUrl && (
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover opacity-40 scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900" />
          </div>
        )}

        <div className="container mx-auto max-w-6xl relative z-10">
          <Link href="/listings" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition mb-6">
            ← Back to all listings
          </Link>

          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-md">
            {property.purpose || 'For Sale'}
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-6">
            {property.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-bold text-gray-300 mb-8">
            <span className="flex items-center gap-2"><MapPin size={16} className="text-blue-400" /> {property.address}, {property.city}, ON</span>
            {property.bedrooms > 0 && <span className="flex items-center gap-2"><Bed size={16} className="text-blue-400" /> {property.bedrooms} bed</span>}
            {property.bathrooms > 0 && <span className="flex items-center gap-2"><Bath size={16} className="text-blue-400" /> {property.bathrooms} bath</span>}
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-blue-400" /> {property.type}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl">
              <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest mb-1">Listed At</p>
              <p className="text-3xl font-black text-white">{priceLabel}</p>
            </div>
            <a href="#request-tour" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg shadow-blue-500/30 flex items-center gap-2">
              Request Tour <ArrowRight size={16} />
            </a>
            <a href="tel:+14372416392" className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center gap-2">
              <Phone size={16} /> Call Now
            </a>
          </div>
        </div>
      </section>

      {/* --- DETAILS --- */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Type</p>
              <p className="text-base font-black text-slate-900">{property.type}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Bedrooms</p>
              <p className="text-base font-black text-slate-900">{property.bedrooms || '—'}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Bathrooms</p>
              <p className="text-base font-black text-slate-900">{property.bathrooms || '—'}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
              <p className="text-base font-black text-slate-900">{property.purpose || 'For Sale'}</p>
            </div>
          </div>

          {property.description && (
            <div className="prose max-w-none">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">About this listing</h2>
              <p className="text-base text-gray-700 leading-relaxed font-medium whitespace-pre-line">{property.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* --- LEAD CAPTURE --- */}
      <section id="request-tour" className="py-20 px-6 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3 leading-tight">
              Request a tour of this property.
            </h2>
            <p className="text-gray-400 text-base md:text-lg mb-8">
              A licensed IndiBrick advisor will reach out within 1 business hour with availability and full details.
            </p>
            <div className="text-left max-w-lg mx-auto bg-white p-2 rounded-[2.5rem] shadow-xl border border-gray-100">
              <LeadForm
                type="Realtor"
                title={`Request a tour — ${property.title}`}
                subtitle={`${property.address}, ${property.city}`}
                ctaText="Send Me Details"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
