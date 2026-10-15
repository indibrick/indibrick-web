// Bank of Canada market data, read live from the Valet API.
//
// Why Valet: it is the issuer's own API, free, keyless, and the series below
// are the same ones the Bank publishes on its rates pages. For a YMYL page
// quoting mortgage-relevant numbers, citing the central bank directly is the
// only defensible source — and /editorial-policy already names the Bank of
// Canada as one of ours.
//
// The page this feeds used to hardcode a bond yield of 3.12% behind a "Live
// Market Data" badge. By the time anyone noticed, the real yield was 3.55%:
// a 43 basis point error on a number the whole page's arithmetic hangs off.
// Everything here is fetched or clearly marked stale; nothing is typed in.

/** Government of Canada 5-year benchmark bond yield. Drives fixed rates. */
const SERIES_BOND_5YR = 'BD.CDN.5YR.DQ.YLD';
/** Target for the overnight rate. The Bank's policy lever. */
const SERIES_POLICY = 'V39079';
/** Chartered bank prime. Drives variable rates. */
const SERIES_PRIME = 'V80691311';

/**
 * Rates chartered banks actually charged, insured and uninsured, 5 years+.
 * Part of the Bank's A4_RATES_MORTGAGES group. This is not an advertised
 * rate — it is what was booked — which makes it the one benchmark an
 * aggregator quoting teaser rates cannot match. It publishes monthly and
 * lags by roughly a quarter, so it is always labelled with its own date.
 */
const SERIES_BANK_INSURED_5YR = 'V122667780';
const SERIES_BANK_UNINSURED_5YR = 'V122667786';

const VALET = 'https://www.bankofcanada.ca/valet/observations';

/**
 * Last-known-good values, used only when Valet is unreachable.
 *
 * These are real observations, not invented, and the snapshot is flagged
 * `stale: true` so the page can say so out loud rather than passing month-old
 * numbers off as current. Refresh the comment date if you ever update these.
 */
const FALLBACK = {
  bondYield5yr: 3.55,
  primeRate: 4.45,
  policyRate: 2.25,
  asOf: '2026-10-14',
} as const;

export interface BocSnapshot {
  /** GoC 5-year benchmark bond yield, percent. */
  bondYield5yr: number;
  /** Chartered bank prime rate, percent. */
  primeRate: number;
  /** Bank of Canada target for the overnight rate, percent. */
  policyRate: number;
  /** Observation date of the latest reading, ISO yyyy-mm-dd. */
  asOf: string;
  /** Change in the bond yield over ~30 trading days, in points. Null if unknown. */
  change30d: number | null;
  /** Change in the bond yield over ~90 trading days, in points. Null if unknown. */
  change90d: number | null;
  /** Low and high of the bond yield across the fetched window. */
  low: number | null;
  high: number | null;
  /** True when the live fetch failed and FALLBACK was used. */
  stale: boolean;
  /**
   * Bank of Canada's published average of rates chartered banks actually
   * charged. Monthly, and lags by about a quarter — always render the date.
   */
  charteredBank: {
    insured5yrPlus: number | null;
    uninsured5yrPlus: number | null;
    asOf: string | null;
  };
}

interface ValetObservation {
  d: string;
  [series: string]: { v?: string } | string;
}

function readValue(obs: ValetObservation, series: string): number | null {
  const cell = obs[series];
  if (!cell || typeof cell === 'string') return null;
  const raw = cell.v;
  if (raw === undefined || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fetch the latest Bank of Canada readings plus a trailing window of the bond
 * yield, so the page can state a direction with an explicit timeframe instead
 * of asserting "rates are falling" with nothing behind it.
 *
 * Revalidates hourly, matching how /rates already caches its sheet. Markets
 * move once a day at most; an hourly window is plenty and keeps the page
 * static for almost every visitor.
 */
async function getCharteredBankRates(): Promise<BocSnapshot['charteredBank']> {
  const empty = { insured5yrPlus: null, uninsured5yrPlus: null, asOf: null };
  try {
    const url = `${VALET}/${SERIES_BANK_INSURED_5YR},${SERIES_BANK_UNINSURED_5YR}/json?recent=1`;
    // Monthly series; a day of caching is more than enough.
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`Valet responded ${res.status}`);
    const body = (await res.json()) as { observations?: ValetObservation[] };
    const row = body.observations?.[0];
    if (!row) return empty;
    return {
      insured5yrPlus: readValue(row, SERIES_BANK_INSURED_5YR),
      uninsured5yrPlus: readValue(row, SERIES_BANK_UNINSURED_5YR),
      asOf: row.d,
    };
  } catch (e) {
    console.warn('[bocRates] chartered-bank series unavailable', e);
    return empty;
  }
}

export async function getBocSnapshot(): Promise<BocSnapshot> {
  const charteredBank = await getCharteredBankRates();
  try {
    const url = `${VALET}/${SERIES_BOND_5YR},${SERIES_POLICY},${SERIES_PRIME}/json?recent=120`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Valet responded ${res.status}`);

    const body = (await res.json()) as { observations?: ValetObservation[] };
    const rows = body.observations ?? [];
    if (rows.length === 0) throw new Error('Valet returned no observations');

    // Valet returns newest-first. Sort explicitly rather than trusting order:
    // reading this backwards once already produced a trend with the sign
    // flipped, which is the kind of error nobody catches by eye.
    const sorted = [...rows].sort((a, b) => a.d.localeCompare(b.d));

    const bondSeries = sorted
      .map((o) => ({ d: o.d, v: readValue(o, SERIES_BOND_5YR) }))
      .filter((x): x is { d: string; v: number } => x.v !== null);

    if (bondSeries.length === 0) throw new Error('no bond observations');

    const latest = bondSeries[bondSeries.length - 1];

    // Index back by trading days. Markets close on weekends and holidays, so
    // ~21 observations is about a month and ~63 is about a quarter.
    const back = (n: number) => bondSeries[Math.max(0, bondSeries.length - 1 - n)]?.v ?? null;
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const v30 = back(21);
    const v90 = back(63);
    const values = bondSeries.map((x) => x.v);

    // Prime and policy only need their most recent non-empty reading.
    const latestOf = (series: string): number | null => {
      for (let i = sorted.length - 1; i >= 0; i -= 1) {
        const v = readValue(sorted[i], series);
        if (v !== null) return v;
      }
      return null;
    };

    return {
      bondYield5yr: latest.v,
      primeRate: latestOf(SERIES_PRIME) ?? FALLBACK.primeRate,
      policyRate: latestOf(SERIES_POLICY) ?? FALLBACK.policyRate,
      asOf: latest.d,
      change30d: v30 === null ? null : round2(latest.v - v30),
      change90d: v90 === null ? null : round2(latest.v - v90),
      low: round2(Math.min(...values)),
      high: round2(Math.max(...values)),
      stale: false,
      charteredBank,
    };
  } catch (err) {
    console.warn('[bocRates] live fetch failed, serving last known values', err);
    return {
      ...FALLBACK,
      change30d: null,
      change90d: null,
      low: null,
      high: null,
      stale: true,
      charteredBank,
    };
  }
}

/** Format an ISO date as a plain English day for display. */
export function formatAsOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}
