// Drip sequences — multi-step email/SMS follow-ups spread over time.
//
// Design choice for v1: LINEAR sequences only. Every step fires at a
// fixed number of days after enrollment (not "after previous step" —
// simpler math + easier to reason about when a step gets skipped).
// Branching / open-triggered variants require open tracking which
// we don't have yet; both come in a later wave.
//
// Example: renewal-nurture drip
//   day 0   → Welcome + rate snapshot (template A)
//   day 3   → Educational — mortgage renewal 101 (template B)
//   day 7   → Case study — client saved $X (template C)
//   day 14  → Call to action (template D)

export interface DripStep {
  templateId: string;              // must be an existing /email_templates doc owned by same user
  waitDaysAfterEnroll: number;     // 0 = fire immediately on enroll, 1+ = delay
  // Enabled per step so authors can pause one step without deleting.
  enabled?: boolean;
}

export interface DripSequenceDoc {
  id: string;
  name: string;                    // admin label
  description?: string;
  enabled: boolean;                // sequence-level kill switch
  ownerUid?: string;
  tenantId?: string;

  steps: DripStep[];

  // Enrollment behavior.
  respectSuppression: boolean;     // default true — always skip opted-out recipients
  stopIfReplies: boolean;          // future — needs inbound reply tracking; UI shows as coming-soon

  // Stats
  enrollmentCount?: number;        // total ever enrolled
  activeRuns?: number;             // currently in progress (updated by runner)
  completedRuns?: number;
  archivedAt?: string;

  createdAt?: any;
  updatedAt?: any;
}

const MAX_STEPS = 20;
const MAX_NAME = 120;
const MAX_WAIT_DAYS = 365;

export function validateDripSequence(input: Partial<DripSequenceDoc>): string[] {
  const errors: string[] = [];
  if (!input.name || String(input.name).trim().length === 0) errors.push('Name is required.');
  if (input.name && String(input.name).length > MAX_NAME) errors.push('Name too long.');
  if (!Array.isArray(input.steps) || input.steps.length === 0) errors.push('Add at least one step.');
  if (Array.isArray(input.steps) && input.steps.length > MAX_STEPS) errors.push(`Max ${MAX_STEPS} steps.`);

  const seenWaits: number[] = [];
  input.steps?.forEach((s, i) => {
    if (!s.templateId || typeof s.templateId !== 'string') errors.push(`Step ${i + 1}: choose a template.`);
    if (typeof s.waitDaysAfterEnroll !== 'number' || s.waitDaysAfterEnroll < 0) {
      errors.push(`Step ${i + 1}: wait days must be 0 or more.`);
    }
    if (s.waitDaysAfterEnroll > MAX_WAIT_DAYS) {
      errors.push(`Step ${i + 1}: wait > ${MAX_WAIT_DAYS} days.`);
    }
    if (seenWaits.includes(s.waitDaysAfterEnroll)) {
      // Not fatal but warn — two steps at day 3 means two emails same day.
      errors.push(`Step ${i + 1}: another step already fires on day ${s.waitDaysAfterEnroll}. Space them out or accept two same-day sends.`);
    }
    seenWaits.push(s.waitDaysAfterEnroll);
  });

  return errors;
}

// Per-recipient run state.
export type DripRunStatus = 'active' | 'completed' | 'cancelled' | 'suppressed';

export interface DripRunDoc {
  id: string;
  sequenceId: string;
  ownerUid: string;
  tenantId?: string;
  referralId: string;              // whose enrollment this is
  recipientEmail: string;          // frozen snapshot at enroll time
  status: DripRunStatus;
  currentStepIndex: number;        // 0-based; next step to fire
  nextFireAt: any;                 // Firestore Timestamp — runner picks these up
  enrolledAt: any;
  completedAt?: any;
  cancelledAt?: any;
  cancelReason?: string;
  totalSteps: number;              // frozen snapshot of sequence length at enroll
  lastFiredAt?: any;
  lastFiredStepIndex?: number;
  fireHistory?: Array<{ stepIndex: number; templateId: string; firedAt: any; ok: boolean; error?: string }>;
}
