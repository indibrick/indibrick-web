// Report aggregations derived from allReferrals + allTasks.
//
// All computation is client-side against the in-memory pipeline —
// same trade-off as the Cmd+K palette. Firestore round-trips would
// hide the reports behind a spinner for 2-5 seconds; in-memory
// aggregation is <20ms even at 5000 rows. The tradeoff is that
// data only reflects what's currently loaded.

import { useMemo } from 'react';
import { FUNDED_STATUSES, LOST_STATUSES } from '../lib/crmHelpers';

interface UseReportsArgs {
  allReferrals: any[];
  currentUid?: string;
  scope: 'mine' | 'team';   // team = every deal loaded; mine = mine + participant
}

export interface MonthPoint {
  monthKey: string;         // YYYY-MM
  label: string;            // "Aug 2026"
  fundedCount: number;
  fundedVolume: number;     // sum of loanAmount on funded deals
  fundedCommission: number; // sum of expectedCommission on funded deals
  newLeads: number;         // deals created in this month
}

export interface FunnelPoint {
  stage: string;
  count: number;
  pct: number;              // % of total non-lost deals that ever reached this stage
}

export interface DealTypePoint {
  dealType: string;
  count: number;
  volume: number;
}

export interface SpeedToLeadPoint {
  weekKey: string;          // YYYY-Www
  label: string;            // "Wk of Aug 12"
  medianHrs: number | null;
  sampleSize: number;
}

export interface ReportsResult {
  months: MonthPoint[];             // last 12 months
  funnel: FunnelPoint[];
  dealTypeMix: DealTypePoint[];
  speedToLead: SpeedToLeadPoint[];  // last 8 weeks
  summary: {
    totalActive: number;
    totalFunded: number;
    fundedValueLast30d: number;
    fundedValueLast90d: number;
    fundedValueYtd: number;
    conversionPct: number;
    avgDaysToFund: number | null;
  };
}

function ymKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function ymLabel(d: Date): string {
  return d.toLocaleString('en-CA', { month: 'short', year: 'numeric' });
}
function isoWeek(d: Date): string {
  // Local-time ISO-ish week key. Good enough for a chart — real ISO
  // week logic isn't worth the byte count here.
  const y = d.getFullYear();
  const start = new Date(y, 0, 1);
  const days = Math.floor((d.getTime() - start.getTime()) / 86400000);
  const w = Math.floor((days + start.getDay()) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
function isoWeekLabel(d: Date): string {
  return `Wk of ${d.toLocaleString('en-CA', { month: 'short', day: 'numeric' })}`;
}
function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function useReports({ allReferrals, currentUid, scope }: UseReportsArgs): ReportsResult {
  return useMemo(() => {
    // Scope filter.
    const source = scope === 'mine' && currentUid
      ? allReferrals.filter(r =>
          r.assignedAgentId === currentUid
          || r.referrerId === currentUid
          || (Array.isArray(r.participantIds) && r.participantIds.includes(currentUid)))
      : allReferrals;

    // ─── Months (last 12) ───────────────────────────────────────────
    const now = new Date();
    const monthBuckets = new Map<string, MonthPoint>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = ymKey(d);
      monthBuckets.set(key, {
        monthKey: key,
        label: ymLabel(d),
        fundedCount: 0,
        fundedVolume: 0,
        fundedCommission: 0,
        newLeads: 0,
      });
    }

    // ─── Funnel + dealType + speed-to-lead accumulators ────────────
    // Funnel stages are grouped from the underlying status vocabulary.
    // The order + labels here define the funnel bars.
    const FUNNEL_STAGES: { label: string; matches: (s: string) => boolean }[] = [
      { label: 'New',           matches: s => ['New', 'Received', 'Lead Received', 'New Web Lead'].includes(s) },
      { label: 'Contacted',     matches: s => s === 'Contacted' },
      { label: 'In Progress',   matches: s => ['In Progress', 'Underwriting', 'Quoted', 'Processing'].includes(s) },
      { label: 'Approved',      matches: s => ['Approved', 'Firm / Conditional', 'Conditional', 'Firm Sale', 'Bound'].includes(s) },
      { label: 'Funded',        matches: s => FUNDED_STATUSES.includes(s) },
    ];

    const funnelReached = FUNNEL_STAGES.map(() => 0);
    const dealTypeAgg = new Map<string, DealTypePoint>();
    const speedByWeek = new Map<string, { samples: number[]; label: string }>();
    const daysToFundSamples: number[] = [];

    let totalActive = 0;
    let totalFunded = 0;
    let fundedValueLast30d = 0;
    let fundedValueLast90d = 0;
    let fundedValueYtd = 0;
    let nonLostTotal = 0;

    const nowMs = now.getTime();
    const D30 = 30 * 86400000;
    const D90 = 90 * 86400000;

    for (const r of source) {
      const status = String(r.status || '');
      const isLost = LOST_STATUSES.includes(status);
      const isFunded = FUNDED_STATUSES.includes(status);
      const amt = Number(r.loanAmount || 0);
      const com = Number(r.expectedCommission || 0);
      const referralAt = r.referralDate ? new Date(r.referralDate) : null;
      const fundedAt = r.fundedAt ? new Date(r.fundedAt) : (isFunded && referralAt ? referralAt : null);
      const referralMs = referralAt ? referralAt.getTime() : null;

      // Non-lost total (denominator for funnel %).
      if (!isLost) nonLostTotal += 1;

      // New leads per month.
      if (referralAt) {
        const key = ymKey(referralAt);
        const bucket = monthBuckets.get(key);
        if (bucket) bucket.newLeads += 1;
      }

      // Funded per month + rolling volume windows.
      if (isFunded && fundedAt) {
        totalFunded += 1;
        const key = ymKey(fundedAt);
        const bucket = monthBuckets.get(key);
        if (bucket) {
          bucket.fundedCount += 1;
          bucket.fundedVolume += amt;
          bucket.fundedCommission += com;
        }
        const fMs = fundedAt.getTime();
        if (nowMs - fMs <= D30) fundedValueLast30d += amt;
        if (nowMs - fMs <= D90) fundedValueLast90d += amt;
        if (fundedAt.getFullYear() === now.getFullYear()) fundedValueYtd += amt;
        // Days-to-fund sample (only when we have referralDate).
        if (referralMs) {
          const days = Math.round((fMs - referralMs) / 86400000);
          if (days >= 0 && days < 365) daysToFundSamples.push(days);
        }
      }

      // Active (in-progress) count.
      if (!isLost && !isFunded) totalActive += 1;

      // Funnel — any deal that ever reached OR passed a stage counts.
      // For simplicity we use current-status as the marker: a deal in
      // Funded also implicitly reached everything earlier. That's the
      // canonical funnel definition + matches what agents see.
      let deepestReached = -1;
      for (let i = 0; i < FUNNEL_STAGES.length; i++) {
        if (FUNNEL_STAGES[i].matches(status)) deepestReached = i;
      }
      if (deepestReached >= 0 && !isLost) {
        for (let i = 0; i <= deepestReached; i++) funnelReached[i] += 1;
      }

      // DealType breakdown.
      const dt = String(r.dealType || 'Unspecified');
      const entry = dealTypeAgg.get(dt) || { dealType: dt, count: 0, volume: 0 };
      entry.count += 1;
      entry.volume += amt;
      dealTypeAgg.set(dt, entry);

      // Speed-to-lead: hours from referralDate → first logged call.
      // Only for deals created in the last 8 weeks.
      const WK_MS = 7 * 86400000;
      if (referralMs && nowMs - referralMs <= 8 * WK_MS) {
        const timeline: any[] = Array.isArray(r.timeline) ? r.timeline : [];
        const firstCall = timeline
          .filter(t => typeof t?.content === 'string' && t.content.includes('LOGGED CALL'))
          .map(t => new Date(t.timestamp).getTime())
          .filter(ts => !isNaN(ts) && ts >= referralMs)
          .sort((a, b) => a - b)[0];
        if (firstCall) {
          const hrs = (firstCall - referralMs) / 3600000;
          const weekOf = new Date(referralMs - (referralAt!.getDay() * 86400000));
          const wk = isoWeek(weekOf);
          const entry2 = speedByWeek.get(wk) || { samples: [], label: isoWeekLabel(weekOf) };
          entry2.samples.push(hrs);
          speedByWeek.set(wk, entry2);
        }
      }
    }

    const funnel: FunnelPoint[] = FUNNEL_STAGES.map((s, i) => ({
      stage: s.label,
      count: funnelReached[i],
      pct: nonLostTotal > 0 ? Math.round((funnelReached[i] / nonLostTotal) * 100) : 0,
    }));

    const dealTypeMix = Array.from(dealTypeAgg.values()).sort((a, b) => b.count - a.count);

    // Ensure the last 8 weeks are present even if some weeks have no samples.
    const speedToLead: SpeedToLeadPoint[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(nowMs - i * 7 * 86400000);
      const wk = isoWeek(d);
      const entry = speedByWeek.get(wk);
      speedToLead.push({
        weekKey: wk,
        label: isoWeekLabel(d),
        medianHrs: entry ? median(entry.samples) : null,
        sampleSize: entry ? entry.samples.length : 0,
      });
    }

    const conversionPct = nonLostTotal > 0 ? Math.round((totalFunded / nonLostTotal) * 100) : 0;
    const avgDaysToFund = daysToFundSamples.length > 0
      ? Math.round(daysToFundSamples.reduce((a, b) => a + b, 0) / daysToFundSamples.length)
      : null;

    return {
      months: Array.from(monthBuckets.values()),
      funnel,
      dealTypeMix,
      speedToLead,
      summary: {
        totalActive,
        totalFunded,
        fundedValueLast30d,
        fundedValueLast90d,
        fundedValueYtd,
        conversionPct,
        avgDaysToFund,
      },
    };
  }, [allReferrals, currentUid, scope]);
}
