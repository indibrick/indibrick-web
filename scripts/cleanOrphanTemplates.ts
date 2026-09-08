// Removes email_templates left behind by a superseded naming scheme.
//
// The Simcoe seeder originally derived template ids from the day offset
// (simcoe-launch__core__d0). It now uses the guide's stable email ids
// (simcoe-launch__core__e1), because day offsets changed when the real
// schedule landed — which orphaned every template written under the old
// scheme. They are placeholder copy, referenced by nothing, and they
// clutter the CRM template picker.
//
// USAGE
//   npx tsx --env-file=.env.local scripts/cleanOrphanTemplates.ts
//   npx tsx --env-file=.env.local scripts/cleanOrphanTemplates.ts --apply
//
// DRY RUN IS THE DEFAULT.
//
// SAFETY — a template is deleted only when ALL of these hold:
//   1. Its id starts with a known campaign prefix.
//   2. Its trailing id segment is NOT one of the guide's email ids.
//   3. Its body still contains the placeholder marker (never real copy).
//   4. No drip_sequences step references it.
// Anything failing a check is reported and kept. Firestore deletes are not
// recoverable, so the bar is deliberately high.

import { adminDb } from '../lib/firebaseAdmin';
import { SIMCOE_EMAILS } from '../data/simcoeCopy';
import { CAMPAIGNS } from '../data/dripCampaigns';

const APPLY = process.argv.includes('--apply');
const PLACEHOLDER = '<!-- PLACEHOLDER -->';

async function main() {
  if (!adminDb) { console.error('❌ adminDb unavailable.'); process.exit(1); }

  const knownEmailIds = new Set(SIMCOE_EMAILS.map((e) => e.id));
  const prefixes = CAMPAIGNS.map((c) => `${c.id}__`);

  // Every templateId any sequence still points at.
  const seqs = await adminDb.collection('drip_sequences').get();
  const referenced = new Set<string>();
  seqs.docs.forEach((s) =>
    ((s.data() as any).steps || []).forEach((st: any) => {
      if (st?.templateId) referenced.add(String(st.templateId));
    }));

  const snap = await adminDb.collection('email_templates').get();

  console.log('');
  console.log(APPLY ? '🗑️  ORPHAN CLEANUP — deleting' : '🔍 ORPHAN CLEANUP — dry run (pass --apply to delete)');
  console.log(`   templates scanned: ${snap.size}   referenced by a sequence: ${referenced.size}`);
  console.log('');

  const doomed: string[] = [];
  let kept = 0;

  for (const doc of snap.docs) {
    if (!prefixes.some((p) => doc.id.startsWith(p))) continue;

    const tail = doc.id.split('__').pop() as string;
    if (knownEmailIds.has(tail)) { kept += 1; continue; }

    const body = String((doc.data() as any)?.body || '');
    if (!body.includes(PLACEHOLDER)) {
      console.log(`  ⚠️  KEEPING ${doc.id}`);
      console.log('              orphaned, but its body is not placeholder copy — review by hand.');
      kept += 1;
      continue;
    }
    if (referenced.has(doc.id)) {
      console.log(`  ⚠️  KEEPING ${doc.id}`);
      console.log('              still referenced by a live sequence step.');
      kept += 1;
      continue;
    }

    doomed.push(doc.id);
    console.log(`  −  delete  ${doc.id}`);
    if (APPLY) await doc.ref.delete();
  }

  console.log('');
  console.log('─'.repeat(58));
  console.log(`  to delete: ${doomed.length}   keeping: ${kept}`);
  if (!APPLY && doomed.length > 0) {
    console.log('');
    console.log('  DRY RUN — nothing deleted. Re-run with --apply to remove them.');
  }
  console.log('');
}

main().catch((e) => { console.error('❌ cleanup failed:', e); process.exit(1); });
