// Trigger a tracker run.
//
// Two auth paths:
//   1. Cloud Scheduler: sends `Authorization: Bearer <CITATION_TRACKER_SECRET>`.
//      Constant-time compare against the env secret.
//   2. Manual admin trigger from the dashboard: falls back to
//      requireAuth({ roles: ['admin'] }) if the bearer path doesn't match.
//
// The run itself can take minutes with many queries × engines. On
// Cloud Run we're constrained by the request timeout (300s default);
// if the run exceeds that, we still write partial /aiCitations rows
// (they're written incrementally) and the summary is lost. Split the
// query set if that becomes an issue.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/authGuard';
import { runTracker } from '@/lib/citationTracker';

function verifySchedulerBearer(req: NextRequest): boolean {
  const secret = process.env.CITATION_TRACKER_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  const provided = m[1].trim();
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // cap: 5 min; Vercel/Cloud Run runtime willing

export async function POST(req: NextRequest) {
  // Scheduler path first — cheap check, no DB round-trip.
  const schedulerOk = verifySchedulerBearer(req);
  if (!schedulerOk) {
    // Fall back to admin session auth for manual triggers.
    const guard = await requireAuth(req, { roles: ['admin'] });
    if (!guard.ok) return guard.response;
  }

  try {
    const summary = await runTracker();
    return NextResponse.json({ ok: true, summary });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
