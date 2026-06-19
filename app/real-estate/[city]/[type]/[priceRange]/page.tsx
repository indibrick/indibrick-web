import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  MapPin, TrendingUp, TrendingDown, Activity, Home as HomeIcon,
  ArrowRight, Phone, ShieldCheck, ChevronDown,
} from 'lucide-react';
import { CITIES } from '../../../../../data/cityData';
import {
  PROPERTY_TYPES, PRICE_RANGES, getTypeBySlug, getPriceRangeBySlug,
} from '../../../../../data/matrixData';
import { MarketDataService } from '../../../../../services/MarketDataService';
import LeadForm from '../../../../../components/LeadForm';
import JsonLd from '../../../../../components/JsonLd';
import { buildMetadata } from '../../../../../lib/buildMetadata';

// ISR — every matrix cell page regenerates at most once per hour. Market
// snapshot numbers stay fresh; build time stays sane for ~800 pages.
export const revalidate = 3600;

interface Params {
  city: string;
  type: string;
  priceRange: string;
}

// Pre-render every (city × type × priceRange) tuple at build time. With 40
// cities × 4 types × 5 bands that's 800 static HTML pages on first build.
export async function generateStaticParams(): Promise<Params[]> {
  return MarketDataService.enumerateCells().map((t) => ({
    city: t.city,
    type: t.type,
    priceRange: t.price,
  }));
}

function resolveCell(p: Params) {
  const city = CITIES.find((c) => c.slug === p.city) || null;
  const type = getTypeBySlug(p.type);
  const range = getPriceRangeBySlug(p.priceRange);
  return { city, type, range };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { city, type, range } = resolveCell(params);
  if (!city || !type || !range) {
    return buildMetadata({
      title: 'Listing Category Not Found',
      description: 'The requested real-estate category could not be located.',
      slug: `/real-estate/${params.city}/${params.type}/${params.priceRange}`,
    });
  }
  const title = `${type.plural} for Sale in ${city.name} — ${range.label}`;
  const description = `Browse ${type.plural.toLowerCase()} for sale in ${city.name}, Ontario ${range.label.toLowerCase()}. Live market snapshot, median pricing, days on market and active inventory updated hourly via IndiBrick.`;
  return buildMetadata({
    title,
    description,
    slug: `/real-estate/${params.city}/${params.type}/${params.priceRange}`,
    keywords: [
      `${type.plural} for sale ${city.name}`,
      `${city.name} ${type.label.toLowerCase()} ${range.short}`,
      `${type.label} ${city.name} ${range.label}`,
      `${city.name} ${type.label.toLowerCase()} prices`,
      `MLS ${city.name} ${type.plural.toLowerCase()}`,
      `${city.name} real estate ${range.label}`,
    ],
  });
}

export default async function MatrixCellPage({ params }: { params: Params }) {
  const { city, type, range } = resolveCell(params);
  if (!city || !type || !range) notFound();

  const snap = await MarketDataService.getSnapshot(params.city, params.type, params.priceRange);
  const sourceLabel = await MarketDataService.getSourceLabel(params.city, params.type);

  const priceK = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`;

  // Cross-link sets for internal SEO + on-page nav.
  const otherTypes = PROPERTY_TYPES.filter((t) => t.slug !== type.slug);
  const otherRanges = PRICE_RANGES.filter((r) => r.slug !== range.slug);
  // Pick 6 other cities of similar tier for "Same band, other cities" block.
  const otherCities = CITIES.filter((c) => c.slug !== city.slug).slice(0, 6);

  const trendUp = snap.yoyChangePct >= 0;

  // FAQ schema — drives AI Overviews / People Also Ask.
  const faqs = [
    {
      q: `What is the median price for ${type.plural.toLowerCase()} in ${city.name} ${range.label.toLowerCase()}?`,
      a: `As of ${snap.asOfDate}, the median list price for ${type.plural.toLowerCase()} in ${city.name} priced ${range.label.toLowerCase()} sits at approximately ${priceK(snap.medianPrice)} based on active MLS inventory.`,
    },
    {
      q: `How many ${type.plural.toLowerCase()} are currently for sale in ${city.name} in this price range?`,
      a: `There are roughly ${snap.activeListings} active ${type.plural.toLowerCase()} for sale in ${city.name} priced ${range.label.toLowerCase()}. Inventory typically refreshes weekly via the local MLS board.`,
    },
    {
      q: `How long do ${type.plural.toLowerCase()} stay on the market in ${city.name}?`,
      a: `${type.plural} in ${city.name} priced ${range.label.toLowerCase()} are averaging ${snap.daysOnMarket} days on market. ${snap.daysOnMarket < 21 ? 'That signals a seller-leaning market — buyers should expect competition and pre-approved offers.' : 'That gives buyers time to compare options and negotiate condition removal periods.'}`,
    },
    {
      q: `Are ${city.name} ${type.label.toLowerCase()} prices going up or down?`,
      a: `Year-over-year median ${type.label.toLowerCase()} prices in ${city.name} (this band) are ${trendUp ? 'up' : 'down'} ${Math.abs(snap.yoyChangePct).toFixed(1)}%. Six-month trend data is available on this page.`,
    },
    {
      q: `What mortgage do I need to buy a ${type.label.toLowerCase()} at this price in ${city.name}?`,
      a: `On a ${priceK(snap.medianPrice)} purchase with 20% down, you'd carry a mortgage of about ${priceK(snap.medianPrice * 0.8)}. At today's variable rates (~5.45% qualifying), that's roughly $${Math.round((snap.medianPrice * 0.8 * 0.006).toLocaleString())} / month before taxes and insurance. Use the IndiBrick affordability calculator to model your specific scenario.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: snap.comparables.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Residence',
        name: c.address,
        address: { '@type': 'PostalAddress', addressLocality: snap.cityName, addressRegion: 'ON' },
      },
    })),
  };

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={faqSchema} />
      <JsonLd data={itemListSchema} />

      {/* === HERO === */}
      <section className="relative pt-28 md:pt-32 pb-16 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4 pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <nav className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
            <Link href="/listings" className="hover:text-white">Real Estate</Link>
            <span className="mx-2">/</span>
            <Link href={`/mortgage-real-estate/${city.slug}`} className="hover:text-white">{city.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-blue-400">{type.label}</span>
            <span className="mx-2">·</span>
            <span className="text-blue-400">{range.short}</span>
          </nav>

          <div className="inline-flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
              <Activity size={12} /> Live Market Snapshot · {snap.asOfDate}
            </span>
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-gray-200 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
              Data source · {sourceLabel}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-4">
            {type.plural} for Sale in {city.name}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400">{range.label}</span>
          </h1>

          <p className="text-base md:text-lg text-gray-300 max-w-3xl font-medium mb-8">
            {type.blurb} Median list price in {city.name} this band: <strong className="text-white">{priceK(snap.medianPrice)}</strong> · <strong className="text-white">{snap.activeListings}</strong> active · avg <strong className="text-white">{snap.daysOnMarket}</strong> days on market.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#request" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition shadow-lg shadow-blue-500/30">
              Get Matched with a {city.name} {type.label} Specialist <ArrowRight size={16} />
            </a>
            <a href="tel:+14372416392" className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition">
              <Phone size={16} /> Call Now
            </a>
          </div>
        </div>
      </section>

      {/* === KEY STATS === */}
      <section className="py-12 md:py-16 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Median List Price" value={priceK(snap.medianPrice)} accent="text-slate-900" />
            <Stat label="Active Listings" value={String(snap.activeListings)} accent="text-blue-600" />
            <Stat label="Avg Days on Market" value={`${snap.daysOnMarket} days`} accent="text-slate-900" />
            <Stat
              label="YoY Change"
              value={`${trendUp ? '+' : ''}${snap.yoyChangePct.toFixed(1)}%`}
              accent={trendUp ? 'text-green-600' : 'text-red-600'}
              icon={trendUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            />
          </div>

          {/* Six-month trend line as a simple inline mini-chart. */}
          <div className="mt-10 bg-gray-50 border border-gray-100 rounded-3xl p-6 md:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">6-Month Median Price Trend</h3>
            <div className="flex items-end gap-2 md:gap-4 h-32">
              {snap.priceTrend.map((m, i) => {
                const max = Math.max(...snap.priceTrend.map((x) => x.price));
                const min = Math.min(...snap.priceTrend.map((x) => x.price));
                const range = max - min || 1;
                const h = 20 + ((m.price - min) / range) * 80;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end">
                    <div className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg transition-all" style={{ height: `${h}%` }} />
                    <p className="text-[9px] font-bold text-gray-500 mt-2 uppercase">{m.month.split(' ')[0]}</p>
                    <p className="text-[10px] font-black text-slate-900">{priceK(m.price)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* === MARKET INSIGHT === */}
      <section className="py-16 md:py-20 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-6">
            What {priceK(snap.medianPrice)} gets you in {city.name}.
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed font-medium mb-8 whitespace-pre-line">{snap.insight}</p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Typical Size</p>
              <p className="text-xl font-black text-slate-900">{type.typicalSize}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Bedroom Range</p>
              <p className="text-xl font-black text-slate-900">{type.typicalBeds}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Ownership Style</p>
              <p className="text-xl font-black text-slate-900 capitalize">{type.ownership === 'mixed' ? 'Freehold or condo' : type.ownership}</p>
            </div>
          </div>
        </div>
      </section>

      {/* === COMPARABLES === */}
      <section className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-8">
            Sample comparables in this band.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {snap.comparables.map((c, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-3xl p-6 hover:border-blue-400 transition">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                  <MapPin size={12} className="text-blue-600" /> {c.address}
                </div>
                <p className="text-3xl font-black text-slate-900 mb-4">{priceK(c.price)}</p>
                <div className="flex gap-4 text-sm font-bold text-gray-700">
                  <span>{c.beds} bed</span><span>{c.baths} bath</span><span>{c.sqft.toLocaleString()} sqft</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-6 font-medium">Sample comparables only — request the live MLS report for current availability and pricing.</p>
        </div>
      </section>

      {/* === NEIGHBORHOOD LINKS === */}
      <section className="py-16 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-6">
            Where these {type.plural.toLowerCase()} are clustered in {city.name}.
          </h2>
          <div className="flex flex-wrap gap-3">
            {city.neighborhoods.map((nbr) => (
              <Link
                key={nbr}
                href={`/real-estate/${city.slug}/neighborhood/${nbr.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="px-5 py-3 rounded-xl bg-white border border-gray-200 hover:border-black hover:bg-slate-900 hover:text-white text-sm font-black uppercase tracking-wide transition"
              >
                {nbr}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* === CROSS-LINKS === */}
      <section className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-8">Keep exploring {city.name}.</h2>

          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Other price ranges</p>
              <ul className="space-y-2">
                {otherRanges.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/real-estate/${city.slug}/${type.slug}/${r.slug}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-slate-900 hover:text-white border border-gray-100 transition group">
                      <span className="font-black text-sm uppercase tracking-wide">{type.plural} {r.label}</span>
                      <ArrowRight size={16} className="opacity-50 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Other property types</p>
              <ul className="space-y-2">
                {otherTypes.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/real-estate/${city.slug}/${t.slug}/${range.slug}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-slate-900 hover:text-white border border-gray-100 transition group">
                      <span className="font-black text-sm uppercase tracking-wide">{t.plural} {range.label}</span>
                      <ArrowRight size={16} className="opacity-50 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Same band in other cities</p>
            <div className="flex flex-wrap gap-3">
              {otherCities.map((c) => (
                <Link key={c.slug} href={`/real-estate/${c.slug}/${type.slug}/${range.slug}`}
                  className="px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-black hover:bg-slate-900 hover:text-white text-sm font-black uppercase tracking-wide transition">
                  {c.name} · {type.plural}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section className="py-16 md:py-20 px-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <ShieldCheck size={32} className="text-blue-400 mb-4" />
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-10">
            {city.name} {type.label} FAQ
          </h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <details key={i} className="group bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 cursor-pointer">
                <summary className="flex justify-between items-center font-black text-base md:text-lg list-none uppercase tracking-tight">
                  {f.q}
                  <span className="text-blue-400 group-open:rotate-180 transition shrink-0 ml-4"><ChevronDown size={18} /></span>
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
            <HomeIcon size={32} className="text-blue-400 mb-4 mx-auto" />
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3 leading-tight">
              Get every {type.label.toLowerCase()} in {city.name} {range.label.toLowerCase()}.
            </h2>
            <p className="text-gray-400 text-base md:text-lg mb-8">
              A licensed advisor sends you the active list within 1 business hour — no obligation, no spam.
            </p>
            <div className="text-left max-w-lg mx-auto bg-white p-2 rounded-[2.5rem] shadow-xl border border-gray-100">
              <LeadForm
                type="Realtor"
                title={`${type.plural} in ${city.name} ${range.label}`}
                subtitle={`Median ${priceK(snap.medianPrice)} · ${snap.activeListings} active`}
                ctaText="Send Me the List"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Small inline stat card used in the key-stats grid. */
function Stat({ label, value, accent, icon }: { label: string; value: string; accent: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 md:p-7">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{label}</p>
      <p className={`text-2xl md:text-3xl font-black tracking-tight ${accent} flex items-center gap-2`}>
        {icon}{value}
      </p>
    </div>
  );
}
