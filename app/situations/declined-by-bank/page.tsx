import React from 'react';
import { buildMetadata } from '../../../lib/buildMetadata';
import SituationForm from '../../../components/SituationForm';
import { StatStrip, FAQ, BottomCTA, HeroTag, RelatedSituations } from '../../../components/SituationChrome';

export const metadata = buildMetadata({
  title: 'Declined by the Bank? Your Mortgage Isn\'t Dead',
  description: 'Getting rejected by your bank doesn\'t mean you don\'t qualify — it means you don\'t qualify at THAT bank. IndiBrick quotes 45+ A, B, and private lenders. Send us the decline letter, get a real answer in 24 hours.',
  slug: '/situations/declined-by-bank',
  keywords: [
    'mortgage rejection Ontario',
    'declined by bank mortgage broker',
    'B lender mortgage Ontario',
    'private mortgage Ontario',
    'bruised credit mortgage',
    'self-employed mortgage rejection',
    'alt-A lender Canada',
    'mortgage after decline',
  ],
});

const STATS = [
  { value: '45+', label: 'A, B, and private lenders quoted per file' },
  { value: '68%', label: 'of bank-declined files we place with an alt-A or B lender' },
  { value: '24hr', label: 'to a real answer — send the decline letter' },
];

const REJECTION_REASONS = [
  { reason: 'Self-employed / BFS income', why: 'Your bank uses net income after write-offs. B-lenders and alt-A lenders use bank statements or stated income — same person, different underwriting.' },
  { reason: 'Bruised credit (below 660)', why: 'A 620 file that\'s cash-flow strong closes at 45+ B-lender programs we quote. Your bank\'s branch doesn\'t know they exist because they can\'t sell them.' },
  { reason: 'New to Canada / no credit history', why: 'Every Big 6 has a newcomer program with internal exceptions, plus 3 B-lenders specialize in ITIN-only or 6-month-in-country files. Most branch reps don\'t escalate.' },
  { reason: 'GDS/TDS ratios over 44%', why: 'A-lender stress-test caps you at ~44% TDS. B-lenders regularly approve at 50%+ with compensating factors — 20%+ down, cash reserves, or a co-signer.' },
  { reason: 'Non-traditional property (rural, small, mixed-use)', why: 'A-lender appraisals refuse marketable-title issues. Private lenders and select credit unions actively lend on these files.' },
  { reason: 'Contract or gig income under 2 years', why: 'Bank policy demands 2-year tenure. B-lenders will work with 12 months + bank statement flow. Alt-A programs will work with T4A + contract terms.' },
];

const LENDER_TIERS = [
  { tier: 'A-Lenders', rate: '4.29% – 5.29%', criteria: 'T4 income, 660+ credit, GDS/TDS in range. What your bank denied you for.', color: 'bg-blue-50 border-blue-100 text-blue-700' },
  { tier: 'Alt-A / B-Lenders', rate: '5.99% – 7.99%', criteria: 'Self-employed, bruised credit (580+), extended amortization, higher TDS. Fees ~1%.', color: 'bg-amber-50 border-amber-100 text-amber-700' },
  { tier: 'MICs / Private', rate: '8.99% – 12.99%', criteria: 'Equity-based. 65% LTV cap. Short-term (1–2 yr) bridge while you fix the file for A-lender return.', color: 'bg-red-50 border-red-100 text-red-700' },
];

export default function DeclinedByBankPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <HeroTag className="bg-red-600/20 text-red-300 border-red-500/30">🛡 Alt-Lending Specialists · Ontario</HeroTag>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              Declined by the bank? <br/>
              <span className="text-emerald-400">Your file isn't dead.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              A rejection at your branch isn't a rejection at <strong className="text-white">45+ other lenders</strong>. We work all three lender tiers — A, B, and private — and we don't get paid unless your deal funds. Send us the decline letter and we'll tell you in <strong className="text-white">24 hours</strong> whether your file is dead or just misplaced.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Self-employed, new to Canada, bruised credit — all fixable</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> B-lender bridge with an exit plan back to A-lender pricing</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> No fee to you on A-lender or most B-lender business</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · Response in &lt; 24 hours</p>
          </div>

          <div id="lead-form" className="scroll-mt-24">
            <SituationForm
              situationLabel="Declined by Bank"
              serviceNeeded="Mortgage — Bank Decline Review"
              sourceTag="situations/declined-by-bank"
              goal="Other"
              pageSource="/situations/declined-by-bank"
              submitLabel="Review My Declined File"
              successHeadline="File under review"
              successBody={<>A licensed IndiBrick advisor will call you within <strong>1 business day</strong> with a plan — A-lender salvage, B-lender bridge, or private, based on your file. We&apos;ll ask you to email the decline letter (or a screenshot) when we connect.</>}
              accent="red"
              responseWindow="within 1 business day"
              collapseOptional
              extraFields={[
                // Essential — always shown. Broker needs at least these to
                // decide A vs B vs private lender pool routing.
                { name: 'bankDeclined', label: 'Which bank declined you?', type: 'text', placeholder: 'RBC / TD / Scotia / etc.', half: true },
                { name: 'purpose', label: 'What was it for?', type: 'select', options: ['Purchase', 'Refinance / Equity Take-out', 'Renewal / Switch', 'Second mortgage / HELOC', 'Not sure'], half: true },
                { name: 'employmentType', label: 'Employment', type: 'select', options: ['T4 Full-time', 'Self-employed (BFS)', 'Commission', 'Contract', 'New to Canada', 'Retired', 'Other'] },
                // Optional — collapsed by default. Faster routing if provided,
                // but broker will ask on the callback if left blank.
                { name: 'creditRange', label: 'Credit score range', type: 'select', options: ['Excellent (720+)', 'Good (680–719)', 'Fair (620–679)', 'Bruised (below 620)', 'Not sure'], half: true, required: false },
                { name: 'declineDate', label: 'When did they decline?', type: 'text', placeholder: 'Last week / 2 months ago', half: true, required: false },
                { name: 'reason', label: 'What reason did they give?', type: 'select', options: ['Credit too low', 'Income not enough', 'Self-employed / write-offs', 'Too much debt / TDS high', 'Property issue', 'New to Canada / no history', 'They didn\'t say', 'Other'], required: false },
                { name: 'additionalContext', label: 'Anything else we should know?', type: 'textarea', required: false, placeholder: 'The more context, the faster we route your file to the right lender.' },
              ]}
            />
          </div>
        </div>
      </section>

      <StatStrip stats={STATS} accentTextClass="text-emerald-400" />

      {/* THE REAL REASONS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">The 6 real reasons banks say no</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Every one of them is fixable somewhere else</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {REJECTION_REASONS.map(r => (
              <div key={r.reason} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                <p className="font-black text-slate-900 text-sm mb-2">{r.reason}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{r.why}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-10 max-w-2xl mx-auto">Your bank branch is one lender with one credit policy. We quote three tiers across 45+ lenders — the file that got declined at the branch usually fits somewhere in that stack.</p>
        </div>
      </section>

      {/* LENDER TIER TABLE */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">The Three Lender Tiers</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Where your file actually lives</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {LENDER_TIERS.map(t => (
              <div key={t.tier} className={`rounded-3xl p-6 border ${t.color}`}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2">{t.tier}</p>
                <p className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 tabular-nums mb-2">{t.rate}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{t.criteria}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto">Illustrative ranges. Actual pricing depends on file. We start at the cheapest tier your file supports and only move down if we have to — with a documented exit plan back up.</p>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">How the review works</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">No fee to open the file</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', t: 'Send the decline letter', d: 'Email or paste it into the form. We read what the bank\'s actual internal reason was — not what the branch rep told you.' },
              { n: '02', t: 'We build a lender-tier plan', d: 'Within 24 hours: which A-lenders will approve as-is, which B-lender rescues, and if private is needed, exit strategy back to A pricing.' },
              { n: '03', t: 'You approve, we submit', d: 'No credit pull until you say go. If we place at A-lender or most B-lenders, you pay $0 broker fee — the lender pays us.' },
            ].map(s => (
              <div key={s.n} className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
                <p className="text-4xl font-black text-red-600 tracking-tighter mb-2">{s.n}</p>
                <h3 className="font-black uppercase tracking-tight text-slate-900 text-sm mb-2">{s.t}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ
        accentTextClass="text-red-600"
        items={[
          { q: 'Do I have to pay a fee?', a: 'A-lender business: no fee to you, ever. Most B-lenders: no fee to you, they pay us a finder\'s fee (built into the rate). Private lenders: a broker fee is disclosed upfront in writing before you commit — you approve it or we don\'t proceed.' },
          { q: 'Will you pull my credit?', a: 'Not until you explicitly consent. The initial review runs off the decline letter + a self-reported credit score range from you. Only when you\'ve seen the plan and want to formally apply do we run credit — and we pool that pull across every lender we submit to, so it counts as one hit, not several.' },
          { q: 'How long does a B-lender approval take?', a: 'Typical timeline: 3–7 business days from full application to lender commitment. Faster than most people think — the delay in bank-declined files is usually finding the right lender, not the approval itself.' },
          { q: 'What\'s the catch with private lenders?', a: 'Higher rate (8.99%–12.99%), lender fees (0.5%–2%), broker fee, and shorter term (1–2 years). It\'s a bridge, not a destination. We only recommend private when there\'s a documented exit — usually cleaning up credit or seasoning self-employed income to qualify A-lender at renewal.' },
          { q: 'Can I appeal my bank\'s decision?', a: 'You can escalate to their internal underwriter, but bank branches almost never overturn a system decline — they don\'t have the authority. What actually works is applying at a lender whose credit policy matches your file. That\'s what we do.' },
          { q: 'Do you help with second mortgages / equity take-out?', a: 'Yes. A HELOC or second mortgage is often faster than a full refi when you just need equity access. If you\'re self-employed or bruised credit, alt-A and private routes are usually the play.' },
          { q: 'What if my file really can\'t be placed?', a: 'It happens. In that case we\'ll tell you plainly, explain what needs to change (credit rebuild, income seasoning, higher down payment), and give you a target date to reapply. We\'d rather not close a deal than sell you into a private mortgage you can\'t exit from.' },
        ]}
      />

      <RelatedSituations
        accentTextClass="text-red-600"
        items={[
          { href: '/situations/refinance-debt-consolidation', title: 'Refinance / debt consolidation', blurb: 'If the decline was on a HELOC or equity take-out, the refi path may route through a different lender pool.' },
          { href: '/situations/new-to-canada', title: 'New to Canada', blurb: 'If the decline reason was "no Canadian credit history," foreign-credit-friendly lenders exist.' },
          { href: '/situations/mortgage-renewal', title: 'Mortgage renewal', blurb: 'If you were declined trying to switch at renewal, we can route the file to a lender that will approve.' },
        ]}
      />

      <BottomCTA
        headline="Your bank isn't every lender."
        body="Send us the decline letter today. Twenty-four hours from now you'll know whether your file is dead or just misplaced — with a plan you can act on."
        buttonLabel="Review My Declined File"
        buttonHref="#lead-form"
        buttonClass="bg-red-600 hover:bg-red-500 shadow-red-500/40"
        footerNote="FSRA-licensed · No fee for the review · Response in < 24 hours"
      />
    </div>
  );
}
