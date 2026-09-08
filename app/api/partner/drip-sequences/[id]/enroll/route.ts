// Enroll recipients into a drip sequence.
//
// Body:
//   { referralIds?: string[], recipientFilter?: { status, leadTag, dealType } }
// One of the two must be provided. Explicit IDs win when both present.
//
// For each enrolled recipient we create a /drip_runs doc that the
// scheduled runner picks up. Suppression is enforced upfront so opted
// -out contacts never even land in a run.
//
// Cap: 500 enrollments per call (matches the mass-send hourly limit).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { checkRateLimit, resetHeaderSeconds } from '@/lib/rateLimiter';
import { filterOutSuppressed } from '@/lib/suppression';
import { FUNDED_STATUSES, LOST_STATUSES } from '@/lib/crmHelpers';

const MAX_ENROLL = 500;
const ENROLL_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  // Distributed rate limit — same budget as mass-send since drip
  // enrollment eventually spawns comparable outbound volume.
  const rate = await checkRateLimit({
    bucket: 'drip.enroll',
    key: uid,
    windowMs: ENROLL_WINDOW_MS,
    max: MAX_ENROLL,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Enrollment cap: ${MAX_ENROLL}/hour. Try again in ${resetHeaderSeconds(rate)}s.` },
      { status: 429, headers: { 'Retry-After': String(resetHeaderSeconds(rate)) } },
    );
  }

  // Load the sequence + verify ownership.
  const seqSnap = await adminDb.collection('drip_sequences').doc(params.id).get();
  if (!seqSnap.exists) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  const seq = seqSnap.data() || {};
  if (seq.ownerUid !== uid && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!seq.enabled) return NextResponse.json({ error: 'Sequence is disabled — enable it first.' }, { status: 400 });
  const steps: any[] = Array.isArray(seq.steps) ? seq.steps : [];
  if (steps.length === 0) return NextResponse.json({ error: 'Sequence has no steps.' }, { status: 400 });

  // Resolve recipients.
  const body = await req.json().catch(() => ({} as any));
  const explicitIds: string[] = Array.isArray(body?.referralIds) ? body.referralIds : [];
  const filter = body?.recipientFilter || {};

  let recipients: any[] = [];
  if (explicitIds.length > 0) {
    // Fetch by explicit IDs, still enforce owner-scope unless admin.
    const refs = explicitIds.slice(0, MAX_ENROLL).map(id => adminDb!.collection('referrals').doc(id));
    const snaps = await adminDb.getAll(...refs);
    recipients = snaps
      .filter(s => s.exists)
      .map(s => ({ id: s.id, ...(s.data() as any) }))
      .filter(r => role === 'admin' || r.assignedAgentId === uid);
  } else {
    let query: FirebaseFirestore.Query = adminDb.collection('referrals');
    if (role !== 'admin' || filter.assignedToMe !== false) {
      query = query.where('assignedAgentId', '==', uid);
    }
    if (filter.status)   query = query.where('status', '==', filter.status);
    if (filter.leadTag)  query = query.where('leadTag', '==', filter.leadTag);
    if (filter.dealType) query = query.where('dealType', '==', filter.dealType);
    const snap = await query.limit(MAX_ENROLL * 5).get();
    recipients = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    recipients = recipients.filter(r => !FUNDED_STATUSES.includes(r.status) && !LOST_STATUSES.includes(r.status));
  }

  recipients = recipients
    .filter(r => !!String(r.clientEmail || '').trim())
    .slice(0, MAX_ENROLL);

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No eligible recipients.' }, { status: 400 });
  }

  // Suppression filter (Wave E-2 integration).
  let suppressedCount = 0;
  if (seq.respectSuppression !== false) {
    const emails = recipients.map(r => String(r.clientEmail).trim().toLowerCase());
    const suppressed = await filterOutSuppressed(emails);
    const before = recipients.length;
    recipients = recipients.filter(r => !suppressed.has(String(r.clientEmail).trim().toLowerCase()));
    suppressedCount = before - recipients.length;
  }

  // Skip anyone already actively enrolled in THIS sequence (avoids
  // double-enrolling the same client if the same button gets hit
  // twice).
  const referralIds = recipients.map(r => r.id);
  const existingSet = new Set<string>();
  const chunkSize = 30;
  for (let i = 0; i < referralIds.length; i += chunkSize) {
    const chunk = referralIds.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    const existing = await adminDb.collection('drip_runs')
      .where('sequenceId', '==', params.id)
      .where('referralId', 'in', chunk)
      .where('status', '==', 'active')
      .get();
    existing.forEach(d => existingSet.add((d.data() as any).referralId));
  }
  const alreadyEnrolledCount = existingSet.size;
  recipients = recipients.filter(r => !existingSet.has(r.id));

  if (recipients.length === 0) {
    return NextResponse.json({
      error: 'All targeted recipients are already active in this sequence.',
      alreadyEnrolledCount,
      suppressedCount,
    }, { status: 400 });
  }

  const now = Date.now();
  const totalSteps = steps.length;
  const firstWaitDays = Math.max(0, Number(steps[0].waitDaysAfterEnroll || 0));
  const firstFireAt = new Date(now + firstWaitDays * 86400_000);

  // Batch-create the run docs.
  const runs = adminDb.collection('drip_runs');
  let batch = adminDb.batch();
  let batchCount = 0;
  let enrolled = 0;
  for (const r of recipients) {
    const ref = runs.doc();
    batch.set(ref, {
      sequenceId: params.id,
      ownerUid: uid,
      tenantId: 'indibrick',
      referralId: r.id,
      recipientEmail: String(r.clientEmail).trim().toLowerCase(),
      status: 'active',
      currentStepIndex: 0,
      nextFireAt: firstFireAt,
      enrolledAt: FieldValue.serverTimestamp(),
      totalSteps,
      fireHistory: [],
      // Branch state. Every run starts unassigned; /api/segment moves it when
      // the recipient picks a buyer type, and the runner forces 'non-opener'
      // if nothing is opened by the sequence's nonOpenerCheckDay. Steps with
      // no requiresSegment gate ignore this entirely, so sequences written
      // before branching existed are unaffected.
      segment: 'unassigned',
      openedAny: false,
    });
    batchCount += 1;
    enrolled += 1;
    if (batchCount >= 400) { await batch.commit(); batch = adminDb.batch(); batchCount = 0; }
  }
  if (batchCount > 0) await batch.commit();

  // Bump the sequence stats.
  await seqSnap.ref.update({
    enrollmentCount: FieldValue.increment(enrolled),
    activeRuns: FieldValue.increment(enrolled),
  });

  return NextResponse.json({
    success: true,
    enrolled,
    suppressedCount,
    alreadyEnrolledCount,
    firstFireAt: firstFireAt.toISOString(),
  });
}
