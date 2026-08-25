// Team-scoped report — one row per team member with production
// numbers + drip / deliverability performance. Only the team owner
// can pull this; members see the aggregate but not the per-teammate
// breakout (that's a manager-view convention: individual teammates
// look at their own numbers in /partner/settings > My Ads, not each
// other's).
//
// Cheap on scale: at 50 members we scan ≤ 2 × 30-uid Firestore `in`
// batches for referrals, one for drip runs, one for email events.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { FUNDED_STATUSES } from '@/lib/crmHelpers';

const D30 = 30 * 86400_000;

async function findOwnedTeam(uid: string) {
  if (!adminDb) return null;
  const snap = await adminDb.collection('teams').where('ownerUid', '==', uid).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as any) };
}

interface Row {
  uid: string;
  displayName: string | null;
  email: string | null;
  relation: 'owner' | 'member';
  referrals30d: number;
  funded30d: number;
  fundedVolume30d: number;
  activeDripRuns: number;
  emailsSent30d: number;
  emailBounces30d: number;
  emailComplaints30d: number;
}

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const team = await findOwnedTeam(uid);
  if (!team) return NextResponse.json({ error: 'You do not own a team.' }, { status: 404 });

  const rosterUids = Array.from(new Set<string>([team.ownerUid, ...(team.memberUids || [])]));
  if (rosterUids.length === 0) return NextResponse.json({ team, rows: [] });

  // Resolve names + emails in one pass.
  const memberDocs = await Promise.all(rosterUids.map(u => adminDb!.collection('users').doc(u).get()));
  const meta = new Map<string, { email: string | null; displayName: string | null }>();
  memberDocs.forEach((snap, i) => {
    const u = rosterUids[i];
    const d = snap.exists ? (snap.data() as any) : null;
    meta.set(u, { email: d?.email || null, displayName: d?.displayName || null });
  });

  const nowMs = Date.now();
  const cutoffMs = nowMs - D30;

  // 1) Referrals within trailing 30d (both assigned + referrer).
  const referrals30d = new Map<string, { count: number; funded: number; volume: number }>();
  for (const rosterChunk of chunkArray(rosterUids, 30)) {
    const [assigned, referred] = await Promise.all([
      adminDb.collection('referrals').where('assignedAgentId', 'in', rosterChunk).limit(5000).get(),
      adminDb.collection('referrals').where('referrerId', 'in', rosterChunk).limit(5000).get(),
    ]);
    const seen = new Set<string>();
    for (const d of [...assigned.docs, ...referred.docs]) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      const r = d.data() as any;
      const t = r.referralDate ? new Date(r.referralDate).getTime() : 0;
      if (!t || t < cutoffMs) continue;
      const owner = r.assignedAgentId || r.referrerId;
      if (!owner || !rosterUids.includes(owner)) continue;
      const b = referrals30d.get(owner) || { count: 0, funded: 0, volume: 0 };
      b.count += 1;
      if (FUNDED_STATUSES.includes(String(r.status || ''))) {
        b.funded += 1;
        b.volume += Number(r.loanAmount || 0);
      }
      referrals30d.set(owner, b);
    }
  }

  // 2) Active drip runs per uid.
  const dripByUid = new Map<string, number>();
  const dripSnap = await adminDb.collection('drip_runs').where('status', '==', 'active').limit(5000).get();
  for (const d of dripSnap.docs) {
    const owner = (d.data() as any).ownerUid;
    if (!owner || !rosterUids.includes(owner)) continue;
    dripByUid.set(owner, (dripByUid.get(owner) || 0) + 1);
  }

  // 3) Email events (30d) by senderUid.
  const cutoffIso = new Date(cutoffMs).toISOString();
  const evSnap = await adminDb.collection('email_events')
    .where('receivedAt', '>=', cutoffIso).limit(20000).get();
  const evByUid = new Map<string, { sent: number; bounces: number; complaints: number }>();
  for (const d of evSnap.docs) {
    const e = d.data() as any;
    const owner = e.senderUid;
    if (!owner || !rosterUids.includes(owner)) continue;
    const b = evByUid.get(owner) || { sent: 0, bounces: 0, complaints: 0 };
    if (e.type === 'delivered') b.sent += 1;
    if (e.type === 'bounce') b.bounces += 1;
    if (e.type === 'complaint') b.complaints += 1;
    evByUid.set(owner, b);
  }

  const rows: Row[] = rosterUids.map(u => {
    const rMeta = meta.get(u) || { email: null, displayName: null };
    const r = referrals30d.get(u) || { count: 0, funded: 0, volume: 0 };
    const e = evByUid.get(u) || { sent: 0, bounces: 0, complaints: 0 };
    return {
      uid: u,
      displayName: rMeta.displayName,
      email: rMeta.email,
      relation: u === team.ownerUid ? 'owner' : 'member',
      referrals30d: r.count,
      funded30d: r.funded,
      fundedVolume30d: r.volume,
      activeDripRuns: dripByUid.get(u) || 0,
      emailsSent30d: e.sent,
      emailBounces30d: e.bounces,
      emailComplaints30d: e.complaints,
    };
  });

  rows.sort((a, b) => b.referrals30d - a.referrals30d);
  const totals = rows.reduce((acc, r) => ({
    referrals30d: acc.referrals30d + r.referrals30d,
    funded30d: acc.funded30d + r.funded30d,
    fundedVolume30d: acc.fundedVolume30d + r.fundedVolume30d,
    activeDripRuns: acc.activeDripRuns + r.activeDripRuns,
    emailsSent30d: acc.emailsSent30d + r.emailsSent30d,
    emailBounces30d: acc.emailBounces30d + r.emailBounces30d,
    emailComplaints30d: acc.emailComplaints30d + r.emailComplaints30d,
  }), {
    referrals30d: 0, funded30d: 0, fundedVolume30d: 0, activeDripRuns: 0,
    emailsSent30d: 0, emailBounces30d: 0, emailComplaints30d: 0,
  });

  return NextResponse.json({
    team: { id: team.id, name: team.name, ownerUid: team.ownerUid, memberCount: rosterUids.length },
    generatedAt: new Date().toISOString(),
    totals,
    rows,
  });
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
