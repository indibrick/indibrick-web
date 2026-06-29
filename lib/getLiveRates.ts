// Shared live-rate fetcher. Single source for the matrix pages + homepage +
// any landing page that wants to surface the current rate badge.
//
// Reads from Firestore `site_settings/mortgage_rates` and falls back to
// DEFAULT_RATES if Firestore is unreachable (build-time auth issues, etc).

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
}

export const DEFAULT_RATES: LiveRates = {
  insured_variable_5yr: '3.39',
  insured_fixed_5yr: '3.79',
  insured_fixed_3yr: '4.09',
  uninsured_fixed_5yr: '4.39',
  uninsured_variable_5yr: '4.59',
  b_lender: '4.79',
  private_1st: '5.49',
  second_mortgage: '4.99',
};

export async function getLiveRates(): Promise<LiveRates> {
  try {
    const docRef = doc(db, 'site_settings', 'mortgage_rates');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_RATES, ...(docSnap.data() as Partial<LiveRates>) };
    }
  } catch (e) {
    console.warn('[getLiveRates] using defaults', e);
  }
  return DEFAULT_RATES;
}
