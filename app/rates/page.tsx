// Server shell for /rates.
//
// This page was previously a single 'use client' component seeded from a
// DEFAULT_RATES constant, with the real sheet arriving in a useEffect. The
// server-rendered HTML — the only thing GPTBot, ClaudeBot and PerplexityBot
// ever read — therefore published the constants, as did the FinancialProduct
// JSON-LD built from that same pre-hydration state.
//
// On a mortgage site /rates is the single highest-value citation target, and
// it was the one page whose numbers an answer engine could not trust. The read
// now happens on the server and the real sheet is the first paint.

import RatesClient from './RatesClient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Rate sheets change on lender bulletins, not on a schedule. An hour keeps the
// crawlable copy fresh without hammering Firestore during a full site build.
export const revalidate = 3600;

async function readRateSheet(): Promise<Record<string, string> | null> {
  try {
    const snap = await getDoc(doc(db, 'site_settings', 'mortgage_rates'));
    if (!snap.exists()) {
      console.warn('[/rates] site_settings/mortgage_rates missing');
      return null;
    }
    const raw = snap.data() as Record<string, unknown>;
    // Coerce to strings and drop anything non-scalar so the client receives a
    // clean, serialisable payload.
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string' || typeof v === 'number') out[k] = String(v);
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch (e) {
    console.warn('[/rates] rate sheet read failed:', e);
    return null;
  }
}

export default async function RatesPage() {
  const initialRates = await readRateSheet();
  return <RatesClient initialRates={initialRates} />;
}
