import React from 'react';
import Link from 'next/link';
import { buildMetadata } from '../../../lib/buildMetadata';
import SituationForm from '../../../components/SituationForm';
import { StatStrip, FAQ, BottomCTA, HeroTag, RelatedSituations } from '../../../components/SituationChrome';
import CiteBlock from '../../../components/CiteBlock';
import TrustBarLive from '../../../components/TrustBarLive';
import BrokerCard from '../../../components/BrokerCard';
import RateMatchPromise from '../../../components/RateMatchPromise';

export const metadata = buildMetadata({
  title: 'Mortgage Renewal in Ontario — What Your Bank Won\'t Tell You',
  description: 'Your renewal letter is a starting bid, not a final offer. Understand the 120-day rate hold, blend-and-extend options, and why 8 in 10 Canadians overpay at renewal. Free rate check from a FSRA-licensed broker.',
  slug: '/situations/mortgage-renewal',
  keywords: [
    'mortgage renewal Ontario',
    'switch mortgage lender at renewal',
    'mortgage renewal broker',
    '120 day rate hold',
    'blend and extend mortgage',
    'mortgage renewal 2026',
  ],
});

const STATS = [
  { value: '60%', label: 'of Canadian mortgages renew in 2025–26' },
  { value: '$180–$340', label: 'avg monthly savings on renewals we place' },
  { value: '120', label: 'days you can shop before maturity, no penalty' },
];

const RENEWAL_MOVES = [
  { move: 'Straight renewal (do nothing)', when: 'Only makes sense if the rate your bank offered is at or below broker-channel best. About 1 in 8 files.', signal: 'Bank retention already matched market. Safe to sign.' },
  { move: 'Switch to a new A-lender', when: 'Your existing bank\'s offer is 20+ bps above best available. Free switch on insured mortgages, small legal on uninsured.', signal: 'Highest ROI path for 70% of renewers in 2026.' },
  { move: 'Blend-and-extend with current lender', when: 'You want the bank to average your old low rate with new higher rate — no penalty, no re-qualifying.', signal: 'Best when you\'re 6–18 months from maturity and rates are volatile.' },
  { move: 'Refinance at renewal', when: 'You need equity for renos/consolidation/investment. Refi at renewal = no penalty, up to 80% LTV.', signal: 'The one time in your mortgage life you can restructure fee-free.' },
  { move: 'Extend amortization', when: 'Cash flow is tight and payment shock is real. Extending 25→30 yr amort drops the monthly, but adds lifetime interest.', signal: 'Available at renewal even if it wasn\'t at origination. B-lenders will go to 35yr.' },
];

const RENEWAL_TIMELINE = [
  { d: 'T–120 days', a: 'Lock a rate hold with the incumbent OR with a broker. Free. Protects you if rates rise.' },
  { d: 'T–90 days', a: 'Get 2–3 broker-channel quotes. Compare against the bank offer.' },
  { d: 'T–60 days', a: 'Decide: stay, switch, blend, or refi. If switching, start the paperwork now.' },
  { d: 'T–30 days', a: 'Sign renewal or complete switch. Confirm PAD/prepayment terms.' },
  { d: 'T–0 (maturity)', a: 'New mortgage active. If nothing was done, your bank auto-renews you into an open variable at prime + 0.50 or worse. Don\'t let this happen.' },
];

export default function MortgageRenewalPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/25 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <HeroTag className="bg-red-600/20 text-red-300 border-red-500/30">⚠ Renewal Cliff · 2025–26</HeroTag>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              Your renewal letter is <br/>
              <span className="text-blue-400">a starting bid.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              The rate your bank offered isn't the rate you have to take. You have <strong className="text-white">120 days before maturity</strong> to shop the entire market — no penalty, no credit hit. This is your one chance to reset the biggest bill you pay every month.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Rate-hold protection against rising rates</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Free switch on insured mortgages</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Blend-and-extend / refi options most brokers won&apos;t mention</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · No credit pull · Response in &lt; 2 hours</p>
            <p className="text-xs text-blue-300 mt-4">
              Want the <Link href="/renewal-rescue" className="underline font-bold">instant Renewal Rescue Report</Link> instead?
            </p>
          </div>

          <div id="lead-form" className="scroll-mt-24">
            <SituationForm
              situationLabel="Mortgage Renewal"
              serviceNeeded="Mortgage Renewal"
              sourceTag="situations/mortgage-renewal"
              goal="Renewal"
              pageSource="/situations/mortgage-renewal"
              submitLabel="Get My Renewal Options"
              successHeadline="Options on the way"
              successBody={<>A licensed IndiBrick advisor will email you today with the <strong>real</strong> rate options for your file — bank vs broker channel, blend-and-extend, and refi-at-renewal scenarios. Then a 15-min call to decide.</>}
              accent="blue"
              responseWindow="within 2 business hours"
              extraFields={[
                { name: 'currentLender', label: 'Current lender', type: 'text', placeholder: 'TD / RBC / MCAP / etc.', half: true },
                { name: 'renewalDate', label: 'Renewal month', type: 'text', placeholder: 'March 2027', half: true },
                { name: 'balance', label: 'Mortgage balance', type: 'currency', placeholder: '450000', half: true },
                { name: 'currentRate', label: 'Current rate %', type: 'number', placeholder: '2.14', min: 0, max: 15, step: 0.01, half: true, required: false },
                { name: 'bankOffer', label: 'Bank\'s renewal offer (if received)', type: 'number', placeholder: '5.79', min: 0, max: 15, step: 0.01, required: false, helpText: 'we\'ll beat it if we can' },
              ]}
            />
          </div>
        </div>
      </section>

      <TrustBarLive variant="light" scaleClaim={{ value: '$18M+', label: 'placed in 2025 at renewal' }} />

      <StatStrip stats={STATS} accentTextClass="text-blue-400" />

      {/* SOURCED CLAIMS */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4 text-center">Sources &amp; Methodology</p>
          <div className="space-y-3">
            <CiteBlock
              value="~60%"
              claim="of Canadian mortgages come up for renewal between 2025 and 2026."
              source="Bank of Canada, Financial Stability Report 2024"
              sourceUrl="https://www.bankofcanada.ca/2024/05/financial-stability-report-2024/"
              asOf="2024-05"
            />
            <CiteBlock
              value="120 days"
              claim="is the standard rate-hold window Canadian A-lenders offer before mortgage maturity, at no cost to the borrower."
              source="Financial Consumer Agency of Canada — Mortgage renewal guide"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages/renew-mortgage.html"
              asOf="2025-11"
            />
            <CiteBlock
              value="Free"
              claim="switching an insured mortgage at renewal typically incurs no penalty and legal costs are usually covered by the new lender."
              source="Financial Consumer Agency of Canada — Switching mortgage lender"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages/renew-mortgage.html"
              asOf="2025-11"
            />
          </div>
        </div>
      </section>

      {/* THE 5 MOVES */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Your 5 options at renewal</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Most people take the first one. Most shouldn't.</h2>
          </div>
          <div className="space-y-3">
            {RENEWAL_MOVES.map((m, i) => (
              <div key={m.move} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-xs font-black text-blue-600 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <p className="font-black text-slate-900 text-sm md:text-base">{m.move}</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pl-8 mb-2"><strong className="text-slate-800">When:</strong> {m.when}</p>
                <p className="text-sm text-blue-700 leading-relaxed pl-8"><strong>Signal:</strong> {m.signal}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">The Renewal Timeline</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Every day past T–120 costs you optionality</h2>
          </div>
          <div className="space-y-3">
            {RENEWAL_TIMELINE.map(t => (
              <div key={t.d} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3 md:gap-6 items-start">
                <p className="text-sm font-black uppercase tracking-widest text-blue-600 tabular-nums">{t.d}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{t.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RateMatchPromise accent="blue" />

      <BrokerCard pageSource="/situations/mortgage-renewal" accent="blue" />

      <FAQ
        accentTextClass="text-blue-600"
        items={[
          { q: 'What\'s the 120-day rate hold?', a: 'Most lenders will lock a rate for up to 120 days before your maturity date at no cost. If rates rise, you\'re protected. If rates drop, you take the lower one. This is your single most valuable free option in the mortgage lifecycle — and it disappears the day your renewal auto-executes.' },
          { q: 'Does switching to a new lender cost me anything?', a: 'On INSURED mortgages: essentially free — the new lender pays discharge + legal. On UNINSURED / conventional mortgages: typically $500–$1,000 in legal and appraisal, which is folded into the new mortgage or paid by the new lender in many cases. Compare that to $180–$340/mo savings and the math is not close.' },
          { q: 'What is blend-and-extend?', a: 'Your existing lender takes your current rate + a new higher rate, blends them into a weighted average, and re-extends your term. Zero penalty. Useful when you want to lock more term without breaking. Bank retention offers it grudgingly — usually only if you ask by name.' },
          { q: 'What if my mortgage is with a monoline (MCAP, First National, etc.)?', a: 'Same 120-day rule applies. Monolines are actually easier to shop against because their retention teams are less aggressive than the Big 6. If your monoline offers you a renewal above broker-channel best, switching is nearly always the right call.' },
          { q: 'I\'m self-employed / bruised credit — will I qualify for switching?', a: 'Switching a mortgage requires re-underwriting the file. If your income situation has weakened since origination, some A-lenders may decline the switch. That\'s where we route to alt-A or B-lender programs and still beat your bank\'s offer. If your file is severely bruised, we may recommend a straight renewal with your current lender and re-shopping next term.' },
          { q: 'Should I lock 3-year or 5-year at renewal?', a: 'Depends on where rates are and where they\'re going. In an inverted-yield environment (short-term rates > long-term), a 3-year fixed often beats the 5-year on both rate AND optionality. Your broker should walk you through the rate curve, not just quote the 5-year default.' },
        ]}
      />

      <RelatedSituations
        accentTextClass="text-blue-600"
        items={[
          { href: '/situations/refinance-debt-consolidation', title: 'Refinance at renewal', blurb: 'Renewal is the one time you can restructure fee-free — fold in high-interest debt or unlock equity for renos.' },
          { href: '/situations/declined-by-bank', title: 'Declined trying to switch?', blurb: 'If your bank\'s underwriting rejected a switch, alt-A and B-lender programs will still beat their offer.' },
          { href: '/situations/reverse-mortgage', title: 'Renewing at 55+?', blurb: 'A reverse mortgage can eliminate the renewal payment entirely — worth comparing side-by-side.' },
        ]}
      />

      <BottomCTA
        headline="Sign the wrong renewal, overpay for 5 years."
        body="Or spend 15 minutes with a broker and know exactly what you should be paying. Your renewal is a starting bid — negotiate it."
        buttonLabel="Get My Renewal Options"
        buttonHref="#lead-form"
        buttonClass="bg-blue-600 hover:bg-blue-500 shadow-blue-500/40"
        footerNote="FSRA-licensed · No credit pull · Response in < 2 hours"
      />
    </div>
  );
}
