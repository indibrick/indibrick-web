import React from 'react';
import { buildMetadata } from '../../../lib/buildMetadata';
import SituationForm from '../../../components/SituationForm';
import { StatStrip, FAQ, BottomCTA, HeroTag, RelatedSituations } from '../../../components/SituationChrome';

export const metadata = buildMetadata({
  title: 'Investment Property Mortgage — Ontario Broker for Rentals & BRRRR',
  description: 'Financing 1–4 unit rentals, BRRRR strategies, or second/third investment properties. 20% down, DCR-friendly lenders, portfolio limits explained. Free file review by a FSRA-licensed broker.',
  slug: '/situations/investment-property',
  keywords: [
    'investment property mortgage Ontario',
    'rental property financing Canada',
    'BRRRR mortgage Toronto',
    'DCR debt coverage rental mortgage',
    'second investment property Ontario',
    'commercial 5+ unit mortgage broker',
  ],
});

const STATS = [
  { value: '20%', label: 'min down payment on 1–4 unit rentals' },
  { value: '50%', label: 'of gross rent typically counted toward income by A-lenders' },
  { value: '4+', label: 'unit buildings shift to commercial financing (different lender pool)' },
];

const INVESTOR_SCENARIOS = [
  { t: 'First rental property (owner-occupied → new rental)', d: 'You\'re buying a second home and keeping the first as a rental. A-lender path: 20% down on the new principal, existing home refinanced as rental. Rental income offset typically 50% of gross rents.' },
  { t: 'Pure investment purchase (never lived in)', d: '20% down minimum. Some lenders require 25% down. Rate premium of 25–50 bps over owner-occupied pricing. Purpose-declared as investment on the application.' },
  { t: 'BRRRR (Buy, Renovate, Rent, Refinance, Repeat)', d: 'Short-term acquisition financing (private / HELOC) → renovation → 6-month seasoning → refinance at improved appraised value up to 80% LTV. Broker helps sequence the lender at each step.' },
  { t: 'Portfolio purchase (3rd–5th property)', d: 'Most A-lenders cap at 4–5 doors per borrower. Beyond that: alt-A + credit unions with portfolio programs. DCR (debt coverage ratio) becomes the governing metric, not TDS.' },
  { t: 'Multi-family 2–4 unit (residential zoning)', d: 'Still residential mortgage territory. Rental offset improves (75%+ of gross rents at some lenders). Larger down usually required (25–30%). Excellent cash-flow property class.' },
  { t: 'Multi-family 5+ units (commercial)', d: 'Different lender pool: credit unions, commercial monolines, CMHC-insured multifamily. Underwriting is on the PROPERTY\'s income (DCR 1.20+ typical), not personal income. We refer to a commercial specialist on files this size.' },
];

const CASHFLOW_MATH = {
  rent: 2800,
  costs: {
    mortgage: 1720,
    tax: 340,
    insurance: 90,
    maintenance: 140,
    vacancy: 140,
    mgmt: 224,
  },
};
const totalCost = Object.values(CASHFLOW_MATH.costs).reduce((s, v) => s + v, 0);
const cashflow = CASHFLOW_MATH.rent - totalCost;

export default function InvestmentPropertyPage() {
  return (
    <div className="bg-white">
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/25 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <HeroTag className="bg-purple-500/15 text-purple-300 border-purple-500/30">🏢 Investment Property · Ontario</HeroTag>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              Rental property? <br/>
              <span className="text-purple-400">Financing is the moat.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              A great rental property with the wrong mortgage bleeds cash. The right lender, rental offset, and amortization structure can turn a break-even file into $400/mo positive. We route 1–4 unit rentals, BRRRR strategies, and 5+ unit commercial deals across A-lenders, credit unions, and alt-A programs.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-purple-400 font-black mt-0.5">✓</span> Rental offset structuring — 50% vs 75% vs 100% of gross rents</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 font-black mt-0.5">✓</span> Portfolio limits + DCR-based lenders when banks cap out</li>
              <li className="flex items-start gap-2"><span className="text-purple-400 font-black mt-0.5">✓</span> BRRRR refi timing so you don&apos;t leave equity trapped</li>
            </ul>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 text-xs text-gray-300">
              <strong className="text-white">New to rental investing?</strong> You don&apos;t need to know DCR yet. Book the call — we walk you through the math on your first file.
            </div>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · Response in &lt; 24 hours</p>
          </div>

          <div id="lead-form" className="scroll-mt-24">
            <SituationForm
              situationLabel="Investment Property"
              serviceNeeded="Investment Property Mortgage"
              sourceTag="situations/investment-property"
              goal="Purchase"
              pageSource="/situations/investment-property"
              submitLabel="Get My Investor File Review"
              successHeadline="Review on the way"
              successBody={<>A licensed IndiBrick advisor will call you within <strong>1 business day</strong> to walk through your target property, expected rents, and lender fit. Bring rent estimates + purchase price to the call.</>}
              accent="purple"
              responseWindow="within 1 business day"
              extraFields={[
                { name: 'stage', label: 'Where are you?', type: 'select', options: ['Researching, no property yet', 'Under contract / just made offer', 'Own 1 rental, adding another', 'Portfolio (3+ properties)', 'BRRRR — need short-term + refi'] },
                { name: 'propertyType', label: 'Property type', type: 'select', options: ['Single-family / detached', 'Semi / row / townhouse', 'Condo (rentable)', '2-unit (duplex)', '3–4 unit', '5+ unit (commercial)'], half: true },
                { name: 'city', label: 'City / region', type: 'text', placeholder: 'Toronto / Hamilton / etc.', half: true },
                { name: 'purchasePrice', label: 'Purchase price', type: 'currency', placeholder: '750000', half: true },
                { name: 'downPayment', label: 'Down payment available', type: 'currency', placeholder: '150000', half: true },
                { name: 'monthlyRent', label: 'Expected monthly rent', type: 'currency', placeholder: '2800', step: 100, half: true },
                { name: 'ownedProperties', label: '# of properties you already own', type: 'select', options: ['0 (this is first)', '1', '2', '3', '4', '5+'], half: true },
                { name: 'employmentType', label: 'Employment', type: 'select', options: ['T4 full-time', 'Self-employed', 'Retired / passive income', 'Other'], required: false },
              ]}
            />
          </div>
        </div>
      </section>

      <StatStrip stats={STATS} accentTextClass="text-purple-400" />

      {/* CASHFLOW MATH VISUAL */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2">The Cash-Flow Math</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">$650k rental, $130k down, 4.29% fixed 30yr amort</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-2 bg-slate-900 text-white">
              <div className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Line item</div>
              <div className="p-4 text-[10px] font-black uppercase tracking-widest text-purple-400 text-right">Monthly</div>
            </div>
            <div className="grid grid-cols-2 p-4 border-t border-gray-100 bg-emerald-50">
              <div className="font-black text-slate-900 text-sm">Gross rent</div>
              <div className="text-right font-black text-emerald-700 text-lg tabular-nums">+${CASHFLOW_MATH.rent.toLocaleString()}</div>
            </div>
            {Object.entries(CASHFLOW_MATH.costs).map(([k, v]) => (
              <div key={k} className="grid grid-cols-2 p-4 border-t border-gray-100">
                <div className="text-slate-700 text-sm capitalize">{k === 'mgmt' ? 'Property mgmt (8%)' : k === 'vacancy' ? 'Vacancy allowance (5%)' : k === 'maintenance' ? 'Maintenance (5%)' : k}</div>
                <div className="text-right font-bold text-slate-700 tabular-nums">–${v.toLocaleString()}</div>
              </div>
            ))}
            <div className={`grid grid-cols-2 p-5 border-t-2 ${cashflow >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="font-black text-slate-900 text-sm">Monthly cash flow</div>
              <div className={`text-right font-black text-2xl tabular-nums ${cashflow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{cashflow >= 0 ? '+' : ''}${cashflow.toLocaleString()}</div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4 max-w-2xl mx-auto">Illustrative. Your actual cash-flow depends on rate, rent, and cost structure. What we do: model 3–5 lender scenarios so you know which lender + amortization combo maximizes cash-flow on YOUR file.</p>
        </div>
      </section>

      {/* SCENARIOS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2">Where are you in the investor lifecycle?</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">The lender + product changes at each stage</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {INVESTOR_SCENARIOS.map(s => (
              <div key={s.t} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                <p className="font-black text-slate-900 text-sm mb-2">{s.t}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ
        accentTextClass="text-purple-600"
        items={[
          { q: 'How much down do I need for a rental?', a: 'Minimum 20% on 1-unit rentals. 25% typical on 2–4 unit. 25–30% on commercial (5+). CMHC insurance IS available for 2–4 unit owner-occupied with rental income (5% down min on 1-unit owner-occ, higher on 2–4), but pure investment property is always 20%+.' },
          { q: 'How is rental income counted toward my qualification?', a: 'Depends on the lender. Standard A-lender: 50% of gross rents added to income. More generous A-lenders: 75%. B-lenders with rental programs: up to 100%. On existing rentals, most lenders will use 2 years of T1 general schedules to average the actual net rental income — which can be HIGHER or lower than the 50% add-back depending on your property.' },
          { q: 'What\'s the cap on properties before A-lenders stop lending?', a: 'Most A-lenders: 4–5 doors (mortgages) per borrower. After that: portfolio lenders (Equitable, Home Capital, credit unions) that use DCR (debt coverage ratio) — the property\'s income covers its own debt at 1.10–1.20x. Personal income becomes less relevant, property fundamentals more so.' },
          { q: 'Can I use projected rent for a property I haven\'t bought yet?', a: 'Yes — a "market rent letter" from an appraiser or property manager is standard. Lenders discount projected rent more aggressively than existing rent (often to 40% add-back), so real leases beat projections when possible.' },
          { q: 'BRRRR — how does the refi timing work?', a: 'Standard cycle: (1) short-term acquisition financing — private, HELOC, or cash. (2) 4–8 weeks renovation. (3) 6-month seasoning at the improved value (lenders won\'t refi at post-reno value without seasoning). (4) Refinance at up to 80% LTV of appraised value with an A-lender. Getting the sequence wrong leaves equity trapped in the deal. That\'s where broker experience matters.' },
          { q: 'What about STR / Airbnb income?', a: 'A-lenders won\'t use STR income. B-lenders will use documented STR bookings averaged over 12 months, discounted 50%. If STR is your model, plan the file with an alt-A or B-lender from day one — or hold as long-term rental for lender purposes and convert after close.' },
          { q: 'Do you help with commercial 5+ unit?', a: 'Yes but we refer to a commercial specialist for the actual placement. We stay involved to coordinate the personal side (existing residential mortgages, personal DTI) and to run the numbers before you make an offer.' },
        ]}
      />

      <RelatedSituations
        accentTextClass="text-purple-600"
        items={[
          { href: '/situations/refinance-debt-consolidation', title: 'BRRRR refinance', blurb: 'The step-4 refi in the BRRRR cycle — 6-month seasoning, 80% LTV, sequenced across A-lenders.' },
          { href: '/situations/pre-construction-closing', title: 'Closing an investor pre-con', blurb: 'Different lender stack for investor pre-con closings — appraisal gap plans + rental income structuring.' },
          { href: '/situations/declined-by-bank', title: 'Portfolio limit hit?', blurb: 'A-lenders cap at 4–5 doors. Portfolio programs and DCR-based credit unions kick in beyond that.' },
        ]}
      />

      <BottomCTA
        headline="Financing is the moat."
        body="Wrong lender = negative cash flow. Right lender = a real portfolio. Get your file reviewed before you make an offer."
        buttonLabel="Get My Investor File Review"
        buttonHref="#lead-form"
        buttonClass="bg-purple-600 hover:bg-purple-500 shadow-purple-500/40"
        footerNote="FSRA-licensed · Response in < 24 hours"
      />
    </div>
  );
}
