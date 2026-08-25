// Rule registry.
//
// Add a rule by importing it here and pushing to RULES. The runner
// (onReferralWrite) iterates the array in order and collects every
// non-null result. Order matters only for humans reading the audit
// log — every rule sees the same before/after, so there's no side
// -channel between them.
//
// v1 keeps this DELIBERATELY SHORT. Sales Coach's #1 warning: three
// well-tuned rules with high signal beat twenty rules that flag
// everything. Add rules once the seeded ones have earned trust.

import type { Rule, ReferralDoc, RuleContext, RuleFireResult } from './types';

// ─── Constants shared across rules ─────────────────────────────────

const FUNDED = new Set(['Funded', 'Closed', 'Firm Sale', 'Firm / Conditional', 'Funded / Paid']);
const LOST = new Set(['Declined', 'Lost', 'Cancelled']);

// Stage-aware stale thresholds (days). New leads go cold in 3 days;
// underwriting can sit for 2 weeks without alarm. From Sales Coach:
// "one threshold fits nothing — a 'stale' New lead and a 'stale'
// Underwriting file are unrelated problems".
const STALE_DAYS_BY_STATUS: Record<string, number> = {
  'New': 3,
  'Contacted': 7,
  'In Progress': 10,
  'Underwriting': 14,
  'Approved': 21,
  'Firm / Conditional': 30,
  'Firm Sale': 30,
  // Funded / Closed / any LOST → no stale rule (returns null below).
};

// Helper: days between two ISO date strings (assumes both parseable).
function daysBetween(from: string | undefined, to: Date): number {
  if (!from) return 0;
  const t = new Date(from).getTime();
  if (isNaN(t)) return 0;
  return Math.floor((to.getTime() - t) / 86400000);
}

function hoursBetween(from: string | undefined, to: Date): number {
  if (!from) return 0;
  const t = new Date(from).getTime();
  if (isNaN(t)) return 0;
  return (to.getTime() - t) / 3600000;
}

// ─── RULE 1 — Stage-aware stale detection ───────────────────────────
// Fires when a deal hasn't been touched in the stale threshold for its
// current status. Notification lands on the ASSIGNEE (not a manager) —
// escalation to admin lives in a separate rule with a longer window.
//
// This runs on every write; the daysSinceUpdate check + idempotency key
// keyed on the day means it fires at most once per referral per day.
const RULE_STALE_BY_STAGE: Rule = {
  id: 'stale.by-stage',
  description: 'Alert assignee when a deal has been idle beyond its stage-specific threshold.',
  enabled: true,
  evaluate(_before, after, ctx): RuleFireResult[] | null {
    if (!after) return null;
    const status = String(after.status || '');
    if (FUNDED.has(status) || LOST.has(status)) return null;
    const threshold = STALE_DAYS_BY_STATUS[status];
    if (!threshold) return null;
    const idleDays = daysBetween(after.lastUpdated || after.referralDate, ctx.now);
    if (idleDays < threshold) return null;
    const recipient = after.assignedAgentId;
    if (!recipient || recipient === 'ADMIN_INBOX') return null;

    // Bucket by day so the same alert doesn't repost on every write.
    const dayBucket = ctx.now.toISOString().slice(0, 10);
    return [{
      idempotencyKey: `stale.by-stage:${after.id}:${dayBucket}`,
      debounceMs: 20 * 60 * 60 * 1000, // 20h — one alert per day, even across timezones
      actions: [
        {
          kind: 'notify',
          recipientUid: recipient,
          title: `${after.clientName || 'A deal'} has stalled`,
          body: `${idleDays} days idle in "${status}". Threshold for this stage is ${threshold} days.`,
          link: { referralId: after.id },
          severity: idleDays > threshold * 2 ? 'urgent' : 'warn',
        },
      ],
    }];
  },
};

// ─── RULE 2 — Speed-to-lead SLA escalation ─────────────────────────
// A new lead in "New" without a logged call within 2h → nudge the
// assignee. At 6h → notify admin (soft escalation, not reassignment).
// At 24h → urgent to admin.
//
// The 4-tier escalation Sales Coach recommended (broker → peer →
// auto-reassign → manager) is deferred until we have the peer-graph
// data model to route to. For v1 we do broker → admin only.
const RULE_SLA_CALL: Rule = {
  id: 'sla.call-first-touch',
  description: 'Escalate when a New lead has no first call logged within the SLA window.',
  enabled: true,
  evaluate(_before, after, ctx): RuleFireResult[] | null {
    if (!after) return null;
    if (after.status !== 'New') return null;
    if ((after.callCount || 0) > 0) return null;
    if (!ctx.isBusinessHours) return null; // Do not surface out-of-hours

    const hours = hoursBetween(after.referralDate, ctx.now);
    if (hours < 2) return null;

    const recipient = after.assignedAgentId;
    if (!recipient || recipient === 'ADMIN_INBOX') return null;

    const tier: 'nudge' | 'escalate' | 'urgent' =
      hours >= 24 ? 'urgent' : hours >= 6 ? 'escalate' : 'nudge';

    // Idempotency key includes the tier so each tier fires at most once.
    return [{
      idempotencyKey: `sla.call:${after.id}:${tier}`,
      actions: [
        {
          kind: 'notify',
          recipientUid: recipient,
          title:
            tier === 'urgent'
              ? `🚨 ${after.clientName || 'New lead'} still uncalled at ${Math.round(hours)}h`
              : tier === 'escalate'
              ? `${after.clientName || 'New lead'} — ${Math.round(hours)}h and no call logged`
              : `Speed-to-lead: call ${after.clientName || 'this new lead'} soon`,
          body: `Received ${Math.round(hours)}h ago. Every hour past 2h halves your conversion odds.`,
          link: { referralId: after.id },
          severity: tier === 'urgent' ? 'urgent' : tier === 'escalate' ? 'warn' : 'info',
        },
      ],
    }];
  },
};

// ─── RULE 3 — Cross-sell flag (realtor Offer Made → mortgage) ──────
// The ONE cross-sell rule Sales Coach signed off on: when a Real Estate
// deal enters "Offer Made" / "Firm Sale" without a linked mortgage
// referral, ping the broker responsible for the account's mortgage
// pipeline. Never notifies the client (Offer Strategist's ambush warning).
//
// v1 heuristic for "linked mortgage": we surface the flag whenever
// dealType='Real Estate' hits an offer-stage status AND the deal
// isn't already crossSellFlagged. Runner should set crossSellFlagged
// on the referral doc after firing to avoid re-flagging.
const OFFER_STAGES = new Set(['Offer Made', 'Firm Sale', 'Firm / Conditional', 'Accepted', 'Conditional Offer']);

const RULE_CROSS_SELL_REALTOR_OFFER: Rule = {
  id: 'cross-sell.realtor-offer-made',
  description: 'Flag realtor deals at Offer Made stage that lack a linked mortgage referral.',
  enabled: true,
  evaluate(before, after, ctx): RuleFireResult[] | null {
    if (!after) return null;
    if (after.dealType !== 'Real Estate') return null;
    if (!OFFER_STAGES.has(String(after.status || ''))) return null;
    // Only fire on the TRANSITION into the offer stage — not every subsequent write.
    if (before && OFFER_STAGES.has(String(before.status || ''))) return null;
    if (after.crossSellFlagged) return null;
    const recipient = after.assignedAgentId;
    if (!recipient || recipient === 'ADMIN_INBOX') return null;

    const summary = 'Offer accepted on a real estate deal without a linked mortgage. Reach out same-day — this is the highest-converting cross-sell (~25-40%).';

    return [{
      idempotencyKey: `cross-sell.realtor-offer:${after.id}`,
      actions: [
        // Persistent state — the flag lives until owner marks it
        // Contacted / Converted / Dismissed. Escalation ladder reads
        // /crossSellFlags on a schedule.
        {
          kind: 'flagCrossSell',
          sourceReferralId: after.id,
          ownerUid: recipient,
          crossSellKind: 'realtor-offer-to-mortgage',
          summary,
          clientName: after.clientName || 'Buyer',
          loanAmount: after.loanAmount,
        },
        // In-app notification — the moment-in-time nudge. The
        // notification is transient; the flag above is the state.
        {
          kind: 'notify',
          recipientUid: recipient,
          title: `Mortgage cross-sell opportunity: ${after.clientName || 'Buyer'}`,
          body: summary,
          link: { referralId: after.id },
          severity: 'warn',
        },
      ],
    }];
  },
};

// ─── RULE 4 — Realtor "push for mortgage" landed ───────────────────
// Fires on the transition pushedForMortgage: false→true. Notifies all
// admins so someone claims the deal quickly. We don't route to a
// specific broker because assignment is a human decision — the deal
// might be first-time-buyer (junior broker), self-employed (senior),
// or private-lending (specialist).
//
// This is the primary Phase 4 signal. Without it, realtor-pushed deals
// would silently land in ADMIN_INBOX and rot until someone browses it.
const RULE_MORTGAGE_PUSH: Rule = {
  id: 'push.mortgage-referral',
  description: 'Notify admins when a realtor pushes a deal to IndiBrick for mortgage financing.',
  enabled: true,
  evaluate(before, after, _ctx): RuleFireResult[] | null {
    if (!after) return null;
    // Only fire on the false → true transition. Missing before-value
    // (e.g. brand-new deal created with pushedForMortgage=true) also
    // qualifies because the referrer already opted in on create.
    const wasNotPushed = !before || before.pushedForMortgage !== true;
    const isNowPushed = after.pushedForMortgage === true;
    if (!wasNotPushed || !isNowPushed) return null;

    // The recipient is "all admins" — engine expands this at dispatch
    // time by querying /users where role == 'admin'. Encoded as a
    // special sentinel uid the engine recognizes.
    return [{
      idempotencyKey: `push.mortgage-referral:${after.id}`,
      actions: [
        {
          kind: 'notify',
          // Sentinel value — engine fans out to all admin uids.
          recipientUid: '__ALL_ADMINS__',
          title: `📬 New mortgage push: ${after.clientName || 'Unnamed client'}`,
          body: `A partner pushed this deal to the brokerage for mortgage financing. Assign a broker to start work.${after.dealType ? ` Deal type: ${after.dealType}.` : ''}`,
          link: { referralId: after.id },
          severity: 'warn',
        },
      ],
    }];
  },
};

// ─── RULE 5 — Mortgage funded → Insurance opportunity ──────────────
// Sales Coach's "leads not software" insurance offer: every mortgage
// closing needs home insurance to fund. We create an insurance-typed
// referral in the INSURANCE_INBOX pool the moment a mortgage transitions
// to Funded. The insurance broadcast rule (below) then notifies every
// insurance agent so first-come-first-served claiming works.
//
// The client name + contact copy carry across; the source mortgage
// referralId is stored on the new insurance doc so the broker can
// audit the origin.
const MORTGAGE_FUNDED_STATUSES = new Set(['Funded', 'Funded / Paid', 'Closed']);

const RULE_MORTGAGE_TO_INSURANCE: Rule = {
  id: 'mortgage.funded-to-insurance-opportunity',
  description: 'When a mortgage funds, open an insurance opportunity into the insurance-agent pool.',
  enabled: true,
  evaluate(before, after, ctx): RuleFireResult[] | null {
    if (!after) return null;
    // Only mortgage deals — realtor + insurance deals don't spawn insurance opportunities.
    if (after.dealType && after.dealType !== 'Mortgage') return null;
    if (!MORTGAGE_FUNDED_STATUSES.has(String(after.status || ''))) return null;
    // Fire only on the TRANSITION into funded.
    if (before && MORTGAGE_FUNDED_STATUSES.has(String(before.status || ''))) return null;
    // Need a client email to route the insurance opportunity meaningfully.
    if (!after.clientEmail) return null;

    return [{
      idempotencyKey: `mortgage.funded-to-insurance:${after.id}`,
      actions: [
        {
          kind: 'createReferral',
          data: {
            clientName: after.clientName,
            clientEmail: after.clientEmail,
            clientPhone: after.clientPhone,
            referrerId: 'INDIBRICK_SYSTEM',
            referrerName: 'IndiBrick — Mortgage Funding Feed',
            assignedAgentId: 'INSURANCE_INBOX',
            assignedAgentName: 'Insurance Inbox (Unclaimed)',
            status: 'New',
            dealType: 'Insurance',
            dealCategory: 'potential',
            insuranceCoverageType: 'Home',   // default; agent can update
            insuranceOpportunityFrom: after.id,
            notes: `New home insurance opportunity from a mortgage funding on ${new Date().toISOString().slice(0, 10)}. Loan amount: ${after.loanAmount || 'unknown'}.`,
            timeline: [{
              type: 'system',
              author: 'System',
              content: `Insurance opportunity opened from mortgage ${after.id} (${after.clientName || 'client'}).`,
              timestamp: new Date().toISOString(),
              isSystemMessage: true,
            }],
            referralDate: new Date().toISOString(),
            pushedForMortgage: true,          // Insurance opportunities are never "private realtor" deals
            crossSellFlagged: false,
          },
        },
      ],
    }];
  },
};

// ─── RULE 6 — Broadcast unclaimed insurance opportunities ──────────
// Fires on any Insurance-typed referral in the INSURANCE_INBOX with
// status='New'. Notifies EVERY user with role='partner_insurance' —
// first-come first-served claiming via /api/partner/referrals/[id]/
// claim-insurance-lead flips the assignment away from INSURANCE_INBOX.
//
// Deduplication is via the referralId in the idempotency key — the
// broadcast fires once per lead, not once per write.
const RULE_INSURANCE_BROADCAST: Rule = {
  id: 'insurance.new-lead-in-pool',
  description: 'Broadcast unclaimed insurance leads to all partner_insurance agents.',
  enabled: true,
  evaluate(_before, after, _ctx): RuleFireResult[] | null {
    if (!after) return null;
    if (after.dealType !== 'Insurance') return null;
    if (after.assignedAgentId !== 'INSURANCE_INBOX') return null;
    if (after.status !== 'New') return null;

    const carrierHint = after.insuranceCoverageType || 'Home';
    return [{
      idempotencyKey: `insurance.broadcast:${after.id}`,
      actions: [
        {
          kind: 'notify',
          recipientUid: '__ALL_INSURANCE_AGENTS__',
          title: `📮 New ${carrierHint.toLowerCase()} insurance lead available`,
          body: `Mortgage funding — client needs bound insurance to close. First-come, first-served. Click to claim.`,
          link: { referralId: after.id },
          severity: 'warn',
        },
      ],
    }];
  },
};

// ─── Registry ──────────────────────────────────────────────────────

export const RULES: Rule[] = [
  RULE_STALE_BY_STAGE,
  RULE_SLA_CALL,
  RULE_CROSS_SELL_REALTOR_OFFER,
  RULE_MORTGAGE_PUSH,
  RULE_MORTGAGE_TO_INSURANCE,
  RULE_INSURANCE_BROADCAST,
];

// Also exported individually for unit tests.
export {
  RULE_STALE_BY_STAGE, RULE_SLA_CALL, RULE_CROSS_SELL_REALTOR_OFFER,
  RULE_MORTGAGE_PUSH, RULE_MORTGAGE_TO_INSURANCE, RULE_INSURANCE_BROADCAST,
};
export type { Rule, ReferralDoc, RuleContext, RuleFireResult };
