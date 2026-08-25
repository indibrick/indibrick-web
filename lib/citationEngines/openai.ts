// OpenAI Responses API with web_search_preview tool.
//
// API: https://api.openai.com/v1/responses (Responses API supersedes
// the older Assistants API and cleanly exposes web-search results).
// Model: gpt-4o with the built-in `web_search_preview` tool.
//
// Source extraction: annotations of type `url_citation` on the
// assistant message. Best-effort — the OpenAI browsing surface is
// noisier than Perplexity/Claude, so a "no annotations found" result
// is treated as `cited: false` even if the URL was mentioned in prose.

import {
  type EngineCallInput,
  type EngineCallResult,
  notConfiguredResult,
  erroredResult,
  pickOurCitations,
} from './index';

const MODEL = 'gpt-4o';
const COST_PER_QUERY_USD = 0.05; // web_search tool adds a per-call fee on top of token cost
const SNIPPET_MAX = 1500;

export async function callOpenAi(input: EngineCallInput): Promise<EngineCallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return notConfiguredResult('chatgpt', input);
  const start = Date.now();

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        input: input.query,
        tools: [{ type: 'web_search_preview' }],
        // Keep it snappy — this is a citation probe, not a full answer.
        max_output_tokens: 800,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return erroredResult('chatgpt', input, `HTTP ${res.status}: ${text.slice(0, 300)}`, Date.now() - start);
    }
    const data = await res.json() as any;

    // Walk output blocks — assistant messages carry `content` with
    // `annotations`; annotation type `url_citation` has a `url`.
    const allSourceUrls: string[] = [];
    let text = '';
    const output = Array.isArray(data.output) ? data.output : [];
    for (const item of output) {
      if (item?.type !== 'message') continue;
      const content = Array.isArray(item.content) ? item.content : [];
      for (const c of content) {
        if (typeof c?.text === 'string') text += c.text;
        const anns = Array.isArray(c?.annotations) ? c.annotations : [];
        for (const a of anns) {
          if (a?.type === 'url_citation' && typeof a?.url === 'string') allSourceUrls.push(a.url);
        }
      }
    }
    const unique = Array.from(new Set(allSourceUrls)).slice(0, 20);
    const citedUrls = pickOurCitations(unique);

    return {
      engine: 'chatgpt',
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
    return erroredResult('chatgpt', input, e?.message || String(e), Date.now() - start);
  }
}
