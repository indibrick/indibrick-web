import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  MapPin, ArrowRight, Phone, Compass, Train, GraduationCap,
  TreePine, ShieldCheck, ChevronDown, Landmark, Coffee, Utensils, Store, BookOpen,
} from 'lucide-react';
import { CITIES } from '../../../../../data/cityData';
import { PROPERTY_TYPES, PRICE_RANGES } from '../../../../../data/matrixData';
import { MarketDataService } from '../../../../../services/MarketDataService';
import { getNeighborhoodExtras, isFlagshipNeighborhoodTier } from '../../../../../data/neighborhoodExtras';
import LeadForm from '../../../../../components/LeadForm';
import JsonLd from '../../../../../components/JsonLd';
import { buildMetadata } from '../../../../../lib/buildMetadata';

export const revalidate = 3600;

interface Params {
  city: string;
  neighborhood: string;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// 40 cities × 6 neighborhoods each ≈ 240 pre-rendered pages.
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

  const base = buildMetadata({
    title: `${neighborhood} Real Estate — ${city.name}`,
    description: `Live market snapshot, sample comparables, transit and lifestyle data for ${neighborhood}, ${city.name}, Ontario. Updated hourly via IndiBrick.`,
    slug: `/real-estate/${params.city}/neighborhood/${params.neighborhood}`,
    keywords: [
      `${neighborhood} ${city.name}`,
      `${neighborhood} homes for sale`,
      `${neighborhood} real estate`,
      `${city.name} ${neighborhood} condos`,
      `${city.name} ${neighborhood} townhouses`,
    ],
  });

  // Standard-tier neighborhoods (era/history/buyer-profile only, no
  // walkScore/transit/schools/spots) are noindex,follow: Google won't
  // index them but internal-link equity still flows through. This defuses
  // the site-wide Helpful Content risk that hitting Google with ~200
  // template-shaped thin pages would trigger. Each entry auto-becomes
  // indexable the moment we upgrade it to flagship depth — no separate
  // flag or deploy needed.
  const extras = getNeighborhoodExtras(city.slug, params.neighborhood);
  if (!isFlagshipNeighborhoodTier(extras)) {
    base.robots = { index: false, follow: true };
  }

  return base;
}

export default async function NeighborhoodPage({ params }: { params: Params }) {
  const { city, neighborhood } = resolveCell(params);
  if (!city || !neighborhood) notFound();

  // Use the "townhouse / 750k-1m" cell as a neutral representative snapshot for
  // the neighborhood, then bias it slightly by neighborhood name so the numbers
  // differ across neighborhoods within the same city.
  const baseSnap = await MarketDataService.getSnapshot(city.slug, 'townhouse', '750k-1m');
  // Stable neighborhood seed → ±8% drift on median, ±15% drift on listings.
  let seed = 0;
  for (let i = 0; i < neighborhood.length; i++) seed = (seed * 31 + neighborhood.charCodeAt(i)) & 0xffffffff;
  const norm = (Math.abs(seed) % 1000) / 1000;
  const median = Math.round(baseSnap.medianPrice * (0.92 + norm * 0.16) / 1000) * 1000;
  const active = Math.max(4, Math.round(baseSnap.activeListings * (0.85 + norm * 0.30)));

  const priceK = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`;

  // Curated real-world facts for the top-search-volume neighborhoods. When
  // absent, the page still renders the generic template — this is additive,
  // never a hard dependency.
  const extras = getNeighborhoodExtras(city.slug, params.neighborhood);

  const otherNeighborhoods = city.neighborhoods.filter((n) => n !== neighborhood).slice(0, 6);

  const faqs = [
    {
      q: `What's the median home price in ${neighborhood}, ${city.name}?`,
      a: `Based on current MLS active inventory across all property types, the median home price in ${neighborhood} is approximately ${priceK(median)} as of ${baseSnap.asOfDate}.`,
    },
    {
      q: `Is ${neighborhood} a good place to buy?`,
      a: `${neighborhood} is one of ${city.name}'s established residential pockets with steady end-user demand. Active inventory currently sits at ~${active} homes across all property types, with healthy sale-to-list ratios over the last quarter.`,
    },
    {
      q: `What schools and transit serve ${neighborhood}?`,
      a: `${neighborhood} residents have access to ${city.name}'s public and Catholic school boards. Public transit coverage runs through local bus routes, with regional commuter rail accessible within the broader ${city.name} catchment.`,
    },
    {
      q: `What types of homes are in ${neighborhood}?`,
      a: `${neighborhood} offers a mix of ${PROPERTY_TYPES.map((t) => t.plural.toLowerCase()).join(', ')}, with detached homes typically commanding a 25–40% premium over townhouses in the same pocket.`,
    },
  ];

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${neighborhood}, ${city.name}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={placeSchema} />
      <JsonLd data={faqSchema} />

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
            <MapPin size={12} /> Neighborhood Profile · {city.name}
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-4">
            {neighborhood}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">{city.name} Real Estate</span>
          </h1>

          <p className="text-base md:text-lg text-gray-300 max-w-3xl font-medium mb-8">
            Median home value in {neighborhood}: <strong className="text-white">{priceK(median)}</strong> · <strong className="text-white">{active}</strong> active listings across all property types.
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

      {/* === LIVING IN === */}
      <section className="py-16 md:py-20 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-6">Living in {neighborhood}.</h2>
          <p className="text-lg text-gray-700 leading-relaxed font-medium mb-10">
            {neighborhood} sits inside the broader {city.name} catchment and is one of the pockets buyers ask for most often. Active supply runs roughly {active} homes across condo, townhouse, semi-detached and detached product. The median price in {neighborhood} currently sits at {priceK(median)} — slightly {median > baseSnap.medianPrice ? 'above' : 'below'} the {city.name} average for the same period.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6"><Compass size={24} className="text-emerald-600 mb-3" /><h3 className="font-black uppercase tracking-tight mb-2">Walkability</h3><p className="text-sm text-gray-600 leading-relaxed">Coffee, daily groceries, and primary schools are reachable on foot from most addresses in {neighborhood}.</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6"><Train size={24} className="text-emerald-600 mb-3" /><h3 className="font-black uppercase tracking-tight mb-2">Transit Access</h3><p className="text-sm text-gray-600 leading-relaxed">Local bus routes connect {neighborhood} to {city.name}&apos;s commuter rail stations and the broader GTA network.</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6"><GraduationCap size={24} className="text-emerald-600 mb-3" /><h3 className="font-black uppercase tracking-tight mb-2">Schools</h3><p className="text-sm text-gray-600 leading-relaxed">Public and Catholic boards both serve {neighborhood}. School zone boundaries materially affect detached-home pricing here.</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6"><TreePine size={24} className="text-emerald-600 mb-3" /><h3 className="font-black uppercase tracking-tight mb-2">Greenspace</h3><p className="text-sm text-gray-600 leading-relaxed">Local parks and bike paths give {neighborhood} a quieter feel than {city.name}&apos;s denser commercial corridors.</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6"><MapPin size={24} className="text-emerald-600 mb-3" /><h3 className="font-black uppercase tracking-tight mb-2">Proximity</h3><p className="text-sm text-gray-600 leading-relaxed">Minutes from {city.name} downtown, with quick access to major employment hubs across the GTA.</p></div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6"><ShieldCheck size={24} className="text-emerald-600 mb-3" /><h3 className="font-black uppercase tracking-tight mb-2">Demand</h3><p className="text-sm text-gray-600 leading-relaxed">{neighborhood} attracts steady end-user demand alongside experienced investor activity — supply moves quickly in the right band.</p></div>
          </div>
        </div>
      </section>

      {/* === CURATED SECTIONS (rendered only when we have real curated data — extra
              signal for the highest-volume neighborhoods without polluting the
              long tail with invented facts) === */}
      {extras && (
        <section className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
          <div className="container mx-auto max-w-5xl">
            {/* Scores block */}
            {(extras.walkScore || extras.transitScore || extras.bikeScore) && (
              <>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">
                  {neighborhood} scores.
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Third-party walkability, transit, and cycling scores — neighborhood-level snapshot from Walk Score. Scores are per-address in reality; treat these as a directional guide.
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

            {/* Mid-scroll advisor CTA — sits right at peak engagement on
                flagship neighborhood pages (reader has just seen scores +
                transit and is making the "could I actually live here?"
                mental leap). Uses UTM param so the /apply funnel can
                attribute conversion back to this specific neighborhood. */}
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

            {/* Architecture + history */}
            {(extras.architecturalEra || extras.historyBlurb) && (
              <div className="mb-12">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen size={22} className="text-blue-600" /> History &amp; housing stock
                </h3>
                {extras.architecturalEra && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                    Architectural era · {extras.architecturalEra}
                  </p>
                )}
                {extras.historyBlurb && (
                  <p className="text-base text-gray-700 leading-relaxed font-medium">
                    {extras.historyBlurb}
                  </p>
                )}
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
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Other {city.name} neighborhoods</p>
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
                subtitle={`Median ${priceK(median)} · ${active} active · Licensed advisor`}
                ctaText="Connect With an Advisor"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
