import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import LandTransferTaxCalc from '../../components/calc/LandTransferTaxCalc';

export const metadata = buildMetadata({
  title: 'Ontario Land Transfer Tax Calculator — Toronto MLTT + FTHB Rebates',
  description: 'Calculate Ontario provincial + Toronto municipal Land Transfer Tax with first-time buyer rebates (up to $8,475 combined). Full marginal-tier breakdown + sample bands at 6 price points.',
  slug: '/land-transfer-tax-calculator-ontario',
  keywords: [
    'land transfer tax calculator Ontario',
    'Toronto municipal LTT calculator',
    'first-time buyer LTT rebate Ontario',
    'Ontario LTT tiers 2026',
    'MLTT Toronto calculator',
  ],
});

const FAQ = [
  {
    q: 'How does Ontario Land Transfer Tax work?',
    a: 'Ontario LTT is calculated on a marginal (tiered) basis:\n\n• 0.5% on the first $55,000\n• 1.0% on $55,001–$250,000\n• 1.5% on $250,001–$400,000\n• 2.0% on $400,001–$2,000,000\n• 2.5% on anything above $2,000,000\n\nEach tier only applies to the portion of the price in that range.',
  },
  {
    q: 'Do I pay Toronto Municipal LTT if I buy in the GTA?',
    a: 'Only if you buy inside the City of Toronto (416 area — Etobicoke to Scarborough). Suburbs like Vaughan, Mississauga, Brampton, Markham, Richmond Hill, Oakville do NOT pay Toronto MLTT. Toronto MLTT is roughly equal to the Ontario provincial LTT for most price bands, so buying in Toronto doubles your LTT compared to a suburb purchase.',
  },
  {
    q: 'Am I eligible for the first-time buyer rebate?',
    a: 'You qualify if: (1) you are a Canadian citizen or permanent resident, (2) you are 18+, (3) you occupy the home as your principal residence within 9 months of closing, (4) neither you nor your spouse has ever owned a home anywhere in the world. Both spouses must be first-timers to get 100% of the rebate; if only one is, you get 50%.',
  },
  {
    q: 'What is the combined rebate maximum?',
    a: 'Ontario provincial FTHB rebate: up to $4,000. Toronto municipal FTHB rebate: up to $4,475. Combined maximum for a Toronto first-time buyer: $8,475. On a home priced under $368,000 in Toronto, the rebates fully eliminate LTT; above that price, you pay the balance.',
  },
  {
    q: 'When is LTT paid?',
    a: 'At closing — your real estate lawyer collects it on the closing day and remits it to the province (and Toronto, if applicable). It is a CASH cost — LTT cannot be added to your mortgage. Budget for it up front.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      title="Ontario Land Transfer Tax Calculator"
      subtitle="Provincial + Toronto Municipal LTT with first-time buyer rebates. Full marginal breakdown + sample bands."
      accent="blue"
      eyebrow="Land Transfer Tax · Ontario"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/situations/first-time-buyer"
      ctaLabel="First-time buyer? Book a free plan"
      ctaHref="/situations/first-time-buyer"
    >
      <LandTransferTaxCalc />
    </CalcChrome>
  );
}
