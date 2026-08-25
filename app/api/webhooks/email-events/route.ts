// ESP webhook receiver — normalizes provider payloads into the
// common /email_events shape and, for hard bounces + complaints,
// writes the recipient into /unsubscribes so drips + mass-sends stop
// mailing them.
//
// SECURITY: providers sign their webhooks — SendGrid uses an ECDSA
// signature header, Postmark uses HTTP Basic auth on the URL, SES
// uses SNS signatures, Mailgun uses HMAC-SHA256. Each adapter here
// MUST verify before writing. Adapters are stubbed until we've
// picked an ESP; a stubbed adapter refuses unauthenticated calls.
//
// This is intentionally a single endpoint — every provider POSTs
// here with a `?provider=` query param that names the adapter to
// run. Keeps the URL count sane and makes future migrations one-line
// switches on the wire.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { createHash } from 'crypto';
import type { EmailEventDoc, EmailEventType } from '@/lib/emailEventShape';
import { HARD_SUPPRESS_TYPES } from '@/lib/emailEventShape';

// Cap what we persist from provider payloads so an adversary can't
// pump 10MB blobs into every doc.
const MAX_RAW_BYTES = 8 * 1024;

interface NormalizedEvent {
  type: EmailEventType;
  email: string;
  providerMessageId?: string | null;
  reason?: string | null;
  smtpCode?: string | null;
  diagnosticCode?: string | null;
  eventAt: string;
  mailDocId?: string | null;
  batchId?: string | null;
  dripRunId?: string | null;
  sequenceId?: string | null;
  senderUid?: string | null;
}

// Provider adapter contract: verify + parse.
interface Adapter {
  name: EmailEventDoc['provider'];
  // Returns 401 message if signature check fails, or a normalized
  // event list on success. Returning [] is valid — some providers
  // send heartbeat / test pings.
  handle(req: NextRequest, rawBody: string): Promise<NormalizedEvent[] | { error: string; status: number }>;
}

// --- Adapters ---
// All ESP adapters are STUBS. Each returns 501 until we implement +
// verify. This keeps the endpoint safe to deploy before ESP selection.

const stubAdapter = (name: EmailEventDoc['provider']): Adapter => ({
  name,
  async handle() {
    return { error: `Adapter ${name} not yet configured — set the corresponding env vars + implement verification.`, status: 501 };
  },
});

const ADAPTERS: Record<string, Adapter> = {
  sendgrid: stubAdapter('sendgrid'),
  postmark: stubAdapter('postmark'),
  ses:      stubAdapter('ses'),
  mailgun:  stubAdapter('mailgun'),
  resend:   stubAdapter('resend'),
};

export async function POST(req: NextRequest) {
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const providerKey = String(searchParams.get('provider') || '').toLowerCase();
  const adapter = ADAPTERS[providerKey];
  if (!adapter) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });

  const rawBody = await req.text();
  const result = await adapter.handle(req, rawBody);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const receivedAt = new Date().toISOString();
  const rawTruncated = rawBody.length > MAX_RAW_BYTES
    ? rawBody.slice(0, MAX_RAW_BYTES) + '…[truncated]'
    : rawBody;

  const suppressWrites: Promise<any>[] = [];
  const eventWrites: Promise<any>[] = [];

  for (const evt of result) {
    const email = String(evt.email || '').trim().toLowerCase();
    if (!email) continue;

    const doc: EmailEventDoc = {
      type: evt.type,
      email,
      mailDocId: evt.mailDocId || null,
      batchId: evt.batchId || null,
      dripRunId: evt.dripRunId || null,
      sequenceId: evt.sequenceId || null,
      senderUid: evt.senderUid || null,
      provider: adapter.name,
      providerMessageId: evt.providerMessageId || null,
      reason: evt.reason || null,
      smtpCode: evt.smtpCode || null,
      diagnosticCode: evt.diagnosticCode || null,
      eventAt: evt.eventAt,
      receivedAt,
      raw: rawTruncated,
    };
    eventWrites.push(adminDb.collection('email_events').add(doc));

    if (HARD_SUPPRESS_TYPES.includes(evt.type)) {
      const hash = createHash('sha256').update(email).digest('hex');
      suppressWrites.push(
        adminDb.collection('unsubscribes').doc(hash).set({
          email,
          reason: evt.type === 'complaint' ? 'complaint' : 'hard-bounce',
          providerReason: evt.reason || null,
          senderUid: evt.senderUid || null,
          createdAt: receivedAt,
          source: 'esp-webhook',
        }, { merge: true })
      );
    }
  }

  await Promise.all([...eventWrites, ...suppressWrites]);
  return NextResponse.json({ ok: true, ingested: result.length });
}
