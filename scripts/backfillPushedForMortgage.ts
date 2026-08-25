// Phase 4 backfill: every pre-Phase-4 referral is grandfathered as
// `pushedForMortgage: true`. Reasoning:
//
//   1. Pre-Phase-4 there was no privacy model — every deal was visible
//      to admin. Marking existing rows as pushed preserves that
//      behavior exactly.
//   2. The firestore rules already treat missing field as "true" (see
//      pushedForMortgage() helper), so this backfill is a defense-in
//      -depth: even if a client reads the raw doc it sees the explicit
//      flag and behaves consistently.
//
// Only future realtor-created deals (created by a user with role
// partner_realtor) start with pushedForMortgage:false — see the intake
// flow. This backfill never touches new realtor-created private deals
// because they'll already have the field set explicitly.
//
// USAGE
//   FIREBASE_CLIENT_EMAIL=… FIREBASE_PRIVATE_KEY=… \
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID=indibrick-web \
//   npx tsx scripts/backfillPushedForMortgage.ts [--dry-run] [--limit N]

import admin from 'firebase-admin';
import { adminDb } from '../lib/firebaseAdmin';

async function main() {
  if (!adminDb) {
    console.error('❌ adminDb is null — check FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.');
    process.exit(1);
  }
  const dryRun = process.argv.includes('--dry-run');
  const limitIdx = process.argv.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1] || '0', 10) : 0;

  console.log(`▶ Scanning /referrals${limit ? ` (limit ${limit})` : ''}${dryRun ? ' — DRY RUN' : ''}`);

  const query = limit > 0
    ? adminDb.collection('referrals').limit(limit)
    : adminDb.collection('referrals');
  const snap = await query.get();
  console.log(`   ${snap.size} total docs`);

  let toBackfill = 0;
  let alreadySet = 0;
  let batch = adminDb.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (typeof data.pushedForMortgage === 'boolean') {
      alreadySet += 1;
      continue;
    }

    toBackfill += 1;
    if (!dryRun) {
      batch.update(doc.ref, {
        pushedForMortgage: true,
        pushedForMortgageAt: data.referralDate || new Date().toISOString(),
        pushedForMortgageBy: 'system:phase-4-backfill',
        _systemUpdate: true,
      });
      batchCount += 1;
      if (batchCount >= 400) {
        await batch.commit();
        console.log(`   … committed ${batchCount}`);
        batch = adminDb.batch();
        batchCount = 0;
      }
    }
  }

  if (!dryRun && batchCount > 0) {
    await batch.commit();
    console.log(`   … committed final ${batchCount}`);
  }

  console.log('');
  console.log(`✅ Result`);
  console.log(`   Already set:    ${alreadySet}`);
  console.log(`   Would backfill: ${toBackfill}`);
  if (dryRun) console.log('   (dry-run — no writes)');

  // Clear the _systemUpdate flag we set so subsequent legitimate writes
  // aren't silenced. Same pattern as the dealType backfill.
  if (!dryRun && toBackfill > 0) {
    console.log('▶ Second pass: clearing _systemUpdate flags…');
    const updatedSnap = await adminDb.collection('referrals').where('_systemUpdate', '==', true).get();
    let clearBatch = adminDb.batch();
    let clearCount = 0;
    for (const d of updatedSnap.docs) {
      clearBatch.update(d.ref, { _systemUpdate: admin.firestore.FieldValue.delete() });
      clearCount += 1;
      if (clearCount >= 400) {
        await clearBatch.commit();
        clearBatch = adminDb.batch();
        clearCount = 0;
      }
    }
    if (clearCount > 0) await clearBatch.commit();
    console.log(`   cleared on ${updatedSnap.size} docs`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
