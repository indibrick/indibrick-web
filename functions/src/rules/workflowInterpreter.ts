// User-authored workflow → runtime Rule interpreter.
//
// A stored workflow (see /workflows Firestore docs) is a JSON blob
// describing:
//   - trigger: WHEN the workflow evaluates (e.g. status changed to X)
//   - conditions: FILTERS that must all match (AND semantics)
//   - actions: SIDE EFFECTS to dispatch (send SMS/email, create task,
//              assign agent, add tag, set status, fire webhook)
//
// This module converts a stored workflow into the same Rule shape
// that code-defined rules use, so the engine's safeguards (idempotency,
// debounce, circuit breaker, field-diff gate, system-actor skip) all
// apply automatically.
//
// The interpreter is designed to be strict — malformed workflows
// evaluate to null (no fire) rather than throwing, and errors are
// captured so the admin UI can surface them.

import type { Rule, ReferralDoc, RuleContext, RuleFireResult, NotificationAction } from './types';

// ─── Stored workflow shape ─────────────────────────────────────────

export type TriggerType =
  | 'referral_created'         // new referral doc created
  | 'referral_status_changed'  // status field transition
  | 'referral_field_changed'   // any watched field changes
  | 'lead_tag_added'           // leadTag field goes from A → B
  | 'cross_sell_flagged'       // crossSellFlagged true→false-or-similar
  | 'time_based';              // scheduled — handled by a separate cron

export type ComparisonOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'greater_than' | 'less_than'
  | 'in' | 'not_in'
  | 'exists' | 'not_exists'
  | 'starts_with' | 'ends_with';

export interface WorkflowCondition {
  field: string;              // dot-path into the referral doc (e.g. 'dealType', 'loanAmount', 'clientPhone')
  operator: ComparisonOperator;
  value?: any;                // required for most operators; ignored for exists/not_exists
}

export type ActionType =
  | 'send_sms'
  | 'send_email'
  | 'create_task'
  | 'notify_user'
  | 'add_tag'
  | 'set_status'
  | 'webhook';

export interface WorkflowAction {
  type: ActionType;
  // Shape depends on type — validated at interpret time.
  config: Record<string, any>;
}

export interface StoredWorkflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  ownerUid?: string;
  tenantId?: string;

  triggerType: TriggerType;
  triggerConfig?: Record<string, any>;

  conditions: WorkflowCondition[];
  actions: WorkflowAction[];

  // Debounce/idempotency knobs the author can tune.
  debounceMinutes?: number;
  // Optional per-workflow evaluate-once-per-day gate (bucketed).
  dailyBucket?: boolean;

  createdAt?: any;
  updatedAt?: any;
}

// ─── Helpers ────────────────────────────────────────────────────────

function getField(doc: ReferralDoc | null, path: string): any {
  if (!doc || !path) return undefined;
  return path.split('.').reduce<any>((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, doc);
}

function compare(actual: any, op: ComparisonOperator, expected: any): boolean {
  switch (op) {
    case 'equals':       return actual === expected || String(actual) === String(expected);
    case 'not_equals':   return !(actual === expected || String(actual) === String(expected));
    case 'contains':
      if (typeof actual === 'string') return actual.toLowerCase().includes(String(expected).toLowerCase());
      if (Array.isArray(actual)) return actual.includes(expected);
      return false;
    case 'not_contains':
      if (typeof actual === 'string') return !actual.toLowerCase().includes(String(expected).toLowerCase());
      if (Array.isArray(actual)) return !actual.includes(expected);
      return true;
    case 'greater_than': return Number(actual) > Number(expected);
    case 'less_than':    return Number(actual) < Number(expected);
    case 'in':           return Array.isArray(expected) && expected.some(v => v === actual || String(v) === String(actual));
    case 'not_in':       return !Array.isArray(expected) || !expected.some(v => v === actual || String(v) === String(actual));
    case 'exists':       return actual !== undefined && actual !== null && actual !== '';
    case 'not_exists':   return actual === undefined || actual === null || actual === '';
    case 'starts_with':  return typeof actual === 'string' && actual.toLowerCase().startsWith(String(expected).toLowerCase());
    case 'ends_with':    return typeof actual === 'string' && actual.toLowerCase().endsWith(String(expected).toLowerCase());
    default:             return false;
  }
}

function allConditionsMatch(doc: ReferralDoc | null, conds: WorkflowCondition[]): boolean {
  if (!Array.isArray(conds) || conds.length === 0) return true;
  for (const c of conds) {
    const actual = getField(doc, c.field);
    if (!compare(actual, c.operator, c.value)) return false;
  }
  return true;
}

// Trigger evaluation: given before/after docs, return true if this
// trigger fires now.
function triggerFires(wf: StoredWorkflow, before: ReferralDoc | null, after: ReferralDoc | null): boolean {
  const type = wf.triggerType;
  const config = wf.triggerConfig || {};

  if (type === 'referral_created') {
    return before === null && after !== null;
  }

  if (type === 'referral_status_changed') {
    if (!after) return false;
    const beforeStatus = before?.status;
    const afterStatus = after.status;
    if (beforeStatus === afterStatus) return false;
    // Optional filter: to_status = "Funded" only fires when transitioning INTO that value
    const toStatus = config.toStatus;
    const fromStatus = config.fromStatus;
    if (toStatus && String(afterStatus) !== String(toStatus)) return false;
    if (fromStatus && String(beforeStatus) !== String(fromStatus)) return false;
    return true;
  }

  if (type === 'referral_field_changed') {
    const field = config.field;
    if (!field) return false;
    const b = getField(before, field);
    const a = getField(after, field);
    return b !== a;
  }

  if (type === 'lead_tag_added') {
    const b = before?.leadTag;
    const a = after?.leadTag;
    if (b === a) return false;
    if (!a) return false;
    // Optional exact tag match
    const tag = config.tag;
    if (tag && String(a) !== String(tag)) return false;
    return true;
  }

  if (type === 'cross_sell_flagged') {
    return !before?.crossSellFlagged && after?.crossSellFlagged === true;
  }

  // time_based is not a write-triggered rule; a scheduled function
  // evaluates those independently. Returning false here lets the
  // interpreter still validate the shape for the editor UI.
  return false;
}

// Template interpolation: replace {{field.path}} in a string with the
// referral's field values. Undefined resolves to empty string.
function interpolate(template: string, doc: ReferralDoc | null): string {
  if (!template || !doc) return template || '';
  return template.replace(/\{\{([^}]+)\}\}/g, (_m, path) => {
    const v = getField(doc, String(path).trim());
    return v == null ? '' : String(v);
  });
}

// ─── Action translation ────────────────────────────────────────────
// Convert a stored WorkflowAction into one or more engine
// NotificationActions. Some workflow actions (send_email) map onto the
// engine's email action; others (set_status) don't have a
// direct engine-side dispatcher yet — we log a warning and skip in
// v1. Wave 2 follow-ups will extend the engine dispatcher for the rest.

interface TranslatedActions {
  actions: NotificationAction[];
  unsupported: string[];
}

function translateActions(wfActions: WorkflowAction[], referral: ReferralDoc): TranslatedActions {
  const out: NotificationAction[] = [];
  const unsupported: string[] = [];

  for (const raw of wfActions) {
    if (!raw || typeof raw !== 'object') continue;
    const config = raw.config || {};

    switch (raw.type) {
      case 'notify_user': {
        const recipient = config.recipientUid === '{{assignedAgentId}}'
          ? referral.assignedAgentId
          : (config.recipientUid || referral.assignedAgentId);
        if (!recipient) break;
        out.push({
          kind: 'notify',
          recipientUid: String(recipient),
          title: interpolate(String(config.title || 'Automation'), referral),
          body: interpolate(String(config.body || ''), referral),
          link: { referralId: referral.id },
          severity: (config.severity === 'urgent' || config.severity === 'warn' || config.severity === 'info') ? config.severity : 'info',
        });
        break;
      }
      case 'send_email': {
        const to = Array.isArray(config.to) ? config.to : [config.to || referral.clientEmail].filter(Boolean);
        if (to.length === 0) break;
        out.push({
          kind: 'email',
          to: to.map((s: string) => interpolate(String(s), referral)),
          subject: interpolate(String(config.subject || ''), referral),
          html: interpolate(String(config.html || config.body || ''), referral),
        });
        break;
      }
      case 'create_task': {
        const assignee = config.assigneeId === '{{assignedAgentId}}'
          ? referral.assignedAgentId
          : (config.assigneeId || referral.assignedAgentId);
        if (!assignee) break;
        const dueOffsetDays = Number(config.dueOffsetDays || 0);
        const due = new Date(Date.now() + dueOffsetDays * 86400_000).toISOString().slice(0, 10);
        out.push({
          kind: 'createTask',
          referralId: referral.id,
          assigneeId: String(assignee),
          description: interpolate(String(config.description || 'Automated task'), referral),
          dueDate: due,
        });
        break;
      }
      case 'set_status': {
        const value = String(config.value || '').trim();
        if (!value) break;
        out.push({
          kind: 'patchReferral',
          referralId: referral.id,
          field: 'status',
          value: interpolate(value, referral),
        });
        break;
      }
      case 'add_tag': {
        const value = String(config.value || '').trim();
        if (!value) break;
        out.push({
          kind: 'patchReferral',
          referralId: referral.id,
          field: 'leadTag',
          value: interpolate(value, referral),
        });
        break;
      }
      case 'webhook': {
        const url = String(config.url || '').trim();
        if (!url || !/^https?:\/\//i.test(url)) break;
        // Default payload: the entire referral snapshot. Authors can
        // override with a custom payload object; all string values
        // get template-interpolated.
        const rawPayload = (config.payload && typeof config.payload === 'object')
          ? config.payload
          : { referral };
        const payload: Record<string, any> = {};
        for (const [k, v] of Object.entries(rawPayload)) {
          payload[k] = typeof v === 'string' ? interpolate(v, referral) : v;
        }
        payload._meta = {
          referralId: referral.id,
          workflowFiredAt: new Date().toISOString(),
        };
        out.push({
          kind: 'webhook',
          url: interpolate(url, referral),
          method: config.method === 'PUT' ? 'PUT' : 'POST',
          payload,
        });
        break;
      }

      // Actions not yet wired — surface for the UI but don't produce
      // an engine action. Only send_sms remains (blocked on Twilio go-
      // live; the dispatcher exists in /api/partner/messages but the
      // rules engine doesn't call authenticated HTTP endpoints today).
      case 'send_sms':
        unsupported.push(raw.type);
        break;
      default:
        unsupported.push(String(raw.type || 'unknown'));
    }
  }

  return { actions: out, unsupported };
}

// ─── Main interpreter ──────────────────────────────────────────────
// Convert a stored workflow into a Rule the engine can evaluate.

export function interpretWorkflow(wf: StoredWorkflow): Rule {
  const id = `workflow:${wf.id}`;
  return {
    id,
    description: wf.name || wf.description || 'User-authored workflow',
    enabled: wf.enabled === true,
    evaluate(before, after, ctx: RuleContext): RuleFireResult[] | null {
      if (!after) return null;
      // 1. Trigger check.
      if (!triggerFires(wf, before, after)) return null;
      // 2. Condition check.
      if (!allConditionsMatch(after, wf.conditions || [])) return null;
      // 3. Translate actions.
      const { actions } = translateActions(wf.actions || [], after);
      if (actions.length === 0) return null;

      // 4. Idempotency key: workflow id + referral id + optional daily bucket.
      const dayBucket = wf.dailyBucket ? `:${ctx.now.toISOString().slice(0, 10)}` : '';
      const idempotencyKey = `${id}:${after.id}${dayBucket}`;
      const debounceMs = (wf.debounceMinutes ?? 0) * 60_000;

      return [{
        idempotencyKey,
        debounceMs: debounceMs > 0 ? debounceMs : undefined,
        actions,
      }];
    },
  };
}
