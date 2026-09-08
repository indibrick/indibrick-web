// Blog prune plan — single source of truth.
//
// Consumed by BOTH:
//   - next.config.mjs   → emits the 301 redirects
//   - scripts/pruneBlog.ts → writes `noindex` flags into Firestore
//
// Kept as .mjs (not .ts) because next.config.mjs must import it natively
// at build time. If the two ever drift, you get a page that 301s while
// still claiming to be indexable, or vice versa.
//
// ─── Why prune at all ───────────────────────────────────────────────
// Google crawled all 18 of these and declined to index them. Leaving
// thin/duplicate posts live is a site-wide quality signal, not a
// per-page one — it suppresses the /mortgage-broker/{city} set and the
// pSEO matrix that actually convert. Five strong URLs that rank beat
// eighteen Google refuses to store.
//
// ─── Actions ────────────────────────────────────────────────────────
//   'redirect' → 301 to `to`. URL stops existing. Use when the content
//                should never come back (dead news cycle, duplicate,
//                legal exposure) or when it's being merged into a pillar.
//   'noindex'  → page stays live and readable, drops out of the index.
//                Reversible. Use for content that's genuinely useful to
//                a human but has no search demand and dilutes topical
//                focus.
//
// Anything not listed here is KEPT and indexable.

/**
 * @typedef {Object} PruneEntry
 * @property {string} slug     Blog slug (no leading /blog/)
 * @property {'redirect'|'noindex'} action
 * @property {string} [to]     Destination path — required for 'redirect'
 * @property {string} reason   Why. Shown in the script's dry-run output.
 */

/** @type {PruneEntry[]} */
export const BLOG_PRUNE_PLAN = [
  // ─── REDIRECT: dead news cycles + non-mortgage topics ─────────────
  {
    slug: 'middle-east-iran-conflict-impact-canadian-economy-real-estate',
    action: 'redirect',
    to: '/mortgage-rate-forecast',
    reason: 'News reaction (Mar 2026). Search demand gone; widely syndicated angle.',
  },
  {
    slug: 'RECO-action-against-SaveMax',
    action: 'redirect',
    to: '/blog',
    reason: 'Names individuals re: allegations under an "Admin" byline. Legal exposure >> SEO value. Not mortgage-related.',
  },
  {
    slug: 'ai-technology-revolutionizing-real-estate-industry-indibrick',
    action: 'redirect',
    to: '/about',
    reason: 'Pure self-promotion, no search demand. Exact profile Google\'s helpful-content signals target.',
  },
  {
    slug: 'trigger-rate-oakville-2026',
    action: 'redirect',
    to: '/trigger-rate-calculator',
    reason: 'Templated pSEO bylined "IndiBrick AI Intelligence". Contains the null sentence "prices hovering around typical market rates". Intent already served by the calculator + /mortgage-broker/oakville.',
  },

  // ─── REDIRECT: self-duplication ───────────────────────────────────
  {
    slug: 'survival-mode-economy-canada-housing-mindset',
    action: 'redirect',
    to: '/blog/canada-economy-survival-mode-overleveraged-wealth',
    reason: 'Near-duplicate of the target: same author, same publish date, same thesis, same closing question. Two URLs, one idea.',
  },

  // ─── REDIRECT: consolidate into the HST pillar ────────────────────
  // The pillar is /blog/ontario-hst-rebate-expansion-new-homes-2026-market-impact
  {
    slug: 'hst-new-housing-rebate-pros-cons-canada',
    action: 'redirect',
    to: '/blog/ontario-hst-rebate-expansion-new-homes-2026-market-impact',
    reason: 'FACTUALLY STALE. Published after the expansion took effect but cites the pre-expansion "$50,000" regime, contradicting the pillar\'s $130,000. Two pages, two different numbers, same program.',
  },
  {
    slug: 'hst-rebate-impact-on-resale-market-canada',
    action: 'redirect',
    to: '/blog/ontario-hst-rebate-expansion-new-homes-2026-market-impact',
    reason: '900-word opinion riff on the same program. Belongs as a "What it means for resale" section inside the pillar.',
  },

  // ─── REDIRECT: rate-announcement decay ────────────────────────────
  // One post per BoC decision is a decay machine. The evergreen forecast
  // page can rank permanently; a dated announcement post peaks in 72h.
  {
    slug: 'bank-of-canada-interest-rate-announcement-march-2026-hold-at-2-25',
    action: 'redirect',
    to: '/mortgage-rate-forecast',
    reason: 'Dated rate-announcement post. Fold recurring coverage into the evergreen forecast page and keep one URL.',
  },
  {
    slug: 'ottawa-buying-30-billion-canada-mortgage-bonds-impact',
    action: 'redirect',
    to: '/mortgage-rate-forecast',
    reason: 'Real topic (CMB mechanics as a rate driver) trapped in a news frame. Merge the mechanics into the forecast page.',
  },

  // ─── NOINDEX: keep live, drop from index ──────────────────────────
  // Competent writing, zero mortgage search demand. Political-macro
  // commentary dilutes the mortgage topical entity. Kept readable
  // because they're not wrong — just not search assets.
  {
    slug: 'canada-g7-recession-anomaly',
    action: 'noindex',
    reason: 'Macro op-ed. No mortgage search demand; dates instantly.',
  },
  {
    slug: 'bureaucracy-over-regulation-destroying-canadian-economy-real-estate',
    action: 'noindex',
    reason: 'Macro op-ed. Key figures ("19 years to approve a mine", "31 studies") are unsourced — on YMYL that is a liability, not evidence.',
  },
  {
    slug: 'nova-scotia-least-affordable-rental-market-canada-housing-crisis',
    action: 'noindex',
    reason: 'Ontario brokerage publishing Nova Scotia rental commentary. No authority, cannot serve the market.',
  },
];

/**
 * Posts explicitly KEPT and prioritised for rewrite. Not acted on by the
 * script — listed so the plan documents the whole set rather than only
 * the deletions.
 * @type {{slug: string, note: string}[]}
 */
export const BLOG_KEEP_AND_STRENGTHEN = [
  {
    slug: 'ontario-hst-rebate-expansion-new-homes-2026-market-impact',
    note: 'PILLAR. Verify the "$24,000 between $1.5M–$1.85M" claim — the federal FTHB GST rebate phases to ZERO at $1.5M. Fix or cut that line.',
  },
  {
    slug: 'purchase-plus-improvements-mortgage-vs-second-mortgage-canada',
    note: 'Strongest evergreen commercial asset. Add insured-vs-conventional improvement caps, name the CMHC Improvement product correctly, add worked semi-annual-compounding comparison, FAQ schema.',
  },
  {
    slug: 'Beyond-the-Big-Banks-Understanding-Monoline-B-Lenders-and-Private-Mortgages',
    note: 'Good topic, killed by an "Admin" byline and a 74-char mixed-case slug. Re-slug to monoline-vs-b-lender-vs-private-mortgage-ontario (301 the old URL), attribute to a licensed agent, add IRD vs 3-month-interest penalty math.',
  },
  {
    slug: 'osfi-condo-appraisal-crisis-toronto-vancouver-2026',
    note: 'Real persistent demand ("appraisal came in low pre-construction"). Needs a named OSFI source, shortfall math at 80% LTV, and should stop naming a specific bank\'s policy. Link to /situations/pre-construction-closing.',
  },
  {
    slug: 'mortgage-industry-bad-advice-power-of-sale-risk',
    note: 'Only post with genuine first-hand practitioner Experience. Expand to 1,200+ with an anonymised Ontario power-of-sale timeline and the Mortgages Act (RSO 1990, c. M.40) notice-of-sale steps.',
  },
];

/** Slugs that get a 301. */
export const BLOG_REDIRECTS = BLOG_PRUNE_PLAN.filter((p) => p.action === 'redirect');

/** Slugs that stay live but drop out of the index. */
export const BLOG_NOINDEX_SLUGS = BLOG_PRUNE_PLAN
  .filter((p) => p.action === 'noindex')
  .map((p) => p.slug);
