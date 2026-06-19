// Parses the TRREB Market Watch PDF.
//
// TRREB's PDF lays out per-municipality tables in a column-first stream that's
// brittle to extract by row. So this parser only extracts the *aggregate*
// numbers (TRREB total + the headline by-home-type averages) — those appear
// near the top of the document in a stable section and are reliable to scrape.
//
// What we keep:
//   - asOfMonth label (e.g. "May 2026")
//   - TRREB Total: sales, average price, new listings, active listings, average DOM
//   - Per-home-type: detached / semi-detached / townhouse / condo apt
//     (sales count + average price + YoY change)
//
// This data is used to colour the matrix with real macro context — i.e.
// "the GTA detached market is up 4.2% YoY" — even when an individual cell's
// city falls outside TRREB's coverage.

import * as fs from 'fs';

export interface TRREBHomeTypeStat {
  type: 'detached' | 'semi-detached' | 'townhouse' | 'condo-apt';
  salesYoYPct: number | null;
  pricesYoYPct: number | null;
}

export interface TRREBAggregate {
  asOfMonth: string | null;
  totalSales: number | null;
  totalNewListings: number | null;
  totalActiveListings: number | null;
  averagePrice: number | null;
  averageLDOM: number | null;
  byHomeType: TRREBHomeTypeStat[];
}

const HEADER_RE = /Market Watch,\s*([A-Za-z]+\s+\d{4})/;
const PRICE_RE = /\$([\d,]+)/g;
const PCT_RE = /(-?\d+\.\d+)\s*%/g;

function num(s?: string | null): number | null {
  if (!s) return null;
  const n = Number(String(s).replace(/[,$%]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export async function parseTRREBPDF(filePath: string): Promise<TRREBAggregate | null> {
  if (!fs.existsSync(filePath)) return null;
  let text = '';
  try {
    // Dynamic require so Webpack/Turbopack don't pull pdf-parse into the client bundle.
    const { PDFParse } = await import('pdf-parse');
    const buf = fs.readFileSync(filePath);
    const r = await new PDFParse({ data: buf }).getText();
    text = r.text || '';
  } catch (e) {
    console.warn('[parseTRREB] failed to read', filePath, e);
    return null;
  }
  if (!text) return null;

  const asOfMonth = text.match(HEADER_RE)?.[1] ?? null;

  // Average price — pick the first "$1,xxx,xxx" pattern that follows
  // "TRREB MLS Average Price". TRREB always lists this near the top.
  let averagePrice: number | null = null;
  const avgIdx = text.indexOf('TRREB MLS Average Price');
  if (avgIdx >= 0) {
    const window = text.slice(avgIdx, avgIdx + 200);
    const m = window.match(/\$([\d,]+)/);
    if (m) averagePrice = num(m[1]);
  }

  // Headline summary block — TRREB always emits these labels in this order.
  const summaryMatch = text.match(/Sales\s+New Listings\s+Active Listings\s+Average Price\s+Avg\.\s*LDOM\s+Avg\.\s*PDOM\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+\$([\d,]+)/);
  const totalSales = summaryMatch ? num(summaryMatch[1]) : null;
  const totalNewListings = summaryMatch ? num(summaryMatch[2]) : null;
  const totalActiveListings = summaryMatch ? num(summaryMatch[3]) : null;
  if (!averagePrice && summaryMatch) averagePrice = num(summaryMatch[4]);

  // LDOM = listing days on market.
  const ldomIdx = text.search(/Avg\.\s*LDOM/);
  let averageLDOM: number | null = null;
  if (ldomIdx >= 0) {
    const tail = text.slice(ldomIdx, ldomIdx + 80);
    const nums = tail.match(/\d+/g);
    if (nums && nums.length > 0) averageLDOM = num(nums[0]);
  }

  // Sales & price YoY by home type. TRREB renders the four types in this fixed order:
  //   Detached | Semi-Detached | Townhouse | Condo Apt
  // followed by two parallel YoY % streams (sales then prices). Extract them
  // best-effort and pair by index.
  const byHomeType: TRREBHomeTypeStat[] = [];
  const stIdx = text.indexOf('Sales & Average Price by Major Home Type');
  if (stIdx >= 0) {
    const window = text.slice(stIdx, stIdx + 600);
    const pcts = Array.from(window.matchAll(PCT_RE)).map((m) => Number(m[1]));
    const types: TRREBHomeTypeStat['type'][] = ['detached', 'semi-detached', 'townhouse', 'condo-apt'];
    for (let i = 0; i < 4; i++) {
      byHomeType.push({
        type: types[i],
        salesYoYPct: pcts[i] ?? null,
        pricesYoYPct: pcts[i + 4] ?? null,
      });
    }
  }

  return {
    asOfMonth,
    totalSales,
    totalNewListings,
    totalActiveListings,
    averagePrice,
    averageLDOM,
    byHomeType,
  };
}
