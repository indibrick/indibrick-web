import React from 'react';
import Link from 'next/link';
import { buildMetadata } from '../../../lib/buildMetadata';
import SituationForm from '../../../components/SituationForm';
import { StatStrip, FAQ, BottomCTA, HeroTag, RelatedSituations } from '../../../components/SituationChrome';
import CiteBlock from '../../../components/CiteBlock';
import TrustBar from '../../../components/TrustBar';
import BrokerCard from '../../../components/BrokerCard';
import RateMatchPromise from '../../../components/RateMatchPromise';

export const metadata = buildMetadata({
  title: 'Refinance for Debt Consolidation — Ontario Mortgage Broker',
  description: 'Roll $60k of credit card debt at 22% into your mortgage at 7.5%. Free side-by-side plan showing your new payment, break-even on any penalty, and monthly cash flow unlocked. FSRA-licensed advisor within 24 hours.',
  slug: '/situations/refinance-debt-consolidation',
  keywords: [
    'refinance debt consolidation Ontario',
    'HELOC add-on RBC TD Scotia',
    'consolidate credit card debt into mortgage',
    'home equity debt consolidation Canada',
    'blend and extend refinance',
    'mortgage debt consolidation broker',
  ],
});

const STATS = [
  { value: '$725', label: 'avg monthly cash flow freed on last 28 refis' },
  { value: '22% → 7.5%', label: 'typical APR drop on consolidated debt' },
  { value: '4–6 yr', label: 'shaved off debt payoff timeline' },
];

const TRIGGERS = [
  { t: 'Credit card balances over $20k at 19–24% APR', why: 'Every $10k of CC debt at 22% costs $183/month in interest alone. Rolling to secured 7.5% debt drops that to $62/month. Compounds fast.' },
  { t: 'Line of credit over $30k at prime + 3%+', why: 'Unsecured LOCs are prime + 3–5% these days. Home equity is prime + 0.5. Same principal, less than half the interest.' },
  { t: 'HELOC balance approaching your limit', why: 'HELOCs demand-callable. If you\'re carrying a large balance you were meant to pay off, fold it into your mortgage before the lender re-margins you.' },
  { t: 'Renovation you\'d otherwise put on CCs / LOC', why: 'Refi at renewal (T–120 days) is fee-free equity access up to 80% LTV. Costs ~7.5% vs 22% on CCs. Payback in months, not years.' },
  { t: 'Business needs cash injection', why: 'Home-secured business capital: 7.5–8.5%. Bank business LOC: 9–14%. Alt business lender: 18%+. Home equity wins on cost every time.' },
  { t: 'Divorce buyout / equalization payment', why: 'Court-ordered buyout with tight timeline. Refi to release the ex-spouse from title + provide the cash lump sum in one transaction.' },
];

const TWO_PATHS = [
  {
    name: 'HELOC add-on',
    color: 'blue',
    pros: [
      'No mortgage penalty',
      'Draw as needed, pay back anytime',
      'Interest-only payments available',
      'Best if existing mortgage is with a collateral-charge lender (RBC, TD, Scotia, Tangerine)',
    ],
    cons: [
      'Rate is prime + 0.5 or higher (variable)',
      'Lender can demand repayment (rare, but possible)',
    ],
    fit: 'Fastest, cheapest path if your bank supports it. 5–10 business days to fund.',
  },
  {
    name: 'Full refinance',
    color: 'emerald',
    pros: [
      'Lock a new fixed rate on the whole balance',
      'Fold all debt into ONE payment',
      'Extend amortization to lower monthly',
      'B-lender bridge available if A-lender declines',
    ],
    cons: [
      'Penalty on existing mortgage (IRD on fixed, 3-mo interest on variable)',
      '4–6 weeks to close',
      'Full re-underwrite required',
    ],
    fit: 'Best when penalty pays back inside 12–18 months, OR your existing rate is above market anyway.',
  },
];

export default function RefinanceDebtConsolidationPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <HeroTag className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">💰 Debt Consolidation · Refinance</HeroTag>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              High-interest debt, <br/>
              <span className="text-emerald-400">low-interest house.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              If you&apos;re carrying $60k across credit cards at 22%, you&apos;re paying <strong className="text-white">$1,100/month in interest alone</strong>. That same debt secured by your home costs <strong className="text-emerald-400">$375/month</strong>. Same principal. Different math. We&apos;ll build the side-by-side and tell you which path — HELOC add-on or full refi — nets more.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Break-even month on any mortgage penalty</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> HELOC add-on if you don&apos;t want to break your mortgage</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Target-payoff schedule so you don&apos;t just stretch the debt</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · 28 files closed last 90 days · Response in &lt; 24 hours</p>
            <p className="text-xs text-emerald-300 mt-4">
              Prefer the <Link href="/refi-payout-plan" className="underline font-bold">live-calculator Refi Payout Plan</Link>?
            </p>
          </div>

          <div id="lead-form" className="scroll-mt-24">
            <SituationForm
              situationLabel="Refi / Debt Consolidation"
              serviceNeeded="Refinance / Debt Consolidation"
              sourceTag="situations/refinance-debt-consolidation"
              goal="Refinance"
              pageSource="/situations/refinance-debt-consolidation"
              submitLabel="Show Me My Payout Plan"
              successHeadline="Plan on the way"
              successBody={<>A licensed IndiBrick advisor will email your <strong>Refi Payout Plan</strong> — current vs consolidated payment, break-even on any penalty, and five-year cash-flow delta — within <strong>24 hours</strong>.</>}
              accent="emerald"
              responseWindow="within 24 hours"
              collapseOptional
              extraFields={[
                // Essential — always shown. Broker needs at least these 3
                // to build a real payout plan.
                { name: 'mortgageBalance', label: 'Mortgage balance', type: 'currency', placeholder: '450000', half: true },
                { name: 'homeValue', label: 'Home value (estimate)', type: 'currency', placeholder: '850000', half: true },
                { name: 'creditCardDebt', label: 'Credit card debt', type: 'currency', placeholder: '60000', step: 500 },
                // Optional — collapsed. Broker will ask on the callback if left blank.
                { name: 'currentLender', label: 'Current mortgage lender', type: 'text', placeholder: 'RBC / TD / MCAP / etc.', half: true, required: false },
                { name: 'termType', label: 'Fixed or variable?', type: 'select', options: ['Fixed', 'Variable / Adjustable', 'Not sure'], half: true, required: false },
                { name: 'otherDebt', label: 'Other unsecured debt', type: 'currency', placeholder: '15000', step: 500, required: false, helpText: 'LOCs, personal loans' },
                { name: 'postalCode', label: 'Postal code', type: 'text', placeholder: 'M5V 3A8', required: false },
              ]}
            />
          </div>
        </div>
      </section>

      <TrustBar variant="light" scaleClaim={{ value: '28+', label: 'refi files closed in the last 90 days' }} />

      <StatStrip stats={STATS} accentTextClass="text-emerald-400" />

      {/* SOURCED CLAIMS */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4 text-center">Sources &amp; Methodology</p>
          <div className="space-y-3">
            <CiteBlock
              value="~22%"
              claim="typical Canadian credit card APR range (19.99%–24.99%) — the baseline the refi consolidation math compares against."
              source="Financial Consumer Agency of Canada — Credit card interest rates"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/credit-cards.html"
              asOf="2025-11"
            />
            <CiteBlock
              value="80% LTV / 65% HELOC"
              claim="the maximum loan-to-value for a Canadian refinance (80%) and HELOC add-on (65%) — the ceilings that determine how much equity you can access."
              source="OSFI Guideline B-20 — LTV limits and B-4 (HELOCs)"
              sourceUrl="https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/residential-mortgage-underwriting-practices-procedures"
              asOf="2025-01"
            />
            <CiteBlock
              value="IRD vs 3-mo interest"
              claim="the two Canadian mortgage penalty methods — knowing which your lender uses determines whether a refi pencils out."
              source="Financial Consumer Agency of Canada — Prepayment charges"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages/prepayment-charges.html"
              asOf="2025-11"
            />
          </div>
        </div>
      </section>

      {/* WHEN IT MAKES SENSE */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">6 signals this is the right move</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">If one of these is true for you, run the math</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {TRIGGERS.map(t => (
              <div key={t.t} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                <p className="font-black text-slate-900 text-sm mb-2">{t.t}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{t.why}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TWO PATHS */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">The Two Paths</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">You don&apos;t always need a full refi</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TWO_PATHS.map(p => (
              <div key={p.name} className={`bg-white rounded-3xl p-6 md:p-8 border ${p.color === 'blue' ? 'border-blue-100' : 'border-emerald-100 ring-2 ring-emerald-500/20'} shadow-sm`}>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2">{p.name}</h3>
                <p className={`text-xs font-bold ${p.color === 'blue' ? 'text-blue-700' : 'text-emerald-700'} mb-4`}>{p.fit}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Pros</p>
                <ul className="space-y-1.5 mb-4">
                  {p.pros.map(pr => <li key={pr} className="text-sm text-slate-700 flex gap-2"><span className="text-emerald-500 font-black">✓</span> {pr}</li>)}
                </ul>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Trade-offs</p>
                <ul className="space-y-1.5">
                  {p.cons.map(c => <li key={c} className="text-sm text-gray-600 flex gap-2"><span className="text-gray-400 font-black">–</span> {c}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto">The Refi Payout Plan tells you which option nets more given your actual balance, penalty type (IRD vs 3-mo interest), and existing lender relationship.</p>
        </div>
      </section>

      <RateMatchPromise accent="emerald" />

      <BrokerCard pageSource="/situations/refinance-debt-consolidation" accent="emerald" />

      <FAQ
        accentTextClass="text-emerald-600"
        items={[
          { q: 'Won\'t I just end up paying the debt off over 25 years?', a: 'Only if you re-amortize it over 25 years — which is a bad idea. The plan we build always shows a "target payoff" schedule that matches or beats your current timeline, using the freed-up monthly cash to hit the balance harder. Turning $60k @ 22% into $60k @ 7.5% paid off in 5 years saves you ~$45k in interest over the payoff period.' },
          { q: 'What about the penalty on my existing mortgage?', a: 'Two cases:\n\n• Fixed with a monoline: IRD penalty can be brutal — sometimes $10k+ on a mid-rate file. Break-even math has to work.\n\n• Variable OR fixed with a bank: penalty is typically 3 months\' interest ($2–4k range). Almost always net positive.\n\nThe plan spells out the exact break-even month either way.' },
          { q: 'What\'s the LTV limit for consolidation refis?', a: 'Full refi in Canada: 80% loan-to-value. HELOC add-on: usually 65% combined LTV. If you\'re above 80% LTV and need equity, options tighten — B-lender programs go to 85%, private lenders to 75%.' },
          { q: 'Will consolidation hurt my credit score?', a: 'Short term: a hard credit pull drops your score 5–15 points and it recovers in 3 months. Longer term: paying off revolving credit card balances (which the consolidation does) can BOOST your score 40–80 points by dropping your credit utilization. Net-net, consolidation is usually credit-positive within 6 months.' },
          { q: 'Can I consolidate if I\'m self-employed?', a: 'Yes — through B-lender programs that use bank statement / stated income. A-lender consolidations require T4 income or 2 years T1 general returns. If you\'re SE with strong cash flow but written-down net income, B-lender is the usual path.' },
          { q: 'What if my current mortgage is with the same bank as my credit cards?', a: 'Doesn\'t matter. The bank\'s mortgage division and credit card division are underwritten separately. What matters is the mortgage lender\'s ability to lend on the new consolidated amount at 80% LTV — often the same bank will happily give you a bigger mortgage even while their CC division was refusing to lower your APR.' },
          { q: 'How is this different from a bank\'s debt consolidation loan?', a: 'A bank unsecured consolidation loan is typically 9–14% and unsecured — better than 22% CC but far worse than 7.5% secured. The bank\'s "debt help" product exists because they don\'t want you to refinance the mortgage (they lose ancillary product revenue). Doing it through a broker with an actual mortgage instrument is almost always cheaper.' },
        ]}
      />

      <RelatedSituations
        accentTextClass="text-emerald-600"
        items={[
          { href: '/situations/mortgage-renewal', title: 'Renewing soon?', blurb: 'Refi at renewal skips the penalty entirely — best window to consolidate if you\'re inside T–120 days.' },
          { href: '/situations/investment-property', title: 'BRRRR refinance', blurb: 'Consolidation refis on rental properties follow different rules — DCR-based lenders and 6-month seasoning.' },
          { href: '/situations/declined-by-bank', title: 'Declined for the refi?', blurb: 'A-lender turned you down at 80% LTV? Alt-A programs go to 85% and B-lenders further.' },
        ]}
      />

      <BottomCTA
        headline="Your house is doing more work than you think."
        body="Twenty-four hours from now you'll know exactly how much monthly cash flow you can pull back — with a plan you can show your accountant."
        buttonLabel="Show Me My Payout Plan"
        buttonHref="#lead-form"
        buttonClass="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/40"
        footerNote="FSRA-licensed · No credit pull · 24-hour delivery"
      />
    </div>
  );
}
