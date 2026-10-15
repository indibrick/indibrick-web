import React from 'react';
import Link from 'next/link';
import LeadForm from '../../components/LeadForm';
import JsonLd from '../../components/JsonLd';
import {
  TrendingUp, TrendingDown, Minus, ArrowRight, ExternalLink,
  Landmark, Percent, Scale, CalendarClock, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { buildMetadata } from '../../lib/buildMetadata';
import { getBocSnapshot, formatAsOf } from '../../lib/bocRates';
import { getRateSheet } from '../../lib/rateSheet';

// Market data refreshes hourly. The underlying series publish once a business
// day, so this is comfortably fresher than the source.
export const revalidate = 3600;

// Real publication date. Previously this page set datePublished to
// new Date(), which told Google the article was first published today on
// every single crawl. Freshness belongs in dateModified, not datePublished.
const PUBLISHED = '2026-01-12';

const pct = (n: number) => `${n.toFixed(2)}%`;
const signed = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}`;

export const metadata = buildMetadata({
  title: 'Canada Mortgage Rate Forecast — Live Bond Yield Analysis',
  description:
    'Will mortgage rates go down? Live Government of Canada 5-year bond yield, prime and policy rate from the Bank of Canada, with the spread against real posted mortgage rates. Updated daily.',
  slug: '/mortgage-rate-forecast',
  keywords: [
    'mortgage rate forecast canada', 'will mortgage rates go down',
    'canada bond yield mortgage rates', 'fixed or variable 2026',
    'should I lock in my mortgage rate', 'prime rate forecast canada',
    '5 year bond yield canada',
  ],
});

export default async function ForecastPage() {
  const [boc, sheet] = await Promise.all([getBocSnapshot(), getRateSheet()]);

  // The spread is the whole point of the page: what a lender charges over the
  // bond that funds the loan. Computed, never asserted.
  const postedFixed = sheet.insured5yrFixed ?? sheet.uninsured5yrFixed;
  const spread = postedFixed === null ? null : Math.round((postedFixed - boc.bondYield5yr) * 100) / 100;

  const postedVariable = sheet.insured5yrVariable ?? sheet.uninsured5yrVariable;
  const variableDiscount =
    postedVariable === null ? null : Math.round((boc.primeRate - postedVariable) * 100) / 100;

  const asOfLabel = formatAsOf(boc.asOf);

  // Bank of Canada's own published average of what chartered banks actually
  // charged — booked rates, not advertised ones. It lags a quarter, so every
  // render of it carries its own date. Comparing our uninsured rate against
  // the uninsured series is the only like-for-like reading.
  const bank = boc.charteredBank;
  const bankAsOfLabel = bank.asOf ? formatAsOf(bank.asOf) : null;
  const uninsuredOurs = sheet.uninsured5yrFixed;
  const uninsuredGap =
    uninsuredOurs !== null && bank.uninsured5yrPlus !== null
      ? Math.round((bank.uninsured5yrPlus - uninsuredOurs) * 100) / 100
      : null;

  // Direction is only meaningful with a window attached. State both.
  const dir = (c: number | null) =>
    c === null ? { Icon: Minus, tone: 'text-gray-400', word: 'unchanged' }
    : c > 0.02 ? { Icon: TrendingUp, tone: 'text-amber-500', word: 'higher' }
    : c < -0.02 ? { Icon: TrendingDown, tone: 'text-emerald-500', word: 'lower' }
    : { Icon: Minus, tone: 'text-gray-400', word: 'flat' };

  const d30 = dir(boc.change30d);
  const d90 = dir(boc.change90d);

  // Phrased exactly as people search, each answer standalone and quotable.
  // Answer engines lift a single Q&A pair out of context, so none of these
  // may depend on a sentence that appeared earlier on the page.
  const faqs = [
    {
      q: 'Will mortgage rates go down in Canada?',
      a: `Fixed mortgage rates track the Government of Canada 5-year bond yield, which sits at ${pct(boc.bondYield5yr)} as of ${asOfLabel}.${
        boc.change30d !== null ? ` It has moved ${signed(boc.change30d)} points over the last 30 trading days` : ''
      }${boc.change90d !== null ? ` and ${signed(boc.change90d)} over 90.` : '.'} Variable rates move only when the Bank of Canada changes its policy rate, currently ${pct(boc.policyRate)}. Anyone quoting you a precise future rate is guessing.`,
    },
    {
      q: 'Why are fixed rates rising when the Bank of Canada has not moved?',
      a: `Because fixed rates are not set by the Bank of Canada. Lenders fund 5-year fixed mortgages in the bond market, so those rates follow the 5-year Government of Canada yield, currently ${pct(boc.bondYield5yr)}. The policy rate at ${pct(boc.policyRate)} drives prime, and therefore variable rates. The two can move in opposite directions for months.`,
    },
    {
      q: 'How do bond yields set fixed mortgage rates?',
      a: `A lender writing a 5-year fixed mortgage borrows at roughly the 5-year Government of Canada yield and lends to you at a markup covering risk, costs and profit. That markup is the spread.${
        spread !== null && postedFixed !== null
          ? ` Today the yield is ${pct(boc.bondYield5yr)} and our posted insured 5-year fixed is ${pct(postedFixed)}, a spread of ${spread.toFixed(2)} points.`
          : ''
      } Subtract the yield from any quoted rate and you see what that lender charges.`,
    },
    {
      q: 'Should I lock in my mortgage rate now?',
      a: `A rate hold costs nothing and protects you for up to 120 days with most lenders. If yields fall before you sign, you take the lower rate; if they rise, you keep the held one. The asymmetry favours holding. The real question is not whether to hold but whether your renewal or closing date is close enough for a hold to reach it.`,
    },
    {
      q: 'Fixed or variable in 2026?',
      a: `Variable is priced off prime, currently ${pct(boc.primeRate)}${
        variableDiscount !== null ? `, with discounts around ${variableDiscount.toFixed(2)} points below it` : ''
      }. Variable wins if the Bank of Canada keeps cutting and loses if it holds or hikes. Fixed removes the question for five years. Choose on how much payment movement your budget can absorb, not on a forecast.`,
    },
    {
      q: 'How much will my payment go up when I renew?',
      a: 'It depends on the gap between the rate you signed at and the rate available on your renewal date, applied to your remaining balance over your remaining amortisation. A borrower who signed near the bottom of the cycle can see a material increase. The only way to know your number is to run it against your actual balance and date.',
    },
    {
      q: 'What rate are Canadian banks actually charging?',
      a: bankAsOfLabel && bank.uninsured5yrPlus !== null
        ? `The Bank of Canada publishes the rates chartered banks actually booked, not advertised. In the most recent reading, dated ${bankAsOfLabel}, the average uninsured mortgage of 5 years or more was ${pct(bank.uninsured5yrPlus)}${bank.insured5yrPlus !== null ? ` and the insured equivalent was ${pct(bank.insured5yrPlus)}` : ''}. That series publishes monthly and lags by about a quarter, so treat it as context rather than today's market.`
        : 'The Bank of Canada publishes average rates chartered banks actually booked, as opposed to advertised teaser rates. That series publishes monthly and lags the market by roughly a quarter.',
    },
    {
      q: 'When is the next Bank of Canada rate announcement?',
      a: 'The Bank publishes its policy interest rate announcement schedule a year in advance. Rather than repeat dates that go stale, we link the Bank\u2019s own schedule in the sources section at the foot of this page. Variable rates can only change after one of those announcements; fixed rates can change any day the bond market moves.',
    },
    {
      q: 'Can I hold a rate while I decide?',
      a: 'Yes. Most lenders will hold an approved rate for 90 to 120 days at no cost and with no obligation to proceed. If rates improve before you sign, a broker can usually re-submit at the lower rate. Holding early costs nothing and removes the risk of deciding under deadline pressure.',
    },
    {
      q: 'Is this page a forecast of a specific future rate?',
      a: 'No. It reports the live Government of Canada bond yield, prime and the policy rate, and shows what lenders are charging over them today. The bond market is the best available leading indicator for fixed rates, but it is not a prediction, and we do not publish target numbers for future dates that nobody can substantiate.',
    },
    {
      q: 'How often is this page updated?',
      a: `The bond yield, prime and policy rate are read directly from the Bank of Canada and refresh hourly; the reading shown is from ${asOfLabel}. Posted mortgage rates come from our own rate sheet${
        sheet.lastUpdated ? `, last revised ${sheet.lastUpdated}` : ''
      }. Every figure on this page carries the date it belongs to.`,
    },
  ];

  // Google retired the FAQ rich result in May 2026, so this earns no SERP
  // decoration. It stays because answer engines still parse it, and it is
  // nested under the Article via hasPart rather than declared as a competing
  // top-level FAQPage.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://indibrick.ca/mortgage-rate-forecast#faq',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Canada Mortgage Rate Forecast — Live Bond Yield Analysis',
    description: `Live Government of Canada 5-year bond yield, prime rate and policy rate, with the spread against posted mortgage rates. Bond yield ${pct(boc.bondYield5yr)} as of ${asOfLabel}.`,
    datePublished: PUBLISHED,
    dateModified: boc.asOf,
    author: {
      '@type': 'Person',
      name: 'Mudit Chhura',
      jobTitle: 'Mortgage Agent Level 2',
      identifier: 'M25003057',
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'Mortgage Agent Level 2 licence',
        recognizedBy: {
          '@type': 'GovernmentOrganization',
          name: 'Financial Services Regulatory Authority of Ontario',
        },
        identifier: 'M25003057',
      },
      worksFor: { '@type': 'Organization', name: 'IndiBrick' },
    },
    publisher: {
      '@type': 'Organization',
      name: 'IndiBrick',
      url: 'https://indibrick.ca',
    },
    isBasedOn: {
      '@type': 'Dataset',
      name: 'Bank of Canada Valet API',
      url: 'https://www.bankofcanada.ca/valet/docs',
      creator: { '@type': 'Organization', name: 'Bank of Canada' },
    },
    citation: [
      'https://www.bankofcanada.ca/rates/interest-rates/canadian-bonds/',
      'https://www.bankofcanada.ca/rates/interest-rates/',
      'https://www.bankofcanada.ca/valet/docs',
    ],
    about: [
      { '@type': 'Thing', name: 'Mortgage rates in Canada' },
      { '@type': 'Thing', name: 'Government of Canada bond yields' },
    ],
    hasPart: faqSchema,
    mainEntityOfPage: 'https://indibrick.ca/mortgage-rate-forecast',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://indibrick.ca' },
      { '@type': 'ListItem', position: 2, name: 'Rates', item: 'https://indibrick.ca/rates' },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Mortgage Rate Forecast',
        item: 'https://indibrick.ca/mortgage-rate-forecast',
      },
    ],
  };

  return (
    <div className="bg-white">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white pt-32 pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-7">
            <Landmark size={13} className="text-blue-400" />
            Bank of Canada data · {asOfLabel}
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-6">
            Canada mortgage<br />rate forecast
          </h1>

          {/*
            Answer-first block. Self-contained and dated, because answer
            engines lift the opening of a page out of context and quote it
            with nothing else attached. Every number in it is live.
          */}
          <p className="text-xl text-gray-200 max-w-3xl leading-relaxed border-l-4 border-blue-500 pl-6">
            As of {asOfLabel}, the Government of Canada 5-year benchmark bond yield is{' '}
            <strong className="text-white">{pct(boc.bondYield5yr)}</strong> and the Bank of
            Canada&apos;s policy rate is <strong className="text-white">{pct(boc.policyRate)}</strong>,
            with prime at <strong className="text-white">{pct(boc.primeRate)}</strong>. Fixed
            mortgage rates follow the bond yield, not the policy rate. That is why fixed rates
            can move in a week when the Bank of Canada has done nothing at all.
          </p>

          <p className="text-base text-gray-400 max-w-2xl leading-relaxed mt-7">
            This page reads those figures straight from the Bank of Canada every hour and shows
            what lenders are charging over them today. It does not predict a number for a future
            date, because nobody can do that honestly.
          </p>

          {boc.stale && (
            <div className="mt-8 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 max-w-2xl">
              <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-100">
                The Bank of Canada feed did not respond on the last refresh. Figures below
                are the most recent readings we hold, from {asOfLabel}, and may be behind
                the market.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Live indicators ────────────────────────────────────────── */}
      <section className="bg-slate-800 text-white border-t border-slate-700">
        <div className="container mx-auto px-6 max-w-5xl">
          <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
            <div className="px-6 py-9">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-bold mb-3">
                5-year GoC bond yield
              </dt>
              <dd className="text-4xl font-black tabular-nums mb-3">{pct(boc.bondYield5yr)}</dd>
              {boc.change30d !== null && (
                <p className={`text-xs font-bold flex items-center gap-1.5 ${d30.tone}`}>
                  <d30.Icon size={14} /> {signed(boc.change30d)} over 30 trading days
                </p>
              )}
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">Sets 5-year fixed rates.</p>
            </div>

            <div className="px-6 py-9">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-bold mb-3">
                Prime rate
              </dt>
              <dd className="text-4xl font-black tabular-nums mb-3">{pct(boc.primeRate)}</dd>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                Variable rates are quoted as a discount off prime.
              </p>
            </div>

            <div className="px-6 py-9">
              <dt className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-bold mb-3">
                Policy rate
              </dt>
              <dd className="text-4xl font-black tabular-nums mb-3">{pct(boc.policyRate)}</dd>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                The Bank of Canada&apos;s target for the overnight rate.
              </p>
            </div>
          </dl>
        </div>
      </section>

      {/* ── The spread ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 mb-5">
            <Scale size={13} /> The number nobody shows you
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-6">
            What lenders charge over the bond
          </h2>

          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-3">
              <p className="text-lg text-gray-700 leading-relaxed mb-5">
                A lender funding a 5-year fixed mortgage borrows in the bond market and
                lends to you at a markup. That markup is the spread, and it is where
                the negotiation actually happens. The yield is the same for everyone.
                The spread is not.
              </p>
              {spread !== null && postedFixed !== null ? (
                <p className="text-lg text-gray-700 leading-relaxed">
                  Today the 5-year Government of Canada bond yields{' '}
                  <strong className="text-slate-900">{pct(boc.bondYield5yr)}</strong>. Our posted
                  insured 5-year fixed is{' '}
                  <strong className="text-slate-900">{pct(postedFixed)}</strong>. That is a spread of{' '}
                  <strong className="text-slate-900">{spread.toFixed(2)} points</strong>. When you
                  see a rate quoted elsewhere, subtract {pct(boc.bondYield5yr)} from it and you will
                  know exactly what that lender is charging you for the privilege.
                </p>
              ) : (
                <p className="text-lg text-gray-700 leading-relaxed">
                  Our posted rate sheet is being updated. Subtract the bond yield above from any
                  rate you are quoted and the difference is what that lender is charging over its
                  own cost of funds.
                </p>
              )}
            </div>

            <div className="lg:col-span-2 bg-slate-900 text-white rounded-2xl p-8">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-bold mb-6">
                Today&apos;s arithmetic
              </p>
              <dl className="space-y-5">
                <div className="flex justify-between items-baseline gap-4">
                  <dt className="text-sm text-gray-300">5-year bond yield</dt>
                  <dd className="font-black tabular-nums">{pct(boc.bondYield5yr)}</dd>
                </div>
                {postedFixed !== null && (
                  <div className="flex justify-between items-baseline gap-4">
                    <dt className="text-sm text-gray-300">Our 5-year fixed</dt>
                    <dd className="font-black tabular-nums">{pct(postedFixed)}</dd>
                  </div>
                )}
                {spread !== null && (
                  <div className="flex justify-between items-baseline gap-4 pt-5 border-t border-slate-700">
                    <dt className="text-sm font-bold text-blue-400">Spread</dt>
                    <dd className="font-black tabular-nums text-blue-400 text-xl">
                      {spread.toFixed(2)} pts
                    </dd>
                  </div>
                )}
                {postedVariable !== null && variableDiscount !== null && (
                  <div className="flex justify-between items-baseline gap-4 pt-5 border-t border-slate-700">
                    <dt className="text-sm text-gray-300">Variable</dt>
                    <dd className="font-black tabular-nums text-right">
                      {pct(postedVariable)}
                      <span className="block text-[11px] font-medium text-gray-500">
                        prime − {variableDiscount.toFixed(2)}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
              <Link
                href="/rates"
                className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white hover:text-blue-400 transition"
              >
                Full rate sheet <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mid-page CTA: renewal timing ───────────────────────────── */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-200 mb-4">
                <CalendarClock size={13} /> If you renew in the next 12 months
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
                The forecast matters less than your renewal date
              </h2>
              <p className="text-blue-100 leading-relaxed max-w-2xl">
                You can hold a rate well before your maturity date. Whether that is worth doing
                depends on your balance, your date and the gap to today&apos;s rates. We will run
                it against your actual numbers and tell you plainly if holding beats waiting.
              </p>
            </div>
            <Link
              href="/renewal-rescue"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition"
            >
              Check my renewal <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── What banks actually charge ─────────────────────────────── */}
      {bank.uninsured5yrPlus !== null && bankAsOfLabel && (
        <section className="py-20 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 mb-5">
              <Landmark size={13} /> Booked, not advertised
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-6">
              What banks actually charged
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mb-10">
              Comparison sites quote advertised rates. The Bank of Canada publishes something
              better: the average rate chartered banks actually wrote, drawn from their own
              regulatory filings. It is the difference between a sticker price and a receipt.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <caption className="sr-only">
                  Posted IndiBrick rates against Bank of Canada published chartered bank averages
                </caption>
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th scope="col" className="py-4 pr-6 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
                      5-year fixed
                    </th>
                    <th scope="col" className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 text-right">
                      Chartered bank average
                    </th>
                    <th scope="col" className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 text-right">
                      Our posted rate
                    </th>
                    <th scope="col" className="py-4 pl-6 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 text-right">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <th scope="row" className="py-5 pr-6 font-bold text-slate-900">Uninsured</th>
                    <td className="py-5 px-6 text-right tabular-nums font-bold">{pct(bank.uninsured5yrPlus)}</td>
                    <td className="py-5 px-6 text-right tabular-nums font-bold">
                      {uninsuredOurs !== null ? pct(uninsuredOurs) : '—'}
                    </td>
                    <td className="py-5 pl-6 text-right tabular-nums font-black text-emerald-600">
                      {uninsuredGap !== null ? `${uninsuredGap.toFixed(2)} pts lower` : '—'}
                    </td>
                  </tr>
                  {bank.insured5yrPlus !== null && (
                    <tr>
                      <th scope="row" className="py-5 pr-6 font-bold text-slate-900">Insured</th>
                      <td className="py-5 px-6 text-right tabular-nums font-bold">{pct(bank.insured5yrPlus)}</td>
                      <td className="py-5 px-6 text-right tabular-nums font-bold">
                        {postedFixed !== null ? pct(postedFixed) : '—'}
                      </td>
                      <td className="py-5 pl-6 text-right tabular-nums font-bold text-gray-600">
                        {postedFixed !== null
                          ? Math.abs(bank.insured5yrPlus - postedFixed) < 0.005
                            ? 'level'
                            : `${(bank.insured5yrPlus - postedFixed).toFixed(2)} pts`
                          : '—'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-8 text-sm text-gray-500 leading-relaxed max-w-3xl">
              Chartered bank averages are the Bank of Canada&apos;s most recent published reading,
              dated {bankAsOfLabel}. That series reports monthly and lags the market by roughly a
              quarter, so read it as context rather than as today&apos;s pricing. Our own rates are
              current{sheet.lastUpdated ? ` as of ${sheet.lastUpdated}` : ''}. We publish the insured
              row even where it shows no advantage, because a comparison that only ever flatters us
              would not be worth reading.
            </p>
          </div>
        </section>
      )}

      {/* ── Trend ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
            Where the yield has been
          </h2>
          <p className="text-gray-500 mb-10 max-w-2xl">
            Direction only means something with a window attached, so here are two.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="border-t-2 border-slate-900 pt-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-bold mb-3">
                Past 30 trading days
              </p>
              {boc.change30d !== null ? (
                <p className={`text-2xl font-black tabular-nums flex items-center gap-2 ${d30.tone}`}>
                  <d30.Icon size={20} /> {signed(boc.change30d)}
                </p>
              ) : (
                <p className="text-2xl font-black text-gray-300">—</p>
              )}
              <p className="text-sm text-gray-600 mt-2">Yield is {d30.word} than a month ago.</p>
            </div>

            <div className="border-t-2 border-slate-900 pt-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-bold mb-3">
                Past 90 trading days
              </p>
              {boc.change90d !== null ? (
                <p className={`text-2xl font-black tabular-nums flex items-center gap-2 ${d90.tone}`}>
                  <d90.Icon size={20} /> {signed(boc.change90d)}
                </p>
              ) : (
                <p className="text-2xl font-black text-gray-300">—</p>
              )}
              <p className="text-sm text-gray-600 mt-2">Yield is {d90.word} than a quarter ago.</p>
            </div>

            <div className="border-t-2 border-slate-900 pt-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-bold mb-3">
                Range in this window
              </p>
              {boc.low !== null && boc.high !== null ? (
                <p className="text-2xl font-black tabular-nums text-slate-900">
                  {pct(boc.low)} – {pct(boc.high)}
                </p>
              ) : (
                <p className="text-2xl font-black text-gray-300">—</p>
              )}
              <p className="text-sm text-gray-600 mt-2">
                Low and high across the trailing period.
              </p>
            </div>
          </div>

          <p className="mt-10 text-sm text-gray-500 leading-relaxed max-w-3xl">
            A 30-day move and a 90-day move can point in opposite directions, and frequently do.
            That is precisely why a single arrow labelled &ldquo;rates are falling&rdquo; is
            worth nothing without the period it covers.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-12">
            Straight answers
          </h2>
          <dl className="space-y-10">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="text-lg font-black text-slate-900 mb-3 leading-snug">{f.q}</dt>
                <dd className="text-gray-700 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Lead form ──────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-6 max-w-5xl grid lg:grid-cols-2 gap-14 items-start">
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-5">
              Get the number that applies to you
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              The yield above is the same for everyone. Your rate is not. It depends on your
              down payment, your income, your credit and whether the mortgage is insured.
              Tell us the situation and we will come back with the real figure.
            </p>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex gap-3">
                <ShieldCheck size={17} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Access to 50+ lenders, including options the banks do not quote.</span>
              </li>
              <li className="flex gap-3">
                <Percent size={17} className="text-blue-400 shrink-0 mt-0.5" />
                <span>A rate hold costs nothing and protects you if yields move against you.</span>
              </li>
              <li className="flex gap-3">
                <Scale size={17} className="text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Prefer to run it yourself first? The{' '}
                  <Link href="/tools/mortgage-qualifier" className="underline hover:text-white">
                    qualifier
                  </Link>{' '}
                  shows whether the ratios pass.
                </span>
              </li>
            </ul>
          </div>
          <LeadForm
            type="Mortgage"
            title="What's my actual rate?"
            subtitle="Tell us your situation and renewal date. We'll send the real number, not a teaser."
            ctaText="Send My Rate"
            sourcePage="mortgage-rate-forecast"
          />
        </div>
      </section>

      {/* ── Sources & method ───────────────────────────────────────── */}
      <section className="py-14 bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-5">
            Sources and method
          </h2>
          <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
            <p>
              The 5-year benchmark bond yield, prime rate and target for the overnight rate are
              read directly from the{' '}
              <a
                href="https://www.bankofcanada.ca/valet/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-900 underline inline-flex items-center gap-1"
              >
                Bank of Canada Valet API <ExternalLink size={11} />
              </a>
              . The reading shown is dated {asOfLabel} and refreshes hourly. Posted mortgage rates
              are our own{' '}
              <Link href="/rates" className="font-bold text-slate-900 underline">rate sheet</Link>
              {sheet.lastUpdated ? `, last revised ${sheet.lastUpdated}` : ''}. The spread is
              calculated from those two figures, not estimated.
            </p>
            <p>
              Nothing here is a forecast of a specific future rate, and no one can give you one
              honestly. The bond market is a leading indicator for fixed rates, not a guarantee.
              Rates quoted are the lowest available to qualified borrowers and are not an offer
              of credit. Your rate depends on a full application, lender underwriting and credit
              review.
            </p>
            <p>
              Written by Mudit Chhura, Mortgage Agent Level 2 (M25003057), IndiBrick, through
              Pineapple Financial Inc., Brokerage Licence 12830. See our{' '}
              <Link href="/editorial-policy" className="font-bold text-slate-900 underline">
                editorial policy
              </Link>{' '}
              for how we source and review market data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
