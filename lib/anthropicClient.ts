// Shared Claude API client for the SEO OS.
//
// Wraps the Anthropic SDK with the concerns every SEO OS surface
// needs: retry with backoff on 429/5xx, structured-JSON extraction
// (Claude sometimes wraps JSON in ```json fences), tenant-scoped
// logging so we can see cost per surface, and a small model-picker
// so callers don't have to memorize model IDs.
//
// Cost is tracked per call and returned to the caller — surfaces can
// stamp the estimated cost onto the row they write, so the dashboard
// can show a running tally without a separate ledger.

import Anthropic from '@anthropic-ai/sdk';

// Lazy-init so a missing key produces a clear, actionable error at
// call time — not the SDK's generic "could not resolve authentication
// method" cascade. Also lets Next.js hot-reload pick up an updated
// .env.local without restarting the module.
let _client: Anthropic | null = null;
function getAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env.local (dev) or your Cloud Run / Vercel env (prod), then restart the server.',
    );
  }
  if (!_client) _client = new Anthropic({ apiKey: key });
  return _client;
}

export type ModelChoice = 'quality' | 'balanced' | 'fast';

// Concrete model IDs live here so a future upgrade is one line.
//
// IDs are complete as written — never append a date suffix. 'fast'
// previously carried one ('claude-haiku-4-5-20251001'), which is not a
// form the API accepts.
const MODEL_MAP: Record<ModelChoice, string> = {
  quality:  'claude-opus-5',
  balanced: 'claude-sonnet-5',
  fast:     'claude-haiku-4-5',
};

// Anthropic list price per 1M tokens. Verified 2026-09-09.
//
// These drive the cost estimate on the SEO OS dashboard, and every figure
// here was previously wrong in the expensive direction — 'quality' was
// carrying 15/75, which is roughly three times the real Opus rate, so the
// dashboard has been overstating spend since it shipped.
const PRICE_PER_1M_INPUT: Record<ModelChoice, number> = {
  quality:  5.00,
  balanced: 2.00,
  fast:     1.00,
};
const PRICE_PER_1M_OUTPUT: Record<ModelChoice, number> = {
  quality:  25.00,
  balanced: 10.00,
  fast:      5.00,
};

export interface ClaudeCallOptions {
  model?: ModelChoice;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  // Enable Claude's web search tool. Costs a little more but returns
  // real citations — used for backlink discovery + AEO tracker.
  webSearch?: boolean;
  // If true, we auto-extract the first ```json ... ``` block or the
  // first top-level {...} from the response text.
  expectJson?: boolean;
  // Retry knobs. Reasonable defaults; surfaces can override for a
  // long-running discovery job vs a snappy interactive draft.
  maxRetries?: number;
}

export interface ClaudeCallResult<T = string> {
  text: string;                    // full assistant text
  json?: T;                        // parsed JSON if expectJson + parseable
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  webSearchCalls?: number;         // number of web-search invocations if tool enabled
}

const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_MAX_RETRIES = 3;

export async function callClaude<T = any>(
  userPrompt: string,
  opts: ClaudeCallOptions = {},
): Promise<ClaudeCallResult<T>> {
  const modelChoice: ModelChoice = opts.model || 'balanced';
  const modelId = MODEL_MAP[modelChoice];
  const maxTokens = opts.maxTokens || DEFAULT_MAX_TOKENS;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;

  const startMs = Date.now();
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const params: any = {
        model: modelId,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: userPrompt }],
      };
      // Newer Claude models (Opus 4.7+) reject `temperature`. Only
      // include it when the caller explicitly asks for one — safer
      // default is to let the model use its own.
      if (typeof opts.temperature === 'number') params.temperature = opts.temperature;
      if (opts.systemPrompt) params.system = opts.systemPrompt;
      if (opts.webSearch) {
        params.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
      }

      const response = await getAnthropic().messages.create(params);

      // Assemble text blocks + count web-search invocations.
      let text = '';
      let webSearchCalls = 0;
      for (const block of response.content as any[]) {
        if (block.type === 'text') text += block.text;
        if (block.type === 'server_tool_use' && block.name === 'web_search') webSearchCalls += 1;
      }

      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;
      const estimatedCostUsd =
        (inputTokens / 1_000_000) * PRICE_PER_1M_INPUT[modelChoice] +
        (outputTokens / 1_000_000) * PRICE_PER_1M_OUTPUT[modelChoice];

      const result: ClaudeCallResult<T> = {
        text,
        model: modelId,
        inputTokens,
        outputTokens,
        estimatedCostUsd,
        latencyMs: Date.now() - startMs,
        webSearchCalls: opts.webSearch ? webSearchCalls : undefined,
      };
      if (opts.expectJson) {
        result.json = extractJson<T>(text);
      }
      return result;
    } catch (e: any) {
      lastError = e;
      // Retry on 429 + 5xx; anything else bubbles immediately.
      const status = e?.status || e?.response?.status;
      if (status !== 429 && !(status >= 500 && status < 600)) throw e;
      if (attempt === maxRetries) throw e;
      // Exponential backoff — 1s, 2s, 4s ...
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// Extract JSON from a Claude response. Order tried:
//   1. First ```json ... ``` fenced block
//   2. First {...} balanced-brace block
//   3. First [...] balanced-bracket block
// Returns undefined if nothing parseable is found — caller decides how
// to surface that.
function extractJson<T>(text: string): T | undefined {
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]) as T; } catch { /* fall through */ }
  }
  const braceMatch = firstBalanced(text, '{', '}');
  if (braceMatch) {
    try { return JSON.parse(braceMatch) as T; } catch { /* fall through */ }
  }
  const bracketMatch = firstBalanced(text, '[', ']');
  if (bracketMatch) {
    try { return JSON.parse(bracketMatch) as T; } catch { /* fall through */ }
  }
  return undefined;
}

function firstBalanced(text: string, open: string, close: string): string | null {
  const start = text.indexOf(open);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth += 1;
    else if (text[i] === close) {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
