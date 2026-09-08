// Cross-tenant analytics — one aggregated row per partner + a
// platform totals row. Reads directly from Firestore; no cache. For
// 5-50 partners with a few thousand referrals each this is fine at
// the manual "founder opens the dashboard" cadence. If we ever push
// this into a scheduled job, migrate to a rollup collection.
//
// Metrics per partner:
//   - Total referrals (all time)
//   - Referrals (last 30d)
//   - Funded (last 30d) + funded volume
//   - Active drip runs
//   - Email events (30d) grouped by type
//   - Suppressions accumulated
//
// Admin only.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { FUNDED_STATUSES } from '@/lib/crmHelpers';

interface PartnerRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string | null;
  totalReferrals: number;
  referrals30d: number;
  funded30d: number;
  fundedVolume30d: number;
  activeDripRuns: number;
  emailsSent30d: number;
  emailBounces30d: number;
  emailComplaints30d: number;
  suppressions: number;
  onboardingCompletedAt: string | null;
  managedAdsTier: string | null;
  teamName: string | null;
  teamRelation: 'owner' | 'member' | null;
}

const D30 = 30 * 86400_000;
const PARTNER_ROLES = ['partner_realtor', 'partner_lawyer', 'partner_mortgage', 'partner_insurance', 'internal_agent'];

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const cutoff = new Date(Date.now() - D30);
  const cutoffIso = cutoff.toISOString();

  // 1) Load all partner users.
  const usersSnap = await adminDb.collection('users')
    .where('role', 'in', PARTNER_ROLES)
    .limit(500)
    .get();
  const users = usersSnap.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));

  // 2) Bulk-scan referrals once, bucket per assigned/referrer uid.
  const referralsSnap = await adminDb.collection('referrals').limit(20000).get();

  interface Bucket {
    total: number; last30d: number;
    funded30d: number; fundedVolume30d: number;
  }
  const emptyBucket = (): Bucket => ({ total: 0, last30d: 0, funded30d: 0, fundedVolume30d: 0 });
  const byUid = new Map<string, Bucket>();
  const nowMs = Date.now();

  for (const d of referralsSnap.docs) {
    const r = d.data() as any;
    const owners = new Set<string>();
    if (r.assignedAgentId) owners.add(r.assignedAgentId);
    if (r.referrerId) owners.add(r.referrerId);
    if (owners.size === 0) continue;

    const refDateMs = r.referralDate ? new Date(r.referralDate).getTime() : 0;
    const is30d = refDateMs && (nowMs - refDateMs) <= D30;
    const isFunded = FUNDED_STATUSES.includes(String(r.status || ''));
    const loan = Number(r.loanAmount || 0);

    for (const uid of owners) {
      const b = byUid.get(uid) || emptyBucket();
      b.total += 1;
      if (is30d) b.last30d += 1;
      if (is30d && isFunded) { b.funded30d += 1; b.fundedVolume30d += loan; }
      byUid.set(uid, b);
    }
  }

  // 3) Drip runs — count active per partner.
  const dripSnap = await adminDb.collection('drip_runs')
    .where('status', '==', 'active').limit(5000).get();
  const dripsByUid = new Map<string, number>();
  for (const d of dripSnap.docs) {
    const uid = (d.data() as any).ownerUid;
    if (!uid) continue;
    dripsByUid.set(uid, (dripsByUid.get(uid) || 0) + 1);
  }

  // 4) Email events last 30d — grouped by senderUid + type.
  const evSnap = await adminDb.collection('email_events')
    .where('receivedAt', '>=', cutoffIso).limit(20000).get();
  const evByUid = new Map<string, { sent: number; bounces: number; complaints: number }>();
  for (const d of evSnap.docs) {
    const e = d.data() as any;
    const uid = e.senderUid;
    if (!uid) continue;
    const b = evByUid.get(uid) || { sent: 0, bounces: 0, complaints: 0 };
    if (e.type === 'delivered') b.sent += 1;
    if (e.type === 'bounce') b.bounces += 1;
    if (e.type === 'complaint') b.complaints += 1;
    evByUid.set(uid, b);
  }

  // 5) Suppressions per senderUid.
  const suppSnap = await adminDb.collection('unsubscribes').limit(20000).get();
  const suppByUid = new Map<string, number>();
  for (const d of suppSnap.docs) {
    const uid = (d.data() as any).senderUid;
    if (!uid) continue;
    suppByUid.set(uid, (suppByUid.get(uid) || 0) + 1);
  }

  // 6) Team membership index — one lookup per uid, so this scales to
  // any team count.
  const teamsSnap = await adminDb.collection('teams').limit(500).get();
  const teamByUid = new Map<string, { name: string; relation: 'owner' | 'member' }>();
  for (const d of teamsSnap.docs) {
    const t = d.data() as any;
    if (t.ownerUid) teamByUid.set(t.ownerUid, { name: t.name || 'Unnamed team', relation: 'owner' });
    for (const m of (t.memberUids || [])) {
      // Owner wins if a uid appears in both (shouldn't, but defensive).
      if (!teamByUid.has(m)) teamByUid.set(m, { name: t.name || 'Unnamed team', relation: 'member' });
    }
  }

  // 6) Assemble rows.
  const rows: PartnerRow[] = users.map(u => {
    const b = byUid.get(u.uid) || { total: 0, last30d: 0, funded30d: 0, fundedVolume30d: 0 };
    const ev = evByUid.get(u.uid) || { sent: 0, bounces: 0, complaints: 0 };
    return {
      uid: u.uid,
      email: u.email || null,
      displayName: u.displayName || null,
      role: u.role || null,
      totalReferrals: b.total,
      referrals30d: b.last30d,
      funded30d: b.funded30d,
      fundedVolume30d: b.fundedVolume30d,
      activeDripRuns: dripsByUid.get(u.uid) || 0,
      emailsSent30d: ev.sent,
      emailBounces30d: ev.bounces,
      emailComplaints30d: ev.complaints,
      suppressions: suppByUid.get(u.uid) || 0,
      onboardingCompletedAt: u.onboardingCompletedAt || null,
      managedAdsTier: u.managedAds?.tier || null,
      teamName: teamByUid.get(u.uid)?.name || null,
      teamRelation: teamByUid.get(u.uid)?.relation || null,
    };
  });

  rows.sort((a, b) => b.referrals30d - a.referrals30d);

  const totals = rows.reduce((acc, r) => ({
    partners: acc.partners + 1,
    activePartners30d: acc.activePartners30d + (r.referrals30d > 0 ? 1 : 0),
    totalReferrals: acc.totalReferrals + r.totalReferrals,
    referrals30d: acc.referrals30d + r.referrals30d,
    funded30d: acc.funded30d + r.funded30d,
    fundedVolume30d: acc.fundedVolume30d + r.fundedVolume30d,
    emailsSent30d: acc.emailsSent30d + r.emailsSent30d,
    emailBounces30d: acc.emailBounces30d + r.emailBounces30d,
    emailComplaints30d: acc.emailComplaints30d + r.emailComplaints30d,
    activeDripRuns: acc.activeDripRuns + r.activeDripRuns,
    suppressions: acc.suppressions + r.suppressions,
  }), {
    partners: 0, activePartners30d: 0, totalReferrals: 0, referrals30d: 0,
    funded30d: 0, fundedVolume30d: 0, emailsSent30d: 0,
    emailBounces30d: 0, emailComplaints30d: 0, activeDripRuns: 0, suppressions: 0,
  });

  const bounceRate30d = totals.emailsSent30d > 0
    ? Math.round((totals.emailBounces30d / totals.emailsSent30d) * 10000) / 100
    : null;
  const complaintRate30d = totals.emailsSent30d > 0
    ? Math.round((totals.emailComplaints30d / totals.emailsSent30d) * 10000) / 100
    : null;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    totals: { ...totals, bounceRate30d, complaintRate30d },
    rows,
  });
}
