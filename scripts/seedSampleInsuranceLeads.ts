// Localhost helper: seeds 3 claimable insurance leads (INSURANCE_INBOX)
// + 3 leads already assigned to an insurance agent for their book, so
// you can verify both sections of the InsurancePanel without deploying
// the mortgage-funded-to-insurance rule.
//
// USAGE
//   FIREBASE_CLIENT_EMAIL=… FIREBASE_PRIVATE_KEY=… \
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID=indibrick-web \
//   AGENT_UID=<your-insurance-agent-uid> \
//   npx tsx scripts/seedSampleInsuranceLeads.ts
//
// If you're testing as admin, still pass an AGENT_UID for the "mine"
// section — admin claim would flip a lead to your admin uid, but this
// seeds the "already claimed" state directly so you don't have to.

import { adminDb } from '../lib/firebaseAdmin';

async function main() {
  const agentUid = process.env.AGENT_UID;
  if (!agentUid) {
    console.error('❌ Set AGENT_UID=<your uid> before running.');
    process.exit(1);
  }
  if (!adminDb) {
    console.error('❌ adminDb is null — check FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.');
    process.exit(1);
  }

  const now = new Date();
  const iso = (offsetDays: number) =>
    new Date(now.getTime() + offsetDays * 86_400_000).toISOString();

  const claimable = [
    {
      clientName: 'Ayesha Khan',
      clientEmail: 'ayesha.khan@example.com',
      clientPhone: '+14164445555',
      insuranceCoverageType: 'Home',
      notes: 'Mortgage just funded — needs bound home insurance before closing.',
      daysAgo: 0,
    },
    {
      clientName: 'Marcus Chen',
      clientEmail: 'marcus.chen@example.com',
      clientPhone: '+14166667777',
      insuranceCoverageType: 'Home',
      notes: 'Detached in Etobicoke, $980k valuation. First-time buyer.',
      daysAgo: 1,
    },
    {
      clientName: 'Priya Patel',
      clientEmail: 'priya.patel@example.com',
      clientPhone: '+14168889999',
      insuranceCoverageType: 'Bundle',
      notes: 'Wants Home + Auto quote (has two vehicles).',
      daysAgo: 3,
    },
  ];

  const mine = [
    {
      clientName: 'David Wong',
      clientEmail: 'david.wong@example.com',
      insuranceCoverageType: 'Home',
      insuranceCarrier: 'Intact',
      insurancePolicyNumber: 'IN-8891-4402',
      insurancePremiumAnnual: 1840,
      insuranceEffectiveDate: iso(-30),
      insuranceRenewalDate: iso(300),
      insuranceBoundAt: iso(-30),
      status: 'Bound',
    },
    {
      clientName: 'Sarah Nguyen',
      clientEmail: 'sarah.nguyen@example.com',
      insuranceCoverageType: 'Home',
      insuranceCarrier: 'Aviva',
      status: 'Quoted',
      insurancePremiumAnnual: 2100,
    },
    {
      clientName: 'Raj Malhotra',
      clientEmail: 'raj.malhotra@example.com',
      insuranceCoverageType: 'Bundle',
      insuranceCarrier: 'Sonnet',
      insurancePolicyNumber: 'SN-224-9902',
      insurancePremiumAnnual: 3220,
      insuranceEffectiveDate: iso(-360),
      insuranceRenewalDate: iso(5), // renews in 5 days — should trigger the urgent tier
      insuranceBoundAt: iso(-360),
      status: 'Bound',
    },
  ];

  const batch = adminDb.batch();
  const col = adminDb.collection('referrals');

  for (const l of claimable) {
    const ref = col.doc();
    batch.set(ref, {
      clientName: l.clientName,
      clientEmail: l.clientEmail,
      clientPhone: l.clientPhone,
      referrerId: 'INDIBRICK_SYSTEM',
      referrerName: 'IndiBrick — Mortgage Funding Feed (demo)',
      assignedAgentId: 'INSURANCE_INBOX',
      assignedAgentName: 'Insurance Inbox (Unclaimed)',
      status: 'New',
      dealType: 'Insurance',
      dealCategory: 'potential',
      insuranceCoverageType: l.insuranceCoverageType,
      notes: l.notes,
      referralDate: iso(-l.daysAgo),
      pushedForMortgage: true,
      participantIds: [],
      participants: [],
      timeline: [],
    });
  }

  for (const l of mine) {
    const ref = col.doc();
    batch.set(ref, {
      clientName: l.clientName,
      clientEmail: l.clientEmail,
      referrerId: 'INDIBRICK_SYSTEM',
      referrerName: 'IndiBrick — Mortgage Funding Feed (demo)',
      assignedAgentId: agentUid,
      assignedAgentName: 'You',
      insuranceClaimedBy: agentUid,
      insuranceClaimedAt: iso(-2),
      status: l.status,
      dealType: 'Insurance',
      dealCategory: 'active',
      insuranceCoverageType: l.insuranceCoverageType,
      insuranceCarrier: l.insuranceCarrier || null,
      insurancePolicyNumber: l.insurancePolicyNumber || null,
      insurancePremiumAnnual: l.insurancePremiumAnnual || null,
      insuranceEffectiveDate: l.insuranceEffectiveDate || null,
      insuranceRenewalDate: l.insuranceRenewalDate || null,
      insuranceBoundAt: l.insuranceBoundAt || null,
      referralDate: iso(-5),
      pushedForMortgage: true,
      participantIds: [agentUid],
      participants: [],
      timeline: [],
    });
  }

  await batch.commit();
  console.log(`✅ Seeded ${claimable.length} claimable + ${mine.length} claimed insurance leads.`);
  console.log('   Open /partner → Insurance tab.');
  console.log('   Try clicking Claim on one of the amber cards.');
}

main().catch(e => { console.error(e); process.exit(1); });
