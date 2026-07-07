import { MetadataRoute } from 'next';
import { CityService } from '../services/CityService';
import { ContentService } from '../services/ContentService';
import { PropertyService } from '../services/PropertyService';
import { MarketDataService } from '../services/MarketDataService';
import { getMarketData } from '../lib/marketData/loader';
import { CITIES } from '../data/cityData';
import { BROKER_CITIES } from '../data/mortgageBrokerCities';

// Slug helper — mirrors the one used in the neighborhood route.
const slugifyNeighborhood = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ISR — regenerate at most once an hour. Protects Firestore + keeps Google fed.
export const revalidate = 3600;

// High-volume cities get crawl-budget priority.
const HIGH_VOLUME_CITIES = new Set([
  'toronto', 'mississauga', 'brampton', 'vaughan', 'markham',
  'oakville', 'hamilton', 'burlington', 'richmond-hill', 'ottawa',
]);

// Static routes — organized by intent so future edits don't accidentally
// exclude a landing page (which was the previous bug: /apply, AURA, Hamilton,
// /royal-tuscan, /bad-credit-private-mortgages, /reverse-mortgages,
// /reverse-mortgage-calculator, /mortgage-penalty-calculator, /hst-rebate-calculator,
// /tools/smith-maneuver-calculator, /architecture, /city-data, /locations,
// /blog and /apply were all missing from the previous list).
const STATIC_ROUTES: { path: string; priority?: number }[] = [
  { path: '', priority: 1.0 },
  { path: '/about', priority: 0.8 },
  { path: '/services', priority: 0.8 },
  { path: '/mortgages', priority: 0.85 },
  { path: '/contact', priority: 0.7 },
  { path: '/rates', priority: 0.95 },
  // The IndiBrick Ontario Housing Index — named data asset, high citation
  // priority so LLM crawlers pick it up first.
  { path: '/housing-index', priority: 0.95 },
  { path: '/guides/first-time-home-buyer-ontario-2026', priority: 0.85 },
  { path: '/guides/best-mortgage-broker-ontario-2026', priority: 0.85 },
  { path: '/listings', priority: 0.85 },
  { path: '/market-news', priority: 0.7 },
  { path: '/careers', priority: 0.5 },
  { path: '/privacy-policy', priority: 0.3 },
  { path: '/terms-and-conditions', priority: 0.3 },
  // Funnel + conversion
  { path: '/apply', priority: 0.9 },
  { path: '/thank-you', priority: 0.2 },
  // Calculators + tools
  { path: '/tools', priority: 0.7 },
  { path: '/mortgage-payment-calculator', priority: 0.75 },
  { path: '/land-transfer-tax-calculator-ontario', priority: 0.75 },
  { path: '/affordability-calculator', priority: 0.8 },
  { path: '/closing-costs-calculator', priority: 0.7 },
  { path: '/down-payment-calculator', priority: 0.7 },
  { path: '/mortgage-renewal-calculator', priority: 0.7 },
  { path: '/refinance-calculator', priority: 0.7 },
  { path: '/trigger-rate-calculator', priority: 0.7 },
  { path: '/mortgage-penalty-calculator', priority: 0.7 },
  { path: '/hst-rebate-calculator', priority: 0.7 },
  { path: '/reverse-mortgage-calculator', priority: 0.7 },
  { path: '/tools/universal-life-calculator', priority: 0.65 },
  { path: '/tools/segregated-fund-calculator', priority: 0.65 },
  { path: '/tools/smith-maneuver-calculator', priority: 0.65 },
  // Services + verticals
  { path: '/commercial-lending', priority: 0.75 },
  { path: '/insurance-financial-protection', priority: 0.7 },
  { path: '/investment-planning-wealth-growth', priority: 0.7 },
  { path: '/pre-construction-projects', priority: 0.75 },
  { path: '/property-management', priority: 0.6 },
  { path: '/realtor-network', priority: 0.7 },
  { path: '/renovation-contractors', priority: 0.6 },
  { path: '/trusted-real-estate-lawyers', priority: 0.65 },
  { path: '/commercial-auto-home-insurance', priority: 0.6 },
  { path: '/mortgage-rate-forecast', priority: 0.75 },
  { path: '/bad-credit-private-mortgages', priority: 0.8 },
  { path: '/reverse-mortgages', priority: 0.7 },
  { path: '/architecture', priority: 0.5 },
  // Content hubs
  { path: '/blog', priority: 0.8 },
  { path: '/city-data', priority: 0.7 },
  { path: '/locations', priority: 0.6 },
  // Featured property/business-for-sale landings
  { path: '/aura-lakeview-village', priority: 0.75 },
  { path: '/royal-tuscan', priority: 0.7 },
  { path: '/hamilton-restaurant-for-sale', priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://indibrick.ca';
  const buildTime = new Date();

  console.log('🚀 [SEO] GENERATING SITEMAP...');

  // Static pages — build-time lastmod is the honest signal here (their
  // content changes when we deploy). Google trusts this pattern.
  const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority = 0.7 }) => ({
    url: `${baseUrl}${path}`,
    lastModified: buildTime,
    changeFrequency: 'weekly',
    priority,
  }));

  try {
    // Parallel fetch of everything the data-driven URLs need.
    const [cities, posts, properties, marketData] = await Promise.all([
      CityService.getAllCities(),
      ContentService.fetchPosts(),
      PropertyService.fetchProperties(),
      getMarketData().catch(() => null),
    ]);

    console.log(`📊 Indexing: ${cities.length} Cities | ${posts.length} Posts | ${properties.length} Properties`);

    // Per-city HPI release date — real content freshness signal for matrix
    // and neighborhood pages. Falls back to build time only when we truly
    // have no data for that city. Returns a fresh Date instance each call
    // so downstream serialization can't accidentally mutate shared refs.
    const cityDataDate = (citySlug: string): Date => {
      const stats = marketData?.byCity.get(citySlug);
      return stats?.asOf ? new Date(stats.asOf) : buildTime;
    };

    // City hub pages — same lastmod as the HPI reading, since that's
    // the primary content driver of these pages.
    const cityUrls: MetadataRoute.Sitemap = cities.map((city) => ({
      url: `${baseUrl}/mortgage-real-estate/${city.slug}`,
      lastModified: cityDataDate(city.slug),
      changeFrequency: 'monthly',
      priority: HIGH_VOLUME_CITIES.has(city.slug) ? 0.9 : 0.75,
    }));

    // Mortgage-broker city landings — 50 dedicated commercial-intent pages
    // targeting "mortgage broker {city}" queries. High crawl priority
    // because these are the actual money queries for the lead funnel.
    const brokerCityUrls: MetadataRoute.Sitemap = BROKER_CITIES.map((c) => ({
      url: `${baseUrl}/mortgage-broker/${c.slug}`,
      lastModified: c.hasMatrixData ? cityDataDate(c.slug) : buildTime,
      changeFrequency: 'weekly',
      priority: HIGH_VOLUME_CITIES.has(c.slug) ? 0.95 : 0.85,
    }));

    // Pre-construction city hubs — evergreen listings; weekly cadence.
    const preConUrls: MetadataRoute.Sitemap = cities.map((city) => ({
      url: `${baseUrl}/pre-construction-condos/${city.slug}`,
      lastModified: buildTime,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Blog posts — real per-post lastmod from Firestore.
    const blogUrls: MetadataRoute.Sitemap = posts.map((post) => {
      const raw: any = (post as any).date;
      const lastModified: Date = raw?.toDate
        ? raw.toDate()
        : new Date(raw || Date.now());
      return {
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.65,
      };
    });

    const propertyUrls: MetadataRoute.Sitemap = properties.map((p: any) => ({
      url: `${baseUrl}/listings/${p.slug || p.id}`,
      lastModified: buildTime,
      changeFrequency: 'daily',
      priority: 0.75,
    }));

    // pSEO matrix — per-cell lastmod = the HPI release date for that city.
    // Was previously `new Date()` on every cell, which Google treats as noise.
    const matrixUrls: MetadataRoute.Sitemap = MarketDataService.enumerateCells().map((cell) => ({
      url: `${baseUrl}/real-estate/${cell.city}/${cell.type}/${cell.price}`,
      lastModified: cityDataDate(cell.city),
      changeFrequency: 'monthly',
      priority: HIGH_VOLUME_CITIES.has(cell.city) ? 0.9 : 0.7,
    }));

    // Neighborhood pages — same city-anchored lastmod.
    const neighborhoodUrls: MetadataRoute.Sitemap = CITIES.flatMap((c) =>
      c.neighborhoods.map((n) => ({
        url: `${baseUrl}/real-estate/${c.slug}/neighborhood/${slugifyNeighborhood(n)}`,
        lastModified: cityDataDate(c.slug),
        changeFrequency: 'monthly',
        priority: HIGH_VOLUME_CITIES.has(c.slug) ? 0.85 : 0.65,
      })),
    );

    console.log(`📊 pSEO matrix: ${matrixUrls.length} cells | neighborhoods: ${neighborhoodUrls.length}`);
    console.log(`📊 static: ${staticPages.length} | blog: ${blogUrls.length} | listings: ${propertyUrls.length}`);
    console.log('✅ [SEO] SITEMAP COMPLETE.');

    return [
      ...staticPages,
      ...cityUrls,
      ...brokerCityUrls,
      ...preConUrls,
      ...matrixUrls,
      ...neighborhoodUrls,
      ...blogUrls,
      ...propertyUrls,
    ];
  } catch (error) {
    console.error('❌ CRITICAL SITEMAP ERROR:', error);
    // Fallback so Google still gets the static routes and doesn't penalize.
    return staticPages;
  }
}
