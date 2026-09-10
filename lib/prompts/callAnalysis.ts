// Prompt for turning a call transcript into a structured summary.
//
// ─── Why structured, not prose ──────────────────────────────────────
// A free-text summary cannot be filtered, counted, or turned into a
// task. Named fields mean one call can write a note, create follow-ups,
// and later answer "how many clients raised rate concerns this month"
// without anything being re-read.
//
// ─── The rule that protects the task list ───────────────────────────
// Only commitments the agent actually made out loud become tasks. An
// assistant that invents obligations trains people to ignore its tasks,
// and a task list nobody trusts is worse than no task list. Inferred
// follow-ups go in `suggestedFollowUps`, which is advisory and never
// creates anything.
//
// Bump PROMPT_VERSION on any material edit. It is stored with every
// analysis so summaries produced by an older prompt stay identifiable
// and re-runnable.

export const PROMPT_VERSION = 'call-analysis-v1';

export const CALL_ANALYSIS_SYSTEM = `You analyse recorded phone calls for a licensed Ontario mortgage brokerage.

The brokerage arranges residential mortgages and works with pre-construction communities. Callers are prospective or current clients. Agents are licensed mortgage professionals.

Your output goes directly onto the client's file, where an agent reads it before their next contact. Write for that reader.

Rules that matter more than style:

1. Report only what was said. Never infer a fact the transcript does not contain. If something was ambiguous, say it was ambiguous.
2. A commitment is something the AGENT explicitly said they would do. "I'll send those rates tomorrow" is a commitment. "You should probably look at Midhurst" is not. Only commitments become tasks.
3. Never state a rate, payment, or approval amount that was not spoken on the call.
4. Transcription is imperfect. If a figure or name looks garbled, flag it rather than guessing.
5. Be concise. The agent is reading this between calls.

Respond with a single JSON object and nothing else.`;

export interface CallAnalysisJson {
  /** 2-5 sentences an agent can read before dialling back. */
  summary: string;
  /** What the client is trying to do, in their terms. */
  intent: string;
  /** Concerns raised. Empty array when none surfaced. */
  objections: string[];
  /** Figures actually spoken. Never inferred. */
  figuresMentioned: string[];
  sentiment: 'positive' | 'engaged' | 'neutral' | 'hesitant' | 'negative';
  /** Explicit agent commitments. These become tasks. */
  commitments: Array<{
    what: string;
    /** Verbatim-ish timing as spoken: "tomorrow", "by Friday", "next week". */
    whenSaid: string | null;
    /** Days from the call, derived from whenSaid. Null when unstated. */
    dueInDays: number | null;
  }>;
  /** Advisory only. Never creates a task. */
  suggestedFollowUps: string[];
  /** Suggested pipeline stage, for the agent to confirm. Null when unclear. */
  suggestedStage: string | null;
  /** Anything the transcript garbled badly enough to distrust. */
  transcriptionConcerns: string[];
}

export function buildCallAnalysisPrompt(params: {
  clientName: string;
  transcript: string;
  durationSeconds: number;
}): string {
  const mins = Math.max(1, Math.round(params.durationSeconds / 60));
  return `Call with ${params.clientName || 'a client'}, roughly ${mins} minute${mins === 1 ? '' : 's'}.

Lines are labelled by speaker. "Agent" is the brokerage; "Client" is the caller.

--- TRANSCRIPT ---
${params.transcript}
--- END TRANSCRIPT ---

Return JSON with exactly these keys:

{
  "summary": string,
  "intent": string,
  "objections": string[],
  "figuresMentioned": string[],
  "sentiment": "positive" | "engaged" | "neutral" | "hesitant" | "negative",
  "commitments": [{ "what": string, "whenSaid": string | null, "dueInDays": number | null }],
  "suggestedFollowUps": string[],
  "suggestedStage": string | null,
  "transcriptionConcerns": string[]
}

Reminders:
- commitments = things the AGENT said they would do. If the agent promised nothing, return an empty array. An empty array is a correct and common answer.
- dueInDays: "tomorrow" is 1, "Friday" counts forward from today, "next week" is 7. Null when no timing was given.
- figuresMentioned: only numbers actually spoken.`;
}
