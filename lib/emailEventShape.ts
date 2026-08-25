// Provider-agnostic email event shape stored in /email_events.
//
// Every deliverability signal we receive from an ESP (SendGrid,
// Postmark, SES, Mailgun, Resend — whichever we end up on) collapses
// into ONE of these events with a common shape. Downstream code
// (suppression writer, drip auto-pause, reports) only reads this
// shape and never touches provider-specific payloads.

export type EmailEventType =
  | 'delivered'
  | 'open'         // pixel open — increasingly meaningless post Apple MPP
  | 'click'
  | 'bounce'       // hard bounce — auto-suppress
  | 'soft_bounce'  // mailbox full / temporary — do NOT auto-suppress
  | 'complaint'    // FBL / spam-mark — auto-suppress + alarm
  | 'unsubscribe'  // gesture from ESP's own unsub link (rare — we use our own)
  | 'deferred'     // in ESP retry queue
  | 'dropped';     // ESP refused to send (usually a suppression rule)

export interface EmailEventDoc {
  type: EmailEventType;

  // Recipient email — lowercased. Indexed for suppression lookups.
  email: string;

  // Which mail doc / batch / drip run this originated from. Any/all
  // may be null depending on how the mail was queued.
  mailDocId?: string | null;
  batchId?: string | null;
  dripRunId?: string | null;
  sequenceId?: string | null;
  senderUid?: string | null;

  // Provider that sent us this event.
  provider: 'trigger-email' | 'sendgrid' | 'postmark' | 'ses' | 'mailgun' | 'resend' | 'unknown';
  providerMessageId?: string | null;

  // Bounce/complaint details when applicable.
  reason?: string | null;         // provider-supplied human reason
  smtpCode?: string | null;       // e.g. "550 5.1.1"
  diagnosticCode?: string | null; // full SMTP diagnostic

  // Timestamps.
  eventAt: string;    // ISO — when the event happened at the provider
  receivedAt: string; // ISO — when we ingested it

  // Raw provider payload, capped in size at the writer.
  raw?: any;
}

export const HARD_SUPPRESS_TYPES: EmailEventType[] = ['bounce', 'complaint'];
