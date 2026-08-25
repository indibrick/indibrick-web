// Team CRUD.
//
// The caller can:
//   GET     - fetch the team they own (or a team they're a member of;
//             owner-first if they own multiple, which is not expected).
//   POST    - create a team owned by them. One team per owner today —
//             we return the existing team if they call POST again.
//   PATCH   - rename their team (owner only).
//   PATCH?add=<uid> or ?remove=<uid> — membership changes (owner only).
//   DELETE  - delete team (owner only). Membership is discarded; no
//             cascade into referrals since ACL isn't wired to teams
//             yet (see lib/teamShape.ts note).

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { validateTeamCreate, validateMembership } from '@/lib/teamShape';

async function findTeamForUser(uid: string) {
  if (!adminDb) return null;
  const ownedSnap = await adminDb.collection('teams')
    .where('ownerUid', '==', uid).limit(1).get();
  if (!ownedSnap.empty) {
    const d = ownedSnap.docs[0];
    return { id: d.id, ...(d.data() as any), _relation: 'owner' as const };
  }
  const memberSnap = await adminDb.collection('teams')
    .where('memberUids', 'array-contains', uid).limit(1).get();
  if (!memberSnap.empty) {
    const d = memberSnap.docs[0];
    return { id: d.id, ...(d.data() as any), _relation: 'member' as const };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const team = await findTeamForUser(uid);
  if (!team) return NextResponse.json({ team: null, members: [] });

  // Resolve owner + members into human-readable rows. Cheap since
  // team roster is capped at 50 and we already have the uids.
  const uids = Array.from(new Set([team.ownerUid, ...(team.memberUids || [])]));
  const memberDocs = await Promise.all(uids.map(u => adminDb!.collection('users').doc(u).get()));
  const members = memberDocs.map((snap, i) => {
    const u = uids[i];
    const d = snap.exists ? (snap.data() as any) : null;
    return {
      uid: u,
      email: d?.email || null,
      displayName: d?.displayName || null,
      role: d?.role || null,
      relation: u === team.ownerUid ? 'owner' : 'member',
    };
  });
  return NextResponse.json({ team, members });
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const errors = validateTeamCreate(body);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const existing = await findTeamForUser(uid);
  if (existing && existing._relation === 'owner') {
    // Idempotent — return the current team instead of duplicating.
    return NextResponse.json({ team: existing, note: 'existing team returned' });
  }
  if (existing && existing._relation === 'member') {
    return NextResponse.json({ error: 'You are already a member of a team.' }, { status: 409 });
  }

  const doc = {
    name: String(body.name).trim().slice(0, 120),
    ownerUid: uid,
    memberUids: [],
    tenantId: 'indibrick',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await adminDb.collection('teams').add(doc);
  return NextResponse.json({ team: { id: ref.id, ...doc, _relation: 'owner' } });
}

// Resolve an email to a Firebase Auth uid. Falls through to
// /users collection lookup for accounts where auth email hasn't
// been indexed yet. Returns null on no match — caller decides how
// to surface that ("no such user — send them an invite first").
async function resolveEmailToUid(email: string): Promise<string | null> {
  if (!adminDb) return null;
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
  try {
    const { getAuth } = await import('firebase-admin/auth');
    const authUser = await getAuth().getUserByEmail(normalized);
    if (authUser?.uid) return authUser.uid;
  } catch {
    // fall through to /users lookup
  }
  const snap = await adminDb.collection('users')
    .where('email', '==', normalized).limit(1).get();
  if (!snap.empty) return snap.docs[0].id;
  return null;
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  let add = searchParams.get('add') || undefined;
  let remove = searchParams.get('remove') || undefined;
  const addEmail = searchParams.get('addEmail') || undefined;
  const removeEmail = searchParams.get('removeEmail') || undefined;
  const body = await req.json().catch(() => ({} as any));

  const team = await findTeamForUser(uid);
  if (!team) return NextResponse.json({ error: 'No team.' }, { status: 404 });
  if (team.ownerUid !== uid) return NextResponse.json({ error: 'Owner only.' }, { status: 403 });

  // Resolve email → uid on the server. Email is the humane input for
  // the UI — an operator shouldn't have to know Firebase uids.
  if (addEmail && !add) {
    const resolved = await resolveEmailToUid(addEmail);
    if (!resolved) {
      return NextResponse.json({
        error: `No IndiBrick account for ${addEmail}. Invite them first from /admin/invites, then add them here after they sign in.`,
      }, { status: 404 });
    }
    add = resolved;
  }
  if (removeEmail && !remove) {
    const resolved = await resolveEmailToUid(removeEmail);
    if (!resolved) return NextResponse.json({ error: `No account for ${removeEmail}.` }, { status: 404 });
    remove = resolved;
  }

  const errs = validateMembership(team.memberUids || [], add, remove);
  if (errs.length > 0) return NextResponse.json({ errors: errs }, { status: 400 });

  const patch: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof body.name === 'string' && body.name.trim()) {
    patch.name = String(body.name).trim().slice(0, 120);
  }
  if (add) {
    if (add === uid) return NextResponse.json({ error: 'Cannot add owner as member.' }, { status: 400 });
    patch.memberUids = FieldValue.arrayUnion(add);
  }
  if (remove) {
    patch.memberUids = FieldValue.arrayRemove(remove);
  }

  await adminDb.collection('teams').doc(team.id).update(patch);

  // Sync teamVisibleUids on every referral owned by any team member
  // so client-side firestore.rules can grant team read/write without
  // the server having to join to /teams on every request.
  //
  // Runs synchronously so the caller gets a consistent state back —
  // the roster is capped at 50 members which keeps the referral scan
  // bounded. If we outgrow that, move to a Cloud Function trigger on
  // /teams writes and drop this inline call.
  try {
    const nextRoster = new Set<string>([team.ownerUid, ...(team.memberUids || [])]);
    if (add) nextRoster.add(add);
    if (remove) nextRoster.delete(remove);
    await syncTeamVisibility(Array.from(nextRoster));
  } catch (e) {
    console.warn('[team] visibility sync failed', e);
  }

  return NextResponse.json({ ok: true, resolvedUid: add || remove || null });
}

// Stamp teamVisibleUids on every referral owned by any uid in the
// given roster. Batched writes (Firestore cap 500 per batch); we
// cap the total scan at 5000 referrals which is well beyond any
// realistic single-brokerage volume.
async function syncTeamVisibility(rosterUids: string[]) {
  if (!adminDb || rosterUids.length === 0) return;
  const roster = rosterUids.slice(0, 30); // Firestore `in` cap
  const [assignedSnap, referredSnap] = await Promise.all([
    adminDb.collection('referrals').where('assignedAgentId', 'in', roster).limit(2500).get(),
    adminDb.collection('referrals').where('referrerId', 'in', roster).limit(2500).get(),
  ]);
  const seen = new Set<string>();
  const docs: FirebaseFirestore.DocumentSnapshot[] = [];
  for (const d of [...assignedSnap.docs, ...referredSnap.docs]) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    docs.push(d);
  }
  if (docs.length === 0) return;

  let batch = adminDb.batch();
  let count = 0;
  for (const d of docs) {
    batch.update(d.ref, { teamVisibleUids: rosterUids });
    count += 1;
    if (count >= 400) {
      await batch.commit();
      batch = adminDb.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const team = await findTeamForUser(uid);
  if (!team) return NextResponse.json({ error: 'No team.' }, { status: 404 });
  if (team.ownerUid !== uid) return NextResponse.json({ error: 'Owner only.' }, { status: 403 });

  const oldRoster = [team.ownerUid, ...(team.memberUids || [])];
  await adminDb.collection('teams').doc(team.id).delete();

  // Clear teamVisibleUids on every affected referral so team-scoped
  // access ends immediately with disband. Leave classic ACL intact.
  try {
    await clearTeamVisibility(oldRoster);
  } catch (e) {
    console.warn('[team] visibility clear failed', e);
  }
  return NextResponse.json({ ok: true });
}

async function clearTeamVisibility(rosterUids: string[]) {
  if (!adminDb || rosterUids.length === 0) return;
  const roster = rosterUids.slice(0, 30);
  const [assignedSnap, referredSnap] = await Promise.all([
    adminDb.collection('referrals').where('assignedAgentId', 'in', roster).limit(2500).get(),
    adminDb.collection('referrals').where('referrerId', 'in', roster).limit(2500).get(),
  ]);
  const seen = new Set<string>();
  const docs: FirebaseFirestore.DocumentSnapshot[] = [];
  for (const d of [...assignedSnap.docs, ...referredSnap.docs]) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    docs.push(d);
  }
  if (docs.length === 0) return;

  let batch = adminDb.batch();
  let count = 0;
  for (const d of docs) {
    batch.update(d.ref, { teamVisibleUids: FieldValue.delete() });
    count += 1;
    if (count >= 400) {
      await batch.commit();
      batch = adminDb.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}
