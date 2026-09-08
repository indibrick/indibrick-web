/**
 * Author registry for blog E-E-A-T.
 *
 * Why this exists: blog posts live in Firestore and carry a free-text `author`
 * string. That string was the ONLY author signal on the page — no job title,
 * no licence, no entity URL. On a YMYL (Your Money or Your Life) financial
 * site that is the single weakest E-E-A-T signal we ship, and it's a prime
 * suspect for the "Crawled – currently not indexed" cluster: Google has no
 * way to tell that a mortgage article was written by a licensed Ontario
 * mortgage agent rather than by nobody in particular.
 *
 * Everything in here is sourced from a page we actually publish (/about) or
 * from the brokerage's own public agent profile. Nothing is invented — an
 * author with no verifiable licence simply has no `fsraLicence` field, and
 * `licensed: false` marks contributors whose posts need a licensed reviewer
 * before they carry financial advice.
 */

export interface AuthorProfile {
  /** URL slug for the author's own entity page at /authors/{slug}. */
  slug: string;
  /** Byline as it should render (canonical spelling — overrides the Firestore string). */
  name: string;
  /** Role, verbatim from /about. */
  jobTitle: string;
  /**
   * FSRA mortgage agent licence number. Only populated where the number is
   * publicly published on the brokerage's own agent profile. Absent ≠ unlicensed;
   * absent = we have not verified a number we're willing to put in schema.
   */
  fsraLicence?: string;
  /** Firm the author operates under. Deals are fulfilled via Pineapple Financial Inc. (FSRA #12830). */
  worksFor: string;
  /** One-to-two sentence credential summary rendered in the byline card. From /about. */
  bio: string;
  /**
   * Whether this author holds a mortgage licence. `false` means their posts are
   * editorial/content work and must be attributed to a licensed reviewer before
   * they read as advice. Google's Quality Rater Guidelines treat unattributed
   * YMYL advice as a low-quality signal.
   */
  licensed: boolean;
}

/**
 * Canonical entity URL for an author.
 *
 * Previously this pointed at /about for everyone, which meant six authors
 * shared one `@id`. Google's Quality Rater Guidelines expect a YMYL author
 * to resolve to their own page carrying credentials and a body of work —
 * an anchor on a shared team page does not establish an author entity.
 * Each author now owns /authors/{slug}.
 */
export function authorPageUrl(slug: string): string {
  return `https://indibrick.ca/authors/${slug}`;
}

/** Legacy shared URL — kept for the org-level fallback byline only. */
export const AUTHOR_PAGE_URL = 'https://indibrick.ca/about';

/** Brokerage of record. Every mortgage on this site is submitted through it. */
export const BROKERAGE = {
  name: 'Pineapple Financial Inc.',
  fsra: '12830',
} as const;

/**
 * Keyed by lowercased byline. Bios are condensed from the /about team cards so
 * the two pages never contradict each other.
 */
const AUTHORS: Record<string, AuthorProfile> = {
  'mudit chhura': {
    slug: 'mudit-chhura',
    name: 'Mudit Chhura',
    jobTitle: 'Co-Founder & Mortgage Agent, Level 1',
    // Published on the brokerage's own public agent profile.
    fsraLicence: 'ON-M25003057',
    worksFor: 'IndiBrick',
    bio: 'Co-Founder of IndiBrick and a licensed Ontario Mortgage Agent (Level 1). Leads platform development and lender/partner relationships, and works purchase, refinance and renewal files across the GTA.',
    licensed: true,
  },
  'vikas sharma': {
    slug: 'vikas-sharma',
    name: 'Vikas Sharma',
    jobTitle: 'Mortgage Broker',
    worksFor: 'Dream Home + Life',
    bio: 'Mortgage Broker with over 22 years across major Canadian banks and brokerages. Specialises in complex approvals where the file does not fit standard bank policy.',
    licensed: true,
  },
  'nitish gupta': {
    slug: 'nitish-gupta',
    name: 'Nitish Gupta',
    jobTitle: 'Co-Founder & Mortgage Agent, Level 1',
    worksFor: 'Dream Home + Life',
    bio: 'Co-Founder of IndiBrick and a licensed Ontario Mortgage Agent (Level 1). Spent six years inside major Canadian financial institutions before moving to the brokerage side.',
    licensed: true,
  },
  'jeet gandhi': {
    slug: 'jeet-gandhi',
    name: 'Jeet Gandhi',
    jobTitle: 'Mortgage Agent, Level 1',
    worksFor: 'Dream Home + Life',
    bio: 'Licensed Ontario Mortgage Agent (Level 1). Handles purchase, renewal and refinance files across the GTA from application through to funding.',
    licensed: true,
  },
  'saad shaikh': {
    slug: 'saad-shaikh',
    name: 'Saad Shaikh',
    jobTitle: 'Co-Founder',
    worksFor: 'IndiBrick',
    bio: 'Co-Founder of IndiBrick. Focuses on product strategy and simplifying real estate workflows into a transparent digital experience.',
    // Product/strategy role, not a licensed mortgage agent — posts under this
    // byline must not present as personalised mortgage advice.
    licensed: false,
  },
  'sana khan': {
    slug: 'sana-khan',
    name: 'Sana Khan',
    jobTitle: 'Content Lead',
    worksFor: 'IndiBrick',
    bio: 'Content Lead at IndiBrick. Translates lender policy and market data into plain-language explainers for Ontario homeowners.',
    // Editorial role — see `licensed` doc comment.
    licensed: false,
  },
};

/**
 * Bylines currently sitting in Firestore that are actively harmful and get
 * normalised away rather than rendered.
 *
 * - "IndiBrick AI Intelligence" literally tells Google the byline is a machine.
 *   Under the March 2024 core/spam update, scaled content abuse is assessed on
 *   whether content is mass-produced without adding value — advertising it in
 *   the byline is the worst possible framing.
 * - "Admin" is a null author signal.
 *
 * Both map to `null`, which makes the template fall back to Organization
 * authorship (honest) instead of inventing a Person. The real fix is to
 * reassign these posts to a named licensed agent in Firestore.
 */
const SUPPRESSED_BYLINES = new Set([
  'admin',
  'indibrick admin',
  'indibrick ai intelligence',
  'indibrick ai',
  'indibrick research',
  'indibrick team',
  'indibrick financial',
  '',
]);

/**
 * Resolve a raw Firestore byline to a verified profile.
 * Returns null when the byline is unknown or suppressed — callers should then
 * attribute the post to the organisation rather than to a fabricated person.
 */
export function resolveAuthor(rawName?: string): AuthorProfile | null {
  const key = (rawName || '').trim().toLowerCase();
  if (!key || SUPPRESSED_BYLINES.has(key)) return null;
  return AUTHORS[key] ?? null;
}

/** Every author, for /authors index + generateStaticParams. */
export function allAuthors(): AuthorProfile[] {
  return Object.values(AUTHORS);
}

/** Resolve an author by their URL slug. Null for unknown slugs → 404. */
export function authorBySlug(slug: string): AuthorProfile | null {
  return Object.values(AUTHORS).find((a) => a.slug === slug) ?? null;
}

/**
 * Does this Firestore byline map to a profile with its own entity page?
 * Used by the blog template to decide whether to link the byline.
 */
export function authorSlugForByline(rawName?: string): string | null {
  return resolveAuthor(rawName)?.slug ?? null;
}

/** Two-letter avatar initials, with a stable brand fallback. */
export function authorInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || 'IB';
}
