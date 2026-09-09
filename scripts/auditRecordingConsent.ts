// Reports how many stored call recordings were made before the client
// was given a recording notice.
//
// Until the voice-whisper endpoint shipped, the only spoken line on an
// outbound call played to the agent's leg. Clients were dialled into a
// call already recording and heard nothing. Every recording from before
// that cutoff was captured without notice.
//
// This does not delete anything — deciding what to do with those files
// is a compliance judgment, not a script's call. It tells you the size
// of the set so the decision is made against a number.
//
// USAGE
//   npx tsx --env-file=.env.local scripts/auditRecordingConsent.ts
//   npx tsx --env-file=.env.local scripts/auditRecordingConsent.ts --cutoff=2026-09-09T00:00:00Z
//
// The cutoff defaults to the moment the notice deployed. Override it if
// you deploy at a different time than the default assumes.

import { adminDb } from '../lib/firebaseAdmin';

const cutoffArg = (process.argv.find((a) => a.startsWith('--cutoff=')) || '').split('=')[1];
const CUTOFF = cutoffArg || '2026-09-09T00:00:00Z';

function asIso(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v?.toDate === 'function') return v.toDate().toISOString();
  return null;
}

async function main() {
  if (!adminDb) { console.error('❌ adminDb unavailable.'); process.exit(1); }

  const snap = await adminDb.collection('messages').get();
  const recorded = snap.docs.filter((d) => Boolean((d.data() as any)?.recordingUrl));

  let before = 0, after = 0, undated = 0;
  let earliest: string | null = null;
  let secondsBefore = 0;

  for (const doc of recorded) {
    const m = doc.data() as any;
    const at = asIso(m.createdAt) || asIso(m.timestamp) || asIso(m.date);
    if (!at) { undated += 1; continue; }
    if (at < CUTOFF) {
      before += 1;
      secondsBefore += Number(m.recordingDuration || 0);
      if (!earliest || at < earliest) earliest = at;
    } else {
      after += 1;
    }
  }

  console.log('');
  console.log('📼 RECORDING CONSENT AUDIT');
  console.log(`   notice live from: ${CUTOFF}`);
  console.log('');
  console.log(`   messages scanned:            ${snap.size}`);
  console.log(`   with a stored recording:     ${recorded.length}`);
  console.log('');
  console.log(`   recorded WITHOUT notice:     ${before}`);
  console.log(`   recorded WITH notice:        ${after}`);
  if (undated) console.log(`   undated (could not place):   ${undated}`);
  if (before > 0) {
    const mins = Math.round(secondsBefore / 60);
    console.log('');
    console.log(`   earliest affected:           ${earliest}`);
    console.log(`   total affected audio:        ~${mins} min`);
    console.log('');
    console.log('   These were captured before the client was told. Options are');
    console.log('   to delete the audio, keep it but exclude it from analysis, or');
    console.log('   accept it on advice. That is a compliance decision — this');
    console.log('   script deliberately does not act on it.');
  } else {
    console.log('');
    console.log('   ✓ No recordings predate the notice.');
  }
  console.log('');
}

main().catch((e) => { console.error('❌ audit failed:', e); process.exit(1); });
