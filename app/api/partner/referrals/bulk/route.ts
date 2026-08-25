// Bulk PATCH on referrals.
//
// Supports three operations from the pipeline bulk toolbar:
//   - tag       set leadTag on each id
//   - assign    set assignedAgentId + assignedAgentName on each id
//   - archive   set dealCategory: 'archived' (soft archive — no delete)
//
// Access check: caller must be a participant on EVERY referral in the
// batch, or admin. Enforced per-doc inside the transaction so a mixed
// batch with one unauthorized id fails atomically rather than partially
// applying.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { resolveTeamVisibleUids, isReferralVisibleToTeam } from '@/lib/teamVisibility';

const MAX_IDS = 500;

type Op = 'tag' | 'assign' | 'archive';

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role, email } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  const op: Op | undefined = body?.op;
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
  if (!op || !['tag', 'assign', 'archive'].includes(op)) {
    return NextResponse.json({ error: 'op must be tag | assign | archive' }, { status: 400 });
  }
  if (ids.length === 0) return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  if (ids.length > MAX_IDS) return NextResponse.json({ error: `Max ${MAX_IDS} ids per batch` }, { status: 400 });

  const value = body?.value; // shape depends on op
  if (op === 'tag' && (typeof value !== 'string' || value.length === 0 || value.length > 60)) {
    return NextResponse.json({ error: 'value must be a 1-60 char tag string' }, { status: 400 });
  }
  if (op === 'assign' && (typeof value?.uid !== 'string' || value.uid.length === 0)) {
    return NextResponse.json({ error: 'value.uid required for assign' }, { status: 400 });
  }

  // Fetch all in parallel, verify access, then batch write.
  const refs = ids.map(id => adminDb!.collection('referrals').doc(id));
  const snaps = await Promise.all(refs.map(r => r.get()));

  const forbidden: string[] = [];
  const missing: string[] = [];
  const toUpdate: { ref: FirebaseFirestore.DocumentReference; before: any }[] = [];

  // Resolve team-visible uids once for the whole batch — cheap and
  // saves N Firestore reads on a large bulk op.
  const teamUids = role === 'admin' ? [] : await resolveTeamVisibleUids(uid);

  for (let i = 0; i < snaps.length; i++) {
    const snap = snaps[i];
    if (!snap.exists) { missing.push(ids[i]); continue; }
    const data = snap.data() || {};
    let isOn = data.referrerId === uid
              || data.assignedAgentId === uid
              || (Array.isArray(data.participantIds) && data.participantIds.includes(uid));
    if (!isOn && role !== 'admin') isOn = isReferralVisibleToTeam(uid, teamUids, data);
    if (role !== 'admin' && !isOn) { forbidden.push(ids[i]); continue; }
    toUpdate.push({ ref: refs[i], before: data });
  }

  if (forbidden.length > 0) {
    return NextResponse.json({
      error: `You are not on ${forbidden.length} of the selected deal(s). Aborted.`,
      forbidden: forbidden.slice(0, 5),
    }, { status: 403 });
  }
  if (toUpdate.length === 0) {
    return NextResponse.json({ error: 'Nothing to update', missing }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const timelineAuthor = email || uid.slice(0, 8);

  // Batched writes. Firestore ceiling is 500 mutations per commit; we
  // cap at MAX_IDS so we're always under.
  const batch = adminDb.batch();
  for (const { ref } of toUpdate) {
    if (op === 'tag') {
      batch.update(ref, {
        leadTag: value,
        lastUpdated: nowIso,
        lastUpdatedBy: uid,
        timeline: FieldValue.arrayUnion({
          type: 'system',
          author: timelineAuthor,
          content: `🏷️ Bulk-tagged as "${value}"`,
          timestamp: nowIso,
          isSystemMessage: true,
        }),
      });
    } else if (op === 'assign') {
      batch.update(ref, {
        assignedAgentId: value.uid,
        assignedAgentName: value.name || 'Assigned',
        lastUpdated: nowIso,
        lastUpdatedBy: uid,
        timeline: FieldValue.arrayUnion({
          type: 'system',
          author: timelineAuthor,
          content: `👥 Bulk-reassigned to ${value.name || value.uid.slice(0, 8)}`,
          timestamp: nowIso,
          isSystemMessage: true,
        }),
      });
    } else if (op === 'archive') {
      batch.update(ref, {
        dealCategory: 'archived',
        archivedAt: nowIso,
        lastUpdated: nowIso,
        lastUpdatedBy: uid,
        timeline: FieldValue.arrayUnion({
          type: 'system',
          author: timelineAuthor,
          content: `📦 Bulk-archived`,
          timestamp: nowIso,
          isSystemMessage: true,
        }),
      });
    }
  }
  await batch.commit();

  return NextResponse.json({
    success: true,
    updated: toUpdate.length,
    missing,
  });
}
