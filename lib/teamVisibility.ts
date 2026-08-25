// Team-scoped visibility helper.
//
// A caller's "team visibility set" is the union of:
//   - their own uid
//   - the owner + all members of any team where they are either
//     the owner or a member
//
// Any referral (or timeline / analytics row) whose owning uid is
// inside this set is legitimately visible to the caller.
//
// Kept intentionally small and cache-free: the /teams collection is
// tiny (one doc per brokerage, cap 50 members), so a single lookup
// per request is cheap. If we ever run this in a hot request path,
// wrap with a per-request memo.

import { adminDb } from './firebaseAdmin';

export async function resolveTeamVisibleUids(uid: string): Promise<string[]> {
  if (!adminDb || !uid) return [uid].filter(Boolean);
  const set = new Set<string>([uid]);

  const [ownedSnap, memberSnap] = await Promise.all([
    adminDb.collection('teams').where('ownerUid', '==', uid).limit(1).get(),
    adminDb.collection('teams').where('memberUids', 'array-contains', uid).limit(5).get(),
  ]);

  for (const d of ownedSnap.docs) {
    const t = d.data() as any;
    if (t.ownerUid) set.add(t.ownerUid);
    for (const m of (t.memberUids || [])) set.add(m);
  }
  for (const d of memberSnap.docs) {
    const t = d.data() as any;
    if (t.ownerUid) set.add(t.ownerUid);
    for (const m of (t.memberUids || [])) set.add(m);
  }
  return Array.from(set);
}

// Row-level check — does this caller have team-scoped visibility of
// this referral doc? Combines the classic access rules (owner,
// assignee, listed participant) with team membership.
export function isReferralVisibleToTeam(
  callerUid: string,
  teamVisibleUids: string[],
  doc: { referrerId?: string; assignedAgentId?: string; participantIds?: string[] },
): boolean {
  if (doc.referrerId && doc.referrerId === callerUid) return true;
  if (doc.assignedAgentId && doc.assignedAgentId === callerUid) return true;
  if (Array.isArray(doc.participantIds) && doc.participantIds.includes(callerUid)) return true;
  if (doc.referrerId && teamVisibleUids.includes(doc.referrerId)) return true;
  if (doc.assignedAgentId && teamVisibleUids.includes(doc.assignedAgentId)) return true;
  return false;
}
