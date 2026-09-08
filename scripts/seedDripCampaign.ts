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
import { validateDripSequence } from '../lib/dripShape';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force-templates');
const OWNER = (process.argv.find((a) => a.startsWith('--owner=')) || '').split('=')[1] || '';

const PLACEHOLDER = '<!-- PLACEHOLDER -->';

function placeholderBody(campaign: string, label: string): string {
  return `${PLACEHOLDER}
<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#0f172a;">
  <p>Hi {{clientName}},</p>
  <p>Placeholder copy for <strong>${campaign}</strong> — ${label}.</p>
  <p>Replace <code>body</code> on this template with the real HTML from the design doc.</p>
  <p>— IndiBrick</p>
</div>`;
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
      const ref = adminDb.collection('email_templates').doc(step.templateId);
      const existing = await ref.get();
      const hasRealCopy =
        existing.exists &&
        typeof (existing.data() as any)?.body === 'string' &&
        !(existing.data() as any).body.includes(PLACEHOLDER);

      if (hasRealCopy && !FORCE) {
        kept += 1;
        console.log(`   ✓ keep     day ${String(step.waitDaysAfterEnroll).padStart(2)}  ${step.templateId}`);
        continue;
      }
      created += 1;
      console.log(`   + ${existing.exists ? 'refresh' : 'create '}  day ${String(step.waitDaysAfterEnroll).padStart(2)}  ${step.templateId}  [${step.requiresSegment ? step.requiresSegment.join('/') : 'all'}]`);

      if (APPLY) {
        await ref.set({
          name: step.label,
          channel: 'email',
          subject: `[${c.name}] ${step.label}`,
          altSubject: `[${c.name}] ${step.label} (variant B)`,
          body: placeholderBody(c.name, step.label),
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
        enabled: false, // Deliberately OFF until real copy is in. Flip in the CRM.
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
    console.log('     1. Paste real copy into each /email_templates doc (subject, body).');
    console.log('     2. Partner portal → Automations → Drips → enable the sequence.');
    console.log('     3. Pipeline → select clients → Enroll in sequence.');
    console.log('     4. dripRunner picks them up within 5 minutes.');
  }
  console.log('');
}

main().catch((e) => { console.error('❌ seed failed:', e); process.exit(1); });
