import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import DownPaymentCalc from '../../components/calc/DownPaymentCalc';

export const metadata = buildMetadata({
  title: 'Down Payment Calculator — CMHC Premium + Minimum Rules',
  description: 'Calculate your Canadian minimum down payment (5%/10%/20% tiered rules), CMHC insurance premium, and side-by-side monthly payment across 5%/10%/20%/25% down tiers.',
  slug: '/down-payment-calculator',
  keywords: [
    'down payment calculator Canada',
    'CMHC insurance calculator',
    'minimum down payment Canada',
    'mortgage insurance premium calculator',
    '5% vs 20% down payment',
  ],
});

const FAQ = [
  {
    q: 'What are the minimum down payment rules in Canada?',
    a: '• 5% on the first $500,000 of purchase price\n• 10% on the portion between $500,001 and $1,500,000\n• 20% on any amount above $1,500,000\n\nExample on a $700,000 home: 5% × $500k + 10% × $200k = $45,000 minimum down.',
  },
  {
    q: 'What is CMHC insurance and when is it required?',
    a: 'CMHC (or Sagen / Canada Guaranty) mortgage default insurance is required whenever your down payment is under 20%. It protects the lender if you default. The premium is added to your mortgage balance (financed over the amortization); the 8% Ontario PST on the premium must be paid in cash at closing.\n\nStandard tiers:\n• 15%–19.99% down: 2.8% of loan\n• 10%–14.99% down: 3.1%\n• 5%–9.99% down: 4.0%',
  },
  {
    q: 'Should I put down 5% or 20%?',
    a: 'Depends on your cash position and buy timing. 5% gets you into the market faster and preserves cash for renos/reserves; you pay CMHC premium (financed) + slightly higher interest over time on the larger mortgage. 20% saves CMHC premium and gives you access to uninsured products; you tie up more cash. On a $700k home, going from 5% to 20% saves roughly $12,000 in CMHC premium.',
  },
  {
    q: 'Where can my down payment come from?',
    a: 'Lender-acceptable sources: personal savings (chequing, savings, TFSA, non-registered), RRSP HBP (up to $60k per person tax-free), FHSA (up to $40k lifetime tax-free), gift from an immediate family member (with a gift letter), sale proceeds of another property. Not acceptable: unsecured loans, credit cards.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      title="Down Payment Calculator"
      subtitle="Canadian tiered minimum rules, CMHC premium tiers, and 5%/10%/20%/25% side-by-side comparison."
      accent="blue"
      eyebrow="Down Payment · Canada"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/situations/first-time-buyer"
      ctaLabel="First-time buyer? Book a free plan"
      ctaHref="/situations/first-time-buyer"
    >
      <DownPaymentCalc />
    </CalcChrome>
  );
}
