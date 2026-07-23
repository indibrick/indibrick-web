import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import AffordabilityCalc from '../../components/calc/AffordabilityCalc';

export const metadata = buildMetadata({
  title: 'Mortgage Affordability Calculator — Ontario B-20 Stress Test',
  description: 'How much house can you afford in Ontario? Runs full GDS/TDS math with B-20 stress test, insured vs uninsured breakdown, and rate sensitivity across 3 scenarios. FSRA-licensed brokerage.',
  slug: '/affordability-calculator',
  keywords: [
    'affordability calculator Ontario',
    'how much house can I afford Canada',
    'mortgage affordability calculator 2026',
    'GDS TDS calculator',
    'B-20 stress test calculator',
    'mortgage qualification calculator',
  ],
});

const FAQ = [
  {
    q: 'What is GDS and TDS?',
    a: 'GDS (Gross Debt Service) = housing costs (mortgage + property tax + heating + 50% of condo fees) ÷ gross monthly income. Max 39% under B-20.\n\nTDS (Total Debt Service) = GDS + all other monthly debt payments (car, LOC, credit cards). Max 44% under B-20.\n\nYou have to pass BOTH ratios to qualify with a Canadian A-lender.',
  },
  {
    q: 'What is the stress test?',
    a: 'Federal B-20 requires you to qualify at the greater of your contract rate + 2% or 5.25% (the "minimum qualifying rate"). It exists to make sure you can still afford payments if rates rise mid-term. Only federally regulated A-lenders enforce it — provincially regulated credit unions and B-lenders often do not.',
  },
  {
    q: 'How can I qualify for more house?',
    a: 'Three main levers:\n\n1. Reduce monthly debts — a $400/mo car payment costs you about $80,000 of mortgage qualification.\n2. Add a co-signer — blending incomes lowers your GDS/TDS ratios.\n3. Larger down payment — reduces the mortgage amount you need to qualify for, and if it takes you over 20% down you also drop CMHC insurance costs.',
  },
  {
    q: 'Should I use the "safe" number or the "max"?',
    a: 'The number this calculator shows is your MAX under A-lender rules — the bank ceiling. Your "safe" number depends on what else is in your budget: daycare, savings goals, travel, emergency reserves. A common rule: keep total housing cost below 30% of your take-home (post-tax) income for real financial breathing room.',
  },
  {
    q: 'What if I fail the stress test?',
    a: 'A-lenders will decline. Options: (1) reduce purchase price so you fit within stress-tested ratios, (2) increase down payment, (3) reduce other debts, (4) use a B-lender (rates 100–200 bps higher but no stress test), (5) add a co-signer. A broker can route the file — a single decline at your bank does not mean the deal is dead.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      title="How Much House Can You Afford?"
      subtitle="Real B-20 stress test math. GDS + TDS ratios, insured vs uninsured, rate sensitivity across 3 scenarios."
      accent="blue"
      eyebrow="Affordability · Ontario"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/six-minute-approval"
      ctaLabel="Get a real pre-approval"
      ctaHref="/six-minute-approval"
    >
      <AffordabilityCalc />
    </CalcChrome>
  );
}
