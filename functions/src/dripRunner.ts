/* eslint-disable import/no-unresolved */
// Drip sequence runner — scheduled every 5 minutes.
//
// Walks /drip_runs where status='active' AND nextFireAt <= now,
// fires the current step's email (through the /mail collection, same
// as mass-send), then either advances the run or marks it completed.
//
// Guardrails:
//   - Sequence disabled → cancel every active run
//   - Recipient on suppression list → cancel with reason='suppressed'
//   - Template deleted / missing → skip step, log error to fireHistory
//   - Max 500 runs processed per invocation (Cloud Run function
//     timeout budget); the rest wait for the next tick
//
// Copies the CASL footer + List-Unsubscribe headers logic from
// mass-send. Keeping the compliance surface consistent across every
// outbound path — no shortcut for drips.

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

const MAX_RUNS_PER_TICK = 500;

// ─── Merge tags (dupe of lib/mergeTags.ts — see workflowInterpreter
//     comment about why the functions project can't easily import from lib/).
function interpolate(template: string, ctx: Record<string, any> | null): string {
  if (!template) return '';
  if (!ctx) return template;
  return template.replace(/\{\{([^}]+)\}\}/g, (_m, path) => {
    const value = String(path).trim().split('.').reduce<any>((acc, key) => {
      if (acc == null) return undefined;
      return acc[key];
    }, ctx);
    return value == null ? '' : String(value);
  });
}

// ─── Suppression list check (dupe of lib/suppression.ts).
function suppressionDocId(email: string, tenantId: string): string {
  const norm = String(email || '').trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(`${tenantId}::${norm}`).digest('hex').slice(0, 32);
  return `${tenantId}__${hash}`;
}
async function isSuppressed(db: FirebaseFirestore.Firestore, email: string, tenantId: string): Promise<boolean> {
  if (!email) return false;
  try {
    const snap = await db.collection('unsubscribes').doc(suppressionDocId(email, tenantId)).get();
    return snap.exists;
  } catch { return false; }
}

// ─── Unsub token (dupe of lib/unsubscribeToken.ts).
function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function signUnsubToken(email: string, tenantId: string, senderUid: string, ctx: string): string {
  const secret = process.env.UNSUBSCRIBE_SIGNING_SECRET || 'DEV_ONLY_INSECURE_UNSUB_SECRET';
  const payload = {
    email: String(email || '').trim().toLowerCase(),
    tenantId,
    senderUid,
    ctx,
    iat: Math.floor(Date.now() / 1000),
  };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(crypto.createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://indibrick.ca';
}

function caslFooter(senderName: string, senderEmail: string, brokerageName: string, unsubUrl: string): string {
  return `
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 12px;"/>
<div style="font-size:11px;color:#64748b;line-height:1.5;font-family:sans-serif;">
  <p style="margin:0 0 4px;"><strong>${senderName}</strong>${brokerageName ? ` &middot; ${brokerageName}` : ''}</p>
  <p style="margin:0 0 8px;">Ontario, Canada &middot; <a href="mailto:${senderEmail}" style="color:#64748b;">${senderEmail}</a></p>
  <p style="margin:0;">You're receiving this because you're enrolled in a drip sequence from ${brokerageName || senderName}. <a href="${unsubUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a></p>
</div>`.trim();
}

// ─── The runner ─────────────────────────────────────────────────────

export const dripRunner = onSchedule(
  { schedule: 'every 5 minutes', timeZone: 'America/Toronto' },
  async () => {
    const db = admin.firestore();
    const nowMs = Date.now();

    const dueSnap = await db.collection('drip_runs')
      .where('status', '==', 'active')
      .where('nextFireAt', '<=', new Date(nowMs))
      .orderBy('nextFireAt', 'asc')
      .limit(MAX_RUNS_PER_TICK)
      .get();

    if (dueSnap.empty) return;

    // Cache sequence + template lookups so a batch of 100 runs for the
    // same sequence doesn't do 100 redundant reads.
    const sequenceCache = new Map<string, any>();
    const templateCache = new Map<string, any>();
    const referralCache = new Map<string, any>();
    const senderCache = new Map<string, any>();

    let fired = 0;
    let completed = 0;
    let cancelled = 0;
    let errors = 0;

    for (const runDoc of dueSnap.docs) {
      const run = runDoc.data() as any;
      const runRef = runDoc.ref;

      try {
        // Load sequence.
        let seq = sequenceCache.get(run.sequenceId);
        if (!seq) {
          const s = await db.collection('drip_sequences').doc(run.sequenceId).get();
          if (!s.exists) {
            await runRef.update({ status: 'cancelled', cancelledAt: admin.firestore.FieldValue.serverTimestamp(), cancelReason: 'sequence deleted' });
            cancelled += 1;
            continue;
          }
          seq = s.data();
          sequenceCache.set(run.sequenceId, seq);
        }
        if (!seq.enabled) {
          await runRef.update({ status: 'cancelled', cancelledAt: admin.firestore.FieldValue.serverTimestamp(), cancelReason: 'sequence disabled' });
          cancelled += 1;
          continue;
        }

        const steps: any[] = Array.isArray(seq.steps) ? seq.steps : [];
        const stepIdx = Number(run.currentStepIndex || 0);
        if (stepIdx >= steps.length) {
          await runRef.update({ status: 'completed', completedAt: admin.firestore.FieldValue.serverTimestamp() });
          completed += 1;
          continue;
        }
        const step = steps[stepIdx];

        // Skip disabled steps by advancing without sending.
        if (step.enabled === false) {
          await advanceRun(db, runRef, run, stepIdx, steps, null);
          continue;
        }

        // ─── Non-opener branch assignment ──────────────────────────────
        // A run that has still registered no open by the sequence's check day
        // moves to the re-engagement branch, whatever segment it holds. A
        // buyer-type click the recipient never saw is not a signal, so this
        // deliberately overrides an existing segment — except 'applied',
        // which means they converted and must not be re-engaged.
        let segment: string = String(run.segment || 'unassigned');
        const checkDay = seq.nonOpenerCheckDay;
        if (
          typeof checkDay === 'number' &&
          segment !== 'non-opener' &&
          segment !== 'applied' &&
          run.openedAny !== true
        ) {
          const enrolledMs = run.enrolledAt?.toMillis?.() ?? 0;
          const daysSince = enrolledMs > 0 ? Math.floor((Date.now() - enrolledMs) / 86400_000) : 0;
          if (daysSince >= checkDay) {
            segment = 'non-opener';
            await runRef.update({
              segment: 'non-opener',
              segmentAssignedAt: admin.firestore.FieldValue.serverTimestamp(),
              segmentAssignedBy: 'runner:non-opener-rule',
            });
          }
        }

        // ─── Branch gate ───────────────────────────────────────────────
        // A step with requiresSegment only fires for runs on a matching
        // branch. Everything else advances without sending, exactly like a
        // disabled step. Steps with no gate fire for everyone, which is how
        // every sequence written before branching existed behaves.
        if (Array.isArray(step.requiresSegment) && step.requiresSegment.length > 0) {
          if (!step.requiresSegment.includes(segment)) {
            await advanceRun(db, runRef, run, stepIdx, steps, null);
            continue;
          }
        }

        // Suppression check per-fire (recipient may have opted out
        // AFTER enrollment).
        if (seq.respectSuppression !== false) {
          if (await isSuppressed(db, run.recipientEmail, run.tenantId || 'indibrick')) {
            await runRef.update({
              status: 'suppressed',
              cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
              cancelReason: 'recipient opted out',
            });
            cancelled += 1;
            continue;
          }
        }

        // Load template.
        let tmpl = templateCache.get(step.templateId);
        if (!tmpl) {
          const t = await db.collection('email_templates').doc(step.templateId).get();
          if (!t.exists) {
            // Skip this step, keep run alive on next step.
            await appendHistory(runRef, run, stepIdx, step.templateId, false, 'template deleted');
            await advanceRun(db, runRef, run, stepIdx, steps, 'template deleted');
            errors += 1;
            continue;
          }
          tmpl = t.data();
          templateCache.set(step.templateId, tmpl);
        }
        if (tmpl.channel !== 'email') {
          // SMS drip step — only supported once Twilio is live. Skip
          // for now, log to history, advance.
          await appendHistory(runRef, run, stepIdx, step.templateId, false, 'sms channel not yet dispatched by runner');
          await advanceRun(db, runRef, run, stepIdx, steps, 'sms skip');
          continue;
        }

        // Load referral (for merge-tag interpolation).
        let referral = referralCache.get(run.referralId);
        if (!referral) {
          const r = await db.collection('referrals').doc(run.referralId).get();
          if (!r.exists) {
            await runRef.update({ status: 'cancelled', cancelledAt: admin.firestore.FieldValue.serverTimestamp(), cancelReason: 'referral deleted' });
            cancelled += 1;
            continue;
          }
          referral = { id: r.id, ...r.data() };
          referralCache.set(run.referralId, referral);
        }

        // Load sender for CASL footer.
        let sender = senderCache.get(run.ownerUid);
        if (!sender) {
          const u = await db.collection('users').doc(run.ownerUid).get();
          sender = u.exists ? (u.data() || {}) : {};
          senderCache.set(run.ownerUid, sender);
        }
        // Prefer the saved sender identity; fall back to legacy user fields.
        const identity = (sender.senderIdentity || {}) as {
          displayName?: string; brokerageName?: string; fromEmail?: string;
          replyToEmail?: string; verifiedFromEmail?: boolean;
        };
        const senderName = identity.displayName || sender.displayName || sender.email || 'IndiBrick Partner';
        const brokerageName = identity.brokerageName || sender.brokerageName || '';
        const senderEmail = (identity.verifiedFromEmail && identity.fromEmail)
          ? identity.fromEmail
          : (sender.email || 'partner@indibrick.ca');
        const replyToAddr = identity.replyToEmail || sender.email || senderEmail;

        // Build unsub URL for this recipient + step.
        const unsubToken = signUnsubToken(
          run.recipientEmail,
          run.tenantId || 'indibrick',
          run.ownerUid,
          `drip:${run.sequenceId}:step${stepIdx}`,
        );
        const unsubUrl = `${siteOrigin()}/unsubscribe/${unsubToken}`;

        // Interpolate + enqueue.
        const subject = interpolate(String(tmpl.subject || ''), referral);
        // Open pixel, then the CASL footer. Ordering matters only for
        // aesthetics — both sit below the body.
        const pixel = `<img src="${siteOrigin()}/api/track/open?run=${encodeURIComponent(runDoc.id)}&s=${stepIdx}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`;
        const html = interpolate(String(tmpl.body || ''), referral)
          + pixel
          + caslFooter(senderName, senderEmail, brokerageName, unsubUrl);

        const fromLine = brokerageName ? `${senderName} — ${brokerageName}` : senderName;
        await db.collection('mail').add({
          to: [run.recipientEmail],
          ...(identity.verifiedFromEmail && identity.fromEmail
            ? { from: `${fromLine} <${identity.fromEmail}>` }
            : {}),
          replyTo: replyToAddr,
          message: {
            subject,
            html,
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>, <mailto:${senderEmail}?subject=Unsubscribe>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              'Reply-To': replyToAddr,
            },
          },
          _dripRunId: runDoc.id,
          _sequenceId: run.sequenceId,
          _stepIndex: stepIdx,
          _referralId: run.referralId,
          _sentAt: new Date().toISOString(),
        });

        // Record fire + advance.
        await appendHistory(runRef, run, stepIdx, step.templateId, true);
        await advanceRun(db, runRef, run, stepIdx, steps, null);
        fired += 1;
      } catch (e: any) {
        console.error('[dripRunner] error on run', runDoc.id, e?.message);
        errors += 1;
        // Keep the run active — next tick will retry. If it fails
        // repeatedly, a future iteration can add a failureCount +
        // cancel on ≥N.
      }
    }

    // Sequence-level stat rollups (best-effort).
    const bySeq = new Map<string, { c: number }>();
    for (const runDoc of dueSnap.docs) {
      const run = runDoc.data() as any;
      const key = run.sequenceId;
      const entry = bySeq.get(key) || { c: 0 };
      entry.c += 1;
      bySeq.set(key, entry);
    }

    console.log(`[dripRunner] fired ${fired}, completed ${completed}, cancelled ${cancelled}, errors ${errors} across ${dueSnap.size} due runs`);
  },
);

async function appendHistory(
  runRef: FirebaseFirestore.DocumentReference,
  _run: any,
  stepIdx: number,
  templateId: string,
  ok: boolean,
  error?: string,
) {
  const entry: Record<string, any> = { stepIndex: stepIdx, templateId, firedAt: new Date().toISOString(), ok };
  if (error) entry.error = error;
  await runRef.update({
    fireHistory: admin.firestore.FieldValue.arrayUnion(entry),
    lastFiredAt: admin.firestore.FieldValue.serverTimestamp(),
    lastFiredStepIndex: stepIdx,
  });
}

async function advanceRun(
  db: FirebaseFirestore.Firestore,
  runRef: FirebaseFirestore.DocumentReference,
  run: any,
  stepIdx: number,
  steps: any[],
  cancelReason: string | null,
) {
  const nextIdx = stepIdx + 1;
  if (nextIdx >= steps.length) {
    // Sequence complete.
    await runRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Sequence stat rollup.
    await db.collection('drip_sequences').doc(run.sequenceId).update({
      activeRuns: admin.firestore.FieldValue.increment(-1),
      completedRuns: admin.firestore.FieldValue.increment(1),
    });
    return;
  }
  const nextStep = steps[nextIdx];
  const enrolledAt = run.enrolledAt?.toMillis?.() ?? Date.now();
  const nextFireAt = new Date(enrolledAt + Number(nextStep.waitDaysAfterEnroll || 0) * 86400_000);
  await runRef.update({
    currentStepIndex: nextIdx,
    nextFireAt,
  });
}
