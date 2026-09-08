import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  MapPin, ArrowRight, Phone, Compass, Train, GraduationCap,
  TreePine, ChevronDown, Landmark, Coffee, Utensils, Store, BookOpen, Info,
} from 'lucide-react';
import { CITIES } from '../../../../../data/cityData';
import { PROPERTY_TYPES, PRICE_RANGES } from '../../../../../data/matrixData';
import { MarketDataService } from '../../../../../services/MarketDataService';
import { getNeighborhoodExtras, isIndexableNeighborhood } from '../../../../../data/neighborhoodExtras';
import LeadForm from '../../../../../components/LeadForm';
import JsonLd from '../../../../../components/JsonLd';
import { buildMetadata } from '../../../../../lib/buildMetadata';
import { cad } from '../../../../../lib/canadianMortgageMath';

export const revalidate = 3600;

interface Params {
  city: string;
  neighborhood: string;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// 40 cities × 6 neighborhoods each ≈ 240 pre-rendered pages. Only the ones with
// substantive curated content are indexable — see isIndexableNeighborhood().
export async function generateStaticParams(): Promise<Params[]> {
  return CITIES.flatMap((c) => c.neighborhoods.map((n) => ({
    city: c.slug,
    neighborhood: slugify(n),
  })));
}

function resolveCell(p: Params) {
  const city = CITIES.find((c) => c.slug === p.city);
  if (!city) return { city: null as null | typeof CITIES[number], neighborhood: null as string | null };
  const neighborhood = city.neighborhoods.find((n) => slugify(n) === p.neighborhood) || null;
  return { city, neighborhood };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city, neighborhood } = resolveCell(params);
  if (!city || !neighborhood) {
    return buildMetadata({
      title: 'Neighborhood Not Found',
      description: 'The requested neighborhood could not be located.',
      slug: `/real-estate/${params.city}/neighborhood/${params.neighborhood}`,
    });
  }

  const extras = getNeighborhoodExtras(city.slug, params.neighborhood);

  // Description is built from the neighbourhood's OWN curated facts — its
  // architectural era, Walk Score, named transit — rather than the previous
  // "Live market snapshot, sample comparables, transit and lifestyle data for
  // {X}, {Y}" template, which was byte-identical across all 240 pages apart
  // from two tokens. Falls back to the era/period when scores are absent.
  const descBits: string[] = [];
  if (extras?.architecturalEra) descBits.push(`Housing stock: ${extras.architecturalEra}.`);
  if (typeof extras?.walkScore === 'number') descBits.push(`Walk Score ${extras.walkScore}/100.`);
  if (extras?.transitStations?.length) {
    descBits.push(`Transit: ${extras.transitStations.slice(0, 2).map((s) => s.name).join(', ')}.`);
  }
  if (extras?.buyerProfile) descBits.push(extras.buyerProfile);

  const description = descBits.length
    ? `${neighborhood}, ${city.name} — ${descBits.join(' ')}`.slice(0, 300)
    : `${neighborhood} is one of ${city.name}'s residential neighbourhoods. Browse ${city.name} homes by property type and price band, and speak with an FSRA-licensed mortgage advisor about financing here.`;

  const base = buildMetadata({
    title: `${neighborhood}, ${city.name} — Neighbourhood Profile`,
    description,
    slug: `/real-estate/${params.city}/neighborhood/${params.neighborhood}`,
    titleAbsolute: true,
    keywords: [
      `${neighborhood} ${city.name}`,
      `${neighborhood} homes for sale`,
      `${neighborhood} real estate`,
      `living in ${neighborhood}`,
      `${neighborhood} history`,
    ],
  });

  // Pages without substantive curated prose render for users but stay out of
  // the index — internal link equity still flows through follow.
  if (!isIndexableNeighborhood(extras)) {
    base.robots = { index: false, follow: true };
  }

  return base;
}

export default async function NeighborhoodPage({ params }: { params: Params }) {
  const { city, neighborhood } = resolveCell(params);
  if (!city || !neighborhood) notFound();

  // City-level context only. The previous version derived a "median home value
  // in {neighborhood}" by hashing the neighbourhood NAME into a ±8% drift on a
  // townhouse benchmark, and an "active listings" count from a ±15% drift on a
  // seeded number — neither figure described the neighbourhood in any way. Both
  // are gone. What remains is the real regional CREA benchmark, labelled as
  // exactly that.
  const cityBenchmark = await MarketDataService.getSnapshot(city.slug, 'townhouse', '750k-1m');

  const extras = getNeighborhoodExtras(city.slug, params.neighborhood);
  const indexable = isIndexableNeighborhood(extras);
  const otherNeighborhoods = city.neighborhoods.filter((n) => n !== neighborhood).slice(0, 6);

  // FAQ is built only from facts we actually hold for this neighbourhood. The
  // previous set asserted median prices, active inventory, "healthy sale-to-list
  // ratios over the last quarter" and school/transit coverage for all 240
  // neighbourhoods regardless of whether any of it had been researched.
  const faqs: { q: string; a: string }[] = [];

  if (extras?.historyBlurb) {
    faqs.push({
      q: `What is ${neighborhood} in ${city.name} known for?`,
      a: extras.historyBlurb,
    });
  }
  if (extras?.architecturalEra) {
    faqs.push({
      q: `What kind of homes are in ${neighborhood}?`,
      a: `${neighborhood}'s housing stock is predominantly ${extras.architecturalEra.toLowerCase()}. ${extras.buyerProfile ? `Buyers here are typically ${extras.buyerProfile.charAt(0).toLowerCase()}${extras.buyerProfile.slice(1)}` : ''}`.trim(),
    });
  }
  if (extras?.transitStations?.length) {
    faqs.push({
      q: `What transit serves ${neighborhood}?`,
      a: `${neighborhood} is served by ${extras.transitStations.map((s) => (s.lines?.length ? `${s.name} (${s.lines.join(', ')})` : s.name)).join('; ')}.${typeof extras.transitScore === 'number' ? ` Walk Score rates the neighbourhood ${extras.transitScore}/100 for transit access.` : ''}`,
    });
  }
  if (extras?.notableSchools?.length) {
    faqs.push({
      q: `Which schools serve ${neighborhood}?`,
      a: `Schools in or adjacent to ${neighborhood} include ${extras.notableSchools.map((s) => (s.band ? `${s.name} (${s.band})` : s.name)).join(', ')}. Fraser Institute bands where shown are qualitative; check compareschoolrankings.org for the current per-school rating, and confirm catchment with the board before relying on it — boundaries change.`,
    });
  }
  if (cityBenchmark.benchmark) {
    faqs.push({
      q: `What do homes cost around ${neighborhood}?`,
      a: `CREA publishes the MLS® Home Price Index at the real estate board level, not per neighbourhood, so there is no published benchmark specific to ${neighborhood}. The townhouse benchmark for the ${cityBenchmark.regionLabel} reporting region that covers ${city.name} is ${cad(cityBenchmark.benchmark)} as of the ${cityBenchmark.asOfLabel} release. Neighbourhood-level pricing varies substantially within any city — a licensed advisor can pull current ${neighborhood} inventory and recent comparables from the MLS® for you.`,
    });
  }

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${neighborhood}, ${city.name}`,
    description: extras?.historyBlurb || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
  };
  const faqSchema = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={placeSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* === HERO === */}
      <section className="relative pt-28 md:pt-32 pb-16 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <nav className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
            <Link href="/listings" className="hover:text-white">Real Estate</Link>
            <span className="mx-2">/</span>
            <Link href={`/mortgage-real-estate/${city.slug}`} className="hover:text-white">{city.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-emerald-300">{neighborhood}</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-md">
            <MapPin size={12} /> Neighbourhood Profile · {city.name}
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-4">
            {neighborhood}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">{city.name} Real Estate</span>
          </h1>

          <p className="text-base md:text-lg text-gray-300 max-w-3xl font-medium mb-8">
            {extras?.architecturalEra
              ? <>Housing stock in {neighborhood}: <strong className="text-white">{extras.architecturalEra}</strong>.</>
              : <>{neighborhood} is one of {city.name}&apos;s residential neighbourhoods.</>}
            {' '}
            {cityBenchmark.benchmark
              ? <>CREA&apos;s townhouse benchmark for the {cityBenchmark.regionLabel} region covering {city.name} is <strong className="text-white">{cad(cityBenchmark.benchmark)}</strong> ({cityBenchmark.asOfLabel}) — the index is published per board, not per neighbourhood.</>
              : <>CREA does not publish an MLS® HPI series covering {city.name}.</>}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#request" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition shadow-lg">
              See Every {neighborhood} Listing <ArrowRight size={16} />
            </a>
            <a href="tel:+14372416392" className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition">
              <Phone size={16} /> Call Now
            </a>
          </div>
        </div>
      </section>

      {/* === CURATED CONTENT ===
          The generic six-card "Living in {X}" grid that used to sit here
          (Walkability / Transit Access / Schools / Greenspace / Proximity /
          Demand) was the same six paragraphs on all 240 neighbourhood pages with
          the neighbourhood name substituted in — the single strongest duplicate
          signal on this route. It has been removed rather than reworded: a page
          with less content that is real outranks a page with more content that
          isn't. */}
      {extras && (
        <section className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
          <div className="container mx-auto max-w-5xl">
            {/* Architecture + history — lead with the neighbourhood's own story */}
            {(extras.architecturalEra || extras.historyBlurb) && (
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-3">
                  <BookOpen size={26} className="text-emerald-600" /> Living in {neighborhood}
                </h2>
                {extras.architecturalEra && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
                    Architectural era · {extras.architecturalEra}
                  </p>
                )}
                {extras.historyBlurb && (
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    {extras.historyBlurb}
                  </p>
                )}
              </div>
            )}

            {/* Scores block */}
            {(extras.walkScore || extras.transitScore || extras.bikeScore) && (
              <>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
                  {neighborhood} scores.
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Third-party walkability, transit, and cycling scores — neighbourhood-level snapshot from Walk Score. Scores are per-address in reality; treat these as a directional guide.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-12">
                  {typeof extras.walkScore === 'number' && (
                    <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Walk Score</p>
                      <p className="text-4xl md:text-5xl font-black text-emerald-600 tracking-tighter">{extras.walkScore}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">/ 100</p>
                    </div>
                  )}
                  {typeof extras.transitScore === 'number' && (
                    <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Transit Score</p>
                      <p className="text-4xl md:text-5xl font-black text-blue-600 tracking-tighter">{extras.transitScore}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">/ 100</p>
                    </div>
                  )}
                  {typeof extras.bikeScore === 'number' && (
                    <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Bike Score</p>
                      <p className="text-4xl md:text-5xl font-black text-orange-500 tracking-tighter">{extras.bikeScore}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">/ 100</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Transit */}
            {extras.transitStations && extras.transitStations.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                  <Train size={22} className="text-blue-600" /> Transit access
                </h3>
                <ul className="space-y-3">
                  {extras.transitStations.map((s, i) => (
                    <li key={i} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="font-black text-sm text-slate-900">{s.name}</p>
                      {s.lines && s.lines.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{s.lines.join(' · ')}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mid-scroll advisor CTA */}
            <div className="mb-12 bg-slate-900 text-white rounded-2xl p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1">Thinking about {neighborhood}?</p>
                <p className="text-base md:text-lg font-black leading-snug">
                  A licensed {city.name} advisor will reach out to walk you through your options.
                </p>
              </div>
              <a
                href={`/apply?ref=nbhd-${city.slug}-${params.neighborhood}`}
                className="shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition shadow-lg"
              >
                Connect With an Advisor <ArrowRight size={14} />
              </a>
            </div>

            {/* Schools */}
            {extras.notableSchools && extras.notableSchools.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap size={22} className="text-blue-600" /> Notable schools
                </h3>
                <ul className="space-y-3">
                  {extras.notableSchools.map((s, i) => (
                    <li key={i} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-900">{s.name}</p>
                        {s.band && <p className="text-xs text-gray-500 mt-1">{s.band}</p>}
                      </div>
                      {s.fraserBand && (
                        <span className="shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          Fraser · {s.fraserBand}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notable spots */}
            {extras.notableSpots && extras.notableSpots.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                  <Landmark size={22} className="text-blue-600" /> Notable places
                </h3>
                <div className="flex flex-wrap gap-2">
                  {extras.notableSpots.map((sp, i) => {
                    const Icon = sp.kind === 'restaurant' ? Utensils
                      : sp.kind === 'cafe' ? Coffee
                      : sp.kind === 'park' ? TreePine
                      : sp.kind === 'shop' ? Store
                      : Landmark;
                    return (
                      <span key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs font-bold text-slate-800">
                        <Icon size={12} className="text-blue-600" /> {sp.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Buyer profile */}
            {extras.buyerProfile && (
              <div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                  <Compass size={22} className="text-blue-600" /> Who buys here
                </h3>
                <p className="text-base text-gray-700 leading-relaxed font-medium">
                  {extras.buyerProfile}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* === PRICING PROVENANCE ===
          Explicit about what is and isn't measurable at neighbourhood level.
          This replaces the "Median home value in {neighborhood}: $XXXK · N active
          listings" line that was generated from a hash of the neighbourhood name. */}
      <section className="py-10 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-4xl flex flex-col md:flex-row gap-4 md:items-start">
          <Info size={24} className="text-gray-400 shrink-0 mt-1" />
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-slate-900">On neighbourhood pricing:</strong> CREA publishes the MLS® Home Price Index per real estate board, not per neighbourhood, and IndiBrick does not currently license an MLS® feed — so we publish no median price, inventory count or days-on-market for {neighborhood} specifically.
            {cityBenchmark.benchmark
              ? ` For regional context, the ${cityBenchmark.regionLabel} townhouse benchmark is ${cad(cityBenchmark.benchmark)} as of the ${cityBenchmark.asOfLabel} release.`
              : ''}
            {' '}A licensed advisor can pull current {neighborhood} listings and recent comparables from the MLS® on request.
          </p>
        </div>
      </section>

      {/* === BROWSE BY TYPE × PRICE === */}
      <section className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-8">
            Browse {city.name} inventory by type + price.
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">By Type</p>
              <ul className="space-y-2">
                {PROPERTY_TYPES.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/real-estate/${city.slug}/${t.slug}/750k-1m`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-slate-900 hover:text-white border border-gray-100 transition group">
                      <span className="font-black text-sm uppercase tracking-wide">{t.plural} in {city.name}</span>
                      <ArrowRight size={16} className="opacity-50 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">By Price Band</p>
              <ul className="space-y-2">
                {PRICE_RANGES.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/real-estate/${city.slug}/townhouse/${r.slug}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-slate-900 hover:text-white border border-gray-100 transition group">
                      <span className="font-black text-sm uppercase tracking-wide">{city.name} Homes {r.label}</span>
                      <ArrowRight size={16} className="opacity-50 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Other {city.name} neighbourhoods</p>
            <div className="flex flex-wrap gap-3">
              {otherNeighborhoods.map((n) => (
                <Link key={n} href={`/real-estate/${city.slug}/neighborhood/${slugify(n)}`}
                  className="px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-black hover:bg-slate-900 hover:text-white text-sm font-black uppercase tracking-wide transition">{n}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      {faqs.length > 0 && (
        <section className="py-16 md:py-20 px-6 bg-slate-900 text-white border-b border-slate-800">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-10">
              {neighborhood} FAQ
            </h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <details key={i} className="group bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 cursor-pointer">
                  <summary className="flex justify-between items-center font-black text-base md:text-lg list-none uppercase tracking-tight">
                    {f.q}
                    <span className="text-emerald-400 group-open:rotate-180 transition shrink-0 ml-4"><ChevronDown size={18} /></span>
                  </summary>
                  <p className="text-gray-400 mt-5 leading-relaxed font-medium border-t border-white/10 pt-5">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === LEAD CAPTURE === */}
      <section id="request" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3 leading-tight">
              Talk to a {city.name} advisor about {neighborhood}.
            </h2>
            <p className="text-gray-400 text-base md:text-lg mb-8">
              A licensed {city.name} advisor will reach out to walk you through active {neighborhood} listings, current prices, and your financing options.
            </p>
            <div className="text-left max-w-lg mx-auto bg-white p-2 rounded-[2.5rem] shadow-xl border border-gray-100">
              <LeadForm
                type="Realtor"
                title={`${neighborhood}, ${city.name}`}
                subtitle={`${city.name} · Licensed FSRA advisor`}
                ctaText="Connect With an Advisor"
              />
            </div>
          </div>
        </div>
      </section>

      <span data-indexable={String(indexable)} hidden />
    </div>
  );
}
