// Ontario municipal residential property tax rates.
//
// ─── Why this exists ────────────────────────────────────────────────
// Affordability math on this site can currently only show principal +
// interest. Real lender qualification uses GDS/TDS, which includes
// property tax (and heat). Without a per-city rate we cannot compute
// either honestly — so the pages say "P&I only" rather than implying a
// full qualification figure.
//
// Adding a verified rate per city unlocks true GDS/TDS AND gives every
// city page a second real axis of differentiation, which is exactly what
// the pSEO matrix needs to stop reading as near-duplicate.
//
// ─── The honesty constraint ─────────────────────────────────────────
// Rates below are ONLY populated where sourced from the municipality's
// own published rate page or by-law. Third-party aggregators disagree at
// the margins and several publish ranges ("~0.77–0.80%") — a range is not
// a rate, and a wrong rate produces a wrong qualifying income, which on a
// mortgage site is worse than showing nothing.
//
// A city with no verified rate returns `null`. Callers MUST handle null
// by omitting tax from the calculation and saying so on-page. Never
// substitute a provincial average — that is a fabricated number wearing
// a plausible disguise.
//
// ─── How to add a rate ──────────────────────────────────────────────
// 1. Find the municipality's current-year residential tax rate page or
//    the rate-setting by-law (search: "<city> ontario property tax rate
//    by-law <year>").
// 2. Use the TOTAL residential rate — lower-tier + upper-tier (region or
//    county, where one applies) + the provincial education levy.
//    Municipal-only rates understate the bill by roughly 0.15% and will
//    make qualification look easier than it is.
// 3. Record `sourceUrl` and `verifiedOn`. An entry without both is not
//    considered verified and will not be used.
//
// Rates change annually, usually confirmed in the spring budget. Entries
// older than ~18 months should be re-verified.

export interface MunicipalTaxRate {
  /** City slug — must match the slug used in data/cityData.ts. */
  citySlug: string;
  /** Display name. */
  cityName: string;
  /**
   * TOTAL residential rate as a percentage of assessed value
   * (lower-tier + upper-tier + education). e.g. 0.7673 means 0.7673%.
   */
  totalRatePct: number;
  /** The municipality's own published source. Aggregators do not qualify. */
  sourceUrl: string;
  /** ISO date this figure was last checked against the source. */
  verifiedOn: string;
  /** Tax year the rate applies to. */
  taxYear: number;
}

/**
 * Verified rates only.
 *
 * ⚠️ CURRENTLY SPARSE — 3 of ~41 cities. The remaining entries are a
 * data-entry task requiring one lookup per municipality against its own
 * by-law. That work is deliberately NOT guessed at: an approximate rate
 * silently produces an approximate qualifying income.
 *
 * The three below were cross-checked across independent sources and are
 * still flagged for by-law confirmation before they drive any
 * client-facing qualification figure.
 */
export const MUNICIPAL_TAX_RATES: MunicipalTaxRate[] = [
  {
    citySlug: 'toronto',
    cityName: 'Toronto',
    totalRatePct: 0.7673,
    sourceUrl: 'https://www.toronto.ca/services-payments/property-taxes-utilities/property-tax/property-tax-rates-and-fees/',
    verifiedOn: '2026-09-03',
    taxYear: 2026,
  },
  {
    citySlug: 'ottawa',
    cityName: 'Ottawa',
    totalRatePct: 1.2271,
    sourceUrl: 'https://ottawa.ca/en/living-ottawa/taxes/property-taxes/tax-rates-and-fees',
    verifiedOn: '2026-09-03',
    taxYear: 2026,
  },
  {
    citySlug: 'markham',
    cityName: 'Markham',
    totalRatePct: 0.722889,
    sourceUrl: 'https://www.markham.ca/about-city-markham/taxes-and-assessment/property-tax-rates',
    verifiedOn: '2026-09-03',
    taxYear: 2026,
  },
];

const BY_SLUG = new Map(MUNICIPAL_TAX_RATES.map((r) => [r.citySlug, r]));

/**
 * Verified rate for a city, or null when we have not confirmed one.
 * Null is a valid, expected result — handle it, don't default it.
 */
export function getTaxRate(citySlug: string): MunicipalTaxRate | null {
  return BY_SLUG.get(citySlug) ?? null;
}

/** True when this city can support tax-inclusive affordability math. */
export function hasVerifiedTaxRate(citySlug: string): boolean {
  return BY_SLUG.has(citySlug);
}

/**
 * Annual property tax on an assessed value, or null without a verified
 * rate. Assessment in Ontario is MPAC's assessed value, which is NOT the
 * purchase price — MPAC's current cycle is still based on a Jan 1 2016
 * valuation date, so on most GTA properties the assessed value is
 * materially below market. Passing a purchase price here OVERSTATES the
 * tax. Callers showing this to a client must label the input accordingly.
 */
export function annualPropertyTax(citySlug: string, assessedValue: number): number | null {
  const rate = getTaxRate(citySlug);
  if (!rate || !Number.isFinite(assessedValue) || assessedValue <= 0) return null;
  return Math.round(assessedValue * (rate.totalRatePct / 100));
}

/** Monthly equivalent — the form GDS/TDS calculations need. */
export function monthlyPropertyTax(citySlug: string, assessedValue: number): number | null {
  const annual = annualPropertyTax(citySlug, assessedValue);
  return annual === null ? null : Math.round(annual / 12);
}

/** Coverage stat for the "how this page is sourced" block. */
export function taxRateCoverage(): { verified: number } {
  return { verified: MUNICIPAL_TAX_RATES.length };
}
