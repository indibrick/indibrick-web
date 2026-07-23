// Canadian mortgage engine — pure functions used by every calculator.
//
// Two things worth flagging up front:
//   1. Canadian mortgages compound SEMI-ANNUALLY, not monthly (the US
//      formula). Every payment calc here uses semi-annual conversion.
//      Getting this wrong makes results ~$40/mo off on a typical file —
//      the tell that a calculator was ported from a US template.
//   2. All rate inputs are expressed as percent numbers (4.29, not 0.0429).
//      Every function does the /100 conversion internally so callers
//      don't have to remember.
//
// Nothing here reads from window, Firestore, or the network — everything
// is a pure function. That means calculators can render server-side, run
// during SSR, and be unit-tested trivially.

// ─── Payment frequencies ──────────────────────────────────────────────

export type PaymentFrequency =
  | 'monthly'
  | 'semi-monthly'
  | 'bi-weekly'
  | 'accelerated-bi-weekly'
  | 'weekly'
  | 'accelerated-weekly';

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  'monthly': 'Monthly',
  'semi-monthly': 'Semi-Monthly',
  'bi-weekly': 'Bi-Weekly',
  'accelerated-bi-weekly': 'Accelerated Bi-Weekly',
  'weekly': 'Weekly',
  'accelerated-weekly': 'Accelerated Weekly',
};

export const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  'monthly': 12,
  'semi-monthly': 24,
  'bi-weekly': 26,
  'accelerated-bi-weekly': 26,
  'weekly': 52,
  'accelerated-weekly': 52,
};

// ─── Core payment math ────────────────────────────────────────────────

/**
 * Canadian mortgage payment per period.
 *
 * Semi-annual conversion: nominal annual rate → effective 6-month rate →
 * effective per-period rate. Standard for regulated Canadian A-lenders.
 *
 * Accelerated frequencies charge the equivalent monthly payment split
 * across more periods (bi-weekly gets 26 periods but each = monthly/2 —
 * that's why accelerated pays off faster: you make 13 monthly-equivalents
 * per year, not 12).
 */
export function calculatePayment(
  principal: number,
  annualRatePercent: number,
  amortYears: number,
  frequency: PaymentFrequency,
): number {
  if (principal <= 0 || amortYears <= 0) return 0;
  const rate = annualRatePercent / 100;
  const semiAnnualRate = Math.pow(1 + rate / 2, 2);

  // Accelerated variants are "monthly payment ÷ 2 (or ÷ 4)" — not a
  // straight per-period recalc. That's what makes them accelerated.
  if (frequency === 'accelerated-bi-weekly') {
    const monthlyPmt = calculateStandardPayment(principal, semiAnnualRate, amortYears, 12);
    return monthlyPmt / 2;
  }
  if (frequency === 'accelerated-weekly') {
    const monthlyPmt = calculateStandardPayment(principal, semiAnnualRate, amortYears, 12);
    return monthlyPmt / 4;
  }

  const periodsPerYear = PERIODS_PER_YEAR[frequency];
  return calculateStandardPayment(principal, semiAnnualRate, amortYears, periodsPerYear);
}

function calculateStandardPayment(
  principal: number,
  semiAnnualRate: number,
  amortYears: number,
  periodsPerYear: number,
): number {
  const periodicRate = Math.pow(semiAnnualRate, 1 / periodsPerYear) - 1;
  const totalPeriods = amortYears * periodsPerYear;
  if (periodicRate === 0) return principal / totalPeriods;
  return (principal * periodicRate) / (1 - Math.pow(1 + periodicRate, -totalPeriods));
}

// ─── Amortization schedule ────────────────────────────────────────────

export interface AmortRow {
  period: number;            // 1-indexed period number
  year: number;              // 1-indexed year (period bucketed)
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumInterest: number;
  cumPrincipal: number;
}

/**
 * Full amortization schedule at the given frequency.
 *
 * If `extraPayment` is supplied it's added to every regular payment as
 * pure principal reduction — the classic "how much faster do I pay off
 * if I add $200 to every payment" scenario.
 *
 * If `lumpSum` is supplied it's applied as a one-time principal
 * reduction after `lumpSumPeriod` periods (default: end of year 1).
 */
export function calculateAmortizationSchedule(opts: {
  principal: number;
  annualRatePercent: number;
  amortYears: number;
  frequency: PaymentFrequency;
  extraPayment?: number;
  lumpSum?: number;
  lumpSumPeriod?: number;
}): AmortRow[] {
  const {
    principal,
    annualRatePercent,
    amortYears,
    frequency,
    extraPayment = 0,
    lumpSum = 0,
    lumpSumPeriod = PERIODS_PER_YEAR[frequency], // default: end of year 1
  } = opts;

  const basePayment = calculatePayment(principal, annualRatePercent, amortYears, frequency);
  const periodsPerYear = PERIODS_PER_YEAR[frequency];
  const semiAnnualRate = Math.pow(1 + annualRatePercent / 100 / 2, 2);
  const periodicRate = Math.pow(semiAnnualRate, 1 / periodsPerYear) - 1;

  const rows: AmortRow[] = [];
  let balance = principal;
  let cumInterest = 0;
  let cumPrincipal = 0;
  const maxPeriods = amortYears * periodsPerYear + 12; // safety cap

  for (let p = 1; p <= maxPeriods && balance > 0.01; p++) {
    const interest = balance * periodicRate;
    let principalPortion = basePayment - interest + extraPayment;
    if (p === lumpSumPeriod) principalPortion += lumpSum;
    if (principalPortion > balance) principalPortion = balance;

    balance = Math.max(0, balance - principalPortion);
    cumInterest += interest;
    cumPrincipal += principalPortion;

    rows.push({
      period: p,
      year: Math.ceil(p / periodsPerYear),
      payment: basePayment + extraPayment,
      principal: principalPortion,
      interest,
      balance,
      cumInterest,
      cumPrincipal,
    });
  }

  return rows;
}

/** Bucket the schedule by year for the year-view UI. */
export interface AmortYearSummary {
  year: number;
  principal: number;
  interest: number;
  endingBalance: number;
}

export function bucketByYear(schedule: AmortRow[]): AmortYearSummary[] {
  const years = new Map<number, AmortYearSummary>();
  for (const row of schedule) {
    const existing = years.get(row.year);
    if (existing) {
      existing.principal += row.principal;
      existing.interest += row.interest;
      existing.endingBalance = row.balance;
    } else {
      years.set(row.year, {
        year: row.year,
        principal: row.principal,
        interest: row.interest,
        endingBalance: row.balance,
      });
    }
  }
  return Array.from(years.values());
}

// ─── CMHC premium (mortgage default insurance) ────────────────────────

/**
 * CMHC / Sagen / Canada Guaranty premium as a % of loan amount.
 * Tiers per CMHC 2024–26 schedule.
 * Returns 0 for 20%+ down (conventional / uninsured).
 */
export function calculateCMHCPremiumRate(loanToValuePercent: number): number {
  const ltv = loanToValuePercent;
  if (ltv <= 65) return 0.006;   // Not applicable in practice — 20%+ is uninsured
  if (ltv <= 75) return 0.017;
  if (ltv <= 80) return 0.024;
  if (ltv <= 85) return 0.028;
  if (ltv <= 90) return 0.031;
  if (ltv <= 95) return 0.040;
  return 0;
}

/** Returns 0 for 20%+ down (which is where the LTV threshold sits). */
export function calculateCMHCPremium(homePrice: number, downPayment: number): number {
  if (homePrice <= 0 || downPayment / homePrice >= 0.20) return 0;
  const loanAmount = homePrice - downPayment;
  const ltvPct = (loanAmount / homePrice) * 100;
  return loanAmount * calculateCMHCPremiumRate(ltvPct);
}

// ─── Land Transfer Tax (Ontario + Toronto MLTT) ───────────────────────

/** Ontario provincial LTT — marginal tiered. */
export function calculateOntarioLTT(price: number): number {
  if (price <= 0) return 0;
  let tax = 0;
  if (price > 2_000_000) tax += (price - 2_000_000) * 0.025;
  if (price > 400_000)   tax += (Math.min(price, 2_000_000) - 400_000) * 0.020;
  if (price > 250_000)   tax += (Math.min(price, 400_000) - 250_000) * 0.015;
  if (price > 55_000)    tax += (Math.min(price, 250_000) - 55_000) * 0.010;
  tax += Math.min(price, 55_000) * 0.005;
  return tax;
}

/** Toronto Municipal LTT — same marginal tiers as Ontario for single-family. */
export function calculateTorontoMLTT(price: number): number {
  if (price <= 0) return 0;
  let tax = 0;
  if (price > 20_000_000) tax += (price - 20_000_000) * 0.075;
  if (price > 10_000_000) tax += (Math.min(price, 20_000_000) - 10_000_000) * 0.065;
  if (price > 5_000_000)  tax += (Math.min(price, 10_000_000) - 5_000_000) * 0.055;
  if (price > 3_000_000)  tax += (Math.min(price, 5_000_000) - 3_000_000) * 0.045;
  if (price > 2_000_000)  tax += (Math.min(price, 3_000_000) - 2_000_000) * 0.035;
  if (price > 400_000)    tax += (Math.min(price, 2_000_000) - 400_000) * 0.020;
  if (price > 250_000)    tax += (Math.min(price, 400_000) - 250_000) * 0.015;
  if (price > 55_000)     tax += (Math.min(price, 250_000) - 55_000) * 0.010;
  tax += Math.min(price, 55_000) * 0.005;
  return tax;
}

/** First-time buyer LTT rebates — Ontario ($4,000) + Toronto ($4,475). */
export function firstTimeBuyerRebates(price: number, isToronto: boolean): { ontario: number; toronto: number } {
  const ontarioLTT = calculateOntarioLTT(price);
  const ontarioRebate = Math.min(4_000, ontarioLTT);
  const torontoRebate = isToronto ? Math.min(4_475, calculateTorontoMLTT(price)) : 0;
  return { ontario: ontarioRebate, toronto: torontoRebate };
}

/** Complete LTT calculation with optional FTHB rebate. */
export interface LTTResult {
  ontarioLTT: number;
  torontoLTT: number;
  totalLTT: number;
  ontarioRebate: number;
  torontoRebate: number;
  netPayable: number;
}

export function calculateLTT(opts: {
  price: number;
  isToronto: boolean;
  isFirstTimeBuyer: boolean;
}): LTTResult {
  const ontarioLTT = calculateOntarioLTT(opts.price);
  const torontoLTT = opts.isToronto ? calculateTorontoMLTT(opts.price) : 0;
  const totalLTT = ontarioLTT + torontoLTT;
  const rebates = opts.isFirstTimeBuyer
    ? firstTimeBuyerRebates(opts.price, opts.isToronto)
    : { ontario: 0, toronto: 0 };
  return {
    ontarioLTT,
    torontoLTT,
    totalLTT,
    ontarioRebate: rebates.ontario,
    torontoRebate: rebates.toronto,
    netPayable: Math.max(0, totalLTT - rebates.ontario - rebates.toronto),
  };
}

// ─── Stress test (qualifying rate) ────────────────────────────────────

/**
 * B-20 minimum qualifying rate = max(contract rate + 2%, 5.25%).
 * Applies to all federally regulated A-lender applications.
 */
export function stressTestRate(contractRatePercent: number): number {
  return Math.max(contractRatePercent + 2, 5.25);
}

// ─── Affordability (GDS + TDS) ────────────────────────────────────────

export interface AffordabilityInputs {
  householdIncome: number;      // Annual gross
  monthlyDebts: number;         // Existing debt payments (car, LOC, credit cards min)
  downPayment: number;
  contractRatePercent: number;  // What they'd fund at
  amortYears: number;
  propertyTaxAnnual?: number;   // If unknown, use ~0.75% of home price default
  heatingMonthly?: number;      // Default $150
  condoFeesMonthly?: number;    // Default 0 for non-condo
  gdsCap?: number;              // Default 39%
  tdsCap?: number;              // Default 44%
  useStressTest?: boolean;      // Default true — required for A-lender
}

export interface AffordabilityResult {
  qualifyingRate: number;
  maxMortgageGDS: number;
  maxMortgageTDS: number;
  maxMortgage: number;
  maxPurchasePrice: number;
  monthlyPaymentAtMax: number;
  gdsUsed: number;
  tdsUsed: number;
}

/**
 * Solve for the maximum mortgage principal that keeps GDS + TDS under
 * their respective caps, then back out max purchase price = principal +
 * down payment.
 *
 * The math iterates because condo fees and property tax scale with
 * purchase price — a closed-form solution would need to solve a
 * quadratic. Bisection is simpler and converges in ~30 steps.
 */
export function calculateAffordability(inputs: AffordabilityInputs): AffordabilityResult {
  const gdsCap = inputs.gdsCap ?? 0.39;
  const tdsCap = inputs.tdsCap ?? 0.44;
  const heatingMonthly = inputs.heatingMonthly ?? 150;
  const condoFeesMonthly = inputs.condoFeesMonthly ?? 0;
  const useStressTest = inputs.useStressTest ?? true;
  const qualRate = useStressTest ? stressTestRate(inputs.contractRatePercent) : inputs.contractRatePercent;

  const monthlyIncome = inputs.householdIncome / 12;
  const gdsBudget = monthlyIncome * gdsCap;
  const tdsBudget = monthlyIncome * tdsCap - inputs.monthlyDebts;
  const housingBudget = Math.min(gdsBudget, tdsBudget);
  if (housingBudget <= 0) {
    return { qualifyingRate: qualRate, maxMortgageGDS: 0, maxMortgageTDS: 0, maxMortgage: 0, maxPurchasePrice: 0, monthlyPaymentAtMax: 0, gdsUsed: 0, tdsUsed: 0 };
  }

  // Bisect for max purchase price.
  let lo = inputs.downPayment;
  let hi = 5_000_000;
  const propertyTaxRate = 0.0075; // Default 0.75% — Ontario average

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const propertyTaxMonthly = ((inputs.propertyTaxAnnual ?? mid * propertyTaxRate)) / 12;
    const mortgagePrincipal = Math.max(0, mid - inputs.downPayment);
    const mortgagePayment = calculatePayment(mortgagePrincipal, qualRate, inputs.amortYears, 'monthly');
    const housingCost = mortgagePayment + propertyTaxMonthly + heatingMonthly + (condoFeesMonthly * 0.5);

    if (housingCost > housingBudget) hi = mid;
    else lo = mid;
    if (Math.abs(hi - lo) < 100) break;
  }

  const maxPurchasePrice = lo;
  const maxMortgage = Math.max(0, maxPurchasePrice - inputs.downPayment);
  const monthlyPaymentAtMax = calculatePayment(maxMortgage, qualRate, inputs.amortYears, 'monthly');
  const propertyTaxMonthly = ((inputs.propertyTaxAnnual ?? maxPurchasePrice * propertyTaxRate)) / 12;
  const housingCost = monthlyPaymentAtMax + propertyTaxMonthly + heatingMonthly + (condoFeesMonthly * 0.5);
  const gdsUsed = housingCost / monthlyIncome;
  const tdsUsed = (housingCost + inputs.monthlyDebts) / monthlyIncome;

  return {
    qualifyingRate: qualRate,
    maxMortgageGDS: maxMortgage,
    maxMortgageTDS: maxMortgage,
    maxMortgage,
    maxPurchasePrice,
    monthlyPaymentAtMax,
    gdsUsed,
    tdsUsed,
  };
}

// ─── IRD penalty (fixed-rate mortgages) ───────────────────────────────

/**
 * Interest Rate Differential penalty — used by Big 6 fixed-rate mortgages.
 * IRD = balance × (contract_rate − comparable_posted_rate) × months_remaining / 12
 *
 * "Comparable posted rate" = lender's current posted rate for the term
 * closest to (but not exceeding) the remaining months on the mortgage.
 * That's how banks manufacture large penalties — posted rates are ~200
 * bps above discount rates.
 */
export function calculateIRDPenalty(opts: {
  balance: number;
  contractRatePercent: number;
  comparableRatePercent: number;
  monthsRemaining: number;
}): number {
  const { balance, contractRatePercent, comparableRatePercent, monthsRemaining } = opts;
  const rateDiff = Math.max(0, (contractRatePercent - comparableRatePercent) / 100);
  return balance * rateDiff * (monthsRemaining / 12);
}

/** 3-month interest penalty — used by variable and some fixed monolines. */
export function calculate3MonthInterestPenalty(balance: number, ratePercent: number): number {
  const monthlyRate = ratePercent / 100 / 12;
  return balance * monthlyRate * 3;
}

// ─── HST rebate (new home / pre-con) ─────────────────────────────────

/**
 * New Housing HST Rebate for Ontario. The provincial portion is the
 * larger of the two components. Federal portion phases out fully above
 * $450,000. Numbers reflect Canada Revenue Agency rebate schedule.
 */
export interface HSTRebateResult {
  federalRebate: number;      // 36% of the 5% federal HST, capped
  ontarioRebate: number;      // 75% of the 8% provincial HST, capped at $24,000
  totalRebate: number;
  netHST: number;
}

export function calculateHSTRebate(pricePreHST: number): HSTRebateResult {
  // Federal portion: 5% GST
  const federalGST = pricePreHST * 0.05;
  let federalRebate = 0;
  if (pricePreHST <= 350_000) {
    federalRebate = federalGST * 0.36;
  } else if (pricePreHST < 450_000) {
    // Phase-out
    federalRebate = (federalGST * 0.36) * ((450_000 - pricePreHST) / 100_000);
  }
  federalRebate = Math.max(0, Math.min(federalRebate, 6_300));

  // Ontario portion: 8% provincial HST — 75% rebate, capped at $24,000.
  const ontarioHST = pricePreHST * 0.08;
  const ontarioRebate = Math.min(24_000, ontarioHST * 0.75);

  const totalRebate = federalRebate + ontarioRebate;
  const netHST = pricePreHST * 0.13 - totalRebate;
  return { federalRebate, ontarioRebate, totalRebate, netHST };
}

// ─── Reverse mortgage (55+ homeowners) ────────────────────────────────

/**
 * Reverse mortgage available amount — up to 55% of home value, tuned by
 * borrower age (older = higher %). Rough industry-standard curve; each
 * lender publishes their own age×LTV table.
 */
export function calculateReverseMortgageAmount(opts: {
  homeValue: number;
  youngestBorrowerAge: number;
}): number {
  const { homeValue, youngestBorrowerAge: age } = opts;
  if (age < 55 || homeValue <= 0) return 0;
  // Approximate age × LTV curve (industry-standard shape).
  let maxLTV = 0.15;
  if (age >= 55 && age < 60)  maxLTV = 0.20;
  if (age >= 60 && age < 65)  maxLTV = 0.27;
  if (age >= 65 && age < 70)  maxLTV = 0.35;
  if (age >= 70 && age < 75)  maxLTV = 0.42;
  if (age >= 75 && age < 80)  maxLTV = 0.48;
  if (age >= 80)              maxLTV = 0.55;
  return homeValue * maxLTV;
}

/** Reverse mortgage balance projection at annual compounding. */
export function projectReverseMortgageBalance(opts: {
  initialAmount: number;
  annualRatePercent: number;
  years: number;
}): { year: number; balance: number }[] {
  const { initialAmount, annualRatePercent, years } = opts;
  const rate = annualRatePercent / 100;
  const rows: { year: number; balance: number }[] = [];
  for (let y = 0; y <= years; y++) {
    rows.push({ year: y, balance: initialAmount * Math.pow(1 + rate, y) });
  }
  return rows;
}

// ─── Trigger rate (variable mortgages) ────────────────────────────────

/**
 * Trigger rate = the rate at which a variable-rate borrower's monthly
 * payment no longer covers the interest. At trigger, unpaid interest
 * starts accruing to principal (negative amortization) until the lender
 * intervenes.
 *
 * Formula: trigger_rate = (payment × periods_per_year) / balance × 100
 * Assumes standard variable with fixed payment structure.
 */
export function calculateTriggerRate(opts: {
  currentBalance: number;
  monthlyPayment: number;
}): number {
  if (opts.currentBalance <= 0) return 0;
  return (opts.monthlyPayment * 12 / opts.currentBalance) * 100;
}

// ─── Closing costs (Ontario purchase) ────────────────────────────────

/**
 * Estimate typical closing costs on an Ontario residential purchase.
 * Numbers are budget-level estimates; actual costs vary by lawyer,
 * property, and specific lender requirements.
 */
export interface ClosingCostsResult {
  landTransferTax: number;
  legalFees: number;
  titleInsurance: number;
  appraisal: number;
  homeInspection: number;
  pstOnCMHC: number;
  adjustments: number;
  cmhcPremium: number;
  totalCashRequired: number;
}

export function calculateClosingCosts(opts: {
  price: number;
  downPayment: number;
  isToronto: boolean;
  isFirstTimeBuyer: boolean;
  isNewBuild?: boolean;
}): ClosingCostsResult {
  const { price, downPayment, isToronto, isFirstTimeBuyer, isNewBuild = false } = opts;
  const ltt = calculateLTT({ price, isToronto, isFirstTimeBuyer });
  const cmhcPremium = calculateCMHCPremium(price, downPayment);
  // Ontario 8% PST on CMHC premium is paid up front in cash — one of the
  // most-forgotten closing costs.
  const pstOnCMHC = cmhcPremium * 0.08;

  const legalFees = 1_800;             // Typical Ontario lawyer + disbursements
  const titleInsurance = 300;          // One-time
  const appraisal = isNewBuild ? 0 : 500;
  const homeInspection = isNewBuild ? 0 : 500;
  const adjustments = 1_500;           // Property tax + utility adjustments to closing date

  return {
    landTransferTax: ltt.netPayable,
    legalFees,
    titleInsurance,
    appraisal,
    homeInspection,
    pstOnCMHC,
    adjustments,
    cmhcPremium, // Financed into mortgage but shown as reference
    totalCashRequired: ltt.netPayable + legalFees + titleInsurance + appraisal + homeInspection + pstOnCMHC + adjustments,
  };
}

// ─── Currency formatting helper ───────────────────────────────────────

/** Format a number as Canadian dollars — $XXX,XXX with no cents unless small. */
export function formatCAD(n: number, opts?: { cents?: boolean }): string {
  if (!isFinite(n)) return '$0';
  const abs = Math.abs(n);
  const showCents = opts?.cents ?? (abs > 0 && abs < 100);
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: showCents ? 2 : 0,
    minimumFractionDigits: showCents ? 2 : 0,
  }).format(n);
}

/** Format a percent (already 0-100) with 2 decimals. */
export function formatPercent(n: number, decimals = 2): string {
  if (!isFinite(n)) return '0.00%';
  return `${n.toFixed(decimals)}%`;
}
