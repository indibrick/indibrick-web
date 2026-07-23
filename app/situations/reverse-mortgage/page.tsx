import React from 'react';
import Link from 'next/link';
import { buildMetadata } from '../../../lib/buildMetadata';
import SituationForm from '../../../components/SituationForm';
import { StatStrip, FAQ, BottomCTA, HeroTag, RelatedSituations } from '../../../components/SituationChrome';
import { Heart, HomeIcon, Coins, Plane, Wrench, Gift, Shield, Users } from 'lucide-react';
import CiteBlock from '../../../components/CiteBlock';
import TrustBar from '../../../components/TrustBar';
import BrokerCard from '../../../components/BrokerCard';

export const metadata = buildMetadata({
  title: 'Reverse Mortgage in Canada — 55+ Homeowners, No Monthly Payments',
  description: 'A Canadian reverse mortgage lets homeowners 55+ turn home equity into tax-free cash — with no monthly payments, no requalification, and the guarantee you\'ll never owe more than your home is worth. Free 20-minute call with a FSRA-licensed broker.',
  slug: '/situations/reverse-mortgage',
  keywords: [
    'reverse mortgage Canada',
    'reverse mortgage Ontario',
    '55+ home equity Canada',
    'reverse mortgage vs HELOC',
    'tax-free home equity retirement',
    'no negative equity guarantee',
    'reverse mortgage broker Ontario',
    'retirement income home equity',
  ],
});

const STATS = [
  { value: '55+', label: 'age eligibility · both spouses' },
  { value: 'up to 55%', label: 'of home equity accessible tax-free' },
  { value: '99%', label: 'of reverse mortgage holders keep equity in their home' },
];

const CLIENT_GROUPS = [
  { Icon: Coins, t: 'Alleviate debt stress', d: 'Ease the pressure of an existing mortgage, credit card balances, or lines of credit — without touching your savings or investments.' },
  { Icon: Wrench, t: 'Cover unplanned expenses', d: 'Home repairs, mobility retrofits, in-home care, dental work — cash on hand for the surprises that come with aging in place.' },
  { Icon: Plane, t: 'Live life to the fullest', d: 'The retirement you actually want. Travel, hobbies, a boat, a cottage — funded from equity that\'s otherwise sitting locked in your home.' },
  { Icon: HomeIcon, t: 'Maintain your standard of living', d: 'A predictable income supplement so your day-to-day lifestyle doesn\'t have to shrink when your paycheque stops.' },
  { Icon: Gift, t: 'Early inheritance for family', d: 'Help your children onto the property ladder or your grandchildren through school — while you\'re alive to see them enjoy it.' },
  { Icon: Heart, t: 'Age in place with dignity', d: 'The financial cushion to stay in the home you love, in the neighbourhood you know, instead of being pushed toward downsizing.' },
];

// The comparison values below reflect the two main products' standard market
// features in Ontario as of 2026. HELOC 65% LTV cap + variable prime-linked
// pricing + requalification are lender-agnostic. Reverse-mortgage 55% LTV cap
// + no-monthly-payment + no-requalification + up-to-5yr fixed options
// reflect the main Canadian reverse mortgage product in market.
const COMPARISON_ROWS: Array<{ label: string; heloc: string; rm: string; rmWins: boolean }> = [
  { label: 'Maximum LTV',                 heloc: 'Up to 65%',                            rm: 'Up to 55%',                                rmWins: false },
  { label: 'Monthly payments required',   heloc: 'Yes — interest minimum',              rm: 'None (while you live in the home)',        rmWins: true  },
  { label: 'Requalification',             heloc: 'Ongoing credit reviews',              rm: 'None after approval',                      rmWins: true  },
  { label: 'Rate structure',              heloc: 'Variable · floats with prime',        rm: 'Fixed options up to 5 years',              rmWins: true  },
  { label: 'Income qualification',        heloc: 'Standard TDS/GDS underwriting',       rm: 'Simplified · designed for fixed income',   rmWins: true  },
  { label: 'Impact if spouse passes',     heloc: 'Bank may review surviving spouse',    rm: 'No impact until BOTH no longer in home',   rmWins: true  },
  { label: 'Loan due when',               heloc: 'On demand OR at end of term',         rm: 'Move / sell / estate settles',             rmWins: true  },
  { label: 'Owe more than home is worth?',heloc: 'Possible in a downturn',              rm: 'Never — no-negative-equity guarantee*',    rmWins: true  },
];

export default function ReverseMortgagePage() {
  return (
    <div className="bg-white">
      {/* HERO — softer, warmer than the other situations pages. Bigger type,
          more breathing room; 55+ audience skims differently than a 30yo
          renewal shopper. */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <HeroTag className="bg-amber-500/15 text-amber-300 border-amber-500/30">🏡 Reverse Mortgage · Homeowners 55+</HeroTag>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              Your home equity, <br/>
              <span className="text-amber-400">without moving out.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              A reverse mortgage turns the equity in your home into <strong className="text-white">tax-free cash</strong>. No monthly payments. No requalifying. You keep title, keep the home, and never owe more than it&apos;s worth. Designed for Canadian homeowners <strong className="text-white">55 and older</strong> — the money is yours to use however you choose.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Access up to 55% of your home&apos;s value, tax-free</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> No monthly mortgage payments while you live there</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Does not affect Old Age Security (OAS) or GIS benefits</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> No-negative-equity guarantee* — you never owe more than the home is worth</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · Free consultation · No pressure</p>
            <p className="text-xs text-amber-300 mt-4">
              Prefer to run the numbers first? Try the <Link href="/reverse-mortgage-calculator" className="underline font-bold">Reverse Mortgage Calculator</Link>.
            </p>
          </div>

          <div id="lead-form" className="scroll-mt-24">
            <SituationForm
              situationLabel="Reverse Mortgage"
              serviceNeeded="Reverse Mortgage"
              sourceTag="situations/reverse-mortgage"
              goal="Other"
              pageSource="/situations/reverse-mortgage"
              submitLabel="Get My Reverse Mortgage Estimate"
              successHeadline="Estimate on the way"
              successBody={<>A licensed IndiBrick advisor will call you within <strong>1 business day</strong> with an estimate of how much you could access, an explanation of the no-negative-equity guarantee, and answers to any questions. There is no obligation and no credit pull for the initial estimate.</>}
              accent="amber"
              responseWindow="within 1 business day"
              collapseOptional
              extraFields={[
                // Essential for a 55+ audience — 3 fields only above the fold.
                // Age is what determines eligibility. Home value + city
                // shape the initial estimate. Everything else is behind
                // "Add more context (optional)".
                { name: 'homeownerAge', label: 'Your age', type: 'select', options: ['55–59', '60–64', '65–69', '70–74', '75–79', '80–84', '85+'], half: true },
                { name: 'homeValue', label: 'Home value (estimate)', type: 'currency', placeholder: '850000', half: true },
                { name: 'city', label: 'City / region', type: 'text', placeholder: 'Toronto / Mississauga / etc.' },
                // Optional — collapsed by default. Broker will ask on the callback.
                { name: 'spouseAge', label: 'Spouse age (if applicable)', type: 'select', options: ['N/A — single', 'Under 55', '55–59', '60–64', '65–69', '70–74', '75–79', '80–84', '85+'], required: false, half: true },
                { name: 'existingMortgage', label: 'Existing mortgage balance', type: 'currency', placeholder: '0', required: false, half: true, helpText: 'if any' },
                { name: 'homeType', label: 'Home type', type: 'select', options: ['Detached', 'Semi-detached', 'Townhouse / row', 'Condo', 'Bungalow', 'Other'], required: false },
                { name: 'primaryGoal', label: 'Main reason you\'re considering this', type: 'select', options: ['Ease debt / consolidate', 'Cover unplanned expenses', 'Supplement retirement income', 'Home renovation or retrofit', 'Travel / life experiences', 'Help family (early inheritance)', 'Purchase second property', 'Just researching'], required: false },
              ]}
            />
          </div>
        </div>
      </section>

      <TrustBar variant="light" scaleClaim={{ value: '$45B+', label: 'reverse mortgage originations by Canadian Schedule I lenders (industry-wide, 2024)' }} />

      {/* BORROWED AUTHORITY — the audit's #1 gap-close for the reverse
          mortgage page. Skeptical 55+ audiences pick recognized bank
          names; naming our federally-regulated Schedule I bank sources
          neutralizes CHIP's brand-familiarity advantage without breaking
          our lender-agnostic content posture. */}
      <section className="bg-amber-50 border-y border-amber-100 py-6">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Our Lender Sources</p>
          <p className="text-sm md:text-base text-slate-800 leading-relaxed max-w-3xl mx-auto">
            IndiBrick sources Canadian reverse mortgages from <strong className="text-slate-900">HomeEquity Bank</strong> and <strong className="text-slate-900">Equitable Bank</strong> — both federally regulated <strong className="text-slate-900">Schedule I banks</strong> under OSFI oversight — plus <strong className="text-slate-900">Bloom Finance</strong>. We compare all available products against your goals and never take an origination fee from you at the A-lender level.
          </p>
        </div>
      </section>

      <StatStrip stats={STATS} accentTextClass="text-amber-400" />

      {/* SOURCED CLAIMS — reverse mortgages are the highest-YMYL topic on
          the site. Every stat gets a source, timestamped, in schema.org/
          Claim markup so an AI answer engine has provable provenance. */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-4 text-center">Sources &amp; Methodology</p>
          <div className="space-y-3">
            <CiteBlock
              value="55+"
              claim="is the minimum age (both borrowers on title) required to qualify for a Canadian reverse mortgage under CMHC-recognized products."
              source="Financial Consumer Agency of Canada — Reverse mortgages"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html"
              asOf="2025-11"
            />
            <CiteBlock
              value="up to 55%"
              claim="of a Canadian home's appraised value can typically be accessed via a reverse mortgage, tax-free."
              source="Financial Consumer Agency of Canada — Reverse mortgages"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html"
              asOf="2025-11"
            />
            <CiteBlock
              value="~99% / 50–60%"
              claim="of Canadian reverse mortgage holders have equity remaining at loan discharge — average residual equity 50–60% of the home's value (long-run book history across principal Canadian reverse mortgage lenders, 30+ years)."
              source="Aggregate long-run outcome data reported by principal Canadian reverse mortgage lenders"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages/reverse-mortgages.html"
              asOf="2025-11"
            />
          </div>
        </div>
      </section>

      {/* PLAIN ENGLISH — the 60-second explanation */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">In Plain English</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">What a reverse mortgage actually is</h2>
          </div>
          <div className="bg-gray-50 rounded-3xl p-6 md:p-10 border border-gray-100 space-y-5 text-base md:text-lg text-slate-700 leading-relaxed">
            <p>
              A reverse mortgage is a loan secured by the equity in your home. Unlike a traditional mortgage where you make payments to a lender, <strong className="text-slate-900">the lender pays you</strong> — either as a lump sum, staged advances, or a mix.
            </p>
            <p>
              You keep <strong className="text-slate-900">ownership</strong>, you keep the <strong className="text-slate-900">title</strong>, and you keep living in your home for as long as you choose. The loan only becomes due when you and your spouse both move out, sell the home, or through your estate.
            </p>
            <p>
              There are <strong className="text-slate-900">no monthly mortgage payments</strong> for as long as you live in the home. Interest accrues on the balance, but you never write a cheque unless you want to (voluntary prepayment is allowed).
            </p>
            <p>
              The one requirement: you keep the property in good condition, pay your property taxes and insurance, and remain the owner-occupant. Meet those obligations and the no-negative-equity guarantee kicks in: <strong className="text-slate-900">you will never owe more than the fair market value of your home</strong>.*
            </p>
          </div>
        </div>
      </section>

      {/* HELOC VS REVERSE MORTGAGE — the key comparison */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Reverse Mortgage vs HELOC</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Two ways to tap home equity</h2>
            <p className="text-sm text-gray-500 mt-4 max-w-2xl mx-auto">Both are legitimate options. The right one depends on your income, cash-flow needs, and whether monthly payments would be a strain.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-900 text-white">
              <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Feature</div>
              <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-gray-300 text-center">HELOC</div>
              <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-amber-400 text-center">Reverse Mortgage</div>
            </div>
            {COMPARISON_ROWS.map((r, i) => (
              <div key={r.label} className={`grid grid-cols-3 items-start ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="p-4 md:p-5 font-bold text-slate-900 text-sm">{r.label}</div>
                <div className="p-4 md:p-5 text-center text-sm text-slate-700">{r.heloc}</div>
                <div className={`p-4 md:p-5 text-center text-sm ${r.rmWins ? 'font-black text-emerald-700' : 'text-slate-700'}`}>{r.rm}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-4 max-w-3xl mx-auto italic">
            HELOC is often the cheaper option if you have strong income to service the payments and want lower borrowing costs. A reverse mortgage is designed for retirees whose cash-flow is fixed and who don&apos;t want (or can&apos;t take on) another monthly obligation.
          </p>
        </div>
      </section>

      {/* HOW PEOPLE USE THE MONEY */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">How Canadians Use It</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">The money is yours — spend it how you want</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLIENT_GROUPS.map(g => {
              const { Icon } = g;
              return (
                <div key={g.t} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-amber-700"/>
                  </div>
                  <p className="font-black text-slate-900 text-sm mb-2">{g.t}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{g.d}</p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto">These are illustrative — many clients combine several. There&apos;s no restriction on how you use the funds beyond paying out any existing mortgage or lien secured against the property.</p>
        </div>
      </section>

      {/* NO NEGATIVE EQUITY GUARANTEE — dedicated reassurance section */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <Shield size={28} className="text-emerald-400"/>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">The Guarantee That Matters Most</p>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-6 leading-tight">
            You&apos;ll never owe more <br/>
            <span className="text-emerald-400">than your home is worth.</span>
          </h2>
          <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl mx-auto">
            The no-negative-equity guarantee* ensures that as long as you keep your property in good maintenance, pay your property taxes and insurance, and remain the owner-occupant, the amount owed on the due date <strong className="text-white">will not exceed the fair market value of your home</strong>. If the sale proceeds are less than the loan balance, the lender covers the difference — not you, not your estate.
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-400 mb-1">99%</p>
              <p className="text-sm text-gray-300">of borrowers still have equity remaining when the loan is repaid</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-400 mb-1">~50–60%</p>
              <p className="text-sm text-gray-300">average equity left over — often more, thanks to home appreciation</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-2xl md:text-3xl font-black tracking-tighter text-emerald-400 mb-1">55%</p>
              <p className="text-sm text-gray-300">maximum LTV cap — deliberately conservative to protect your equity</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-8 italic max-w-2xl mx-auto">
            *Guarantee excludes administrative expenses and interest that has accumulated after the due date. Property must remain in good maintenance, property taxes and insurance paid, and not in default. The 99% / 50–60% figures reflect long-run outcome data published by principal Canadian reverse mortgage lenders across 30+ years of book history. Individual outcomes depend on borrowed amount, home appreciation, and time held.
          </p>
        </div>
      </section>

      {/* HOW YOU RECEIVE THE MONEY */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">4 Ways to Take the Money</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Pick the shape that fits your life</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { n: '01', t: 'Lump sum', d: 'Receive the entire approved amount at once. Common for one-time uses: paying off a mortgage or line of credit, a major renovation, or an early inheritance for family.' },
              { n: '02', t: 'Staged advances', d: 'Take a portion now, more later. Useful when your cash need is spread over 6–24 months — sequenced renovations, a series of medical expenses, or funding a family member across multiple milestones.' },
              { n: '03', t: 'Planned monthly income', d: 'A regular deposit into your bank account over a set period, like a paycheque. Ideal when the goal is income supplement rather than a lump event.' },
              { n: '04', t: 'A combination', d: 'A partial lump sum plus scheduled advances. Fits the majority of files — pay off an existing mortgage today, and layer on a monthly supplement for the next few years.' },
            ].map(s => (
              <div key={s.n} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                <p className="text-3xl font-black text-amber-600 tracking-tighter mb-1 tabular-nums">{s.n}</p>
                <p className="font-black text-slate-900 text-sm mb-2">{s.t}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEES DISCLOSURE — regulatory-safe transparency */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">The Fees, Straight Up</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase leading-tight">What it actually costs to set up</h2>
          </div>
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              A reverse mortgage has one-time set-up fees that cover the appraisal, independent legal advice, administration, title insurance, and registration. With the exception of the appraisal fee (typically $300–$600, paid up front), <strong className="text-slate-900">every other set-up fee is deducted from the funding proceeds</strong> — you don&apos;t write a cheque out of pocket.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Independent legal advice is not optional. A lawyer of your choosing (not the lender&apos;s) reviews the terms with you before you sign — this is a regulatory safeguard, not a formality. Take the time.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We explain every fee in writing before you commit. If any figure isn&apos;t clear, that&apos;s our job to fix — not yours to research.
            </p>
          </div>
        </div>
      </section>

      <BrokerCard pageSource="/situations/reverse-mortgage" accent="amber" />

      <FAQ
        accentTextClass="text-amber-700"
        items={[
          { q: 'What are the exact eligibility requirements?', a: 'You (and your spouse, if you have one) must both be at least 55 years old. The home must be your primary residence, located in Canada (most provinces). Property type: detached, semi-detached, townhouse, condo — most standard residential properties qualify. Some rural, small, or unique properties may not.' },
          { q: 'How much can I actually access?', a: 'Up to 55% of your home\'s appraised value. The exact amount depends on your age (older = higher %), your spouse\'s age, your location, home type, and appraised value. A 75-year-old with an $850k detached Toronto home might access ~$380k. A 60-year-old with a $700k condo might access ~$230k. We give you a real estimate on the call.' },
          { q: 'Will this affect my OAS or GIS?', a: 'No. Reverse mortgage funds are tax-free — you receive them as a loan advance, not as income. They are not reported to the CRA as taxable income and do not count against Old Age Security clawback thresholds or Guaranteed Income Supplement eligibility.' },
          { q: 'What happens when I pass away?', a: 'The loan becomes due upon the passing of the last surviving borrower on title. Your estate has typically 6–12 months to settle — either by selling the home or by your heirs refinancing/paying out the balance to keep the property. Whatever equity remains after repayment goes to your estate.' },
          { q: 'Can I lose my home?', a: 'The lender cannot force a sale as long as you\'re alive, living in the home, keeping it in good condition, and paying property taxes and insurance. Meet those obligations and you have the same security of tenure you have today.' },
          { q: 'What if my spouse is under 55?', a: 'Both borrowers on title must be 55+ to qualify. Options: (a) wait until the younger spouse turns 55; (b) remove the younger spouse from title (has legal + estate implications — get advice); (c) explore alternative products like a HELOC or standard refinance that don\'t have the same age gate.' },
          { q: 'Can I sell my home whenever I want?', a: 'Yes. You retain full ownership and can sell at any time. The reverse mortgage balance is paid out of the sale proceeds; whatever equity is left over is yours. No prepayment penalty on sale in most cases.' },
          { q: 'Can I pay it back early?', a: 'Yes. Voluntary prepayments are allowed at any time — you can pay down interest, principal, or the full balance. Fixed-rate reverse mortgages may have a prepayment charge if you pay out the full balance before the term ends (similar to a regular fixed mortgage), disclosed up front.' },
          { q: 'Does the lender own my home?', a: 'No. You retain full title and ownership. The lender registers a mortgage against title (a lien) — exactly like a regular mortgage — but the home is legally yours, and you have full authority to make decisions about it.' },
          { q: 'Should this be considered a "loan of last resort"?', a: 'No. Many financial planners recommend a reverse mortgage as a proactive retirement tool — protecting an investment portfolio from being drawn down in a down market, funding aging-in-place instead of selling and moving, or unlocking equity for family without touching invested capital. It\'s a legitimate cash-flow product, not an emergency lever.' },
          { q: 'What if I have an existing mortgage?', a: 'Common scenario. Any outstanding mortgage or line of credit secured against the home must be paid out from the reverse mortgage proceeds — so the reverse mortgage becomes the only debt on your home. Often the biggest immediate win: eliminating a monthly mortgage payment on day one.' },
          { q: 'How long does the process take?', a: 'Typically 4–6 weeks from application to funding. Steps: initial estimate (day 1) → application + document collection (week 1) → appraisal (week 2) → lender approval (week 3) → independent legal advice + signing (week 4) → funds released (week 5–6).' },
        ]}
      />

      <RelatedSituations
        accentTextClass="text-amber-700"
        items={[
          { href: '/situations/mortgage-renewal', title: 'Renewal at 55+', blurb: 'If you\'re approaching renewal with a fixed income, compare the payment against a reverse mortgage exit.' },
          { href: '/situations/refinance-debt-consolidation', title: 'HELOC alternative', blurb: 'HELOC is often cheaper if you can service the payments — the RM/HELOC decision is a cash-flow call.' },
          { href: '/situations/first-time-buyer', title: 'Helping family buy a home', blurb: 'Many 55+ homeowners use RM proceeds as an early inheritance to gift adult kids their first down payment.' },
        ]}
      />

      <BottomCTA
        headline="Retire on your terms — in your home."
        body="Get a real estimate of how much you could access, with no obligation and no credit pull. A licensed advisor walks you through it in under 20 minutes."
        buttonLabel="Get My Reverse Mortgage Estimate"
        buttonHref="#lead-form"
        buttonClass="bg-amber-600 hover:bg-amber-500 shadow-amber-500/40"
        footerNote="FSRA-licensed · Free consultation · Response in < 1 business day"
      />

      {/* COMPLIANCE FOOTER — kept understated but visible for regulatory hygiene */}
      <section className="bg-white border-t border-gray-100 py-8">
        <div className="container mx-auto px-6 max-w-4xl text-[11px] text-gray-500 leading-relaxed space-y-2">
          <p>
            <strong>* No-negative-equity guarantee:</strong> Applies as long as you meet your obligations, which include keeping your property in good maintenance, paying your property taxes and insurance, and the property is not in default. The guarantee excludes administrative expenses and interest that has accumulated after the due date. Guarantee terms are set by the funding lender; specific product terms are disclosed in writing before you commit.
          </p>
          <p>
            IndiBrick is a FSRA-licensed Ontario mortgage brokerage. A reverse mortgage is a significant financial decision — you should obtain independent legal advice before entering into one, and we strongly encourage you to include your family, executor, or financial planner in the conversation. Rates, LTV limits, and product features are subject to change and depend on lender underwriting and property/borrower qualification.
          </p>
        </div>
      </section>
    </div>
  );
}
