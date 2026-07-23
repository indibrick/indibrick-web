import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import MortgagePaymentCalc from '../../components/calc/MortgagePaymentCalc';

export const metadata = buildMetadata({
  title: 'Mortgage Payment Calculator — Canadian Semi-Annual Compounding',
  description: 'Calculate your Canadian mortgage payment with correct semi-annual compounding, 5 payment frequencies (including accelerated bi-weekly), full amortization schedule, prepayment scenarios, and Ontario CMHC + LTT tuned math.',
  slug: '/mortgage-payment-calculator',
  keywords: [
    'mortgage payment calculator Canada',
    'mortgage payment calculator Ontario',
    'accelerated bi-weekly mortgage calculator',
    'Canadian semi-annual mortgage compounding',
    'amortization schedule calculator',
    'mortgage prepayment calculator',
    'CMHC premium calculator',
  ],
});

const FAQ = [
  {
    q: 'Why do Canadian mortgages use semi-annual compounding?',
    a: 'The Interest Act (Canada) requires regulated A-lenders to compound residential mortgage interest semi-annually — twice per year, not monthly (which is the US standard). Using the US monthly formula overstates your payment by roughly $20–$40/mo on a typical file. Every calculation on this page uses the correct Canadian formula.',
  },
  {
    q: 'What is the difference between bi-weekly and accelerated bi-weekly?',
    a: 'Regular bi-weekly pays every 2 weeks (26 payments/year), spreading your monthly payment across those 26 dates. Accelerated bi-weekly takes your monthly payment and pays HALF every 2 weeks — 26 halves = 13 full monthly payments/year (one extra). That extra payment typically reduces amortization by 3–4 years on a 25-year mortgage.',
  },
  {
    q: 'Do prepayments really save that much interest?',
    a: 'Yes — every extra dollar goes straight to principal, reducing the balance that compounds forward. An extra $200/month on a $500,000 mortgage at 4.29% saves roughly $75,000 in interest and 5 years of payments. Check your mortgage contract for the annual prepayment limit (typically 15–20% of original principal per year).',
  },
  {
    q: 'Does this include CMHC insurance?',
    a: 'Yes — if your down payment is under 20%, CMHC (or Sagen / Canada Guaranty) mortgage default insurance is required. The premium is calculated automatically and added to your mortgage balance. Standard tiers: 15–19.99% down = 2.8%, 10–14.99% = 3.1%, 5–9.99% = 4.0%.',
  },
  {
    q: 'Why does the property tax appear in the payment breakdown?',
    a: 'Your monthly mortgage payment to the lender is principal + interest, but your true monthly housing cost also includes property tax + heating + condo fees. Ontario average property tax is 0.5–1.0% of home value annually; we default to 0.75% for the illustration. Your file-specific rate will differ.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      title="Mortgage Payment Calculator"
      subtitle="Canadian semi-annual compounding. Every payment frequency. Full amortization schedule + prepayment scenarios."
      accent="blue"
      eyebrow="Mortgage Payment · Canada"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/six-minute-approval"
      ctaLabel="Talk to a broker about your file"
      ctaHref="/six-minute-approval"
    >
      <MortgagePaymentCalc />
    </CalcChrome>
  );
}
