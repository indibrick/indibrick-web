// lib/canadianMortgageMath.ts
//
// Federal + Ontario mortgage rules, encoded exactly. Every constant in this
// file is a published rule (Department of Finance Canada, CMHC, OSFI B-20,
// Ontario Land Transfer Tax Act, City of Toronto MLTT by-law) — none of it is
// an estimate, a model output, or a seeded number.
//
// WHY THIS EXISTS: the /real-estate/[city]/[type]/[priceRange] matrix had no
// content that actually varied with the price band. Two pages that differed
// only by band rendered the same paragraphs with a different dollar token.
// The rules below genuinely change at $500K, $1M and $1.5M — minimum down
// payment, insurability, amortization ceiling, CMHC premium and land transfer
// tax all step — so a band page built on them is materially different content,
// not a variable swap.
//
// Rule currency: reflects the Dec 15 2024 federal changes (insured price cap
// raised to $1.5M; 30-year insured amortization for first-time buyers and
// newly built homes) and the Jan 1 2024 Toronto MLTT luxury brackets.

/** OSFI B-20 minimum qualifying rate: greater of contract rate + 2% or 5.25%. */
export const B20_FLOOR_RATE_PCT = 5.25;

/** Highest purchase price CMHC/Sagen/Canada Guaranty will insure. */
export const MAX_INSURABLE_PRICE = 1_500_000;

/**
 * Canadian mortgages are compounded SEMI-ANNUALLY, not monthly. The previous
 * matrix-page math used `annualRate / 12`, which overstates the payment by
 * roughly 1% — small in dollars but wrong, and wrong in a way a mortgage
 * brokerage should never publish. Correct conversion:
 *   monthlyRate = (1 + annualRate / 2) ^ (1/6) - 1
 */
export function effectiveMonthlyRate(annualRatePct: number): number {
  return Math.pow(1 + annualRatePct / 100 / 2, 1 / 6) - 1;
}

/** Level monthly payment on a Canadian (semi-annually compounded) mortgage. */
export function monthlyPayment(principal: number, annualRatePct: number, amortYears: number): number {
  if (principal <= 0) return 0;
  const i = effectiveMonthlyRate(annualRatePct);
  const n = amortYears * 12;
  if (i === 0) return principal / n;
  return (principal * i) / (1 - Math.pow(1 + i, -n));
}

/** OSFI B-20 stress-test rate for a given contract rate. */
export function stressTestRate(contractRatePct: number): number {
  return Math.max(contractRatePct + 2, B20_FLOOR_RATE_PCT);
}

/**
 * Federal minimum down payment.
 *   ≤ $500,000            → 5%
 *   $500,000 – $1,499,999 → 5% of the first $500K + 10% of the remainder
 *   ≥ $1,500,000          → 20% (no default insurance available)
 */
export function minDownPayment(price: number): number {
  if (price >= MAX_INSURABLE_PRICE) return price * 0.20;
  if (price <= 500_000) return price * 0.05;
  return 25_000 + (price - 500_000) * 0.10;
}

/** True when default insurance is available at all for this purchase price. */
export function isInsurable(price: number): boolean {
  return price < MAX_INSURABLE_PRICE;
}

/**
 * CMHC premium rate as a percentage of the loan amount, by loan-to-value.
 * Returns null when the mortgage is conventional (≥20% down) or the price is
 * above the insurable ceiling — in both cases no premium is payable.
 */
export function cmhcPremiumRatePct(price: number, downPayment: number): number | null {
  if (!isInsurable(price)) return null;
  const ltv = (price - downPayment) / price;
  if (ltv <= 0.80) return null;
  if (ltv <= 0.85) return 2.80;
  if (ltv <= 0.90) return 3.10;
  if (ltv <= 0.95) return 4.00;
  return null; // below the 5% federal minimum — not a valid file
}

/** Maximum amortization. 25 years insured, 30 for FTHB / new builds, 30 uninsured. */
export function maxAmortizationYears(price: number, downPayment: number, firstTimeOrNewBuild: boolean): number {
  const conventional = downPayment / price >= 0.20;
  if (conventional || !isInsurable(price)) return 30;
  return firstTimeOrNewBuild ? 30 : 25;
}

// ─── Land transfer tax ───

interface Bracket { upTo: number; rate: number }

// Ontario LTT, single/two single-family residence rates.
const ONTARIO_LTT_BRACKETS: Bracket[] = [
  { upTo: 55_000, rate: 0.005 },
  { upTo: 250_000, rate: 0.010 },
  { upTo: 400_000, rate: 0.015 },
  { upTo: 2_000_000, rate: 0.020 },
  { upTo: Infinity, rate: 0.025 },
];

// City of Toronto MLTT — mirrors the provincial schedule to $2M, then the
// luxury brackets introduced Jan 1 2024.
const TORONTO_MLTT_BRACKETS: Bracket[] = [
  { upTo: 55_000, rate: 0.005 },
  { upTo: 250_000, rate: 0.010 },
  { upTo: 400_000, rate: 0.015 },
  { upTo: 2_000_000, rate: 0.020 },
  { upTo: 3_000_000, rate: 0.025 },
  { upTo: 4_000_000, rate: 0.035 },
  { upTo: 5_000_000, rate: 0.045 },
  { upTo: 10_000_000, rate: 0.055 },
  { upTo: 20_000_000, rate: 0.065 },
  { upTo: Infinity, rate: 0.075 },
];

function marginalTax(price: number, brackets: Bracket[]): number {
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (price <= prev) break;
    tax += (Math.min(price, b.upTo) - prev) * b.rate;
    prev = b.upTo;
  }
  return tax;
}

export function ontarioLandTransferTax(price: number): number {
  return marginalTax(price, ONTARIO_LTT_BRACKETS);
}

export function torontoMunicipalLandTransferTax(price: number): number {
  return marginalTax(price, TORONTO_MLTT_BRACKETS);
}

/** Maximum Ontario first-time-buyer LTT refund. */
export const ONTARIO_FTHB_REFUND_MAX = 4_000;
/** Maximum City of Toronto first-time-buyer MLTT refund. */
export const TORONTO_FTHB_REFUND_MAX = 4_475;

/**
 * Everything a band page needs to say something true and band-specific.
 * `citySlug === 'toronto'` triggers the municipal LTT layer.
 */
export interface BandMath {
  price: number;
  minDown: number;
  minDownPct: number;
  insurable: boolean;
  cmhcPremiumPct: number | null;
  cmhcPremium: number;
  /** Mortgage principal at minimum down, premium capitalized where applicable. */
  insuredPrincipal: number;
  /** Mortgage principal at 20% down (conventional). */
  conventionalPrincipal: number;
  maxAmortInsured: number;
  contractRatePct: number;
  qualifyingRatePct: number;
  /** Payment on the conventional principal at the contract rate, 25-yr amortization. */
  paymentAtContract: number;
  /** Same principal at the B-20 qualifying rate — what the lender actually tests. */
  paymentAtQualifying: number;
  /**
   * Payment at the qualifying rate on the mortgage you'd actually carry at the
   * MINIMUM down payment — i.e. the insured principal with the CMHC premium
   * capitalized, or the conventional principal where insurance is unavailable.
   * Pairs correctly with `minDown` in a table; `paymentAtQualifying` assumes 20% down.
   */
  paymentAtQualifyingMinDown: number;
  provincialLtt: number;
  municipalLtt: number;
  totalLtt: number;
  fthbRefund: number;
}

export function computeBandMath(price: number, contractRatePct: number, citySlug: string): BandMath {
  const minDown = Math.round(minDownPayment(price));
  const insurable = isInsurable(price);
  const cmhcPremiumPct = cmhcPremiumRatePct(price, minDown);
  const baseInsuredPrincipal = price - minDown;
  const cmhcPremium = cmhcPremiumPct ? Math.round(baseInsuredPrincipal * (cmhcPremiumPct / 100)) : 0;
  const conventionalPrincipal = Math.round(price * 0.80);
  const qualifyingRatePct = stressTestRate(contractRatePct);
  const isToronto = citySlug === 'toronto';
  const provincialLtt = Math.round(ontarioLandTransferTax(price));
  const municipalLtt = isToronto ? Math.round(torontoMunicipalLandTransferTax(price)) : 0;
  const insuredPrincipal = baseInsuredPrincipal + cmhcPremium;
  const minDownPrincipal = cmhcPremiumPct ? insuredPrincipal : conventionalPrincipal;

  return {
    price,
    minDown,
    minDownPct: Math.round((minDown / price) * 1000) / 10,
    insurable,
    cmhcPremiumPct,
    cmhcPremium,
    insuredPrincipal,
    conventionalPrincipal,
    maxAmortInsured: maxAmortizationYears(price, minDown, true),
    contractRatePct,
    qualifyingRatePct,
    paymentAtContract: Math.round(monthlyPayment(conventionalPrincipal, contractRatePct, 25)),
    paymentAtQualifying: Math.round(monthlyPayment(conventionalPrincipal, qualifyingRatePct, 25)),
    paymentAtQualifyingMinDown: Math.round(monthlyPayment(minDownPrincipal, qualifyingRatePct, 25)),
    provincialLtt,
    municipalLtt,
    totalLtt: provincialLtt + municipalLtt,
    fthbRefund:
      Math.min(ONTARIO_FTHB_REFUND_MAX, provincialLtt) +
      (isToronto ? Math.min(TORONTO_FTHB_REFUND_MAX, municipalLtt) : 0),
  };
}

/** Consistent CAD formatting across every page that consumes this module. */
export function cad(n: number): string {
  return `$${Math.round(n).toLocaleString('en-CA')}`;
}
