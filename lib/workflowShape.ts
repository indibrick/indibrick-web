// Shared workflow shape + validators used by both the API route
// (server-side create/update) and the client-side editor UI to keep
// the trigger/condition/action taxonomies in sync.
//
// This file is the SOURCE OF TRUTH for what triggers, operators, and
// actions a user can pick from. The interpreter in
// functions/src/rules/workflowInterpreter.ts uses the same string
// values — if you add a new type here, extend the interpreter too.

export const TRIGGER_TYPES = [
  { value: 'referral_created',        label: 'A new deal is created' },
  { value: 'referral_status_changed', label: 'A deal status changes' },
  { value: 'referral_field_changed',  label: 'A specific field changes' },
  { value: 'lead_tag_added',          label: 'A lead tag is added' },
  { value: 'cross_sell_flagged',      label: 'A deal is flagged for cross-sell' },
] as const;

export type TriggerTypeValue = typeof TRIGGER_TYPES[number]['value'];

export const COMPARISON_OPERATORS = [
  { value: 'equals',       label: 'equals' },
  { value: 'not_equals',   label: 'does not equal' },
  { value: 'contains',     label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than',    label: 'is less than' },
  { value: 'in',           label: 'is one of' },
  { value: 'not_in',       label: 'is not one of' },
  { value: 'exists',       label: 'is set' },
  { value: 'not_exists',   label: 'is not set' },
  { value: 'starts_with',  label: 'starts with' },
  { value: 'ends_with',    label: 'ends with' },
] as const;

export type ComparisonOperatorValue = typeof COMPARISON_OPERATORS[number]['value'];

export const CONDITION_FIELDS = [
  { value: 'status',                label: 'Deal status' },
  { value: 'dealType',              label: 'Deal type' },
  { value: 'leadTag',               label: 'Lead tag' },
  { value: 'assignedAgentId',       label: 'Assigned agent (uid)' },
  { value: 'loanAmount',            label: 'Loan amount' },
  { value: 'expectedCommission',    label: 'Expected commission' },
  { value: 'clientEmail',           label: 'Client email' },
  { value: 'clientPhone',           label: 'Client phone' },
  { value: 'callCount',             label: 'Call count' },
  { value: 'insuranceCoverageType', label: 'Insurance coverage type' },
  { value: 'insuranceCarrier',      label: 'Insurance carrier' },
  { value: 'insurancePremiumAnnual',label: 'Insurance annual premium' },
] as const;

// Actions supported by the interpreter today. Only send_sms is blocked
// (needs Twilio go-live); everything else is wired to a dispatcher.
export const ACTION_TYPES = [
  { value: 'notify_user',  label: 'Send in-app notification',   supported: true },
  { value: 'send_email',   label: 'Send email',                 supported: true },
  { value: 'create_task',  label: 'Create a task',              supported: true },
  { value: 'set_status',   label: 'Change deal status',         supported: true },
  { value: 'add_tag',      label: 'Add a lead tag',             supported: true },
  { value: 'webhook',      label: 'Fire outbound webhook',      supported: true },
  { value: 'send_sms',     label: 'Send SMS (pending Twilio)',  supported: false },
] as const;

export type ActionTypeValue = typeof ACTION_TYPES[number]['value'];

// ─── Validation ─────────────────────────────────────────────────────
// Returns [] when the workflow shape is fine, or a list of human-
// readable errors. Used by /api/partner/workflows before persisting
// and echoed in the editor UI on save.

const TRIGGER_VALUES = new Set(TRIGGER_TYPES.map(t => t.value));
const OPERATOR_VALUES = new Set(COMPARISON_OPERATORS.map(o => o.value));
const ACTION_VALUES = new Set(ACTION_TYPES.map(a => a.value));

export interface WorkflowInput {
  name?: string;
  description?: string;
  enabled?: boolean;
  triggerType?: string;
  triggerConfig?: Record<string, any>;
  conditions?: Array<{ field?: string; operator?: string; value?: any }>;
  actions?: Array<{ type?: string; config?: Record<string, any> }>;
  debounceMinutes?: number;
  dailyBucket?: boolean;
}

export function validateWorkflow(input: WorkflowInput): string[] {
  const errors: string[] = [];

  if (!input.name || String(input.name).trim().length === 0) {
    errors.push('Workflow name is required.');
  }
  if (input.name && String(input.name).length > 120) {
    errors.push('Name is too long (max 120 chars).');
  }
  if (!input.triggerType || !TRIGGER_VALUES.has(input.triggerType)) {
    errors.push('Choose a valid trigger.');
  }
  if (input.triggerType === 'referral_field_changed' && !input.triggerConfig?.field) {
    errors.push('The "specific field changes" trigger needs a field name.');
  }
  if (input.triggerType === 'referral_status_changed' && !input.triggerConfig?.toStatus && !input.triggerConfig?.fromStatus) {
    // Not fatal — the trigger fires on any status change, but warn.
  }

  if (Array.isArray(input.conditions)) {
    input.conditions.forEach((c, i) => {
      if (!c.field) errors.push(`Condition ${i + 1}: field is required.`);
      if (!c.operator || !OPERATOR_VALUES.has(c.operator)) {
        errors.push(`Condition ${i + 1}: operator is required.`);
      }
      if (c.operator && !['exists', 'not_exists'].includes(c.operator) && (c.value === undefined || c.value === '')) {
        errors.push(`Condition ${i + 1}: value is required for this operator.`);
      }
    });
  }

  if (!Array.isArray(input.actions) || input.actions.length === 0) {
    errors.push('Add at least one action.');
  } else {
    input.actions.forEach((a, i) => {
      if (!a.type || !ACTION_VALUES.has(a.type)) {
        errors.push(`Action ${i + 1}: choose an action type.`);
      }
      const meta = ACTION_TYPES.find(t => t.value === a.type);
      if (meta && !meta.supported) {
        errors.push(`Action ${i + 1}: "${meta.label}" isn't wired to the engine yet — pick a supported action.`);
      }
      if (a.type === 'notify_user' && !a.config?.title) {
        errors.push(`Action ${i + 1}: notification needs a title.`);
      }
      if (a.type === 'send_email' && !a.config?.subject) {
        errors.push(`Action ${i + 1}: email needs a subject.`);
      }
      if (a.type === 'create_task' && !a.config?.description) {
        errors.push(`Action ${i + 1}: task needs a description.`);
      }
      if (a.type === 'set_status' && !a.config?.value) {
        errors.push(`Action ${i + 1}: choose a status to move the deal to.`);
      }
      if (a.type === 'add_tag' && !a.config?.value) {
        errors.push(`Action ${i + 1}: enter the tag to apply.`);
      }
      if (a.type === 'webhook') {
        const url = String(a.config?.url || '');
        if (!/^https?:\/\/.+/i.test(url)) errors.push(`Action ${i + 1}: webhook needs a full https:// URL.`);
      }
    });
  }

  return errors;
}
