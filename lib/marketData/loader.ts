// Build-time loader that scans data/market/ for ANY .xlsx and .pdf files,
// parses them, and exposes a normalized map of real market data to the rest
// of the app. The drop-in monthly workflow is:
//
//   1. Download the latest CREA HPI workbook + TRREB Market Watch PDF.
//   2. Save them anywhere inside `data/market/` — names + folder layout don't matter.
//   3. Rebuild. The loader picks up whichever .xlsx + .pdf files are present.
//
// Results are cached in module scope so the parse cost runs once per build,
// not once per page render.

import * as fs from 'fs';
import * as path from 'path';
import { parseHPIWorkbook, HPIReading, HPIHomeType, HPIHistoryPoint } from './parseHPI';
import { parseTRREBPDF, TRREBAggregate } from './parseTRREB';
import { hpiSheetForCity } from './cityMatcher';
import { PROPERTY_TYPES } from '../../data/matrixData';

const MARKET_DIR = path.join(process.cwd(), 'data', 'market');

/** One point on a real CREA benchmark series, pre-formatted for chart rendering. */
export interface BenchmarkPoint {
  /** e.g. "Jun 2026" */
  month: string;
  /** Benchmark price in CAD for that month. */
  price: number;
}

export interface RealCityStats {
  citySlug: string;
  region: string;            // The CREA region this came from
  /** Benchmark price per matrix property-type slug. */
  benchmarkByType: Record<string, number>;
  /** YoY % change per matrix property-type slug. */
  yoyPctByType: Record<string, number | null>;
  /**
   * Trailing 13 months of REAL benchmark prices per matrix property-type slug,
   * oldest first. Replaces the seeded pseudo-random trend the matrix pages used
   * to render — that chart was the single largest fabricated surface on the site.
   */
  historyByType: Record<string, BenchmarkPoint[]>;
  /** When the data is dated. */
  asOf: Date;
  source: 'crea-hpi';
}

export interface LoadedMarketData {
  byCity: Map<string, RealCityStats>;
  trreb: TRREBAggregate | null;
  /** Convenience: human-readable label used in source badges. */
  sourceLabel: string;
  /** Source files that were used, for debugging. */
  filesUsed: string[];
  /** True if at least one real file was parsed successfully. */
  hasRealData: boolean;
}

let cachedPromise: Promise<LoadedMarketData> | null = null;

function listFilesRecursively(dir: string, exts: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop()!;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(current, { withFileTypes: true }); }
    catch { continue; }
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue;
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (exts.some((e) => ent.name.toLowerCase().endsWith(e))) out.push(full);
    }
  }
  return out;
}

function pickNewest(files: string[]): string | null {
  if (files.length === 0) return null;
  return files
    .map((f) => ({ f, mtime: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0].f;
}

// CREA single-family benchmark covers BOTH detached and semi-detached. We
// expose both in the matrix-type map so each cell still gets a number.
// Also emits the raw `composite` reading so downstream consumers (the
// /housing-index page's headline stat + release notes) don't have to guard
// against undefined.
function creaTypeForMatrixType(slug: string): HPIHomeType {
  switch (slug) {
    case 'condo': return 'apartment';
    case 'townhouse': return 'townhouse';
    case 'detached':
    case 'semi-detached':
    default: return 'single_family';
  }
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function seriesFor(history: HPIHistoryPoint[], creaType: HPIHomeType): BenchmarkPoint[] {
  return history
    .map((h) => ({
      month: `${MONTH_LABELS[h.date.getMonth()]} ${h.date.getFullYear()}`,
      price: h.benchmarks[creaType] || h.benchmarks.composite || 0,
    }))
    .filter((p) => p.price > 0);
}

function mapCreaReadingToTypes(reading: HPIReading): {
  benchmark: Record<string, number>;
  yoy: Record<string, number | null>;
  history: Record<string, BenchmarkPoint[]>;
} {
  const benchmark: Record<string, number> = {};
  const yoy: Record<string, number | null> = {};
  const history: Record<string, BenchmarkPoint[]> = {};
  for (const t of PROPERTY_TYPES) {
    const creaType = creaTypeForMatrixType(t.slug);
    benchmark[t.slug] = reading.benchmarks[creaType] || reading.benchmarks.composite;
    yoy[t.slug] = reading.yoyPct[creaType] ?? reading.yoyPct.composite;
    history[t.slug] = seriesFor(reading.history || [], creaType);
  }
  if (reading.benchmarks.composite > 0) {
    benchmark['composite'] = reading.benchmarks.composite;
    yoy['composite'] = reading.yoyPct.composite;
    history['composite'] = seriesFor(reading.history || [], 'composite');
  }
  return { benchmark, yoy, history };
}

async function load(): Promise<LoadedMarketData> {
  const filesUsed: string[] = [];

  // === CREA HPI (xlsx) ===
  // If multiple xlsx files are present, prefer one whose filename suggests
  // monthly data ("(M)" in the CREA naming convention) and otherwise pick
  // the newest by mtime.
  const xlsxAll = listFilesRecursively(MARKET_DIR, ['.xlsx']);
  const monthlyPreferred = xlsxAll.find((f) => /\(M\)\.xlsx$/i.test(f));
  const hpiFile = monthlyPreferred || pickNewest(xlsxAll);

  let hpiReadings: HPIReading[] = [];
  if (hpiFile) {
    try {
      hpiReadings = parseHPIWorkbook(hpiFile);
      if (hpiReadings.length > 0) filesUsed.push(path.relative(process.cwd(), hpiFile));
    } catch (e) {
      console.warn('[marketData] HPI parse failed for', hpiFile, e);
    }
  }

  const byRegion = new Map<string, HPIReading>();
  for (const r of hpiReadings) byRegion.set(r.region, r);

  // === Project HPI onto our 40 city slugs via the matcher ===
  const { CITIES } = await import('../../data/cityData');
  const byCity = new Map<string, RealCityStats>();
  for (const c of CITIES) {
    const sheet = hpiSheetForCity(c.slug);
    if (!sheet) continue;
    const reading = byRegion.get(sheet);
    if (!reading) continue;
    const { benchmark, yoy, history } = mapCreaReadingToTypes(reading);
    byCity.set(c.slug, {
      citySlug: c.slug,
      region: reading.region,
      benchmarkByType: benchmark,
      yoyPctByType: yoy,
      historyByType: history,
      asOf: reading.asOf,
      source: 'crea-hpi',
    });
  }

  // === TRREB aggregate ===
  //
  // Read the PRE-PARSED JSON, not the PDF. `pdf-parse` pulls in pdfjs, which
  // expects to resolve a worker file at runtime; inside the Next server bundle
  // that worker is never emitted, so every parse failed with "Setting up fake
  // worker failed" and this block silently vanished from /housing-index on
  // every single build. The parse works fine outside webpack.
  //
  // scripts/parseTRREBToJson.ts runs it once and writes trreb-latest.json.
  // Regenerate with `npm run parse-trreb` after dropping in a newer Market
  // Watch PDF. The live-PDF path is kept only as a fallback for a dev machine
  // that has the PDF but has not generated the JSON yet.
  let trreb: TRREBAggregate | null = null;
  const trrebJson = path.join(MARKET_DIR, 'trreb-latest.json');
  if (fs.existsSync(trrebJson)) {
    try {
      const payload = JSON.parse(fs.readFileSync(trrebJson, 'utf8'));
      trreb = (payload?.data ?? null) as TRREBAggregate | null;
      if (trreb) filesUsed.push(path.relative(process.cwd(), trrebJson));
    } catch (e) {
      console.warn('[marketData] TRREB JSON unreadable:', e);
    }
  }

  if (!trreb) {
    const pdfAll = listFilesRecursively(MARKET_DIR, ['.pdf']);
    const trrebFile = pickNewest(pdfAll);
    if (trrebFile) {
      try {
        trreb = await parseTRREBPDF(trrebFile);
        if (trreb) filesUsed.push(path.relative(process.cwd(), trrebFile));
      } catch (e) {
        console.warn('[marketData] TRREB PDF fallback failed for', trrebFile, e);
      }
    }
  }

  // Human-readable label for "data source: ..." badges.
  const labelParts: string[] = [];
  if (hpiFile && byCity.size > 0) {
    const newest = Array.from(byCity.values())[0]?.asOf;
    const month = newest ? newest.toLocaleString('en-CA', { month: 'long', year: 'numeric' }) : '';
    labelParts.push(`CREA MLS® HPI${month ? ` (${month})` : ''}`);
  }
  if (trreb?.asOfMonth) labelParts.push(`TRREB Market Watch (${trreb.asOfMonth})`);
  const sourceLabel = labelParts.join(' · ') || 'IndiBrick Internal Model';

  return {
    byCity,
    trreb,
    sourceLabel,
    filesUsed,
    hasRealData: byCity.size > 0 || trreb != null,
  };
}

/**
 * Returns the merged market data. Parsed at most once per build. Safe to call
 * from anywhere in the server-side React tree.
 */
export function getMarketData(): Promise<LoadedMarketData> {
  if (!cachedPromise) cachedPromise = load();
  return cachedPromise;
}
