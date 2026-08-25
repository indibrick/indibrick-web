// Per-URL / per-page audit result.
//
// A single audit run captures the state of a page across five
// dimensions. Sub-scores are 0..100 and roll up into an overall
// score. Every issue produced by the audit can auto-spawn a
// seoCalendar "fix" item — the linking is one-way (issue → calendar)
// so we don't fight cascading writes.
//
// Score bands (aligned to what real SEO tooling uses):
//   90..100 excellent · 75..89 good · 50..74 needs-work · <50 broken

export type SeoAuditDimension =
  | 'schema'          // schema.org JSON-LD presence + correctness
  | 'metadata'        // title, description, canonical, OG
  | 'indexability'    // robots.txt / meta robots / sitemap inclusion
  | 'speed'           // Lighthouse-ish / PageSpeed
  | 'geoReadiness';   // AEO direct-answer blocks a language model could cite

export type SeoAuditSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SeoAuditIssue {
  dimension: SeoAuditDimension;
  severity: SeoAuditSeverity;
  code: string;      // machine-readable rule id — e.g. "schema-missing-realestate"
  message: string;   // human-readable one-liner
  suggestion?: string;
}

export interface SeoAuditSubScores {
  schema: number;
  metadata: number;
  indexability: number;
  speed: number;
  geoReadiness: number;
}

export interface SeoAuditResult {
  url: string;                 // full absolute URL — the doc key
  urlPath: string;             // just the path for grouping
  runAt: string;               // ISO timestamp
  runId: string;               // groups a batch of same-time audits

  subScores: SeoAuditSubScores;
  overallScore: number;        // weighted average

  issues: SeoAuditIssue[];

  // Derived signals populated during the audit run.
  hasJsonLd?: boolean;
  hasCanonical?: boolean;
  robotsIndexable?: boolean;
  inSitemap?: boolean;
  aeoDirectAnswerBlocks?: number;

  // Auto-generated calendar fix item IDs. If we re-run and find the
  // same issue, we upsert rather than duplicate.
  spawnedCalendarItemIds?: string[];

  triggeredBy: string;         // uid or 'scheduled'
  createdAt?: any;
  tenantId?: string;
}

export function bandForScore(score: number): 'excellent' | 'good' | 'needs-work' | 'broken' {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'needs-work';
  return 'broken';
}
