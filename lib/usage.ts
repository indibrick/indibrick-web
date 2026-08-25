// Usage metering.
//
// Every SMS sent, every call minute, every message received is written
// to /usage/{tenantId}/months/{yyyy-mm} so we can:
//   1. Show the customer their current-month usage in the CRM
//   2. Charge overages via Stripe (Wave 3)
//   3. Kill runaway loops before they blow the budget
//
// Multi-tenancy is Wave 3. Until then everything writes to
// tenantId='indibrick' by default. The schema is future-proofed —
// when we add sub-accounts, only the tenantId parameter changes.

import admin from 'firebase-admin';
import { adminDb } from './firebaseAdmin';

export interface UsageDelta {
  smsSent?: number;
  smsReceived?: number;
  smsSegments?: number;      // for billing (Twilio charges per segment)
  callsInitiated?: number;
  callMinutes?: number;
  emailsSent?: number;
  storageBytesAdded?: number;
}

const DEFAULT_TENANT = 'indibrick';

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function recordUsage(delta: UsageDelta, tenantId: string = DEFAULT_TENANT): Promise<void> {
  if (!adminDb) return;
  const month = currentMonth();
  const ref = adminDb.collection('usage').doc(tenantId).collection('months').doc(month);
  const update: Record<string, any> = {
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };
  for (const [k, v] of Object.entries(delta)) {
    if (typeof v === 'number' && v !== 0) {
      update[k] = admin.firestore.FieldValue.increment(v);
    }
  }
  if (Object.keys(update).length === 1) return; // only the timestamp — skip
  try {
    await ref.set(update, { merge: true });
  } catch (e) {
    // Metering is best-effort — never block the user action.
    console.warn('[usage] record failed', e);
  }
}
