import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import CalcChrome from '../../components/calc/CalcChrome';
import PenaltyCalc from '../../components/calc/PenaltyCalc';

export const metadata = buildMetadata({
  title: 'Mortgage Penalty Calculator — IRD vs 3-Month Interest',
  description: 'Calculate the penalty to break your Canadian mortgage early. Full IRD (posted-rate differential) and 3-month interest formulas side-by-side, tuned for Big 6, monoline, and variable lenders.',
  slug: '/mortgage-penalty-calculator',
  keywords: [
    'mortgage penalty calculator Canada',
    'IRD penalty calculator',
    '3-month interest penalty',
    'break mortgage penalty Canada',
    'mortgage prepayment penalty',
  ],
});

const FAQ = [
  {
    q: 'What is the difference between IRD and 3-month interest?',
    a: 'IRD (Interest Rate Differential) = balance × (contract rate − comparable posted rate) × months remaining ÷ 12. Used by Big 6 fixed mortgages. Grows when your rate is well below current posted rates. Can be $10,000+ on a typical file.\n\n3-month interest = balance × (rate ÷ 12) × 3. Used by variable mortgages and many monolines. Typically $2,000–$5,000 on a typical file.\n\nBig 6 fixed mortgages charge the HIGHER of the two, which is almost always IRD.',
  },
  {
    q: 'Why is IRD so much bigger?',
    a: 'The "comparable posted rate" input is what makes IRD explosive. Banks use their POSTED rate (published on the website — no borrower actually gets it), which is typically 200 bps above their DISCOUNTED rates. That 200-bps gap gets multiplied by your balance and remaining months. On a $400k balance with 24 months remaining and a 200-bps posted-vs-discount gap, that adds $16,000 to your penalty.',
  },
  {
    q: 'Which lenders use IRD vs 3-month interest?',
    a: 'Fixed mortgages at Big 6 banks (RBC, TD, Scotia, BMO, CIBC, National): IRD, typically with posted rate. Monoline fixed (MCAP, First National, RMG, etc.): usually 3-month interest, sometimes IRD but with contract-vs-current rate rather than posted. Variable mortgages: almost always 3-month interest regardless of lender. Ask your lender for a written payout statement — it\'s the only accurate number.',
  },
  {
    q: 'Can I negotiate the penalty?',
    a: 'Almost never. Penalty formulas are contractual. What you CAN negotiate: (1) a partial prepayment (up to 15–20% annually) to reduce the balance the penalty is calculated on, (2) blend-and-extend at your current lender (no penalty), (3) sometimes the retention team will waive a portion of the penalty if you\'re threatening to leave to a competitor.',
  },
  {
    q: 'When is it worth paying the penalty?',
    a: 'When the interest saved over the remaining amortization exceeds the penalty. Use the Refinance Calculator — it computes the break-even month automatically. Rule of thumb: if break-even is before your remaining term ends, refinancing wins.',
  },
];

export default function Page() {
  return (
    <CalcChrome
      slug="/mortgage-penalty-calculator"
      title="Mortgage Penalty Calculator"
      subtitle="IRD vs 3-month interest, tuned for Big 6, monoline, and variable lenders. Side-by-side comparison."
      accent="red"
      eyebrow="Mortgage Penalty · Canada"
      breadcrumb={[{ label: 'Tools', href: '/tools' }, { label: 'Calculators', href: '/tools' }]}
      faq={FAQ}
      brokerPageSource="/refi-payout-plan"
      ctaLabel="Should you break? Get a broker review"
      ctaHref="/refi-payout-plan"
    >
      <PenaltyCalc />
    </CalcChrome>
  );
}
