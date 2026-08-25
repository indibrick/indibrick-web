// Health check — for uptime monitors + Cloud Run readiness probes.
//
// Returns 200 with a JSON status snapshot when core dependencies are
// reachable; 503 when the Firestore ping fails. Deliberately public
// (no auth) — an uptime monitor can't attach a Bearer token.
//
// The Firestore check is a cheap document-read from a well-known path
// (/health/ping) — one Firestore RTT. Downstream feature health (Twilio,
// Gemini, etc.) is NOT probed — those failing shouldn't take the whole
// service down, and probing them on every uptime check would cost real
// money on the LLM side.

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Cache the app boot time so a monitor can spot restarts.
const BOOTED_AT = new Date().toISOString();

export async function GET() {
  const started = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
  let overallOk = true;

  // ── Firestore ping ──────────────────────────────────────────────
  if (!adminDb) {
    checks.firestore = { ok: false, error: 'adminDb unavailable' };
    overallOk = false;
  } else {
    const t0 = Date.now();
    try {
      // Point read is cheap and doesn't require the doc to exist.
      await adminDb.collection('health').doc('ping').get();
      checks.firestore = { ok: true, latencyMs: Date.now() - t0 };
    } catch (e: any) {
      checks.firestore = { ok: false, error: e?.message || 'unknown' };
      overallOk = false;
    }
  }

  // ── Config visibility ──────────────────────────────────────────
  // Not health-critical — these tell the monitor which features are
  // wired without leaking secrets. Boolean-only.
  const config = {
    firebase:  !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY,
    gemini:    !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    twilio:    !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    turnstile: !!process.env.TURNSTILE_SECRET_KEY,
    calendar:  !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET),
    sentry:    !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  };

  const body = {
    status: overallOk ? 'ok' : 'degraded',
    bootedAt: BOOTED_AT,
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - started,
    node: process.version,
    env: process.env.NODE_ENV || 'unknown',
    checks,
    config,
  };

  return NextResponse.json(body, {
    status: overallOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
