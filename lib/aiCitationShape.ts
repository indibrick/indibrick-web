// Time-series citation / mention record.
//
// One row per (engine, query, runId). A run is the batch that a
// scheduled Cloud Run job fires — all queries for a single tick get
// the same runId so we can group them for the "as of X, our
// citation rate was Y" view.
//
// Engines with different capabilities:
//   - perplexity : returns citations natively (sonar models)
//   - claude     : web-search tool returns sources — most reliable
//   - chatgpt    : browsing model + we parse response for source links
//   - gemini     : grounding metadata returns source URLs
//   - google_ai_overviews : no official API — SERP scraper (paid), deferred

export type CitationEngine =
  | 'chatgpt'
  | 'claude'
  | 'perplexity'
  | 'google_ai_overviews'
  | 'gemini';

export interface AiCitationRecord {
  engine: CitationEngine;
  query: string;              // exact query submitted
  queryNormalized: string;    // lowercased + trimmed for grouping

  runId: string;              // batch id from the scheduled job
  timestamp: string;          // ISO — when we made the call

  cited: boolean;             // did any indibrick.ca URL appear as a source?
  citedUrls: string[];        // subset of sources that are ours
  allSourceUrls: string[];    // full source list, up to 20

  // Snippet the engine returned around the citation — helpful for
  // "how are we being described" review. Capped at 2KB.
  snippet?: string | null;

  // Cost + latency tracking so we can see whether the tracker is
  // getting expensive.
  latencyMs?: number;
  estimatedCostUsd?: number;

  // If the engine call failed we still write a row (cited: false)
  // so a gap in the time series doesn't look like a real drop.
  errored?: boolean;
  errorMessage?: string | null;

  tenantId?: string;
}

const SNIPPET_MAX = 2048;

export function projectCitation(input: Partial<AiCitationRecord>): AiCitationRecord | { error: string } {
  const engine = input.engine;
  if (!engine || !['chatgpt', 'claude', 'perplexity', 'google_ai_overviews', 'gemini'].includes(engine)) {
    return { error: 'engine invalid' };
  }
  const query = String(input.query || '').trim();
  if (!query) return { error: 'query required' };

  const snippet = input.snippet ? String(input.snippet).slice(0, SNIPPET_MAX) : null;
  return {
    engine: engine as CitationEngine,
    query,
    queryNormalized: query.toLowerCase(),
    runId: String(input.runId || ''),
    timestamp: input.timestamp || new Date().toISOString(),
    cited: !!input.cited,
    citedUrls: (input.citedUrls || []).slice(0, 20),
    allSourceUrls: (input.allSourceUrls || []).slice(0, 20),
    snippet,
    latencyMs: input.latencyMs,
    estimatedCostUsd: input.estimatedCostUsd,
    errored: !!input.errored,
    errorMessage: input.errorMessage || null,
    tenantId: input.tenantId || 'indibrick',
  };
}
