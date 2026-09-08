import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  TrendingUp, TrendingDown, Activity, Home as HomeIcon,
  ArrowRight, Phone, ShieldCheck, ChevronDown, Info, Calculator,
} from 'lucide-react';
import { CITIES } from '../../../../../data/cityData';
import {
  PROPERTY_TYPES, PRICE_RANGES, getTypeBySlug, getPriceRangeBySlug,
} from '../../../../../data/matrixData';
import { MarketDataService } from '../../../../../services/MarketDataService';
import LeadForm from '../../../../../components/LeadForm';
import JsonLd from '../../../../../components/JsonLd';
import { buildMetadata } from '../../../../../lib/buildMetadata';
import { getLiveRates } from '../../../../../lib/getLiveRates';
import { computeBandMath, cad, type BandMath } from '../../../../../lib/canadianMortgageMath';

// ISR — every matrix cell page regenerates at most once per hour.
export const revalidate = 3600;

interface Params {
  city: string;
  type: string;
  priceRange: string;
}

// Pre-render every (city × type × priceRange) tuple. Note that rendering is NOT
// the same as indexing: only the cells that pass
// MarketDataService.getCellIndexability() ship an indexable robots tag, and only
// those appear in the sitemap. The rest stay reachable (noindex,follow) so users
// who land on them get a real answer and link equity still flows through.
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

/** Compact price label used in titles + stat cards. */
const priceK = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`;

/**
 * The three purchase prices a band page runs its mortgage math at: the band
 * floor, midpoint and ceiling. These are illustrative purchase prices — clearly
 * labelled as such — not claims about what anything sold for.
 */
function bandPricePoints(min: number, max: number): number[] {
  const low = min === 0 ? 250_000 : min;
  // PRICE_RANGES bands are HALF-OPEN — withinBand() tests `price < hi`, and
  // the next band's `min` equals this band's `max`. Using `max` as the ceiling
  // price point therefore prices a home that belongs to the NEXT band.
  //
  // This mattered most on $1M–$1.5M, where `max` landed exactly on the CMHC
  // insurability cliff: the page quoted $300,000 (20%, uninsurable) when the
  // true band ceiling of $1,499,999 needs $125,000 (8.33%) WITH insurance
  // available — a 2.4x overstatement of required cash, in visible copy and in
  // FAQPage structured data, across 168 pages.
  const high = max === Number.MAX_SAFE_INTEGER ? 3_000_000 : max - 1;
  const mid = Math.round((low + high) / 2 / 1000) * 1000;
  return [low, mid, high];
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

  const slug = `/real-estate/${params.city}/${params.type}/${params.priceRange}`;
  const [snap, verdict, rates] = await Promise.all([
    MarketDataService.getSnapshot(params.city, params.type, params.priceRange),
    MarketDataService.getCellIndexability(params.city, params.type, params.priceRange),
    getLiveRates(),
  ]);

  // Title + description are built from the REAL benchmark, the CREA release
  // month and band-specific federal down-payment / land-transfer-tax math. Two
  // sibling pages therefore differ by actual figures rather than by a swapped
  // city token — which is what a title-tag-level duplicate looks like to Google.
  const [low, , high] = bandPricePoints(range.min, range.max);
  const contractRate = rates ? parseFloat(rates.insured_fixed_5yr) || 5.25 : 5.25;
  const mathLow = computeBandMath(low, contractRate, city.slug);
  const mathHigh = computeBandMath(high, contractRate, city.slug);

  const title = snap.benchmark
    ? `${type.plural} in ${city.name} ${range.short} | ${priceK(snap.benchmark)} Benchmark`
    : `${type.plural} in ${city.name} ${range.short}`;

  const yoyBit =
    snap.yoyChangePct !== null
      ? `, ${snap.yoyChangePct >= 0 ? '+' : ''}${snap.yoyChangePct.toFixed(1)}% YoY`
      : '';

  // Kept close to 160 characters so Google renders it whole, and front-loaded
  // with the two figures that differ most between sibling URLs — the regional
  // benchmark and the band's minimum down payment.
  const description = snap.benchmark
    ? `${snap.regionLabel} ${type.label.toLowerCase()} benchmark ${cad(snap.benchmark)} (${snap.asOfLabel}${yoyBit}). ${range.short} in ${city.name}: ${cad(mathLow.minDown)}–${cad(mathHigh.minDown)} min down, ${cad(mathLow.totalLtt)}–${cad(mathHigh.totalLtt)} land transfer tax.`
    : `${range.short} ${type.plural.toLowerCase()} in ${city.name}, Ontario: ${cad(mathLow.minDown)}–${cad(mathHigh.minDown)} minimum down payment, ${cad(mathLow.totalLtt)}–${cad(mathHigh.totalLtt)} land transfer tax, plus the B-20 stress-test math for this band.`;

  const meta = buildMetadata({
    title,
    description,
    slug,
    titleAbsolute: true,
    keywords: [
      `${type.plural} for sale ${city.name}`,
      `${city.name} ${type.label.toLowerCase()} ${range.short}`,
      `${city.name} ${type.label.toLowerCase()} down payment`,
      `${city.name} ${type.label.toLowerCase()} benchmark price`,
      `land transfer tax ${city.name}`,
    ],
  });

  // Cells with no honest headline number stay crawlable but out of the index.
  if (!verdict.indexable) {
    meta.robots = { index: false, follow: true };
  }
  return meta;
}

export default async function MatrixCellPage({ params }: { params: Params }) {
  const { city, type, range } = resolveCell(params);
  if (!city || !type || !range) notFound();

  const [snap, verdict, liveRates, comparableMarkets] = await Promise.all([
    MarketDataService.getSnapshot(params.city, params.type, params.priceRange),
    MarketDataService.getCellIndexability(params.city, params.type, params.priceRange),
    getLiveRates(),
    MarketDataService.getComparableMarkets(params.city, 6),
  ]);

  const currentYear = new Date().getFullYear();
  const contractRate = liveRates ? parseFloat(liveRates.insured_fixed_5yr) || 5.25 : 5.25;
  // A rate we cannot source is a rate we do not quote. Every "Live"/"Today"
  // badge below is gated on this — see lib/getLiveRates.ts for why the module
  // returns null instead of falling back to constants.
  const fixed5 = liveRates?.insured_fixed_5yr ?? null;

  // ─── Band-specific Canadian mortgage math ───
  // This is the content that actually differs from band to band. The federal
  // rules step at $500K (5% → 10% marginal down payment) and $1.5M (insurance
  // unavailable, 20% minimum, 30-yr amortization), and Ontario LTT steps at
  // $55K / $250K / $400K / $2M — so the numbers below are genuinely different
  // per band rather than the same paragraph with a different dollar token.
  const pricePoints = bandPricePoints(range.min, range.max);
  const bandMath: BandMath[] = pricePoints.map((p) => computeBandMath(p, contractRate, city.slug));
  const midMath = bandMath[1];
  const isToronto = city.slug === 'toronto';

  // Where does the real benchmark actually sit? Used both for the honest
  // "this band isn't where this market trades" answer and to route the reader
  // (and Google) to the one band page that IS worth ranking for this market.
  const homeBand = snap.benchmark
    ? PRICE_RANGES.find((r) => snap.benchmark! >= r.min && snap.benchmark! < r.max) || null
    : null;
  const benchmarkElsewhere = Boolean(snap.benchmark && homeBand && homeBand.slug !== range.slug);

  const trendUp = (snap.yoyChangePct ?? 0) >= 0;

  // Cross-link sets for internal SEO + on-page nav.
  const otherTypes = PROPERTY_TYPES.filter((t) => t.slug !== type.slug);
  const otherRanges = PRICE_RANGES.filter((r) => r.slug !== range.slug);

  // ─── FAQ ───
  // Every answer below resolves to either a published CREA figure or a federal
  // /provincial rule. Nothing here is modelled.
  const faqs: { q: string; a: string }[] = [];

  if (snap.benchmark) {
    faqs.push({
      q: `What is the benchmark price for a ${type.label.toLowerCase()} in ${city.name}?`,
      a: `The CREA MLS® Home Price Index benchmark for ${type.label.toLowerCase()}s in the ${snap.regionLabel} area — the reporting region that covers ${city.name} — is ${cad(snap.benchmark)} as of the ${snap.asOfLabel} release${snap.yoyChangePct !== null ? `, ${trendUp ? 'up' : 'down'} ${Math.abs(snap.yoyChangePct).toFixed(1)}% year-over-year` : ''}. CREA publishes the HPI at the board/region level, not per municipality, so this figure covers ${city.name} together with the rest of the ${snap.regionLabel} reporting area.`,
    });
  }

  faqs.push({
    q: `What is the minimum down payment on a ${range.label.toLowerCase()} home in Ontario?`,
    a: `Federal minimums are 5% on the first $500,000 and 10% on the portion between $500,000 and $1,499,999; at $1,500,000 and above mortgage default insurance is unavailable and 20% down is required. In the ${range.short} band that works out to ${cad(bandMath[0].minDown)} at ${cad(pricePoints[0])} and ${cad(bandMath[2].minDown)} at ${cad(pricePoints[2])}.`,
  });

  faqs.push({
    q: `How much land transfer tax will I pay on a ${range.label.toLowerCase()} purchase in ${city.name}?`,
    a: isToronto
      ? `Toronto buyers pay both provincial and municipal land transfer tax. On a ${cad(midMath.price)} purchase that is ${cad(midMath.provincialLtt)} provincial plus ${cad(midMath.municipalLtt)} municipal — ${cad(midMath.totalLtt)} in total. First-time buyers can claim up to $4,000 provincially and up to $4,475 municipally, which on this purchase price reduces the bill by ${cad(midMath.fthbRefund)}.`
      : `Ontario land transfer tax on a ${cad(midMath.price)} purchase in ${city.name} is ${cad(midMath.provincialLtt)}. ${city.name} does not levy a municipal land transfer tax — only the City of Toronto does. First-time buyers can claim a provincial refund of up to $4,000, worth ${cad(midMath.fthbRefund)} on this purchase price.`,
  });

  faqs.push({
    q: `What income do I need to qualify for a ${range.label.toLowerCase()} home in ${city.name}?`,
    a: `Federally regulated lenders qualify you at the greater of your contract rate plus 2% or 5.25% — currently ${midMath.qualifyingRatePct.toFixed(2)}% against a ${contractRate.toFixed(2)}% contract rate. On a ${cad(midMath.price)} purchase with 20% down (a ${cad(midMath.conventionalPrincipal)} mortgage), principal and interest is ${cad(midMath.paymentAtContract)}/month at the contract rate but ${cad(midMath.paymentAtQualifying)}/month at the qualifying rate — and the qualifying figure is the one your gross debt service ratio is measured against. Property tax, heat and condo fees are additional and vary by property, so speak to a licensed advisor for a figure on your specific file.`,
  });

  if (range.min >= 1_500_000) {
    faqs.push({
      q: `Can I buy a ${cad(range.min)}+ home with less than 20% down?`,
      a: `No. Mortgage default insurance from CMHC, Sagen and Canada Guaranty is capped at a $1,500,000 purchase price, so any purchase at or above that figure requires a minimum 20% down payment and is written as a conventional (uninsured) mortgage. Uninsured mortgages can be amortized up to 30 years, and the lender panel that funds them is narrower than at lower price points.`,
    });
  } else {
    faqs.push({
      q: `Is CMHC insurance required in the ${range.short} band?`,
      a: `Mortgage default insurance is required whenever you put down less than 20%. At ${cad(midMath.price)} the minimum down payment is ${cad(midMath.minDown)} (${midMath.minDownPct}%), which puts the premium at ${midMath.cmhcPremiumPct ? `${midMath.cmhcPremiumPct.toFixed(2)}% of the loan — about ${cad(midMath.cmhcPremium)}, added to the mortgage rather than paid up front` : 'nil, because that down payment is already 20% or more'}. Insured mortgages amortize over 25 years, extended to 30 for first-time buyers and newly built homes.`,
    });
  }

  if (benchmarkElsewhere && homeBand) {
    faqs.push({
      q: `Do ${type.plural.toLowerCase()} in ${city.name} actually trade in the ${range.short} range?`,
      a: `Not typically. The ${snap.regionLabel} ${type.label.toLowerCase()} benchmark of ${cad(snap.benchmark!)} sits in the ${homeBand.label} band, so that is where the bulk of ${city.name} ${type.plural.toLowerCase()} transactions cluster. ${range.short} inventory exists but is not representative of this market. For the figures that describe where this market actually trades, see our ${city.name} ${type.plural.toLowerCase()} ${homeBand.label} page.`,
    });
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  // Dataset schema replaces the old ItemList of invented "Residence" comparables.
  // We now describe what we actually publish: a derived view of the CREA HPI.
  const datasetSchema = snap.benchmark
    ? {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: `${snap.regionLabel} ${type.label} benchmark price — ${snap.asOfLabel}`,
        description: `CREA MLS® Home Price Index benchmark price for ${type.plural.toLowerCase()} in the ${snap.regionLabel} reporting region, as applied to ${city.name}, Ontario.`,
        temporalCoverage: snap.asOfDate ?? undefined,
        spatialCoverage: { '@type': 'Place', name: `${city.name}, Ontario, Canada` },
        isBasedOn: 'https://www.crea.ca/housing-market-stats/mls-home-price-index/',
        creator: { '@id': 'https://indibrick.ca/#organization' },
        url: `https://indibrick.ca/real-estate/${city.slug}/${type.slug}/${range.slug}`,
      }
    : null;

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={faqSchema} />
      {datasetSchema && <JsonLd data={datasetSchema} />}

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
            {snap.hasRealData ? (
              <Link
                href={`/housing-index#${params.city}`}
                className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 hover:bg-blue-500/25 transition px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md"
              >
                <Activity size={12} /> CREA MLS® HPI · {snap.asOfLabel}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-gray-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
                <Info size={12} /> No published benchmark for this market
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-4">
            {type.plural} for Sale in {city.name}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400">{range.label}</span>
          </h1>

          {/* Live-rate hook — pulled from Firestore site_settings/mortgage_rates. */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-[11px] md:text-xs font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            {liveRates ? `Today: 5-yr fixed from ${liveRates.insured_fixed_5yr}% · 5-yr variable from ${liveRates.insured_variable_5yr}%` : 'Licensed advisor callback in 1 business hour'}
          </div>

          <p className="text-base md:text-lg text-gray-300 max-w-3xl font-medium mb-8">
            {snap.benchmark ? (
              <>
                {snap.regionLabel} {type.label.toLowerCase()} benchmark: <strong className="text-white">{cad(snap.benchmark)}</strong>
                {snap.yoyChangePct !== null && (
                  <> · <strong className="text-white">{trendUp ? '+' : ''}{snap.yoyChangePct.toFixed(1)}%</strong> year-over-year</>
                )}
                {' '}· minimum down payment in this band <strong className="text-white">{cad(bandMath[0].minDown)}–{cad(bandMath[2].minDown)}</strong>.
              </>
            ) : (
              <>
                CREA does not publish an MLS® HPI benchmark covering {city.name} {type.plural.toLowerCase()}, so this page shows no price figure. What it does show is exact: the federal down-payment rules, CMHC premium tiers and Ontario land transfer tax for the {range.short} band.
              </>
            )}
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

      {/* === MOBILE INLINE LEAD FORM === */}
      <section className="md:hidden px-6 -mt-6 mb-6 relative z-20">
        <div className="bg-white border border-gray-200 rounded-[2rem] shadow-xl p-5">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-3">
            Get the live list
          </div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 mb-1 leading-tight">
            {city.name} {type.plural.toLowerCase()} · {range.short}
          </h2>
          <p className="text-xs text-gray-600 mb-3">
            Current MLS® inventory sent within 1 business hour{fixed5 ? ` with today's ${fixed5}% 5-yr fixed rate` : ''}.
          </p>
          <LeadForm
            type="Realtor"
            title={`${type.plural} in ${city.name} ${range.label}`}
            subtitle={fixed5 ? `${range.short} · ${fixed5}% 5-yr fixed` : range.short}
            ctaText="Get Live MLS List + Rate"
          />
        </div>
      </section>

      {/* === REAL BENCHMARK STATS ===
          Only rendered when CREA actually publishes a figure for this market.
          The four-stat grid this replaced showed a seeded median price, a seeded
          active-listing count and a seeded days-on-market — none of which came
          from any market. */}
      {snap.benchmark && (
        <section className="py-12 md:py-16 px-6 bg-white border-b border-gray-100">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="CREA Benchmark" value={cad(snap.benchmark)} accent="text-slate-900" />
              <Stat
                label="Year-over-Year"
                value={snap.yoyChangePct !== null ? `${trendUp ? '+' : ''}${snap.yoyChangePct.toFixed(1)}%` : 'Not published'}
                accent={snap.yoyChangePct === null ? 'text-gray-400' : trendUp ? 'text-green-600' : 'text-red-600'}
                icon={snap.yoyChangePct === null ? undefined : trendUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              />
              <Stat label="Reporting Region" value={snap.regionLabel || '—'} accent="text-slate-900" />
              <Stat label="Release" value={snap.asOfLabel || '—'} accent="text-blue-600" />
            </div>

            {/* Real 13-month CREA benchmark series. The previous chart on this
                page was generated by seeding a PRNG with the URL slug. */}
            {snap.benchmarkTrend.length > 1 && (
              <div className="mt-10 bg-gray-50 border border-gray-100 rounded-3xl p-6 md:p-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  {snap.regionLabel} {type.label} Benchmark — Last {snap.benchmarkTrend.length} Months
                </h3>
                <p className="text-[11px] text-gray-400 font-medium mb-5">
                  Source: CREA MLS® Home Price Index, not seasonally adjusted.
                </p>
                <div className="flex items-end gap-1.5 md:gap-3 h-32">
                  {snap.benchmarkTrend.map((m, i) => {
                    const prices = snap.benchmarkTrend.map((x) => x.price);
                    const max = Math.max(...prices);
                    const min = Math.min(...prices);
                    const spread = max - min || 1;
                    const h = 20 + ((m.price - min) / spread) * 80;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${m.month}: ${cad(m.price)}`}>
                        <div className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg transition-all" style={{ height: `${h}%` }} />
                        <p className="text-[8px] md:text-[9px] font-bold text-gray-500 mt-2 uppercase">{m.month.split(' ')[0]}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-black text-slate-900">
                  <span>{snap.benchmarkTrend[0].month} · {priceK(snap.benchmarkTrend[0].price)}</span>
                  <span>{snap.benchmarkTrend[snap.benchmarkTrend.length - 1].month} · {priceK(snap.benchmarkTrend[snap.benchmarkTrend.length - 1].price)}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* === HONEST BAND-MISMATCH ANSWER ===
          When the real benchmark sits in a different band, saying so plainly is
          both the truthful answer and the fix for a doorway-page pattern: the
          page stops pretending to be the authority for a price range this market
          doesn't trade in, and routes the reader to the page that is. */}
      {benchmarkElsewhere && homeBand && (
        <section className="py-10 px-6 bg-amber-50 border-b border-amber-100">
          <div className="container mx-auto max-w-4xl flex flex-col md:flex-row md:items-center gap-4">
            <Info size={28} className="text-amber-600 shrink-0" />
            <p className="text-sm md:text-base text-amber-900 leading-relaxed font-medium flex-1">
              <strong>{city.name} {type.plural.toLowerCase()} do not typically trade in the {range.short} range.</strong>{' '}
              The {snap.regionLabel} {type.label.toLowerCase()} benchmark is {cad(snap.benchmark!)}, which falls in the {homeBand.label} band. This page still gives you the exact down-payment, insurance and land-transfer-tax rules for a {range.short} purchase — but for market figures,{' '}
              <Link href={`/real-estate/${city.slug}/${type.slug}/${homeBand.slug}`} className="underline font-black hover:text-amber-700">
                see {city.name} {type.plural.toLowerCase()} {homeBand.label}
              </Link>.
            </p>
          </div>
        </section>
      )}

      {/* === AEO ANSWER BLOCKS === */}
      <section className="py-16 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-4xl space-y-12">
          {snap.benchmark && (
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">
                What does a {type.label.toLowerCase()} cost in {city.name} in {currentYear}?
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                The CREA MLS® Home Price Index benchmark for {type.plural.toLowerCase()} in the {snap.regionLabel} reporting region — which covers {city.name} — is <strong className="text-slate-900">{cad(snap.benchmark)}</strong> as of the {snap.asOfLabel} release
                {snap.yoyChangePct !== null && (
                  <>, {trendUp ? 'up' : 'down'} <strong className="text-slate-900">{Math.abs(snap.yoyChangePct).toFixed(1)}%</strong> year-over-year</>
                )}
                . The HPI benchmark describes a typical home for the region rather than an average of what sold, and CREA publishes it per real estate board rather than per municipality — so this figure covers {city.name} alongside the rest of the {snap.regionLabel} area. IndiBrick does not currently license an MLS® feed, so we do not publish active listing counts or days-on-market for this market; a licensed advisor pulls those live for you on request.
              </p>
            </div>
          )}

          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">
              How much do you need to buy a {range.label.toLowerCase()} {type.label.toLowerCase()} in {city.name}?
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed font-medium">
              On a <strong className="text-slate-900">{cad(midMath.price)}</strong> purchase you need a minimum down payment of <strong className="text-slate-900">{cad(midMath.minDown)}</strong> ({midMath.minDownPct}%){midMath.cmhcPremiumPct
                ? <>, plus a mortgage default insurance premium of {midMath.cmhcPremiumPct.toFixed(2)}% — about {cad(midMath.cmhcPremium)}, capitalized into the mortgage rather than paid at closing. </>
                : <>. At this price mortgage default insurance is unavailable, so 20% down is a hard floor and the mortgage is written as conventional. </>}
              Land transfer tax adds <strong className="text-slate-900">{cad(midMath.totalLtt)}</strong>{isToronto ? ' (Ontario plus the City of Toronto municipal levy),' : ' provincially,'} reduced by up to {cad(midMath.fthbRefund)} if you are a first-time buyer. Lenders will qualify you at {midMath.qualifyingRatePct.toFixed(2)}% under the B-20 stress test, not the {contractRate.toFixed(2)}% contract rate — a difference of {cad(midMath.paymentAtQualifying - midMath.paymentAtContract)} per month on the same {cad(midMath.conventionalPrincipal)} mortgage.
            </p>
          </div>
        </div>
      </section>

      {/* === BAND MATH TABLE ===
          The genuinely band-specific content. Federal down-payment rules step at
          $500K and $1.5M; Ontario LTT steps at $55K/$250K/$400K/$2M; CMHC premium
          tiers step at 85% and 90% LTV. A table structured this way is also the
          shape Google lifts into featured snippets for "down payment on a $X home". */}
      <section className="py-16 md:py-20 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-5xl">
          <Calculator size={32} className="text-blue-600 mb-4" />
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-3">
            {range.label} in {city.name}: the actual numbers.
          </h2>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-8 max-w-3xl">
            Illustrative purchase prices across the {range.short} band. Payments are principal and interest at the {midMath.qualifyingRatePct.toFixed(2)}% B-20 qualifying rate
            (today&apos;s {contractRate.toFixed(2)}% insured 5-year fixed plus 2%) on a 25-year amortization, using the mortgage you would carry at the minimum down payment — with the CMHC premium capitalized where one applies.
            Canadian semi-annual compounding is used throughout. Property tax, heat and condo fees are excluded; they vary by property and municipality.
          </p>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Purchase price</th>
                  <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Minimum down</th>
                  <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-gray-500">CMHC premium</th>
                  <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {isToronto ? 'Land transfer tax (ON + TO)' : 'Ontario land transfer tax'}
                  </th>
                  <th className="py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Payment at min. down, {midMath.qualifyingRatePct.toFixed(2)}%
                  </th>
                </tr>
              </thead>
              <tbody>
                {bandMath.map((m) => (
                  <tr key={m.price} className="border-b border-gray-200">
                    <td className="py-4 pr-4 font-black text-slate-900">{cad(m.price)}</td>
                    <td className="py-4 pr-4 text-gray-700 font-medium">
                      {cad(m.minDown)} <span className="text-gray-400">({m.minDownPct}%)</span>
                    </td>
                    <td className="py-4 pr-4 text-gray-700 font-medium">
                      {m.cmhcPremiumPct ? `${cad(m.cmhcPremium)} (${m.cmhcPremiumPct.toFixed(2)}%)` : <span className="text-gray-400">Not available — 20% down required</span>}
                    </td>
                    <td className="py-4 pr-4 text-gray-700 font-medium">{cad(m.totalLtt)}</td>
                    <td className="py-4 pr-4 text-gray-700 font-medium">{cad(m.paymentAtQualifyingMinDown)}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Max amortization</p>
              <p className="text-xl font-black text-slate-900">{midMath.insurable ? '25–30 years' : '30 years'}</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {midMath.insurable
                  ? '25 years on an insured mortgage, extended to 30 for first-time buyers and newly built homes.'
                  : 'Above the $1.5M insurance ceiling the mortgage is conventional, so 30-year amortizations are available.'}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Typical {type.label.toLowerCase()}</p>
              <p className="text-xl font-black text-slate-900">{type.typicalSize}</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{type.typicalBeds} · {type.ownership === 'mixed' ? 'freehold or condo' : type.ownership}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Stress-test gap</p>
              <p className="text-xl font-black text-slate-900">{cad(midMath.paymentAtQualifying - midMath.paymentAtContract)}/mo</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Difference between the {contractRate.toFixed(2)}% contract rate and the {midMath.qualifyingRatePct.toFixed(2)}% B-20 qualifying rate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === PROVENANCE ===
          Replaces a social-proof block that rendered an invented "families helped
          in {city}" counter and attributed one of ten stock testimonials to
          whichever city the URL named. Stating precisely what is measured, by
          whom, and what we deliberately do not publish is a stronger E-E-A-T
          signal than either. */}
      <section className="py-12 px-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-6">How this page is sourced.</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Price data</p>
              <p className="text-gray-300 leading-relaxed">
                {snap.hasRealData
                  ? `CREA MLS® Home Price Index, ${snap.regionLabel} region, ${snap.asOfLabel} release. Benchmark prices, not averages of sold listings.`
                  : `CREA does not publish an MLS® HPI series covering ${city.name} ${type.plural.toLowerCase()}, so no price figure is shown on this page.`}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Mortgage rules</p>
              <p className="text-gray-300 leading-relaxed">
                Department of Finance Canada down-payment minimums, CMHC premium schedule, OSFI Guideline B-20 qualifying rate, and the Ontario Land Transfer Tax Act{isToronto ? ' plus the City of Toronto MLTT by-law' : ''}.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Not published here</p>
              <p className="text-gray-300 leading-relaxed">
                Active inventory counts, days-on-market and comparable sales require a licensed MLS® feed. We don&apos;t estimate them — a licensed advisor pulls them live for your search.
              </p>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-8">
            IndiBrick brokers through Pineapple Financial Inc. · FSRA #12830 · Verify at fsrao.ca
          </p>
        </div>
      </section>

      {/* === NEIGHBORHOOD LINKS === */}
      <section className="py-16 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-6">
            {city.name} neighbourhoods.
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
                      <span className="font-black text-sm uppercase tracking-wide">
                        {type.plural} {r.label}
                        {homeBand?.slug === r.slug && <span className="ml-2 text-blue-600 group-hover:text-blue-300">· benchmark band</span>}
                      </span>
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

          {/* Comparable markets — same CREA reporting region first, then nearest
              price tier. Previously this block listed the same six cities on
              every page in the matrix. */}
          {comparableMarkets.length > 0 && (
            <div className="mt-12">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
                Comparable Ontario markets{snap.regionLabel ? ` · ${snap.regionLabel} region and nearby` : ''}
              </p>
              <div className="flex flex-wrap gap-3">
                {comparableMarkets.map((c) => (
                  <Link key={c.slug} href={`/real-estate/${c.slug}/${type.slug}/${range.slug}`}
                    className="px-5 py-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-black hover:bg-slate-900 hover:text-white text-sm font-black uppercase tracking-wide transition">
                    {c.name} · {type.plural}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* === FAQ === */}
      <section className="py-16 md:py-20 px-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <ShieldCheck size={32} className="text-blue-400 mb-4" />
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-10">
            {city.name} {type.label} · {range.short} FAQ
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

      {/* === DUAL CTA === */}
      <section id="request" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6">
            {/* PRIMARY: see active listings */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/15 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-5">
                  Step 1 · See Inventory
                </div>
                <HomeIcon size={32} className="text-blue-400 mb-4" />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3 leading-tight">
                  Get the live {city.name} {type.label.toLowerCase()} list.
                </h2>
                <p className="text-gray-400 text-sm md:text-base mb-6">
                  We don&apos;t publish inventory counts we can&apos;t verify — a licensed {city.name} advisor pulls current MLS® {range.short} inventory{fixed5 ? ` and today's rate (${fixed5}% 5-yr fixed)` : ' and current rates'} within 1 business hour.
                </p>
                <div className="bg-white p-2 rounded-[2rem] shadow-xl">
                  <LeadForm
                    type="Realtor"
                    title={`${type.plural} in ${city.name} ${range.label}`}
                    subtitle={fixed5 ? `${range.short} · ${fixed5}% 5-yr fixed` : range.short}
                    ctaText="Get Live MLS List + Rate"
                  />
                </div>
              </div>
            </div>

            {/* SECONDARY: pre-approval */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
              <div className="relative flex flex-col flex-1">
                <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-5">
                  Step 2 · Lock in financing
                </div>
                <ShieldCheck size={32} className="text-white mb-4" />
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3 leading-tight">
                  Get pre-approved for a {cad(midMath.conventionalPrincipal)} mortgage.
                </h2>
                <p className="text-blue-100 text-sm md:text-base mb-6">
                  Based on a {cad(midMath.price)} purchase with 20% down. We&apos;ll qualify you at the {midMath.qualifyingRatePct.toFixed(2)}% B-20 rate, not the headline rate, so your pre-approval holds. Compare offers across 50+ Canadian lenders. No hard credit check.
                </p>
                <div className="mt-auto space-y-3">
                  <a href="/apply" className="block w-full bg-white text-slate-900 hover:bg-gray-100 text-center py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg flex items-center justify-center gap-2">
                    Get Pre-Approved <ArrowRight size={16} />
                  </a>
                  <a href="tel:+14372416392" className="block w-full bg-slate-900/40 backdrop-blur border border-white/20 text-white hover:bg-slate-900/60 text-center py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center gap-2">
                    <Phone size={14} /> Call a Broker Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === DESKTOP STICKY SIDEBAR CTA === */}
      <aside className="hidden md:block fixed bottom-6 right-6 z-30 w-72 bg-white border border-gray-200 rounded-[2rem] shadow-2xl p-5">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          {fixed5 ? `Live · ${fixed5}% 5-yr fixed` : 'Licensed advisor callback'}
        </div>
        <p className="text-sm font-black text-slate-900 leading-snug mb-1">
          {cad(midMath.minDown)} minimum down
        </p>
        <p className="text-[11px] text-gray-600 mb-3 leading-snug">
          {city.name} {type.label.toLowerCase()}s, {range.short} band.
        </p>
        <a
          href="#request"
          className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition shadow-lg shadow-blue-500/30"
        >
          Get Live MLS List + Rate <ArrowRight size={12} className="inline-block ml-1" />
        </a>
      </aside>

      {/* === MOBILE STICKY CTA BAR === */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-t border-white/10 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
        <a
          href="/apply"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg shadow-blue-500/40"
        >
          {fixed5 ? `Apply Now · ${fixed5}% 5-yr Fixed` : 'Apply Now'} <ArrowRight size={14} />
        </a>
      </div>
      <div className="md:hidden h-20" aria-hidden="true" />

      {/* Rendered only so the indexability decision is auditable from the HTML
          without re-running the build. Not visible to users. */}
      <span data-indexable={String(verdict.indexable)} data-reason={verdict.reason} hidden />
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
