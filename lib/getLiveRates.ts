// Shared live-rate reader. Single source for every page that surfaces a rate.
//
// ─── Why this returns null ──────────────────────────────────────────────
// This module used to hold a DEFAULT_RATES constant and return it whenever
// Firestore was unreachable, AND merge it over any field the document was
// missing. Those constants then rendered:
//
//   - under a pulsing green dot labelled "Live"
//   - inside the homepage meta description
//   - inside FAQPage JSON-LD as "the latest published rate sheet"
//
// with no way for a reader — or an answer engine — to tell a real reading
// from a stale constant. On an FSRA-regulated brokerage site that is an
// advertising-compliance exposure, not a display bug.
//
// The contract is now the same one lib/googleReviews.ts uses: return null on
// every failure path, and let the caller render an honest absence. A rate we
// cannot source is a rate we do not quote.
//
// Callers MUST handle null. `formatRate()` below is the safe accessor.

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface LiveRates {
  insured_variable_5yr: string;
  insured_fixed_5yr: string;
  insured_fixed_3yr: string;
  uninsured_fixed_5yr: string;
  uninsured_variable_5yr: string;
  b_lender: string;
  private_1st: string;
  second_mortgage: string;
  /** ISO timestamp of the last rate-sheet update, when the document carries one. */
  updatedAt?: string;
}

/** Every rate field we expect. Used to validate a document before trusting it. */
const RATE_FIELDS: (keyof LiveRates)[] = [
  'insured_variable_5yr',
  'insured_fixed_5yr',
  'insured_fixed_3yr',
  'uninsured_fixed_5yr',
  'uninsured_variable_5yr',
  'b_lender',
  'private_1st',
  'second_mortgage',
];

function isUsableRate(v: unknown): boolean {
  if (typeof v !== 'string' && typeof v !== 'number') return false;
  const n = Number(v);
  // A mortgage rate outside 0-25% is a data-entry error, not a rate.
  return Number.isFinite(n) && n > 0 && n < 25;
}

/**
 * Read the current rate sheet. Returns null when Firestore is unreachable,
 * the document is missing, or the document does not carry a usable value for
 * every field. Partial documents are rejected rather than back-filled — a
 * half-real rate sheet is the failure mode this module exists to prevent.
 */
export async function getLiveRates(): Promise<LiveRates | null> {
  try {
    const docRef = doc(db, 'site_settings', 'mortgage_rates');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.warn('[getLiveRates] site_settings/mortgage_rates missing — rates suppressed');
      return null;
    }

    const data = docSnap.data() as Record<string, unknown>;
    const missing = RATE_FIELDS.filter((f) => !isUsableRate(data[f]));
    if (missing.length > 0) {
      console.warn(`[getLiveRates] unusable fields (${missing.join(', ')}) — rates suppressed`);
      return null;
    }

    const out = {} as LiveRates;
    for (const f of RATE_FIELDS) out[f] = String(data[f]);

    const ts: any = data.updatedAt;
    if (ts) out.updatedAt = ts?.toDate ? ts.toDate().toISOString() : String(ts);

    return out;
  } catch (e) {
    console.warn('[getLiveRates] read failed — rates suppressed:', e);
    return null;
  }
}

/**
 * Render a rate for display, or a neutral placeholder when we have none.
 *
 * Use this anywhere a rate appears in prose. Never inline `rates!.field` — the
 * whole point is that the absent case is a real, expected state.
 */
export function formatRate(
  rates: LiveRates | null,
  field: keyof LiveRates,
  fallback = 'current rates',
): string {
  if (!rates) return fallback;
  const v = rates[field];
  return v ? `${v}%` : fallback;
}

/** True when we hold a full, current rate sheet worth advertising as live. */
export function hasLiveRates(rates: LiveRates | null): rates is LiveRates {
  return rates !== null;
}
