// Server shell for /mortgages — same reasoning as app/rates/page.tsx.
//
// The page was a 'use client' component seeded from a DEFAULT_RATES constant,
// so the server-rendered HTML that crawlers and answer engines read published
// those constants rather than the live sheet.

import MortgagesClient from './MortgagesClient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const revalidate = 3600;

async function readRateSheet(): Promise<Record<string, string> | null> {
  try {
    const snap = await getDoc(doc(db, 'site_settings', 'mortgage_rates'));
    if (!snap.exists()) return null;
    const raw = snap.data() as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string' || typeof v === 'number') out[k] = String(v);
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch (e) {
    console.warn('[/mortgages] rate sheet read failed:', e);
    return null;
  }
}

export default async function MortgagesPage() {
  const initialRates = await readRateSheet();
  return <MortgagesClient initialRates={initialRates} />;
}
