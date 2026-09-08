import React from 'react';
import Link from 'next/link';
import { buildMetadata } from '../../../lib/buildMetadata';
import SituationForm from '../../../components/SituationForm';
import { StatStrip, FAQ, BottomCTA, HeroTag, RelatedSituations } from '../../../components/SituationChrome';
import CiteBlock from '../../../components/CiteBlock';
import TrustBarLive from '../../../components/TrustBarLive';
import BrokerCard from '../../../components/BrokerCard';

export const metadata = buildMetadata({
  title: 'First-Time Home Buyer Ontario — Broker Guidance + Real Numbers',
  description: 'Buying your first home in Ontario? Get a real qualification number, understand the FTHB Tax Credit and RRSP Home Buyers\' Plan, and see rebated land transfer tax. FSRA-licensed advisor callback within 2 hours.',
  slug: '/situations/first-time-buyer',
  keywords: [
    'first time home buyer Ontario',
    'first time buyer mortgage GTA',
    'FTHB tax credit Ontario',
    'RRSP home buyers plan Canada',
    'land transfer tax rebate Ontario',
    'first time buyer 5% down',
  ],
});

const STATS = [
  { value: '$60k', label: 'per person RRSP Home Buyers\' Plan withdrawal (2026)' },
  { value: '$4k', label: 'Ontario FTHB land transfer tax rebate (+ $8,475 Toronto)' },
  { value: '5%', label: 'min down payment on first $500k of purchase price' },
];

const FTHB_LEVERS = [
  { name: 'RRSP Home Buyers\' Plan (HBP)', d: 'Withdraw up to $60k per person from your RRSP tax-free for a down payment (raised from $35k in Budget 2024). Couple can pull $120k. Repay over 15 years starting year 5 after purchase (repayment grace extended in Budget 2024 for withdrawals 2022–25).' },
  { name: 'First Home Savings Account (FHSA)', d: 'Newer than RRSP. Contribute up to $8k/yr, $40k lifetime. Tax-deductible on the way in AND tax-free on the way out for a first home. Can be combined with HBP.' },
  { name: 'FTHB Land Transfer Tax rebates', d: 'Ontario: up to $4,000 back on land transfer tax. Toronto: additional $4,475 municipal. Combined savings on a $600k Toronto home: ~$8,475.' },
  { name: 'FTHB Tax Credit (federal)', d: '$1,500 non-refundable tax credit on your income tax return the year of purchase. Small but automatic.' },
  { name: 'Insured mortgage (5%–19.99% down)', d: 'Under 20% down = CMHC / Sagen / Canada Guaranty insured. Cheaper interest rate (25–50 bps less than uninsured) because the insurer covers lender risk. Cap: $1.5M purchase price (as of Dec 2024).' },
  { name: '30-year amortization on insured (2025+)', d: 'FTHBs buying new-build homes qualify for 30-year insured amortization (up from 25-year cap). Lower monthly, more lifetime interest. Trade-off worth modelling.' },
];

export default function FirstTimeBuyerPage() {
  return (
    <div className="bg-white">
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/25 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <HeroTag className="bg-blue-500/15 text-blue-300 border-blue-500/30">🔑 First-Time Home Buyer · Ontario</HeroTag>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              Buying your first home <br/>
              <span className="text-blue-400">in Ontario.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              You&apos;ve saved some money. You want to buy. <strong className="text-white">Five government programs stack for first-time buyers</strong> — the trick is knowing which apply to your file and how they interact. That&apos;s a 15-min conversation with a broker, not a Google rabbit hole.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> A real qualification number — not "up to $X"</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Every applicable rebate + tax program stacked on your file</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> The right amortization + down-payment mix for you</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · No credit pull · Response in &lt; 2 hours</p>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-blue-300">
                Rather run numbers first? Try the <Link href="/affordability-calculator" className="underline font-bold">Affordability Calculator</Link> or <Link href="/land-transfer-tax-calculator-ontario" className="underline font-bold">Land Transfer Tax Calculator</Link>.
              </p>
              <p className="text-xs text-emerald-300">
                Want an instant answer? <a href="https://gopineapple.ca/muditchhura/preapproval" target="_blank" rel="noopener noreferrer" className="underline font-bold">Instant pre-approval tool</a>.
              </p>
            </div>
          </div>

          <div id="lead-form" className="scroll-mt-24">
            <SituationForm
              situationLabel="First-Time Buyer"
              serviceNeeded="Purchase — First-Time Buyer"
              sourceTag="situations/first-time-buyer"
              goal="Purchase"
              pageSource="/situations/first-time-buyer"
              submitLabel="Get My First-Time Buyer Plan"
              successHeadline="Plan on the way"
              successBody={<>A licensed IndiBrick advisor will call you within <strong>2 business hours</strong> with your qualification range, applicable government programs, and a target purchase price band. Bring an income proof + savings figure to the call.</>}
              accent="blue"
              responseWindow="within 2 business hours"
              externalCTA={{
                label: 'Or skip the wait — instant pre-approval',
                href: 'https://gopineapple.ca/muditchhura/preapproval',
                hint: 'Want it now, self-serve?',
              }}
              extraFields={[
                { name: 'city', label: 'Buying in (city)', type: 'text', placeholder: 'Toronto / Mississauga / Ottawa', half: true },
                { name: 'timeline', label: 'When are you buying?', type: 'select', options: ['Now — actively looking', 'Next 3 months', '3–6 months', '6–12 months', 'Just researching'], half: true },
                { name: 'income', label: 'Household income (annual)', type: 'currency', placeholder: '110000', half: true },
                { name: 'savingsForDown', label: 'Savings for down payment', type: 'currency', placeholder: '40000', step: 1000, half: true },
                { name: 'rrspOrFhsa', label: 'RRSP / FHSA available?', type: 'select', options: ['No', 'Yes — RRSP only', 'Yes — FHSA only', 'Yes — both'], required: false, half: true },
                { name: 'employmentType', label: 'Employment', type: 'select', options: ['T4 full-time', 'T4 part-time', 'Self-employed', 'Contract', 'New to Canada', 'Other'], half: true },
                { name: 'creditRange', label: 'Credit range', type: 'select', options: ['Excellent (720+)', 'Good (680–719)', 'Fair (620–679)', 'Not sure'], required: false, half: true },
              ]}
            />
          </div>
        </div>
      </section>

      <TrustBarLive variant="light" scaleClaim={{ value: '50+', label: 'A, B & insured lender panel' }} />

      <StatStrip stats={STATS} accentTextClass="text-blue-400" />

      {/* SOURCED CLAIMS */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4 text-center">Sources &amp; Methodology</p>
          <div className="space-y-3">
            <CiteBlock
              value="$60,000"
              claim="the maximum per-person RRSP Home Buyers' Plan withdrawal, raised from $35,000 in Budget 2024 for Canadian first-time buyers."
              source="Government of Canada — Home Buyers' Plan"
              sourceUrl="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/what-home-buyers-plan.html"
              asOf="2025-11"
            />
            <CiteBlock
              value="$8,000/yr / $40,000 lifetime"
              claim="the annual and lifetime contribution limits for the First Home Savings Account (FHSA) — Canada's newest first-home savings program launched April 2023."
              source="Government of Canada — First Home Savings Account (FHSA)"
              sourceUrl="https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html"
              asOf="2025-11"
            />
            <CiteBlock
              value="$4,000 / $4,475"
              claim="the maximum Ontario Land Transfer Tax first-time buyer rebate (up to $4,000) and Toronto's additional municipal LTT rebate (up to $4,475), for a combined GTA maximum of $8,475."
              source="Government of Ontario — Land Transfer Tax Refund"
              sourceUrl="https://www.ontario.ca/document/land-transfer-tax/land-transfer-tax-refund-first-time-homebuyers"
              asOf="2025-11"
            />
          </div>
        </div>
      </section>

      {/* FTHB LEVERS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">The 6 FTHB Levers</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Most first-time buyers use two. You should use four.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {FTHB_LEVERS.map(l => (
              <div key={l.name} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                <p className="font-black text-slate-900 text-sm mb-2">{l.name}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{l.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CITY LINKS — cross-link into pSEO matrix */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Broker Coverage by City</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Where you&apos;re buying matters more than you think</h2>
            <p className="text-sm text-gray-500 mt-4 max-w-2xl mx-auto">Rebate amounts, insured mortgage caps, and lender appetite vary by city. Check your local page:</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['toronto', 'mississauga', 'brampton', 'vaughan', 'markham', 'oakville', 'hamilton', 'burlington', 'ottawa', 'richmond-hill', 'ajax', 'whitby'].map(city => (
              <Link key={city} href={`/mortgage-broker/${city}`}
                className="bg-white rounded-xl px-4 py-3 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition text-sm font-bold text-slate-700 hover:text-blue-700 capitalize">
                {city.replace(/-/g, ' ')} →
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BrokerCard pageSource="/situations/first-time-buyer" accent="blue" />

      <FAQ
        accentTextClass="text-blue-600"
        items={[
          { q: 'How much down do I actually need in Ontario?', a: '5% on the first $500,000 of purchase price. 10% on the portion between $500k and $1.5M. 20% on anything above $1.5M (uninsured territory — cannot get CMHC/Sagen insurance). Example on a $700k home: 5% × $500k + 10% × $200k = $45,000 minimum down.' },
          { q: 'Can I use my RRSP + FHSA + gifted money together?', a: 'Yes. Common stack: withdraw $60k from RRSP HBP (raised from $35k in Budget 2024), withdraw $40k from FHSA (both tax-free), receive $20k gift from parents (with a gift letter). Total: $120k down, from three sources. Lender needs source-of-funds documentation for each — 90 days of statements.' },
          { q: 'What\'s the difference between insured and uninsured mortgages?', a: 'Insured (5–19.99% down, under $1.5M): CMHC/Sagen/Canada Guaranty covers the lender if you default. Cheaper rate for you (25–50 bps discount), but you pay the insurance premium (2.8–4% of mortgage, added to the balance). Uninsured (20%+ down, or over $1.5M): no premium, but slightly higher rate. Over the term, insured is usually cheaper — but you\'re paying the premium up front.' },
          { q: 'What does the stress test do to my qualification?', a: 'Every mortgage in Canada is qualified at the greater of (a) contract rate + 2%, OR (b) 5.25%. Example: contract rate 4.29% → qualifying rate 6.29%. This is what determines your maximum loan, not the contract rate you actually pay. Impact: you\'ll qualify for 15–20% less than a naive payment calculator suggests.' },
          { q: 'What credit score do I need?', a: 'A-lender: 660+ minimum, 720+ for best pricing. 620–659: alt-A / B-lender territory (rate premium 100–200 bps). Below 620: private lender or credit rebuild before buying. If you\'re under 660 and buying in the next 90 days, we can often coach specific credit tweaks that lift you into A-lender range.' },
          { q: 'Should I get pre-approved before making offers?', a: 'Yes — but understand the pre-approval isn\'t a rate hold or a guarantee. It\'s a lender saying "based on your income + credit + down payment, we\'re prepared to lend up to $X at today\'s rates, subject to property review." When you make an offer, the lender re-checks everything and specifically underwrites the property. Pre-approval just tells you the ceiling and lets your realtor write conditional-financing offers with confidence.' },
        ]}
      />

      <RelatedSituations
        accentTextClass="text-blue-600"
        items={[
          { href: '/situations/new-to-canada', title: 'Newcomer + first-time buyer', blurb: 'Newcomer programs stack with FTHB programs — same broker call routes both angles at once.' },
          { href: '/situations/declined-by-bank', title: 'Bank turned you down?', blurb: 'FTHBs with self-employed income or bruised credit often need the alt-A path — same broker, different lender.' },
          { href: '/situations/investment-property', title: 'Thinking of a rental down the line?', blurb: 'How you structure the first mortgage affects what you can qualify for on rental #2 — plan ahead.' },
        ]}
      />

      <BottomCTA
        headline="Buying your first home isn't just about the rate."
        body="It's about stacking programs, timing amortization, and picking the right lender for your income type. Get 15 minutes with a broker who does this every day."
        buttonLabel="Get My First-Time Buyer Plan"
        buttonHref="#lead-form"
        buttonClass="bg-blue-600 hover:bg-blue-500 shadow-blue-500/40"
        footerNote="FSRA-licensed · No credit pull · Response in < 2 hours"
      />
    </div>
  );
}
