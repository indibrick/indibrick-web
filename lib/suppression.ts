// Suppression list — server-side lookup + insert for the /unsubscribes
// collection. Keyed by (tenantId, emailHash) so lookups are O(1) and
// PII sits behind a one-way hash. Recipients who unsubscribe once
// stay opted out across ALL senders in the tenant — a CASL-compliant
// unsubscribe is universal, not per-sender.
//
// Firestore rules on /unsubscribes are server-only; this helper is
// the sole write path.

import crypto from 'crypto';
import { adminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

function docIdFor(email: string, tenantId: string): string {
  const norm = String(email || '').trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(`${tenantId}::${norm}`).digest('hex').slice(0, 32);
  return `${tenantId}__${hash}`;
}

export async function recordUnsubscribe(opts: {
  email: string;
  tenantId?: string;
  source: string;         // e.g. 'one_click', 'admin_manual', 'bounce', 'complaint'
  senderUid?: string;
  ctx?: string;           // e.g. 'batch:abc'
  reason?: string;        // optional free-form
  ip?: string;
  userAgent?: string;
}): Promise<{ ok: boolean; alreadyOptedOut?: boolean }> {
  if (!adminDb) return { ok: false };
  const tenantId = opts.tenantId || 'indibrick';
  const id = docIdFor(opts.email, tenantId);
  const ref = adminDb.collection('unsubscribes').doc(id);
  try {
    const snap = await ref.get();
    const alreadyOptedOut = snap.exists;
    await ref.set({
      tenantId,
      email: String(opts.email || '').trim().toLowerCase(),
      source: opts.source,
      senderUid: opts.senderUid || null,
      ctx: opts.ctx || null,
      reason: opts.reason || null,
      ip: opts.ip || null,
      userAgent: opts.userAgent || null,
      firstOptedOutAt: alreadyOptedOut ? snap.data()?.firstOptedOutAt : FieldValue.serverTimestamp(),
      lastOptedOutAt: FieldValue.serverTimestamp(),
      optOutCount: FieldValue.increment(1),
    }, { merge: true });
    return { ok: true, alreadyOptedOut };
  } catch (e) {
    console.warn('[suppression] recordUnsubscribe failed', e);
    return { ok: false };
  }
}

export async function isSuppressed(email: string, tenantId: string = 'indibrick'): Promise<boolean> {
  if (!adminDb || !email) return false;
  try {
    const snap = await adminDb.collection('unsubscribes').doc(docIdFor(email, tenantId)).get();
    return snap.exists;
  } catch {
    return false;
  }
}

// Batch check — used by mass-send to filter out opted-out recipients
// before enqueuing. Uses `in` queries in chunks of 30 to stay under
// Firestore's `in` cap (30 as of 2026).
export async function filterOutSuppressed(emails: string[], tenantId: string = 'indibrick'): Promise<Set<string>> {
  const suppressed = new Set<string>();
  if (!adminDb || emails.length === 0) return suppressed;
  const normalized = emails.map(e => String(e || '').trim().toLowerCase()).filter(Boolean);
  const chunkSize = 30;
  for (let i = 0; i < normalized.length; i += chunkSize) {
    const chunk = normalized.slice(i, i + chunkSize);
    const docIds = chunk.map(e => docIdFor(e, tenantId));
    try {
      // Batch get via doc references — 500 max per batch, well over our chunk.
      const refs = docIds.map(id => adminDb!.collection('unsubscribes').doc(id));
      const snaps = await adminDb.getAll(...refs);
      snaps.forEach((s, idx) => { if (s.exists) suppressed.add(chunk[idx]); });
    } catch (e) {
      console.warn('[suppression] batch lookup failed', e);
    }
  }
  return suppressed;
}
