// Localhost helper: writes 4 sample notifications directly to Firestore
// so you can verify the InAppInbox UI without deploying Cloud Functions.
//
// Cloud Functions don't run on `next dev` — the rules engine only fires
// against real Firebase infrastructure. Until you deploy, use this
// script to populate /notifications with realistic rows and click
// through the bell.
//
// USAGE
//   FIREBASE_CLIENT_EMAIL=… FIREBASE_PRIVATE_KEY=… \
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID=indibrick-web \
//   RECIPIENT_UID=<your-firebase-auth-uid> \
//   npx tsx scripts/seedSampleNotifications.ts
//
// If tsx isn't installed:  npm i -D tsx
//
// The script uses the same firebase-admin credentials as the Next API
// routes, so if your .env.local works for /api/partner/*, it works here.

import { adminDb } from '../lib/firebaseAdmin';

async function main() {
  const recipient = process.env.RECIPIENT_UID;
  if (!recipient) {
    console.error('❌ Set RECIPIENT_UID=<your uid> before running.');
    process.exit(1);
  }
  if (!adminDb) {
    console.error('❌ adminDb is null — check FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.');
    process.exit(1);
  }

  const now = new Date();
  const samples = [
    {
      ruleId: 'sla.call-first-touch',
      title: '🚨 Ayesha Khan still uncalled at 6h',
      body: 'Received 6h ago. Every hour past 2h halves your conversion odds.',
      severity: 'urgent',
      minutesAgo: 5,
    },
    {
      ruleId: 'stale.by-stage',
      title: 'Marcus Chen has stalled',
      body: '9 days idle in "Contacted". Threshold for this stage is 7 days.',
      severity: 'warn',
      minutesAgo: 45,
    },
    {
      ruleId: 'cross-sell.realtor-offer-made',
      title: 'Mortgage cross-sell opportunity: Priya Patel',
      body: 'Offer accepted on a real estate deal without a linked mortgage. Reach out same-day — this is the highest-converting cross-sell (~25-40%).',
      severity: 'warn',
      minutesAgo: 180,
    },
    {
      ruleId: 'sla.call-first-touch',
      title: 'Speed-to-lead: call David Wong soon',
      body: 'Received 3h ago. Every hour past 2h halves your conversion odds.',
      severity: 'info',
      minutesAgo: 240,
    },
  ];

  const batch = adminDb.batch();
  const col = adminDb.collection('notifications');
  for (const s of samples) {
    const ref = col.doc();
    const createdAt = new Date(now.getTime() - s.minutesAgo * 60_000);
    batch.set(ref, {
      recipientUid: recipient,
      ruleId: s.ruleId,
      title: s.title,
      body: s.body,
      severity: s.severity,
      link: null, // set to { referralId: '<real-id>' } if you want the "Open deal" button
      read: false,
      dismissed: false,
      snoozedUntil: null,
      createdAt,
    });
  }
  await batch.commit();
  console.log(`✅ Seeded ${samples.length} notifications for uid=${recipient}`);
  console.log('   Open /partner → click the bell in the header.');
}

main().catch(e => { console.error(e); process.exit(1); });
