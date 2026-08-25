// Pure helpers + constants extracted from app/partner/page.tsx during
// the Phase 1 componentization. All functions here must be:
//   - Pure (no closures over component state, no side effects)
//   - Referentially stable across renders (defined at module scope)
//
// The module-scope discipline is what lets React.memo on downstream
// cards short-circuit re-renders — see the comment in DealListCard
// about why hoisting matters.

import type { CSSProperties } from 'react';

// A referral's status is "won" if it matches one of these labels.
// Kept as a plain array (not a Set) because .includes() over 5 items
// is faster than a Set lookup and the memo chain hits this often.
export const FUNDED_STATUSES = [
  'Funded',
  'Closed',
  'Firm Sale',
  'Firm / Conditional',
  'Funded / Paid',
  'Bound',        // Insurance: policy is bound + in-force
  'Renewed',      // Insurance: renewal transacted
];

export const LOST_STATUSES = ['Declined', 'Lost', 'Cancelled'];

// Insurance-specific pipeline. Mortgage flows through Contacted →
// Underwriting → Approved → Funded; insurance flows through Contacted
// → Quoted → Bound → Renewed. Different vocabulary, different SLA
// tempo (insurance quotes bind in days, not weeks).
export const INSURANCE_STAGES = [
  'New',
  'Contacted',
  'Quoted',
  'Bound',
  'Renewed',
  'Cancelled',
  'Lost',
] as const;

// Insurance coverage taxonomy — matches what Ontario carriers write.
// 'Bundle' captures multi-line quotes (Home + Auto) which is the
// primary cross-sell insurance carriers reward with 15-20% discounts.
export const INSURANCE_COVERAGE_TYPES = [
  'Home',
  'Auto',
  'Life',
  'Disability',
  'Critical Illness',
  'Bundle',
] as const;

export type InsuranceCoverageType = typeof INSURANCE_COVERAGE_TYPES[number];

// Referral source labels — drives compensation: who (if anyone) gets
// paid out on a file.
export const REFERRAL_SOURCES = [
  'Realtor Partner',
  'Other Partner',
  'Self-Generated',
  'Web Lead',
];

// Browser-level paint/layout skip for off-screen cards. Combined with
// React.memo on the card itself, this turns a 981-card list into
// something the browser only paints ~15 of at any moment.
export const CARD_VIRTUAL_STYLE: CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '0 200px',
};

export function formatCurrency(n: number): string {
  if (!n || isNaN(n)) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// Heuristic 0–100 deal score. Pure function of the referral doc + a
// couple of derived signals (days-in-stage, callCount). No async, no
// lookups — safe to call from a hot memo. Higher = warmer/more likely
// to close.
// Component weights (must sum to 100):
//   Recency (days in stage)         40
//   Engagement (calls + timeline)   25
//   SLA health                      15
//   Deal size                       10
//   Contact completeness            10
export function computeDealScore(
  deal: any,
  daysInStage: number,
  slaBreached: boolean,
): { score: number; band: 'red' | 'amber' | 'green'; hint: string } {
  const status = String(deal.status || '');
  if (FUNDED_STATUSES.includes(status)) {
    return { score: 100, band: 'green', hint: 'Closed / funded' };
  }
  if (LOST_STATUSES.includes(status)) {
    return { score: 0, band: 'red', hint: 'Terminal loss' };
  }

  // Recency: 0 days = full 40, 14+ days = 0.
  const recency = Math.max(0, 40 - (daysInStage / 14) * 40);

  // Engagement: calls up to 5 + timeline notes up to 10.
  const callCount = Number(deal.callCount || 0);
  const timelineLen = Array.isArray(deal.timeline) ? deal.timeline.length : 0;
  const engagement = Math.min(15, callCount * 3) + Math.min(10, timelineLen);

  const sla = slaBreached ? 0 : 15;

  const value = Number(deal.loanAmount || deal.estimatedVolume || 0);
  // 250k → ~5, 1M → 10 (cap).
  const size = Math.min(10, Math.round((value / 1_000_000) * 10));

  const hasPhone = !!deal.clientPhone;
  const hasEmail = !!deal.clientEmail;
  const contact = (hasPhone ? 5 : 0) + (hasEmail ? 5 : 0);

  const score = Math.max(0, Math.min(100, Math.round(recency + engagement + sla + size + contact)));
  const band: 'red' | 'amber' | 'green' = score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red';
  const hint =
    band === 'green' ? 'Warm — keep pace'
    : band === 'amber' ? (slaBreached ? 'SLA breach dragging score' : 'Cooling — schedule a touch')
    : (daysInStage > 14 ? 'Stale — needs a touch or a status update' : 'Weak signal — verify contact + follow up');
  return { score, band, hint };
}

export function stageAgeStyle(days: number): string {
  if (days <= 2) return 'bg-green-50 text-green-700 border-green-200';
  if (days <= 6) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

// ─── Intake wizard shared shapes ─────────────────────────────────────

export type OtherProperty = {
  address: string;
  value: string;
  balance: string;
  rent: string;
  payment: string;
};

// Pristine intake state — every client starts from a fresh clone of
// this via structuredClone so one client's answers never bleed into
// another's. The nested `otherPropertiesList` array is the reason
// spreading isn't enough.
export const BLANK_INTAKE = {
  goal: 'Purchase' as 'Purchase' | 'Refinance' | 'Renewal Transfer',
  fthb: 'No' as 'Yes' | 'No' | 'Not Sure',
  // subject property
  subjectAddress: '',
  propertyValue: '',          // purchase price OR estimated market value depending on goal
  propertyTaxes: '',
  hasRentalIncome: 'No' as 'Yes' | 'No',
  monthlyRent: '',
  basementStatus: 'Not Sure' as 'Legal' | 'Not Legal' | 'Not Sure',
  // purchase-only
  downPayment: '',
  downPaymentSource: 'Savings' as 'Savings' | 'Gift' | 'RRSP HBP' | 'Sale of Property' | 'Other',
  // refi/renewal only
  currentLender: '',
  currentBalance: '',
  currentRate: '',
  renewalDate: '',
  // applicants
  numApplicants: '1' as '1' | '2' | '3+',
  creditScore: '680-749' as '750+' | '680-749' | '600-679' | 'Below 600' | 'Not Sure',
  empType: 'T4 / Salaried' as 'T4 / Salaried' | 'Self-Employed / Business Owner' | 'Hourly / Part-Time',
  annualIncome: '',
  incomeYear1: '',
  incomeYear2: '',
  coEmpType: 'T4 / Salaried' as 'T4 / Salaried' | 'Self-Employed / Business Owner' | 'Hourly / Part-Time',
  coAnnualIncome: '',
  coIncomeYear1: '',
  coIncomeYear2: '',
  // liabilities
  monthlyDebtPayments: '',
  substantialDebts: '',
  otherPropertiesList: [] as OtherProperty[],
};

export type IntakeData = typeof BLANK_INTAKE;
