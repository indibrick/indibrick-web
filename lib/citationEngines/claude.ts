// Claude via Anthropic API + web_search tool. Uses the existing
// lib/anthropicClient.ts wrapper. We run against Sonnet at this
// cadence — cost-appropriate for a scheduled tracker.
//
// Source extraction: Claude's web_search tool returns results as
// `server_tool_use` result blocks whose `content` includes an array
// of `{ type: 'web_search_result', url, title, ... }`. We flatten
// those into allSourceUrls.

import Anthropic from '@anthropic-ai/sdk';
import {
  type EngineCallInput,
  type EngineCallResult,
  notConfiguredResult,
  erroredResult,
  pickOurCitations,
} from './index';

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 1024;
const SNIPPET_MAX = 1500;
// Sonnet: $3/1M in, $15/1M out. Estimate ~1K in, ~500 out + web_search flat.
const COST_ESTIMATE_USD = 0.03;

export async function callClaudeEngine(input: EngineCallInput): Promise<EngineCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return notConfiguredResult('claude', input);
  const start = Date.now();
  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // temperature omitted — Claude 5-family models reject it.
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 } as any],
      messages: [{ role: 'user', content: input.query }],
    });

    let text = '';
    const allSourceUrls: string[] = [];
    for (const block of response.content as any[]) {
      if (block.type === 'text') text += block.text;
      // Web search result blocks — each result carries a URL.
      if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
        for (const r of block.content) {
          if (r?.url && typeof r.url === 'string') allSourceUrls.push(r.url);
        }
      }
    }
    const unique = Array.from(new Set(allSourceUrls)).slice(0, 20);
    const citedUrls = pickOurCitations(unique);

    // Best-effort cost using the same table as the shared client.
    const inTok = response.usage?.input_tokens || 0;
    const outTok = response.usage?.output_tokens || 0;
    const cost = (inTok / 1_000_000) * 3.0 + (outTok / 1_000_000) * 15.0 + COST_ESTIMATE_USD * 0.5;

    return {
      engine: 'claude',
      query: input.query,
      runId: input.runId,
      timestamp: new Date().toISOString(),
      cited: citedUrls.length > 0,
      citedUrls,
      allSourceUrls: unique,
      snippet: text.slice(0, SNIPPET_MAX),
      latencyMs: Date.now() - start,
      estimatedCostUsd: cost,
      errored: false,
      status: 'ok',
    };
  } catch (e: any) {
    return erroredResult('claude', input, e?.message || String(e), Date.now() - start);
  }
}
