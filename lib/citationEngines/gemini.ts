// Gemini via generateContent + googleSearchRetrieval grounding.
//
// API: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// Model: gemini-2.5-flash — cheap, grounding-capable.
//
// Sources come back on `candidates[0].groundingMetadata.groundingChunks`
// as `{ web: { uri, title } }`.

import {
  type EngineCallInput,
  type EngineCallResult,
  notConfiguredResult,
  erroredResult,
  pickOurCitations,
} from './index';

const MODEL = 'gemini-2.5-flash';
const COST_PER_QUERY_USD = 0.015;
const SNIPPET_MAX = 1500;

export async function callGemini(input: EngineCallInput): Promise<EngineCallResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return notConfiguredResult('gemini', input);
  const start = Date.now();

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: input.query }] }],
        tools: [{ google_search_retrieval: {} }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return erroredResult('gemini', input, `HTTP ${res.status}: ${text.slice(0, 300)}`, Date.now() - start);
    }
    const data = await res.json() as any;
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    let text = '';
    for (const p of parts) if (typeof p?.text === 'string') text += p.text;

    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const allSourceUrls: string[] = [];
    for (const c of chunks) {
      const uri = c?.web?.uri;
      if (typeof uri === 'string') allSourceUrls.push(uri);
    }
    const unique = Array.from(new Set(allSourceUrls)).slice(0, 20);
    const citedUrls = pickOurCitations(unique);

    return {
      engine: 'gemini',
      query: input.query,
      runId: input.runId,
      timestamp: new Date().toISOString(),
      cited: citedUrls.length > 0,
      citedUrls,
      allSourceUrls: unique,
      snippet: text.slice(0, SNIPPET_MAX),
      latencyMs: Date.now() - start,
      estimatedCostUsd: COST_PER_QUERY_USD,
      errored: false,
      status: 'ok',
    };
  } catch (e: any) {
    return erroredResult('gemini', input, e?.message || String(e), Date.now() - start);
  }
}
