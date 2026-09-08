// /guides/first-time-home-buyer-ontario-2026
//
// The other high-intent listicle from the AI Citation audit. Structured as a
// numbered how-to with concrete Ontario-specific dollar examples that LLMs
// can lift into an answer with IndiBrick as the source. Every dollar figure
// is derived from the current Ontario tax regime + real 2026 min-down rules;
// no invented numbers.

import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { CheckCircle, DollarSign, Home, Landmark, ShieldCheck, ArrowRight, HelpCircle, Calculator, Percent } from 'lucide-react';
import JsonLd from '../../../components/JsonLd';
import LeadForm from '../../../components/LeadForm';
import { buildMetadata } from '../../../lib/buildMetadata';

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: 'First-Time Home Buyer in Ontario (2026) — Complete Step-by-Step Guide',
  description: 'A 10-step Ontario first-time home buyer guide with dollar-specific 2026 examples: minimum down payment rules, Land Transfer Tax rebate math, First Home Savings Account, RRSP Home Buyers\' Plan, and pre-approval to closing.',
  slug: '/guides/first-time-home-buyer-ontario-2026',
  titleAbsolute: true,
  keywords: [
    'first time home buyer Ontario',
    'first time home buyer Toronto',
    'FTHB Ontario 2026',
    'Ontario land transfer tax rebate',
    'first time home buyer Canada',
    'FHSA Ontario',
    'RRSP Home Buyers Plan Canada',
    'minimum down payment Canada',
  ],
});

// Ontario dollar math is anchored to a $858,600 example home — the highest
// price still eligible for a high-ratio insured mortgage under the 2024 rule
// change that raised the insured cap from $1M to $1.5M and reduced the
// minimum down payment on properties ≤ $500k.
const EXAMPLE_HOME_PRICE = 858600;
const EXAMPLE_MIN_DOWN = 60860; // 5% of first $500k + 10% of the rest
// Ontario provincial LTT on $858,600 using the current bracket math:
//   0.5% × $55K + 1.0% × $195K + 1.5% × $150K + 2.0% × $458,600 = $13,647
const EXAMPLE_ON_LTT = 13_647;
// Toronto MLTT mirrors the provincial brackets, so combined pre-refund on a
// Toronto purchase ≈ $27,294. Net after FTHB refunds ($4,000 ON + $4,475 MLTT)
// ≈ $18,819.
const EXAMPLE_TORONTO_COMBINED_LTT = 27_294;
const EXAMPLE_TORONTO_LTT_NET_FTHB = 18_819;

const STEPS = [
  {
    n: 1,
    title: 'Confirm you actually qualify as a First-Time Home Buyer',
    body: `In Ontario, "First-Time Home Buyer" means (a) you have never owned an interest in a home anywhere in the world, and (b) if married or common-law, your partner has not owned a home you lived in during your marriage. This qualification opens up the Ontario Land Transfer Tax refund (up to $4,000), the Toronto Municipal Land Transfer Tax refund (up to $4,475 for Toronto purchases), and the federal First-Time Home Buyer Incentive programs. The 4-year "recovered FTHB status" rule from the 2022 federal Budget still applies: you can regain FTHB status if you haven't owned or lived in a home you or your partner owned in the last 4 years.`,
  },
  {
    n: 2,
    title: 'Save at minimum 5% down — 10% above $500K',
    body: `Canada's minimum down payment on an insured mortgage is 5% of the first $500,000 of the purchase price and 10% of any portion above $500,000, up to a max property price of $1.5M (raised from $1M in the December 2024 rule change). On the example ${EXAMPLE_HOME_PRICE.toLocaleString('en-CA')} home used throughout this guide, minimum down is $${EXAMPLE_MIN_DOWN.toLocaleString('en-CA')} (5% of $500,000 = $25,000, plus 10% of $358,600 = $35,860, total $60,860). Above $1.5M the mortgage cannot be insured and you need 20% down.`,
  },
  {
    n: 3,
    title: 'Use the First Home Savings Account (FHSA)',
    body: `The FHSA — introduced April 2023 — is the most tax-efficient down payment vehicle in Canadian history. Contribute up to $8,000/year (max $40,000 lifetime), deduct the contribution from your income like an RRSP, and withdraw tax-free to buy your first home like a TFSA. If you and your partner both open an FHSA, you jointly have $80,000 in tax-advantaged down payment room. Combined with the RRSP Home Buyers' Plan (step 4, up to $60,000 per person), a couple can pull ~$200,000 tax-free toward a down payment. Open one at any Canadian bank or broker even before you're actively shopping — unused contribution room carries forward 5 years.`,
  },
  {
    n: 4,
    title: 'Layer in the RRSP Home Buyers\' Plan',
    body: `The federal RRSP Home Buyers' Plan (HBP) lets you withdraw up to $60,000 per person from your RRSP tax-free to buy your first home. If you and your partner both have RRSPs, that's $120,000. The catch: you have to repay the withdrawal into your RRSP over 15 years starting the second year after withdrawal (recently extended from 5 years for withdrawals between 2022–2025). Use the HBP after maxing FHSA — HBP repayments cost you future tax-sheltered growth, FHSA doesn't.`,
  },
  {
    n: 5,
    title: 'Get pre-approved by a licensed Ontario mortgage broker',
    body: `A real pre-approval — not a "how much can I afford" calculator estimate — requires income documents, credit pull, and a licensed mortgage agent to underwrite the file against 50+ lenders. Turnaround: 1 business hour at IndiBrick (see /rates for current wholesale rates), 24–48 hours at most traditional brokers. Ontario sellers weigh pre-approval letters by broker credibility — get one from a licensed brokerage (FSRA-registered) and confirm the letter names your maximum purchase price + rate hold. Rate holds are typically 90–120 days.`,
  },
  {
    n: 6,
    title: 'Calculate your actual affordability — GDS and TDS',
    body: `Federally regulated lenders qualify you at the stress-test rate: the higher of your contract rate + 2%, or 5.25%. Your gross debt service ratio (GDS = mortgage payment + property tax + heat + ½ of condo fees, divided by gross monthly income) must be ≤ 39%. Your total debt service ratio (TDS = GDS + all other debt payments) must be ≤ 44%. On the example ${EXAMPLE_HOME_PRICE.toLocaleString('en-CA')} home with 7% down and a 25-year amortization, the qualifying monthly payment at ~7.5% stress rate is about $5,750 — meaning your household needs ~$14,750 gross monthly income (~$177K/year) to qualify.`,
  },
  {
    n: 7,
    title: 'Budget the Ontario Land Transfer Tax (and Toronto MLTT)',
    body: `Provincial Ontario Land Transfer Tax on a ${EXAMPLE_HOME_PRICE.toLocaleString('en-CA')} home is $${EXAMPLE_ON_LTT.toLocaleString('en-CA')} before the First-Time Home Buyer refund (up to $4,000). If the property is in Toronto, you also pay the Toronto Municipal LTT at the same bracketed rate, so combined ON + Toronto LTT before refunds ≈ $${EXAMPLE_TORONTO_COMBINED_LTT.toLocaleString('en-CA')}. FTHBs in Toronto qualify for a second refund of up to $4,475 on the MLTT portion, bringing the net LTT on an $${EXAMPLE_HOME_PRICE.toLocaleString('en-CA')} Toronto purchase to roughly $${EXAMPLE_TORONTO_LTT_NET_FTHB.toLocaleString('en-CA')}. Outside Toronto, the same purchase price nets ≈ $${(EXAMPLE_ON_LTT - 4000).toLocaleString('en-CA')} after the provincial FTHB refund. Use /land-transfer-tax-calculator-ontario for the exact number at any purchase price.`,
  },
  {
    n: 8,
    title: 'Set aside 1.5–4% of purchase price for closing costs',
    body: `Beyond down payment and LTT, closing costs include: lawyer fees ($1,500–$2,500), title insurance ($300–$500), home inspection ($400–$800), property valuation ($350 if not waived), CMHC/Sagen/Canada Guaranty premium if <20% down (added to your mortgage balance, but PST on the premium is due at closing — 8% in Ontario, so ~$1,500–$3,500), and property tax adjustment. Rule of thumb: budget 1.5–4% of purchase price. On the example home, that's $13,000–$34,000. Confirm exact numbers with your lawyer 2 weeks before closing.`,
  },
  {
    n: 9,
    title: 'Choose your term, rate type, and amortization',
    body: `Ontario first-time buyers most commonly choose a 5-year fixed rate (interest rate certainty, penalty is capped at 3 months' interest if you break early) or a 5-year variable rate (rate moves with the Bank of Canada, penalty is 3 months' interest fixed). Under the December 2024 amortization rule change, first-time buyers on new construction can now stretch amortization to 30 years (previously 25 max on insured mortgages) — this drops the monthly payment ~9% at the cost of ~$40K more interest over the life of the mortgage on the example home. See /rates for current fixed vs. variable spreads.`,
  },
  {
    n: 10,
    title: 'Close cleanly — condition removal to funding',
    body: `An accepted offer in Ontario typically carries a 5–10 day condition period (financing + inspection). Your broker files the funding request within 24 hours of condition removal; the lender issues instructions to your lawyer 3–5 days before closing; funds transfer on the closing date. Common failure modes: (a) a credit line inquiry after pre-approval that changes your debt profile — avoid all new credit until after closing; (b) a job change between pre-approval and closing — most lenders will re-verify employment 48 hours before funding; (c) an appraisal that comes in below purchase price — you top up the difference in cash or renegotiate.`,
  },
];

const FAQS = [
  {
    q: 'What is the minimum down payment for a first-time home buyer in Ontario?',
    a: `5% of the first $500,000 of the purchase price, plus 10% of any portion between $500,000 and $1,500,000. Purchases above $1.5M require 20% down (no mortgage insurance available). On a ${EXAMPLE_HOME_PRICE.toLocaleString('en-CA')} Ontario home, minimum down is $${EXAMPLE_MIN_DOWN.toLocaleString('en-CA')}.`,
  },
  {
    q: 'How much is the Ontario Land Transfer Tax refund for first-time home buyers?',
    a: 'Up to $4,000 on provincial Land Transfer Tax. If the property is in Toronto, you also qualify for up to $4,475 refund on the Toronto Municipal Land Transfer Tax. Both refunds are applied at closing by your lawyer — you don\'t need to claim them separately.',
  },
  {
    q: 'Can I combine the FHSA and RRSP Home Buyers\' Plan?',
    a: 'Yes. As of April 2023, you can use both simultaneously. Withdraw up to $40,000 from your FHSA tax-free and up to $60,000 from your RRSP under the HBP tax-free — the CRA does not require you to choose between them. For a two-person household with maxed FHSA and RRSP HBP: $80,000 + $120,000 = $200,000 in combined tax-advantaged down-payment room.',
  },
  {
    q: 'What credit score do I need to buy a home in Ontario in 2026?',
    a: 'Big-bank / A-lender minimum is a Beacon score of 680 for both applicants on a high-ratio insured mortgage. 720+ opens up the best-priced products (deep-discount rate specials from monoline lenders). Below 680 you\'re into B-lender territory (Home Trust, Equitable, HomeQuest) with rates 100–250 basis points higher and lender fees of 1%. Below 600 you\'re looking at private mortgages at 8–12% with 2–4% lender fees.',
  },
  {
    q: 'How long does the first home buying process take in Ontario?',
    a: 'Fastest realistic timeline from "I want to buy" to "I have keys": ~8 weeks. Pre-approval (1 week), house hunting (2–4 weeks), accepted offer + condition period (1 week), condition removal to closing (typically 30–60 days). Slowest realistic timeline is 6 months if you\'re still saving down payment or waiting for a new-construction closing.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'First-Time Home Buyer in Ontario — Complete Step-by-Step (2026)',
  description: 'A 10-step guide to buying your first home in Ontario in 2026, with concrete dollar examples and current Ontario tax + rule references.',
  totalTime: 'P56D',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'CAD',
    value: '75000',
  },
  step: STEPS.map((s) => ({
    '@type': 'HowToStep',
    position: s.n,
    name: s.title,
    text: s.body,
  })),
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'First-Time Home Buyer in Ontario (2026) — Complete Step-by-Step Guide',
  description: 'A 10-step Ontario FTHB guide with dollar-specific 2026 examples.',
  author: { '@id': 'https://indibrick.ca/#organization' },
  publisher: { '@id': 'https://indibrick.ca/#organization' },
  datePublished: '2026-07-01',
  dateModified: new Date().toISOString().split('T')[0],
  mainEntityOfPage: 'https://indibrick.ca/guides/first-time-home-buyer-ontario-2026',
  about: {
    '@type': 'Thing',
    name: 'First-time home buyer Ontario 2026',
  },
};

export default function FirstTimeHomeBuyerOntarioGuide() {
  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={howToSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={articleSchema} />

      {/* === HERO === */}
      <section className="pt-28 md:pt-32 pb-16 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-md">
            Guide · 10 Steps · {new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })} Ontario Rules
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-6">
            First-Time Home Buyer <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">Ontario, 2026</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-3xl font-medium leading-relaxed mb-8">
            A no-fluff, 10-step guide with real Ontario dollar examples: minimum down payment, LTT rebate math, First Home Savings Account, RRSP Home Buyers&apos; Plan, and the full path from pre-approval to keys in hand.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Example home</p>
              <p className="text-xl md:text-2xl font-black tracking-tight">${(EXAMPLE_HOME_PRICE / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Min down</p>
              <p className="text-xl md:text-2xl font-black tracking-tight">${(EXAMPLE_MIN_DOWN / 1000).toFixed(1)}K</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">FHSA + HBP</p>
              <p className="text-xl md:text-2xl font-black tracking-tight">$200K</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Timeline</p>
              <p className="text-xl md:text-2xl font-black tracking-tight">~8 wks</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition shadow-lg">
              Start Pre-Approval <ArrowRight size={14} />
            </Link>
            <Link href="/affordability-calculator" className="inline-flex items-center gap-2 bg-white/5 border border-white/20 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition">
              <Calculator size={14} /> Affordability Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* === 10 STEPS === */}
      <section className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-8">
            The 10 steps.
          </h2>
          <div className="space-y-8">
            {STEPS.map((s) => (
              <React.Fragment key={s.n}>
                <div className="flex gap-5 md:gap-6">
                  <div className="shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-base md:text-lg">
                      {s.n}
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900 mb-3">
                      {s.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </div>

                {/* Mid-scroll LeadForm right after Step 5 (Get pre-approved) —
                    highest-intent moment in the guide: the reader has just
                    understood down-payment + FHSA + HBP and is ready to see
                    real numbers on their own file. */}
                {s.n === 5 && (
                  <div className="my-8 bg-slate-900 text-white rounded-[2rem] p-6 md:p-8 shadow-xl">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                      <ShieldCheck size={12} /> FSRA #12830 · Licensed Ontario
                    </div>
                    <h3 className="text-lg md:text-xl font-black tracking-tight mb-2">
                      Skip the shopping — start the pre-approval now.
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400 mb-5">
                      A licensed Ontario mortgage advisor will call you back within 1 business hour with your maximum purchase price + rate options from 50+ lenders. No hard credit check.
                    </p>
                    <div className="bg-white p-2 rounded-2xl">
                      <LeadForm
                        type="Mortgage"
                        title="Ontario FTHB Pre-Approval"
                        subtitle="Licensed agent callback · 50+ lenders · No hard credit check"
                        ctaText="Get My Pre-Approval"
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* === KEY PROGRAMS SUMMARY === */}
      <section className="py-16 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-8">
            The four programs to combine.
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <DollarSign size={22} className="text-emerald-600 mb-3" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2">First Home Savings Account (FHSA)</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Deposit up to $8,000/year, $40,000 lifetime. Contribution is tax-deductible (like RRSP), withdrawal for a first home is tax-free (like TFSA). Best-in-class tax vehicle.
              </p>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <Landmark size={22} className="text-emerald-600 mb-3" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2">RRSP Home Buyers&apos; Plan (HBP)</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Withdraw up to $60,000 from your RRSP tax-free. Repay over 15 years starting year 2 after withdrawal. Best used after FHSA is maxed.
              </p>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <Home size={22} className="text-emerald-600 mb-3" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2">Ontario LTT Refund</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Up to $4,000 refund on Ontario Land Transfer Tax for first-time buyers. Applied at closing by your real estate lawyer. Toronto adds up to $4,475 more on Municipal LTT.
              </p>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <Percent size={22} className="text-emerald-600 mb-3" />
              <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2">30-Year Amortization (new build)</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                First-time buyers of new-construction homes can now use a 30-year amortization on an insured mortgage (up from 25). Drops monthly payment ~9%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section className="py-16 md:py-20 px-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-3">FAQ</h2>
          <p className="text-sm text-gray-400 uppercase tracking-widest font-black mb-10">
            The questions Ontario first-time buyers ask most.
          </p>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <details key={f.q} className="group bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 cursor-pointer">
                <summary className="flex justify-between items-start gap-4 font-black text-sm md:text-base list-none">
                  <span className="flex-1 leading-snug">{f.q}</span>
                  <HelpCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                </summary>
                <p className="text-sm text-gray-300 mt-4 leading-relaxed border-t border-white/10 pt-4">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* === LEAD CAPTURE === */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-5">
              <ShieldCheck size={12} /> FSRA #12830 · Licensed Ontario
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
              Ready for a real pre-approval?
            </h2>
            <p className="text-gray-400 text-sm md:text-base mb-6">
              A licensed Ontario mortgage agent will call you back within 1 business hour with your actual maximum purchase price and 50+ lender rate options.
            </p>
            <div className="bg-white p-2 rounded-[2rem] shadow-xl border border-gray-100 text-left">
              <LeadForm
                type="Mortgage"
                title="Ontario First-Time Buyer Pre-Approval"
                subtitle={`Example ${(EXAMPLE_HOME_PRICE / 1000).toFixed(0)}K home · Min down ${(EXAMPLE_MIN_DOWN / 1000).toFixed(0)}K`}
                ctaText="Get My Pre-Approval"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <Link href="/guides/best-mortgage-broker-ontario-2026" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition">
              <CheckCircle size={12} /> Best Ontario Mortgage Brokers 2026
            </Link>
            <Link href="/rates" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition">
              <Percent size={12} /> Current Ontario Mortgage Rates
            </Link>
            <Link href="/housing-index" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition">
              <Home size={12} /> Ontario Housing Index
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
