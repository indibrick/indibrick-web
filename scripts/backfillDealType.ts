// One-shot backfill: stamp `dealType` on every existing /referrals doc.
//
// Why a separate field from the legacy `type`?  The existing `type`
// field in the codebase is stuffed with source labels ('Web Lead',
// 'Manual Entry', 'Imported Lead', 'Mortgage', ad-hoc strings from
// intake forms). It's not a clean discriminator. `dealType` is the
// new canonical field the rules engine + cross-sell dashboard rely on:
//
//   dealType: 'Mortgage' | 'Real Estate' | 'Legal'
//
// USAGE
//   FIREBASE_CLIENT_EMAIL=… FIREBASE_PRIVATE_KEY=… \
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID=indibrick-web \
//   npx tsx scripts/backfillDealType.ts [--dry-run] [--limit 100]
//
// Defaults every existing referral to 'Mortgage' — IndiBrick has been
// a mortgage brokerage historically, so this is safe. New realtor +
// legal deals will set dealType explicitly going forward.
//
// The script is idempotent: it only touches docs that DON'T already
// have a valid dealType, so running it twice is a no-op.

import admin from 'firebase-admin';
import { adminDb } from '../lib/firebaseAdmin';

const VALID = new Set(['Mortgage', 'Real Estate', 'Legal']);
const DEFAULT_DEAL_TYPE = 'Mortgage';

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
  let alreadyClean = 0;
  let inferredRealEstate = 0;
  const byNewType: Record<string, number> = {};

  // Batch writes at 400 per commit (Firestore hard cap is 500 mutations
  // including any transaction reads; 400 leaves headroom).
  let batch = adminDb.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const existing = data.dealType;
    if (typeof existing === 'string' && VALID.has(existing)) {
      alreadyClean += 1;
      continue;
    }

    // Try to infer from the legacy `type` string first. If someone
    // manually typed 'Real Estate' or 'Legal' in there, honor it.
    let inferred = DEFAULT_DEAL_TYPE;
    const legacy = String(data.type || '').trim();
    if (VALID.has(legacy)) {
      inferred = legacy;
      if (legacy === 'Real Estate') inferredRealEstate += 1;
    }

    byNewType[inferred] = (byNewType[inferred] || 0) + 1;
    toBackfill += 1;

    if (!dryRun) {
      batch.update(doc.ref, {
        dealType: inferred,
        // Stamp _systemUpdate so onReferralWrite's safeguard #1 skips
        // rule evaluation — we don't want the stale rule to fire for
        // every existing deal the second this backfill lands.
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
  console.log(`   Already clean:        ${alreadyClean}`);
  console.log(`   Would backfill:       ${toBackfill}`);
  console.log(`   Inferred Real Estate: ${inferredRealEstate}`);
  console.log(`   By new dealType:      ${JSON.stringify(byNewType)}`);
  if (dryRun) console.log('   (dry-run — no writes)');

  // Second pass: clear the _systemUpdate flag we set for the
  // safeguard. Without this the next real write to any of these docs
  // would still be treated as system → cross-sell + stale rules would
  // continue to skip.
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
