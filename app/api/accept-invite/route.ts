// Invite consumption. The invitee has signed into Firebase Auth
// (any provider) as `session.email`, they submit this endpoint with
// the signed token. We verify:
//   1) The token signature is valid + unexpired.
//   2) The invite doc still exists + status === 'pending'.
//   3) The signed-in email matches the invited email (case-insensitive).
// On success we set role on /users/{uid} and mark the invite consumed.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { verifyInviteToken } from '@/lib/inviteToken';

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, email } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  const token = String(body?.token || '');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const verified = verifyInviteToken(token);
  if (!verified.ok || !verified.payload) {
    return NextResponse.json({ error: `invalid token: ${verified.error}` }, { status: 400 });
  }
  const { inviteId, email: invitedEmail, role } = verified.payload;

  const authedEmail = String(email || '').trim().toLowerCase();
  if (!authedEmail) {
    return NextResponse.json({ error: 'Your account has no verified email.' }, { status: 400 });
  }
  if (authedEmail !== invitedEmail) {
    return NextResponse.json({
      error: `This invite is for ${invitedEmail}. You're signed in as ${authedEmail}.`,
    }, { status: 403 });
  }

  const inviteRef = adminDb.collection('invites').doc(inviteId);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) return NextResponse.json({ error: 'Invite not found.' }, { status: 404 });
  const invite = inviteSnap.data() || {};
  if (invite.status !== 'pending') {
    return NextResponse.json({ error: `Invite already ${invite.status}.` }, { status: 409 });
  }

  const nowIso = new Date().toISOString();
  await adminDb.collection('users').doc(uid).set({
    email: authedEmail,
    role,
    tenantId: invite.tenantId || 'indibrick',
    acceptedInviteId: inviteId,
    acceptedAt: nowIso,
  }, { merge: true });

  // Wave K-5: auto-join the inviter's team if one was set on the
  // invite token. We validate that the team still exists, is still
  // owned by the invitedBy uid on the token, and hasn't been
  // disbanded since. If any check fails we silently skip — the
  // invite still succeeds, the invitee lands with just their role.
  let joinedTeamId: string | null = null;
  const teamId = verified.payload.teamId;
  if (teamId) {
    try {
      const teamRef = adminDb.collection('teams').doc(teamId);
      const teamSnap = await teamRef.get();
      if (teamSnap.exists) {
        const t = teamSnap.data() || {};
        if (t.ownerUid === verified.payload.invitedBy) {
          const members: string[] = Array.isArray(t.memberUids) ? t.memberUids : [];
          if (!members.includes(uid) && t.ownerUid !== uid) {
            await teamRef.update({
              memberUids: FieldValue.arrayUnion(uid),
              updatedAt: FieldValue.serverTimestamp(),
            });
            joinedTeamId = teamId;
            // Best-effort visibility sync — the invitee's uid needs
            // to appear on every existing team referral's
            // teamVisibleUids so client-side rules grant access.
            const nextRoster = [t.ownerUid, ...members, uid];
            // Fire and forget; no need to block the response.
            void syncNewMemberVisibility(nextRoster);
          }
        }
      }
    } catch (e) {
      console.warn('[accept-invite] team auto-join failed', e);
    }
  }

  await inviteRef.update({
    status: 'accepted',
    acceptedByUid: uid,
    acceptedAt: nowIso,
    joinedTeamId,
  });

  return NextResponse.json({ ok: true, role, joinedTeamId });
}

// Duplicates the sync helper in /api/partner/team/route.ts —
// intentional; keeps this endpoint free of a cross-route import.
async function syncNewMemberVisibility(rosterUids: string[]) {
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
    batch.update(d.ref, { teamVisibleUids: rosterUids });
    count += 1;
    if (count >= 400) { await batch.commit(); batch = adminDb.batch(); count = 0; }
  }
  if (count > 0) await batch.commit();
}
