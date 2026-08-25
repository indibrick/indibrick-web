// Mass send — the actual dispatch.
//
// - Rate-limited to 500 recipients per hour per sender via the
//   distributed limiter (Wave D). This is a hard ceiling that keeps
//   the platform under Gmail's complaint-rate threshold at scale.
// - CASL footer auto-appended to every outbound email (sender name +
//   business address + one-click unsub URL). Non-negotiable — CRTC
//   fines are per-message.
// - Writes an audit doc to /mass_send_batches for compliance history.
// - Enqueues each send into the /mail collection which the Firebase
//   Trigger Email extension picks up. SMS uses the existing sendSms()
//   helper; we DON'T call it here for the SMS path yet — that lands
//   when Twilio is live per pending-twilio-setup memory.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { interpolate } from '@/lib/mergeTags';
import { checkRateLimit, resetHeaderSeconds } from '@/lib/rateLimiter';
import { FUNDED_STATUSES, LOST_STATUSES } from '@/lib/crmHelpers';
import { recordUsage } from '@/lib/usage';
import { signUnsubToken } from '@/lib/unsubscribeToken';
import { filterOutSuppressed } from '@/lib/suppression';

const HOURLY_MAX = 500;
const HOURLY_WINDOW_MS = 60 * 60 * 1000;

// Absolute base for links baked into outbound email. NEXT_PUBLIC_SITE_URL
// falls back to the production host so a misconfigured env doesn't
// leak an internal preview URL into 500 client emails.
function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://indibrick.ca';
}

// CASL-compliant footer with a real one-click unsubscribe URL.
// The token is signed per recipient (see lib/unsubscribeToken.ts) so
// no per-send DB row is required — decoding the URL tells us the
// email + tenant + who sent it.
function caslFooter(opts: {
  senderName: string;
  senderEmail: string;
  brokerageName: string;
  unsubUrl: string;
}): string {
  const { senderName, senderEmail, brokerageName, unsubUrl } = opts;
  return `
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 12px;"/>
<div style="font-size:11px;color:#64748b;line-height:1.5;font-family:sans-serif;">
  <p style="margin:0 0 4px;"><strong>${senderName}</strong>${brokerageName ? ` &middot; ${brokerageName}` : ''}</p>
  <p style="margin:0 0 8px;">Ontario, Canada &middot; <a href="mailto:${senderEmail}" style="color:#64748b;">${senderEmail}</a></p>
  <p style="margin:0;">You're receiving this because you're a client, prospect, or referred contact of ${brokerageName || senderName}. <a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a></p>
</div>`.trim();
}

interface SendRequest {
  templateId: string;
  recipientFilter?: {
    assignedToMe?: boolean;
    status?: string;
    leadTag?: string;
    dealType?: string;
    ids?: string[];
    excludeFunded?: boolean;
    excludeLost?: boolean;
  };
  // Sender identity — surfaced in the CASL footer. Client is trusted to
  // pass their own name/brokerage; email is derived server-side from the
  // /users/{uid} doc.
  senderName?: string;
  brokerageName?: string;
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role, email } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  // Distributed rate limit — 500 recipients per hour per sender.
  const rate = await checkRateLimit({
    bucket: 'mass-send.recipients',
    key: uid,
    windowMs: HOURLY_WINDOW_MS,
    max: HOURLY_MAX,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Rate limit: ${HOURLY_MAX} recipients/hour. Try again in ${resetHeaderSeconds(rate)}s.` },
      { status: 429, headers: { 'Retry-After': String(resetHeaderSeconds(rate)) } },
    );
  }

  const body: SendRequest = await req.json().catch(() => ({} as any));
  const templateId = String(body?.templateId || '');
  if (!templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 });

  const tSnap = await adminDb.collection('email_templates').doc(templateId).get();
  if (!tSnap.exists) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  const tmpl = tSnap.data() || {};
  if (tmpl.ownerUid !== uid && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const channel: 'email' | 'sms' = tmpl.channel === 'sms' ? 'sms' : 'email';
  if (channel === 'sms') {
    return NextResponse.json({
      error: 'Mass SMS is available once Twilio is activated. See the deferred Twilio setup.',
    }, { status: 501 });
  }

  const filter = body.recipientFilter || {};

  // Resolve recipients server-side (never trust client filter enumeration).
  let query: FirebaseFirestore.Query = adminDb.collection('referrals');
  if (role !== 'admin' || filter.assignedToMe !== false) {
    query = query.where('assignedAgentId', '==', uid);
  }
  if (filter.status)   query = query.where('status', '==', filter.status);
  if (filter.leadTag)  query = query.where('leadTag', '==', filter.leadTag);
  if (filter.dealType) query = query.where('dealType', '==', filter.dealType);
  const snap = await query.limit(HOURLY_MAX * 5).get();
  let rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  if (filter.excludeFunded !== false) rows = rows.filter(r => !FUNDED_STATUSES.includes(r.status));
  if (filter.excludeLost !== false)   rows = rows.filter(r => !LOST_STATUSES.includes(r.status));
  rows = rows.filter(r => !!String(r.clientEmail || '').trim());
  if (Array.isArray(filter.ids) && filter.ids.length > 0) {
    const idSet = new Set(filter.ids);
    rows = rows.filter(r => idSet.has(r.id));
  }
  // Hard cap: 500 per send. Keeps a single click from blowing the hour.
  let recipients = rows.slice(0, HOURLY_MAX);

  // Suppression pre-check (Wave E-2): drop anyone on the /unsubscribes
  // list before we enqueue. Universal opt-outs — one recipient's
  // unsub applies to every sender in the tenant.
  const emails = recipients.map(r => String(r.clientEmail || '').trim().toLowerCase());
  const suppressed = await filterOutSuppressed(emails);
  const beforeSuppression = recipients.length;
  recipients = recipients.filter(r => !suppressed.has(String(r.clientEmail || '').trim().toLowerCase()));
  const suppressedSkipped = beforeSuppression - recipients.length;

  if (recipients.length === 0) {
    return NextResponse.json({
      error: suppressedSkipped > 0
        ? `All ${suppressedSkipped} recipients are on the suppression list.`
        : 'No recipients match the filter.',
    }, { status: 400 });
  }

  // Prefer the partner's saved sender identity over ad-hoc body fields.
  // Body values still win if explicitly passed (admin override / test send).
  const userSnap = await adminDb.collection('users').doc(uid).get();
  const userData = userSnap.exists ? (userSnap.data() || {}) : {};
  const identity = userData.senderIdentity || {};
  const senderName = String(
    body.senderName || identity.displayName || userData.displayName || email || 'IndiBrick Partner'
  ).slice(0, 120);
  const brokerageName = String(
    body.brokerageName || identity.brokerageName || ''
  ).slice(0, 120);
  // Verified custom From wins; otherwise fall back to the caller's account
  // email so replies still land somewhere useful.
  const senderEmailAddr = (identity.verifiedFromEmail && identity.fromEmail)
    ? String(identity.fromEmail)
    : (email || 'partner@indibrick.ca');
  const replyToAddr = String(identity.replyToEmail || email || senderEmailAddr);
  const origin = siteOrigin();

  // 1) Write the audit doc FIRST so we always have a record even if
  //    partial writes fail below.
  const batchDoc = {
    templateId,
    templateName: tmpl.name,
    channel,
    senderUid: uid,
    senderEmail: email,
    senderName,
    brokerageName,
    recipientCount: recipients.length,
    filter,
    status: 'dispatching',
    createdAt: FieldValue.serverTimestamp(),
  };
  const batchRef = await adminDb.collection('mass_send_batches').add(batchDoc);

  // 2) Enqueue each send in chunks of 400 (Firestore batched write cap).
  let queued = 0;
  let batchW = adminDb.batch();
  let batchCount = 0;
  const mailCol = adminDb.collection('mail');
  const nowIso = new Date().toISOString();

  for (const r of recipients) {
    const recipientEmail = String(r.clientEmail || '').trim().toLowerCase();
    // Per-recipient signed token. Decoding lets us record the opt-out
    // without any per-send DB row.
    const unsubToken = signUnsubToken({
      email: recipientEmail,
      tenantId: 'indibrick',
      senderUid: uid,
      ctx: `batch:${batchRef.id}`,
    });
    const unsubUrl = `${origin}/unsubscribe/${unsubToken}`;

    const subject = interpolate(String(tmpl.subject || ''), r);
    const bodyHtml = interpolate(String(tmpl.body || ''), r) + caslFooter({
      senderName, senderEmail: senderEmailAddr, brokerageName, unsubUrl,
    });

    const ref = mailCol.doc();
    // Sender identity gets baked into replyTo + a friendly From-name
    // ("Sarah — Sutton Group West Coast"). The Trigger Email
    // extension respects `from` when set; if verified is false we
    // still let the platform default win by omitting the address.
    const fromLine = brokerageName
      ? `${senderName} — ${brokerageName}`
      : senderName;
    const messageBase: Record<string, any> = {
      subject,
      html: bodyHtml,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>, <mailto:${senderEmailAddr}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Reply-To': replyToAddr,
      },
    };
    batchW.set(ref, {
      to: [r.clientEmail],
      // Only set `from` when the identity is verified — an unverified
      // domain in From triggers spam classification.
      ...(identity.verifiedFromEmail && identity.fromEmail
        ? { from: `${fromLine} <${identity.fromEmail}>` }
        : {}),
      replyTo: replyToAddr,
      message: messageBase,
      // Audit tracing back to the batch — the Trigger Email extension
      // ignores unknown fields, so this is safe.
      _batchId: batchRef.id,
      _referralId: r.id,
      _sentAt: nowIso,
    });
    batchCount += 1;
    queued += 1;
    if (batchCount >= 400) {
      await batchW.commit();
      batchW = adminDb.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batchW.commit();

  // 3) Update the batch doc + template usage.
  await batchRef.update({
    status: 'queued',
    queuedCount: queued,
    completedAt: FieldValue.serverTimestamp(),
  });
  await tSnap.ref.update({
    usageCount: FieldValue.increment(1),
    lastUsedAt: FieldValue.serverTimestamp(),
  });

  await recordUsage({ emailsSent: queued });

  // Stamp the suppressed count on the batch doc for audit.
  if (suppressedSkipped > 0) {
    await batchRef.update({ suppressedSkipped });
  }

  return NextResponse.json({
    success: true,
    batchId: batchRef.id,
    queued,
    suppressedSkipped,
    remainingThisHour: Math.max(0, HOURLY_MAX - rate.count - queued + 1),
  });
}
