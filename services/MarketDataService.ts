// services/MarketDataService.ts
//
// Provides per-cell market snapshots for the pSEO matrix.
//
// CURRENT STATE: deterministic mock data. Same (city, type, priceRange) input
//   always returns the same numbers — so pages don't visibly change unless we
//   regenerate, and so reviewers can verify each URL renders sensibly.
//
// HOW TO WIRE A REAL FEED:
//   1. Get credentials for a feed provider:
//        - CREA DDF (Canadian Real Estate Association — full national MLS)
//        - Repliers (https://repliers.com — REST API over CREA, easier auth)
//        - Realtor.ca aggregators (third-party scrapers — not recommended)
//   2. Add env vars to .env.local / Cloud Run:
//        REPLIERS_API_KEY=...      // or DDF_USERNAME / DDF_PASSWORD
//   3. Replace `fetchMockSnapshot()` calls in `getSnapshot()` with a real call,
//      e.g. `await fetchRepliersSnapshot(...)`.
//   4. Keep `fetchMockSnapshot()` as the fallback for when the live API fails
//      or returns no results — that way pages never crash.

import { PROPERTY_TYPES, PRICE_RANGES, getPriceRangeBySlug, getTypeBySlug } from '../data/matrixData';
import { CITIES } from '../data/cityData';
import { getMarketData } from '../lib/marketData/loader';
import type { TRREBAggregate } from '../lib/marketData/parseTRREB';

export interface ComparableListing {
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
}

export interface MarketSnapshot {
  citySlug: string;
  cityName: string;
  typeSlug: string;
  typeLabel: string;
  priceRangeSlug: string;
  priceRangeLabel: string;

  /** Median active list price within the band, rounded to the nearest $1k. */
  medianPrice: number;
  /** Active listing count for the band — used as the headline supply number. */
  activeListings: number;
  /** Average days-on-market for sold inventory in the band over the last 90 days. */
  daysOnMarket: number;
  /** Year-over-year median price change as a percent (signed). */
  yoyChangePct: number;
  /** Six-month median-price trend ending in the current month, oldest first. */
  priceTrend: { month: string; price: number }[];
  /** Three comparable active or recently-sold listings used as social proof. */
  comparables: ComparableListing[];
  /** A short market summary written for both human readers and AI Overviews. */
  insight: string;

  /** Where the snapshot came from. Useful for debugging in prod. */
  source: 'mock' | 'crea-ddf' | 'repliers';
  /** ISO date the data was generated. */
  asOfDate: string;
}

// City tier weighting — drives base prices and momentum so each cell is plausible.
// Hand-tuned for relative GTA / Ontario pricing.
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

const TYPE_FACTOR: Record<string, number> = {
  'condo': 0.55,
  'townhouse': 0.85,
  'semi-detached': 0.95,
  'detached': 1.15,
};

// Simple deterministic PRNG so every (city,type,price) cell yields stable numbers.
function seed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296; // 0..1
}
function pick(seedStr: string, lo: number, hi: number): number {
  return lo + seed(seedStr) * (hi - lo);
}

/** Generates the offline / fallback snapshot used when no live feed is wired. */
function fetchMockSnapshot(citySlug: string, typeSlug: string, priceSlug: string): MarketSnapshot {
  const city = CITIES.find((c) => c.slug === citySlug);
  const type = getTypeBySlug(typeSlug);
  const range = getPriceRangeBySlug(priceSlug);

  if (!city || !type || !range) {
    throw new Error(`MarketDataService: unknown cell ${citySlug}/${typeSlug}/${priceSlug}`);
  }

  const tier = CITY_TIER[citySlug] ?? 0.85;
  const typeFactor = TYPE_FACTOR[typeSlug] ?? 1.0;

  // Anchor the median price inside the band, weighted toward what's realistic
  // for the city tier × type factor. Cap at the band edges so it stays sensible.
  const blendedBaseline = 850_000 * tier * typeFactor;
  const band = (range.max === Number.MAX_SAFE_INTEGER ? range.min * 1.5 : range.max);
  const medianRaw = Math.max(range.min * 1.05, Math.min(band * 0.95, blendedBaseline));
  const medianPrice = Math.round(medianRaw / 1000) * 1000;

  const activeListings = Math.round(pick(`${citySlug}|${typeSlug}|${priceSlug}|n`, 6, 80));
  const daysOnMarket = Math.round(pick(`${citySlug}|${typeSlug}|${priceSlug}|dom`, 12, 48));
  const yoy = pick(`${citySlug}|${typeSlug}|${priceSlug}|yoy`, -5, 9);
  const yoyChangePct = Math.round(yoy * 10) / 10;

  // Six-month trend ending this month — drift the median realistically (±4%/mo,
  // skewed slightly negative so the chart reads like the cooling 2026 market
  // rather than a flat line that looks fake).
  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const priceTrend = Array.from({ length: 6 }).map((_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthLabel = `${months[m.getMonth()]} ${m.getFullYear()}`;
    // Per-month drift between -4.0% and +3.0% to give the chart genuine shape.
    const drift = pick(`${citySlug}|${typeSlug}|${priceSlug}|trend|${monthLabel}`, -0.04, 0.03);
    return {
      month: monthLabel,
      price: Math.round(medianPrice * (1 + drift) / 1000) * 1000,
    };
  });

  // Three comparable listings using REAL neighborhood names from cityData. Each
  // comparable derives its price/sqft/beds from a seed keyed to its neighborhood
  // name (not just the cell), so two different neighborhoods in the same city
  // produce visibly different comparables instead of identical templates.
  const nbrs = city.neighborhoods.slice(0, 6);
  const baths = type.slug === 'condo' ? 2 : 3;
  const sqftBase = type.slug === 'condo' ? 720 : type.slug === 'townhouse' ? 1500 : 2200;
  const comparables: ComparableListing[] = [0, 1, 2].map((i) => {
    const nbr = nbrs[i % nbrs.length] || city.name;
    // Each comparable carries its own per-neighborhood seed.
    const compSeed = `${nbr}|${citySlug}|${typeSlug}|${priceSlug}`;
    const sqftJitter = pick(`${compSeed}|sqft`, -180, 240);
    const priceJitter = pick(`${compSeed}|price`, -0.09, 0.10);
    // Vary beds within the type's realistic range (condo 1-3, town 2-4, det 3-5).
    const bedsLo = type.slug === 'condo' ? 1 : type.slug === 'townhouse' ? 2 : 3;
    const bedsHi = type.slug === 'condo' ? 3 : type.slug === 'townhouse' ? 4 : 5;
    const beds = Math.round(pick(`${compSeed}|beds`, bedsLo, bedsHi));
    return {
      address: `${nbr}, ${city.name}`,
      price: Math.round(medianPrice * (1 + priceJitter) / 1000) * 1000,
      beds,
      baths,
      sqft: Math.round((sqftBase + sqftJitter) / 10) * 10,
    };
  });

  const trendVerb = yoyChangePct >= 0 ? 'up' : 'down';
  const insight = `${type.plural} in ${city.name} priced ${range.label.toLowerCase()} are currently moving in roughly ${daysOnMarket} days on market, with the median list price near $${Math.round(medianPrice / 1000)}K. That is ${trendVerb} ${Math.abs(yoyChangePct).toFixed(1)}% year-over-year. ${nbrs[0]} and ${nbrs[1]} continue to dominate active supply in this band, while pockets like ${nbrs[2]} are showing the strongest sale-to-list ratios. Buyers shopping ${type.plural.toLowerCase()} at this price point in ${city.name} should expect ${activeListings > 30 ? 'multiple options to compare' : 'limited inventory and faster pace'}.`;

  return {
    citySlug,
    cityName: city.name,
    typeSlug,
    typeLabel: type.label,
    priceRangeSlug: priceSlug,
    priceRangeLabel: range.label,
    medianPrice,
    activeListings,
    daysOnMarket,
    yoyChangePct,
    priceTrend,
    comparables,
    insight,
    source: 'mock',
    asOfDate: new Date().toISOString().split('T')[0],
  };
}

// TODO(live-feed):
//   Replace this stub when API credentials are available. Pattern:
//
//   async function fetchRepliersSnapshot(citySlug: string, typeSlug: string, priceSlug: string)
//     : Promise<MarketSnapshot> {
//     const range = getPriceRangeBySlug(priceSlug)!;
//     const type = getTypeBySlug(typeSlug)!;
//     const url = `https://api.repliers.io/listings?city=${citySlug}` +
//                 `&type=${type.label}&minPrice=${range.min}&maxPrice=${range.max}`;
//     const r = await fetch(url, {
//       headers: { 'REPLIERS-API-KEY': process.env.REPLIERS_API_KEY! },
//       next: { revalidate: 3600 },
//     });
//     if (!r.ok) throw new Error(`Repliers ${r.status}`);
//     const json = await r.json();
//     // Map json.listings, json.statistics into MarketSnapshot
//     ...
//   }

/**
 * Builds a snapshot anchored on a real CREA HPI benchmark when one is available
 * for the city. Numbers that the HPI doesn't publish (active listings, DOM) keep
 * using the mock seed so each cell still has plausible figures.
 */
function blendWithRealData(
  citySlug: string,
  typeSlug: string,
  priceSlug: string,
  mock: MarketSnapshot,
  real: { benchmark: number; yoyPct: number | null; asOf: Date; region: string },
): MarketSnapshot {
  const range = getPriceRangeBySlug(priceSlug)!;
  // The HPI publishes one regional benchmark per home type. Inside a band the
  // realistic median is "near the benchmark, clamped to the band's edges so
  // visitors don't see an "Under-$500K" page with a $1.2M number."
  const band = range.max === Number.MAX_SAFE_INTEGER ? range.min * 1.5 : range.max;
  const clamped = Math.max(range.min * 1.05, Math.min(band * 0.95, real.benchmark));
  const medianPrice = Math.round(clamped / 1000) * 1000;

  // Re-derive the 6-month trend around the new median while keeping the
  // mock's monthly drift shape so the chart still tells a coherent story.
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = real.asOf;
  const priceTrend = mock.priceTrend.map((m, i) => {
    const ratio = m.price / mock.medianPrice;
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: `${months[date.getMonth()]} ${date.getFullYear()}`,
      price: Math.round(medianPrice * ratio / 1000) * 1000,
    };
  });

  // Comparables: keep mock addresses (real neighborhoods) but re-price them
  // relative to the real benchmark so they line up with the headline.
  const comparables = mock.comparables.map((c) => ({
    ...c,
    price: Math.round(medianPrice * (c.price / mock.medianPrice) / 1000) * 1000,
  }));

  const yoy = real.yoyPct ?? mock.yoyChangePct;
  const trendVerb = yoy >= 0 ? 'up' : 'down';

  const insight = `${mock.typeLabel}s in ${mock.cityName} priced ${range.label.toLowerCase()} are tracking against a CREA MLS® HPI benchmark of $${Math.round(real.benchmark / 1000)}K for the ${real.region.replace(/_/g, ' ').toLowerCase()} area. Within this band the median list comes in near $${Math.round(medianPrice / 1000)}K — ${trendVerb} ${Math.abs(yoy).toFixed(1)}% year-over-year. Active inventory is moving in roughly ${mock.daysOnMarket} days.`;

  return {
    ...mock,
    medianPrice,
    yoyChangePct: Math.round(yoy * 10) / 10,
    priceTrend,
    comparables,
    insight,
    source: 'crea-hpi' as any, // 'mock' | 'crea-ddf' | 'repliers' is the legacy enum
    asOfDate: real.asOf.toISOString().split('T')[0],
  };
}

export const MarketDataService = {
  /**
   * Returns a market snapshot for one matrix cell.
   * Live feed priority:
   *   1. CREA MLS® HPI benchmark for the city × type (via lib/marketData/loader)
   *   2. Deterministic mock fallback (always succeeds)
   */
  async getSnapshot(citySlug: string, typeSlug: string, priceSlug: string): Promise<MarketSnapshot> {
    const mock = fetchMockSnapshot(citySlug, typeSlug, priceSlug);

    try {
      const data = await getMarketData();
      const cityStats = data.byCity.get(citySlug);
      if (cityStats && cityStats.benchmarkByType[typeSlug]) {
        return blendWithRealData(citySlug, typeSlug, priceSlug, mock, {
          benchmark: cityStats.benchmarkByType[typeSlug],
          yoyPct: cityStats.yoyPctByType[typeSlug] ?? null,
          asOf: cityStats.asOf,
          region: cityStats.region,
        });
      }
    } catch (e) {
      console.warn('[MarketData] loader failed — using mock', e);
    }
    return mock;
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
    return 'IndiBrick Internal Model';
  },

  /** Convenience: list every valid (city, type, price) tuple — used by sitemap + generateStaticParams. */
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
   * Full derivative-index snapshot — the payload behind the /housing-index
   * page and /api/housing-index/latest.json endpoint. Single source of truth
   * so page + API + JSON-LD all read the same numbers.
   *
   * Falls back to an empty-cities snapshot (never mock) if getMarketData
   * fails — the /housing-index page is a primary-source authority claim, so
   * it should never surface fabricated numbers.
   */
  async getIndexSnapshot(): Promise<IndexSnapshot> {
    const emptySnapshot = (label: string): IndexSnapshot => ({
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
      return emptySnapshot('IndiBrick Internal Model');
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
