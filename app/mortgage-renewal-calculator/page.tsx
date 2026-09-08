import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import RenewalCalc from '../../components/calc/RenewalCalc';

export const metadata = buildMetadata({
  title: 'Mortgage Renewal Calculator — Bank Offer vs Broker Channel',
  description: 'Compare your bank\'s renewal offer against today\'s broker-channel rates. See monthly savings, term interest saved, and end-of-term balance delta. Free FSRA-licensed broker review.',
  slug: '/mortgage-renewal-calculator',
  keywords: [
    'mortgage renewal calculator Canada',
    'mortgage renewal calculator Ontario',
    'renewal rate comparison',
    'switch lenders at renewal',
    'bank vs broker renewal',
    '120 day rate hold',
  ],
});

const FAQ = [
  {
    q: 'Should I switch mortgage lenders at renewal?',
    a: 'Most Canadians should shop. Bank renewal offers are typically 20–100 bps above broker-channel best. On a $400,000 balance over a 5-year term, that gap is $15,000–$40,000 in interest. Switching an insured mortgage is essentially free (new lender covers legal + discharge); uninsured switches cost $500–$1,000 in legal fees.',
  },
  {
    q: 'What is the 120-day rate hold?',
    a: 'Every A-lender in Canada will lock a rate for up to 120 days before your maturity date at no cost. If rates rise, you\'re protected. If rates drop, you take the lower rate. This is the single most valuable free option in the mortgage lifecycle — and it disappears the day your renewal auto-executes.',
  },
  {
    q: 'What if my bank offers to match the broker rate?',
    a: 'This is called retention. Bank retention teams have discretion to match up to 20–40 bps below their initial offer. Two things matter: (1) you must ASK — retention rates are not offered proactively, (2) you need a competing quote in writing to force the match. A broker gives you that quote.',
  },
  {
    q: 'What is blend-and-extend?',
    a: 'Your current lender takes your existing rate + a new higher rate, weighted-averages them, and re-extends your term. Zero penalty. Useful when you want to lock more term without breaking. Bank retention offers it grudgingly — usually only if you ask by name.',
  },
  {
    q: 'Does the calculator account for the mortgage penalty?',
    a: 'No — this calculator compares the renewal-day math (bank offer vs broker rate). If you\'re considering breaking EARLY (before maturity), use the Mortgage Penalty Calculator to compute IRD vs 3-month interest, then compare that penalty against the interest savings from the lower rate.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      slug="/mortgage-renewal-calculator"
      title="Mortgage Renewal Calculator"
      subtitle="Your bank's renewal offer vs today's broker-channel best. See the monthly + total interest delta over the term."
      accent="blue"
      eyebrow="Renewal · Ontario"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/renewal-rescue"
      ctaLabel="Get a free Renewal Rescue Report"
      ctaHref="/renewal-rescue"
    >
      <RenewalCalc />
    </CalcChrome>
  );
}
