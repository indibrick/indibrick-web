import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import HSTRebateCalc from '../../components/calc/HSTRebateCalc';

export const metadata = buildMetadata({
  title: 'Ontario HST New Housing Rebate Calculator',
  description: 'Calculate your Ontario New Housing HST rebate — federal (36% of 5% GST) + provincial (75% of 8% Ontario portion, capped at $24,000). Full breakdown for new-build and pre-construction purchases.',
  slug: '/hst-rebate-calculator',
  keywords: [
    'HST rebate calculator Ontario',
    'new housing HST rebate Canada',
    'pre-construction HST rebate',
    'Ontario new home HST',
    'HST rebate calculator 2026',
  ],
});

const FAQ = [
  {
    q: 'When does the HST rebate apply?',
    a: 'To new-build homes and condos (including pre-construction) where you or a close relation (spouse, child, parent, grandparent) will occupy the property as principal residence. Not for resale homes (no HST charged on resale) and not for investment purchases where you\'ll rent to third parties.',
  },
  {
    q: 'Do I claim the rebate or does the builder?',
    a: 'Most builders claim the rebate on your behalf and reflect the NET-of-rebate price in your Agreement of Purchase and Sale. In that case, the advertised price already assumes you\'ll qualify for the rebate. If you don\'t qualify (e.g., you buy as an investor), the builder can back-charge you for the amount they credited — which surprises many first-time investors.',
  },
  {
    q: 'What if I buy pre-construction as a rental?',
    a: 'You may still qualify for a partial rebate under the New Residential Rental Property (NRRP) rebate — but the timing and process are different. You typically pay the full HST at closing, then apply to CRA for the rebate after your first tenant moves in. Cash-flow implication: you need enough cash at closing to cover the full HST, then wait for the CRA refund.',
  },
  {
    q: 'What is the maximum rebate?',
    a: 'Federal: max $6,300 (36% of 5% GST on the first $350k, phased out fully above $450k).\n\nProvincial (Ontario): max $24,000 (75% of the 8% provincial HST portion, capped at that dollar amount).\n\nCombined maximum: $30,300 — reached on new-build homes priced at $500,000+ pre-HST.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      slug="/hst-rebate-calculator"
      title="Ontario HST New Housing Rebate Calculator"
      subtitle="Federal + Ontario portions of the New Housing HST rebate for new-build and pre-construction purchases."
      accent="purple"
      eyebrow="HST Rebate · Ontario"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/situations/pre-construction-closing"
      ctaLabel="Pre-con closing? Get a broker review"
      ctaHref="/situations/pre-construction-closing"
    >
      <HSTRebateCalc />
    </CalcChrome>
  );
}
