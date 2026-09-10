// Turns a call transcript into a structured summary, a timeline note,
// and follow-up tasks.
//
// Waves 3 and 4 of the call-intelligence plan. Runs once per transcript,
// triggered by the transcription callback.
//
// ─── What lands where ───────────────────────────────────────────────
//   referral.timeline   the written summary, as a note the agent reads
//   /tasks              one task per explicit agent commitment
//   the transcript doc  the raw analysis, model and prompt version
//
// Storing the model and prompt version matters: when the prompt improves
// you will want to know which summaries came from the old one, and which
// calls are worth re-running.

import { callClaude } from './anthropicClient';
import {
  CALL_ANALYSIS_SYSTEM,
  PROMPT_VERSION,
  buildCallAnalysisPrompt,
  type CallAnalysisJson,
} from './prompts/callAnalysis';

export interface AnalyzeCallInput {
  clientName: string;
  transcript: string;
  durationSeconds: number;
}

export interface AnalyzeCallResult {
  ok: boolean;
  analysis?: CallAnalysisJson;
  model?: string;
  promptVersion?: string;
  costUsd?: number;
  error?: string;
}

/** Transcripts below this are too thin to summarise honestly. */
const MIN_TRANSCRIPT_CHARS = 120;

const SENTIMENTS = new Set(['positive', 'engaged', 'neutral', 'hesitant', 'negative']);

/**
 * Coerce the model's JSON into the shape the rest of the code relies on.
 *
 * Every field is defaulted rather than trusted. A malformed response
 * should degrade to a thinner summary, never throw inside a webhook and
 * leave the call with no note at all.
 */
function normalize(raw: any): CallAnalysisJson {
  const arr = (v: any): string[] =>
    Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];

  const commitments = Array.isArray(raw?.commitments)
    ? raw.commitments
        .map((c: any) => ({
          what: String(c?.what || '').trim(),
          whenSaid: c?.whenSaid ? String(c.whenSaid).trim() : null,
          dueInDays:
            typeof c?.dueInDays === 'number' && Number.isFinite(c.dueInDays)
              ? Math.max(0, Math.round(c.dueInDays))
              : null,
        }))
        .filter((c: any) => c.what.length > 0)
    : [];

  return {
    summary: String(raw?.summary || '').trim(),
    intent: String(raw?.intent || '').trim(),
    objections: arr(raw?.objections),
    figuresMentioned: arr(raw?.figuresMentioned),
    sentiment: SENTIMENTS.has(raw?.sentiment) ? raw.sentiment : 'neutral',
    commitments,
    suggestedFollowUps: arr(raw?.suggestedFollowUps),
    suggestedStage: raw?.suggestedStage ? String(raw.suggestedStage).trim() : null,
    transcriptionConcerns: arr(raw?.transcriptionConcerns),
  };
}

export async function analyzeCall(input: AnalyzeCallInput): Promise<AnalyzeCallResult> {
  const transcript = String(input.transcript || '').trim();
  if (transcript.length < MIN_TRANSCRIPT_CHARS) {
    return { ok: false, error: `Transcript too short to summarise (${transcript.length} chars).` };
  }

  try {
    const res = await callClaude<CallAnalysisJson>(
      buildCallAnalysisPrompt({
        clientName: input.clientName,
        transcript,
        durationSeconds: input.durationSeconds,
      }),
      {
        // Summarising a transcript is squarely mid-tier work. Quality
        // buys little here and costs 2.5x; the prompt does the heavy
        // lifting, not the model.
        model: 'balanced',
        systemPrompt: CALL_ANALYSIS_SYSTEM,
        expectJson: true,
        maxTokens: 2000,
      },
    );

    if (!res.json) {
      return { ok: false, error: 'Model did not return parseable JSON.' };
    }

    return {
      ok: true,
      analysis: normalize(res.json),
      model: res.model,
      promptVersion: PROMPT_VERSION,
      costUsd: res.estimatedCostUsd,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'analysis failed' };
  }
}

/** The note written onto the client's file. */
export function formatTimelineNote(a: CallAnalysisJson): string {
  const lines: string[] = [a.summary];

  if (a.objections.length > 0) {
    lines.push('', `Raised: ${a.objections.join('; ')}`);
  }
  if (a.figuresMentioned.length > 0) {
    lines.push(`Figures: ${a.figuresMentioned.join(' · ')}`);
  }
  if (a.commitments.length > 0) {
    lines.push('', 'Committed to:');
    for (const c of a.commitments) {
      lines.push(`• ${c.what}${c.whenSaid ? ` (${c.whenSaid})` : ''}`);
    }
  }
  if (a.suggestedFollowUps.length > 0) {
    lines.push('', `Worth considering: ${a.suggestedFollowUps.join('; ')}`);
  }
  if (a.transcriptionConcerns.length > 0) {
    lines.push('', `⚠️ Transcription unclear: ${a.transcriptionConcerns.join('; ')}`);
  }
  return lines.join('\n');
}

export interface DerivedTask {
  description: string;
  dueDate: string;   // ISO date
  referralId: string;
  clientName: string;
  assigneeId: string;
  status: 'pending';
  source: 'call_analysis';
  messageId: string;
}

/**
 * Turn explicit commitments into tasks.
 *
 * Only `commitments` is used. `suggestedFollowUps` is deliberately
 * ignored — inferred obligations are what make an AI task list
 * untrustworthy, and an agent who stops trusting the list stops reading
 * it at all.
 *
 * A commitment with no stated timing defaults to two business days,
 * which is late enough not to nag and early enough to still matter.
 */
export function tasksFromAnalysis(
  a: CallAnalysisJson,
  ctx: { referralId: string; clientName: string; assigneeId: string; messageId: string; now?: Date },
): DerivedTask[] {
  const now = ctx.now || new Date();
  const DEFAULT_DUE_DAYS = 2;

  return a.commitments.map((c) => {
    const days = c.dueInDays === null ? DEFAULT_DUE_DAYS : c.dueInDays;
    const due = new Date(now.getTime() + days * 86_400_000);
    return {
      description: c.what,
      dueDate: due.toISOString().slice(0, 10),
      referralId: ctx.referralId,
      clientName: ctx.clientName,
      assigneeId: ctx.assigneeId,
      status: 'pending' as const,
      source: 'call_analysis' as const,
      messageId: ctx.messageId,
    };
  });
}
