// Editorial policy — /editorial-policy
//
// Google's Quality Rater Guidelines treat a published editorial standard as
// a direct trust signal on YMYL sites, and its absence as a gap. This page
// states who writes, who reviews, what we source from, how we correct
// errors, and how we're compensated. The compensation disclosure matters
// most: a mortgage brokerage publishing rate advice has an obvious
// conflict of interest, and stating it plainly is more credible than
// leaving a rater to infer it.
//
// Everything asserted here must remain true. If the review process changes,
// change this page.

import Link from 'next/link';
import {
  ShieldCheck, FileSearch, RefreshCw, AlertTriangle, Scale, Users, ArrowRight,
} from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';
import { BROKERAGE } from '../../lib/authors';

export const metadata = buildMetadata({
  title: 'Editorial Policy — How We Research, Review and Correct | IndiBrick',
  description:
    'How IndiBrick sources mortgage and housing data, who reviews financial content, how we handle corrections, and how we are compensated. FSRA Brokerage #12830.',
  slug: '/editorial-policy',
  titleAbsolute: true,
  keywords: [
    'IndiBrick editorial policy',
    'mortgage content accuracy',
    'FSRA licensed brokerage disclosure',
    'editorial standards mortgage',
  ],
});

const LAST_REVIEWED = '2026-09-03';

const SOURCES = [
  { name: 'CREA MLS® Home Price Index', use: 'Regional benchmark prices and year-over-year change on every market page.', url: 'https://www.crea.ca/housing-market-stats/mls-home-price-index/' },
  { name: 'TRREB Market Watch', use: 'Greater Toronto aggregates used alongside the HPI.', url: 'https://trreb.ca/market-data/' },
  { name: 'Bank of Canada', use: 'Policy rate, rate announcement dates, historical series.', url: 'https://www.bankofcanada.ca/rates/' },
  { name: 'OSFI Guideline B-20', use: 'Minimum qualifying rate and stress-test rules.', url: 'https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/residential-mortgage-underwriting-practices-procedures-guideline-b-20' },
  { name: 'CMHC', use: 'Default-insurance premium schedules, eligibility ceilings, amortization rules.', url: 'https://www.cmhc-schl.gc.ca/' },
  { name: 'FSRA', use: 'Licensing rules, brokerage and agent registration status.', url: 'https://www.fsrao.ca/' },
  { name: 'Government of Ontario / Canada Revenue Agency', use: 'Land transfer tax brackets, HST new-housing rebate rules, first-time-buyer programs.', url: 'https://www.ontario.ca/page/land-transfer-tax' },
];

export default function EditorialPolicyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Editorial Policy',
    url: 'https://indibrick.ca/editorial-policy',
    description:
      'How IndiBrick sources data, reviews financial content, handles corrections, and discloses compensation.',
    dateModified: LAST_REVIEWED,
    isPartOf: { '@id': 'https://indibrick.ca/#website' },
    publisher: { '@id': 'https://indibrick.ca/#organization' },
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>

      <section className="bg-slate-900 text-white pt-28 pb-14 md:pt-36 md:pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Editorial policy</h1>
          <p className="mt-5 text-lg text-white/70 leading-relaxed">
            We publish mortgage and housing information that people use to make six- and
            seven-figure decisions. This page states how that content is produced, who is
            accountable for it, and how to tell us we got something wrong.
          </p>
          <p className="mt-4 text-xs text-white/50 uppercase tracking-widest font-black">
            Last reviewed {new Date(LAST_REVIEWED).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <article className="py-14 md:py-20">
        <div className="container mx-auto px-6 max-w-3xl space-y-12">

          <Section icon={Users} title="Who writes and who reviews">
            <p>
              Every article carries a named byline linking to that person&apos;s{' '}
              <Link href="/authors" className="text-blue-600 hover:underline">contributor profile</Link>,
              which lists their role and, where they hold one, their FSRA licence number.
            </p>
            <p>
              Content that touches mortgage qualification, rates, lender policy or tax treatment is
              written or reviewed by an agent licensed in Ontario before it publishes. Where the
              author is an editorial contributor rather than a licensed agent, the article names the
              licensed reviewer.
            </p>
            <p>
              We do not publish articles under generic bylines such as &ldquo;Admin&rdquo; or under any
              byline that implies machine authorship. Where AI tools assist with drafting or research,
              a named human is accountable for the final text and its accuracy.
            </p>
          </Section>

          <Section icon={FileSearch} title="Where our numbers come from">
            <p>
              Market figures are sourced from the organisations below and labelled on-page with the
              source and release date. We publish the regional benchmark CREA actually reports rather
              than presenting it as a city-level median.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Source</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">What we use it for</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {SOURCES.map((s) => (
                    <tr key={s.name}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-blue-600">{s.name}</a>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{s.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section icon={AlertTriangle} title="What we will not publish">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Estimated figures presented as measured ones.</strong> If we do not hold a real number for a market, the page says so rather than showing a plausible-looking placeholder.</li>
              <li><strong>Property listings or developments we cannot verify.</strong> Pre-construction pages reference only projects with a real builder and a citable sales page.</li>
              <li><strong>Testimonials attributed to people or places we cannot substantiate.</strong></li>
              <li><strong>Named lender pricing on marketing pages.</strong> Rates move daily and are file-specific; quoting a named lender&apos;s rate in evergreen content misleads readers.</li>
              <li><strong>Guarantees about approval, appraisal outcomes or future property values.</strong> No broker can make them honestly.</li>
            </ul>
          </Section>

          <Section icon={RefreshCw} title="Updates and corrections">
            <p>
              Rate-sensitive and policy-sensitive pages are reviewed when the underlying source
              changes — a Bank of Canada announcement, a CREA release, an OSFI or CMHC rule change,
              or a provincial budget measure. Pages carry a visible published and last-updated date.
            </p>
            <p>
              If you find an error, email{' '}
              <a href="mailto:sales@indibrick.ca" className="text-blue-600 hover:underline">sales@indibrick.ca</a>{' '}
              with the page URL and what you believe is wrong. We correct factual errors on the page
              itself and update the modified date. Substantive corrections — ones that change the
              meaning or the arithmetic — are noted in the article rather than silently edited.
            </p>
          </Section>

          <Section icon={Scale} title="How we make money">
            <p>
              IndiBrick is a mortgage brokerage, not a publisher. When a reader becomes a client and
              their mortgage funds, the brokerage is paid a commission by the lender. That is a real
              conflict of interest and you should read our content with it in mind.
            </p>
            <p>
              What that does <strong>not</strong> mean: we are not paid to recommend a specific
              lender in an article, and we do not accept payment for editorial placement or links.
              Rate and product commentary is not steered toward higher-commission products.
            </p>
            <p>
              Mortgages are submitted through <strong>{BROKERAGE.name}</strong>, FSRA
              Brokerage&nbsp;#{BROKERAGE.fsra}. Real estate is fulfilled through a licensed realtor
              partner network. Where a page covers insurance or legal services, those are delivered
              by separately licensed partners, disclosed on the page.
            </p>
          </Section>

          <Section icon={ShieldCheck} title="This is information, not advice">
            <p>
              Articles and calculators on this site are general information about how Ontario
              mortgage rules work. They are not personalised mortgage, tax or legal advice, and no
              client relationship is created by reading them. Your qualification depends on your
              income, credit, property and the lender&apos;s policy on the day you apply.
            </p>
            <p>
              For advice on your own file, speak to a licensed agent. You can verify any agent&apos;s
              standing on the{' '}
              <a href="https://www.fsrao.ca/consumers/check-if-your-financial-services-professional-registered"
                target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                FSRA public register
              </a>.
            </p>
          </Section>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link href="/authors"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white px-5 py-3 text-[11px] font-black uppercase tracking-widest transition">
              Our contributors <ArrowRight size={12}/>
            </Link>
            <Link href="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 hover:border-slate-900 px-5 py-3 text-[11px] font-black uppercase tracking-widest transition">
              About IndiBrick <ArrowRight size={12}/>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

function Section({ icon: Icon, title, children }: {
  icon: any; title: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-blue-600 shrink-0"/>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3 text-neutral-700 leading-relaxed">{children}</div>
    </section>
  );
}
