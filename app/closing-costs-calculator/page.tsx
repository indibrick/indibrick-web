import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import ClosingCostsCalc from '../../components/calc/ClosingCostsCalc';

export const metadata = buildMetadata({
  title: 'Closing Costs Calculator Ontario — Full Line-by-Line Cash Required',
  description: 'Full breakdown of Ontario closing costs including Land Transfer Tax, PST on CMHC, legal fees, title insurance, appraisal, inspection, and prepaid adjustments. Toronto MLTT + FTHB rebates supported.',
  slug: '/closing-costs-calculator',
  keywords: [
    'closing costs calculator Ontario',
    'closing costs calculator Toronto',
    'Ontario home closing costs',
    'land transfer tax closing costs',
    'PST on CMHC calculator',
  ],
});

const FAQ = [
  {
    q: 'How much are closing costs in Ontario?',
    a: 'Typical range: 1.5% to 4% of purchase price. The biggest single line item is Land Transfer Tax (0.5%–3% depending on price and Toronto vs suburb). Legal fees are usually $1,500–$2,000. If your down payment is under 20%, add the 8% PST on the CMHC premium (paid in cash at closing).',
  },
  {
    q: 'What is the PST on CMHC and why is it a cash cost?',
    a: 'CMHC insurance premium is financed into your mortgage — you pay it over the amortization. But the 8% Ontario Provincial Sales Tax on that premium is due at closing in CASH. On a $500,000 mortgage with 5% down, CMHC premium is $20,000; PST on it is $1,600. Many first-time buyers are surprised by this line item.',
  },
  {
    q: 'What are prepaid adjustments?',
    a: 'Costs the seller has already paid in advance that you reimburse them for at closing. Most common: property tax already paid past the closing date (you reimburse the portion covering your ownership), utility credits, condo fee prepayments. Typical range: $1,000–$3,000. Your real estate lawyer calculates the exact number.',
  },
  {
    q: 'Do first-time buyers save on closing costs?',
    a: 'Yes — through the Land Transfer Tax rebates. Ontario provincial LTT rebate: up to $4,000. Toronto MLTT rebate (if buying in the 416): up to $4,475. Combined maximum in Toronto: $8,475. On a home priced under $368,000 in Toronto, the rebates fully eliminate LTT.',
  },
  {
    q: 'Can I add closing costs to my mortgage?',
    a: 'Some lenders offer "cash-back at closing" mortgages that give you 1–5% of the mortgage balance back at closing, which can offset closing costs. Trade-off: the rate is typically 20–40 bps higher than the standard product. Worth doing the math — sometimes the higher rate over 5 years costs more than the closing costs saved.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      slug="/closing-costs-calculator"
      title="Ontario Closing Costs Calculator"
      subtitle="Every cash line item: LTT, PST on CMHC, legal, title, appraisal, inspection, and prepaid adjustments."
      accent="blue"
      eyebrow="Closing Costs · Ontario"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/six-minute-approval"
      ctaLabel="Get a real pre-approval"
      ctaHref="/six-minute-approval"
    >
      <ClosingCostsCalc />
    </CalcChrome>
  );
}
