'use client';

// Shared shell for every calculator page. Handles:
//   1. Hero band (dark) with title + subtitle
//   2. Breadcrumb
//   3. Slot for the calculator itself
//   4. Share results bar (URL copy + "Get reviewed by a broker" CTA)
//   5. FAQ block (optional)
//   6. Bottom CTA that hands off to the CRM via /apply or /six-minute-approval
//
// Every calculator wraps its body in <CalcChrome>. Ensures visual +
// functional consistency across all 11 tools.

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import BrokerCard from '../BrokerCard';

interface CalcChromeProps {
  title: string;
  subtitle: string;
  accent?: 'blue' | 'emerald' | 'red' | 'amber' | 'purple';
  eyebrow?: string;
  breadcrumb?: { label: string; href?: string }[];
  faq?: { q: string; a: string }[];
  brokerPageSource?: string; // For BrokerCard assignment; falls back to Mudit
  ctaLabel?: string;
  ctaHref?: string;
  /** Absolute path of this calculator, e.g. '/mortgage-payment-calculator'.
   *  Required for SoftwareApplication + BreadcrumbList @id resolution. */
  slug?: string;
  /** Reserved: only pass once a real review count exists. Never a placeholder. */
  ratingCount?: number;
  children: React.ReactNode;
}

const ACCENT_HERO = {
  blue:    'from-blue-600/25',
  emerald: 'from-emerald-500/25',
  red:     'from-red-600/25',
  amber:   'from-amber-500/25',
  purple:  'from-purple-600/25',
};

export function CalcChrome({
  title,
  subtitle,
  accent = 'blue',
  eyebrow = 'Calculator',
  breadcrumb = [{ label: 'Tools', href: '/tools' }],
  faq,
  brokerPageSource,
  ctaLabel = 'Get this reviewed by a licensed broker',
  ctaHref = '/apply',
  children,
  slug,
  ratingCount,
}: CalcChromeProps) {
  // ─── Structured data ────────────────────────────────────────────────
  // This shell renders the FAQ block as plain HTML on 12 calculator pages and
  // emitted NO JSON-LD for any of it. The content was already written and
  // already on the page — it just wasn't machine-readable, so none of it was
  // eligible for FAQ extraction or citation by an answer engine.
  //
  // Three nodes, all derived from props that already exist:
  //   FAQPage        — the q/a pairs each calculator already passes
  //   SoftwareApplication — declares the page IS a calculator, which is what
  //                    "mortgage calculator" queries are actually looking for
  //   BreadcrumbList — the breadcrumb already rendered visually above
  const graph: Record<string, unknown>[] = [];

  if (faq && faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  if (slug) {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `https://indibrick.ca${slug}#calculator`,
      name: title,
      description: subtitle,
      url: `https://indibrick.ca${slug}`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any (web browser)',
      isAccessibleForFree: true,
      // Free tool, no signup. Stated explicitly because "free mortgage
      // calculator" is a high-intent query and answer engines check for it.
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' },
      provider: { '@id': 'https://indibrick.ca/#organization' },
      inLanguage: 'en-CA',
      audience: { '@type': 'Audience', geographicArea: { '@type': 'Country', name: 'Canada' } },
    });
  }

  const crumbs = [...breadcrumb.filter((b) => b.href), { label: title, href: slug }];
  graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.label,
      ...(b.href ? { item: `https://indibrick.ca${b.href}` } : {}),
    })),
  });

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
        }}
      />
      {/* HERO */}
      <section className={`relative bg-slate-900 text-white pt-32 pb-12 md:pt-40 md:pb-16 overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none bg-gradient-to-b ${ACCENT_HERO[accent]} to-transparent`}></div>
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {b.href ? <Link href={b.href} className="hover:text-white transition">{b.label}</Link> : <span>{b.label}</span>}
                <ChevronRight size={12} className="text-gray-600" />
              </React.Fragment>
            ))}
            <span className="text-white">{title}</span>
          </nav>
          <span className="inline-block bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border border-white/10">
            {eyebrow}
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-4 max-w-3xl">
            {title}
          </h1>
          <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>
      </section>

      {/* CALCULATOR BODY */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Suspense boundary — calculators that use useSearchParams for
              URL deep-links need this or Next 14 bails out of static
              rendering on the whole page. The fallback is a skeleton
              that matches the calculator's rough dimensions. */}
          <Suspense fallback={<CalculatorSkeleton />}>
            {children}
          </Suspense>
        </div>
      </section>

      {/* GET THIS REVIEWED CTA — single visible-but-optional action.
          URL is naturally shareable because each calculator syncs its
          inputs to search params (see useUrlState). No PDF, no copy
          button, no confusion. */}
      <section className="py-8 md:py-10 bg-white border-y border-gray-100">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row gap-4 items-center justify-center md:justify-between">
          <p className="text-sm text-slate-600 font-medium text-center md:text-left max-w-xl">
            These numbers are a good estimate. A licensed IndiBrick advisor will tune them against your actual file and current lender rates.
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition shadow-lg whitespace-nowrap"
          >
            <Sparkles size={14} /> {ctaLabel} <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* BROKER CARD */}
      <BrokerCard pageSource={brokerPageSource} accent={accent} />

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-6 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase text-center mb-10">Questions you probably have</h2>
            <div className="space-y-3">
              {faq.map(f => (
                <details key={f.q} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <summary className="cursor-pointer list-none p-5 flex justify-between items-center hover:bg-gray-50 transition">
                    <span className="font-black text-slate-900 text-sm">{f.q}</span>
                    <span className={`font-black text-xl group-open:rotate-45 transition text-${accent === 'slate' ? 'blue' : accent}-600`}>+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section className="py-16 md:py-20 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4 leading-tight">Real numbers, real broker.</h2>
          <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">
            The math above is a good estimate — a licensed IndiBrick advisor will tune it against your file and current lender rates.
          </p>
          <Link
            href={ctaHref}
            className="inline-flex bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg shadow-blue-500/40"
          >
            {ctaLabel} <ArrowRight size={14}/>
          </Link>
          <p className="text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest">FSRA-licensed · Response within 2 business hours</p>
        </div>
      </section>
    </div>
  );
}

function CalculatorSkeleton() {
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_1.2fr] gap-6 md:gap-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 h-[500px] animate-pulse">
        <div className="h-4 w-24 bg-gray-100 rounded mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-10 w-full bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse" />
          <div className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse" />
        </div>
        <div className="h-64 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse" />
        <div className="h-40 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse" />
      </div>
    </div>
  );
}

export default CalcChrome;
