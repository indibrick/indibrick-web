import { MetadataRoute } from 'next';
import { CityService } from '../services/CityService';
import { ContentService } from '../services/ContentService';
import { PropertyService } from '../services/PropertyService';
import { MarketDataService } from '../services/MarketDataService';
import { getMarketData } from '../lib/marketData/loader';
import { CITIES } from '../data/cityData';
import { allAuthors } from '../lib/authors';
import { BROKER_CITIES } from '../data/mortgageBrokerCities';
import { getNeighborhoodExtras, isIndexableNeighborhood } from '../data/neighborhoodExtras';

// Slugs that this deploy either 301s away or serves as noindex. Single source
// of truth is data/blogPrunePlan.mjs, which next.config.mjs also reads for the
// redirects themselves — so the sitemap and the redirect table cannot drift.
import { BLOG_REDIRECTS, BLOG_NOINDEX_SLUGS } from '../data/blogPrunePlan.mjs';

const PRUNED_BLOG_SLUGS = new Set<string>([
  ...BLOG_REDIRECTS.map((r: any) => r.slug),
  ...BLOG_NOINDEX_SLUGS,
]);

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
  // Lead-gen landing pages — 2026 mortgage-market conversion funnels
  { path: '/renewal-rescue', priority: 0.95 },
  { path: '/six-minute-approval', priority: 0.9 },
  { path: '/refi-payout-plan', priority: 0.9 },
  // Partner-side landing pages (B2B — realtor + insurance-agent recruitment)
  { path: '/for-realtors', priority: 0.85 },
  { path: '/for-insurance-agents', priority: 0.85 },
  { path: '/pricing', priority: 0.9 },
  { path: '/vs-gohighlevel', priority: 0.75 },
  { path: '/vs-follow-up-boss', priority: 0.75 },
  // Featured new-build community landings — high-intent commercial pages
  // for organic search on builder + address queries.
  { path: '/listings/mira-dunsire', priority: 0.9 },
  { path: '/listings/vicinity-mattamy', priority: 0.9 },
  { path: '/listings/south-barrie', priority: 0.9 },
  { path: '/listings/midhurst-valley', priority: 0.9 },
  // /situations/* — playbook family, one page per common mortgage life-event.
  // Each has its own capture form + FSRA-licensed broker callback.
  { path: '/situations', priority: 0.9 },
  { path: '/situations/declined-by-bank', priority: 0.95 },
  { path: '/situations/mortgage-renewal', priority: 0.9 },
  { path: '/situations/refinance-debt-consolidation', priority: 0.9 },
  { path: '/situations/pre-construction-closing', priority: 0.85 },
  { path: '/situations/investment-property', priority: 0.85 },
  { path: '/situations/first-time-buyer', priority: 0.85 },
  { path: '/situations/new-to-canada', priority: 0.85 },
  { path: '/situations/reverse-mortgage', priority: 0.9 },
  // Calculators + tools
  { path: '/tools', priority: 0.7 },
  // Flagship calculator — targets the "mortgage calculator" head terms while
  // the specialist calculators below hold their long-tail.
  { path: '/tools/mortgage-qualifier', priority: 0.9 },
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
  // E-E-A-T trust surfaces. On a YMYL financial site these carry real
  // ranking weight — Google's rater guidelines look for a resolvable
  // author entity and a published editorial standard.
  { path: '/authors', priority: 0.7 },
  { path: '/editorial-policy', priority: 0.6 },
  // Content hubs
  { path: '/blog', priority: 0.8 },
  // /city-data is noindex until its market data comes from a cited source —
  // see app/city-data/[slug]/page.tsx. Submitting a noindexed URL is a
  // contradictory signal, so the hub is withheld with the reports.
  // { path: '/city-data', priority: 0.7 },
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
  // Author entity pages — one per contributor. Emitted alongside the
  // static set so they're submitted even if the Firestore fetch below
  // fails and we fall back to `staticPages`.
  const authorUrls: MetadataRoute.Sitemap = allAuthors().map((a) => ({
    url: `${baseUrl}/authors/${a.slug}`,
    lastModified: buildTime,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

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

    // Pre-construction city hubs are NOT submitted.
    //
    // Correction: an earlier version of this comment said the route serves
    // noindex,follow. It does not. PRE_CON_CITIES is empty, so
    // generateStaticParams returns [] and the route 404s — the noindex branch
    // in generateMetadata is unreachable. Those ~41 URLs are now 301'd to
    // /pre-construction-projects from next.config.mjs, which preserves the
    // inbound link equity a 404 would have thrown away.
    //
    // Re-add this block the day those pages ship real named projects.
    const preConUrls: MetadataRoute.Sitemap = [];

    // Blog posts — real per-post lastmod from Firestore.
    // Drafts and posts flagged `noindex` are excluded: submitting a URL we
    // serve as noindex is a contradictory signal that wastes crawl budget and
    // shows up in Search Console as "Submitted URL marked noindex".
    // The `noindex` flag lives in Firestore and is only written when someone
    // runs `scripts/pruneBlog.ts --apply`. The 301s in next.config.mjs, by
    // contrast, go live the instant this deploys. Filtering on Firestore alone
    // meant that for the whole window between deploy and running the script,
    // the sitemap advertised 9 URLs that immediately redirect — "Submitted URL
    // has redirect" in Search Console, the exact contradictory signal the rest
    // of this work exists to remove.
    //
    // Filter on the plan file directly so ship order stops mattering. The
    // Firestore check stays as a second line of defence for posts pruned
    // outside the plan.
    const blogUrls: MetadataRoute.Sitemap = posts
      .filter((p: any) => p.slug && p.status !== 'draft' && p.noindex !== true && !PRUNED_BLOG_SLUGS.has(p.slug))
      .map((post) => {
        const raw: any = (post as any).dateModified ?? (post as any).date;
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

    // pSEO matrix — only the cells that carry a real, in-band CREA benchmark.
    // Submitting all 800 permutations while ~80% of them serve noindex is a
    // contradictory signal: it burns crawl budget on pages we've already decided
    // don't deserve to rank, and it's what produced the "Crawled – currently not
    // indexed" pile in Search Console. See
    // MarketDataService.getCellIndexability() for the three rules.
    const indexableCells = await MarketDataService.enumerateIndexableCells();
    const matrixUrls: MetadataRoute.Sitemap = indexableCells.map((cell) => ({
      url: `${baseUrl}/real-estate/${cell.city}/${cell.type}/${cell.price}`,
      lastModified: cityDataDate(cell.city),
      changeFrequency: 'monthly',
      priority: HIGH_VOLUME_CITIES.has(cell.city) ? 0.9 : 0.7,
    }));

    // Neighborhood pages — only those with substantive curated content. The
    // remainder render for users as noindex,follow and are excluded here for the
    // same reason as the matrix cells above.
    const neighborhoodUrls: MetadataRoute.Sitemap = CITIES.flatMap((c) =>
      c.neighborhoods
        .filter((n) => isIndexableNeighborhood(getNeighborhoodExtras(c.slug, slugifyNeighborhood(n))))
        .map((n) => ({
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
      ...authorUrls,
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
    return [...staticPages, ...authorUrls];
  }
}
