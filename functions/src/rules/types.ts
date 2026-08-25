// Rules engine type contracts.
//
// A Rule is a pure function of (before, after, context) → RuleResult[].
// Zero I/O inside the evaluator — the runner (onReferralWrite) collects
// the results, deduplicates via idempotency keys, and dispatches actions.
// This separation is what makes the rules unit-testable without touching
// Firestore.

export type ReferralDoc = {
  id: string;
  status?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  referrerId?: string;
  referrerName?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  participantIds?: string[];
  loanAmount?: number;
  expectedCommission?: number;
  callCount?: number;
  timeline?: any[];
  referralDate?: string;
  stageEnteredAt?: string;
  lastUpdated?: string;
  lastUpdatedBy?: string;
  leadTag?: string;
  dealCategory?: string;
  dealType?: 'Mortgage' | 'Real Estate' | 'Legal' | 'Insurance';
  crossSellFlagged?: boolean;
  pushedForMortgage?: boolean;
  // Insurance (Phase 5)
  insuranceCarrier?: string;
  insurancePolicyNumber?: string;
  insurancePremiumAnnual?: number;
  insuranceCoverageType?: 'Home' | 'Auto' | 'Life' | 'Disability' | 'Critical Illness' | 'Bundle';
  insuranceEffectiveDate?: string;
  insuranceRenewalDate?: string;
  insuranceBoundAt?: string;
  insuranceClaimedBy?: string;
  insuranceClaimedAt?: string;
  insuranceOpportunityFrom?: string; // referralId of the mortgage that spawned this opportunity
  _systemUpdate?: boolean;
  [k: string]: any;
};

export type RuleContext = {
  // Wall-clock evaluation time. Injected so tests can pin a moment.
  now: Date;
  // The uid of whoever caused the write. `null` = system (schedule / API /
  // migration). Used by the system-actor skip safeguard.
  actorUid: string | null;
  // Ontario holiday list — rules that surface partner-facing tasks
  // silently pass during off-hours + stat holidays.
  isBusinessHours: boolean;
};

export type CrossSellKind =
  | 'realtor-offer-to-mortgage'    // realtor Offer Made → mortgage cross-sell
  | 'mortgage-funded-to-insurance' // Phase 5: mortgage Funded → home insurance
  | 'mortgage-firm-to-realtor';    // future: mortgage pre-approval → realtor referral

export type NotificationAction =
  | {
      // The primary output — an in-app notification lands in the
      // recipient's inbox. The runner writes it to /notifications.
      kind: 'notify';
      recipientUid: string;
      title: string;
      body: string;
      // A pipeline deep-link, e.g. { referralId: '...' } — the inbox
      // renders it as "Open deal".
      link?: { referralId?: string; path?: string };
      severity: 'info' | 'warn' | 'urgent';
    }
  | {
      // Create a task on the assignee's calendar.
      kind: 'createTask';
      referralId: string;
      assigneeId: string;
      description: string;
      dueDate: string; // ISO date (YYYY-MM-DD)
    }
  | {
      // Enqueue an email through the Firebase Trigger Email extension.
      kind: 'email';
      to: string[];
      subject: string;
      html: string;
    }
  | {
      // Persistent cross-sell state — creates a /crossSellFlags doc
      // that the escalation ladder + admin dashboard track. Separate
      // from `notify` because the notification is one moment in time,
      // whereas the flag is a state machine that lives until the
      // owner closes it (Contacted/Converted/Dismissed).
      kind: 'flagCrossSell';
      sourceReferralId: string;
      ownerUid: string;
      crossSellKind: CrossSellKind;
      summary: string;
      // Snapshot of the source deal so admins can view flags without
      // joining back to /referrals. Denormalization is on purpose:
      // the dashboard renders 100+ flags at a time.
      clientName: string;
      loanAmount?: number;
    }
  | {
      // Create a NEW referral doc — the mortgage-funded-to-insurance
      // rule uses this to open an insurance opportunity for the pool
      // of insurance agents to claim. The new doc lands in the
      // /referrals collection with assignedAgentId = 'INSURANCE_INBOX'
      // and dealType = 'Insurance'; the insurance broadcast rule then
      // fires on its create and notifies all insurance agents.
      kind: 'createReferral';
      data: Partial<ReferralDoc>;
    }
  | {
      // Mutate a whitelisted field on the source referral (used by
      // user-authored workflows: set_status, add_tag). Kept narrow —
      // only these two fields to prevent workflow authors from re-
      // keying ownership or corrupting the doc through automations.
      kind: 'patchReferral';
      referralId: string;
      field: 'status' | 'leadTag';
      value: string;
    }
  | {
      // Fire an outbound HTTP webhook. The receiver gets the referral
      // snapshot as JSON and an optional signing header derived from
      // WEBHOOK_SIGNING_SECRET so they can verify us.
      kind: 'webhook';
      url: string;
      method?: 'POST' | 'PUT';
      payload: Record<string, any>;
    };

export type RuleFireResult = {
  // Stable per (rule × referral × trigger event). The runner writes this
  // to /rule_events so the same event never re-fires.
  idempotencyKey: string;
  // Minimum wait before this rule can fire again on the same referral.
  // Prevents thrashing on chatty status changes.
  debounceMs?: number;
  actions: NotificationAction[];
};

export interface Rule {
  id: string;                          // e.g. "stale.contacted"
  description: string;                 // Human-readable, shown in future UI
  enabled: boolean;                    // Kill switch (also read from /rule_config/{id})
  evaluate(
    before: ReferralDoc | null,        // null on create
    after: ReferralDoc | null,         // null on delete (unused today)
    ctx: RuleContext,
  ): RuleFireResult[] | null;
}
