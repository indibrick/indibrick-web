// Server component so we can export metadata for /rates.
// The page itself is 'use client' (interactive rate table + quote wizard),
// so per-page metadata has to live on this layout — without this file the
// title falls back to the root layout's default, which was killing the
// ranking potential of one of the highest-intent URLs on the site.

import type { Metadata } from 'next';
import { buildMetadata } from '../../lib/buildMetadata';

// Build-time month string in the title so Google sees a fresh, dated page
// on every deploy — matches how Ratehub/WOWA present rates.
const now = new Date();
const monthYear = now.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

export const metadata: Metadata = buildMetadata({
  // The rate was hardcoded here. A title tag is the most-cached string on a
  // page — quoting a stale number in it advertises a rate we may no longer
  // offer, on the page whose entire job is to be current. The month keeps the
  // freshness signal without asserting a price.
  title: `Ontario Mortgage Rates ${monthYear} — 5-Year Fixed, Variable & B-Lender | IndiBrick`,
  description: `Live wholesale mortgage rates in Ontario for ${monthYear}. Compare insured, insurable and uninsured 5-year fixed and variable rates from 50+ Canadian lenders. Updated daily by IndiBrick (via Pineapple Financial, FSRA #12830).`,
  slug: '/rates',
  titleAbsolute: true,
  keywords: [
    'Ontario mortgage rates',
    'Toronto mortgage rates',
    '5 year fixed mortgage rate Ontario',
    'variable mortgage rate Canada',
    'wholesale mortgage rates',
    'best mortgage rates Ontario',
    'IndiBrick rates',
    'mortgage broker rates Ontario',
  ],
});

export default function RatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
