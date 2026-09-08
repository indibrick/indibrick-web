// Seeds a branching drip campaign into the EXISTING engine.
//
// Writes:
//   /email_templates  — one doc per email (17 for Simcoe)
//   /drip_sequences   — one doc holding the ordered, segment-gated step list
//
// It does NOT create a parallel engine. dripRunner already walks
// /drip_sequences → /drip_runs → /mail with suppression, the CASL footer and
// signed unsubscribe links. This only supplies content and structure.
//
// USAGE
//   npx tsx --env-file=.env.local scripts/seedDripCampaign.ts --owner=<uid>
//   npx tsx --env-file=.env.local scripts/seedDripCampaign.ts --owner=<uid> --apply
//
// DRY RUN IS THE DEFAULT. --owner is the Firebase UID that owns the sequence;
// dripRunner reads that user's sender identity for the From line, so it must
// be a real user with a verified sending address.
//
// EXISTING TEMPLATE COPY IS NEVER OVERWRITTEN. Re-running after pasting real
// copy only fills gaps. --force-templates overrides, which you rarely want.

import { adminDb } from '../lib/firebaseAdmin';
import { CAMPAIGNS, buildSteps, templateId } from '../data/dripCampaigns';
import { SIMCOE_EMAILS } from '../data/simcoeCopy';
import { validateDripSequence } from '../lib/dripShape';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force-templates');
const OWNER = (process.argv.find((a) => a.startsWith('--owner=')) || '').split('=')[1] || '';

// Re-running after someone edits copy in the CRM must not silently revert
// it. A template is treated as hand-edited when its body differs from the
// copy file, and is left alone unless --force-templates is passed.
function bodyFor(id: string): { subject: string; body: string; label: string } {
  const e = SIMCOE_EMAILS.find((x) => x.id === id);
  if (!e) throw new Error(`no copy for email id ${id}`);
  return { subject: e.subject, body: e.body, label: `${e.label} — ${e.subject}` };
}

async function main() {
  if (!adminDb) {
    console.error('❌ adminDb unavailable — check FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.');
    process.exit(1);
  }
  if (!OWNER) {
    console.error('❌ --owner=<firebaseUid> is required. dripRunner reads that user\'s sender identity for the From line.');
    process.exit(1);
  }

  console.log('');
  console.log('🌱 DRIP CAMPAIGN SEED');
  console.log(APPLY ? '   MODE: APPLY (writes to Firestore)' : '   MODE: DRY RUN (pass --apply to commit)');
  console.log(`   owner: ${OWNER}`);
  console.log('');

  for (const c of CAMPAIGNS) {
    const steps = buildSteps(c);
    console.log(`📋 ${c.name}  (${c.id}) — ${steps.length} steps`);

    // Validate against the same rules the CRM editor enforces, so a seeded
    // sequence can be opened and saved there without tripping an error.
    const errors = validateDripSequence({
      name: c.name,
      steps: steps as any,
      respectSuppression: true,
      stopIfReplies: false,
    });
    if (errors.length > 0) {
      console.error('❌ sequence failed validation:');
      errors.forEach((e) => console.error('   ·', e));
      process.exit(1);
    }
    console.log('   ✓ passes validateDripSequence');
    console.log('');

    let created = 0;
    let kept = 0;

    for (const step of steps) {
      // templateId encodes the email id as the last "__" segment.
      const emailId = step.templateId.split('__').pop() as string;
      const copy = bodyFor(emailId);

      const ref = adminDb.collection('email_templates').doc(step.templateId);
      const existing = await ref.get();
      const prevBody = existing.exists ? String((existing.data() as any)?.body || '') : '';
      const handEdited = existing.exists && prevBody !== '' && prevBody !== copy.body;

      if (handEdited && !FORCE) {
        kept += 1;
        console.log(`   ✓ keep     day ${String(step.waitDaysAfterEnroll).padStart(2)}  ${step.templateId}`);
        console.log(`              (edited in the CRM — pass --force-templates to overwrite)`);
        continue;
      }
      created += 1;
      const gate = step.requiresSegment ? step.requiresSegment.join('/') : 'all';
      console.log(`   + ${existing.exists ? 'update ' : 'create '}  day ${String(step.waitDaysAfterEnroll).padStart(2)}  ${step.templateId}  [${gate}]`);

      if (APPLY) {
        await ref.set({
          name: copy.label,
          channel: 'email',
          subject: copy.subject,
          body: copy.body,
          ownerUid: OWNER,
          tenantId: 'indibrick',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }

    console.log('');
    if (APPLY) {
      await adminDb.collection('drip_sequences').doc(c.id).set({
        name: c.name,
        description: c.description,
        // Still seeded OFF. The copy is real, but email 7 quotes live
        // builder incentives that must be re-checked before any send,
        // and dripRunner has to be deployed for the branch gates to work.
        enabled: false,
        ownerUid: OWNER,
        tenantId: 'indibrick',
        steps,
        respectSuppression: true,
        stopIfReplies: false,
        nonOpenerCheckDay: c.nonOpenerCheckDay,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log(`   ✓ wrote /drip_sequences/${c.id}  (enabled: false)`);
    }
    console.log(`   templates created/refreshed: ${created}   kept: ${kept}`);
    console.log('');
  }

  if (!APPLY) {
    console.log('  DRY RUN — nothing written. Re-run with --apply to commit.');
  } else {
    console.log('  ✅ Seeded. Next:');
    console.log('     1. Re-check email 7 incentives against the builder sheets.');
    console.log('     2. Deploy dripRunner, then enable the sequence in Automations.');
    console.log('     3. Pipeline → select clients → Enroll in sequence.');
    console.log('     4. dripRunner picks them up within 5 minutes.');
  }
  console.log('');
}

main().catch((e) => { console.error('❌ seed failed:', e); process.exit(1); });
