// Tracker orchestrator.
//
// For each active tracked query × its enabled engines (intersected
// with what's configured on this instance), calls the adapter and
// writes the result to /aiCitations. Runs concurrent per-query,
// sequential per-engine to respect rate limits.
//
// Called two ways:
//   - Cloud Scheduler → /api/admin/seo-os/citation-tracker/run
//   - Manual admin trigger from the dashboard "Run now" button
//
// Both paths funnel through runTracker(). The API layer handles auth.

import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CitationEngine, AiCitationQueryDoc } from '@/lib/aiCitationQueryShape';
import { projectCitation } from '@/lib/aiCitationShape';
import { callPerplexity } from './citationEngines/perplexity';
import { callClaudeEngine } from './citationEngines/claude';
import { callGemini } from './citationEngines/gemini';
import { callOpenAi } from './citationEngines/openai';
import { callAiOverviews } from './citationEngines/aiOverviews';
import { configuredEngines, type EngineCallResult } from './citationEngines/index';

const CONCURRENCY = 3; // queries in flight at once; engines within each query are sequential

interface RunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string;
  queriesProcessed: number;
  perEngine: Record<CitationEngine, { ok: number; errored: number; notConfigured: number; citedCount: number }>;
  totalCostUsd: number;
  totalLatencyMs: number;
}

function emptyPerEngine(): RunSummary['perEngine'] {
  return {
    chatgpt:             { ok: 0, errored: 0, notConfigured: 0, citedCount: 0 },
    claude:              { ok: 0, errored: 0, notConfigured: 0, citedCount: 0 },
    perplexity:          { ok: 0, errored: 0, notConfigured: 0, citedCount: 0 },
    google_ai_overviews: { ok: 0, errored: 0, notConfigured: 0, citedCount: 0 },
    gemini:              { ok: 0, errored: 0, notConfigured: 0, citedCount: 0 },
  };
}

async function callEngine(engine: CitationEngine, query: string, runId: string): Promise<EngineCallResult> {
  const input = { query, runId };
  switch (engine) {
    case 'perplexity':          return callPerplexity(input);
    case 'claude':              return callClaudeEngine(input);
    case 'gemini':              return callGemini(input);
    case 'chatgpt':             return callOpenAi(input);
    case 'google_ai_overviews': return callAiOverviews(input);
    default:                    throw new Error(`Unknown engine: ${engine}`);
  }
}

async function processQuery(
  q: AiCitationQueryDoc & { id: string },
  runId: string,
  configured: Set<CitationEngine>,
  summary: RunSummary,
): Promise<void> {
  if (!adminDb) return;
  const enginesToRun = (q.enabledEngines || []).filter(e => configured.has(e));
  const lastCitedCounts: Partial<Record<CitationEngine, boolean>> = {};

  for (const engine of enginesToRun) {
    let result: EngineCallResult;
    try {
      result = await callEngine(engine, q.query, runId);
    } catch (e: any) {
      // Defensive — adapter should never throw, but if one does we
      // still write a row so the timeline shows the failure.
      result = {
        engine, query: q.query, runId,
        timestamp: new Date().toISOString(),
        cited: false, citedUrls: [], allSourceUrls: [],
        snippet: null, latencyMs: 0, estimatedCostUsd: 0,
        errored: true, status: 'errored',
        errorMessage: e?.message || String(e),
      };
    }

    // Roll into summary + persist.
    summary.totalCostUsd += result.estimatedCostUsd;
    summary.totalLatencyMs += result.latencyMs;
    const bucket = summary.perEngine[engine];
    if (result.status === 'ok') bucket.ok += 1;
    else if (result.status === 'not_configured') bucket.notConfigured += 1;
    else bucket.errored += 1;
    if (result.cited) bucket.citedCount += 1;
    lastCitedCounts[engine] = result.cited;

    const projected = projectCitation({
      engine: result.engine,
      query: result.query,
      runId: result.runId,
      timestamp: result.timestamp,
      cited: result.cited,
      citedUrls: result.citedUrls,
      allSourceUrls: result.allSourceUrls,
      snippet: result.snippet,
      latencyMs: result.latencyMs,
      estimatedCostUsd: result.estimatedCostUsd,
      errored: result.errored,
      errorMessage: result.errorMessage,
      tenantId: 'indibrick',
    });
    if ('error' in projected) continue;
    await adminDb.collection('aiCitations').add(projected);
  }

  // Mirror the run's outcome onto the query doc for fast dashboard reads.
  await adminDb.collection('aiCitationQueries').doc(q.id).update({
    lastRunAt: new Date().toISOString(),
    lastRunRunId: runId,
    lastCitedCounts,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// Simple concurrency limiter — no p-limit dep needed for N=3.
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

export async function runTracker(): Promise<RunSummary> {
  if (!adminDb) throw new Error('No DB');
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  const summary: RunSummary = {
    runId, startedAt, finishedAt: '',
    queriesProcessed: 0,
    perEngine: emptyPerEngine(),
    totalCostUsd: 0,
    totalLatencyMs: 0,
  };

  const configured = new Set(configuredEngines());

  const snap = await adminDb.collection('aiCitationQueries')
    .where('isActive', '==', true).limit(500).get();
  const queries: Array<AiCitationQueryDoc & { id: string }> = snap.docs.map(d => ({
    id: d.id, ...(d.data() as any),
  }));

  await runWithConcurrency(queries, CONCURRENCY, async (q) => {
    await processQuery(q, runId, configured, summary);
    summary.queriesProcessed += 1;
  });

  summary.finishedAt = new Date().toISOString();

  // Persist a run-summary doc so the dashboard can render "last run"
  // without scanning /aiCitations.
  await adminDb.collection('aiCitationRuns').doc(runId).set({
    ...summary,
    createdAt: FieldValue.serverTimestamp(),
    tenantId: 'indibrick',
  });

  return summary;
}
