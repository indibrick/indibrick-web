// Branching drip campaign definitions.
//
// ─── How a branching campaign is expressed ──────────────────────────
// The engine (functions/src/dripRunner.ts) walks ONE ordered list of steps
// per sequence. Branching is achieved with a per-step `requiresSegment`
// gate: a step fires only if the run's segment matches, otherwise the runner
// skips it exactly like a disabled step.
//
// So a 9-email core with three branches is not four sequences — it is one
// sequence whose steps are interleaved in ascending day order:
//
//   day 0,3,6,8   core, ungated        → everyone gets these
//   day 12+       core, gated to 'unassigned'
//                 branch steps gated to their own segment
//
// Ordering is load-bearing, not cosmetic. The runner computes each step's
// fire time from the NEXT step in index order, so a step whose day is lower
// than its predecessor's would resolve to a past date and fire immediately.
// `buildSteps()` sorts, and validateDripSequence() rejects a bad order.
//
// ─── Branch day offsets ─────────────────────────────────────────────
// The Simcoe brief lists branch emails at "days 4, 9, 15" while also saying
// branches replace core emails 5-9 from day 12 onward. Those only reconcile
// if branch offsets count from the handover, which puts them on enrollment
// days 16, 21 and 27. Non-opener offsets (12, 18) read as absolute
// enrollment days, so that track declares itself enrollment-relative.

export type DripSegmentKey = 'unassigned' | 'first-time' | 'investor' | 'non-opener';

export interface CampaignTrack {
  key: DripSegmentKey | 'core';
  label: string;
  days: number[];
  relativeTo: 'enrollment' | 'branchStart';
  /** Segment gate applied to every step in this track. Empty = fires for all. */
  requiresSegment: DripSegmentKey[];
}

export interface CampaignDef {
  /** Becomes the /drip_sequences document id. */
  id: string;
  name: string;
  description: string;
  tracks: CampaignTrack[];
  /** Core index at which branches take over. Also the branchStart day source. */
  branchFromCoreIndex: number;
  /** Enrollment day at which an unopened run is forced to the non-opener branch. */
  nonOpenerCheckDay: number;
}

export interface BuiltStep {
  templateId: string;
  waitDaysAfterEnroll: number;
  requiresSegment?: DripSegmentKey[];
  label: string;
  enabled: true;
}

export const CAMPAIGNS: CampaignDef[] = [
  {
    id: 'simcoe-launch',
    name: 'Simcoe County Launch',
    description:
      'NIRA Towns by Devane, Vicinity by Stateview Homes, Midhurst Valley, South Barrie Meadows. 9-email core with first-time buyer, investor and non-opener branches.',
    branchFromCoreIndex: 4,
    nonOpenerCheckDay: 12,
    tracks: [
      {
        key: 'core',
        label: 'Core',
        days: [0, 3, 6, 8, 12, 16, 21, 24, 30],
        relativeTo: 'enrollment',
        // Gate is applied only from branchFromCoreIndex onward — see buildSteps.
        requiresSegment: [],
      },
      {
        key: 'first-time',
        label: 'First-time buyer',
        days: [4, 9, 15],
        relativeTo: 'branchStart',
        requiresSegment: ['first-time'],
      },
      {
        key: 'investor',
        label: 'Investor',
        days: [4, 9, 15],
        relativeTo: 'branchStart',
        requiresSegment: ['investor'],
      },
      {
        key: 'non-opener',
        label: 'Non-opener re-engagement',
        days: [12, 18],
        relativeTo: 'enrollment',
        requiresSegment: ['non-opener'],
      },
    ],
  },
];

/** Template document id. Stable, readable, valid as a Firestore id. */
export function templateId(campaignId: string, track: string, day: number): string {
  return `${campaignId}__${track}__d${day}`;
}

/**
 * Flatten a campaign into the ordered, gated step list the engine walks.
 *
 * Core steps before the handover carry no gate, so they reach everyone.
 * Core steps from the handover onward are gated to 'unassigned', which is
 * what makes a branch "replace" the core tail — the moment a run picks up a
 * segment, the remaining core steps stop matching and are skipped.
 */
export function buildSteps(c: CampaignDef): BuiltStep[] {
  const core = c.tracks.find((t) => t.key === 'core');
  if (!core) throw new Error(`Campaign ${c.id} has no core track`);
  const handoverDay = core.days[c.branchFromCoreIndex];
  if (handoverDay == null) throw new Error(`Campaign ${c.id}: branchFromCoreIndex out of range`);

  const steps: BuiltStep[] = [];

  core.days.forEach((day, i) => {
    const gated = i >= c.branchFromCoreIndex;
    steps.push({
      templateId: templateId(c.id, 'core', day),
      waitDaysAfterEnroll: day,
      ...(gated ? { requiresSegment: ['unassigned' as DripSegmentKey] } : {}),
      label: `Core · day ${day}${gated ? ' (unassigned only)' : ''}`,
      enabled: true,
    });
  });

  for (const track of c.tracks) {
    if (track.key === 'core') continue;
    for (const day of track.days) {
      const absoluteDay = track.relativeTo === 'branchStart' ? handoverDay + day : day;
      steps.push({
        templateId: templateId(c.id, track.key, day),
        waitDaysAfterEnroll: absoluteDay,
        requiresSegment: track.requiresSegment,
        label: `${track.label} · day ${absoluteDay}`,
        enabled: true,
      });
    }
  }

  // Ascending by day. Ties keep core first, which matters only for readability
  // since same-day steps always carry disjoint gates.
  steps.sort((a, b) => a.waitDaysAfterEnroll - b.waitDaysAfterEnroll);
  return steps;
}

export function getCampaign(id: string): CampaignDef | null {
  return CAMPAIGNS.find((c) => c.id === id) ?? null;
}
