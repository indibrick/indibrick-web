// Central registry of tools the Gemini copilot can call. Each tool
// declares its Gemini function schema, an authorization gate (agent vs
// admin), whether it requires user confirmation before executing, and a
// handler that maps the args into an existing CRMService call.
//
// Locking in the user's constraint from planning: NO destructive tools
// are ever registered. deleteReferral, removeParticipant,
// routeLeadToPartner (for non-admin), and hard client-name overwrites
// are intentionally absent — Gemini physically cannot invoke them
// because they're not in the schema it receives.

import { FunctionDeclaration, Schema, SchemaType } from '@google/generative-ai';
import { adminDb } from '../lib/firebaseAdmin';

export type CopilotRole = 'agent' | 'admin';

export interface CopilotContext {
  uid: string;
  role: CopilotRole;
  selectedDealId?: string;
  pipelineFilter?: { stage?: string; owner?: string; tag?: string };
  viewScope?: 'my' | 'team' | 'all';
}

export interface ToolResult {
  ok: boolean;
  summary: string; // shown to Gemini + the user
  data?: any;      // structured payload for Gemini
  affected?: string[]; // doc IDs written (for audit)
}

export interface ToolDef {
  name: string;
  category: 'read' | 'write' | 'draft';
  declaration: FunctionDeclaration;
  requiresConfirmation: boolean;
  adminOnly?: boolean;
  handler: (args: any, ctx: CopilotContext) => Promise<ToolResult>;
}

// Cap every Firestore read so a runaway tool call can't drain quota.
const MAX_DOCS_PER_TOOL = 500;

function boundedLimit(n: number | undefined): number {
  const v = typeof n === 'number' && n > 0 ? n : 20;
  return Math.min(v, MAX_DOCS_PER_TOOL);
}

// Ownership check — agents can only touch deals they're assigned to or a
// participant on. Admin bypasses.
async function assertDealOwnership(dealId: string, ctx: CopilotContext): Promise<any> {
  if (!adminDb) throw new Error('Admin DB not connected');
  const doc = await adminDb.collection('referrals').doc(dealId).get();
  if (!doc.exists) throw new Error(`Deal ${dealId} not found`);
  const data = doc.data() as any;
  if (ctx.role === 'admin') return data;
  const isOwner =
    data.assignedAgentId === ctx.uid ||
    (Array.isArray(data.participantIds) && data.participantIds.includes(ctx.uid));
  if (!isOwner) throw new Error('You do not have access to this deal.');
  return data;
}

// ─── READ TOOLS ───────────────────────────────────────────────────────

const queryLeads: ToolDef = {
  name: 'queryLeads',
  category: 'read',
  requiresConfirmation: false,
  declaration: {
    name: 'queryLeads',
    description:
      'Search leads/deals in the CRM by stage, tag, city, referral source, loan value range, or date range. Returns up to 50 matches with names, stage, loan amount, next task, and last activity timestamp.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        stage: { type: SchemaType.STRING, description: 'Pipeline stage filter, e.g. "Contacted", "Underwriting", "Approved", "Firm Sale", "Closed", "Declined".' },
        tag: { type: SchemaType.STRING, description: 'Lead tag filter, e.g. "PURCHASE", "First Time Buyer", "Renewal", "Refinance".' },
        city: { type: SchemaType.STRING, description: 'Filter by client city (substring, case-insensitive).' },
        referralSource: { type: SchemaType.STRING, description: 'Filter by referral source label.' },
        minValue: { type: SchemaType.NUMBER, description: 'Minimum loan amount in CAD.' },
        maxValue: { type: SchemaType.NUMBER, description: 'Maximum loan amount in CAD.' },
        createdAfter: { type: SchemaType.STRING, description: 'ISO date — only deals created on/after this date.' },
        createdBefore: { type: SchemaType.STRING, description: 'ISO date — only deals created on/before this date.' },
        limit: { type: SchemaType.NUMBER, description: 'Max results (default 20, hard cap 50).' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    const cap = Math.min(boundedLimit(args.limit ?? 20), 50);

    // Scope: agent sees own book; admin sees all.
    let query: FirebaseFirestore.Query = adminDb.collection('referrals');
    if (ctx.role !== 'admin') {
      query = query.where('assignedAgentId', '==', ctx.uid);
    }

    // Firestore compound queries are limited — apply the cheapest filter
    // in the query and post-filter the rest client-side.
    if (args.stage) query = query.where('status', '==', args.stage);

    const snap = await query.limit(MAX_DOCS_PER_TOOL).get();
    let matches = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    if (args.tag) matches = matches.filter((r: any) => r.leadTag === args.tag);
    if (args.city) matches = matches.filter((r: any) => String(r.city || '').toLowerCase().includes(String(args.city).toLowerCase()));
    if (args.referralSource) matches = matches.filter((r: any) => r.referralSource === args.referralSource);
    if (typeof args.minValue === 'number') matches = matches.filter((r: any) => Number(r.loanAmount || 0) >= args.minValue);
    if (typeof args.maxValue === 'number') matches = matches.filter((r: any) => Number(r.loanAmount || 0) <= args.maxValue);
    if (args.createdAfter) matches = matches.filter((r: any) => new Date(r.referralDate || 0) >= new Date(args.createdAfter));
    if (args.createdBefore) matches = matches.filter((r: any) => new Date(r.referralDate || 0) <= new Date(args.createdBefore));

    matches = matches.slice(0, cap);

    // Redact PII in the response Gemini sees. Keep first name only,
    // never email/phone (Gemini doesn't need those to reason about the
    // deal set — if the user wants contact info, they open the deal).
    const redacted = matches.map((r: any) => ({
      id: r.id,
      firstName: String(r.clientName || 'Unknown').split(' ')[0],
      stage: r.status,
      leadTag: r.leadTag || null,
      loanAmount: r.loanAmount || 0,
      city: r.city || null,
      referralSource: r.referralSource || null,
      referralDate: r.referralDate || null,
      callCount: r.callCount || 0,
      dealCategory: r.dealCategory || null,
    }));

    return {
      ok: true,
      summary: `Found ${redacted.length} lead${redacted.length === 1 ? '' : 's'} matching your filters.`,
      data: { leads: redacted, totalScanned: snap.docs.length, cap },
    };
  },
};

const summarizeDeal: ToolDef = {
  name: 'summarizeDeal',
  category: 'read',
  requiresConfirmation: false,
  declaration: {
    name: 'summarizeDeal',
    description: 'Get full detail on ONE deal by ID — status, loan amount, most recent 10 timeline entries, open tasks, participants. Use when the user asks "what\'s the status of Sarma\'s file" or references a specific deal.',
    parameters: {
      type: SchemaType.OBJECT,
      required: ['dealId'],
      properties: {
        dealId: { type: SchemaType.STRING, description: 'The deal document ID.' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    const deal = await assertDealOwnership(args.dealId, ctx);
    const timeline = Array.isArray(deal.timeline) ? deal.timeline.slice(-10) : [];
    return {
      ok: true,
      summary: `Deal for ${String(deal.clientName || 'Unknown').split(' ')[0]}: ${deal.status}, ${deal.callCount || 0}/5 touches, loan $${(deal.loanAmount || 0).toLocaleString()}.`,
      data: {
        firstName: String(deal.clientName || 'Unknown').split(' ')[0],
        status: deal.status,
        stage: deal.status,
        loanAmount: deal.loanAmount || 0,
        expectedCommission: deal.expectedCommission || 0,
        callCount: deal.callCount || 0,
        leadTag: deal.leadTag || null,
        dealCategory: deal.dealCategory || null,
        referralSource: deal.referralSource || null,
        referralDate: deal.referralDate || null,
        stageEnteredAt: deal.stageEnteredAt || null,
        lastActivity: timeline[timeline.length - 1]?.timestamp || null,
        recentTimeline: timeline.map((t: any) => ({
          type: t.type,
          author: t.author,
          content: String(t.content || '').slice(0, 500),
          timestamp: t.timestamp,
        })),
      },
    };
  },
};

const pipelineStats: ToolDef = {
  name: 'pipelineStats',
  category: 'read',
  requiresConfirmation: false,
  declaration: {
    name: 'pipelineStats',
    description: 'Aggregate counts and total loan value grouped by pipeline stage for the caller\'s book. Optional scope: "my" (agent\'s own deals — default), "team" or "all" (admin only).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        scope: { type: SchemaType.STRING, description: 'One of "my", "team", "all". Non-admins are forced to "my".' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    const scope = ctx.role === 'admin' ? (args.scope || 'my') : 'my';
    let q: FirebaseFirestore.Query = adminDb.collection('referrals');
    if (scope === 'my') q = q.where('assignedAgentId', '==', ctx.uid);
    const snap = await q.limit(MAX_DOCS_PER_TOOL).get();
    const byStage: Record<string, { count: number; value: number }> = {};
    snap.docs.forEach((d) => {
      const r = d.data() as any;
      const s = r.status || 'Unknown';
      byStage[s] = byStage[s] || { count: 0, value: 0 };
      byStage[s].count += 1;
      byStage[s].value += Number(r.loanAmount || 0);
    });
    const totalCount = snap.docs.length;
    const totalValue = Object.values(byStage).reduce((a, b) => a + b.value, 0);
    return {
      ok: true,
      summary: `Pipeline scope=${scope}: ${totalCount} deals, $${totalValue.toLocaleString()} total.`,
      data: { scope, totalCount, totalValue, byStage },
    };
  },
};

const findStalledDeals: ToolDef = {
  name: 'findStalledDeals',
  category: 'read',
  requiresConfirmation: false,
  declaration: {
    name: 'findStalledDeals',
    description: 'Return deals that haven\'t had timeline activity in N days. Useful for "which of my leads went cold" queries.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        daysSinceActivity: { type: SchemaType.NUMBER, description: 'Threshold in days. Default 5.' },
        stage: { type: SchemaType.STRING, description: 'Optionally filter to one pipeline stage.' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    const threshold = typeof args.daysSinceActivity === 'number' ? args.daysSinceActivity : 5;
    const cutoff = Date.now() - threshold * 24 * 60 * 60 * 1000;
    let q: FirebaseFirestore.Query = adminDb.collection('referrals');
    if (ctx.role !== 'admin') q = q.where('assignedAgentId', '==', ctx.uid);
    if (args.stage) q = q.where('status', '==', args.stage);
    const snap = await q.limit(MAX_DOCS_PER_TOOL).get();
    const stalled = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((r: any) => {
        if (['Closed', 'Firm Sale', 'Funded', 'Declined', 'Lost'].includes(r.status)) return false;
        const timeline = Array.isArray(r.timeline) ? r.timeline : [];
        const last = timeline.length ? new Date(timeline[timeline.length - 1].timestamp).getTime() : new Date(r.referralDate || 0).getTime();
        return last <= cutoff;
      })
      .map((r: any) => ({
        id: r.id,
        firstName: String(r.clientName || 'Unknown').split(' ')[0],
        stage: r.status,
        callCount: r.callCount || 0,
        loanAmount: r.loanAmount || 0,
        daysIdle: Math.floor((Date.now() - new Date(r.referralDate || 0).getTime()) / (24 * 60 * 60 * 1000)),
      }))
      .slice(0, 50);
    return {
      ok: true,
      summary: `${stalled.length} deal${stalled.length === 1 ? '' : 's'} idle for ${threshold}+ days.`,
      data: { deals: stalled, threshold },
    };
  },
};

const listMyTasks: ToolDef = {
  name: 'listMyTasks',
  category: 'read',
  requiresConfirmation: false,
  declaration: {
    name: 'listMyTasks',
    description: 'List the caller\'s open tasks, grouped by due-date bucket (overdue/today/this week/later). Read-only.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        includeCompleted: { type: SchemaType.BOOLEAN, description: 'Include completed tasks too. Default false.' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    const snap = await adminDb
      .collection('tasks')
      .where('assigneeId', '==', ctx.uid)
      .limit(MAX_DOCS_PER_TOOL)
      .get();
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const buckets: any = { overdue: [], today: [], week: [], later: [] };
    snap.docs.forEach((d) => {
      const t = d.data() as any;
      if (t.status === 'Completed' && !args.includeCompleted) return;
      const due = t.dueDate || '';
      const bucket = due < today ? 'overdue' : due === today ? 'today' : due <= in7Days ? 'week' : 'later';
      buckets[bucket].push({ id: d.id, clientName: t.clientName, description: t.description, dueDate: due, referralId: t.referralId });
    });
    return {
      ok: true,
      summary: `${buckets.overdue.length} overdue, ${buckets.today.length} today, ${buckets.week.length} this week, ${buckets.later.length} later.`,
      data: buckets,
    };
  },
};

// ─── WRITE TOOLS (confirmation required) ─────────────────────────────

const createTask: ToolDef = {
  name: 'createTask',
  category: 'write',
  requiresConfirmation: true,
  declaration: {
    name: 'createTask',
    description: 'Create a follow-up task on a deal. The user will confirm before it saves.',
    parameters: {
      type: SchemaType.OBJECT,
      required: ['dealId', 'description', 'dueDate'],
      properties: {
        dealId: { type: SchemaType.STRING, description: 'Deal document ID.' },
        description: { type: SchemaType.STRING, description: 'What needs to be done. One sentence.' },
        dueDate: { type: SchemaType.STRING, description: 'ISO date YYYY-MM-DD.' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    const deal = await assertDealOwnership(args.dealId, ctx);
    const ref = await adminDb.collection('tasks').add({
      referralId: args.dealId,
      clientName: deal.clientName || 'Unknown',
      assigneeId: ctx.uid,
      dueDate: args.dueDate,
      description: args.description,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      createdVia: 'copilot',
    });
    return { ok: true, summary: `Task created for ${new Date(args.dueDate).toDateString()}: ${args.description}`, affected: [ref.id] };
  },
};

const logCall: ToolDef = {
  name: 'logCall',
  category: 'write',
  requiresConfirmation: true,
  declaration: {
    name: 'logCall',
    description: 'Log that you called the client. Advances the touch-SLA counter. User will confirm before saving.',
    parameters: {
      type: SchemaType.OBJECT,
      required: ['dealId', 'notes'],
      properties: {
        dealId: { type: SchemaType.STRING, description: 'Deal document ID.' },
        notes: { type: SchemaType.STRING, description: 'Brief summary of the call outcome.' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    const deal = await assertDealOwnership(args.dealId, ctx);
    const timeline = Array.isArray(deal.timeline) ? deal.timeline : [];
    const entry = {
      type: 'note',
      author: 'Copilot (' + ctx.uid + ')',
      content: `📞 LOGGED CALL: ${args.notes}`,
      timestamp: new Date().toISOString(),
      isSystemMessage: true,
    };
    await adminDb.collection('referrals').doc(args.dealId).update({
      timeline: [...timeline, entry],
      callCount: (deal.callCount || 0) + 1,
    });
    return { ok: true, summary: `Call logged. Touch count now ${(deal.callCount || 0) + 1}/5.`, affected: [args.dealId] };
  },
};

const logNote: ToolDef = {
  name: 'logNote',
  category: 'write',
  requiresConfirmation: true,
  declaration: {
    name: 'logNote',
    description: 'Add an internal (team-only) note to a deal timeline. User will confirm before saving.',
    parameters: {
      type: SchemaType.OBJECT,
      required: ['dealId', 'note'],
      properties: {
        dealId: { type: SchemaType.STRING, description: 'Deal document ID.' },
        note: { type: SchemaType.STRING, description: 'Note text.' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    const deal = await assertDealOwnership(args.dealId, ctx);
    const timeline = Array.isArray(deal.timeline) ? deal.timeline : [];
    const entry = {
      type: 'note',
      author: 'Copilot (' + ctx.uid + ')',
      content: `🔒 INTERNAL: ${args.note}`,
      timestamp: new Date().toISOString(),
      isSystemMessage: true,
    };
    await adminDb.collection('referrals').doc(args.dealId).update({ timeline: [...timeline, entry] });
    return { ok: true, summary: 'Internal note added to timeline.', affected: [args.dealId] };
  },
};

// Advance-forward-only stage change. Blocks backwards moves via a manual
// stage order table so the copilot can't rewind a Firm Sale to Contacted.
const FORWARD_STAGES = ['New Web Lead', 'Received', 'Contacted', 'Showing', 'Underwriting', 'Offer Made', 'Conditional', 'Approved', 'Firm Sale', 'Firm / Conditional', 'Funded', 'Closed', 'Funded / Paid'];
const TERMINAL_LOSS = new Set(['Declined', 'Lost', 'Cancelled']);

const updateDealStatus: ToolDef = {
  name: 'updateDealStatus',
  category: 'write',
  requiresConfirmation: true,
  declaration: {
    name: 'updateDealStatus',
    description: 'Move a deal forward in the pipeline (or to a lost state). Cannot move backward. User will confirm before saving.',
    parameters: {
      type: SchemaType.OBJECT,
      required: ['dealId', 'newStatus'],
      properties: {
        dealId: { type: SchemaType.STRING, description: 'Deal document ID.' },
        newStatus: { type: SchemaType.STRING, description: 'New pipeline status (must be forward from current or a terminal loss).' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    const deal = await assertDealOwnership(args.dealId, ctx);
    const cur = deal.status || 'Received';
    const curIdx = FORWARD_STAGES.indexOf(cur);
    const nextIdx = FORWARD_STAGES.indexOf(args.newStatus);
    const goingToLoss = TERMINAL_LOSS.has(args.newStatus);
    if (!goingToLoss && nextIdx <= curIdx) {
      return { ok: false, summary: `Cannot move deal backward from "${cur}" to "${args.newStatus}". Forward-only.` };
    }
    await adminDb.collection('referrals').doc(args.dealId).update({
      status: args.newStatus,
      stageEnteredAt: new Date().toISOString(),
    });
    return { ok: true, summary: `Deal moved from ${cur} → ${args.newStatus}.`, affected: [args.dealId] };
  },
};

const addTag: ToolDef = {
  name: 'addTag',
  category: 'write',
  requiresConfirmation: true,
  declaration: {
    name: 'addTag',
    description: 'Set the lead tag on a deal (PURCHASE, First Time Buyer, Refinance, etc.). User will confirm.',
    parameters: {
      type: SchemaType.OBJECT,
      required: ['dealId', 'tag'],
      properties: {
        dealId: { type: SchemaType.STRING, description: 'Deal document ID.' },
        tag: { type: SchemaType.STRING, description: 'One of: PURCHASE, First Time Buyer, Renewal, Refinance, Reverse Mortgage, Realtor Lead.' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    if (!adminDb) return { ok: false, summary: 'Database not available.' };
    await assertDealOwnership(args.dealId, ctx);
    await adminDb.collection('referrals').doc(args.dealId).update({ leadTag: args.tag });
    return { ok: true, summary: `Lead tag set to "${args.tag}".`, affected: [args.dealId] };
  },
};

// ─── DRAFT TOOLS (no persistence, no confirmation — pure text-out) ───

const draftClientMessage: ToolDef = {
  name: 'draftClientMessage',
  category: 'draft',
  requiresConfirmation: false,
  declaration: {
    name: 'draftClientMessage',
    description: 'Compose a draft SMS/email message to send to the client. Returns text — DOES NOT send. User can copy and send manually.',
    parameters: {
      type: SchemaType.OBJECT,
      required: ['dealId', 'intent'],
      properties: {
        dealId: { type: SchemaType.STRING, description: 'Deal document ID.' },
        intent: { type: SchemaType.STRING, description: 'What the message should convey.' },
        channel: { type: SchemaType.STRING, description: 'SMS or email. Default email.' },
        tone: { type: SchemaType.STRING, description: 'professional | warm | urgent. Default warm.' },
      },
    } as Schema,
  },
  handler: async (args, ctx) => {
    // Draft tools don't call downstream services — the LLM composes the
    // text and returns it. But we still validate ownership so a random
    // deal ID can't leak the client name into the draft.
    const deal = await assertDealOwnership(args.dealId, ctx);
    const firstName = String(deal.clientName || 'there').split(' ')[0];
    return {
      ok: true,
      summary: 'Draft ready — copy from the assistant\'s next message and send via your usual channel.',
      data: {
        firstName,
        intent: args.intent,
        channel: args.channel || 'email',
        tone: args.tone || 'warm',
      },
    };
  },
};

// ─── Registry ────────────────────────────────────────────────────────

export const COPILOT_TOOLS: Record<string, ToolDef> = {
  queryLeads,
  summarizeDeal,
  pipelineStats,
  findStalledDeals,
  listMyTasks,
  createTask,
  logCall,
  logNote,
  updateDealStatus,
  addTag,
  draftClientMessage,
};

// Gemini function-declaration array — this is what we hand the model.
// Explicitly built from the registry so that adding a new tool means
// adding one entry above, not two places.
export function getGeminiTools(ctx: CopilotContext) {
  const declarations = Object.values(COPILOT_TOOLS)
    .filter((t) => !t.adminOnly || ctx.role === 'admin')
    .map((t) => t.declaration);
  return [{ functionDeclarations: declarations }];
}

export function getToolByName(name: string): ToolDef | null {
  return COPILOT_TOOLS[name] || null;
}
