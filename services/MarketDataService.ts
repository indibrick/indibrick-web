// services/MarketDataService.ts
//
// Provides per-cell market data for the pSEO matrix.
//
// CURRENT STATE: every figure returned by this service is a real CREA MLS® HPI
//   benchmark parsed out of data/market/. There is no synthetic fallback. When
//   we have no CREA coverage for a (city × type) the snapshot reports
//   hasRealData=false and the page must not publish a number.
//
//   This is a deliberate reversal of the previous design, which returned
//   deterministic pseudo-random "median price / active listings / days on
//   market / comparables" for all 800 matrix cells. Those figures were seeded
//   from the URL string, so `activeListings` on
//   /real-estate/king-city/condo/1-1.5m ("71 active") was a hash of the slug,
//   not a count of anything. Publishing them as market facts was both an
//   accuracy problem for a licensed brokerage and the clearest possible
//   "programmatically generated, no added value" signal to Google.
//
// WHAT'S STILL MISSING (and what it would unlock):
//   - Active inventory counts, days-on-market, sale-to-list ratios, and real
//     comparable listings require an MLS feed. Options:
//        · CREA DDF (national MLS distribution — requires REALTOR® membership)
//        · Repliers (https://repliers.com — REST over CREA/TRREB, simplest auth)
//        · TRREB VOW/IDX feed (GTA only, board-member gated)
//     Wire one of these and re-add the fields as REAL data; until then the
//     templates render "not published" rather than a number.
//   - Municipal property tax rates (needed for true GDS/TDS qualifying math).
//     Source: each municipality's annual by-law / MPAC.

import { PROPERTY_TYPES, PRICE_RANGES, getPriceRangeBySlug, getTypeBySlug } from '../data/matrixData';
import { CITIES } from '../data/cityData';
import { getMarketData } from '../lib/marketData/loader';
import { fetchListingStats, repliersTypeFor, isRepliersConfigured } from '../lib/repliersClient';
import type { BenchmarkPoint } from '../lib/marketData/loader';
import type { TRREBAggregate } from '../lib/marketData/parseTRREB';

export interface MarketSnapshot {
  citySlug: string;
  cityName: string;
  typeSlug: string;
  typeLabel: string;
  priceRangeSlug: string;
  priceRangeLabel: string;

  /**
   * The real CREA MLS® HPI benchmark for this city's region × property type.
   * Null when the city has no HPI coverage. NOTE: this is a regional benchmark,
   * not a city-level median — the page copy must say so.
   */
  benchmark: number | null;
  /** Signed YoY % change on that benchmark. Null when the 12-month-prior reading is missing. */
  yoyChangePct: number | null;
  /** CREA sheet the benchmark came from, e.g. "GREATER_TORONTO". */
  region: string | null;
  /** Human-readable region label, e.g. "Greater Toronto". */
  regionLabel: string | null;
  /** True when `benchmark` actually falls inside this page's price band. */
  benchmarkInBand: boolean;
  /** Trailing real monthly benchmark series (oldest first). Empty without coverage. */
  benchmarkTrend: BenchmarkPoint[];
  /** True when at least one real CREA figure backs this snapshot. */
  hasRealData: boolean;

  /**
   * Live MLS inventory for this exact city × type × band, via Repliers.
   * Null when REPLIERS_API_KEY is unset or the call failed — callers MUST
   * render an honest absence rather than substituting an estimate.
   *
   * This is the field that makes CITY-level pages defensible: CREA gives
   * us one benchmark per REGION, so without it 41 cities collapse to 12
   * distinct figures.
   */
  inventory: {
    activeCount: number;
    medianDaysOnMarket: number | null;
    medianListPrice: number | null;
    sampleSize: number;
  } | null;

  source: 'crea-hpi' | 'none';
  /** ISO date of the CREA release. Null when there is no real data. */
  asOfDate: string | null;
  /** e.g. "June 2026". Null when there is no real data. */
  asOfLabel: string | null;
}

/**
 * Whether a matrix cell has earned the right to be in Google's index.
 * See MarketDataService.getCellIndexability() for the rules and rationale.
 */
export interface CellIndexability {
  indexable: boolean;
  /** Machine-readable reason, surfaced in logs + the sitemap build. */
  reason:
    | 'ok'
    | 'no-crea-coverage'
    | 'duplicate-of-detached'
    | 'benchmark-outside-band';
}

// City tier weighting. NO LONGER USED for pricing — kept only as the ordering
// key for "nearby comparable markets" cross-links, where a rough relative
// price tier is a legitimate way to pick which cities to link to.
const CITY_TIER: Record<string, number> = {
  'toronto': 1.45,
  'oakville': 1.30,
  'vaughan': 1.25,
  'richmond-hill': 1.22,
  'mississauga': 1.18,
  'markham': 1.18,
  'burlington': 1.15,
  'etobicoke': 1.15,
  'scarborough': 1.05,
  'aurora': 1.12,
  'king-city': 1.40,
  'milton': 1.08,
  'brampton': 1.00,
  'pickering': 1.02,
  'ajax': 0.98,
  'whitby': 0.98,
  'oshawa': 0.85,
  'clarington': 0.80,
  'caledon': 1.12,
  'halton-hills': 1.00,
  'hamilton': 0.78,
  'newmarket': 1.05,
  'bradford': 0.85,
  'innisfil': 0.78,
  'barrie': 0.74,
  'st-catharines': 0.62,
  'niagara-falls': 0.58,
  'welland': 0.50,
  'niagara-on-the-lake': 0.95,
  'fort-erie': 0.55,
  'grimsby': 0.78,
  'kitchener': 0.72,
  'waterloo': 0.78,
  'cambridge': 0.68,
  'guelph': 0.78,
  'london': 0.58,
  'windsor': 0.42,
  'ottawa': 0.82,
  'kanata': 0.85,
  'nepean': 0.78,
  'orleans': 0.72,
};

/**
 * CREA publishes ONE benchmark per region per home type, and only three home
 * types we can map (single family, townhouse, apartment). Semi-detached has no
 * CREA series — the loader currently aliases it to single family, which makes
 * every /semi-detached/ page a byte-for-byte twin of the matching /detached/
 * page. Rather than publish the duplicate, semi-detached cells render for users
 * but are excluded from the index. Re-enable them the day a feed with a real
 * semi-detached benchmark (TRREB per-municipality, or an MLS feed) is wired.
 */
const TYPES_WITHOUT_OWN_BENCHMARK = new Set(['semi-detached']);

/**
 * Tolerance applied to the band edges when deciding indexability. Without it a
 * page would flip between index and noindex month to month as the benchmark
 * drifts across a round-number boundary; 10% gives roughly a year of hysteresis
 * at current rates of change.
 */
const BAND_EDGE_TOLERANCE = 0.10;

/** "GREATER_TORONTO" → "Greater Toronto". */
/**
 * Live MLS inventory for one matrix cell, via Repliers.
 *
 * Returns null in every failure mode — unconfigured key, unknown city,
 * unmapped property type, network error, non-200. That null is the
 * honest signal; callers render "we don't publish this" rather than
 * substituting an estimate. This is the same discipline that removed the
 * hashed `activeListings` field: an absent number beats a fake one.
 */
async function fetchInventory(
  citySlug: string,
  typeSlug: string,
  range: { min: number; max: number },
): Promise<MarketSnapshot['inventory']> {
  if (!isRepliersConfigured()) return null;

  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) return null;

  // An unmapped type would silently return zero listings, which reads as
  // "no inventory" rather than "wrong filter" — so bail instead.
  const propertyType = repliersTypeFor(typeSlug);
  if (!propertyType) return null;

  const stats = await fetchListingStats({
    city: city.name,
    propertyType,
    minPrice: range.min,
    // PRICE_RANGES uses Infinity for the open-ended top band; Repliers
    // needs the param omitted rather than a non-finite value.
    maxPrice: Number.isFinite(range.max) ? range.max : undefined,
  });
  if (!stats) return null;

  return {
    activeCount: stats.activeCount,
    medianDaysOnMarket: stats.medianDaysOnMarket,
    medianListPrice: stats.medianListPrice,
    sampleSize: stats.sampleSize,
  };
}

function humanizeRegion(region: string): string {
  return region
    .toLowerCase()
    .split('_')
    .map((w) => (w === 'and' ? 'and' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

/** True when `price` sits inside the band, allowing BAND_EDGE_TOLERANCE slack. */
function withinBand(price: number, min: number, max: number): boolean {
  const lo = min * (1 - BAND_EDGE_TOLERANCE);
  const hi = max === Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : max * (1 + BAND_EDGE_TOLERANCE);
  return price >= lo && price < hi;
}

function emptySnapshot(citySlug: string, typeSlug: string, priceSlug: string): MarketSnapshot {
  const city = CITIES.find((c) => c.slug === citySlug);
  const type = getTypeBySlug(typeSlug);
  const range = getPriceRangeBySlug(priceSlug);
  if (!city || !type || !range) {
    throw new Error(`MarketDataService: unknown cell ${citySlug}/${typeSlug}/${priceSlug}`);
  }
  return {
    citySlug,
    cityName: city.name,
    typeSlug,
    typeLabel: type.label,
    priceRangeSlug: priceSlug,
    priceRangeLabel: range.label,
    benchmark: null,
    yoyChangePct: null,
    region: null,
    regionLabel: null,
    benchmarkInBand: false,
    inventory: null,
    benchmarkTrend: [],
    hasRealData: false,
    source: 'none',
    asOfDate: null,
    asOfLabel: null,
  };
}

export const MarketDataService = {
  /**
   * Returns the real CREA-backed snapshot for one matrix cell. Never invents a
   * number: when the city has no HPI coverage the caller gets hasRealData=false
   * and is expected to render the "no published benchmark" branch.
   */
  async getSnapshot(citySlug: string, typeSlug: string, priceSlug: string): Promise<MarketSnapshot> {
    const base = emptySnapshot(citySlug, typeSlug, priceSlug);
    const range = getPriceRangeBySlug(priceSlug)!;

    try {
      const data = await getMarketData();
      const stats = data.byCity.get(citySlug);
      const benchmark = stats?.benchmarkByType[typeSlug];
      if (!stats || typeof benchmark !== 'number' || benchmark <= 0) return base;

      // Live MLS inventory — strictly additive. A failure here degrades
      // the page to CREA-only; it never blocks the render and never
      // substitutes an estimate.
      const inventory = await fetchInventory(citySlug, typeSlug, range);

      return {
        ...base,
        inventory,
        benchmark,
        yoyChangePct: stats.yoyPctByType[typeSlug] ?? null,
        region: stats.region,
        regionLabel: humanizeRegion(stats.region),
        benchmarkInBand: withinBand(benchmark, range.min, range.max),
        benchmarkTrend: stats.historyByType?.[typeSlug] ?? [],
        hasRealData: true,
        source: 'crea-hpi',
        asOfDate: stats.asOf.toISOString().split('T')[0],
        asOfLabel: stats.asOf.toLocaleString('en-CA', { month: 'long', year: 'numeric' }),
      };
    } catch (e) {
      console.warn('[MarketData] loader failed — returning empty snapshot', e);
      return base;
    }
  },

  /**
   * Decides whether a matrix cell should be indexable.
   *
   * The matrix generates 40 cities × 4 types × 5 bands = 800 URLs, but the
   * underlying data is 12 CREA regions × 3 benchmark series = 36 distinct
   * figures. You cannot support 800 indexable pages on 36 data points, and
   * Google's "Crawled – currently not indexed" bucket is exactly what that
   * mismatch produces. Three rules cut the set down to the cells that carry a
   * genuinely different, genuinely true headline fact:
   *
   *   1. No CREA coverage for the city → nothing true to say → noindex.
   *   2. semi-detached → duplicate of the detached series → noindex.
   *   3. Benchmark falls outside the band → the page would be answering
   *      "what do $1M–$1.5M condos cost in King City?" when the real condo
   *      benchmark for that region is $539K. There is no honest headline
   *      number for that cell → noindex.
   *
   * Pages stay reachable and keep passing internal link equity (noindex,follow);
   * they simply stop asking Google to rank near-empty permutations. A cell
   * automatically becomes indexable again if the benchmark moves into its band.
   */
  async getCellIndexability(citySlug: string, typeSlug: string, priceSlug: string): Promise<CellIndexability> {
    if (TYPES_WITHOUT_OWN_BENCHMARK.has(typeSlug)) {
      return { indexable: false, reason: 'duplicate-of-detached' };
    }
    const range = getPriceRangeBySlug(priceSlug);
    if (!range) return { indexable: false, reason: 'no-crea-coverage' };

    try {
      const data = await getMarketData();
      const stats = data.byCity.get(citySlug);
      const benchmark = stats?.benchmarkByType[typeSlug];
      if (!stats || typeof benchmark !== 'number' || benchmark <= 0) {
        return { indexable: false, reason: 'no-crea-coverage' };
      }
      if (!withinBand(benchmark, range.min, range.max)) {
        return { indexable: false, reason: 'benchmark-outside-band' };
      }
      return { indexable: true, reason: 'ok' };
    } catch {
      return { indexable: false, reason: 'no-crea-coverage' };
    }
  },

  /** Human-readable label used in the "Data source: ..." badge on matrix pages. */
  async getSourceLabel(citySlug: string, typeSlug: string): Promise<string> {
    try {
      const data = await getMarketData();
      const cityStats = data.byCity.get(citySlug);
      if (cityStats && cityStats.benchmarkByType[typeSlug]) {
        const month = cityStats.asOf.toLocaleString('en-CA', { month: 'long', year: 'numeric' });
        return `CREA MLS® HPI · ${month}`;
      }
    } catch {}
    return 'No published benchmark';
  },

  /** Convenience: list every valid (city, type, price) tuple — used by generateStaticParams. */
  enumerateCells(): { city: string; type: string; price: string }[] {
    const tuples: { city: string; type: string; price: string }[] = [];
    for (const city of CITIES) {
      for (const t of PROPERTY_TYPES) {
        for (const p of PRICE_RANGES) {
          tuples.push({ city: city.slug, type: t.slug, price: p.slug });
        }
      }
    }
    return tuples;
  },

  /**
   * The subset of cells that pass getCellIndexability(). This — not
   * enumerateCells() — is what belongs in the XML sitemap. Submitting 800 URLs
   * while 630 of them carry noindex is a crawl-budget tax with no upside.
   */
  async enumerateIndexableCells(): Promise<{ city: string; type: string; price: string }[]> {
    const out: { city: string; type: string; price: string }[] = [];
    for (const cell of this.enumerateCells()) {
      const verdict = await this.getCellIndexability(cell.city, cell.type, cell.price);
      if (verdict.indexable) out.push(cell);
    }
    return out;
  },

  /**
   * Cities to cross-link from a matrix cell. Previously this was
   * `CITIES.filter(c => c.slug !== city).slice(0, 6)`, which returned the same
   * first six cities on 794 of 800 pages — an identical link block is a strong
   * template fingerprint. This returns markets in the SAME CREA region first
   * (genuinely comparable, and the benchmark is directly comparable), then
   * fills from the nearest price tier.
   */
  async getComparableMarkets(citySlug: string, limit = 6): Promise<{ slug: string; name: string }[]> {
    const self = CITIES.find((c) => c.slug === citySlug);
    if (!self) return [];

    let sameRegion: string[] = [];
    try {
      const data = await getMarketData();
      const myRegion = data.byCity.get(citySlug)?.region;
      if (myRegion) {
        sameRegion = CITIES
          .filter((c) => c.slug !== citySlug && data.byCity.get(c.slug)?.region === myRegion)
          .map((c) => c.slug);
      }
    } catch {
      /* fall through to tier ordering */
    }

    const myTier = CITY_TIER[citySlug] ?? 0.85;
    const byTier = CITIES
      .filter((c) => c.slug !== citySlug && !sameRegion.includes(c.slug))
      .sort(
        (a, b) =>
          Math.abs((CITY_TIER[a.slug] ?? 0.85) - myTier) -
          Math.abs((CITY_TIER[b.slug] ?? 0.85) - myTier),
      )
      .map((c) => c.slug);

    return [...sameRegion, ...byTier]
      .slice(0, limit)
      .map((slug) => {
        const c = CITIES.find((x) => x.slug === slug)!;
        return { slug: c.slug, name: c.name };
      });
  },

  /**
   * Full derivative-index snapshot — the payload behind the /housing-index
   * page and /api/housing-index/latest.json endpoint. Single source of truth
   * so page + API + JSON-LD all read the same numbers.
   *
   * Falls back to an empty-cities snapshot if getMarketData fails — the
   * /housing-index page is a primary-source authority claim, so it should
   * never surface fabricated numbers.
   */
  async getIndexSnapshot(): Promise<IndexSnapshot> {
    const blank = (label: string): IndexSnapshot => ({
      asOf: new Date().toISOString(),
      cities: [],
      trreb: null,
      sourceLabel: label,
      coverage: { cityCount: 0, typeCount: PROPERTY_TYPES.length },
    });

    try {
      const data = await getMarketData();
      const cityRows: IndexCityRow[] = [];
      let maxAsOfMs = 0;

      for (const city of CITIES) {
        const stats = data.byCity.get(city.slug);
        if (!stats) continue;
        const asOfMs = stats.asOf.getTime();
        if (asOfMs > maxAsOfMs) maxAsOfMs = asOfMs;

        // Only emit types where we actually have a benchmark — no invented numbers.
        const benchmarks: Record<string, number> = {};
        const yoyPct: Record<string, number | null> = {};
        for (const t of PROPERTY_TYPES) {
          const bench = stats.benchmarkByType[t.slug];
          if (typeof bench === 'number' && bench > 0) {
            benchmarks[t.slug] = bench;
            yoyPct[t.slug] = stats.yoyPctByType[t.slug] ?? null;
          }
        }
        if (Object.keys(benchmarks).length === 0) continue;

        cityRows.push({
          citySlug: city.slug,
          cityName: city.name,
          region: stats.region,
          benchmarks,
          yoyPct,
          asOf: stats.asOf.toISOString(),
        });
      }

      const asOfIso = maxAsOfMs > 0 ? new Date(maxAsOfMs).toISOString() : new Date().toISOString();
      return {
        asOf: asOfIso,
        cities: cityRows,
        trreb: data.trreb,
        sourceLabel: data.sourceLabel,
        coverage: { cityCount: cityRows.length, typeCount: PROPERTY_TYPES.length },
      };
    } catch (e) {
      console.warn('[MarketData] getIndexSnapshot failed — returning empty snapshot', e);
      return blank('No published benchmark');
    }
  },
};

// Types deliberately exported so the JSON-LD builder + Route Handler don't
// have to reconstruct them.
export interface IndexCityRow {
  citySlug: string;
  cityName: string;
  region: string;
  benchmarks: Record<string, number>;
  yoyPct: Record<string, number | null>;
  asOf: string; // ISO
}

export interface IndexSnapshot {
  asOf: string; // ISO — max asOf across cities
  cities: IndexCityRow[];
  trreb: TRREBAggregate | null;
  sourceLabel: string;
  coverage: { cityCount: number; typeCount: number };
}
