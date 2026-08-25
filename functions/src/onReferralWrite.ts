/* eslint-disable import/no-unresolved */
// Firestore trigger: runs the rules engine on every write to /referrals.
//
// Wired from functions/src/index.ts. Kept in its own file so the rules
// engine can be unit-tested without pulling firebase-functions v2 into
// the test harness.

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { runRulesForWrite } from './rules/engine';
import type { ReferralDoc } from './rules/types';

// Emitter uid heuristic. Client-SDK writes stamp `lastUpdatedBy` on the
// document (see the /api/partner/referrals/[id] PATCH endpoint). Writes
// from scheduled functions / migrations leave it null → runner treats
// that as "system actor" (safeguard 5).
function extractActorUid(after: ReferralDoc | null): string | null {
  const uid = after?.lastUpdatedBy;
  return typeof uid === 'string' && uid.length > 0 ? uid : null;
}

export const onReferralWrite = onDocumentWritten(
  {
    document: 'referrals/{referralId}',
    region: 'us-central1',
    // Small concurrency + memory profile — rules engine does a handful
    // of Firestore reads/writes per invocation.
    memory: '256MiB',
    concurrency: 8,
  },
  async (event) => {
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;
    const beforeExists = beforeSnap?.exists ?? false;
    const afterExists = afterSnap?.exists ?? false;

    const before: ReferralDoc | null = beforeExists
      ? ({ id: event.params.referralId, ...(beforeSnap!.data() as any) })
      : null;
    const after: ReferralDoc | null = afterExists
      ? ({ id: event.params.referralId, ...(afterSnap!.data() as any) })
      : null;

    try {
      const result = await runRulesForWrite({
        before,
        after,
        actorUid: extractActorUid(after),
        db: admin.firestore(),
      });
      if (result.errors.length > 0) {
        console.warn('[onReferralWrite] rule errors', {
          referralId: event.params.referralId,
          errors: result.errors,
        });
      }
      if (result.fired > 0) {
        console.log('[onReferralWrite] fired', {
          referralId: event.params.referralId,
          fired: result.fired,
          skipped: result.skipped.length,
        });
      }
    } catch (e: any) {
      // Never let a rules failure propagate — it would put the trigger
      // into an infinite retry loop. Log and swallow; the audit trail
      // in /rule_events + Cloud Logging is enough to debug.
      console.error('[onReferralWrite] unhandled', {
        referralId: event.params.referralId,
        error: e?.message,
      });
    }
  },
);
