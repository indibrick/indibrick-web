// Drafts a reply to an inbound client text.
//
// ─── Draft, never send ──────────────────────────────────────────────
// Nothing here sends anything. It writes a suggestion onto the message
// record for an agent to send, edit, or ignore. An unreviewed message
// from a licensed brokerage is an unreviewed message from a licensed
// brokerage, and the compliance surface of auto-send is not worth the
// minutes it saves.
//
// Auto-send is one flag away once a few hundred drafts have been read
// and trusted, which is the right order to do it in.

import { callClaude } from './anthropicClient';

export const SMS_DRAFT_PROMPT_VERSION = 'sms-draft-v1';

const SYSTEM = `You draft SMS replies for a licensed Ontario mortgage brokerage.

A licensed agent reads every draft before it sends. Write what they would send, not a template for them to fill in.

Rules:
1. Never state a rate, payment, approval amount or closing cost. You do not have current numbers and a wrong one is a compliance problem. Offer to confirm instead.
2. Never promise an approval or imply one is likely.
3. Match the client's register. If they wrote three words, do not reply with a paragraph.
4. Under 320 characters. Two SMS segments.
5. No emoji unless the client used one first.
6. If the right answer is a phone call, say so and offer a time.
7. If you do not have enough context to reply usefully, say exactly: INSUFFICIENT_CONTEXT

Return only the message text. No preamble, no quotes.`;

export interface SmsDraftContext {
  clientName: string;
  inboundText: string;
  /** Pipeline stage, so the reply is not generic. */
  status?: string | null;
  /** Recent thread, oldest first, for continuity. */
  recentMessages?: Array<{ direction: 'inbound' | 'outbound'; body: string }>;
  /** Summary of the last analysed call, when there is one. */
  lastCallSummary?: string | null;
}

export interface SmsDraftResult {
  ok: boolean;
  draft?: string;
  /** True when the model declined for lack of context. Not an error. */
  insufficientContext?: boolean;
  model?: string;
  costUsd?: number;
  error?: string;
}

const MAX_CHARS = 320;

export async function draftSmsReply(ctx: SmsDraftContext): Promise<SmsDraftResult> {
  const inbound = String(ctx.inboundText || '').trim();
  if (!inbound) return { ok: false, error: 'no inbound text' };

  const thread = (ctx.recentMessages || [])
    .slice(-6)
    .map((m) => `${m.direction === 'inbound' ? 'Client' : 'Us'}: ${m.body}`)
    .join('\n');

  const prompt = [
    `Client: ${ctx.clientName || 'unknown'}`,
    ctx.status ? `Pipeline stage: ${ctx.status}` : null,
    ctx.lastCallSummary ? `Last call: ${ctx.lastCallSummary}` : null,
    thread ? `\nRecent thread:\n${thread}` : null,
    `\nThey just texted:\n"${inbound}"`,
    `\nDraft the reply.`,
  ].filter(Boolean).join('\n');

  try {
    const res = await callClaude<string>(prompt, {
      // A two-sentence text does not need a mid-tier model. This is the
      // one place in the pipeline where 'fast' is clearly right.
      model: 'fast',
      systemPrompt: SYSTEM,
      maxTokens: 300,
    });

    const text = String(res.text || '').trim();
    if (!text || text.includes('INSUFFICIENT_CONTEXT')) {
      return { ok: true, insufficientContext: true, model: res.model, costUsd: res.estimatedCostUsd };
    }

    // Hard cap rather than trust the instruction — a draft that silently
    // becomes three billed segments is a bad default.
    const draft = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS - 1).trimEnd()}…` : text;

    return { ok: true, draft, model: res.model, costUsd: res.estimatedCostUsd };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'draft failed' };
  }
}
