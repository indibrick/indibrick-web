import React from 'react';
import { buildMetadata } from '../../../lib/buildMetadata';
import SituationForm from '../../../components/SituationForm';
import { StatStrip, FAQ, BottomCTA, HeroTag, RelatedSituations } from '../../../components/SituationChrome';

export const metadata = buildMetadata({
  title: 'Pre-Construction Closing — Ontario Mortgage Broker',
  description: 'Your pre-construction condo appraised for less than purchase price? Interim occupancy fees eating you alive? IndiBrick specializes in pre-con closing rescues across the GTA: shadow appraisals, bridge financing, deposit stacking, and B-lender workouts.',
  slug: '/situations/pre-construction-closing',
  keywords: [
    'pre-construction condo mortgage Ontario',
    'pre-con closing appraisal short',
    'shadow appraisal condo Toronto',
    'interim occupancy financing',
    'pre-construction bridge loan',
    'condo closing rescue broker',
    'Aura Lakeview Village mortgage',
  ],
});

const STATS = [
  { value: 'Most', label: 'GTA pre-con units bought 2020–22 appraise below original contract' },
  { value: '3', label: 'lender tiers we quote to close the appraisal gap' },
  { value: '30 days', label: 'typical closing turnaround from full doc submission' },
];

const CLOSING_TRAPS = [
  { t: 'The appraisal came in low', d: 'Your $1.2M contract price now appraises at $950k. The lender will only advance 80% of appraisal — not purchase price. You need to bridge $200k+ from somewhere or the deal collapses and you lose your deposit.' },
  { t: 'Interim occupancy fees are stacking', d: 'Occupancy fees are pure rent — no equity builds. Every month you delay closing = another $2,800–4,500 wasted. Move fast.' },
  { t: 'Your rate hold expired', d: 'Pre-construction contracts often close 2–3+ years after signing. Rate holds are typically 120 days. You\'re now shopping current rates, and they\'re higher than your original assumption.' },
  { t: 'Employment changed since deposit', d: 'Went self-employed since signing the APS? Changed jobs? Bank underwriting may reject the file that your original lender pre-approved. Alt-A or B-lender is often the only path.' },
  { t: 'Assignment fell through', d: 'Planned to assign the contract but couldn\'t find a buyer. You now have to close and hold. Financing plan needs to pivot to end-buyer mortgage + potentially a rental exit strategy.' },
  { t: 'Deposit stacking on multiple units', d: 'Bought 2+ pre-con units to close within months of each other. Multiple simultaneous mortgages require careful lender sequencing so you don\'t breach DTI on the second file.' },
];

const RESCUE_OPTIONS = [
  { name: 'Second mortgage / private bridge', when: 'Gap under $250k, credit strong, exit plan within 12 months (income improves or property appreciates)' },
  { name: 'B-lender extended amortization', when: 'A-lender declined for DTI. B-lender 30–35yr amort brings monthly under threshold. Rate 5.99–7.99%, no fee to you.' },
  { name: 'Family gifted equity injection', when: 'Parents can gift the gap. Requires signed gift letter + source-of-funds. A-lender accepts.' },
  { name: 'Assignment / re-sale', when: 'If bridge financing isn\'t viable, list the unit before final closing. Better to lose the deposit + assignment fee than to close into negative equity.' },
];

export default function PreConstructionClosingPage() {
  return (
    <div className="bg-white">
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <HeroTag className="bg-amber-500/15 text-amber-300 border-amber-500/30">🏗 Pre-Construction Closing · Ontario</HeroTag>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              Closing your pre-con? <br/>
              <span className="text-amber-400">Don&apos;t close blind.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              Most 2020–22 GTA pre-con units are now appraising below their original contract price (Urbanation, Realosophy, and internal broker-channel appraisal data throughout 2024–25). That means your bank won&apos;t lend on the full contract amount — and you have weeks, not months, to bridge the gap. We build closing plans that get you through: <strong className="text-white">shadow appraisals, B-lender workouts, bridge financing, or a documented walk-away.</strong>
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-amber-400 font-black mt-0.5">✓</span> Shadow appraisal to know the gap before your lender does</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 font-black mt-0.5">✓</span> Second mortgage / private bridge for short-term gap-close</li>
              <li className="flex items-start gap-2"><span className="text-amber-400 font-black mt-0.5">✓</span> B-lender option if A-lender declines the file</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · Closing consultations in &lt; 24 hours</p>
          </div>

          <div id="lead-form" className="scroll-mt-24">
            <SituationForm
              situationLabel="Pre-Construction Closing"
              serviceNeeded="Pre-Construction Closing"
              sourceTag="situations/pre-construction-closing"
              goal="Purchase"
              pageSource="/situations/pre-construction-closing"
              submitLabel="Get My Closing Plan"
              successHeadline="Closing plan on the way"
              successBody={<>A licensed IndiBrick advisor will call you within <strong>1 business day</strong> to walk through your closing timeline, appraisal risk, and financing options. Bring the APS + latest builder correspondence to the call.</>}
              accent="amber"
              responseWindow="within 1 business day"
              extraFields={[
                { name: 'projectName', label: 'Project / building name', type: 'text', placeholder: 'e.g. Aura at Lakeview Village, One Yonge, etc.' },
                { name: 'closingDate', label: 'Final closing date', type: 'text', placeholder: 'Nov 2026', half: true },
                { name: 'purchasePrice', label: 'Purchase price', type: 'currency', placeholder: '850000', half: true },
                { name: 'depositPaid', label: 'Deposit paid so far', type: 'currency', placeholder: '170000', step: 5000, half: true },
                { name: 'estValue', label: 'Est. current market value', type: 'currency', placeholder: '780000', helpText: 'best guess is fine', required: false, half: true },
                { name: 'occupancyStatus', label: 'Occupancy status', type: 'select', options: ['Pre-occupancy (not yet)', 'In interim occupancy', 'Not sure'], required: false },
                { name: 'employmentChange', label: 'Any employment change since signing?', type: 'select', options: ['No, same job', 'Yes, changed jobs (same field)', 'Yes, went self-employed', 'Yes, other'], required: false },
              ]}
            />
          </div>
        </div>
      </section>

      <StatStrip stats={STATS} accentTextClass="text-amber-400" />

      {/* THE 6 TRAPS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">6 Traps at Pre-Con Closing</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Every one of them is a wire-transfer deadline away</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {CLOSING_TRAPS.map(t => (
              <div key={t.t} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                <p className="font-black text-slate-900 text-sm mb-2">{t.t}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{t.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESCUE OPTIONS */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">4 Ways to Close the Gap</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Ordered from cheapest to last-resort</h2>
          </div>
          <div className="space-y-3">
            {RESCUE_OPTIONS.map((o, i) => (
              <div key={o.name} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-[40px_1fr] gap-3 md:gap-6 items-start">
                <p className="text-xl font-black text-amber-600 tabular-nums">{String(i + 1).padStart(2, '0')}</p>
                <div>
                  <p className="font-black text-slate-900 text-sm mb-1">{o.name}</p>
                  <p className="text-sm text-gray-600 leading-relaxed"><strong className="text-slate-800">Best when:</strong> {o.when}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ
        accentTextClass="text-amber-700"
        items={[
          { q: 'What is a shadow appraisal?', a: 'An independent appraisal you commission BEFORE your lender orders theirs. Cost: $500–$700. Purpose: know the number before it becomes a crisis. If it comes in low, you have weeks (not days) to build a bridge plan. If it comes in at price, you close normally with the lender\'s appraisal as a formality.' },
          { q: 'The builder is charging me extended occupancy fees. Are they legal?', a: 'Yes, per your APS. But there\'s often room to negotiate — especially if delays are on the builder\'s side. We\'ve seen brokers negotiate 30–60 days of occupancy fees down or waived, particularly for buyers who commit to closing on the builder\'s revised timeline. Ask, don\'t assume.' },
          { q: 'Can I still get an insured mortgage on a pre-con condo?', a: 'Yes if under $1.5M purchase price and less than 20% down. CMHC / Sagen / Canada Guaranty all insure pre-con. The appraisal must still support the value at insured LTV — which is the appraisal-gap problem for post-2020 files.' },
          { q: 'My original lender pre-approved me 2 years ago. Are they still on the hook?', a: 'Almost never. Pre-approvals expire (usually 90–120 days). Rate holds expire. Employment/income changes require re-underwriting. Treat the pre-con closing as a fresh file — because to the lender, it is.' },
          { q: 'Can I walk away and just lose my deposit?', a: 'Legally messy. Your APS obligates you to close. Builders can and do sue for the difference between contract price and eventual re-sale price PLUS carrying costs. Walking away costs more than the deposit in almost every case — get a real-estate lawyer\'s opinion before you assume this is an option.' },
          { q: 'Do you help with commercial pre-con (retail / mixed-use)?', a: 'Yes, but the lender universe is different. Commercial pre-con financing runs through credit unions and select monolines — email us the APS and we\'ll route.' },
        ]}
      />

      <RelatedSituations
        accentTextClass="text-amber-700"
        items={[
          { href: '/situations/declined-by-bank', title: 'Bank declined the closing?', blurb: 'A rejection at final closing routes to alt-A / B-lender with extended amortization — same 30-day timeline.' },
          { href: '/situations/investment-property', title: 'Closing to hold as rental?', blurb: 'If your assignment fell through, we can structure the file as an investor mortgage with rental offset.' },
          { href: '/situations/refinance-debt-consolidation', title: 'Refi after closing', blurb: 'Once the unit stabilizes, refi to pull out the equity you had to bridge in — plan the exit before you close.' },
        ]}
      />

      <BottomCTA
        headline="A missed closing costs more than the deposit."
        body="Get a real closing plan before the wire deadline. Twenty-four hours from now you'll know exactly what you're working with."
        buttonLabel="Get My Closing Plan"
        buttonHref="#lead-form"
        buttonClass="bg-amber-600 hover:bg-amber-500 shadow-amber-500/40"
        footerNote="FSRA-licensed · Response in < 24 hours"
      />
    </div>
  );
}
