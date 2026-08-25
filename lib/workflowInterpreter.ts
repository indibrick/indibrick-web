// Next.js-side workflow interpreter.
//
// This is a duplicate of the interpretation logic that lives in
// functions/src/rules/workflowInterpreter.ts. Kept intentionally
// duplicated because the two projects have separate tsconfigs +
// separate build pipelines — a single shared module would require
// copy-out-on-build tooling that's more overhead than it's worth
// for ~150 lines of pure code.
//
// KEEP IN SYNC when you edit either side. This file is used for the
// dry-run endpoint (/api/partner/workflows/[id]/dry-run) so admins
// can preview a workflow's fire before saving. The functions-side
// copy runs the real onReferralWrite trigger.

export type TriggerType =
  | 'referral_created'
  | 'referral_status_changed'
  | 'referral_field_changed'
  | 'lead_tag_added'
  | 'cross_sell_flagged'
  | 'time_based';

export type ComparisonOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'greater_than' | 'less_than'
  | 'in' | 'not_in'
  | 'exists' | 'not_exists'
  | 'starts_with' | 'ends_with';

export interface WorkflowCondition {
  field: string;
  operator: ComparisonOperator;
  value?: any;
}

export type ActionType =
  | 'send_sms' | 'send_email' | 'create_task' | 'notify_user'
  | 'add_tag' | 'set_status' | 'webhook';

export interface WorkflowAction {
  type: ActionType;
  config: Record<string, any>;
}

export interface StoredWorkflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerType: TriggerType;
  triggerConfig?: Record<string, any>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  debounceMinutes?: number;
  dailyBucket?: boolean;
}

// Minimal ReferralDoc shape — only the fields the interpreter reads.
export type ReferralLike = Record<string, any> & { id: string };

// ─── Field access + condition eval ─────────────────────────────────

function getField(doc: ReferralLike | null, path: string): any {
  if (!doc || !path) return undefined;
  return path.split('.').reduce<any>((acc, key) => acc == null ? undefined : acc[key], doc);
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

function allConditionsMatch(doc: ReferralLike | null, conds: WorkflowCondition[]): boolean {
  if (!Array.isArray(conds) || conds.length === 0) return true;
  for (const c of conds) if (!compare(getField(doc, c.field), c.operator, c.value)) return false;
  return true;
}

// ─── Trigger evaluation ────────────────────────────────────────────

function triggerFires(wf: StoredWorkflow, before: ReferralLike | null, after: ReferralLike | null): boolean {
  const type = wf.triggerType;
  const cfg = wf.triggerConfig || {};
  if (type === 'referral_created') return before === null && after !== null;
  if (type === 'referral_status_changed') {
    if (!after) return false;
    if (before?.status === after.status) return false;
    if (cfg.toStatus && String(after.status) !== String(cfg.toStatus)) return false;
    if (cfg.fromStatus && String(before?.status) !== String(cfg.fromStatus)) return false;
    return true;
  }
  if (type === 'referral_field_changed') {
    if (!cfg.field) return false;
    return getField(before, cfg.field) !== getField(after, cfg.field);
  }
  if (type === 'lead_tag_added') {
    if (before?.leadTag === after?.leadTag) return false;
    if (!after?.leadTag) return false;
    if (cfg.tag && String(after.leadTag) !== String(cfg.tag)) return false;
    return true;
  }
  if (type === 'cross_sell_flagged') return !before?.crossSellFlagged && after?.crossSellFlagged === true;
  return false;
}

// ─── Template interpolation ────────────────────────────────────────

function interpolate(template: string, doc: ReferralLike | null): string {
  if (!template || !doc) return template || '';
  return template.replace(/\{\{([^}]+)\}\}/g, (_m, path) => {
    const v = getField(doc, String(path).trim());
    return v == null ? '' : String(v);
  });
}

// ─── Action projection — returns previews the dry-run UI can render ─

export interface ActionPreview {
  type: ActionType;
  summary: string;                 // one-line "what this would do"
  detail?: Record<string, any>;    // interpolated config for expansion
  supported: boolean;              // false = engine can't dispatch this yet
}

export function projectActions(wfActions: WorkflowAction[], referral: ReferralLike): ActionPreview[] {
  const out: ActionPreview[] = [];
  for (const raw of wfActions || []) {
    const c = raw.config || {};
    switch (raw.type) {
      case 'notify_user': {
        const recipient = c.recipientUid === '{{assignedAgentId}}'
          ? referral.assignedAgentId
          : (c.recipientUid || referral.assignedAgentId);
        const title = interpolate(String(c.title || 'Automation'), referral);
        out.push({
          type: raw.type,
          summary: `Notify ${recipient || '(no recipient)'} → "${title}"`,
          detail: { recipient, title, body: interpolate(String(c.body || ''), referral), severity: c.severity || 'info' },
          supported: true,
        });
        break;
      }
      case 'send_email': {
        const to = Array.isArray(c.to) ? c.to : [c.to || referral.clientEmail].filter(Boolean);
        out.push({
          type: raw.type,
          summary: `Email ${to.map((s: string) => interpolate(String(s), referral)).join(', ') || '(no recipient)'} → "${interpolate(String(c.subject || ''), referral)}"`,
          detail: {
            to: to.map((s: string) => interpolate(String(s), referral)),
            subject: interpolate(String(c.subject || ''), referral),
            html: interpolate(String(c.html || c.body || ''), referral),
          },
          supported: true,
        });
        break;
      }
      case 'create_task': {
        const assignee = c.assigneeId === '{{assignedAgentId}}' ? referral.assignedAgentId : (c.assigneeId || referral.assignedAgentId);
        const dueOffset = Number(c.dueOffsetDays || 0);
        const due = new Date(Date.now() + dueOffset * 86400_000).toISOString().slice(0, 10);
        out.push({
          type: raw.type,
          summary: `Create task on ${referral.id} for ${assignee || '(unset)'}, due ${due}`,
          detail: { assignee, dueDate: due, description: interpolate(String(c.description || ''), referral) },
          supported: true,
        });
        break;
      }
      case 'set_status':
        out.push({
          type: raw.type,
          summary: `Set status → "${interpolate(String(c.value || ''), referral)}"`,
          detail: { referralId: referral.id, value: interpolate(String(c.value || ''), referral) },
          supported: true,
        });
        break;
      case 'add_tag':
        out.push({
          type: raw.type,
          summary: `Apply lead tag → "${interpolate(String(c.value || ''), referral)}"`,
          detail: { referralId: referral.id, value: interpolate(String(c.value || ''), referral) },
          supported: true,
        });
        break;
      case 'webhook':
        out.push({
          type: raw.type,
          summary: `POST ${interpolate(String(c.url || ''), referral)}`,
          detail: { url: interpolate(String(c.url || ''), referral), method: c.method || 'POST' },
          supported: true,
        });
        break;
      case 'send_sms':
        out.push({
          type: raw.type,
          summary: `Send SMS (blocked: Twilio not configured)`,
          detail: c,
          supported: false,
        });
        break;
      default:
        out.push({ type: raw.type as ActionType, summary: `Unknown action "${raw.type}"`, supported: false });
    }
  }
  return out;
}

// ─── Public dry-run API ────────────────────────────────────────────

export interface DryRunResult {
  triggerFired: boolean;
  conditionsPassed: boolean;
  skippedReason?: string;
  actions: ActionPreview[];
  interpolatedFields: { before: ReferralLike | null; after: ReferralLike | null };
}

export function dryRunWorkflow(
  wf: StoredWorkflow,
  before: ReferralLike | null,
  after: ReferralLike,
): DryRunResult {
  const triggerFired = triggerFires(wf, before, after);
  if (!triggerFired) {
    return {
      triggerFired: false,
      conditionsPassed: false,
      skippedReason: 'Trigger did not match — the sample referral change wouldn\'t fire this workflow.',
      actions: [],
      interpolatedFields: { before, after },
    };
  }
  const conditionsPassed = allConditionsMatch(after, wf.conditions || []);
  if (!conditionsPassed) {
    return {
      triggerFired: true,
      conditionsPassed: false,
      skippedReason: 'One or more conditions failed on the sample referral.',
      actions: [],
      interpolatedFields: { before, after },
    };
  }
  return {
    triggerFired: true,
    conditionsPassed: true,
    actions: projectActions(wf.actions || [], after),
    interpolatedFields: { before, after },
  };
}
