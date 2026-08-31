// Shared landing template for pre-construction / new-build community
// pages under /listings/<slug>. Same shell + section order across every
// development so the design system stays consistent.
//
// Renders:
//   - Hero (image + status chip + key facts)
//   - Direct-answer AEO block (LLM-quotable)
//   - Overview paragraphs
//   - Highlights grid
//   - Home collections table
//   - Location advantages
//   - Incentives (when set)
//   - Lead form (existing LeadForm component, type="Pre-Con")
//   - FAQ (also rendered as JSON-LD FAQPage schema)
//   - Sources citation block
//   - JSON-LD RealEstateListing + FAQPage schemas

import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Building2, Home, Compass, CheckCircle, Sparkles, Info,
  ExternalLink, ArrowRight, Zap, Ruler, Bed, Bath, Car, Layers,
} from 'lucide-react';
import LeadForm from '../LeadForm';
import type { DevelopmentData } from '../../lib/developmentsData';

interface Props { data: DevelopmentData; }

const STATUS_STYLE: Record<DevelopmentData['status'], string> = {
  'Registering':   'bg-blue-500/20 text-blue-100 border-blue-400/40',
  'Selling':       'bg-emerald-500/20 text-emerald-100 border-emerald-400/40',
  'Coming Soon':   'bg-amber-500/20 text-amber-100 border-amber-400/40',
  'Move-In Ready': 'bg-purple-500/20 text-purple-100 border-purple-400/40',
};

export default function DevelopmentLanding({ data }: Props) {
  // JSON-LD schemas — Product / RealEstateListing + FAQPage.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateListing',
        name: data.name,
        description: data.aeoAnswer,
        url: `https://indibrick.ca/listings/${data.slug}`,
        image: [data.heroImageUrl, ...data.galleryImages],
        address: data.address ? {
          '@type': 'PostalAddress',
          streetAddress: data.address,
          addressLocality: data.city,
          addressRegion: 'ON',
          addressCountry: 'CA',
        } : undefined,
        offers: data.priceRange ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'CAD',
          description: data.priceRange,
          availability: 'https://schema.org/InStock',
        } : undefined,
        brand: data.builderOrDeveloper ? {
          '@type': 'Organization',
          name: data.builderOrDeveloper,
        } : undefined,
      },
      {
        '@type': 'FAQPage',
        mainEntity: data.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={data.heroImageUrl}
            alt={data.name}
            fill
            priority
            unoptimized
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900"/>
        </div>
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`inline-flex items-center gap-1 border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLE[data.status]}`}>
              <Sparkles size={12}/> {data.status}
            </span>
            {data.builderOrDeveloper && (
              <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Building2 size={12}/> {data.builderOrDeveloper}
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <MapPin size={12}/> {data.region}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {data.name}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/80 max-w-3xl leading-relaxed">
            {data.tagline}
          </p>

          {data.priceRange && (
            <div className="mt-8 inline-flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-3 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Pricing</span>
              <span className="text-lg md:text-2xl font-black">{data.priceRange}</span>
            </div>
          )}

          {(data.address || data.estimatedOccupancy) && (
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/70">
              {data.address && (
                <div className="flex items-center gap-2"><MapPin size={14}/> <span>{data.address}</span></div>
              )}
              {data.estimatedOccupancy && (
                <div className="flex items-center gap-2"><Compass size={14}/> <span>Est. occupancy: {data.estimatedOccupancy}</span></div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#register"
              className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-blue-100 text-[11px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition">
              Register for pricing <ArrowRight size={12}/>
            </Link>
            <Link href="#faq"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition">
              Common questions <ArrowRight size={12}/>
            </Link>
          </div>
        </div>
      </section>

      {/* AEO DIRECT-ANSWER BLOCK — LLM-quotable */}
      <section className="py-8 md:py-10 bg-blue-50 border-b border-blue-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Info size={16}/>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-1">At a glance</div>
              <p className="text-base md:text-lg text-slate-900 leading-relaxed">{data.aeoAnswer}</p>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">About {data.name}</h2>
          <div className="mt-6 space-y-5 text-neutral-700 leading-relaxed">
            {data.overview.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Community highlights</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.highlights.map(h => (
              <div key={h.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-600 shrink-0" size={18}/>
                  <h3 className="text-base font-black text-slate-900">{h.title}</h3>
                </div>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOME COLLECTIONS */}
      {data.collections.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-6 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Home collections</h2>
            <p className="mt-2 text-sm text-neutral-500">Every home type currently in the release schedule.</p>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Collection</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500"><Home size={11} className="inline"/> Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500"><Bed size={11} className="inline"/> Beds</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500"><Bath size={11} className="inline"/> Baths</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500"><Ruler size={11} className="inline"/> Sq Ft</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500"><Layers size={11} className="inline"/> Storeys</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500"><Car size={11} className="inline"/> Garage</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">From</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.collections.map(c => (
                    <tr key={c.name} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {c.name}
                        {c.note && <div className="text-[11px] text-neutral-500 font-normal mt-0.5">{c.note}</div>}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{c.homeType}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.bedrooms}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.bathrooms || '—'}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.sqft || '—'}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.storeys || '—'}</td>
                      <td className="px-4 py-3 text-neutral-700">{c.garage || '—'}</td>
                      <td className="px-4 py-3 font-black text-slate-900">{c.startingPrice || 'TBA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* LOCATION */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Location advantages</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.location.map(l => (
              <div key={l.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <MapPin className="text-blue-600 shrink-0" size={16}/>
                  <h3 className="text-base font-black text-slate-900">{l.title}</h3>
                </div>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INCENTIVES (when set) */}
      {data.incentives && data.incentives.length > 0 && (
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="text-emerald-700" size={20}/>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-emerald-900">Current incentives</h2>
              </div>
              <ul className="space-y-2">
                {data.incentives.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                    <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={16}/>
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* LEAD FORM */}
      <section id="register" className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-100 mb-4">
              <Sparkles size={12}/> Priority list
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Register for {data.name}</h2>
            <p className="mt-3 text-white/70 leading-relaxed">
              Get the current phase pricing sheet, floor plans, incentive schedule, and quick-move-in inventory before the public release.
            </p>
          </div>
          <div className="bg-white text-slate-900 rounded-2xl overflow-hidden">
            <LeadForm
              type="Pre-Con"
              title={`Register for ${data.name}`}
              subtitle={`Pricing, floor plans, and incentives sent directly to your inbox.`}
              ctaText="Register for priority access"
              sourcePage={`/listings/${data.slug}`}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-neutral-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center">Common questions</h2>
          <div className="mt-10 space-y-6">
            {data.faq.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="font-black text-slate-900">{q}</h3>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOURCES */}
      {data.sources && data.sources.length > 0 && (
        <section className="py-10 bg-white border-t border-neutral-200">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Sourced from</div>
            <ul className="space-y-1 text-sm">
              {data.sources.map(s => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                    {s.label} <ExternalLink size={11}/>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-neutral-500">
              Pricing, floor plans, and incentives are subject to change by the builder. Verified against official sales pages at time of publication.
              IndiBrick is not the builder — we are a licensed FSRA #12830 mortgage brokerage helping buyers register for priority access.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
