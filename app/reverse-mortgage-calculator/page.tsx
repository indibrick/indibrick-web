import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import ReverseMortgageCalc from '../../components/calc/ReverseMortgageCalc';

export const metadata = buildMetadata({
  title: 'Reverse Mortgage Calculator Canada — 55+ Tax-Free Cash',
  description: 'Calculate how much tax-free cash you can access via a Canadian reverse mortgage. Age × home value → max amount, 20-year balance projection vs home value growth, residual equity estimate.',
  slug: '/reverse-mortgage-calculator',
  keywords: [
    'reverse mortgage calculator Canada',
    'reverse mortgage calculator Ontario',
    'CHIP reverse mortgage calculator',
    'reverse mortgage amount 55+',
    'reverse mortgage balance projection',
  ],
});

const FAQ = [
  {
    q: 'Who is eligible for a Canadian reverse mortgage?',
    a: 'Both borrowers on title must be 55 or older. The home must be your principal residence in Canada. Available on most property types: detached, semi, townhouse, condo, bungalow. Some rural or unique properties may not qualify.',
  },
  {
    q: 'How is the max amount calculated?',
    a: 'Based on: youngest borrower age (older = higher %), home value, home location, and home type. The general ceiling is 55% of appraised value. Age curves are approximate — actual amounts are set by each lender\'s published age × LTV table. Example: 68-year-old with a $900k home ≈ 27–35% of value = ~$240k–$315k available.',
  },
  {
    q: 'Does the balance really grow that fast?',
    a: 'Interest compounds while you\'re not making payments. At 7.5% annual and no monthly payments, a $200k balance doubles in about 10 years. But your HOME VALUE typically also grows (Ontario long-run average ~3%/yr) — so residual equity is often preserved. Historical data: ~99% of reverse mortgage holders have equity remaining at loan discharge.',
  },
  {
    q: 'Is this tax-free?',
    a: 'Yes. Reverse mortgage funds are a loan advance, not income. Not taxable and don\'t reduce Old Age Security or Guaranteed Income Supplement eligibility. Interest accruing on the balance is also not tax-deductible (unlike investment loan interest).',
  },
  {
    q: 'What is the no-negative-equity guarantee?',
    a: 'As long as you meet your property tax + insurance + maintenance obligations, you will never owe more than your home\'s fair market value at the time it\'s sold. If the balance exceeds the sale price, the lender absorbs the difference. This is a standard feature of every regulated Canadian reverse mortgage product.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      title="Reverse Mortgage Calculator"
      subtitle="How much tax-free cash can you access via a Canadian reverse mortgage? Age + home value + 20-year balance projection."
      accent="amber"
      eyebrow="Reverse Mortgage · 55+"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/situations/reverse-mortgage"
      ctaLabel="Get a real estimate from a broker"
      ctaHref="/situations/reverse-mortgage"
    >
      <ReverseMortgageCalc />
    </CalcChrome>
  );
}
