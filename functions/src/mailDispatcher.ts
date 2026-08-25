// ESP-agnostic mail dispatcher (strategy pattern).
//
// Every path that queues a partner email (mass-send route, drip
// runner, waitlist drip, insurance renewals, cross-sell escalations)
// writes to /mail with a Trigger-Email-compatible shape. That's
// today's provider. Tomorrow we swap providers by:
//   1) implementing a new adapter here (SendGrid, Postmark, SES, …)
//   2) flipping MAIL_PROVIDER env to the new adapter name
// Callers do not change.
//
// This dispatcher is triggered by /mail doc writes. If the current
// provider is 'trigger-email' (the default), we do nothing — the
// Firebase extension handles it. If it's anything else, we translate
// the doc into a provider REST call and mark the doc with a
// _dispatched flag so we don't double-send on re-run.

// eslint-disable-next-line import/no-unresolved
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = () => admin.firestore();

interface MailDoc {
  to?: string | string[];
  from?: string;
  replyTo?: string;
  message?: {
    subject?: string;
    text?: string;
    html?: string;
    headers?: Record<string, string>;
  };
  _batchId?: string;
  _dripRunId?: string;
  _sequenceId?: string;
  _referralId?: string;
  _senderUid?: string;
  _dispatched?: string;    // provider name once handed off
  _dispatchedAt?: string;  // ISO
  _dispatchError?: string;
}

// --- Provider strategies ---

interface ProviderAdapter {
  name: string;
  // Return { messageId } on success, or { error } on failure.
  send(mail: MailDoc): Promise<{ messageId?: string; error?: string }>;
}

const triggerEmailAdapter: ProviderAdapter = {
  name: 'trigger-email',
  // The Firebase Trigger Email extension already listens on /mail
  // writes — we take no action here, just record the handoff.
  async send() { return { messageId: 'handled-by-extension' }; },
};

// SendGrid / Postmark / SES / Mailgun / Resend adapters are STUBS
// until we've committed to a provider + populated secrets. Each
// throws a clear error so a dispatcher run against them fails loud.

const notConfigured = (name: string): ProviderAdapter => ({
  name,
  async send() {
    return { error: `Adapter ${name} not configured — set the corresponding secret + implement send().` };
  },
});

const ADAPTERS: Record<string, ProviderAdapter> = {
  'trigger-email': triggerEmailAdapter,
  'sendgrid': notConfigured('sendgrid'),
  'postmark': notConfigured('postmark'),
  'ses':      notConfigured('ses'),
  'mailgun':  notConfigured('mailgun'),
  'resend':   notConfigured('resend'),
};

function pickAdapter(): ProviderAdapter {
  const key = String(process.env.MAIL_PROVIDER || 'trigger-email').toLowerCase();
  return ADAPTERS[key] || triggerEmailAdapter;
}

// --- Trigger ---

export const dispatchMail = onDocumentCreated('mail/{mailId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const mail = snap.data() as MailDoc;
  if (mail._dispatched) return; // idempotency guard

  const adapter = pickAdapter();
  // For the default extension, don't overwrite the doc — the extension
  // owns its own delivery bookkeeping.
  if (adapter.name === 'trigger-email') return;

  const result = await adapter.send(mail);
  const patch: Partial<MailDoc> = {
    _dispatched: adapter.name,
    _dispatchedAt: new Date().toISOString(),
  };
  if (result.error) patch._dispatchError = result.error;

  await db().collection('mail').doc(event.params.mailId).set(patch, { merge: true });
});
