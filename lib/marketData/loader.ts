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
import { parseHPIWorkbook, HPIReading, HPIHomeType } from './parseHPI';
import { parseTRREBPDF, TRREBAggregate } from './parseTRREB';
import { hpiSheetForCity } from './cityMatcher';
import { PROPERTY_TYPES } from '../../data/matrixData';

const MARKET_DIR = path.join(process.cwd(), 'data', 'market');

export interface RealCityStats {
  citySlug: string;
  region: string;            // The CREA region this came from
  /** Benchmark price per matrix property-type slug. */
  benchmarkByType: Record<string, number>;
  /** YoY % change per matrix property-type slug. */
  yoyPctByType: Record<string, number | null>;
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
function mapCreaReadingToTypes(reading: HPIReading): { benchmark: Record<string, number>; yoy: Record<string, number | null> } {
  const benchmark: Record<string, number> = {};
  const yoy: Record<string, number | null> = {};
  for (const t of PROPERTY_TYPES) {
    let creaType: HPIHomeType;
    switch (t.slug) {
      case 'condo': creaType = 'apartment'; break;
      case 'townhouse': creaType = 'townhouse'; break;
      case 'detached':
      case 'semi-detached':
      default: creaType = 'single_family';
    }
    benchmark[t.slug] = reading.benchmarks[creaType] || reading.benchmarks.composite;
    yoy[t.slug] = reading.yoyPct[creaType] ?? reading.yoyPct.composite;
  }
  return { benchmark, yoy };
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
    const { benchmark, yoy } = mapCreaReadingToTypes(reading);
    byCity.set(c.slug, {
      citySlug: c.slug,
      region: reading.region,
      benchmarkByType: benchmark,
      yoyPctByType: yoy,
      asOf: reading.asOf,
      source: 'crea-hpi',
    });
  }

  // === TRREB PDF (aggregate only) ===
  const pdfAll = listFilesRecursively(MARKET_DIR, ['.pdf']);
  const trrebFile = pickNewest(pdfAll);
  let trreb: TRREBAggregate | null = null;
  if (trrebFile) {
    try {
      trreb = await parseTRREBPDF(trrebFile);
      if (trreb) filesUsed.push(path.relative(process.cwd(), trrebFile));
    } catch (e) {
      console.warn('[marketData] TRREB parse failed for', trrebFile, e);
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
