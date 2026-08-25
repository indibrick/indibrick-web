// Google AI Overviews — no official Google API for detection.
// Uses a SERP scraper (SerpAPI by default, DataForSEO also supported).
//
// The AIO block in SerpAPI's response lives at `.ai_overview.text_blocks`
// with source references at `.ai_overview.references[].link`.
// DataForSEO returns something analogous under `ai_overview` when
// requesting an organic SERP with AI mode enabled.
//
// This is the ONLY paid dependency in the tracker — flagged upfront
// in the work order. Skipped cleanly when SERP_API_KEY is unset.

import {
  type EngineCallInput,
  type EngineCallResult,
  notConfiguredResult,
  erroredResult,
  pickOurCitations,
} from './index';

const COST_PER_QUERY_USD = 0.005; // SerpAPI ~$75/5000 searches
const SNIPPET_MAX = 1500;

export async function callAiOverviews(input: EngineCallInput): Promise<EngineCallResult> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) return notConfiguredResult('google_ai_overviews', input);
  const provider = (process.env.SERP_API_PROVIDER || 'serpapi').toLowerCase();
  const start = Date.now();

  try {
    if (provider === 'serpapi') return await viaSerpApi(input, apiKey, start);
    if (provider === 'dataforseo') return await viaDataForSeo(input, apiKey, start);
    return erroredResult('google_ai_overviews', input, `Unknown SERP_API_PROVIDER: ${provider}`, Date.now() - start);
  } catch (e: any) {
    return erroredResult('google_ai_overviews', input, e?.message || String(e), Date.now() - start);
  }
}

async function viaSerpApi(input: EngineCallInput, apiKey: string, start: number): Promise<EngineCallResult> {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('q', input.query);
  url.searchParams.set('engine', 'google');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('gl', 'ca'); // Canada — IndiBrick's market
  url.searchParams.set('hl', 'en');

  const res = await fetch(url.toString());
  if (!res.ok) {
    return erroredResult('google_ai_overviews', input, `SerpAPI HTTP ${res.status}`, Date.now() - start);
  }
  const data = await res.json() as any;
  const aio = data?.ai_overview;
  if (!aio) {
    // No AIO block for this query — record as "not cited" (which is
    // correct: AIO didn't fire, so we weren't cited in one).
    return {
      engine: 'google_ai_overviews',
      query: input.query,
      runId: input.runId,
      timestamp: new Date().toISOString(),
      cited: false,
      citedUrls: [],
      allSourceUrls: [],
      snippet: null,
      latencyMs: Date.now() - start,
      estimatedCostUsd: COST_PER_QUERY_USD,
      errored: false,
      status: 'ok',
    };
  }
  const refs: any[] = Array.isArray(aio.references) ? aio.references : [];
  const allSourceUrls: string[] = refs.map(r => r?.link).filter((s: any) => typeof s === 'string').slice(0, 20);
  const text = Array.isArray(aio.text_blocks)
    ? aio.text_blocks.map((t: any) => t?.snippet || t?.text || '').join(' ')
    : (aio.snippet || '');
  const citedUrls = pickOurCitations(allSourceUrls);
  return {
    engine: 'google_ai_overviews',
    query: input.query,
    runId: input.runId,
    timestamp: new Date().toISOString(),
    cited: citedUrls.length > 0,
    citedUrls,
    allSourceUrls,
    snippet: String(text).slice(0, SNIPPET_MAX),
    latencyMs: Date.now() - start,
    estimatedCostUsd: COST_PER_QUERY_USD,
    errored: false,
    status: 'ok',
  };
}

async function viaDataForSeo(input: EngineCallInput, apiKey: string, start: number): Promise<EngineCallResult> {
  // DataForSEO expects the key as `login:password` base64. If the user
  // stored just a login:password string we base64 it here.
  const b64 = /^[A-Za-z0-9+/=]+$/.test(apiKey) && apiKey.length > 30 ? apiKey : Buffer.from(apiKey).toString('base64');
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${b64}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{
      keyword: input.query,
      location_code: 2124, // Canada
      language_code: 'en',
      device: 'desktop',
      calculate_rectangles: false,
    }]),
  });
  if (!res.ok) return erroredResult('google_ai_overviews', input, `DataForSEO HTTP ${res.status}`, Date.now() - start);
  const data = await res.json() as any;
  const items = data?.tasks?.[0]?.result?.[0]?.items || [];
  const aioItem = items.find((it: any) => it?.type === 'ai_overview');
  if (!aioItem) {
    return {
      engine: 'google_ai_overviews', query: input.query, runId: input.runId,
      timestamp: new Date().toISOString(),
      cited: false, citedUrls: [], allSourceUrls: [], snippet: null,
      latencyMs: Date.now() - start, estimatedCostUsd: COST_PER_QUERY_USD,
      errored: false, status: 'ok',
    };
  }
  const refs: any[] = aioItem?.references || aioItem?.items || [];
  const allSourceUrls: string[] = refs.map(r => r?.url || r?.link).filter((s: any) => typeof s === 'string').slice(0, 20);
  const text = aioItem?.text || aioItem?.title || '';
  const citedUrls = pickOurCitations(allSourceUrls);
  return {
    engine: 'google_ai_overviews', query: input.query, runId: input.runId,
    timestamp: new Date().toISOString(),
    cited: citedUrls.length > 0, citedUrls, allSourceUrls,
    snippet: String(text).slice(0, SNIPPET_MAX),
    latencyMs: Date.now() - start, estimatedCostUsd: COST_PER_QUERY_USD,
    errored: false, status: 'ok',
  };
}
