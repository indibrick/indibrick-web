import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import RefinanceCalc from '../../components/calc/RefinanceCalc';

export const metadata = buildMetadata({
  title: 'Mortgage Refinance Calculator — Break-Even + Penalty vs Savings',
  description: 'Should you refinance your Canadian mortgage? Full IRD or 3-month-interest penalty math, break-even month, and net-savings verdict over remaining amortization. Ontario-tuned.',
  slug: '/refinance-calculator',
  keywords: [
    'refinance calculator Canada',
    'refinance calculator Ontario',
    'break the mortgage calculator',
    'IRD penalty calculator refinance',
    'refinance break-even calculator',
    'should I refinance my mortgage',
  ],
});

const FAQ = [
  {
    q: 'When does refinancing make sense?',
    a: 'The math has to net positive AFTER the penalty. Two common wins: (1) you got a mortgage in 2022–24 at 5–6% and rates have dropped, (2) you need equity for renos or debt consolidation and can\'t wait until renewal. Refi loses when: penalty exceeds interest savings, or your break-even month falls after your remaining term.',
  },
  {
    q: 'What is IRD?',
    a: 'Interest Rate Differential — the penalty most Big 6 fixed mortgages use. Formula: balance × (contract rate − comparable posted rate) × months remaining ÷ 12. The "comparable posted rate" is the lender\'s POSTED rate for the term closest to your remaining months — which is typically 200 bps above their discounted rates. That gap is how banks manufacture large penalties. Ask your lender for the exact posted rate they\'d use.',
  },
  {
    q: 'What is a 3-month interest penalty?',
    a: 'Simple: 3 months of interest at your current rate. Standard for variable mortgages and many monoline fixed mortgages. Formula: balance × (rate ÷ 12) × 3. Much smaller than IRD in most cases.',
  },
  {
    q: 'Can I roll the penalty into the new mortgage?',
    a: 'Yes — most lenders will let you add the penalty to the new mortgage balance. That preserves cash but you pay interest on the penalty over the new amortization. On a $10,000 penalty at 4.29% over 25 years, that\'s roughly $5,600 in extra interest. Consider paying the penalty in cash if you can.',
  },
  {
    q: 'What about blend-and-extend as an alternative?',
    a: 'Your current lender takes your existing rate + a new higher rate, weighted-averages them, extends your term — zero penalty. Best when rates are HIGHER than your contract rate and you want more term. Not useful when rates are lower than your contract (which is when refi normally wins).',
  },
];

export default function Page() {
  return (
    <CalcChrome
      slug="/refinance-calculator"
      title="Mortgage Refinance Calculator"
      subtitle="Full IRD or 3-month-interest penalty math + break-even month + net-savings verdict."
      accent="emerald"
      eyebrow="Refinance · Ontario"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/refi-payout-plan"
      ctaLabel="Get a free Refi Payout Plan"
      ctaHref="/refi-payout-plan"
    >
      <RefinanceCalc />
    </CalcChrome>
  );
}
