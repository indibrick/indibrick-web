/* eslint-disable import/no-unresolved */
// Insurance-specific scheduled functions.
//
// insuranceRenewalReminders — 7am America/Toronto daily. Walks every
// referral with dealType=Insurance + insuranceRenewalDate within 120d
// and fires a notification to the assigned agent at the 120 / 60 / 30
// / 7-day thresholds. Idempotency via per-threshold marker stamped on
// the referral doc, so the same tier fires at most once per policy per
// renewal cycle.
//
// Deliberately NOT event-driven — renewal dates rarely change, so a
// nightly sweep is cheaper + more predictable than reacting to writes.

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const DAY_MS = 24 * 60 * 60 * 1000;

// Tiers of reminders keyed by days-out. Order matters: highest days
// first so we set the highest-applicable tier and skip the rest.
const REMINDER_TIERS: { days: number; severity: 'info' | 'warn' | 'urgent'; marker: string }[] = [
  { days: 120, severity: 'info',   marker: 'insuranceRenewalReminded120' },
  { days: 60,  severity: 'warn',   marker: 'insuranceRenewalReminded60' },
  { days: 30,  severity: 'warn',   marker: 'insuranceRenewalReminded30' },
  { days: 7,   severity: 'urgent', marker: 'insuranceRenewalReminded7' },
];

export const insuranceRenewalReminders = onSchedule(
  { schedule: 'every day 07:00', timeZone: 'America/Toronto' },
  async () => {
    const db = admin.firestore();
    const now = Date.now();

    // Query the widest window (120d) and filter tiers in memory. A
    // single indexed range query is cheaper than four separate range
    // queries + it lets us handle the "several tiers already fired,
    // fire the next one" case in one pass.
    const horizonIso = new Date(now + 120 * DAY_MS).toISOString();
    const snap = await db.collection('referrals')
      .where('dealType', '==', 'Insurance')
      .where('insuranceRenewalDate', '<=', horizonIso)
      .get();

    let fired = 0;
    for (const doc of snap.docs) {
      const data = doc.data() as any;
      const renewalIso = data.insuranceRenewalDate;
      if (!renewalIso) continue;
      const renewalMs = new Date(renewalIso).getTime();
      if (isNaN(renewalMs)) continue;
      const daysUntil = Math.floor((renewalMs - now) / DAY_MS);
      if (daysUntil < 0) continue;

      // Fire the SMALLEST applicable tier that hasn't fired yet, so we
      // escalate through 120 → 60 → 30 → 7 without spam.
      const applicableTiers = REMINDER_TIERS.filter(t => daysUntil <= t.days);
      if (applicableTiers.length === 0) continue;
      const nextTier = applicableTiers
        .sort((a, b) => a.days - b.days)
        .find(t => !data[t.marker]);
      if (!nextTier) continue;

      const recipient = data.assignedAgentId;
      if (!recipient || recipient === 'INSURANCE_INBOX' || recipient === 'ADMIN_INBOX') continue;

      try {
        await db.collection('notifications').add({
          ruleId: 'insurance.renewal-reminder',
          recipientUid: recipient,
          title: `Renewal in ${daysUntil}d: ${data.clientName || 'client'}${data.insuranceCarrier ? ` (${data.insuranceCarrier})` : ''}`,
          body: `${data.insuranceCoverageType || 'Insurance'} policy renews ${renewalIso.slice(0, 10)}. Confirm re-quote / re-bind / lapse.`,
          severity: nextTier.severity,
          link: { referralId: doc.id },
          read: false,
          dismissed: false,
          snoozedUntil: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Marker so the same tier doesn't fire again. _systemUpdate so
        // the rules engine ignores this write (safeguard 1).
        await doc.ref.update({
          [nextTier.marker]: new Date().toISOString(),
          _systemUpdate: true,
        });
        await doc.ref.update({ _systemUpdate: admin.firestore.FieldValue.delete() });
        fired += 1;
      } catch (e: any) {
        console.error('[insuranceRenewalReminders] error on', doc.id, e?.message);
      }
    }

    if (fired > 0) console.log(`[insuranceRenewalReminders] fired ${fired}`);
  },
);
