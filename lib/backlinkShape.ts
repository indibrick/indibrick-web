// Prospected backlink / guest-post opportunity.
//
// Discovered via web search against a target page's topic (Phase
// 1.4). We store real signals only — no fabricated DR / domain
// authority numbers. If a source we call actually returns those,
// we surface them; otherwise the field is null and the UI shows
// "not available."
//
// The review queue is deliberately human-in-the-loop — reaching out
// for a backlink is a real-world action and blindly firing at a
// prospect list from an LLM is how you get on spam lists.

export type BacklinkProspectType = 'guest_post' | 'resource_link' | 'citation' | 'directory';
export type BacklinkReviewStatus = 'new' | 'approved' | 'rejected' | 'contacted' | 'landed';

export interface BacklinkTarget {
  url: string;               // page we'd want the link from
  domain: string;            // extracted for grouping
  prospectType: BacklinkProspectType;
  reviewStatus: BacklinkReviewStatus;

  // Scoring — 0..100. Populated by the discovery agent using
  // topic-fit heuristics (title/content vs our target page).
  // Anchor-safety is a separate score — how naturally would our
  // anchor text sit inside this page's existing content?
  topicFitScore: number;
  anchorSafetyScore: number;
  pageRelevanceScore: number;

  // Real domain metrics when a source populated them. Absent means
  // we don't have real data, not "zero." Never fabricate.
  domainRating?: number | null;
  monthlyOrganicTraffic?: number | null;
  metricsSource?: string | null;

  // The IndiBrick page this prospect would link to.
  targetOurUrl: string;

  // Free-text notes from the agent + reviewer.
  agentNotes?: string;
  reviewerNotes?: string;

  // Outreach state — the outreach layer itself is a later phase, but
  // the review queue benefits from tracking whether we've reached
  // out already.
  contactedAt?: string | null;
  landedAt?: string | null;
  landedBacklinkUrl?: string | null;

  discoveredAt: string;
  discoveryRunId?: string;
  discoveredBy: string;      // uid or 'scheduled'

  tenantId?: string;
}

const URL_MAX = 2048;

export function validateBacklinkTarget(input: Partial<BacklinkTarget>): string[] {
  const errors: string[] = [];
  if (!input.url || input.url.length > URL_MAX) errors.push('url required (<= 2048 chars).');
  if (!input.domain) errors.push('domain required.');
  if (!input.targetOurUrl) errors.push('targetOurUrl required.');
  const scores: Array<[string, number | undefined]> = [
    ['topicFitScore', input.topicFitScore],
    ['anchorSafetyScore', input.anchorSafetyScore],
    ['pageRelevanceScore', input.pageRelevanceScore],
  ];
  for (const [name, v] of scores) {
    if (typeof v !== 'number' || v < 0 || v > 100) errors.push(`${name} must be 0..100.`);
  }
  return errors;
}
