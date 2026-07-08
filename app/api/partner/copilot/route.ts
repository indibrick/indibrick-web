// Gemini copilot endpoint. Streams responses via SSE. Handles tool calls
// with a confirmation gate for writes — the copilot cannot silently
// mutate CRM state. Tool registry is in services/CopilotTools.ts; this
// route is the transport + orchestration layer.

import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '../../../../lib/firebaseAdmin';
import {
  COPILOT_TOOLS,
  getGeminiTools,
  getToolByName,
  type CopilotContext,
  type ToolResult,
} from '../../../../services/CopilotTools';

// The Gemini SDK's streaming API pulls in Node built-ins. Force nodejs
// runtime (not edge) so googleapis + firebase-admin work in production.
export const runtime = 'nodejs';

// ─── Rate limiting (in-memory Map — solo-tenant deploy is fine) ─────
// TODO(scale): migrate to Firestore-backed counter for multi-instance.

const MSG_PER_HOUR = 60;
const messageWindow = new Map<string, number[]>(); // uid → timestamps

function checkRateLimit(uid: string): { ok: boolean; resetAt?: number } {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const arr = (messageWindow.get(uid) || []).filter((t) => now - t < hour);
  if (arr.length >= MSG_PER_HOUR) {
    return { ok: false, resetAt: arr[0] + hour };
  }
  arr.push(now);
  messageWindow.set(uid, arr);
  return { ok: true };
}

// ─── Session state (in-memory) ──────────────────────────────────────

interface PendingCall {
  id: string;
  name: string;
  args: Record<string, any>;
  createdAt: number;
}

interface Session {
  history: { role: 'user' | 'model'; parts: any[] }[];
  pending?: PendingCall;
  lastTouched: number;
}

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 30 * 60 * 1000;

function getSession(sessionId: string): Session {
  const s = sessions.get(sessionId);
  const now = Date.now();
  if (s && now - s.lastTouched < SESSION_TTL_MS) {
    s.lastTouched = now;
    return s;
  }
  const fresh: Session = { history: [], lastTouched: now };
  sessions.set(sessionId, fresh);
  return fresh;
}

// ─── Audit log (PII-redacted) ───────────────────────────────────────

function safeArgs(args: any): any {
  if (!args || typeof args !== 'object') return args;
  const out: any = { ...args };
  for (const key of ['email', 'phone', 'address', 'notes', 'note']) {
    if (key in out) out[key] = `<redacted:${String(out[key]).length}chars>`;
  }
  return out;
}

async function auditEvent(uid: string, sessionId: string, event: {
  type: string; toolName?: string; args?: any; result?: string; error?: string;
}) {
  if (!adminDb) return;
  try {
    await adminDb.collection('copilot_events').add({
      uid, sessionId,
      timestamp: new Date().toISOString(),
      ...event,
      args: event.args ? safeArgs(event.args) : undefined,
    });
  } catch { /* logging never blocks the stream */ }
}

// ─── SSE helpers ────────────────────────────────────────────────────

function sseEvent(name: string, data: any): string {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── System prompt ──────────────────────────────────────────────────

function buildSystemPrompt(ctx: CopilotContext, dateIso: string): string {
  return `You are the IndiBrick Partner Copilot, embedded in a real-estate + mortgage CRM used by FSRA-licensed Ontario advisors.

CONTEXT
- User uid: ${ctx.uid}
- Role: ${ctx.role}
- Currently viewing deal: ${ctx.selectedDealId || 'none'}
- Active filter: ${ctx.pipelineFilter ? JSON.stringify(ctx.pipelineFilter) : 'none'}
- View scope: ${ctx.viewScope || 'my'}
- Today: ${dateIso} (America/Toronto)

RULES
1. Prefer tools over guessing. If asked about deals, tasks, numbers, or activity — CALL A TOOL. Never fabricate names, IDs, values, dates, or activity.
2. Before any write tool call, describe the exact change in ONE sentence — the user must confirm before it runs.
3. You CANNOT delete leads, reassign leads to other agents, or remove participants. Those tools are not available to you. If asked, explain politely and point the user to the manual UI.
4. When drafting client-facing text, keep it professional, warm, under 120 words unless the user asks otherwise. Never invent facts about the client.
5. If a tool returns no results, say so plainly. Don't retry with looser filters unless the user asks.
6. Names + phone + email are PII. In summaries, use first name only. Only surface phone/email if the user explicitly asks for contact info.
7. Currency defaults to CAD. Dates in America/Toronto local time.
8. If the user's request is ambiguous ("call John"), ask which deal — many clients share first names.

If the user says something you can't act on (delete a lead, reassign to another agent, mass-edit contacts), tell them why and suggest the manual UI path.`;
}

// ─── Main handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, message, confirmationResponse, context: rawContext } = body || {};

  // Basic input validation.
  if (!sessionId || typeof sessionId !== 'string') {
    return new Response(JSON.stringify({ error: 'sessionId required' }), { status: 400 });
  }
  if (!message && !confirmationResponse) {
    return new Response(JSON.stringify({ error: 'message or confirmationResponse required' }), { status: 400 });
  }

  // Auth: pull uid + role from context. Callers pass a Firebase ID token
  // in the Authorization header; we verify it server-side. For now,
  // fall through to context-supplied uid to preserve existing partner
  // API convention (consistent with the other /api/partner/* routes).
  // TODO(security): tighten to require verifyIdToken() once client wires
  // the Authorization header.
  const ctx: CopilotContext = {
    uid: rawContext?.uid,
    role: rawContext?.role === 'admin' ? 'admin' : 'agent',
    selectedDealId: rawContext?.selectedDealId,
    pipelineFilter: rawContext?.pipelineFilter,
    viewScope: rawContext?.viewScope || 'my',
  };
  if (!ctx.uid) {
    return new Response(JSON.stringify({ error: 'context.uid required' }), { status: 400 });
  }

  // Rate limit — only counts on brand-new messages, not confirmation replies.
  if (message && !confirmationResponse) {
    const rl = checkRateLimit(ctx.uid);
    if (!rl.ok) {
      const resetStr = rl.resetAt ? new Date(rl.resetAt).toLocaleTimeString() : 'later';
      return new Response(
        JSON.stringify({ error: `Rate limit: ${MSG_PER_HOUR} messages/hour. Resets around ${resetStr}.` }),
        { status: 429 },
      );
    }
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
  }

  const session = getSession(sessionId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (name: string, data: any) => controller.enqueue(encoder.encode(sseEvent(name, data)));

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          tools: getGeminiTools(ctx),
          systemInstruction: buildSystemPrompt(ctx, new Date().toISOString().split('T')[0]),
        });

        // ── Case 1: confirmation reply for a pending write ──
        if (confirmationResponse && session.pending) {
          const pending = session.pending;
          session.pending = undefined;

          if (!confirmationResponse.approved) {
            // Rejected — inject a synthetic functionResponse so Gemini
            // acknowledges instead of retrying.
            const rejectMsg = `The user rejected the ${pending.name} action.${confirmationResponse.reason ? ` Reason: ${confirmationResponse.reason}` : ''}`;
            send('token', { text: rejectMsg + ' No changes made.' });
            session.history.push({ role: 'model', parts: [{ text: rejectMsg }] });
            await auditEvent(ctx.uid, sessionId, { type: 'confirmation_rejected', toolName: pending.name, args: pending.args });
            send('done', {});
            controller.close();
            return;
          }

          // Merge any user edits to the args, then execute.
          const finalArgs = { ...pending.args, ...(confirmationResponse.editedArgs || {}) };
          const tool = getToolByName(pending.name);
          if (!tool) {
            send('tool_error', { name: pending.name, error: 'Tool no longer registered.' });
            send('done', {});
            controller.close();
            return;
          }
          try {
            const result = await tool.handler(finalArgs, ctx);
            send('tool_executed', {
              name: pending.name,
              summary: result.summary,
              affected: result.affected || [],
            });
            await auditEvent(ctx.uid, sessionId, { type: 'tool_executed', toolName: pending.name, args: finalArgs, result: result.summary });
            // Feed result back to Gemini so it can compose a wrap-up.
            const chat = model.startChat({ history: session.history });
            const followup = await chat.sendMessageStream([{ functionResponse: { name: pending.name, response: result as any } }]);
            let wrapText = '';
            for await (const chunk of followup.stream) {
              const t = chunk.text();
              if (t) { wrapText += t; send('token', { text: t }); }
            }
            session.history.push(
              { role: 'model', parts: [{ functionCall: { name: pending.name, args: finalArgs } }] },
              { role: 'user', parts: [{ functionResponse: { name: pending.name, response: result as any } }] },
              { role: 'model', parts: [{ text: wrapText || result.summary }] },
            );
          } catch (e: any) {
            send('tool_error', { name: pending.name, error: e?.message || 'Tool execution failed' });
            await auditEvent(ctx.uid, sessionId, { type: 'tool_error', toolName: pending.name, args: finalArgs, error: e?.message });
          }
          send('done', {});
          controller.close();
          return;
        }

        // ── Case 2: new user message ──
        session.history.push({ role: 'user', parts: [{ text: message }] });
        await auditEvent(ctx.uid, sessionId, { type: 'user_message' });

        // Truncate history to last 20 turns to keep the prompt bounded.
        const boundedHistory = session.history.slice(-20);
        const chat = model.startChat({ history: boundedHistory.slice(0, -1) });
        let stream1 = await chat.sendMessageStream(message);

        let accumulatedText = '';
        let toolCallsThisTurn = 0;
        const MAX_TOOL_CALLS = 8;
        let sawFunctionCall = false;

        // Loop: stream tokens + intercept tool calls. On a write tool call
        // (requiresConfirmation), pause and emit tool_pending, then break —
        // waiting for the user's next confirmation reply.
        let done = false;
        while (!done) {
          done = true;
          for await (const chunk of stream1.stream) {
            const text = chunk.text();
            if (text) { accumulatedText += text; send('token', { text }); }
            const fnCalls = (chunk as any).functionCalls?.() || [];
            for (const fc of fnCalls) {
              sawFunctionCall = true;
              const tool = getToolByName(fc.name);
              if (!tool) {
                send('tool_error', { name: fc.name, error: 'Unknown tool.' });
                continue;
              }
              if (++toolCallsThisTurn > MAX_TOOL_CALLS) {
                send('tool_error', { name: fc.name, error: 'Tool call limit exceeded for this turn.' });
                break;
              }
              await auditEvent(ctx.uid, sessionId, { type: 'tool_call', toolName: fc.name, args: fc.args });

              if (tool.requiresConfirmation) {
                // Stash pending call, emit tool_pending, exit early.
                const pendingId = `pending-${Date.now()}`;
                session.pending = { id: pendingId, name: fc.name, args: fc.args, createdAt: Date.now() };
                const previewText = summarizeToolCallForUser(fc.name, fc.args);
                send('tool_pending', {
                  id: pendingId,
                  name: fc.name,
                  args: fc.args,
                  summary: previewText,
                });
                session.history.push({ role: 'model', parts: [{ text: accumulatedText }, { functionCall: { name: fc.name, args: fc.args } }] });
                send('done', {});
                controller.close();
                return;
              }

              // Read / draft tool — execute inline and feed result back.
              let result: ToolResult;
              try {
                result = await tool.handler(fc.args, ctx);
              } catch (e: any) {
                result = { ok: false, summary: `Tool failed: ${e?.message || 'unknown'}` };
                await auditEvent(ctx.uid, sessionId, { type: 'tool_error', toolName: fc.name, error: e?.message });
              }
              // Send the result back to Gemini for a second stream.
              stream1 = await chat.sendMessageStream([{ functionResponse: { name: fc.name, response: result as any } }]);
              done = false;
              break;
            }
            if (!done) break; // exit outer chunk loop to restart with new stream
          }
        }

        if (accumulatedText) {
          session.history.push({ role: 'model', parts: [{ text: accumulatedText }] });
        } else if (!sawFunctionCall) {
          session.history.push({ role: 'model', parts: [{ text: '' }] });
        }
        send('done', {});
      } catch (e: any) {
        console.error('[copilot] stream error', e);
        send('error', { message: e?.message || 'Assistant temporarily unavailable' });
        send('done', {});
        await auditEvent(ctx.uid, sessionId, { type: 'stream_error', error: e?.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // hint for Vercel/nginx to not buffer SSE
    },
  });
}

// Human-readable summary of a write tool call, shown in the confirmation card.
function summarizeToolCallForUser(name: string, args: any): string {
  switch (name) {
    case 'createTask':
      return `Create task on deal ${args.dealId}: "${args.description}" due ${args.dueDate}`;
    case 'logCall':
      return `Log a call on deal ${args.dealId} with note: "${String(args.notes || '').slice(0, 120)}"`;
    case 'logNote':
      return `Add internal note on deal ${args.dealId}: "${String(args.note || '').slice(0, 120)}"`;
    case 'updateDealStatus':
      return `Move deal ${args.dealId} to status "${args.newStatus}"`;
    case 'addTag':
      return `Set lead tag on deal ${args.dealId} to "${args.tag}"`;
    default:
      return `${name}(${JSON.stringify(args)})`;
  }
}
