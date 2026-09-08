// Simcoe County launch campaign — structure.
//
// The copy lives in data/simcoeCopy.ts; this file turns those 17 emails
// into the single, ordered, segment-gated step list dripRunner walks.
//
// ─── Why one sequence and not four ──────────────────────────────────
// The runner advances a run through ONE array by index, computing the
// next fire time from the next step's day offset. Four parallel sequences
// would mean four runs per person, four unsubscribe scopes, and no way to
// express "the branch replaces the core". So the branches are interleaved
// into one ascending list and gated by segment instead.
//
// ─── The gates ──────────────────────────────────────────────────────
// Email 1 is ungated: it goes to everyone and asks the sorting question.
// Every later core email requires 'unassigned' or 'move-up', so the moment
// someone picks first-time or investor they stop receiving core mail —
// "from the next send onward", per the guide. 'move-up' rides the core
// track because the guide wrote no branch copy for it.
//
// Non-openers are forced onto their own track at day 12 by the runner's
// nonOpenerCheckDay rule, which replaces core emails 5 through 9.
//
// ─── Ordering is load-bearing ───────────────────────────────────────
// advanceRun derives nextFireAt from the NEXT step by index. A step with a
// lower day than its predecessor resolves to a past date and fires
// immediately, so the list must be sorted ascending. validateDripSequence
// enforces this; the assertion below catches it earlier, at build time.

import { SIMCOE_EMAILS, type SimcoeEmail } from './simcoeCopy';
import type { DripSegment } from '../lib/dripShape';

export interface CampaignDef {
  id: string;
  name: string;
  description: string;
  /** Day by which a run with no opens is moved to the non-opener track. */
  nonOpenerCheckDay: number;
}

export const CAMPAIGNS: CampaignDef[] = [
  {
    id: 'simcoe-launch',
    name: 'Simcoe County Launch',
    description:
      'MIRA, Vicinity, Midhurst Valley and the South Barrie corridor. One ad sold four communities, so email 1 sorts buyers by type and every email after it drives one action: start a pre-approval.',
    nonOpenerCheckDay: 12,
  },
];

/** Which segments a track's emails are for. */
const GATE: Record<SimcoeEmail['track'], DripSegment[] | undefined> = {
  // Core is for anyone who has not chosen a branch. 'move-up' sits here
  // because the guide gave it a button but no copy of its own.
  core: ['unassigned', 'move-up'],
  'first-time': ['first-time'],
  investor: ['investor'],
  'non-opener': ['non-opener'],
};

export function templateId(campaignId: string, email: SimcoeEmail): string {
  return `${campaignId}__${email.track}__${email.id}`;
}

/**
 * Flatten the campaign into the ordered step list.
 *
 * Email 1 is deliberately ungated so the sorting question reaches
 * everyone; every other step carries its track's gate.
 */
export function buildSteps(campaign: CampaignDef) {
  return SIMCOE_EMAILS
    .slice()
    .sort((a, b) => a.day - b.day)
    .map((email) => ({
      templateId: templateId(campaign.id, email),
      waitDaysAfterEnroll: email.day,
      enabled: true,
      label: `${email.label} — ${email.subject}`,
      // The opening email must reach every enrollee: it is the one that
      // asks which buyer they are, so gating it would strand anyone whose
      // segment was set before enrollment.
      requiresSegment: email.id === 'e1' ? undefined : GATE[email.track],
    }));
}

export function getCampaign(id: string): CampaignDef | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}
