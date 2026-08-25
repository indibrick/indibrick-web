// Dry-run a stored workflow against a chosen (or auto-picked) sample
// referral. No writes, no dispatches — the interpreter reports what
// WOULD happen so an admin can preview before enabling / editing.
//
// Body:
//   { referralId?: string, mockAfter?: object }
//     referralId — evaluate against the current state of that deal
//                  (before = null so triggers like "created" fire; if
//                  the workflow needs a status change, pass mockAfter
//                  with a different status).
//     mockAfter  — optional patch merged onto the referral's data.
//                  For "status changed to Firm Sale" you'd send
//                  { referralId, mockAfter: { status: 'Firm Sale' } }.
//   With no body: picks the most recent referral as the sample and
//   assumes "created" semantics (before = null).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { dryRunWorkflow, type StoredWorkflow, type ReferralLike } from '@/lib/workflowInterpreter';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin', 'internal_agent'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const wfSnap = await adminDb.collection('workflows').doc(params.id).get();
  if (!wfSnap.exists) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  const wf = { id: wfSnap.id, ...(wfSnap.data() as any) } as StoredWorkflow;

  const body = await req.json().catch(() => ({}));
  const explicitReferralId: string | undefined = body?.referralId;
  const mockAfter: Record<string, any> | undefined = body?.mockAfter;
  const treatAsCreate: boolean = body?.treatAsCreate !== false; // default true

  // Pick a sample referral.
  let referral: ReferralLike | null = null;
  if (explicitReferralId) {
    const s = await adminDb.collection('referrals').doc(explicitReferralId).get();
    if (!s.exists) return NextResponse.json({ error: 'Sample referralId not found' }, { status: 404 });
    referral = { id: s.id, ...(s.data() as any) };
  } else {
    const recent = await adminDb.collection('referrals').orderBy('referralDate', 'desc').limit(1).get();
    if (recent.empty) return NextResponse.json({ error: 'No referrals available to sample. Create one first.' }, { status: 404 });
    const d = recent.docs[0];
    referral = { id: d.id, ...(d.data() as any) };
  }

  // Build after = referral + mockAfter overrides.
  const after: ReferralLike = { ...referral, ...(mockAfter || {}) };
  const before: ReferralLike | null = treatAsCreate ? null : referral;

  const result = dryRunWorkflow(wf, before, after);

  return NextResponse.json({
    workflow: { id: wf.id, name: wf.name, triggerType: wf.triggerType },
    sampleReferralId: after.id,
    ...result,
  });
}
