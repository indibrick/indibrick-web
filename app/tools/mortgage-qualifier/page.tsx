import React from 'react';
import Link from 'next/link';
import { buildMetadata } from '../../../lib/buildMetadata';
import CalcChrome from '../../../components/calc/CalcChrome';
import MortgageQualifierCalc from '../../../components/calc/MortgageQualifierCalc';

// Mortgage Qualifier — the flagship calculator.
//
// Positioning: every other calculator here answers "what does this cost" or
// "how much could I borrow". This answers the lender's question — do the
// ratios pass on THIS property — which is what the federal Mortgage Qualifier
// Tool does and what the head-term queries are actually looking for.
//
// It also functions as the hub for the other thirteen calculators, which is
// how a single page can rank for the broad term while the specialists hold
// their long-tail without competing with it.

export const metadata = buildMetadata({
  title: 'Mortgage Qualifier Calculator Canada — GDS, TDS & Stress Test',
  description:
    'Find out if you qualify. Enter a property, your income and your debts to see your GDS and TDS ratios against A-lender caps, stress-tested under OSFI B-20. Correct Canadian semi-annual compounding, CMHC premium tiers and 2026 down-payment rules.',
  slug: '/tools/mortgage-qualifier',
  keywords: [
    'mortgage qualifier calculator',
    'mortgage calculator Canada',
    'mortgage calculator Ontario',
    'how much mortgage can I qualify for',
    'GDS TDS calculator',
    'mortgage stress test calculator',
    'mortgage affordability calculator Canada',
    'do I qualify for a mortgage',
    'OSFI B-20 stress test calculator',
    'CMHC premium calculator',
    'minimum down payment Canada calculator',
  ],
});

// These become FAQPage JSON-LD via CalcChrome. Written as standalone answers
// so an answer engine can lift any single one without the surrounding page.
const FAQ = [
  {
    q: 'What GDS and TDS ratios do I need to qualify for a mortgage in Canada?',
    a: 'Conventional A-lender limits are 39% GDS and 44% TDS. GDS (Gross Debt Service) is your mortgage payment plus property tax, heat, and 50% of condo fees, divided by gross household income. TDS (Total Debt Service) adds every other monthly debt payment — car loans, credit card minimums, lines of credit, student loans, support payments. Both are measured at the stress-test rate, not your contract rate. Some lenders stretch to 42/50 on strong credit, and B-lenders regularly approve well past those caps at higher pricing.',
  },
  {
    q: 'What rate is used for the mortgage stress test in 2026?',
    a: 'Under OSFI Guideline B-20 you must qualify at the greater of your contract rate plus 2 percentage points, or 5.25% — whichever is higher. At a 4.29% contract rate you are tested at 6.29%. At a 3.00% contract rate you are tested at 5.25%, because the floor binds. This applies to all federally regulated lenders. The test does not change what you pay; it changes what you are allowed to borrow.',
  },
  {
    q: 'What is the minimum down payment in Canada?',
    a: 'Five percent on the first $500,000, ten percent on the portion between $500,000 and $1,500,000, and twenty percent at $1,500,000 or above. On an $850,000 home the minimum is $60,000 — $25,000 on the first $500,000 plus $35,000 on the remaining $350,000. Mortgage default insurance is unavailable at or above $1,500,000, which is why 20% becomes a hard floor rather than a preference.',
  },
  {
    q: 'Why does only half of my condo fee count toward the ratios?',
    a: 'Lenders include 50% of a condo maintenance fee in GDS and TDS because a portion of the fee covers utilities, amenities and reserve fund contributions rather than pure shelter cost. A calculator that includes 100% of the fee will understate what you qualify for, sometimes by tens of thousands of dollars in purchase price. This calculator applies the 50% treatment.',
  },
  {
    q: 'Does the CMHC insurance premium get added to my mortgage?',
    a: 'Yes. With less than 20% down, default insurance is mandatory and the premium is added to the loan rather than paid up front. Premium rates by loan-to-value: 2.80% at 15–19.99% down, 3.10% at 10–14.99%, and 4.00% at 5–9.99%. Because the premium is financed, it increases the payment used in your GDS and TDS tests — a detail most calculators skip.',
  },
  {
    q: 'Why is my Canadian mortgage payment different from an American calculator?',
    a: 'The Interest Act (Canada) requires regulated lenders to compound residential mortgage interest semi-annually, twice per year. US mortgages compound monthly. Using the American formula overstates a Canadian payment by roughly $20 to $40 per month on a typical file. Every figure on this page uses the Canadian semi-annual formula.',
  },
  {
    q: 'What can I change if I do not qualify?',
    a: 'Four levers, in rough order of impact. Reduce other debt — paying off a $500 car payment frees roughly $110,000 of purchase price at typical ratios. Increase the down payment, which cuts both the loan and the insurance premium. Extend amortization, since 30 years lowers the qualifying payment against 25. Or add a co-borrower whose income counts and whose debts also count. A broker can also place the file with a lender using wider ratios.',
  },
  {
    q: 'Is passing this calculator the same as being approved?',
    a: 'No. This tests the debt-service ratios, which is the arithmetic gate. Approval also depends on credit score and history, income verification and how it is documented, employment tenure and type, the property itself and its appraisal, and the specific lender policy. Self-employed income in particular is treated very differently across lenders. Treat a pass here as "the math works," not as a pre-approval.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      slug="/tools/mortgage-qualifier"
      title="Mortgage Qualifier Calculator"
      subtitle="The two ratios every Canadian A-lender runs, stress-tested under OSFI B-20. Enter a real property and real debts, see exactly where you land."
      accent="blue"
      eyebrow="Mortgage Qualifier · Canada"
      breadcrumb={[{ label: 'Tools', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/six-minute-approval"
      ctaLabel="Have a licensed broker verify this file"
      ctaHref="/six-minute-approval"
    >
      <MortgageQualifierCalc />

      {/* ─── AEO answer layer ───────────────────────────────────────────
          Short, self-contained, fact-dense blocks. Each states a rule and
          its source in a form an answer engine can lift and attribute
          without needing the rest of the page. */}
      <section className="mt-12 bg-white rounded-3xl border border-gray-200 p-7 md:p-10">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-6">
          The rules this calculator applies
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Stress test</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Qualify at the greater of <strong>contract rate + 2%</strong> or <strong>5.25%</strong>.
              Source: OSFI Guideline B-20, Residential Mortgage Underwriting Practices and Procedures.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Debt-service caps</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>GDS 39%</strong> and <strong>TDS 44%</strong> for conventional A-lender files.
              Condo fees count at 50%. Heat is included; hydro is not.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Minimum down payment</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>5%</strong> to $500,000, <strong>10%</strong> from $500,000 to $1,500,000,
              <strong> 20%</strong> at $1,500,000 and above.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Default insurance</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Premium by loan-to-value: <strong>2.80%</strong> at 15–19.99% down,
              <strong> 3.10%</strong> at 10–14.99%, <strong>4.00%</strong> at 5–9.99%.
              Unavailable at $1,500,000 or above.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Compounding</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Semi-annual</strong>, as required by the Interest Act (Canada) —
              not the monthly compounding used by US calculators.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Amortization</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Insured files cap at <strong>25 years</strong>, extended to <strong>30</strong> for
              first-time buyers and new builds. Uninsured conventional files can reach 30 or more.
            </p>
          </div>
        </div>
      </section>

      {/* WORKED EXAMPLE — a concrete, checkable calculation. */}
      <section className="mt-6 bg-slate-900 text-white rounded-3xl p-7 md:p-10">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
          A worked example
        </h2>
        <p className="text-gray-400 text-sm mb-6 max-w-2xl">
          $850,000 purchase, $170,000 down (20%), 4.29% over 25 years, $165,000 household income,
          $6,500 property tax, $150 heat, $650 of other monthly debt. Result: GDS 37.5%, TDS 42.3% — passes both.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { k: 'Qualifying rate', v: '6.29%', s: '4.29% + 2%' },
            { k: 'Payment at 6.29%', v: '$4,469', s: 'used in the ratios' },
            { k: 'Payment at 4.29%', v: '$3,685', s: 'what you actually pay' },
            { k: 'Mortgage', v: '$680,000', s: 'no insurance at 20% down' },
          ].map((x) => (
            <div key={x.k} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{x.k}</p>
              <p className="text-2xl font-black tabular-nums">{x.v}</p>
              <p className="text-[11px] text-gray-400 mt-1">{x.s}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-6 leading-relaxed max-w-3xl">
          The gap between the two payments is what the stress test is measuring. The lender wants to see
          roughly $784 a month of headroom before approving the file — that is the entire purpose of B-20,
          and it is why a rate drop does not increase how much you can borrow as much as buyers expect.
        </p>
      </section>

      {/* CALCULATOR HUB — internal linking. Each specialist calculator gets
          a descriptive anchor rather than a bare name. */}
      <section className="mt-6 bg-white rounded-3xl border border-gray-200 p-7 md:p-10">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-2">
          Go deeper on one piece
        </h2>
        <p className="text-sm text-gray-500 mb-7 max-w-2xl">
          This page tests whether a file passes. These break down each component of it.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { href: '/mortgage-payment-calculator', t: 'Mortgage payment', d: 'Every payment frequency, full amortization schedule, prepayment scenarios.' },
            { href: '/affordability-calculator', t: 'Affordability', d: 'The reverse question — income in, maximum purchase price out.' },
            { href: '/down-payment-calculator', t: 'Down payment', d: 'Minimum by price tier, plus the CMHC premium at each level.' },
            { href: '/closing-costs-calculator', t: 'Closing costs', d: 'Legal, title, inspection, adjustments and land transfer tax together.' },
            { href: '/land-transfer-tax-calculator-ontario', t: 'Land transfer tax', d: 'Ontario brackets plus the Toronto municipal layer and first-time rebates.' },
            { href: '/mortgage-renewal-calculator', t: 'Renewal', d: 'What your payment becomes at today’s rates when the term ends.' },
            { href: '/refinance-calculator', t: 'Refinance', d: 'Whether breaking the term and consolidating actually nets out ahead.' },
            { href: '/mortgage-penalty-calculator', t: 'Break penalty', d: 'IRD versus three months’ interest, and which one your lender uses.' },
            { href: '/trigger-rate-calculator', t: 'Trigger rate', d: 'The rate at which a variable payment stops covering interest.' },
            { href: '/hst-rebate-calculator', t: 'HST rebate', d: 'New-build rebate eligibility and what actually lands back.' },
            { href: '/reverse-mortgage-calculator', t: 'Reverse mortgage', d: 'Available amount at 55+ and how the balance compounds forward.' },
          ].map((c) => (
            <Link key={c.href} href={c.href}
              className="group block bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl p-4 transition">
              <p className="font-black text-slate-900 text-sm group-hover:text-blue-700 transition mb-1">{c.t}</p>
              <p className="text-xs text-gray-600 leading-snug">{c.d}</p>
            </Link>
          ))}
        </div>
      </section>
    </CalcChrome>
  );
}
