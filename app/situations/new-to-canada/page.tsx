import React from 'react';
import Link from 'next/link';
import { buildMetadata } from '../../../lib/buildMetadata';
import SituationForm from '../../../components/SituationForm';
import { StatStrip, FAQ, BottomCTA, HeroTag, RelatedSituations } from '../../../components/SituationChrome';
import CiteBlock from '../../../components/CiteBlock';
import TrustBar from '../../../components/TrustBar';
import BrokerCard from '../../../components/BrokerCard';

export const metadata = buildMetadata({
  title: 'New to Canada Mortgage — Ontario Broker for Newcomers',
  description: 'Bought a home in Ontario within 5 years of arriving in Canada? You qualify for the Newcomer Mortgage Program — sometimes with no Canadian credit history. IndiBrick routes you across every Big 6 newcomer program + B-lender ITIN options.',
  slug: '/situations/new-to-canada',
  keywords: [
    'new to Canada mortgage Ontario',
    'newcomer mortgage program Canada',
    'ITIN mortgage Ontario',
    'no Canadian credit mortgage',
    'PR permanent resident mortgage',
    'work permit mortgage broker Toronto',
  ],
});

const STATS = [
  { value: '5 years', label: 'window to use Newcomer Mortgage Programs' },
  { value: '5%–35%', label: 'down payment range depending on visa status + credit' },
  { value: '6', label: 'Big 6 banks with dedicated newcomer programs — each with different underwriting' },
];

const VISA_MATRIX = [
  { status: 'Permanent Resident (PR)', pathway: 'Full Newcomer Program access across all Big 6. 5% down on first $500k. Requires foreign credit report (Equifax International/Nova Credit) OR 12 months rental history. Best-case: A-lender pricing within 3 months of landing.' },
  { status: 'Work permit (2+ years remaining)', pathway: 'Newcomer programs at select A-lenders. 10–20% down typical. Requires local employer letter + pay stubs. Non-resident premium may apply.' },
  { status: 'Work permit (under 2 years)', pathway: 'Very limited A-lender options. Most files route to B-lender or newcomer-specialist lenders (Home Trust, Equitable). 20–25% down. Rate premium 100–200 bps.\n\nCommon file for our broker channel — most either close at B-lender within 30 days, or hold and refinance to A-lender pricing within 6 months of PR grant. Bringing 30–35% down opens A-lender programs immediately.' },
  { status: 'Study permit', pathway: 'Limited to a handful of lenders with international student programs. 35% down is standard. Parent co-signer or PR parent guarantor unlocks better pricing.' },
  { status: 'Refugee / protected person', pathway: 'Standard Canadian mortgage rules apply once you have SIN + employment. Newcomer programs may or may not extend depending on lender — case by case.' },
  { status: 'Non-resident buyer (no visa)', pathway: 'Foreign Buyer Ban (extended through 2027) prohibits most residential purchases. Very narrow exemptions. Ask before you sign an APS.' },
];

const NEWCOMER_LEVERS = [
  { name: 'Foreign credit history acceptance', d: 'Some lenders (Scotia, RBC, Equifax International, Nova Credit) will pull your credit from India, Philippines, UK, US, etc. and use it in Canadian underwriting. Turns a "no credit" file into an "excellent credit" file overnight.' },
  { name: '12 months rental history in lieu of credit', d: 'If you have 12+ months paying rent to a professional landlord in Canada, most lenders accept this as credit proxy. Documented rent payments + bank statements = credit substitute.' },
  { name: 'ITIN mortgages (Individual Tax Number)', d: 'Two B-lenders (Home Trust + one private) will lend on ITIN alone, no SIN. Rate premium ~200 bps. Useful bridge until PR-based SIN is available.' },
  { name: 'Higher down payment for better pricing', d: '35%+ down unlocks A-lender pricing at lenders who would otherwise reject on credit or work permit tenure. If you have the cash abroad, moving it to Canada BEFORE applying dramatically opens options.' },
];

export default function NewToCanadaPage() {
  return (
    <div className="bg-white">
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/25 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <HeroTag className="bg-red-500/15 text-red-300 border-red-500/30">🍁 New to Canada · Ontario</HeroTag>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              New to Canada? <br/>
              <span className="text-red-400">You qualify for more than banks tell you.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              Every Big 6 has a Newcomer Mortgage Program — but each has different underwriting, and most branch reps only know their own. Your foreign credit history, rental record, and visa status all move you between lender tiers. We route your file across the ones that actually fit.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Foreign credit history accepted at select lenders</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> ITIN-only lending path via B-lenders</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Full multilingual support in Hindi, Punjabi, Urdu, Mandarin</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · Response in &lt; 2 hours</p>
          </div>

          <div id="lead-form" className="scroll-mt-24">
            <SituationForm
              situationLabel="New to Canada"
              serviceNeeded="Newcomer Mortgage"
              sourceTag="situations/new-to-canada"
              goal="Purchase"
              pageSource="/situations/new-to-canada"
              submitLabel="Get My Newcomer Options"
              successHeadline="Options on the way"
              successBody={<>A licensed IndiBrick advisor will call you within <strong>2 business hours</strong> to walk through visa-status-specific lender fit, down payment strategy, and credit-history bridging. Bring visa/PR documents and 3 months of bank statements to the call.</>}
              accent="red"
              responseWindow="within 2 business hours"
              extraFields={[
                { name: 'visaStatus', label: 'Visa / status', type: 'select', options: ['Permanent Resident (PR)', 'PR — applied, waiting', 'Work permit (2+ yr remaining)', 'Work permit (under 2 yr)', 'Study permit', 'Refugee / protected person', 'Other'] },
                { name: 'monthsInCanada', label: 'Months in Canada', type: 'select', options: ['Under 6', '6–12', '12–24', '24–36', '3–5 years'], half: true },
                { name: 'city', label: 'Buying in (city)', type: 'text', placeholder: 'Toronto / Brampton / etc.', half: true },
                { name: 'income', label: 'Household income (annual, CAD)', type: 'currency', placeholder: '95000', half: true },
                { name: 'savingsForDown', label: 'Down payment saved (CAD)', type: 'currency', placeholder: '70000', step: 5000, half: true },
                { name: 'creditHistory', label: 'Credit history', type: 'select', options: ['Canadian credit — 6+ months', 'Canadian credit — under 6 months', 'Foreign credit history (India / US / UK / etc.)', 'No credit anywhere yet'], half: true },
                { name: 'preferredLanguage', label: 'Preferred call language', type: 'select', options: ['English', 'Hindi', 'Punjabi', 'Urdu', 'Mandarin', 'Other'], required: false, half: true },
              ]}
            />
          </div>
        </div>
      </section>

      <TrustBar variant="light" scaleClaim={{ value: '45+', label: 'newcomer-friendly lender panel' }} />

      <StatStrip stats={STATS} accentTextClass="text-red-400" />

      {/* SOURCED CLAIMS */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-4 text-center">Sources &amp; Methodology</p>
          <div className="space-y-3">
            <CiteBlock
              value="Newcomer programs"
              claim="every Big 6 Canadian bank offers a dedicated newcomer mortgage program with modified credit and income underwriting for permanent residents and select work-permit holders."
              source="Financial Consumer Agency of Canada — Mortgages for newcomers"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages.html"
              asOf="2025-11"
            />
            <CiteBlock
              value="Prohibition Act"
              claim="the federal Prohibition on the Purchase of Residential Property by Non-Canadians Act — the specific legislation governing which visa classes can and cannot buy Canadian residential property (extended through January 1, 2027)."
              source="Canada Mortgage and Housing Corporation (CMHC) — Prohibition on Non-Canadians"
              sourceUrl="https://www.cmhc-schl.gc.ca/en/professionals/industry-innovation-and-leadership/industry-expertise/affordable-housing/prohibition-purchase-residential-property-non-canadians-act"
              asOf="2025-11"
            />
            <CiteBlock
              value="5% – 35% down"
              claim="the actual range of down payment requirements across newcomer programs — 5% for PR-status buyers with foreign credit history acceptance, up to 35% for study permit holders."
              source="Individual lender newcomer mortgage disclosure pages (RBC, Scotia, BMO, TD, CIBC, National Bank)"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages.html"
              asOf="2025-11"
            />
          </div>
        </div>
      </section>

      {/* VISA MATRIX */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Visa Status × Lender Pathway</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Your status determines your lender pool</h2>
          </div>
          <div className="space-y-3">
            {VISA_MATRIX.map(v => (
              <div key={v.status} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 md:gap-6 items-start">
                <p className="font-black text-slate-900 text-sm">{v.status}</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{v.pathway}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWCOMER LEVERS */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">4 Levers Most Branch Reps Miss</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Any one of these can move your file up a tier</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {NEWCOMER_LEVERS.map(l => (
              <div key={l.name} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
                <p className="font-black text-slate-900 text-sm mb-2">{l.name}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{l.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CITY LINKS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">City-Specific Newcomer Broker Coverage</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Where are you buying?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['toronto', 'brampton', 'mississauga', 'markham', 'scarborough', 'vaughan', 'oakville', 'hamilton', 'ottawa', 'ajax', 'richmond-hill', 'waterloo'].map(city => (
              <Link key={city} href={`/mortgage-broker/${city}`}
                className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 hover:border-red-500 hover:bg-red-50 transition text-sm font-bold text-slate-700 hover:text-red-700 capitalize">
                {city.replace(/-/g, ' ')} →
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BrokerCard pageSource="/situations/new-to-canada" accent="red" />

      <FAQ
        accentTextClass="text-red-600"
        items={[
          { q: 'How soon after landing in Canada can I get a mortgage?', a: 'Legally: immediately. Practically: most lenders want to see 3–6 months of Canadian employment + a Canadian bank account with visible pay deposits. If you\'re PR and landed with cash + a job offer, some lenders will fund within 30 days of your first pay deposit. Work permit files usually need 6+ months.' },
          { q: 'What if I have no Canadian credit history at all?', a: 'Three paths: (1) Foreign credit pull via Equifax International or Nova Credit — works for India, US, UK, Mexico, Australia. (2) 12 months rental history from a professional landlord in Canada. (3) ITIN-only lending at two B-lenders — higher rate, but funds while you build local credit.' },
          { q: 'Am I subject to the Foreign Buyer Ban?', a: 'The federal Foreign Buyer Ban (extended through Jan 2027) prohibits non-Canadian buyers from purchasing residential property in Canada. Exemptions: PR, temporary residents on work permits with 5+ months remaining meeting specific criteria, refugee claimants, international students meeting specific criteria. If your status is unclear, ASK before signing an APS — the penalties are severe.' },
          { q: 'Do I need to be a Canadian citizen to get a mortgage?', a: 'No. PR and various work/study permit holders can get residential mortgages. Non-residents (no Canadian visa) largely cannot under the current Foreign Buyer Ban rules.' },
          { q: 'Can my foreign income count?', a: 'Rarely, in standard A-lender underwriting. Most lenders require Canadian-source income for qualification. Some private + B-lenders will use foreign employment income at 50% discount. This is a case-by-case conversation — worth the 15-minute call.' },
          { q: 'What documentation should I have ready?', a: 'PR card OR work/study permit. Passport. SIN (or ITIN if applicable). Last 3 months of Canadian bank statements. Last 2 pay stubs + employer letter. Any foreign credit report you can obtain. Landing paperwork (if PR). If self-employed, 2 years of foreign tax returns if available.' },
        ]}
      />

      <RelatedSituations
        accentTextClass="text-red-600"
        items={[
          { href: '/situations/first-time-buyer', title: 'First-time buyer programs', blurb: 'Newcomer programs stack with FTHB rebates (HBP, FHSA, LTT) — both apply if this is your first Canadian home.' },
          { href: '/situations/declined-by-bank', title: 'Declined by your Canadian bank?', blurb: 'Foreign credit acceptance + rental history proxy get files approved that a branch turned down.' },
          { href: '/situations/investment-property', title: 'Newcomer rental buyer', blurb: 'PR-status investors accessing rental portfolios have a wider lender pool than most branches disclose.' },
        ]}
      />

      <BottomCTA
        headline="Your visa isn't a rejection letter."
        body="Every status has a lender pathway. Get 15 minutes with a broker who's placed 100+ newcomer files."
        buttonLabel="Get My Newcomer Options"
        buttonHref="#lead-form"
        buttonClass="bg-red-600 hover:bg-red-500 shadow-red-500/40"
        footerNote="FSRA-licensed · Multilingual support · Response in < 2 hours"
      />
    </div>
  );
}
