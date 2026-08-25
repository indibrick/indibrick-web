// Distributed rate limiter.
//
// The in-memory Maps scattered through /api/partner/* and /api/twilio/*
// reset on every Cloud Run cold start, which means an instance-scaling
// event effectively resets everyone's quota. That's a real leak for
// SMS/call rate limits (which map to Twilio dollars).
//
// This helper stores counters in Firestore keyed by (bucket, key,
// windowStart) so every instance sees the same view. Trade-off is one
// extra Firestore round-trip per rate-limited call (~10-30ms) — small
// compared to the SMS/call latency it's protecting.
//
// Storage shape: /rate_limits/{bucket}__{key}__{windowMs}__{windowStart}
//   count: int
//   expiresAt: iso  (documents can be swept by a TTL policy later)
//
// The window is fixed-size (not sliding) — simpler to implement and
// good enough for our use cases. Sliding-window is a follow-up if we
// see false-negative traffic patterns.

import { adminDb } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export interface RateLimitInput {
  bucket: string;      // e.g. 'sms.send', 'twilio.deal-analyzer'
  key: string;         // caller id — uid, ip, referralId, etc.
  windowMs: number;    // window duration
  max: number;         // max hits allowed in the window
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetsAt: number;    // epoch ms when the window ends
  count: number;       // count including the current call (only when ok=true)
}

function windowStart(nowMs: number, windowMs: number): number {
  return Math.floor(nowMs / windowMs) * windowMs;
}

function safeKeySegment(s: string): string {
  // Firestore doc IDs can't contain '/' — sanitize aggressively.
  return String(s).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}

// Fallback for when adminDb is unavailable (misconfigured local dev).
// Falls through as "allowed" so features don't break — logs a warn once.
let warnedNoDb = false;
function fallbackAllowed(input: RateLimitInput): RateLimitResult {
  if (!warnedNoDb) {
    console.warn('[rateLimiter] adminDb unavailable — allowing all traffic. Configure firebase-admin credentials.');
    warnedNoDb = true;
  }
  const now = Date.now();
  return { ok: true, remaining: input.max, resetsAt: now + input.windowMs, count: 0 };
}

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  if (!adminDb) return fallbackAllowed(input);
  const now = Date.now();
  const start = windowStart(now, input.windowMs);
  const resetsAt = start + input.windowMs;
  const docId = [
    safeKeySegment(input.bucket),
    safeKeySegment(input.key),
    String(input.windowMs),
    String(start),
  ].join('__');
  const ref = adminDb.collection('rate_limits').doc(docId);

  try {
    // Transactional read-then-write: guarantees atomicity even when
    // multiple Cloud Run instances handle the same user concurrently.
    return await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const current = snap.exists ? (Number(snap.data()?.count || 0)) : 0;
      if (current >= input.max) {
        return {
          ok: false,
          remaining: 0,
          resetsAt,
          count: current,
        };
      }
      const next = current + 1;
      tx.set(ref, {
        bucket: input.bucket,
        key: input.key,
        windowMs: input.windowMs,
        windowStart: start,
        count: FieldValue.increment(1),
        // TTL hint — a Firestore TTL policy on rate_limits.expiresAt
        // will sweep these automatically. Without a policy, they're
        // cheap enough to leave (~30 bytes per doc, one per (bucket,
        // key, window) at a time).
        expiresAt: new Date(resetsAt + input.windowMs).toISOString(),
      }, { merge: true });
      return {
        ok: true,
        remaining: Math.max(0, input.max - next),
        resetsAt,
        count: next,
      };
    });
  } catch (e: any) {
    // On any transaction failure, fail open (allow the call).
    // Better a false-negative rate-limit than a locked user.
    console.warn('[rateLimiter] tx failed, allowing:', e?.message);
    return { ok: true, remaining: input.max, resetsAt, count: 0 };
  }
}

// Convenience — normalized reset time for 429 headers.
export function resetHeaderSeconds(result: RateLimitResult): number {
  return Math.max(1, Math.ceil((result.resetsAt - Date.now()) / 1000));
}
