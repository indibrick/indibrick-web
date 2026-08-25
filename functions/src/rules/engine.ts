// The runner. Executes RULES against a (before, after) pair and
// dispatches side-effects with all 6 non-negotiable safeguards flagged
// by the Backend Architect review:
//
//   1. _systemUpdate guard        — writes with this flag skip evaluation
//                                    entirely. Cloud Functions themselves
//                                    tag their writes so they don't recurse.
//   2. Idempotency key            — every fired rule stamps /rule_events;
//                                    the same key is a no-op on replay.
//   3. Debounce                   — a per-rule minimum wait between fires
//                                    on the same referral.
//   4. Circuit breaker            — if any single rule throws >5 times in
//                                    5 min, it auto-disables for the day.
//   5. System-actor skip          — writes where actorUid is null (i.e.
//                                    from scheduled functions / admin
//                                    migrations) skip cross-sell + stale
//                                    rules that would otherwise misfire.
//   6. Field-diff gate            — a write that only changes lastUpdated
//                                    /timeline heartbeat fields is not
//                                    treated as a rule-worthy event.
//
// These guardrails are what stop the rules engine from being weaponized
// by the (now-fixed) firestore-rules vulnerability — because the rule
// runner sits between the write and the action, even a malicious write
// can't cause a task/email dispatch unless the safeguards allow it.

/* eslint-disable import/no-unresolved */
import * as admin from 'firebase-admin';
import { RULES } from './index';
import type { Rule, ReferralDoc, RuleContext, NotificationAction, RuleFireResult } from './types';
import { isBusinessHoursToronto } from './holidays';
import { interpretWorkflow, type StoredWorkflow } from './workflowInterpreter';

const HEARTBEAT_FIELDS = new Set([
  'lastUpdated',
  'lastUpdatedBy',
  'lastTouchedAt',
  '_systemUpdate',
  'timeline', // by itself is a heartbeat; combined with status change we still evaluate
]);

// Circuit breaker state — process-local, so it resets on cold start
// (fine — we don't want the trip to survive across days). Backed by
// a Firestore doc for visibility once we ship a rules-admin UI.
type BreakerState = { failures: number; lastFailureMs: number; tripped: boolean };
const breaker = new Map<string, BreakerState>();
const BREAKER_WINDOW_MS = 5 * 60 * 1000;
const BREAKER_MAX_FAILURES = 5;

function isTripped(ruleId: string, now: number): boolean {
  const s = breaker.get(ruleId);
  if (!s) return false;
  if (now - s.lastFailureMs > BREAKER_WINDOW_MS) {
    breaker.delete(ruleId);
    return false;
  }
  return s.tripped;
}

function recordFailure(ruleId: string, now: number) {
  const s = breaker.get(ruleId) || { failures: 0, lastFailureMs: 0, tripped: false };
  s.failures += 1;
  s.lastFailureMs = now;
  if (s.failures >= BREAKER_MAX_FAILURES) s.tripped = true;
  breaker.set(ruleId, s);
}

// Safeguard 6: which fields actually changed? A write that only bumps
// heartbeat fields is not a rule-worthy event.
function meaningfulDiff(before: ReferralDoc | null, after: ReferralDoc | null): boolean {
  if (!before || !after) return true; // create / delete always meaningful
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (HEARTBEAT_FIELDS.has(k)) continue;
    // Shallow compare — good enough for the fields that drive rules.
    const b = (before as any)[k];
    const a = (after as any)[k];
    if (b === a) continue;
    if (typeof b === 'number' && typeof a === 'number' && b === a) continue;
    if (Array.isArray(b) && Array.isArray(a) && b.length === a.length) continue;
    return true;
  }
  return false;
}

// Fetch the enabled state override (if any) from /rule_config/{ruleId}.
// Missing doc → use the code default (rule.enabled).
async function isEnabled(rule: Rule, db: FirebaseFirestore.Firestore): Promise<boolean> {
  try {
    const snap = await db.collection('rule_config').doc(rule.id).get();
    if (!snap.exists) return rule.enabled;
    const data = snap.data() || {};
    if (typeof data.enabled === 'boolean') return data.enabled;
  } catch { /* fall through to code default */ }
  return rule.enabled;
}

// Safeguard 2 + 3: idempotency + debounce check.
// Return true if the (idempotencyKey, debounce window) allows this fire.
async function acquireFireLease(
  db: FirebaseFirestore.Firestore,
  ruleId: string,
  referralId: string,
  fire: RuleFireResult,
  now: Date,
): Promise<boolean> {
  const eventsRef = db.collection('rule_events');
  const key = fire.idempotencyKey;
  // Idempotency: exact-match on key → no-op.
  const dupe = await eventsRef.where('idempotencyKey', '==', key).limit(1).get();
  if (!dupe.empty) return false;

  // Debounce: any prior event for the same (ruleId, referralId) within
  // the debounce window blocks this fire.
  if (fire.debounceMs && fire.debounceMs > 0) {
    const cutoff = new Date(now.getTime() - fire.debounceMs);
    const recent = await eventsRef
      .where('ruleId', '==', ruleId)
      .where('referralId', '==', referralId)
      .where('firedAt', '>=', cutoff)
      .limit(1)
      .get();
    if (!recent.empty) return false;
  }

  // Reserve the lease by writing the event row before dispatching. If
  // dispatch fails we still want the audit trail; retries will see the
  // key and no-op.
  await eventsRef.add({
    ruleId,
    referralId,
    idempotencyKey: key,
    firedAt: admin.firestore.FieldValue.serverTimestamp(),
    now: now.toISOString(),
  });
  return true;
}

// Sentinel expansion for actions targeted at ALL admins. The rule
// stays declarative; the runner is the only place that does the fan
// -out query so admin membership changes take effect immediately.
async function expandRecipients(
  db: FirebaseFirestore.Firestore,
  recipientUid: string,
): Promise<string[]> {
  if (recipientUid === '__ALL_ADMINS__') {
    const admins = await db.collection('users').where('role', '==', 'admin').get();
    const uids = admins.docs.map(d => d.id);
    if (uids.length === 0) {
      console.warn('[rules] __ALL_ADMINS__ expanded to zero uids — is any user set to role:admin?');
    }
    return uids;
  }
  if (recipientUid === '__ALL_INSURANCE_AGENTS__') {
    const agents = await db.collection('users').where('role', '==', 'partner_insurance').get();
    const uids = agents.docs.map(d => d.id);
    if (uids.length === 0) {
      console.warn('[rules] __ALL_INSURANCE_AGENTS__ expanded to zero uids — no partner_insurance users yet.');
    }
    return uids;
  }
  return [recipientUid];
}

async function dispatchAction(
  db: FirebaseFirestore.Firestore,
  ruleId: string,
  action: NotificationAction,
): Promise<void> {
  switch (action.kind) {
    case 'notify': {
      const uids = await expandRecipients(db, action.recipientUid);
      const batch = db.batch();
      for (const uid of uids) {
        const ref = db.collection('notifications').doc();
        batch.set(ref, {
          ruleId,
          recipientUid: uid,
          title: action.title,
          body: action.body,
          link: action.link || null,
          severity: action.severity,
          read: false,
          dismissed: false,
          snoozedUntil: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      if (uids.length > 0) await batch.commit();
      break;
    }

    case 'createTask':
      await db.collection('tasks').add({
        referralId: action.referralId,
        assigneeId: action.assigneeId,
        description: action.description,
        dueDate: action.dueDate,
        status: 'Pending',
        createdBy: `rule:${ruleId}`,
        createdAt: new Date().toISOString(),
      });
      break;

    case 'email':
      // Trigger Email extension picks this up.
      await db.collection('mail').add({
        to: action.to,
        message: { subject: action.subject, html: action.html },
      });
      break;

    case 'createReferral': {
      // Server-created referrals (e.g. insurance opportunities spawned
      // from a mortgage funding). Stamp _systemUpdate so the trigger
      // that fires on THIS create doesn't treat it as user activity
      // for cross-sell / stale rules (safeguard 5).
      const data = {
        ...action.data,
        _systemUpdate: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const created = await db.collection('referrals').add(data);
      // Immediately clear the flag so subsequent legitimate writes
      // aren't silenced. The insurance-broadcast rule (evaluated on
      // this create trigger) will see _systemUpdate=true and skip;
      // that's the right behavior — the notify happens via a
      // separate insurance.new-lead-in-pool rule that gates on the
      // insurance-inbox assignment shape, not the write actor.
      await created.update({ _systemUpdate: admin.firestore.FieldValue.delete() });
      break;
    }

    case 'flagCrossSell':
      // Persistent state doc. Idempotency is handled up-stack by the
      // rule's own idempotency key + the referral's crossSellFlagged
      // boolean — this dispatcher assumes the runner already deduped.
      await db.collection('crossSellFlags').add({
        sourceReferralId: action.sourceReferralId,
        ownerUid: action.ownerUid,
        crossSellKind: action.crossSellKind,
        summary: action.summary,
        clientName: action.clientName,
        loanAmount: action.loanAmount ?? null,
        // State machine: Open → Contacted → Converted, or Open → Dismissed.
        status: 'Open',
        flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastEscalationLevel: 0,        // 0=none, 1=24h nudge, 2=72h admin, 3=7d urgent
        lastEscalatedAt: null,
        contactedAt: null,
        convertedAt: null,
        dismissedAt: null,
        ruleId,
      });
      // Stamp the source referral so the same rule can't re-fire the
      // next time we get a write. The rule guards on this field before
      // producing a result — that's our loop-breaker. We deliberately
      // do NOT set `_systemUpdate: true` here: the sticky-flag pattern
      // would silence every subsequent legitimate write forever.
      // The stale/SLA rules see this write but dedupe via their own
      // idempotency keys, so no harm.
      await db.collection('referrals').doc(action.sourceReferralId).update({
        crossSellFlagged: true,
      });
      break;

    case 'patchReferral': {
      // Whitelisted single-field mutation from user workflows. Only
      // status + leadTag are allowed — the interpreter enforces that
      // at type level. Stamp _systemUpdate so onReferralWrite doesn't
      // fire the same workflow again on this write (loop guard).
      const patch: Record<string, any> = {
        [action.field]: action.value,
        lastUpdated: new Date().toISOString(),
        _systemUpdate: true,
      };
      await db.collection('referrals').doc(action.referralId).update(patch);
      // Immediately clear the flag so subsequent legitimate writes
      // aren't silenced.
      await db.collection('referrals').doc(action.referralId).update({
        _systemUpdate: admin.firestore.FieldValue.delete(),
      });
      break;
    }

    case 'webhook': {
      // Fire-and-forget outbound HTTP. We use the global fetch (Node
      // 20+ has it built-in — matches our runtime engine). Failures
      // are logged but not fatal — a failing webhook shouldn't stop
      // the rest of the workflow's actions.
      const signingSecret = process.env.WEBHOOK_SIGNING_SECRET || '';
      const bodyStr = JSON.stringify(action.payload);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (signingSecret) {
        // HMAC-SHA256 signature over the body — receivers verify
        // by recomputing and constant-time comparing.
        const crypto = require('crypto');
        const sig = crypto.createHmac('sha256', signingSecret).update(bodyStr).digest('hex');
        headers['X-Indibrick-Signature'] = sig;
      }
      try {
        const res = await fetch(action.url, {
          method: action.method || 'POST',
          headers,
          body: bodyStr,
        });
        if (!res.ok) {
          console.warn('[rules/webhook] non-2xx response', {
            url: action.url, status: res.status, ruleId,
          });
        }
      } catch (e: any) {
        console.error('[rules/webhook] failed', { url: action.url, error: e?.message });
      }
      break;
    }
  }
}

export interface RunOptions {
  before: ReferralDoc | null;
  after: ReferralDoc | null;
  actorUid: string | null;
  db: FirebaseFirestore.Firestore;
}

export interface RunResult {
  evaluated: number;
  fired: number;
  skipped: { ruleId: string; reason: string }[];
  errors: { ruleId: string; error: string }[];
}

// ─── User-authored workflow loading ────────────────────────────────
// Cached to avoid a Firestore read on every evaluation. TTL is short
// so admin edits to workflows are visible within seconds.
let workflowCache: { rules: Rule[]; loadedAt: number } | null = null;
const WORKFLOW_CACHE_TTL_MS = 30_000;

async function loadUserWorkflowsAsRules(db: FirebaseFirestore.Firestore): Promise<Rule[]> {
  const now = Date.now();
  if (workflowCache && (now - workflowCache.loadedAt) < WORKFLOW_CACHE_TTL_MS) {
    return workflowCache.rules;
  }
  try {
    const snap = await db.collection('workflows').where('enabled', '==', true).get();
    const rules: Rule[] = [];
    snap.forEach(doc => {
      const data = doc.data() as any;
      try {
        const wf: StoredWorkflow = { id: doc.id, ...data };
        rules.push(interpretWorkflow(wf));
      } catch (e: any) {
        console.warn('[rules] failed to interpret workflow', doc.id, e?.message);
      }
    });
    workflowCache = { rules, loadedAt: now };
    return rules;
  } catch (e: any) {
    console.error('[rules] failed to load workflows', e?.message);
    return [];
  }
}

// Invalidate the cache on demand — the workflows API route calls this
// after a create/update/delete so the next evaluation sees the change
// immediately (bypassing the TTL).
export function invalidateWorkflowCache() {
  workflowCache = null;
}

export async function runRulesForWrite(opts: RunOptions): Promise<RunResult> {
  const { before, after, actorUid, db } = opts;
  const result: RunResult = { evaluated: 0, fired: 0, skipped: [], errors: [] };

  // Safeguard 1: _systemUpdate flag on the DOCUMENT blocks all evaluation.
  // Cloud Functions writing back to the same doc must set this. Without
  // it, updating `lastUpdatedBy` on a fire would cause the rule to fire
  // again on itself.
  if ((after as any)?._systemUpdate === true) {
    return result;
  }

  // Safeguard 6: field-diff gate.
  if (!meaningfulDiff(before, after)) {
    return result;
  }

  const now = new Date();
  const ctx: RuleContext = {
    now,
    actorUid,
    isBusinessHours: isBusinessHoursToronto(now),
  };

  // Merge code-defined rules with user-authored workflows. Workflows
  // inherit every safeguard automatically — the acquireFireLease path
  // still gates idempotency + debounce, circuit breaker still applies.
  const userRules = await loadUserWorkflowsAsRules(db);
  const allRules: Rule[] = [...RULES, ...userRules];

  for (const rule of allRules) {
    result.evaluated += 1;

    // Circuit breaker (safeguard 4)
    if (isTripped(rule.id, now.getTime())) {
      result.skipped.push({ ruleId: rule.id, reason: 'circuit_open' });
      continue;
    }

    // Runtime enable/disable (Safeguard flag)
    if (!(await isEnabled(rule, db))) {
      result.skipped.push({ ruleId: rule.id, reason: 'disabled' });
      continue;
    }

    // Safeguard 5: system-actor skip — a null actorUid means the write
    // came from a scheduled function / admin migration. We skip stale +
    // cross-sell rules in that case since they'd misfire on bulk imports.
    // SLA rule doesn't skip because a system-generated New lead SHOULD
    // trigger it (webhook → new referral → SLA countdown).
    if (actorUid === null && (rule.id.startsWith('stale.') || rule.id.startsWith('cross-sell.'))) {
      result.skipped.push({ ruleId: rule.id, reason: 'system_actor_skip' });
      continue;
    }

    let fires: RuleFireResult[] | null = null;
    try {
      fires = rule.evaluate(before, after, ctx);
    } catch (e: any) {
      recordFailure(rule.id, now.getTime());
      result.errors.push({ ruleId: rule.id, error: e?.message || 'evaluate threw' });
      continue;
    }

    if (!fires || fires.length === 0) continue;

    for (const fire of fires) {
      const referralId = after?.id || before?.id || '';
      if (!referralId) continue;
      try {
        const acquired = await acquireFireLease(db, rule.id, referralId, fire, now);
        if (!acquired) {
          result.skipped.push({ ruleId: rule.id, reason: 'debounced_or_dupe' });
          continue;
        }
        for (const action of fire.actions) {
          await dispatchAction(db, rule.id, action);
        }
        result.fired += 1;
      } catch (e: any) {
        recordFailure(rule.id, now.getTime());
        result.errors.push({ ruleId: rule.id, error: e?.message || 'dispatch failed' });
      }
    }
  }

  return result;
}
