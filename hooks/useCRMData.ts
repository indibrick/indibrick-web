// The memo chain that powers the partner CRM's pipeline view.
//
// Extracted from app/partner/page.tsx during Phase 1. Consolidates all
// derived data into one hook so the parent component doesn't re-run each
// memo independently on every keystroke — and so referential stability
// of the output is predictable (DealListCard's React.memo depends on it).
//
// The hook is pure: it takes the raw referrals + tasks + filter state
// and returns the derived views. All heavy work is memoized against
// the smallest possible dependency set.

import { useDeferredValue, useEffect, useMemo } from 'react';
import type { Task } from '../types';
import {
  FUNDED_STATUSES,
  LOST_STATUSES,
  computeDealScore,
} from '../lib/crmHelpers';

export type PipelineView = 'all' | 'mine' | 'incoming' | 'outbound' | 'team';
export type SortOrder = 'newest' | 'oldest';

export interface DealMeta {
  sla: {
    callCount: number;
    callSLA: 'passed' | 'breached' | 'pending';
    subSLA: 'passed' | 'breached' | 'pending';
    hoursSinceCreation: number;
  };
  days: number;
  progress: number;
  isWon: boolean;
  activeTask: Task | undefined;
  score: number;
  scoreBand: 'red' | 'amber' | 'green';
  scoreHint: string;
}

export interface PipelineStats {
  activeValue: number;
  activeCount: number;
  fundedValueYTD: number;
  fundedCommissionYTD: number;
  fundedCount: number;
  inflightCommission: number;
  avgDeal: number;
  speedToLeadMedianHrs: number | null;
  speedToLeadSampleSize: number;
  speedToLeadCoveredCount: number;
  speedToLeadUncalledCount: number;
}

interface UseCRMDataArgs {
  allReferrals: any[];
  allTasks: Task[];

  pipelineView: PipelineView;
  filterAssignee: string;
  filterTag: string;
  filterStatus: string;
  filterReferralSource: string;
  sortOrder: SortOrder;
  searchQuery: string;

  partnerRole: string;
  currentUid: string | undefined;

  pipelineStages: readonly string[];

  // Callback fired whenever a filter changes so the parent can reset
  // any list-window pagination it owns.
  onFilterChange?: () => void;
}

interface UseCRMDataResult {
  deferredSearch: string;
  filteredDeals: any[];
  pipelineStats: PipelineStats;
  tasksByDate: Map<string, Task[]>;
  tasksByReferralId: Map<string, Task[]>;
  dealsByStage: Map<string, any[]>;
  dealMeta: Map<string, DealMeta>;
}

const SUBMITTED_STATES = ['Underwriting', 'Approved', 'Funded', 'Firm Sale', 'Firm / Conditional'];
const TERMINAL_WIN = new Set(['Closed', 'Funded', 'Firm Sale', 'Firm / Conditional']);
const TERMINAL_LOSS = new Set(['Declined', 'Lost', 'Cancelled']);

export function useCRMData(args: UseCRMDataArgs): UseCRMDataResult {
  const {
    allReferrals,
    allTasks,
    pipelineView,
    filterAssignee,
    filterTag,
    filterStatus,
    filterReferralSource,
    sortOrder,
    searchQuery,
    partnerRole,
    currentUid,
    pipelineStages,
    onFilterChange,
  } = args;

  // Defer the search value so keystrokes update the input instantly
  // while the (expensive) filter pass runs at a lower priority. Big
  // perceived win on large pipelines — typing stays buttery even when
  // the list is still re-filtering.
  const deferredSearch = useDeferredValue(searchQuery);

  const filteredDeals = useMemo(() => {
    let filtered = allReferrals;
    // "Mine" = deals I'm assigned to OR a participant/collaborator on
    if (pipelineView === 'mine') filtered = filtered.filter(r => r.assignedAgentId === currentUid || (r.participantIds || []).includes(currentUid));
    if (pipelineView === 'incoming') filtered = filtered.filter(r => r.assignedAgentId === 'ADMIN_INBOX');
    if (pipelineView === 'outbound') filtered = filtered.filter(r => r.referrerId === 'INDIBRICK_WEB' && r.assignedAgentId !== 'ADMIN_INBOX');
    // Wave K-3: team-scoped view — deals owned/assigned to any team
    // member OTHER than the caller. Teammate-only slice for a team
    // owner reviewing collective pipeline.
    if (pipelineView === 'team') filtered = filtered.filter(r =>
      r.assignedAgentId !== currentUid
      && r.referrerId !== currentUid
      && Array.isArray(r.teamVisibleUids)
      && r.teamVisibleUids.includes(currentUid)
    );

    if (partnerRole === 'admin' && filterAssignee !== 'all') filtered = filtered.filter(r => r.assignedAgentId === filterAssignee);
    if (filterTag !== 'all') filtered = filtered.filter(r => r.leadTag === filterTag);
    if (filterStatus !== 'all') filtered = filtered.filter(r => r.status === filterStatus);
    // Referral source: value is a partner UID (specific partner) or a generic source label
    if (filterReferralSource !== 'all') filtered = filtered.filter(r => r.referralPartnerId === filterReferralSource || r.referralSource === filterReferralSource);

    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      filtered = filtered.filter(r =>
        r.clientName?.toLowerCase().includes(q) ||
        r.clientEmail?.toLowerCase().includes(q) ||
        r.clientPhone?.includes(q),
      );
    }
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime();
      return new Date(a.referralDate).getTime() - new Date(b.referralDate).getTime();
    });
  }, [allReferrals, pipelineView, filterAssignee, filterTag, filterStatus, filterReferralSource, deferredSearch, sortOrder, partnerRole, currentUid]);

  // Reset any external pagination window whenever a filter changes so
  // the visible slice always starts at the top of the new result set.
  useEffect(() => {
    onFilterChange?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineView, filterAssignee, filterTag, filterStatus, filterReferralSource, deferredSearch, sortOrder]);

  // Pipeline financial aggregates — derived from loanAmount/expectedCommission on referrals
  const pipelineStats = useMemo<PipelineStats>(() => {
    const thisYear = new Date().getFullYear();
    let activeValue = 0, fundedValueYTD = 0, fundedCommissionYTD = 0, fundedCount = 0, activeCount = 0;
    let inflightCommission = 0;
    // Speed-to-lead: hours from referralDate → first logged call, over
    // the trailing 14 days. Median (not mean) because a couple of week
    // -long dead leads would dominate a mean.
    const now = Date.now();
    const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
    const speedSamples: number[] = [];
    let speedCoveredCount = 0, speedNoCallCount = 0;
    allReferrals.forEach(r => {
      const amt = Number(r.loanAmount || 0);
      const com = Number(r.expectedCommission || 0);
      const referralAt = r.referralDate ? new Date(r.referralDate).getTime() : 0;
      const fundedAt = r.fundedAt ? new Date(r.fundedAt) : new Date(r.referralDate || Date.now());
      if (FUNDED_STATUSES.includes(r.status)) {
        if (fundedAt.getFullYear() === thisYear) {
          fundedValueYTD += amt;
          fundedCommissionYTD += com;
          fundedCount += 1;
        }
      } else if (!LOST_STATUSES.includes(r.status)) {
        activeValue += amt;
        inflightCommission += com;
        activeCount += 1;
      }

      // Only leads created in the last 14 days count toward the metric.
      if (referralAt && now - referralAt <= WINDOW_MS) {
        speedCoveredCount += 1;
        const timeline: any[] = Array.isArray(r.timeline) ? r.timeline : [];
        // Call logs are stamped with "📞 LOGGED CALL:" — the earliest is
        // the first outbound call.
        const firstCall = timeline
          .filter(t => typeof t?.content === 'string' && t.content.includes('LOGGED CALL'))
          .map(t => new Date(t.timestamp).getTime())
          .filter(ts => !isNaN(ts) && ts >= referralAt)
          .sort((a, b) => a - b)[0];
        if (firstCall) {
          speedSamples.push((firstCall - referralAt) / 3600000);
        } else {
          speedNoCallCount += 1;
        }
      }
    });
    let speedToLeadMedianHrs: number | null = null;
    if (speedSamples.length > 0) {
      const sorted = [...speedSamples].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      speedToLeadMedianHrs = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    }
    return {
      activeValue, activeCount, fundedValueYTD, fundedCommissionYTD, fundedCount, inflightCommission,
      avgDeal: fundedCount ? fundedValueYTD / fundedCount : 0,
      speedToLeadMedianHrs,
      speedToLeadSampleSize: speedSamples.length,
      speedToLeadCoveredCount: speedCoveredCount,
      speedToLeadUncalledCount: speedNoCallCount,
    };
  }, [allReferrals]);

  // Bucket tasks by date so the calendar's per-day lookup is O(1)
  // instead of an O(N) filter per cell × 31 cells.
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    allTasks.forEach(t => {
      if (!t.dueDate) return;
      const arr = map.get(t.dueDate);
      if (arr) arr.push(t); else map.set(t.dueDate, [t]);
    });
    return map;
  }, [allTasks]);

  // Bucket tasks by referralId so the deal-card render doesn't do an
  // allTasks.find() per deal. With hundreds of deals × hundreds of
  // tasks that's the biggest hidden cost in the list paint.
  const tasksByReferralId = useMemo(() => {
    const map = new Map<string, Task[]>();
    allTasks.forEach(t => {
      if (!t.referralId || t.referralId === 'general') return;
      const arr = map.get(t.referralId);
      if (arr) arr.push(t); else map.set(t.referralId, [t]);
    });
    return map;
  }, [allTasks]);

  // Bucket the filtered deals by pipeline stage for the kanban view.
  const dealsByStage = useMemo(() => {
    const map = new Map<string, any[]>();
    pipelineStages.forEach(s => map.set(s, []));
    filteredDeals.forEach(d => {
      const arr = map.get(d.status);
      if (arr) arr.push(d);
    });
    return map;
  }, [filteredDeals, pipelineStages]);

  // Precompute meta against the FULL allReferrals set — not
  // filteredDeals. If we keyed on filteredDeals, every meta entry would
  // become a new object reference on every filter/search keystroke,
  // defeating React.memo on the DealListCard. Keying on allReferrals
  // means a deal's meta object stays referentially stable across
  // filter changes — so unaffected cards skip re-render entirely.
  const dealMeta = useMemo(() => {
    const map = new Map<string, DealMeta>();
    const now = Date.now();
    const stagesLen = pipelineStages.length;
    allReferrals.forEach(deal => {
      const hoursSinceCreation = (now - new Date(deal.referralDate || now).getTime()) / 3600000;
      const callCount = deal.callCount || 0;
      const callSLA: 'passed' | 'breached' | 'pending' = callCount > 0 ? 'passed' : (hoursSinceCreation > 12 ? 'breached' : 'pending');
      const subSLA: 'passed' | 'breached' | 'pending' = SUBMITTED_STATES.includes(deal.status) ? 'passed' : (hoursSinceCreation > 48 ? 'breached' : 'pending');
      const since = deal.stageEnteredAt || deal.referralDate;
      const days = since ? Math.floor((now - new Date(since).getTime()) / 86400000) : 0;
      const idx = pipelineStages.indexOf(deal.status);
      const progress = TERMINAL_LOSS.has(deal.status)
        ? 100
        : (idx === -1 ? 10 : Math.max(10, (idx / (stagesLen - 1)) * 100));
      const activeTask = (tasksByReferralId.get(deal.id) || []).find(t => t.status !== 'Completed');
      const slaBreached = callSLA === 'breached' || subSLA === 'breached';
      const { score, band, hint } = computeDealScore(deal, days, slaBreached);
      map.set(deal.id, {
        sla: { callCount, callSLA, subSLA, hoursSinceCreation },
        days,
        progress,
        isWon: TERMINAL_WIN.has(deal.status),
        activeTask,
        score,
        scoreBand: band,
        scoreHint: hint,
      });
    });
    return map;
  }, [allReferrals, tasksByReferralId, pipelineStages]);

  return {
    deferredSearch,
    filteredDeals,
    pipelineStats,
    tasksByDate,
    tasksByReferralId,
    dealsByStage,
    dealMeta,
  };
}
