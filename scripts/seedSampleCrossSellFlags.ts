// Localhost helper: writes 4 sample cross-sell flags to Firestore so
// you can verify the CrossSellPanel UI without deploying Cloud
// Functions.
//
// USAGE
//   FIREBASE_CLIENT_EMAIL=… FIREBASE_PRIVATE_KEY=… \
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID=indibrick-web \
//   OWNER_UID=<the-broker-uid> \
//   npx tsx scripts/seedSampleCrossSellFlags.ts
//
// If you're admin, use YOUR uid for OWNER_UID — the admin view shows
// all Open/Contacted flags regardless of ownership, and the owner
// action buttons only appear if you own the flag.

import { adminDb } from '../lib/firebaseAdmin';

async function main() {
  const owner = process.env.OWNER_UID;
  if (!owner) {
    console.error('❌ Set OWNER_UID=<your uid> before running.');
    process.exit(1);
  }
  if (!adminDb) {
    console.error('❌ adminDb is null — check FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.');
    process.exit(1);
  }

  const now = new Date();
  const samples = [
    {
      clientName: 'Ayesha Khan',
      summary: 'Offer accepted on a real estate deal without a linked mortgage. Reach out same-day — this is the highest-converting cross-sell (~25-40%).',
      loanAmount: 720_000,
      status: 'Open',
      daysAgo: 0,
      lastEscalationLevel: 0,
    },
    {
      clientName: 'Marcus Chen',
      summary: 'Realtor deal at Firm Sale. Client mentioned they might refinance instead of purchase-money mortgage.',
      loanAmount: 580_000,
      status: 'Open',
      daysAgo: 2,
      lastEscalationLevel: 1, // 24h+ nudge already fired
    },
    {
      clientName: 'Priya Patel',
      summary: 'Client already has pre-approval elsewhere per broker note. Considering rate-shop.',
      loanAmount: 445_000,
      status: 'Contacted',
      daysAgo: 5,
      contactedDaysAgo: 3,
      actionNote: 'Called Priya — she is comparing us against Scotia. Sending our offer sheet by Tue.',
    },
    {
      clientName: 'David Wong',
      summary: 'Investment property, wanted a private lender. Not a fit for our A-lender pipeline.',
      loanAmount: 380_000,
      status: 'Dismissed',
      daysAgo: 8,
      dismissedDaysAgo: 6,
      actionNote: 'Not applicable — client wants private financing, out of our lender panel.',
    },
  ];

  const batch = adminDb.batch();
  const col = adminDb.collection('crossSellFlags');
  for (const s of samples) {
    const ref = col.doc();
    const flaggedAt = new Date(now.getTime() - s.daysAgo * 86_400_000);
    batch.set(ref, {
      sourceReferralId: `demo-${ref.id.slice(0, 6)}`, // fake — set to a real referralId to enable the Open Deal button
      ownerUid: owner,
      crossSellKind: 'realtor-offer-to-mortgage',
      summary: s.summary,
      clientName: s.clientName,
      loanAmount: s.loanAmount,
      status: s.status,
      flaggedAt,
      lastEscalationLevel: s.lastEscalationLevel ?? 0,
      lastEscalatedAt: s.lastEscalationLevel ? new Date(now.getTime() - 12 * 3600_000) : null,
      contactedAt: s.contactedDaysAgo ? new Date(now.getTime() - s.contactedDaysAgo * 86_400_000).toISOString() : null,
      convertedAt: null,
      dismissedAt: s.dismissedDaysAgo ? new Date(now.getTime() - s.dismissedDaysAgo * 86_400_000).toISOString() : null,
      actionNote: s.actionNote || null,
      ruleId: 'cross-sell.realtor-offer-made',
    });
  }
  await batch.commit();
  console.log(`✅ Seeded ${samples.length} cross-sell flags for owner=${owner}`);
  console.log('   Open /partner → Cross-Sell tab (or the mobile Flags icon).');
}

main().catch(e => { console.error(e); process.exit(1); });
