// Backfills `city` onto referrals created before the field was carried
// across from the lead.
//
// The Simcoe drip's email 8 opens "If you're coming from {{city}}" — the
// whole email is an answer to the commute objection, so an unresolved tag
// there is the difference between a targeted argument and a generic one.
// dripRunner falls back to "the GTA", which is safe but weaker.
//
// USAGE
//   npx tsx --env-file=.env.local scripts/backfillReferralCity.ts
//   npx tsx --env-file=.env.local scripts/backfillReferralCity.ts --apply
//
// DRY RUN IS THE DEFAULT. Only fills referrals that have no city and do
// have a linked lead carrying one. Never overwrites an existing value.

import { adminDb } from '../lib/firebaseAdmin';

const APPLY = process.argv.includes('--apply');

async function main() {
  if (!adminDb) { console.error('❌ adminDb unavailable.'); process.exit(1); }

  const snap = await adminDb.collection('referrals').get();
  console.log('');
  console.log(APPLY ? '🔧 BACKFILL — writing' : '🔍 BACKFILL — dry run (pass --apply to commit)');
  console.log(`   referrals scanned: ${snap.size}`);
  console.log('');

  let filled = 0, already = 0, noLead = 0, leadHadNone = 0;

  for (const doc of snap.docs) {
    const r = doc.data() as any;
    if (String(r.city || '').trim()) { already += 1; continue; }
    if (!r.leadId) { noLead += 1; continue; }

    const lead = await adminDb.collection('leads').doc(String(r.leadId)).get();
    const city = String((lead.data() as any)?.city || '').trim();
    // 'Unknown' is what the submit route writes when the form omitted a
    // city — it is a placeholder, not a place, so it must not propagate.
    if (!city || city === 'Unknown') { leadHadNone += 1; continue; }

    filled += 1;
    console.log(`  + ${String(r.clientName || '(unnamed)').padEnd(28)} → ${city}`);
    if (APPLY) await doc.ref.update({ city });
  }

  console.log('');
  console.log('─'.repeat(56));
  console.log(`  filled: ${filled}   already set: ${already}   no lead: ${noLead}   lead had none: ${leadHadNone}`);
  if (!APPLY && filled > 0) console.log('\n  DRY RUN — nothing written. Re-run with --apply.');
  console.log('');
}

main().catch((e) => { console.error('❌ backfill failed:', e); process.exit(1); });
