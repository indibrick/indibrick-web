// Environment + rate-limit configuration for the enrichment pipeline.
// Keep these polite — we're hitting free, community-maintained APIs.

export const CONFIG = {
  // Anthropic model. Override with env var if a newer model ships.
  // claude-sonnet-5 is the default; users can pin a specific ID via
  // ANTHROPIC_MODEL=claude-sonnet-4-5-20250929 style.
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',

  // Where the pipeline writes results as it goes. Resumable — an entry
  // present here means it's already been researched.
  stagingPath: 'scripts/enrich-neighborhoods/staging.ts',
  cacheDir: 'scripts/enrich-neighborhoods/.cache',

  // Rate limits — deliberately conservative to be a good citizen on free APIs.
  // Nominatim's public policy: max 1 request per second.
  nominatimIntervalMs: 1100,
  // Overpass: max 10k queries/day. We use ~1 per neighborhood so we're fine,
  // but throttle to keep server load light.
  overpassIntervalMs: 800,
  // Wikipedia REST API: no hard limit but keep it human-scale.
  wikipediaIntervalMs: 200,
  // walkscore.com HTML scrape: unofficial. Be gentle to avoid blocks.
  walkscoreIntervalMs: 1500,

  // Per-call HTTP timeouts.
  httpTimeoutMs: 15_000,

  // Retry policy.
  maxRetries: 3,
  retryBaseMs: 800,

  // Cap number of neighborhoods per run — set to 0 for unlimited.
  // Useful when testing: `LIMIT=5 npm run enrich` runs only 5 entries.
  limit: parseInt(process.env.LIMIT || '0', 10) || 0,

  // How many notable spots / transit stops / schools to keep max.
  maxTransitStations: 5,
  maxNotableSpots: 6,

  // User-Agent header for polite scraping.
  userAgent:
    'IndiBrick-Enrichment/1.0 (contact: sales@indibrick.ca) — non-commercial neighborhood metadata research',
};
