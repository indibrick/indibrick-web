// /mortgage-broker/[city] — commercial-intent landing pages that directly
// target the highest-converting queries in the ICP: "mortgage broker
// {city}", "best mortgage broker {city}", "{city} mortgage rates".
//
// Each of the 50 pages ships:
//   - A unique per-city blurb (from data/mortgageBrokerCities.ts) so the
//     surface doesn't pattern-match as a template variable-swap.
//   - Local rate context (currently from getLiveRates — flag for future
//     enrichment).
//   - FSRA-license trust signal above the fold.
//   - LeadForm inline (mid-page) + at bottom.
//   - Service + FinancialService + FAQPage JSON-LD, with areaServed
//     locked to the specific city.
//
// URL pattern is intentionally distinct from the existing
// /mortgage-real-estate/[city] hub — /mortgage-broker/{city} targets the
// broker-service query specifically; the hub targets the broader
// "mortgage + real estate {city}" query.

import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ShieldCheck, ArrowRight, Phone, CheckCircle, TrendingDown, Clock,
  HelpCircle, Building2, Zap, Users, Target, FileText,
} from 'lucide-react';
import { BROKER_CITIES, getBrokerCity, type BrokerCity } from '../../../data/mortgageBrokerCities';
import { MarketDataService } from '../../../services/MarketDataService';
import { getLiveRates } from '../../../lib/getLiveRates';
import LeadForm from '../../../components/LeadForm';
import JsonLd from '../../../components/JsonLd';
import { buildMetadata } from '../../../lib/buildMetadata';

export const revalidate = 3600;

interface Params {
  city: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  return BROKER_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = getBrokerCity(params.city);
  if (!city) {
    return buildMetadata({
      title: 'Mortgage Broker Not Found',
      description: 'The requested city could not be located.',
      slug: `/mortgage-broker/${params.city}`,
    });
  }
  return buildMetadata({
    title: `Mortgage Broker in ${city.name}, Ontario — IndiBrick (FSRA #12830)`,
    description: `Get a mortgage in ${city.name} from an FSRA-licensed advisor within 1 business hour. IndiBrick brokers deals through Pineapple Financial (FSRA #12830) across 40+ Canadian lenders. Live wholesale rates, no hard credit check for pre-approval.`,
    slug: `/mortgage-broker/${params.city}`,
    titleAbsolute: true,
    keywords: [
      `mortgage broker ${city.name}`,
      `best mortgage broker ${city.name}`,
      `${city.name} mortgage rates`,
      `${city.name} mortgage`,
      `pre-approval ${city.name}`,
      `first time home buyer ${city.name}`,
      `mortgage rates ${city.name} Ontario`,
    ],
  });
}

export default async function MortgageBrokerCityPage({ params }: { params: Params }) {
  const city = getBrokerCity(params.city);
  if (!city) notFound();

  const liveRates = await getLiveRates();

  // Local price context — only if this city is in cityData/HPI. Falls back
  // to a generic sentence otherwise. No invented numbers.
  let priceContext: string | null = null;
  if (city.hasMatrixData) {
    try {
      const snap = await MarketDataService.getSnapshot(city.slug, 'townhouse', '750k-1m');
      if (snap && snap.medianPrice > 0) {
        const priceK = snap.medianPrice >= 1_000_000
          ? `$${(snap.medianPrice / 1_000_000).toFixed(2)}M`
          : `$${Math.round(snap.medianPrice / 1000)}K`;
        priceContext = `Median list price for townhouses in ${city.name} sits at approximately ${priceK} (as of ${snap.asOfDate}), per current CREA HPI + MLS active inventory.`;
      }
    } catch {
      /* fall through */
    }
  }

  const monthYear = new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  // ─── JSON-LD schemas ───

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: `IndiBrick Mortgage Brokerage — ${city.name}`,
    description: `FSRA-licensed mortgage brokerage serving ${city.name}, Ontario. 40+ lender panel, 1-hour licensed-advisor callback, no hard credit check for pre-approval.`,
    provider: { '@id': 'https://indibrick.ca/#organization' },
    areaServed: [
      { '@type': 'City', name: city.name, address: { '@type': 'PostalAddress', addressRegion: 'ON', addressCountry: 'CA' } },
      { '@type': 'AdministrativeArea', name: 'Ontario' },
    ],
    serviceType: 'Mortgage brokerage',
    identifier: [{ '@type': 'PropertyValue', propertyID: 'FSRA', value: '12830' }],
    url: `https://indibrick.ca/mortgage-broker/${city.slug}`,
    telephone: '+1-437-241-6392',
    hoursAvailable: 'Mo-Sa 08:00-20:00',
  };

  const faqs = buildFaqs(city, liveRates);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  // Handful of nearby-region cross-links for internal SEO plumbing.
  const nearby = BROKER_CITIES
    .filter((c) => c.slug !== city.slug && c.region === city.region)
    .slice(0, 6);

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />

      {/* === HERO === */}
      <section className="pt-28 md:pt-32 pb-16 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <nav className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
            <Link href="/" className="hover:text-white">IndiBrick</Link>
            <span className="mx-2">/</span>
            <Link href="/mortgages" className="hover:text-white">Mortgage Broker</Link>
            <span className="mx-2">/</span>
            <span className="text-blue-400">{city.name}</span>
          </nav>

          <div className="inline-flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
              <ShieldCheck size={12} /> FSRA #12830 · Licensed Ontario
            </span>
            <span className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
              {monthYear} Rate Sheet
            </span>
          </div>

          {/* H1 no longer bakes the current rate into the title. Old title
              was templated the same across all 50 pages ("...— 4.29% 5-Yr Fixed"),
              which stacked two independent programmatic fingerprints (identical
              title tail + identical FAQ schema) — flagged by the SEO Specialist
              review pre-deploy. Rate is now a subhead that Google won't cache
              across pages, and it also lives inside the LeadForm as the "reward
              for submitting" per the Growth Hacker review. */}
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-3">
            Mortgage Broker in {city.name},<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400">Ontario</span>
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-black uppercase tracking-widest mb-6">
            Get your locked-in 5-year fixed rate in 1 business hour
          </p>

          <p className="text-base md:text-lg text-gray-300 max-w-3xl font-medium mb-8 leading-relaxed">
            {city.blurb}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#request"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition shadow-lg shadow-blue-500/30"
            >
              Get My {city.name} Rate <ArrowRight size={16} />
            </a>
            <a
              href="tel:+14372416392"
              className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition"
            >
              <Phone size={16} /> Call an Advisor
            </a>
          </div>
        </div>
      </section>

      {/* === LOCAL PRICE / MARKET CONTEXT ===
          Two variants — the 42 cities with cityData/HPI show the real
          benchmark price snapshot; the 8 without fall back to a defensible
          per-city market context line pointing at the local MLS board.
          Fixes SEO Specialist Edit C — the 8 no-HPI cities used to silently
          skip this whole section, creating a visible thin-content gap
          versus their 42 siblings. */}
      {priceContext ? (
        <section className="py-10 md:py-12 px-6 bg-[#FAFAFA] border-b border-gray-100">
          <div className="container mx-auto max-w-4xl">
            <p className="text-sm md:text-base text-gray-700 leading-relaxed font-medium">
              <strong className="text-slate-900">{city.name} price snapshot:</strong> {priceContext}
              {city.representativeNeighborhood && (
                <>
                  {' '}Deep-dive on{' '}
                  <Link href={`/real-estate/${city.slug}/neighborhood/${city.representativeNeighborhood}`} className="text-blue-600 hover:text-blue-800 font-black">
                    {formatSlug(city.representativeNeighborhood)}
                  </Link>{' '}
                  or the full{' '}
                  <Link href={`/real-estate/${city.slug}/condo/under-500k`} className="text-blue-600 hover:text-blue-800 font-black">
                    {city.name} matrix
                  </Link>.
                </>
              )}
            </p>
          </div>
        </section>
      ) : city.marketContextFallback ? (
        <section className="py-10 md:py-12 px-6 bg-[#FAFAFA] border-b border-gray-100">
          <div className="container mx-auto max-w-4xl">
            <p className="text-sm md:text-base text-gray-700 leading-relaxed font-medium">
              <strong className="text-slate-900">{city.name} market context:</strong> {city.marketContextFallback}
            </p>
          </div>
        </section>
      ) : null}

      {/* === WHY INDIBRICK === */}
      <section className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
            Why {city.name} buyers pick IndiBrick.
          </h2>
          <p className="text-sm text-gray-500 mb-10 max-w-3xl leading-relaxed">
            {city.name} mortgage files close on time, at the right rate, when the broker has (a) enough lenders on the panel to find the right product, (b) a licensed agent responding fast, and (c) transparent FSRA licensing.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <Users size={24} className="text-blue-600 mb-4" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2 text-sm">40+ Lenders</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Big-six banks, monolines (First National, MCAP, RFA), Ontario credit unions, and a full alternative + private panel — much broader than any single-bank shop.
              </p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <Clock size={24} className="text-blue-600 mb-4" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2 text-sm">1-Hour Callback</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                A licensed FSRA mortgage agent — not a call-center rep — reaches out within 1 business hour on applications submitted 8am–8pm ET.
              </p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <ShieldCheck size={24} className="text-blue-600 mb-4" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2 text-sm">FSRA #12830</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                IndiBrick brokers through Pineapple Financial Inc. — publicly verifiable license at fsrao.ca. Ask any broker for their FSRA number before signing anything.
              </p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <Zap size={24} className="text-blue-600 mb-4" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2 text-sm">AI-Assisted Intake</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                What used to take 40 minutes of paperwork takes under 5 minutes at /apply. Every submission is reviewed by a licensed agent before the pre-approval letter goes out.
              </p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <TrendingDown size={24} className="text-blue-600 mb-4" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2 text-sm">Wholesale Rates</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Live 5-year fixed from <strong>{liveRates.insured_fixed_5yr}%</strong> (insured), 5-year variable from <strong>{liveRates.insured_variable_5yr}%</strong>. Updated whenever wholesale rate sheets change.
              </p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <Target size={24} className="text-blue-600 mb-4" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2 text-sm">No Hard Credit Check</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pre-approval intake is a soft check only. Your credit score isn&apos;t touched until you accept a lender offer and formally submit for approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === LEAD CAPTURE (mid-page — catches high-intent readers who don't scroll to bottom) === */}
      <section id="request" className="py-16 px-6 bg-slate-900 text-white">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Building2 size={12} /> FSRA #12830 · Licensed Ontario
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
              Get your {city.name} rate.
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
              An FSRA-licensed Ontario mortgage advisor familiar with the {city.name} market will call you back within 1 business hour with your rate options from 40+ lenders. No hard credit check.
            </p>
          </div>
          {/* Reveal the live rate here — Growth Hacker moved it out of the H1
              (where it was giving away the hook before the ask). Now the rate
              is the reward for engaging with the form. */}
          <p className="text-center text-xs md:text-sm text-emerald-300 font-black uppercase tracking-widest mb-4">
            Today&apos;s live rate: {liveRates.insured_fixed_5yr}% insured 5-yr fixed — see what you qualify for
          </p>
          <div className="bg-white p-2 rounded-[2rem] shadow-xl">
            <LeadForm
              type="Mortgage"
              title={`${city.name} Mortgage Broker`}
              subtitle={`FSRA #12830 · 1-hour callback · No hard credit check`}
              ctaText={`Get My ${city.name} Rate`}
              sourcePage={`broker-${city.slug}`}
            />
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="py-16 md:py-20 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-10">
            How it works — {city.name} pre-approval in 5 steps.
          </h2>
          <div className="space-y-6">
            {[
              { n: 1, t: 'Submit at /apply', b: `Complete our AI-assisted intake in under 5 minutes — property target in ${city.name}, income, down payment source, credit tier. Soft check only.` },
              { n: 2, t: 'Licensed advisor callback', b: `An FSRA-licensed Ontario advisor familiar with the ${city.name} market reaches out within 1 business hour (Mon–Sat 8am–8pm ET) to confirm your file and pull rate options.` },
              { n: 3, t: 'Rate shopping across 40+ lenders', b: `Your file is shopped across our full panel — big-six banks, monolines, Ontario credit unions, alternative lenders — depending on your credit tier and product needs.` },
              { n: 4, t: 'Pre-approval letter', b: `You receive a written pre-approval letter naming your maximum purchase price and rate hold (typically 90–120 days) — the same letter ${city.name} sellers expect to see in offer packages.` },
              { n: 5, t: 'Close on the property', b: `When you accept an offer, we file the funding request within 24 hours of condition removal. Your lawyer receives instructions 3–5 days before closing.` },
            ].map((s) => (
              <div key={s.n} className="flex gap-5 md:gap-6">
                <div className="shrink-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-black text-base md:text-lg">
                    {s.n}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900 mb-2">{s.t}</h3>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed">{s.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section className="py-16 md:py-20 px-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-3">
            {city.name} mortgage FAQ.
          </h2>
          <p className="text-sm text-gray-400 uppercase tracking-widest font-black mb-10">
            The questions {city.name} buyers ask most.
          </p>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="group bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 cursor-pointer">
                <summary className="flex justify-between items-start gap-4 font-black text-sm md:text-base list-none">
                  <span className="flex-1 leading-snug">{f.q}</span>
                  <HelpCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                </summary>
                <p className="text-sm text-gray-300 mt-4 leading-relaxed border-t border-white/10 pt-4">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* === FINAL LEAD CAPTURE === */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
              Ready to apply?
            </h2>
            <p className="text-gray-400 text-sm md:text-base mb-6">
              An FSRA-licensed Ontario mortgage agent familiar with the {city.name} market will call you back within 1 business hour. FSRA #12830 · Pineapple Financial.
            </p>
            <div className="bg-white p-2 rounded-[2rem] shadow-xl">
              <LeadForm
                type="Mortgage"
                title={`${city.name} Mortgage Broker`}
                subtitle={`FSRA #12830 · 1-hour callback`}
                ctaText={`Get My ${city.name} Rate`}
                sourcePage={`broker-${city.slug}-bottom`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* === CROSS-LINKS === */}
      {nearby.length > 0 && (
        <section className="py-16 px-6 bg-[#FAFAFA] border-t border-gray-100">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
              Mortgage brokers serving nearby {city.region} cities.
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {nearby.map((n) => (
                <Link
                  key={n.slug}
                  href={`/mortgage-broker/${n.slug}`}
                  className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-black transition group"
                >
                  <p className="font-black text-sm text-slate-900 group-hover:text-blue-600 transition">
                    Mortgage Broker in {n.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {n.region} · FSRA #12830
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/rates" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition">
                <FileText size={12} className="inline mr-1" /> Live Ontario Rates
              </Link>
              <Link href="/guides/first-time-home-buyer-ontario-2026" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition">
                <CheckCircle size={12} className="inline mr-1" /> FTHB Ontario Guide
              </Link>
              <Link href="/housing-index" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition">
                <TrendingDown size={12} className="inline mr-1" /> Ontario Housing Index
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* === STICKY MOBILE CTA BAR ===
          Growth Hacker Fix C — 60%+ of this traffic is mobile, and the
          mid-page LeadForm is 4 scrolls deep from the fold. This bar keeps
          a persistent one-tap conversion path visible from anywhere on
          the page. Desktop hides it (mid-page + bottom LeadForm is enough
          on a large viewport). */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-t border-white/10 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
            <ShieldCheck size={11} className="inline mr-1" /> FSRA #12830
          </p>
          <p className="text-[11px] font-bold text-white/80 truncate">1-hr callback · No hard credit check</p>
        </div>
        <a
          href="#request"
          className="shrink-0 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition shadow-lg shadow-blue-500/40"
        >
          Get My {city.name} Rate <ArrowRight size={11} />
        </a>
      </div>
      <div className="md:hidden h-20" aria-hidden="true" />
    </div>
  );
}

// ─── City-specific FAQ builder ───
// Base questions + per-city phrasing so the FAQPage schema on each of the 50
// pages is meaningfully distinct rather than a variable-swap.

function buildFaqs(city: BrokerCity, rates: { insured_fixed_5yr: string; insured_variable_5yr: string }): { q: string; a: string }[] {
  const base: { q: string; a: string }[] = [
    {
      // Q1 rewritten per AI Citation Strategist review: pure buyer-education
      // criteria first (4 sentences), then a single verification statement
      // about IndiBrick as an example — not a self-recommendation. Perplexity
      // and Claude actively deprioritize FAQs that self-answer into the
      // sponsoring brand.
      q: `Who is the best mortgage broker in ${city.name}?`,
      a: `The best mortgage broker for a ${city.name} file is the one that meets four buyer-facing criteria. First, they hold an active FSRA brokerage license — always verify the number at fsrao.ca before signing anything. Second, they shop your file across a large lender panel (20+ is the practical threshold; 40+ covers all A-lenders, monolines, credit unions, and alternative options). Third, they commit to a response SLA fast enough to matter in a competing-offer market — 1 business hour is the current benchmark, 24 hours is a red flag. Fourth, the person calling you back is a licensed FSRA mortgage agent, not a sales rep. IndiBrick meets all four under FSRA #12830 (via Pineapple Financial Inc.), and any broker you're evaluating in ${city.name} should be able to answer the same four questions in writing.`,
    },
    {
      q: `What are current mortgage rates for ${city.name} buyers?`,
      a: `Live wholesale rates for ${city.name} buyers as of the latest published rate sheet: 5-year fixed insured from ${rates.insured_fixed_5yr}%, 5-year variable insured from ${rates.insured_variable_5yr}%. Rates are the same across Ontario cities — what varies is which lender is willing to fund a specific file based on the property, income profile, and credit tier. See our full rate sheet at /rates and get a quote tailored to your file.`,
    },
    {
      q: `How fast can I get pre-approved in ${city.name}?`,
      a: `IndiBrick issues a real pre-approval letter within 1 business hour of receiving your documents (during Mon–Sat business hours). A traditional broker typically takes 24–48 hours; a bank branch usually takes 3–5 business days. In a competing-offer ${city.name} market that speed is often the deciding factor.`,
    },
    {
      q: `Do you serve first-time home buyers in ${city.name}?`,
      a: `Yes — first-time home buyers are the largest single segment of our ${city.name} deal flow. First-time buyers in Ontario have access to the First Home Savings Account (FHSA, up to $40,000 tax-advantaged per person), the RRSP Home Buyers' Plan (up to $60,000 tax-free per person), the Ontario Land Transfer Tax refund (up to $4,000), and — if buying in Toronto — the municipal LTT refund (up to $4,475). Our full 10-step FTHB Ontario guide walks through the math with real 2026 dollar examples.`,
    },
    {
      q: `Do I need to visit an office in ${city.name}?`,
      a: `No. Our entire pre-approval intake is online at /apply — takes under 5 minutes with AI-assisted document collection. The licensed advisor callback is by phone or video (your preference). Signing is fully electronic. Physical office visits are only required for the final legal closing, which your real estate lawyer handles independently.`,
    },
    {
      q: `Is IndiBrick actually licensed to broker mortgages in ${city.name}?`,
      a: `Yes. IndiBrick brokers mortgages through Pineapple Financial Inc. (FSRA #12830) — the FSRA license authorizes brokerage activity anywhere in Ontario, including ${city.name}. You can verify the license number at fsrao.ca in about 30 seconds. Any broker unable or unwilling to provide their FSRA number is not legitimately licensed.`,
    },
  ];

  // 7th region-specific FAQ per SEO Specialist Edit B — breaks the
  // "50 identical FAQPage schemas" fingerprint. Each of the 11 regions
  // gets a distinct question + answer targeting the specifics of that
  // region's mortgage-broker files.
  const regional = regionalFaq(city);
  return regional ? [...base, regional] : base;
}

function regionalFaq(city: BrokerCity): { q: string; a: string } | null {
  switch (city.region) {
    case 'GTA':
      return {
        q: `How does the mortgage stress test work for a ${city.name} purchase?`,
        a: `Every federally-regulated lender qualifies your ${city.name} file at the higher of your contract rate + 2% or 5.25% — the mortgage stress test. GDS (gross debt service) must land under 39% and TDS (total debt service) under 44%. At ${city.name}'s current price points, the stress-test qualifying income for a median-priced detached typically lands well above $150K gross for a single-income household. We model the exact qualifying math on your file before submission so you don't get surprised at the lender.`,
      };
    case 'Halton':
      return {
        q: `Are executive Halton mortgages (${city.name}) handled differently?`,
        a: `Files above $1M — common in ${city.name}, especially Old Oakville, Alton Village, Kingsway, and Millcroft — get shopped across a narrower A-lender panel (fewer monolines fund jumbo mortgages) and often benefit from private banking overlays if you have investment or business assets. We routinely place ${city.name} files with the credit union and A-lender combinations that specialize in executive borrowers.`,
      };
    case 'Peel':
      return {
        q: `Do you handle multi-generational and gift-letter files in ${city.name}?`,
        a: `${city.name} carries one of Ontario's highest concentrations of multi-generational and gift-supported down-payment files. We handle the paperwork — gift letters, source-of-funds documentation, co-borrower income treatment, and non-resident co-signer specifics — routinely. Every file structure that trips up bank-branch underwriting has a broker-panel lender that funds it.`,
      };
    case 'York':
      return {
        q: `Are ${city.name} broker files typically Chinese-Canadian, Persian-Canadian, or executive-tier?`,
        a: `${city.name} carries a distinctive multi-cultural buyer mix, and our advisors are experienced with the specifics — co-borrower income treatment, foreign income documentation, cash-heavy down payments requiring 90-day source-of-funds, and the property-type preferences (executive detached in Bayview Hill, Unionville, Kleinburg; subway-corridor condos in the Vaughan Metropolitan Centre) that drive most file flow.`,
      };
    case 'Durham':
      return {
        q: `Is ${city.name} still a first-time-buyer-friendly market in 2026?`,
        a: `${city.name} remains one of the GTA's more accessible detached and semi-detached markets, and first-time-buyer files dominate our local deal flow. Combined with the FHSA + RRSP HBP + Ontario LTT refund stack (up to $200K in tax-advantaged down payment capacity for a couple + $4,000 rebate), ${city.name} is often the first realistic detached purchase for buyers priced out of Scarborough or Toronto proper.`,
      };
    case 'Niagara':
      return {
        q: `Are cross-border US or dual-currency files common in ${city.name}?`,
        a: `Yes — ${city.name}'s proximity to Buffalo, Fort Erie, and the US border makes cross-border owner, dual-citizen, and dual-currency mortgage files meaningfully more common than in the rest of Ontario. We handle US income verification, dual-tax-residency documentation, and non-resident purchase specifics regularly on the Niagara belt.`,
      };
    case 'Waterloo':
      return {
        q: `Do you handle tech-industry income structures for ${city.name} buyers?`,
        a: `${city.name}'s tech-industry buyer base often comes with RSU-heavy compensation, US-dollar income, or foreign-employer (US big-tech) T4-equivalent documentation. Not every lender will underwrite these income structures cleanly. Our panel includes the credit unions and A-lenders that specialize in tech comp packages — down to how vesting schedules and stock-based comp get treated in your qualifying income.`,
      };
    case 'Southwestern':
      return {
        q: `Are agricultural, manufacturing, or cross-border US files common for ${city.name}?`,
        a: `${city.name} carries a distinctive southwestern Ontario buyer mix — manufacturing income (Chatham auto, Sarnia Chemical Valley, Windsor Ford/Chrysler), agricultural income requiring Farm Credit Canada or RBC Agriculture treatment, and cross-border Michigan proximity. Our brokerage handles each of these file specifics routinely; bank branches often don't.`,
      };
    case 'Eastern':
      return {
        q: `Do federal pension income and Canadian Forces relocations work differently for ${city.name} files?`,
        a: `${city.name}'s buyer base includes a meaningful share of federal government pension income, active-duty Canadian Forces, and RCMP household files. Each has specific qualifying-income treatment (indexed pension income, IRP relocation programs for CF members, DND buyer-benefit overlays). Not all A-lenders underwrite these cleanly — we routinely place them with the credit unions and A-lenders that specialize.`,
      };
    case 'Central':
      return {
        q: `Are ${city.name} broker files mostly first-time-buyer or GTA-commuter?`,
        a: `${city.name} sits in central Ontario's commuter corridor — a meaningful share of local broker files are Toronto- or Barrie-employed households trading commute for value, plus first-time-buyer families using the GO extension. Common file specifics: Toronto-employment income verification, longer commute-friendly amortizations (30-year on new-build insured), and dual-city relocation timelines.`,
      };
    case 'Northern':
      return {
        q: `Are appraisal, mining-industry income, and remote-file specifics common for ${city.name}?`,
        a: `${city.name}'s northern Ontario location introduces a few specifics that GTA broker files don't have. Property appraisals sometimes take longer (fewer AACI-designated appraisers per capita). Mining-industry rotational income (2-weeks-on/2-weeks-off) needs specific handling with certain lenders. And remote-closing coordination between our advisors, your real estate lawyer, and the lender is what we do most days.`,
      };
    default:
      return null;
  }
}

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
