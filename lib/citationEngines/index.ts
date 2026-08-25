// Shared types + helpers for citation engine adapters.
//
// Every adapter is called with the same input and returns the same
// normalized output — a single row destined for /aiCitations. The
// orchestrator in lib/citationTracker.ts doesn't care how each
// engine got the answer, only what came back.

import type { CitationEngine } from '@/lib/aiCitationQueryShape';

export interface EngineCallInput {
  query: string;
  runId: string;
}

export interface EngineCallResult {
  engine: CitationEngine;
  query: string;
  runId: string;
  timestamp: string;              // ISO
  cited: boolean;
  citedUrls: string[];            // subset of allSourceUrls that are ours
  allSourceUrls: string[];        // full source list, capped
  snippet?: string | null;        // engine response snippet, capped
  latencyMs: number;
  estimatedCostUsd: number;
  errored: boolean;
  errorMessage?: string | null;
  status: 'ok' | 'not_configured' | 'errored';
}

// Any host under indibrick.ca (with or without subdomain) counts as
// "our citation". Includes safeguards for URL parse failures.
export function isIndibrickUrl(u: string): boolean {
  if (!u) return false;
  try {
    const host = new URL(u).host.toLowerCase();
    return host === 'indibrick.ca' || host.endsWith('.indibrick.ca');
  } catch { return false; }
}

// Extract the ours-subset from a source list.
export function pickOurCitations(allSourceUrls: string[]): string[] {
  return allSourceUrls.filter(isIndibrickUrl);
}

// Which engines are actually configured on this instance — driven by
// env-var presence. Dashboard uses this to grey out unconfigured
// engines in the query editor.
export function configuredEngines(): CitationEngine[] {
  const out: CitationEngine[] = [];
  if (process.env.PERPLEXITY_API_KEY) out.push('perplexity');
  if (process.env.ANTHROPIC_API_KEY)  out.push('claude');
  if (process.env.GEMINI_API_KEY)     out.push('gemini');
  if (process.env.OPENAI_API_KEY)     out.push('chatgpt');
  if (process.env.SERP_API_KEY)       out.push('google_ai_overviews');
  return out;
}

// Standardized "not configured" result — engine skipped, still gets
// a row so the timeline shows the gap explicitly rather than looking
// like a real drop to zero.
export function notConfiguredResult(engine: CitationEngine, input: EngineCallInput): EngineCallResult {
  return {
    engine,
    query: input.query,
    runId: input.runId,
    timestamp: new Date().toISOString(),
    cited: false,
    citedUrls: [],
    allSourceUrls: [],
    snippet: null,
    latencyMs: 0,
    estimatedCostUsd: 0,
    errored: false,
    status: 'not_configured',
    errorMessage: 'Engine not configured — set the API key env var.',
  };
}

export function erroredResult(engine: CitationEngine, input: EngineCallInput, error: string, latencyMs: number): EngineCallResult {
  return {
    engine,
    query: input.query,
    runId: input.runId,
    timestamp: new Date().toISOString(),
    cited: false,
    citedUrls: [],
    allSourceUrls: [],
    snippet: null,
    latencyMs,
    estimatedCostUsd: 0,
    errored: true,
    status: 'errored',
    errorMessage: error.slice(0, 1000),
  };
}
