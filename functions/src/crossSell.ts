/* eslint-disable import/no-unresolved */
// Cross-sell flag lifecycle: escalation ladder + admin daily digest.
//
// The rules engine (see rules/engine.ts) fires the FIRST notification
// when a flag is created. These scheduled jobs handle the tail:
//
//   escalateStaleCrossSellFlags — runs hourly. Walks Open flags older
//     than 24h/72h/7d and bumps the escalation level:
//       Level 1 (24h+): re-notify owner ("still open — 24h ago you got
//                       the mortgage cross-sell for X. Any progress?")
//       Level 2 (72h+): notify all admins in-app (the ONE per-flag
//                       admin alert; after this it's digest-only)
//       Level 3 (7d+):  urgent-severity admin notification tagged
//                       'aging' so the daily digest surfaces it up top
//
//   crossSellDailyDigest — 8am America/Toronto. Emails admins the list
//     of all Open flags with age + owner. Cheap operational visibility
//     without paging any specific admin per-flag.
//
// Neither job creates a notification for the CLIENT — Offer Strategist
// was explicit that automated client-facing outreach on cross-sell
// destroys trust. Flags stay internal.

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// A flag becomes stale-owner-nudge after 24h without action.
// Admin escalation triggers at 72h. Urgent aging at 7d.
const ESCALATE_LEVELS: { level: 1 | 2 | 3; minAgeMs: number }[] = [
  { level: 1, minAgeMs: 24 * HOUR_MS },
  { level: 2, minAgeMs: 72 * HOUR_MS },
  { level: 3, minAgeMs:  7 * DAY_MS },
];

async function notifyAdmins(
  db: FirebaseFirestore.Firestore,
  title: string,
  body: string,
  severity: 'info' | 'warn' | 'urgent',
  link?: { referralId?: string; path?: string },
) {
  const admins = await db.collection('users').where('role', '==', 'admin').get();
  const batch = db.batch();
  admins.forEach(a => {
    const ref = db.collection('notifications').doc();
    batch.set(ref, {
      recipientUid: a.id,
      ruleId: 'cross-sell.admin-escalation',
      title,
      body,
      severity,
      link: link || null,
      read: false,
      dismissed: false,
      snoozedUntil: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  if (admins.size > 0) await batch.commit();
}

// ─── Escalation ladder ─────────────────────────────────────────────

export const escalateStaleCrossSellFlags = onSchedule(
  { schedule: 'every 60 minutes', timeZone: 'America/Toronto' },
  async () => {
    const db = admin.firestore();
    const now = Date.now();

    const openSnap = await db.collection('crossSellFlags')
      .where('status', '==', 'Open')
      .get();

    let bumped = 0;
    for (const doc of openSnap.docs) {
      const flag = doc.data();
      // flaggedAt is a Firestore Timestamp — handle both server-set
      // and (for the seed script) already-materialized Date values.
      const flaggedMs = typeof flag.flaggedAt?.toMillis === 'function'
        ? flag.flaggedAt.toMillis()
        : (typeof flag.flaggedAt === 'string' ? new Date(flag.flaggedAt).getTime() : 0);
      if (!flaggedMs) continue;
      const ageMs = now - flaggedMs;
      const currentLevel = Number(flag.lastEscalationLevel || 0);

      // Find the highest escalation level this flag has aged into
      // but hasn't been bumped to yet.
      let targetLevel: 1 | 2 | 3 | 0 = 0;
      for (const step of ESCALATE_LEVELS) {
        if (ageMs >= step.minAgeMs && step.level > currentLevel) targetLevel = step.level;
      }
      if (targetLevel === 0) continue;

      try {
        if (targetLevel === 1) {
          // Owner re-nudge.
          await db.collection('notifications').add({
            recipientUid: flag.ownerUid,
            ruleId: 'cross-sell.owner-24h-nudge',
            title: `Still open: mortgage cross-sell for ${flag.clientName}`,
            body: `Flagged 24h ago. Mark it Contacted, Converted, or Dismissed — the daily digest to admins goes out at 8am tomorrow if it's still Open.`,
            severity: 'warn',
            link: { referralId: flag.sourceReferralId },
            read: false,
            dismissed: false,
            snoozedUntil: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else if (targetLevel === 2) {
          // Admin one-time notification.
          await notifyAdmins(
            db,
            `Cross-sell flag stale >72h: ${flag.clientName}`,
            `Assigned to ${flag.ownerUid} and untouched for 3 days. ${flag.summary}`,
            'warn',
            { referralId: flag.sourceReferralId },
          );
        } else if (targetLevel === 3) {
          // Admin urgent aging notice.
          await notifyAdmins(
            db,
            `🚨 Cross-sell flag aging 7d+: ${flag.clientName}`,
            `Owner ${flag.ownerUid} has not actioned this. ${flag.summary}`,
            'urgent',
            { referralId: flag.sourceReferralId },
          );
        }

        await doc.ref.update({
          lastEscalationLevel: targetLevel,
          lastEscalatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        bumped += 1;
      } catch (e: any) {
        console.error('[escalateStaleCrossSellFlags] error on', doc.id, e?.message);
      }
    }

    if (bumped > 0) console.log(`[escalateStaleCrossSellFlags] escalated ${bumped}`);
  },
);

// ─── Admin daily digest ────────────────────────────────────────────

export const crossSellDailyDigest = onSchedule(
  { schedule: 'every day 08:00', timeZone: 'America/Toronto' },
  async () => {
    const db = admin.firestore();
    const openSnap = await db.collection('crossSellFlags')
      .where('status', '==', 'Open')
      .orderBy('flaggedAt', 'asc')
      .get();

    if (openSnap.empty) {
      console.log('[crossSellDailyDigest] no open flags — skipping email');
      return;
    }

    const flags = openSnap.docs.map(d => {
      const data = d.data();
      const flaggedMs = typeof data.flaggedAt?.toMillis === 'function'
        ? data.flaggedAt.toMillis()
        : (typeof data.flaggedAt === 'string' ? new Date(data.flaggedAt).getTime() : 0);
      const days = flaggedMs ? Math.floor((Date.now() - flaggedMs) / DAY_MS) : 0;
      return {
        id: d.id,
        clientName: data.clientName || 'Unknown',
        ownerUid: data.ownerUid,
        summary: data.summary || '',
        loanAmount: data.loanAmount || null,
        days,
      };
    });

    // Resolve owner names in one query so the digest reads well.
    const ownerUids = Array.from(new Set(flags.map(f => f.ownerUid).filter(Boolean)));
    const ownerNames: Record<string, string> = {};
    for (const uid of ownerUids) {
      try {
        const u = await db.collection('users').doc(uid).get();
        if (u.exists) {
          const d = u.data() || {};
          ownerNames[uid] = d.displayName || d.email || uid.slice(0, 8);
        }
      } catch { /* fall back to uid slice */ }
    }

    const rows = flags.map(f => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">${f.clientName}</td>
        <td style="padding: 10px 8px; color: #475569;">${ownerNames[f.ownerUid] || f.ownerUid.slice(0, 8)}</td>
        <td style="padding: 10px 8px; color: ${f.days >= 7 ? '#b91c1c' : f.days >= 3 ? '#c2410c' : '#475569'}; font-weight: 700;">${f.days}d open</td>
        <td style="padding: 10px 8px; color: #64748b; font-size: 12px;">${f.summary.slice(0, 80)}${f.summary.length > 80 ? '…' : ''}</td>
      </tr>`).join('');

    const admins = await db.collection('users').where('role', '==', 'admin').get();
    const adminEmails = admins.docs.map(a => a.data()?.email).filter((e: any) => typeof e === 'string');
    if (adminEmails.length === 0) {
      console.log('[crossSellDailyDigest] no admin emails on file — skipping');
      return;
    }

    await db.collection('mail').add({
      to: adminEmails,
      message: {
        subject: `📊 ${flags.length} cross-sell flag${flags.length === 1 ? '' : 's'} open`,
        html: `
          <div style="font-family: sans-serif; max-width: 720px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0f172a; margin-bottom: 4px;">Cross-Sell Digest — ${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto', month: 'long', day: 'numeric' })}</h2>
            <p style="color: #475569; font-size: 14px; margin-top: 0;">
              ${flags.length} open flag${flags.length === 1 ? '' : 's'} across the team. Owners have already been notified individually; this digest is your aggregate view.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Client</th>
                  <th style="padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Owner</th>
                  <th style="padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Age</th>
                  <th style="padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Note</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="margin: 24px 0;">
              <a href="https://indibrick.ca/partner?tab=cross-sell" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Cross-Sell Dashboard</a>
            </div>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 24px;">
              Dismiss a flag from the dashboard to teach the rules engine to fire less. Flags dismiss-rate above 30% over 14 days auto-disables the underlying rule.
            </p>
          </div>
        `,
      },
    });

    console.log(`[crossSellDailyDigest] emailed digest to ${adminEmails.length} admin(s), ${flags.length} flags`);
  },
);
