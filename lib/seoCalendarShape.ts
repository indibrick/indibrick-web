// 30-day (or longer) scheduled SEO action items.
//
// Items are generated in three ways:
//   - AI-generated from a keyword list (Phase 1.2)
//   - Auto-derived from audit issues (Phase 1.3 — every open issue
//     becomes a "fix" item)
//   - Manually added by an operator
//
// Each item can eventually spawn a seoContent draft (for blog /
// gbp_post types) or a fix task (for schema/speed/indexability
// issues). The link lives on the item itself so the calendar view
// can jump straight to whichever surface the item lives in.

export type SeoCalendarType = 'blog' | 'gbp_post' | 'fix' | 'refresh' | 'backlink';
export type SeoCalendarStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type SeoCalendarSource = 'ai_generated' | 'audit_derived' | 'manual';

export interface SeoCalendarItem {
  type: SeoCalendarType;
  status: SeoCalendarStatus;
  source: SeoCalendarSource;

  scheduledDate: string;   // ISO date, day-precision — e.g. "2026-09-03"
  title: string;
  brief?: string;          // one-paragraph explanation of the action

  // Optional targeting (mirrors seoContentShape.SeoContentTarget).
  target?: {
    city?: string;
    propertyType?: string;
    priceRange?: string;
    keywordPrimary?: string;
    url?: string;
  };

  // Cross-references. Populated when this item spawns / links to
  // another artifact.
  linkedContentId?: string | null;
  linkedAuditId?: string | null;
  linkedBacklinkId?: string | null;

  createdBy: string;
  createdAt?: any;
  updatedAt?: any;
  completedAt?: string | null;
  completedBy?: string | null;

  tenantId?: string;
}

const TITLE_MAX = 240;
const BRIEF_MAX = 2000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateCalendarItem(input: Partial<SeoCalendarItem>): string[] {
  const errors: string[] = [];
  if (!input.type || !['blog', 'gbp_post', 'fix', 'refresh', 'backlink'].includes(input.type)) {
    errors.push('type invalid.');
  }
  if (!input.title || input.title.length === 0) errors.push('title required.');
  if (input.title && input.title.length > TITLE_MAX) errors.push(`title too long (max ${TITLE_MAX}).`);
  if (input.brief && input.brief.length > BRIEF_MAX) errors.push('brief too long.');
  if (!input.scheduledDate || !ISO_DATE.test(input.scheduledDate)) {
    errors.push('scheduledDate must be YYYY-MM-DD.');
  }
  return errors;
}
