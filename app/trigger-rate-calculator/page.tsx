import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import TriggerRateCalc from '../../components/calc/TriggerRateCalc';

export const metadata = buildMetadata({
  title: 'Variable Mortgage Trigger Rate Calculator — Canada',
  description: 'Calculate your variable mortgage trigger rate — the interest rate at which your fixed payment no longer covers interest. Payment shock analysis + options if you\'re at trigger.',
  slug: '/trigger-rate-calculator',
  keywords: [
    'trigger rate calculator Canada',
    'variable mortgage trigger rate',
    'negative amortization Canada',
    'variable mortgage payment shock',
    'mortgage trigger point',
  ],
});

const FAQ = [
  {
    q: 'What is a trigger rate?',
    a: 'On a FIXED-payment variable mortgage, your monthly payment stays constant while the rate floats. Your trigger rate is the interest rate at which your fixed payment no longer covers the monthly interest — at which point unpaid interest starts adding to your principal (negative amortization).',
  },
  {
    q: 'What happens if I hit trigger?',
    a: 'Your lender typically contacts you within 60–90 days after you hit trigger and gives you options: (1) increase your payment, (2) make a lump-sum principal payment, (3) switch to a fixed rate, (4) sometimes extend the amortization back to the original 25/30 years to reduce the required payment.',
  },
  {
    q: 'What is the trigger point vs the trigger rate?',
    a: 'Trigger RATE = the interest rate at which your payment stops covering interest (this calculator). Trigger POINT = the balance level at which your outstanding balance exceeds a set threshold (often 105% of the original mortgage amount), typically triggering a mandatory payment reset regardless of rate.',
  },
  {
    q: 'Should I switch to fixed?',
    a: 'It depends on where rates are heading. Fixed locks certainty at a higher rate today; variable keeps the option of paying less if rates drop. Talk to a broker — the switch is usually free, but timing it wrong costs money either way.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      slug="/trigger-rate-calculator"
      title="Variable Mortgage Trigger Rate Calculator"
      subtitle="At what interest rate does your fixed payment stop covering interest? See the trigger rate + payment shock."
      accent="amber"
      eyebrow="Trigger Rate · Variable"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/refi-payout-plan"
      ctaLabel="Talk to a broker about your options"
      ctaHref="/refi-payout-plan"
    >
      <TriggerRateCalc />
    </CalcChrome>
  );
}
