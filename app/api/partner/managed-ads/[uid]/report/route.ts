// Per-client attribution report.
//
// Scans referrals where assignedAgentId or referrerId = the target
// uid, then rolls them up by attribution.campaign / attribution.source.
// Also joins against funded conversions to produce the "ad dollars →
// funded deals" number that's the whole Managed Ads pitch.
//
// Admin only. Cap: last 5000 referrals for the target — beyond that,
// UI would need pagination anyway.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { FUNDED_STATUSES, LOST_STATUSES } from '@/lib/crmHelpers';

interface Bucket {
  key: string;
  leads: number;
  contacted: number;
  active: number;
  funded: number;
  lost: number;
  fundedValue: number;   // sum of loanAmount for funded deals in bucket
  fundedCommission: number;
}

function emptyBucket(key: string): Bucket {
  return {
    key,
    leads: 0, contacted: 0, active: 0, funded: 0, lost: 0,
    fundedValue: 0, fundedCommission: 0,
  };
}

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  // Admins can view any partner's report; a partner can view their own.
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const targetUid = params.uid;
  if (!targetUid) return NextResponse.json({ error: 'uid required' }, { status: 400 });

  const isAdmin = guard.session.role === 'admin';
  const isSelf = guard.session.uid === targetUid;
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Pull the client's managedAds profile so the report can echo it.
  const userSnap = await adminDb.collection('users').doc(targetUid).get();
  const user = userSnap.exists ? (userSnap.data() || {}) : {};
  const managedAds = user.managedAds || null;

  // Scan up to 5k of their referrals (both assignments + referrals-in).
  const assignedSnap = await adminDb.collection('referrals')
    .where('assignedAgentId', '==', targetUid).limit(5000).get();
  const referredSnap = await adminDb.collection('referrals')
    .where('referrerId', '==', targetUid).limit(5000).get();
  const seen = new Set<string>();
  const referrals: any[] = [];
  for (const d of assignedSnap.docs) { if (!seen.has(d.id)) { seen.add(d.id); referrals.push({ id: d.id, ...(d.data() as any) }); } }
  for (const d of referredSnap.docs) { if (!seen.has(d.id)) { seen.add(d.id); referrals.push({ id: d.id, ...(d.data() as any) }); } }

  // Roll up.
  const bySource = new Map<string, Bucket>();
  const byCampaign = new Map<string, Bucket>();
  const summary = emptyBucket('__all__');

  for (const r of referrals) {
    const status = String(r.status || '');
    const isFunded = FUNDED_STATUSES.includes(status);
    const isLost   = LOST_STATUSES.includes(status);
    const isContacted = (r.callCount || 0) > 0 || (status !== 'New' && !isLost);

    const amt = Number(r.loanAmount || 0);
    const com = Number(r.expectedCommission || 0);

    const attribution = r.attribution || {};
    const source = String(attribution.source || 'direct').toLowerCase();
    const campaign = String(attribution.campaign || 'none').toLowerCase();

    const srcBucket = bySource.get(source) || emptyBucket(source);
    const cmpBucket = byCampaign.get(campaign) || emptyBucket(campaign);
    const buckets = [srcBucket, cmpBucket, summary];

    for (const b of buckets) {
      b.leads += 1;
      if (isContacted) b.contacted += 1;
      if (!isFunded && !isLost) b.active += 1;
      if (isFunded) { b.funded += 1; b.fundedValue += amt; b.fundedCommission += com; }
      if (isLost) b.lost += 1;
    }

    bySource.set(source, srcBucket);
    byCampaign.set(campaign, cmpBucket);
  }

  // Compute cost/lead + ROAS. Client provides monthlyAdBudget; we
  // extrapolate against the trailing 30d lead volume.
  const monthlyBudget = Number(managedAds?.monthlyAdBudget || 0);
  const D30 = 30 * 86400_000;
  const nowMs = Date.now();
  const last30dLeads = referrals.filter(r => {
    const t = r.referralDate ? new Date(r.referralDate).getTime() : 0;
    return t && nowMs - t <= D30;
  });
  const last30dFunded = last30dLeads.filter(r => FUNDED_STATUSES.includes(r.status));

  return NextResponse.json({
    uid: targetUid,
    displayName: user.displayName || null,
    email: user.email || null,
    managedAds,
    summary,
    bySource: Array.from(bySource.values()).sort((a, b) => b.leads - a.leads),
    byCampaign: Array.from(byCampaign.values()).sort((a, b) => b.leads - a.leads),
    trailing30d: {
      leads: last30dLeads.length,
      funded: last30dFunded.length,
      fundedValue: last30dFunded.reduce((a, r) => a + Number(r.loanAmount || 0), 0),
      monthlyBudget,
      costPerLead: monthlyBudget > 0 && last30dLeads.length > 0 ? Math.round(monthlyBudget / last30dLeads.length) : null,
      costPerFunded: monthlyBudget > 0 && last30dFunded.length > 0 ? Math.round(monthlyBudget / last30dFunded.length) : null,
    },
    totalReferrals: referrals.length,
  });
}
