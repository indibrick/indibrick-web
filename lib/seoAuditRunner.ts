// SEO / GEO audit engine.
//
// Fetches a URL, parses the HTML with cheerio, computes five
// sub-scores and a rolled-up overall score. Issues found are
// returned in a machine-readable form the API layer can turn into
// /seoCalendar fix items (upserted, so re-runs don't multiply).
//
// Speed sub-score: PageSpeed Insights API if GOOGLE_PAGESPEED_API_KEY
// is set, otherwise a lightweight fallback based on the fetch's own
// timing. The fallback is marked so the UI can note it's estimated.

import * as cheerio from 'cheerio';
import { callClaude } from './anthropicClient';
import { buildAeoScorePrompt, PROMPT_VERSION } from './seoContentPrompts';
import type { SeoAuditResult, SeoAuditIssue, SeoAuditSubScores } from './seoAuditShape';

const FETCH_TIMEOUT_MS = 15_000;
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://indibrick.ca';

interface RunAuditOptions {
  url: string;
  runId: string;
  triggeredBy: string;
  skipAeoCall?: boolean; // for testing / to avoid Anthropic cost
}

export async function runAudit(opts: RunAuditOptions): Promise<SeoAuditResult> {
  const url = new URL(opts.url).toString();
  const urlPath = new URL(url).pathname;
  const runAt = new Date().toISOString();

  const issues: SeoAuditIssue[] = [];

  // 1) Fetch + time.
  const fetchStart = Date.now();
  let html = '';
  let status = 0;
  let responseTimeMs = 0;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'IndiBrickSeoOs/1.0 (+audit)' },
    });
    clearTimeout(t);
    status = res.status;
    html = await res.text();
    responseTimeMs = Date.now() - fetchStart;
  } catch (e: any) {
    issues.push({
      dimension: 'indexability',
      severity: 'critical',
      code: 'fetch-failed',
      message: `Could not fetch URL: ${e?.message || String(e)}`,
    });
    return finalize(opts, url, urlPath, runAt, blankSubScores(), issues, {});
  }
  if (status >= 400) {
    issues.push({
      dimension: 'indexability',
      severity: 'critical',
      code: 'http-error',
      message: `HTTP ${status}`,
    });
    return finalize(opts, url, urlPath, runAt, blankSubScores(), issues, {});
  }

  const $ = cheerio.load(html);

  // 2) Schema sub-score.
  const schemaScore = scoreSchema($, issues);

  // 3) Metadata sub-score.
  const metadataScore = scoreMetadata($, issues);

  // 4) Indexability sub-score.
  const { indexabilityScore, robotsIndexable, inSitemap } = await scoreIndexability(url, $, html, issues);

  // 5) Speed sub-score.
  const speedScore = await scoreSpeed(url, responseTimeMs, issues);

  // 6) GEO readiness — quick heuristic + optional Claude AEO scoring
  //    for a more nuanced number when the operator wants it.
  const bodyText = $('body').text();
  const directAnswerCount = countDirectAnswerBlocks($);
  let geoScore = quickGeoScore(directAnswerCount, bodyText, issues);
  if (!opts.skipAeoCall) {
    try {
      const r = await callClaude<any>(buildAeoScorePrompt({ url, bodyText }), {
        model: 'balanced',
        expectJson: true,
        maxTokens: 1024,
        // temperature omitted — Claude 5-family models reject it.
      });
      if (r.json && typeof r.json.geoReadinessScore === 'number') {
        geoScore = Math.max(0, Math.min(100, r.json.geoReadinessScore));
        if (Array.isArray(r.json.topIssues)) {
          for (const msg of r.json.topIssues.slice(0, 5)) {
            issues.push({
              dimension: 'geoReadiness',
              severity: 'medium',
              code: 'aeo-issue',
              message: String(msg),
            });
          }
        }
      }
    } catch { /* fall back to heuristic score; not fatal */ }
  }

  const subScores: SeoAuditSubScores = {
    schema: schemaScore,
    metadata: metadataScore,
    indexability: indexabilityScore,
    speed: speedScore,
    geoReadiness: geoScore,
  };

  const derived = {
    hasJsonLd: $('script[type="application/ld+json"]').length > 0,
    hasCanonical: $('link[rel="canonical"]').length > 0,
    robotsIndexable,
    inSitemap,
    aeoDirectAnswerBlocks: directAnswerCount,
  };

  return finalize(opts, url, urlPath, runAt, subScores, issues, derived);
}

function finalize(
  opts: RunAuditOptions,
  url: string,
  urlPath: string,
  runAt: string,
  subScores: SeoAuditSubScores,
  issues: SeoAuditIssue[],
  derived: Partial<SeoAuditResult>,
): SeoAuditResult {
  // Weighted overall: indexability + metadata carry the most weight
  // because they gate visibility altogether.
  const overallScore = Math.round(
    subScores.indexability * 0.25 +
    subScores.metadata * 0.25 +
    subScores.schema * 0.15 +
    subScores.speed * 0.15 +
    subScores.geoReadiness * 0.20
  );
  return {
    url,
    urlPath,
    runAt,
    runId: opts.runId,
    subScores,
    overallScore,
    issues,
    triggeredBy: opts.triggeredBy,
    tenantId: 'indibrick',
    ...derived,
  };
}

function blankSubScores(): SeoAuditSubScores {
  return { schema: 0, metadata: 0, indexability: 0, speed: 0, geoReadiness: 0 };
}

// ─── Sub-score routines ─────────────────────────────────────────────

function scoreSchema($: cheerio.CheerioAPI, issues: SeoAuditIssue[]): number {
  const jsonLdBlocks = $('script[type="application/ld+json"]');
  if (jsonLdBlocks.length === 0) {
    issues.push({
      dimension: 'schema',
      severity: 'high',
      code: 'schema-missing',
      message: 'No JSON-LD schema.org markup on this page.',
      suggestion: 'Add a schema.org block matching the page intent (Article, RealEstateAgent, LocalBusiness, FAQPage).',
    });
    return 0;
  }
  let validBlocks = 0;
  let hasNamedType = false;
  jsonLdBlocks.each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      validBlocks += 1;
      const t = parsed['@type'] || parsed['@graph']?.[0]?.['@type'];
      if (t) hasNamedType = true;
    } catch {
      issues.push({
        dimension: 'schema',
        severity: 'medium',
        code: 'schema-invalid-json',
        message: 'A JSON-LD block is not valid JSON.',
      });
    }
  });
  if (validBlocks === 0) return 20;
  if (!hasNamedType) {
    issues.push({
      dimension: 'schema',
      severity: 'medium',
      code: 'schema-missing-type',
      message: 'JSON-LD block has no @type — search engines can\'t categorize it.',
    });
    return 55;
  }
  return validBlocks >= 2 ? 100 : 85;
}

function scoreMetadata($: cheerio.CheerioAPI, issues: SeoAuditIssue[]): number {
  let score = 100;
  const title = $('head > title').first().text().trim();
  if (!title) {
    score -= 40;
    issues.push({ dimension: 'metadata', severity: 'critical', code: 'meta-title-missing', message: 'No <title> tag.' });
  } else if (title.length < 30 || title.length > 70) {
    score -= 10;
    issues.push({
      dimension: 'metadata', severity: 'low', code: 'meta-title-length',
      message: `Title is ${title.length} chars — 30-70 is the sweet spot.`,
    });
  }

  const description = $('meta[name="description"]').attr('content')?.trim();
  if (!description) {
    score -= 25;
    issues.push({ dimension: 'metadata', severity: 'high', code: 'meta-desc-missing', message: 'No meta description.' });
  } else if (description.length < 80 || description.length > 170) {
    score -= 5;
    issues.push({
      dimension: 'metadata', severity: 'low', code: 'meta-desc-length',
      message: `Description is ${description.length} chars — 80-170 is the sweet spot.`,
    });
  }

  if ($('link[rel="canonical"]').length === 0) {
    score -= 15;
    issues.push({
      dimension: 'metadata', severity: 'medium', code: 'canonical-missing',
      message: 'No canonical link — risks duplicate-content splits.',
    });
  }

  const h1Count = $('h1').length;
  if (h1Count === 0) {
    score -= 15;
    issues.push({ dimension: 'metadata', severity: 'high', code: 'h1-missing', message: 'No <h1>.' });
  } else if (h1Count > 1) {
    score -= 5;
    issues.push({
      dimension: 'metadata', severity: 'low', code: 'h1-multiple',
      message: `${h1Count} <h1> tags — should be exactly one.`,
    });
  }

  return Math.max(0, score);
}

async function scoreIndexability(
  url: string,
  $: cheerio.CheerioAPI,
  html: string,
  issues: SeoAuditIssue[],
): Promise<{ indexabilityScore: number; robotsIndexable: boolean; inSitemap: boolean }> {
  let score = 100;

  const metaRobots = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
  const noindex = /noindex/.test(metaRobots);
  const robotsIndexable = !noindex;
  if (noindex) {
    score -= 60;
    issues.push({
      dimension: 'indexability', severity: 'critical', code: 'meta-robots-noindex',
      message: 'meta robots="noindex" is set — this page cannot rank.',
    });
  }

  // Sitemap membership — only check for our own domain, otherwise skip.
  let inSitemap = false;
  const parsed = new URL(url);
  const siteOrigin = new URL(SITE_ORIGIN).host;
  if (parsed.host === siteOrigin) {
    try {
      const sm = await fetch(new URL('/sitemap.xml', SITE_ORIGIN).toString(), {
        headers: { 'User-Agent': 'IndiBrickSeoOs/1.0 (+audit)' },
      });
      if (sm.ok) {
        const text = await sm.text();
        // Naive contains check — good enough; sitemap can be an index of
        // sub-sitemaps and full traversal would be a rabbit hole.
        inSitemap = text.includes(url) || text.includes(parsed.pathname);
        if (!inSitemap) {
          score -= 20;
          issues.push({
            dimension: 'indexability', severity: 'medium', code: 'not-in-sitemap',
            message: 'URL not found in /sitemap.xml.',
          });
        }
      }
    } catch { /* sitemap unreachable — don't penalize, just skip */ }
  }

  return { indexabilityScore: Math.max(0, score), robotsIndexable, inSitemap };
}

async function scoreSpeed(url: string, fallbackMs: number, issues: SeoAuditIssue[]): Promise<number> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance`,
      );
      if (res.ok) {
        const data = await res.json() as any;
        const perf = data?.lighthouseResult?.categories?.performance?.score;
        if (typeof perf === 'number') {
          const score = Math.round(perf * 100);
          if (score < 50) {
            issues.push({
              dimension: 'speed', severity: 'high', code: 'lh-perf-low',
              message: `Lighthouse mobile perf ${score}/100 — fix render-blocking + image sizes.`,
            });
          }
          return score;
        }
      }
    } catch { /* fall through to timing estimate */ }
  }
  // Fallback: timing-based estimate. Not authoritative — flag it.
  const score = fallbackMs < 400 ? 95 : fallbackMs < 800 ? 80 : fallbackMs < 1600 ? 60 : fallbackMs < 3200 ? 40 : 20;
  issues.push({
    dimension: 'speed', severity: 'low', code: 'speed-estimated',
    message: `Speed sub-score ${score} is estimated from server response time (${fallbackMs}ms). Set GOOGLE_PAGESPEED_API_KEY for a real Lighthouse number.`,
  });
  return score;
}

function countDirectAnswerBlocks($: cheerio.CheerioAPI): number {
  // A direct-answer block = an H2/H3 immediately followed by a short
  // paragraph (< 400 chars) that reads like a definition / answer.
  let count = 0;
  $('h2, h3').each((_, el) => {
    const next = $(el).next();
    if (next.length && next.is('p')) {
      const text = next.text().trim();
      if (text.length > 40 && text.length < 400) count += 1;
    }
  });
  return count;
}

function quickGeoScore(directAnswerCount: number, bodyText: string, issues: SeoAuditIssue[]): number {
  let score = 40;
  if (directAnswerCount >= 3) score += 30;
  else if (directAnswerCount >= 1) score += 15;
  else issues.push({
    dimension: 'geoReadiness', severity: 'medium', code: 'aeo-no-direct-answer-blocks',
    message: 'No direct-answer blocks — LLMs need a short paragraph right after a heading to quote from.',
  });
  const words = bodyText.split(/\s+/).filter(Boolean).length;
  if (words > 1200) score += 20;
  else if (words > 500) score += 10;
  else issues.push({
    dimension: 'geoReadiness', severity: 'low', code: 'aeo-short-body',
    message: `Body is only ~${words} words — LLMs prefer longer factual pages.`,
  });
  // Numeric/date density signal.
  const digits = (bodyText.match(/\d/g) || []).length;
  if (digits > 50) score += 10;
  return Math.min(100, score);
}

export { PROMPT_VERSION };
