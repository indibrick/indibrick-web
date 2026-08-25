// System health snapshot for the operator dashboard.
//
// Checks:
//   - /mail queue backlog (docs older than 5min without delivery)
//   - Trigger Email extension delivery errors (last 24h)
//   - Active drip runs + oldest overdue
//   - Recent workflow errorCount aggregate
//   - Cross-sell flags open + oldest
//   - Signing secrets configured (unsub + invite)
//   - Overall traffic light
//
// Cheap enough to run on-demand — bounded queries + counters. If it
// starts costing more than a few reads per open, migrate to a
// scheduled aggregator writing to /system_health.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

const D24 = 24 * 3600_000;
const M5 = 5 * 60_000;

interface HealthCheck {
  name: string;
  status: 'ok' | 'warn' | 'bad';
  detail: string;
}

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const checks: HealthCheck[] = [];
  const nowMs = Date.now();

  // Mail backlog — docs enqueued but not delivered after 5 min.
  const mailSnap = await adminDb.collection('mail').limit(5000).get();
  let queued = 0;
  let backlog = 0;
  let delivered24h = 0;
  let errored24h = 0;
  for (const d of mailSnap.docs) {
    const m = d.data() as any;
    const state = m.delivery?.state;
    const ts = m._sentAt ? new Date(m._sentAt).getTime() : 0;
    if (!state || state === 'PENDING' || state === 'PROCESSING') {
      queued += 1;
      if (ts && nowMs - ts > M5) backlog += 1;
    }
    const endMs = m.delivery?.endTime ? new Date(m.delivery.endTime).getTime() : 0;
    if (endMs && nowMs - endMs <= D24) {
      if (state === 'SUCCESS') delivered24h += 1;
      if (state === 'ERROR' || state === 'FAILED') errored24h += 1;
    }
  }
  checks.push({
    name: 'Mail queue',
    status: backlog > 50 ? 'bad' : backlog > 5 ? 'warn' : 'ok',
    detail: `${queued} queued, ${backlog} stuck >5min, ${delivered24h} delivered / ${errored24h} errored (24h)`,
  });

  // Drip runs — active + overdue.
  const dripSnap = await adminDb.collection('drip_runs')
    .where('status', '==', 'active').limit(5000).get();
  let overdueRuns = 0;
  let oldestOverdueMs = 0;
  for (const d of dripSnap.docs) {
    const r = d.data() as any;
    const nextAt = r.nextRunAt ? new Date(r.nextRunAt).getTime() : 0;
    if (nextAt && nowMs > nextAt) {
      overdueRuns += 1;
      const overshoot = nowMs - nextAt;
      if (overshoot > oldestOverdueMs) oldestOverdueMs = overshoot;
    }
  }
  const overdueMin = Math.round(oldestOverdueMs / 60000);
  checks.push({
    name: 'Drip runner',
    status: overdueMin > 60 ? 'bad' : overdueMin > 10 ? 'warn' : 'ok',
    detail: `${dripSnap.size} active, ${overdueRuns} overdue${overdueMin > 0 ? ` (oldest ${overdueMin}m past due)` : ''}`,
  });

  // Workflow error tallies — sum across enabled workflows.
  const wfSnap = await adminDb.collection('workflows').limit(500).get();
  let wfEnabled = 0;
  let wfErrors = 0;
  for (const d of wfSnap.docs) {
    const w = d.data() as any;
    if (w.enabled !== false) wfEnabled += 1;
    wfErrors += Number(w.errorCount || 0);
  }
  checks.push({
    name: 'Workflows',
    status: wfErrors > 20 ? 'bad' : wfErrors > 0 ? 'warn' : 'ok',
    detail: `${wfEnabled}/${wfSnap.size} enabled, ${wfErrors} lifetime errors`,
  });

  // Cross-sell flags — open + oldest.
  try {
    const csSnap = await adminDb.collection('crossSellFlags')
      .where('status', '==', 'open').limit(1000).get();
    let oldestFlagMs = 0;
    for (const d of csSnap.docs) {
      const f = d.data() as any;
      const t = f.createdAtIso ? new Date(f.createdAtIso).getTime() : 0;
      if (t && (nowMs - t) > oldestFlagMs) oldestFlagMs = nowMs - t;
    }
    const oldestHours = Math.round(oldestFlagMs / 3600_000);
    checks.push({
      name: 'Cross-sell flags',
      status: oldestHours > 72 ? 'warn' : 'ok',
      detail: `${csSnap.size} open${oldestHours > 0 ? ` (oldest ${oldestHours}h)` : ''}`,
    });
  } catch {
    checks.push({ name: 'Cross-sell flags', status: 'warn', detail: 'query failed — collection may not exist yet' });
  }

  // Config presence — signing secrets.
  const cfgFlags: HealthCheck[] = [];
  cfgFlags.push({
    name: 'UNSUBSCRIBE_SIGNING_SECRET',
    status: process.env.UNSUBSCRIBE_SIGNING_SECRET ? 'ok' : 'bad',
    detail: process.env.UNSUBSCRIBE_SIGNING_SECRET ? 'configured' : 'unset — using DEV fallback',
  });
  cfgFlags.push({
    name: 'INVITE_SIGNING_SECRET',
    status: process.env.INVITE_SIGNING_SECRET ? 'ok' : 'bad',
    detail: process.env.INVITE_SIGNING_SECRET ? 'configured' : 'unset — using DEV fallback',
  });
  cfgFlags.push({
    name: 'MAIL_PROVIDER',
    status: 'ok',
    detail: process.env.MAIL_PROVIDER || 'trigger-email (default)',
  });
  checks.push(...cfgFlags);

  const worst = checks.some(c => c.status === 'bad')
    ? 'bad'
    : checks.some(c => c.status === 'warn')
      ? 'warn' : 'ok';

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    overall: worst,
    checks,
    summary: {
      mailQueued: queued,
      mailBacklog: backlog,
      mailDelivered24h: delivered24h,
      mailErrored24h: errored24h,
      dripActive: dripSnap.size,
      dripOverdue: overdueRuns,
      workflowsEnabled: wfEnabled,
      workflowErrors: wfErrors,
    },
  });
}
