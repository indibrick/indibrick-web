// Machine-readable manifest for the IndiBrick Ontario Housing Index.
// Referenced from the /housing-index page's schema.org Dataset →
// distribution.contentUrl, so LLM crawlers can fetch a stable structured
// payload without needing to parse the HTML page.
//
// Cache: 1h fresh + 24h stale-while-revalidate — matches the ISR cadence
// of the source pages.

import { NextResponse } from 'next/server';
import { MarketDataService } from '../../../../services/MarketDataService';

export const revalidate = 3600;

export async function GET() {
  const snap = await MarketDataService.getIndexSnapshot();

  const payload = {
    name: 'IndiBrick Ontario Housing Index',
    version: 1,
    publisher: {
      name: 'IndiBrick Financial',
      url: 'https://indibrick.ca',
      canonical: 'https://indibrick.ca/housing-index',
    },
    license: {
      terms: 'https://indibrick.ca/housing-index#terms',
      attribution: 'IndiBrick Ontario Housing Index — indibrick.ca/housing-index',
    },
    sources: [
      {
        name: 'CREA MLS® Home Price Index',
        publisher: 'Canadian Real Estate Association',
        url: 'https://www.crea.ca/housing-market-stats/mls-home-price-index/',
      },
      {
        name: 'TRREB Market Watch',
        publisher: 'Toronto Regional Real Estate Board',
        url: 'https://trreb.ca/market-data/market-watch/',
      },
    ],
    ...snap,
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      // Explicitly permit cross-origin machine reads so ChatGPT / Perplexity
      // browsing agents don't hit a CORS wall when fetching from the schema
      // Dataset distribution URL.
      'Access-Control-Allow-Origin': '*',
    },
  });
}
