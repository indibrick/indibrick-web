// Generated + curated SEO article content.
//
// Every draft, review-ready, approved, and published article lands
// in /seoContent. Follows the existing convention of keeping title,
// slug, excerpt, and body as separate fields so we can render them
// in different surfaces (list vs page vs GBP post) without parsing
// HTML at read time.
//
// The route/[city]/[type]/[priceRange] convention on the public
// programmatic pages is preserved — the `target` bag mirrors those
// dimensions so an article can be attached to a specific
// programmatic page or stand alone as a general blog piece.

export type SeoContentStatus = 'draft' | 'in_review' | 'approved' | 'published';
export type SeoContentKind = 'blog' | 'programmatic_page_refresh' | 'gbp_post' | 'gbp_review_reply';

export interface SeoContentTarget {
  city?: string;         // e.g. "toronto"
  propertyType?: string; // e.g. "condo"
  priceRange?: string;   // e.g. "under-500k"
  keywordPrimary?: string;
  keywordSecondary?: string[];
}

export interface SeoContentDoc {
  kind: SeoContentKind;
  status: SeoContentStatus;

  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;

  target: SeoContentTarget;

  // Generation provenance.
  aiModel?: string;          // e.g. "claude-opus-4-7"
  promptVersion?: string;    // bump when we change the generator prompt
  sourceCalendarItemId?: string | null;
  generatedAt?: string;

  // Review + approval trail.
  createdBy: string;
  createdAt?: any;           // Firestore serverTimestamp
  updatedAt?: any;
  reviewedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;

  // Post-publish state.
  publishedTo?: Array<{
    destination: 'wordpress' | 'shopify' | 'gbp';
    destinationId?: string;  // wp site id, shopify shop domain, gbp location id
    publishedUrl?: string;
    publishedAt: string;
  }>;

  // GEO / AEO signal — populated during generation from the prompt's
  // "does this contain a direct-answer block a language model could
  // cite" gate. Not authoritative — audits recompute on refresh.
  geoReadinessScore?: number; // 0..100
  aeoDirectAnswerBlocks?: number;

  tenantId?: string;
}

const TITLE_MAX = 160;
const SLUG_MAX = 200;
const EXCERPT_MAX = 500;
const BODY_MAX = 200_000; // ~200KB HTML — plenty; Firestore doc cap is 1MB

export function validateSeoContent(input: Partial<SeoContentDoc>): string[] {
  const errors: string[] = [];
  if (!input.title || input.title.trim().length === 0) errors.push('Title required.');
  if (input.title && input.title.length > TITLE_MAX) errors.push(`Title too long (max ${TITLE_MAX}).`);
  if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) errors.push('Slug must be lowercase-kebab-case.');
  if (input.slug && input.slug.length > SLUG_MAX) errors.push(`Slug too long (max ${SLUG_MAX}).`);
  if (input.excerpt && input.excerpt.length > EXCERPT_MAX) errors.push(`Excerpt too long (max ${EXCERPT_MAX}).`);
  if (input.bodyHtml && input.bodyHtml.length > BODY_MAX) errors.push('Body too large.');
  if (input.status && !['draft', 'in_review', 'approved', 'published'].includes(input.status)) {
    errors.push('Status invalid.');
  }
  return errors;
}
