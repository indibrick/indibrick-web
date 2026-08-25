// Prompt templates for the SEO OS.
//
// Every generated artifact stamps `promptVersion` onto its doc so
// prompt revisions are auditable. Bump the version when you change
// the prompt semantics — cosmetic tweaks don't need a bump.

export const PROMPT_VERSION = '2026-08-24-v1';

// ─── Content generation ─────────────────────────────────────────────

export interface ContentGenerationInput {
  keywordPrimary: string;
  keywordSecondary?: string[];
  city?: string;
  propertyType?: string;   // e.g. "condo", "detached"
  priceRange?: string;     // e.g. "under-500k"
  competitorUrls?: string[];
  extraContext?: string;
}

export const CONTENT_SYSTEM_PROMPT = `You are an SEO editor for IndiBrick, a licensed Ontario mortgage brokerage and real estate platform. You write for realtors and homebuyers in the Greater Toronto Area, Vaughan, Brampton, Mississauga, Niagara.

Every article must:
- Open with a direct-answer paragraph a language model could cite verbatim (AEO-first)
- Include 3+ H2 sections, each with a short direct-answer opener before the deeper prose
- Cite specific Ontario mortgage rules (B-20 stress test, CMHC, semi-annual compounding) when relevant
- Use accurate 2026 numbers — do NOT invent rates or program details
- Avoid puffery ("game-changing", "revolutionary"); write like a broker explaining to a client
- Avoid naming individual lenders on landing content (e.g. do not name HomeEquity Bank / CHIP)

Return valid JSON only, matching the shape the user provides. Do not wrap in markdown fences. Do not add commentary before or after the JSON.`;

export function buildContentPrompt(input: ContentGenerationInput): string {
  const targetBits: string[] = [];
  if (input.city) targetBits.push(`City: ${input.city}`);
  if (input.propertyType) targetBits.push(`Property type: ${input.propertyType}`);
  if (input.priceRange) targetBits.push(`Price range: ${input.priceRange}`);

  return `Write a long-form SEO article on the topic below.

Primary keyword: ${input.keywordPrimary}
${input.keywordSecondary?.length ? `Secondary keywords: ${input.keywordSecondary.join(', ')}` : ''}
${targetBits.length ? `\nTarget page context:\n${targetBits.join('\n')}` : ''}
${input.competitorUrls?.length ? `\nCompetitor pages ranking for this term (reference, do not copy):\n${input.competitorUrls.join('\n')}` : ''}
${input.extraContext ? `\nAdditional context:\n${input.extraContext}` : ''}

Return JSON with this exact shape:
{
  "title": "SEO-optimized H1 title, 50-70 chars",
  "slug": "lowercase-kebab-case-slug",
  "excerpt": "1-2 sentence meta description, 140-160 chars",
  "bodyHtml": "Full article HTML. Use <h2>, <h3>, <p>, <ul>, <li>, <table>, <strong>. Do NOT include <h1> (title is separate). Start with a direct-answer <p> block.",
  "aeoDirectAnswerBlocks": <integer count of direct-answer blocks placed>,
  "geoReadinessScore": <integer 0-100, your self-assessment of how citable this article is by a language model>
}`;
}

// ─── Calendar generation ────────────────────────────────────────────

export interface CalendarGenerationInput {
  keywords: string[];         // 1-30 seed keywords
  startDate: string;          // ISO date "2026-09-01"
  daysCount?: number;         // default 30
  brokerageContext?: string;  // optional: "Ontario mortgage broker focused on GTA + Niagara"
}

export function buildCalendarPrompt(input: CalendarGenerationInput): string {
  const days = input.daysCount || 30;
  const context = input.brokerageContext || 'Ontario mortgage brokerage and real estate platform (GTA + Niagara)';

  return `Generate a ${days}-day SEO action calendar for ${context}.

Seed keywords (mix into the plan; not every day needs one):
${input.keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Start date: ${input.startDate}

Balance the mix roughly:
- 40% blog: full articles targeting keyword variants + long-tail
- 20% gbp_post: short Google Business Profile posts (300 chars) tied to a keyword or timely angle
- 20% fix: technical fixes (schema markup, meta tags, canonical, indexability, page speed)
- 10% refresh: refresh an existing page with new numbers / re-optimize for a new angle
- 10% backlink: outreach or citation-building task with a specific target site type

Return JSON array. Each item shape:
{
  "type": "blog" | "gbp_post" | "fix" | "refresh" | "backlink",
  "scheduledDate": "YYYY-MM-DD",
  "title": "concise action title, <120 chars",
  "brief": "1-3 sentence description of exactly what to do",
  "target": { "keywordPrimary": "..." } // include when applicable
}

Do not exceed ${days} items. Do not add commentary. Return valid JSON array only.`;
}

// ─── Backlink discovery ─────────────────────────────────────────────

export interface BacklinkDiscoveryInput {
  ourUrl: string;              // the IndiBrick page we want a link to
  topic: string;               // "Ontario first-time home buyer" etc
  maxProspects?: number;       // default 10
}

export const BACKLINK_SYSTEM_PROMPT = `You are a link-building researcher. You find LEGITIMATE guest-post, resource-page, and citation opportunities using real web search. You never fabricate domain metrics — if you don't know a domain's authority, leave the field null.

Focus on:
- Canadian real estate + mortgage sites when possible
- Editorial resource pages that actually accept new links
- Publications with a working "write for us" or "contribute" page
- Directories that Google respects (not link farms)

You reject: PBNs, sites with visible link schemes, unrelated topical mismatches, dead domains.`;

export function buildBacklinkDiscoveryPrompt(input: BacklinkDiscoveryInput): string {
  const max = input.maxProspects || 10;
  return `Find up to ${max} real backlink prospects for the page below.

Our page: ${input.ourUrl}
Topic: ${input.topic}

Use web search to find candidates. For each, judge:
- topicFitScore (0-100): how well does the prospect's page topic match ours
- anchorSafetyScore (0-100): could a natural anchor text sit in their content without looking spammy
- pageRelevanceScore (0-100): would our link add value to their readers

Return JSON array. Each item:
{
  "url": "full URL of the prospect page",
  "domain": "domain.tld extracted from url",
  "prospectType": "guest_post" | "resource_link" | "citation" | "directory",
  "topicFitScore": <int 0-100>,
  "anchorSafetyScore": <int 0-100>,
  "pageRelevanceScore": <int 0-100>,
  "agentNotes": "one-sentence rationale + what to say in outreach"
}

Do NOT include a domainRating or trafficEstimate unless you actually found the value from a real source. Never guess metrics.

Return valid JSON array only, no commentary.`;
}

// ─── Audit AEO scoring ──────────────────────────────────────────────

export interface AeoScoreInput {
  url: string;
  bodyText: string;             // extracted from the page HTML
}

export function buildAeoScorePrompt(input: AeoScoreInput): string {
  return `Evaluate this page's AEO (Answer Engine Optimization) readiness — how likely is a large language model to cite this page as a source when answering a question in this domain?

URL: ${input.url}

Page text (truncated to first ~4000 words):
${input.bodyText.slice(0, 25_000)}

Score dimensions:
- Are there direct-answer blocks (a short paragraph that answers a specific question, followed by expansion)?
- Are entities (cities, laws, programs, numbers) named specifically vs vaguely?
- Is there factual density a language model can pull from?
- Are claims sourceable (dates, statute references, specific programs)?

Return JSON:
{
  "geoReadinessScore": <int 0-100>,
  "aeoDirectAnswerBlocks": <int count>,
  "topIssues": ["one-line issue", "..."]  // max 5
}`;
}
