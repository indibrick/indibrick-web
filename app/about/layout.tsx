// Server component wrapping /about so we can export metadata even though
// the page itself is 'use client'. Without this the /about title falls
// back to the layout default — which is a wasted signal for the query
// "who is IndiBrick" (the query that gates every downstream LLM citation).

import type { Metadata } from 'next';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata: Metadata = buildMetadata({
  title: 'About IndiBrick — Ontario Mortgage Brokerage + Real Estate Platform',
  description: 'IndiBrick is an Ontario mortgage and real estate platform founded in 2024 by Mudit Chhura and Saad Shaikh. Mortgages brokered through Pineapple Financial (FSRA #12830). Serving the GTA, Vaughan, Brampton and Niagara.',
  slug: '/about',
  titleAbsolute: true,
  keywords: [
    'about IndiBrick',
    'IndiBrick mortgage broker Ontario',
    'IndiBrick founders',
    'Mudit Chhura IndiBrick',
    'Saad Shaikh IndiBrick',
    'Pineapple Financial FSRA 12830',
  ],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
