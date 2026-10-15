// Typed reader for the brokerage rate sheet in Firestore.
//
// /rates reads the same document and hands the whole sheet to a client
// component for its matrix. This reader exists for pages that need a handful
// of specific rates server-side — the forecast page compares our posted
// 5-year fixed against the Government of Canada bond yield, and that
// comparison is only honest if the rate comes from the live sheet rather
// than a number pasted into JSX months ago.

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface RateSheet {
  insured5yrFixed: number | null;
  uninsured5yrFixed: number | null;
  insured5yrVariable: number | null;
  uninsured5yrVariable: number | null;
  /** Date the sheet was last revised, as stored. */
  lastUpdated: string | null;
}

const EMPTY: RateSheet = {
  insured5yrFixed: null,
  uninsured5yrFixed: null,
  insured5yrVariable: null,
  uninsured5yrVariable: null,
  lastUpdated: null,
};

function num(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Read the posted rates this page needs.
 *
 * Returns nulls rather than throwing or substituting invented numbers: a
 * missing rate means the comparison block renders without a figure, which is
 * correct. Quoting a stale rate next to a live bond yield would be worse
 * than quoting none.
 */
export async function getRateSheet(): Promise<RateSheet> {
  try {
    const snap = await getDoc(doc(db, 'site_settings', 'mortgage_rates'));
    if (!snap.exists()) {
      console.warn('[rateSheet] site_settings/mortgage_rates missing');
      return EMPTY;
    }
    const d = snap.data() as Record<string, unknown>;
    return {
      insured5yrFixed: num(d.insured_5yr_fixed) ?? num(d.insured_fixed_5yr),
      uninsured5yrFixed: num(d.uninsured_5yr_fixed) ?? num(d.uninsured_fixed_5yr),
      insured5yrVariable: num(d.insured_5yr_variable) ?? num(d.insured_variable_5yr),
      uninsured5yrVariable: num(d.uninsured_5yr_variable) ?? num(d.uninsured_variable_5yr),
      lastUpdated: typeof d.lastUpdated === 'string' ? d.lastUpdated : null,
    };
  } catch (e) {
    console.warn('[rateSheet] read failed:', e);
    return EMPTY;
  }
}
