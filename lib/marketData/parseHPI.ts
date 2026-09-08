// Parses a CREA MLS® HPI workbook (the "Not Seasonally Adjusted (M)" monthly
// file) and returns one HPIReading per (region × home-type) for the latest
// month and the same month 12 months earlier.
//
// Workbook structure (verified against June 2026 release):
//   - 60 sheets, one per region (AGGREGATE, ONTARIO, MISSISSAUGA, OAKVILLE_MILTON,
//     GREATER_TORONTO, etc.).
//   - Row 0 = header: Date | Composite_HPI | Single_Family_HPI | One_Storey_HPI |
//     Two_Storey_HPI | Townhouse_HPI | Apartment_HPI | Composite_Benchmark |
//     Single_Family_Benchmark | One_Storey_Benchmark | Two_Storey_Benchmark |
//     Townhouse_Benchmark | Apartment_Benchmark
//   - Subsequent rows = one month each, oldest first.
//   - "Date" column is an Excel serial date number.

import * as XLSX from 'xlsx';
import * as fs from 'fs';

export type HPIHomeType = 'composite' | 'single_family' | 'townhouse' | 'apartment';

/** One historical monthly benchmark reading for a region. */
export interface HPIHistoryPoint {
  date: Date;
  benchmarks: Record<HPIHomeType, number>;
}

export interface HPIReading {
  /** Sheet name from the workbook, e.g. "MISSISSAUGA" or "GREATER_TORONTO". */
  region: string;
  /** Calendar date of the reading. */
  asOf: Date;
  /** Benchmark prices in CAD. */
  benchmarks: Record<HPIHomeType, number>;
  /** Year-over-year benchmark change in percent, signed. Null if 12-mo prior is missing. */
  yoyPct: Record<HPIHomeType, number | null>;
  /**
   * The trailing 13 monthly readings (oldest first, latest last) straight out of
   * the workbook. The parser used to discard these, which forced the matrix
   * pages to render a seeded pseudo-random "6-month trend" chart. Keeping the
   * real series lets every chart on the site be an actual CREA figure.
   */
  history: HPIHistoryPoint[];
}

/** How many trailing months of history we retain per region. */
const HISTORY_MONTHS = 13;

// Excel stores dates as days since 1899-12-30.
function excelSerialToDate(n: number): Date {
  return new Date(Math.round((n - 25569) * 86400 * 1000));
}

function monthsBetween(a: Date, b: Date): number {
  return (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
}

interface RawRow {
  date: Date;
  comp: number; sf: number; town: number; apt: number;
}

function readSheet(ws: XLSX.WorkSheet): RawRow[] {
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
  if (rows.length === 0) return [];

  // Header row → column indexes. Tolerate slight column-order drift across releases.
  const header = rows[0] as string[];
  const col = (name: string) => header.findIndex((h) => String(h).trim().toUpperCase() === name.toUpperCase());
  const iDate = col('Date');
  const iComp = col('Composite_Benchmark');
  const iSF = col('Single_Family_Benchmark');
  const iTown = col('Townhouse_Benchmark');
  const iApt = col('Apartment_Benchmark');
  if (iDate < 0 || iComp < 0) return [];

  const out: RawRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const ds = row[iDate];
    if (typeof ds !== 'number') continue;
    const comp = Number(row[iComp]) || 0;
    if (comp <= 0) continue;
    out.push({
      date: excelSerialToDate(ds),
      comp,
      sf: Number(row[iSF]) || 0,
      town: Number(row[iTown]) || 0,
      apt: Number(row[iApt]) || 0,
    });
  }
  return out;
}

export function parseHPIWorkbook(filePath: string): HPIReading[] {
  if (!fs.existsSync(filePath)) return [];
  let wb: XLSX.WorkBook;
  try {
    // Read the bytes ourselves and hand a Buffer to XLSX.read(). Next.js's
    // production bundle wraps XLSX.readFile() in a way that loses access to
    // Node's fs module, so the path-based API throws "Cannot access file"
    // even when the file exists. Buffer-based read avoids that entirely.
    const buffer = fs.readFileSync(filePath);
    wb = XLSX.read(buffer, { type: 'buffer' });
  } catch (e) {
    console.warn('[parseHPI] failed to read', filePath, e);
    return [];
  }

  const readings: HPIReading[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = readSheet(ws);
    if (rows.length === 0) continue;

    // Latest row = the most recent month available in the file.
    const latest = rows[rows.length - 1];
    // Find the row exactly 12 months earlier for YoY math. Walk backwards.
    const yearAgo = rows.slice(0, -1).reverse()
      .find((r) => monthsBetween(latest.date, r.date) === 12) || null;

    const yoy = (cur: number, prev: number | undefined): number | null => {
      if (!cur || !prev || prev <= 0) return null;
      return Math.round(((cur - prev) / prev) * 1000) / 10; // 1 decimal
    };

    const history: HPIHistoryPoint[] = rows.slice(-HISTORY_MONTHS).map((r) => ({
      date: r.date,
      benchmarks: {
        composite: r.comp,
        single_family: r.sf,
        townhouse: r.town,
        apartment: r.apt,
      },
    }));

    readings.push({
      region: sheetName,
      asOf: latest.date,
      history,
      benchmarks: {
        composite: latest.comp,
        single_family: latest.sf,
        townhouse: latest.town,
        apartment: latest.apt,
      },
      yoyPct: {
        composite: yoy(latest.comp, yearAgo?.comp),
        single_family: yoy(latest.sf, yearAgo?.sf),
        townhouse: yoy(latest.town, yearAgo?.town),
        apartment: yoy(latest.apt, yearAgo?.apt),
      },
    });
  }
  return readings;
}
