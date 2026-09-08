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

/** Segments a run can be in. Drives which branch steps fire. */
export type DripSegment = 'unassigned' | 'first-time' | 'investor' | 'non-opener' | 'applied';

export const DRIP_SEGMENTS: DripSegment[] = [
  'unassigned', 'first-time', 'investor', 'non-opener', 'applied',
];

export interface DripStep {
  templateId: string;              // must be an existing /email_templates doc owned by same user
  waitDaysAfterEnroll: number;     // 0 = fire immediately on enroll, 1+ = delay
  // Enabled per step so authors can pause one step without deleting.
  enabled?: boolean;
  /**
   * Branch gate. When present, this step only fires if the run's `segment` is
   * in the list; otherwise the runner skips it exactly like a disabled step.
   * Absent means the step fires for everyone, which is how every pre-existing
   * sequence behaves — this field is purely additive.
   *
   * A branching campaign is expressed as ONE sequence with the branch steps
   * interleaved in ascending waitDaysAfterEnroll order. Steps must stay sorted
   * by wait day, because the runner computes nextFireAt from the next step in
   * index order — an out-of-order wait day would fire immediately.
   *
   * Example: core emails 1-4 carry no gate; the core tail carries
   * ['unassigned'] so it stops once a lead branches; the first-time steps
   * carry ['first-time'], and so on.
   */
  requiresSegment?: DripSegment[];
  /** Author-facing label, e.g. 'Core · day 12' — shown in the editor only. */
  label?: string;
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
  /**
   * Day after enrollment at which a run that has never registered an open is
   * moved to the 'non-opener' branch. Null/absent disables the rule, which is
   * the behaviour of every sequence that predates it.
   */
  nonOpenerCheckDay?: number | null;

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

  // Steps that share a day are only a conflict when their segment gates can
  // BOTH match the same run. A branching sequence deliberately puts several
  // steps on one day — day 12 carries the core-tail step for unassigned runs
  // and the non-opener step for the rest — and those can never both fire.
  const segmentsOf = (s: any): Set<string> => {
    const list: string[] = Array.isArray(s.requiresSegment) && s.requiresSegment.length > 0
      ? s.requiresSegment
      : DRIP_SEGMENTS; // no gate = matches every segment
    return new Set(list);
  };
  const overlaps = (a: Set<string>, b: Set<string>) => {
    for (const v of a) if (b.has(v)) return true;
    return false;
  };

  const seen: Array<{ day: number; segs: Set<string>; index: number }> = [];
  let prevWait = -1;

  input.steps?.forEach((s, i) => {
    if (!s.templateId || typeof s.templateId !== 'string') errors.push(`Step ${i + 1}: choose a template.`);
    if (typeof s.waitDaysAfterEnroll !== 'number' || s.waitDaysAfterEnroll < 0) {
      errors.push(`Step ${i + 1}: wait days must be 0 or more.`);
    }
    if (s.waitDaysAfterEnroll > MAX_WAIT_DAYS) {
      errors.push(`Step ${i + 1}: wait > ${MAX_WAIT_DAYS} days.`);
    }

    // Order matters to the runner, not just to the reader: nextFireAt is
    // computed from the NEXT step in index order, so a step whose wait day is
    // lower than its predecessor's would resolve to a past date and fire
    // immediately after the one before it.
    if (typeof s.waitDaysAfterEnroll === 'number') {
      if (s.waitDaysAfterEnroll < prevWait) {
        errors.push(`Step ${i + 1}: day ${s.waitDaysAfterEnroll} comes after day ${prevWait}. Steps must be ordered by day.`);
      }
      prevWait = s.waitDaysAfterEnroll;
    }

    if (Array.isArray(s.requiresSegment)) {
      const bad = s.requiresSegment.filter((x: any) => !DRIP_SEGMENTS.includes(x));
      if (bad.length > 0) errors.push(`Step ${i + 1}: unknown segment ${bad.join(', ')}.`);
    }

    const mySegs = segmentsOf(s);
    const clash = seen.find((o) => o.day === s.waitDaysAfterEnroll && overlaps(o.segs, mySegs));
    if (clash) {
      errors.push(`Step ${i + 1}: step ${clash.index + 1} already fires on day ${s.waitDaysAfterEnroll} for the same segment. Space them out or narrow the segment gate.`);
    }
    seen.push({ day: s.waitDaysAfterEnroll, segs: mySegs, index: i });
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
  /**
   * Which branch this run is on. Set by /api/segment when the recipient picks
   * a buyer type, or forced to 'non-opener' by the runner when nothing has
   * been opened by the sequence's nonOpenerCheckDay.
   */
  segment?: DripSegment;
  segmentAssignedAt?: any;
  /** True once an open pixel for this run has been hit. Gates the non-opener branch. */
  openedAny?: boolean;
  firstOpenAt?: any;
  lastFiredAt?: any;
  lastFiredStepIndex?: number;
  fireHistory?: Array<{ stepIndex: number; templateId: string; firedAt: any; ok: boolean; error?: string }>;
}
