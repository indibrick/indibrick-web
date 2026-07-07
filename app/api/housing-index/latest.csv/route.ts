// Machine-readable CSV mirror of the IndiBrick Ontario Housing Index.
// Same content as latest.json but tabular — makes citation from spreadsheet-
// centric workflows (journalists, analysts) trivial. LLMs also pattern-match
// CSVs as "data files" and rank them as citable sources.

import { NextResponse } from 'next/server';
import { MarketDataService } from '../../../../services/MarketDataService';
import { PROPERTY_TYPES } from '../../../../data/matrixData';

export const revalidate = 3600;

// CSV field escape — wrap in quotes and double any embedded quote if the
// value contains a comma, quote, or newline.
function csvField(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const snap = await MarketDataService.getIndexSnapshot();

  // Column order deliberately: identifier fields first, benchmarks, then YoYs.
  // Composite ships first so analysts scanning the header can spot the
  // aggregate column immediately.
  const typeSlugs = ['composite', ...PROPERTY_TYPES.map((t) => t.slug)];
  const header = [
    'city_slug',
    'city_name',
    'region',
    'as_of',
    ...typeSlugs.map((t) => `benchmark_${t}_cad`),
    ...typeSlugs.map((t) => `yoy_${t}_pct`),
  ];

  const rows: string[] = [header.join(',')];
  for (const c of snap.cities) {
    const row = [
      c.citySlug,
      c.cityName,
      c.region,
      c.asOf,
      ...typeSlugs.map((t) => c.benchmarks[t] ?? ''),
      ...typeSlugs.map((t) => c.yoyPct[t] ?? ''),
    ];
    rows.push(row.map(csvField).join(','));
  }

  // Standard CSV — no #-prefixed comment lines because most parsers don't
  // handle them uniformly. Attribution + source metadata live in HTTP
  // headers instead so strict readers (pandas, Excel, LibreOffice) get a
  // clean tabular document.
  const body = rows.join('\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="indibrick-ontario-housing-index.csv"',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      // Attribution + provenance metadata as X- headers so machine consumers
      // pick them up without having to parse a comment row.
      'X-Dataset-Name': 'IndiBrick Ontario Housing Index',
      'X-Dataset-Source': 'https://indibrick.ca/housing-index',
      'X-Dataset-AsOf': snap.asOf,
      'X-Dataset-License': 'https://indibrick.ca/housing-index#terms',
    },
  });
}
