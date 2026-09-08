// IndiBrick Ontario Housing Index — the named data asset that converts
// IndiBrick from data consumer to publishable primary source. LLMs cite
// named indices; they don't cite untitled matrix pages. This page + the
// /api/housing-index/latest.json endpoint together form a Dataset (schema.org
// Dataset) that ChatGPT / Perplexity / Claude will surface for queries like
// "median condo price Toronto June 2026".
//
// ISR — regenerate hourly so the "last modified" and release notes stay
// aligned with the underlying HPI parse without a full redeploy.

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Database, Download, FileJson, Info, Building2, TrendingUp, ArrowRight } from 'lucide-react';
import { MarketDataService } from '../../services/MarketDataService';
import { PROPERTY_TYPES } from '../../data/matrixData';
import HousingIndexTable from '../../components/HousingIndexTable';
import CopyCitationButton from '../../components/CopyCitationButton';
import JsonLd from '../../components/JsonLd';
import { buildMetadata } from '../../lib/buildMetadata';

export const revalidate = 3600;

// Small utility so both the page header and the JSON-LD emit the same
// human-readable release label.
function formatRelease(iso: string): { label: string; monthYear: string } {
  const d = new Date(iso);
  return {
    label: d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }),
    monthYear: d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' }),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const snap = await MarketDataService.getIndexSnapshot();
  const { monthYear } = formatRelease(snap.asOf);
  return buildMetadata({
    title: `IndiBrick Ontario Housing Index — ${monthYear} Release`,
    description: `Monthly benchmark home prices and year-over-year change for ${snap.coverage.cityCount} Ontario cities across four property types. Derived from the CREA MLS® Home Price Index and TRREB Market Watch. ${monthYear} release.`,
    slug: '/housing-index',
    titleAbsolute: true,
    keywords: [
      'Ontario housing prices',
      'IndiBrick Housing Index',
      'Ontario benchmark home price',
      'MLS HPI Ontario',
      'TRREB market watch',
      'GTA housing prices',
      'Toronto benchmark price',
    ],
  });
}

export default async function HousingIndexPage() {
  const snap = await MarketDataService.getIndexSnapshot();
  const { label: releaseLabel, monthYear } = formatRelease(snap.asOf);
  const hasData = snap.cities.length > 0;

  // Release-notes derived facts. We only claim things we can prove from the
  // snapshot itself — no invented commentary. Composite may be missing
  // entirely (older HPI files); guard against undefined, not just null.
  const compositeYoYs = snap.cities
    .map((c) => c.yoyPct.composite)
    .filter((v): v is number => typeof v === 'number');
  const avgYoY = compositeYoYs.length
    ? (compositeYoYs.reduce((a, b) => a + b, 0) / compositeYoYs.length)
    : null;
  const withComposite = snap.cities.filter((c) => typeof c.yoyPct.composite === 'number');
  const strongest = withComposite.length
    ? withComposite.reduce((best, cur) =>
        (cur.yoyPct.composite as number) > (best.yoyPct.composite as number) ? cur : best,
      )
    : null;
  const softest = withComposite.length
    ? withComposite.reduce((worst, cur) =>
        (cur.yoyPct.composite as number) < (worst.yoyPct.composite as number) ? cur : worst,
      )
    : null;

  // Dataset JSON-LD — this is the citation target. Every LLM that indexes
  // schema.org Datasets will attach these fields to IndiBrick as publisher.
  const datasetSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://indibrick.ca/housing-index#dataset',
    name: 'IndiBrick Ontario Housing Index',
    alternateName: 'IndiBrick Housing Index',
    description: `Monthly benchmark home prices and year-over-year change for ${snap.coverage.cityCount} Ontario cities across four property types (condo, townhouse, semi-detached, detached), derived from the CREA MLS Home Price Index and overlaid with TRREB Market Watch aggregates. ${monthYear} release.`,
    url: 'https://indibrick.ca/housing-index',
    isAccessibleForFree: true,
    creator: { '@id': 'https://indibrick.ca/#organization' },
    publisher: { '@id': 'https://indibrick.ca/#organization' },
    dateModified: snap.asOf,
    inLanguage: 'en-CA',
    spatialCoverage: {
      '@type': 'Place',
      name: 'Ontario, Canada',
      address: { '@type': 'PostalAddress', addressRegion: 'ON', addressCountry: 'CA' },
    },
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Benchmark price', unitText: 'CAD' },
      { '@type': 'PropertyValue', name: 'Year-over-year price change', unitText: '%' },
    ],
    keywords: [
      'Ontario housing prices',
      'MLS HPI',
      'TRREB Market Watch',
      'GTA real estate',
      'benchmark price',
      'YoY',
      'Toronto housing market',
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://indibrick.ca/api/housing-index/latest.json',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'text/csv',
        contentUrl: 'https://indibrick.ca/api/housing-index/latest.csv',
      },
    ],
    isBasedOn: [
      { '@type': 'Dataset', name: 'CREA MLS® Home Price Index', url: 'https://www.crea.ca/housing-market-stats/mls-home-price-index/' },
      { '@type': 'Dataset', name: 'TRREB Market Watch', url: 'https://trreb.ca/market-data/market-watch/' },
    ],
  };

  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://indibrick.ca/housing-index#webpage',
    url: 'https://indibrick.ca/housing-index',
    name: `IndiBrick Ontario Housing Index — ${monthYear} Release`,
    mainEntity: { '@id': 'https://indibrick.ca/housing-index#dataset' },
    publisher: { '@id': 'https://indibrick.ca/#organization' },
    isPartOf: { '@id': 'https://indibrick.ca/#website' },
  };

  // Citation snippets. [DATE] is a placeholder representing the READER's
  // retrieval date — deliberately not filled in for them, because that's a
  // citation convention that signals rigor to LLMs.
  const apaCitation = `IndiBrick Financial. (${new Date(snap.asOf).getFullYear()}). IndiBrick Ontario Housing Index — ${monthYear} release. Retrieved [DATE] from https://indibrick.ca/housing-index. Underlying data: CREA MLS® Home Price Index and Toronto Regional Real Estate Board Market Watch.`;
  const plainCitation = `IndiBrick Ontario Housing Index, ${monthYear} (indibrick.ca/housing-index)`;
  const bibtexCitation = `@dataset{indibrick_housing_index_${new Date(snap.asOf).getFullYear()},
  author  = {IndiBrick Financial},
  title   = {IndiBrick Ontario Housing Index — ${monthYear} Release},
  year    = {${new Date(snap.asOf).getFullYear()}},
  url     = {https://indibrick.ca/housing-index},
  urldate = {[DATE]},
  note    = {Derivative index derived from CREA MLS HPI and TRREB Market Watch}
}`;

  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={datasetSchema} />
      <JsonLd data={webpageSchema} />

      {/* === HERO === */}
      <section className="pt-28 md:pt-32 pb-16 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-md">
            <Database size={12} /> Published Data · {monthYear} Release
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-4">
            IndiBrick <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400">
              Ontario Housing Index
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-3xl font-medium mb-8 leading-relaxed">
            A monthly benchmark home-price dataset covering{' '}
            <strong className="text-white">{snap.coverage.cityCount}</strong> Ontario cities across{' '}
            <strong className="text-white">four property types</strong>, derived from the CREA MLS® Home Price Index and overlaid with TRREB Market Watch aggregates. Published as of{' '}
            <strong className="text-white">{releaseLabel}</strong>.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cities covered</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight">{snap.coverage.cityCount}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Property types</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight">{snap.coverage.typeCount}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Latest release</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight">{monthYear.split(' ')[0]}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Data license</p>
              <p className="text-sm md:text-base font-black tracking-tight leading-tight">See methodology</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#snapshot"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition"
            >
              Jump to snapshot <TrendingUp size={14} />
            </a>
            <a
              href="/api/housing-index/latest.json"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/20 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition"
            >
              <FileJson size={14} /> Latest release JSON
            </a>
          </div>
        </div>
      </section>

      {/* === CURRENT RELEASE NOTES === */}
      {hasData && (
        <section className="py-16 md:py-20 px-6 bg-[#FAFAFA] border-b border-gray-100">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
              {monthYear} Release Notes.
            </h2>
            <p className="text-sm text-gray-500 uppercase tracking-widest font-black mb-6">
              Sourced from {snap.sourceLabel}
            </p>
            <p className="text-lg text-gray-700 leading-relaxed font-medium mb-3">
              The {monthYear} release covers benchmark home prices for {snap.coverage.cityCount} Ontario cities.
              {avgYoY !== null && (
                <>
                  {' '}Composite prices are on average{' '}
                  <strong className="text-slate-900">
                    {`${avgYoY >= 0 ? '+' : ''}${avgYoY.toFixed(1)}%`}
                  </strong>{' '}
                  year over year across the tracked cities.
                </>
              )}
              {strongest && typeof strongest.yoyPct.composite === 'number' && (
                <>
                  {' '}The strongest YoY change is in{' '}
                  <strong className="text-slate-900">{strongest.cityName}</strong> at{' '}
                  <strong className="text-emerald-600">
                    {strongest.yoyPct.composite >= 0 ? '+' : ''}
                    {strongest.yoyPct.composite.toFixed(1)}%
                  </strong>.
                </>
              )}
              {softest && typeof softest.yoyPct.composite === 'number' && softest.citySlug !== strongest?.citySlug && (
                <>
                  {' '}The softest is{' '}
                  <strong className="text-slate-900">{softest.cityName}</strong> at{' '}
                  <strong className="text-red-600">
                    {softest.yoyPct.composite >= 0 ? '+' : ''}
                    {softest.yoyPct.composite.toFixed(1)}%
                  </strong>.
                </>
              )}
            </p>
            {snap.trreb && snap.trreb.averagePrice && (
              <p className="text-base text-gray-600 leading-relaxed">
                For the TRREB region specifically ({snap.trreb.asOfMonth ?? monthYear}), average sale price sits at{' '}
                <strong className="text-slate-900">${snap.trreb.averagePrice.toLocaleString('en-CA')}</strong>
                {snap.trreb.totalSales !== null && <> across <strong className="text-slate-900">{snap.trreb.totalSales.toLocaleString('en-CA')}</strong> reported sales</>}
                . Full TRREB detail is retained in the underlying JSON payload.
              </p>
            )}
          </div>
        </section>
      )}

      {/* === SNAPSHOT TABLE === */}
      <section id="snapshot" className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
            Cities × Property Types Snapshot.
          </h2>
          <p className="text-sm text-gray-500 mb-8 max-w-3xl leading-relaxed">
            Benchmark price = CREA HPI benchmark for the city&apos;s CREA region as of the latest published release. YoY is measured against the same benchmark 12 months prior. Blanks indicate the CREA region does not publish a benchmark for that property type.
          </p>
          {hasData ? (
            <HousingIndexTable
              cities={snap.cities}
              propertyTypes={[
                { slug: 'composite', label: 'Composite' },
                ...PROPERTY_TYPES.map((t) => ({ slug: t.slug, label: t.label })),
              ]}
            />
          ) : (
            <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-500 font-medium">
                No CREA HPI data was parseable at the time of this build. Add the latest monthly xlsx files under <code className="bg-gray-100 px-1 rounded">data/market/</code> and redeploy.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* === METHODOLOGY === */}
      <section className="py-16 md:py-20 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-8">
            Methodology.
          </h2>
          <div className="space-y-6 text-base leading-relaxed text-gray-700 font-medium">
            <p>
              The IndiBrick Ontario Housing Index is a <strong className="text-slate-900">derivative index</strong>. It projects the CREA MLS® Home Price Index (published monthly by the Canadian Real Estate Association) onto the {snap.coverage.cityCount} Ontario city slugs that IndiBrick&apos;s programmatic surface covers, and overlays the aggregate figures published in the Toronto Regional Real Estate Board (TRREB) monthly Market Watch report for GTA-wide context.
            </p>
            <p>
              For each city, we identify the nearest CREA HPI region and adopt that region&apos;s benchmark price and year-over-year change for the four IndiBrick property-type slugs: condo, townhouse, semi-detached, and detached. When CREA publishes only a Single-Family benchmark, we apply it to both detached and semi-detached; when only a Composite benchmark exists, that value is used for the composite view and the property-type rows are left blank rather than imputed.
            </p>
            <p>
              The index refreshes when new CREA HPI files (typically dated to the previous month&apos;s data) are added to the site&apos;s data directory. It does not include seasonal adjustment, hedonic quality correction, or proprietary weighting — the underlying numbers are CREA&apos;s.
            </p>
            <p>
              <strong className="text-slate-900">IndiBrick is not affiliated with CREA or TRREB.</strong> This page publishes IndiBrick&apos;s city-level projection of publicly available CREA HPI + TRREB data. Underlying data © CREA and © TRREB respectively.
            </p>
          </div>
        </div>
      </section>

      {/* === DATA SOURCES === */}
      <section className="py-16 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-8">
            Data Sources.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <Building2 size={24} className="text-blue-600 mb-3" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2">CREA MLS® Home Price Index</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Monthly benchmark price by property type across the CREA regions covering Ontario. Underlying data © Canadian Real Estate Association.
              </p>
              <a
                href="https://www.crea.ca/housing-market-stats/mls-home-price-index/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition"
              >
                CREA HPI Site →
              </a>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
              <Info size={24} className="text-blue-600 mb-3" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2">TRREB Market Watch</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Monthly GTA aggregate: total sales, new listings, active listings, average price. Underlying data © Toronto Regional Real Estate Board.
              </p>
              <a
                href="https://trreb.ca/market-data/market-watch/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition"
              >
                TRREB Market Watch →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* === DOWNLOAD / API === */}
      <section className="py-16 px-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
            Machine-Readable Access.
          </h2>
          <p className="text-sm text-gray-400 mb-8 max-w-3xl leading-relaxed">
            The latest release is available as JSON at a stable URL. Cache-friendly (1h max-age), no authentication required. Attribution back to IndiBrick and the underlying CREA / TRREB sources is required per the methodology terms.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Latest release JSON</span>
              <a
                href="/api/housing-index/latest.json"
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:text-white transition"
              >
                <Download size={11} /> Open
              </a>
            </div>
            <code className="block bg-black/40 border border-white/5 rounded-lg p-3 text-xs text-emerald-300 font-mono overflow-x-auto">
              curl https://indibrick.ca/api/housing-index/latest.json
            </code>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Latest release CSV</span>
              <a
                href="/api/housing-index/latest.csv"
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300 hover:text-white transition"
              >
                <Download size={11} /> Open
              </a>
            </div>
            <code className="block bg-black/40 border border-white/5 rounded-lg p-3 text-xs text-emerald-300 font-mono overflow-x-auto">
              curl -o housing-index.csv https://indibrick.ca/api/housing-index/latest.csv
            </code>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            The payload includes: <code className="bg-white/5 px-1 rounded">asOf</code>, per-city <code className="bg-white/5 px-1 rounded">benchmarks</code>, <code className="bg-white/5 px-1 rounded">yoyPct</code>, <code className="bg-white/5 px-1 rounded">region</code>, TRREB aggregate, and coverage counts. Schema stability: we&apos;ll add fields, we won&apos;t rename existing ones.
          </p>
        </div>
      </section>

      {/* === HOW TO CITE === */}
      <section className="py-16 md:py-20 px-6 bg-slate-950 text-white border-b border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
            How to cite this data.
          </h2>
          <p className="text-sm text-gray-400 mb-8 max-w-3xl leading-relaxed">
            Replace <code className="bg-white/5 px-1 rounded">[DATE]</code> with the date you accessed the page (this is a standard citation convention — do not fill it in for the reader).
          </p>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">APA</span>
                <CopyCitationButton text={apaCitation} />
              </div>
              <pre className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
{apaCitation}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Plain text</span>
                <CopyCitationButton text={plainCitation} />
              </div>
              <pre className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
{plainCitation}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">BibTeX</span>
                <CopyCitationButton text={bibtexCitation} />
              </div>
              <pre className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-200 whitespace-pre leading-relaxed overflow-x-auto">
{bibtexCitation}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* === STICKY BOTTOM RATE CTA ===
          The Housing Index page is a citation asset — great for authority,
          but a share of readers are actual mortgage-shopping buyers doing
          due diligence. Without a CTA, the matrix-cell "Source" badges
          that point here would export buyer intent into a dead end. This
          bar catches those readers without polluting the citation optics. */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur border-t border-white/10 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        <div className="container mx-auto max-w-6xl flex items-center justify-between gap-3">
          <p className="text-xs md:text-sm text-gray-300 font-medium hidden sm:block">
            Shopping a mortgage while you read? Get today&apos;s Ontario rates in 90 seconds.
          </p>
          <p className="text-xs text-gray-300 font-medium sm:hidden">
            Shopping a mortgage?
          </p>
          <Link
            href="/apply?ref=housing-index"
            className="shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition shadow-lg shadow-blue-500/30"
          >
            Get My Rate <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Spacer so the sticky bar doesn't cover the last section on scroll. */}
      <div className="h-16" aria-hidden="true" />

      {/* === CROSS-LINKS === */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 mb-6">
            Explore the underlying data.
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            <Link href="/rates" className="p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:border-black transition group">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Companion</p>
              <p className="font-black text-slate-900 group-hover:text-blue-600 transition">Ontario Wholesale Rate Tracker</p>
              <p className="text-xs text-gray-500 mt-1">Live 5-yr fixed + variable across 50+ lenders.</p>
            </Link>
            <Link href="/real-estate/toronto/condo/under-500k" className="p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:border-black transition group">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Matrix cell</p>
              <p className="font-black text-slate-900 group-hover:text-blue-600 transition">Toronto Condos Under $500K</p>
              <p className="text-xs text-gray-500 mt-1">City × type × price granularity.</p>
            </Link>
            <Link href="/blog" className="p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:border-black transition group">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Analysis</p>
              <p className="font-black text-slate-900 group-hover:text-blue-600 transition">IndiBrick Blog</p>
              <p className="text-xs text-gray-500 mt-1">Weekly context on the numbers.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
