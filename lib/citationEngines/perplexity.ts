// Perplexity Sonar — returns citations natively in the `citations`
// array on the response. Cheapest + most reliable arm.
//
// API: https://api.perplexity.ai/chat/completions
// Model: sonar (fast + cheap), sonar-pro (higher quality).

import {
  type EngineCallInput,
  type EngineCallResult,
  notConfiguredResult,
  erroredResult,
  pickOurCitations,
} from './index';

const MODEL = 'sonar';
// Perplexity pricing (2026): sonar ~$1/1M input, $1/1M output + $5/1K searches.
// Estimate per-query cost pessimistically.
const COST_PER_QUERY_USD = 0.008;
const SNIPPET_MAX = 1500;

export async function callPerplexity(input: EngineCallInput): Promise<EngineCallResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return notConfiguredResult('perplexity', input);
  const start = Date.now();

  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: input.query }],
        // Return citations as URLs in the response object.
        return_citations: true,
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return erroredResult('perplexity', input, `HTTP ${res.status}: ${text.slice(0, 300)}`, Date.now() - start);
    }
    const data = await res.json() as any;
    const allSourceUrls: string[] = Array.isArray(data.citations)
      ? data.citations.map(String).slice(0, 20)
      : [];
    const snippet = (data.choices?.[0]?.message?.content || '').toString().slice(0, SNIPPET_MAX);
    const citedUrls = pickOurCitations(allSourceUrls);
    return {
      engine: 'perplexity',
      query: input.query,
      runId: input.runId,
      timestamp: new Date().toISOString(),
      cited: citedUrls.length > 0,
      citedUrls,
      allSourceUrls,
      snippet,
      latencyMs: Date.now() - start,
      estimatedCostUsd: COST_PER_QUERY_USD,
      errored: false,
      status: 'ok',
    };
  } catch (e: any) {
    return erroredResult('perplexity', input, e?.message || String(e), Date.now() - start);
  }
}
