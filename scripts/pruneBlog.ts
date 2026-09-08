// Blog prune — applies data/blogPrunePlan.mjs to Firestore.
//
// USAGE
//   FIREBASE_CLIENT_EMAIL=… FIREBASE_PRIVATE_KEY=… \
//   NEXT_PUBLIC_FIREBASE_PROJECT_ID=indibrick-web \
//   npx tsx scripts/pruneBlog.ts             # dry run (default)
//   npx tsx scripts/pruneBlog.ts --apply     # actually writes
//   npx tsx scripts/pruneBlog.ts --revert    # clears every noindex flag
//
// DRY RUN IS THE DEFAULT. Nothing is written without --apply.
//
// What it does:
//   action 'noindex'  → sets { noindex: true } on the post. Page stays
//                       live and readable; drops out of sitemap + index.
//   action 'redirect' → ALSO sets { noindex: true }. The 301 in
//                       next.config.mjs means the URL never renders, but
//                       flagging the doc keeps /blog and the sitemap from
//                       linking to a URL that immediately bounces.
//
// NOTHING IS DELETED. Every post remains in Firestore and is fully
// recoverable by flipping `noindex` back to false (or running --revert).
// That's deliberate: 301s preserve any inbound link equity, and a
// reversible prune is the only safe kind when the pruning judgment is
// based on an audit rather than on live GSC query data.
//
// ⚠️ Before running --apply, pull a GSC `page + query` export filtered to
// /blog/ and confirm none of these URLs currently OWNS a query. Expected
// to be none — they aren't indexed — but verify rather than assume.

import { adminDb } from '../lib/firebaseAdmin';
import { BLOG_PRUNE_PLAN } from '../data/blogPrunePlan.mjs';

interface PruneEntry {
  slug: string;
  action: 'redirect' | 'noindex';
  to?: string;
  reason: string;
}

const APPLY = process.argv.includes('--apply');
const REVERT = process.argv.includes('--revert');

async function findPostBySlug(slug: string) {
  if (!adminDb) throw new Error('adminDb unavailable');
  const snap = await adminDb.collection('posts').where('slug', '==', slug).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

async function main() {
  if (!adminDb) {
    console.error('❌ adminDb unavailable — set FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID.');
    process.exit(1);
  }

  const plan = BLOG_PRUNE_PLAN as PruneEntry[];

  console.log('');
  console.log(REVERT ? '↩️  REVERT — clearing noindex flags' : '✂️  BLOG PRUNE');
  console.log(APPLY ? '   MODE: APPLY (writes to Firestore)' : '   MODE: DRY RUN (no writes — pass --apply to commit)');
  console.log(`   Posts in plan: ${plan.length}`);
  console.log('');

  let willChange = 0;
  let alreadyDone = 0;
  let notFound = 0;

  for (const entry of plan) {
    const doc = await findPostBySlug(entry.slug);

    if (!doc) {
      notFound += 1;
      console.log(`  ⚠️  NOT FOUND  ${entry.slug}`);
      console.log(`                 (no /posts doc with this slug — may already be removed)`);
      continue;
    }

    const data = doc.data() as any;
    const currentlyNoindexed = data.noindex === true;
    const target = REVERT ? false : true;

    if (currentlyNoindexed === target) {
      alreadyDone += 1;
      console.log(`  ✓  no change  ${entry.slug}`);
      continue;
    }

    willChange += 1;
    const verb = REVERT ? 'RE-INDEX' : entry.action === 'redirect' ? '301 + noindex' : 'noindex';
    console.log(`  →  ${verb.padEnd(14)} ${entry.slug}`);
    if (!REVERT) {
      if (entry.to) console.log(`     redirect to: ${entry.to}`);
      console.log(`     why: ${entry.reason}`);
      console.log(`     byline: ${data.author || '(none)'}`);
    }

    if (APPLY) {
      await doc.ref.update({
        noindex: target,
        prunedAt: target ? new Date().toISOString() : null,
        pruneReason: target ? entry.reason : null,
      });
    }
    console.log('');
  }

  console.log('─'.repeat(60));
  console.log(`  to change: ${willChange}   already correct: ${alreadyDone}   not found: ${notFound}`);
  if (!APPLY && willChange > 0) {
    console.log('');
    console.log('  DRY RUN — nothing written. Re-run with --apply to commit.');
  }
  if (APPLY && willChange > 0) {
    console.log('');
    console.log('  ✅ Written. Next steps:');
    console.log('     1. Deploy so the 301s in next.config.mjs go live.');
    console.log('     2. In Search Console, request re-crawl of the surviving posts.');
    console.log('     3. Reassign "Admin" / "IndiBrick AI Intelligence" bylines on the KEPT posts.');
  }
  console.log('');
}

main().catch((e) => {
  console.error('❌ prune failed:', e);
  process.exit(1);
});
