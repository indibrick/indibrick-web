import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BlogPost } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Clock, Calculator, ShieldCheck, BadgeCheck, ArrowRight } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import LeadForm from '@/components/LeadForm';
import { buildMetadata } from '@/lib/buildMetadata';
import { ContentService } from '@/services/ContentService';
import {
  resolveAuthor,
  authorInitials,
  authorPageUrl,
  AUTHOR_PAGE_URL,
  BROKERAGE,
  type AuthorProfile,
} from '@/lib/authors';
import { BLOG_NOINDEX_SLUGS } from '../../../data/blogPrunePlan.mjs';

// ISR — every blog post regenerates at most once an hour. Tradeoff: typo fixes
// take up to 60 min to propagate, but Google sees pre-rendered HTML on crawl.
export const revalidate = 3600;

// Pre-render every published post at build time so Google + LLM crawlers see
// fully-static HTML. New posts published after build are still SSR'd on first
// visit and then cached by ISR.
export async function generateStaticParams() {
  try {
    const posts = await ContentService.fetchPosts();
    // Drafts are excluded here AND 404'd in the page body. Previously drafts
    // were pre-rendered and publicly reachable by slug even though /blog hid
    // them — half-finished posts were crawlable and indexable.
    return posts
      .filter((p) => p.slug && p.status !== 'draft')
      .map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

// 🚀 CTO DIRECTIVE: Swapped to native Node.js parser to fix Docker/ESM build crash
import sanitizeHtml from 'sanitize-html';

// Import Calculators
import MortgageCalculator from '@/components/MortgageCalculator';
import LandTransferTaxCalculator from '@/components/LandTransferTaxCalculator';
import ClosingCostsCalculator from '@/components/ClosingCostsCalculator';
import AffordabilityCalculator from '@/components/AffordabilityCalculator';

// --- 1. DATA FETCHING ---

// Firestore dates arrive as Timestamp | string | undefined depending on how the
// post was written (admin UI vs. seed script). Normalise to ISO once, here.
function toIso(value: any, fallback?: string): string | undefined {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(collection(db, 'posts'), where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();

    const date = toIso(data.date, new Date().toISOString())!;
    // dateModified is genuinely optional — if we've never edited the post,
    // omit it rather than echoing the publish date as a fake "freshness" claim.
    const dateModified = toIso(data.dateModified ?? data.updatedAt);

    return { id: snapshot.docs[0].id, ...data, date, dateModified } as BlogPost;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// --- 1b. CONTENT METRICS + RELATED POSTS ---

/** Strip tags/entities so we're counting prose, not markup. */
function plainText(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCountOf(html: string): number {
  const text = plainText(html);
  return text ? text.split(' ').length : 0;
}

/** 225 wpm is the figure Google's own readability tooling assumes. */
function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 225));
}

/**
 * Sibling posts for the "Continue reading" block.
 *
 * Why this matters more than it looks: before this, every post's only outbound
 * internal links were /contact and a "Related Intel" widget whose four tags all
 * pointed at /blog. Individual posts were effectively orphaned behind a single
 * reverse-chronological feed, so Google saw no topical clustering and no
 * internal PageRank flowing between related articles — a textbook profile for
 * "Crawled – currently not indexed".
 */
async function getRelatedPosts(current: BlogPost, limit = 3): Promise<BlogPost[]> {
  try {
    const all = await ContentService.fetchPosts();
    const candidates = all.filter(
      (p: any) =>
        p.slug &&
        p.slug !== current.slug &&
        p.status !== 'draft' &&
        p.noindex !== true,
    );

    const byRecency = (a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime();

    // Same category first (real topical adjacency), then backfill with the most
    // recent posts so the block is never empty and never renders a dead link.
    const sameCategory = candidates.filter((p) => p.category === current.category).sort(byRecency);
    const rest = candidates.filter((p) => p.category !== current.category).sort(byRecency);

    return [...sameCategory, ...rest].slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Contextual money-page links, chosen from the slug/category.
 *
 * Editorial posts previously dead-ended at /contact. These push readers (and
 * crawlers) into the commercial pages that actually need the internal links.
 */
function getMoneyLinks(slug: string, category: string): { href: string; label: string }[] {
  const s = `${slug} ${category}`.toLowerCase();
  const links: { href: string; label: string }[] = [];

  if (/hst|rebate|tax/.test(s)) links.push({ href: '/hst-rebate-calculator', label: 'Ontario HST rebate calculator' });
  if (/trigger|variable|prime/.test(s)) links.push({ href: '/trigger-rate-calculator', label: 'Trigger rate calculator' });
  if (/renew/.test(s)) links.push({ href: '/situations/mortgage-renewal', label: 'Mortgage renewal playbook' });
  if (/condo|pre-con|precon|appraisal/.test(s)) links.push({ href: '/situations/pre-construction-closing', label: 'Pre-construction closing help' });
  if (/private|b-lender|monoline|bad-credit|decline/.test(s)) links.push({ href: '/bad-credit-private-mortgages', label: 'Private & B-lender mortgages' });
  if (/improvement|renovat|second-mortgage|refinanc/.test(s)) links.push({ href: '/situations/refinance-debt-consolidation', label: 'Refinance & debt consolidation' });
  if (/rate|bank-of-canada|bond|recession|economy/.test(s)) links.push({ href: '/mortgage-rate-forecast', label: 'Ontario mortgage rate forecast' });
  if (/rental|invest/.test(s)) links.push({ href: '/situations/investment-property', label: 'Investment property financing' });

  // Always-on anchors so no post ships with fewer than three internal links.
  links.push({ href: '/rates', label: 'Today’s Ontario mortgage rates' });
  links.push({ href: '/guides/first-time-home-buyer-ontario-2026', label: 'Ontario first-time buyer guide' });

  // De-dupe by href, cap at four so the block stays a recommendation, not a
  // link farm.
  const seen = new Set<string>();
  const unique = links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });
  return unique.slice(0, 4);
}

// --- 2. TOOL SELECTOR ---
function getContextualTool(slug: string, category: string) {
  const s = slug.toLowerCase();
  
  if (s.includes('land-transfer') || s.includes('ltt')) {
    return {
      title: "Ontario Land Transfer Tax Calculator",
      subtitle: "Calculate your exact closing costs and rebates.",
      component: <LandTransferTaxCalculator />
    };
  }
  if (s.includes('affordability') || s.includes('qualify') || s.includes('income')) {
    return {
      title: "Maximum Affordability Engine",
      subtitle: "Stress-test your income against 2026 banking rules.",
      component: <AffordabilityCalculator />
    };
  }
  if (s.includes('closing') || s.includes('cost')) {
    return {
      title: "Total Cash Required",
      subtitle: "Estimate legal fees, adjustments, and land taxes.",
      component: <ClosingCostsCalculator />
    };
  }
  if (category === 'Mortgage' || s.includes('rate') || s.includes('payment') || s.includes('refinance')) {
    return {
      title: "Mortgage Payment Scenarios",
      subtitle: "Model your monthly payments at different rates.",
      component: <MortgageCalculator />
    };
  }
  
  return null;
}

// --- 3. DYNAMIC SEO METADATA ENGINE ---
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return buildMetadata({
      title: 'Article Not Found',
      description: 'The requested financial strategy article could not be located.',
      slug: `/blog/${params.slug}`,
    });
  }

  const author = resolveAuthor(post.author);

  return buildMetadata({
    title: post.title,
    description: post.excerpt || `Read the latest market intelligence on ${post.title} from IndiBrick.`,
    slug: `/blog/${params.slug}`,
    image: post.imageUrl,
    // og:type=article + article:* — blog posts are dated documents, not
    // evergreen pages. Every post previously shipped og:type=website.
    ogType: 'article',
    publishedTime: post.date,
    modifiedTime: post.dateModified,
    authors: author ? [author.name] : undefined,
    section: post.category,
    // Firestore-controlled kill switch for thin/expired posts. Lets us prune
    // the index without deleting URLs or breaking inbound links.
    // BLOG_NOINDEX_SLUGS is read directly rather than relying on the Firestore
    // `noindex` flag, which is only written when scripts/pruneBlog.ts --apply
    // is run. Without this the three planned-noindex posts kept rendering as
    // indexable while already being withheld from the sitemap — a page that is
    // indexable but unlisted is exactly the mixed signal to avoid.
    noindex:
      post.noindex === true ||
      post.status === 'draft' ||
      BLOG_NOINDEX_SLUGS.includes(params.slug),
  });
}

// --- 4. PAGE COMPONENT ---
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();
  // Drafts are not public. generateMetadata already noindexes them; this stops
  // them rendering at all.
  if (post.status === 'draft') notFound();

  const url = `https://indibrick.ca/blog/${post.slug}`;
  const words = wordCountOf(post.content);
  const minutes = readingMinutes(words);

  // The injected calculator is ~400 words of markup that is BYTE-IDENTICAL on
  // every post it appears on (it SSRs its default $750k / 20% down / 4.29%
  // scenario). On a 1,500-word article that's a useful tool; on a 450-word
  // article the boilerplate rivals the article itself and the page reads to
  // Google as mostly-duplicate template. Gate on length so thin posts aren't
  // drowned by shared furniture.
  const activeTool = words >= 700 ? getContextualTool(post.slug, post.category) : null;

  const author = resolveAuthor(post.author);
  const reviewer = resolveAuthor(post.reviewedBy);
  const relatedPosts = await getRelatedPosts(post);
  const moneyLinks = getMoneyLinks(post.slug, post.category);

  // Author as a schema entity. For YMYL, a bare `{ name: "..." }` Person tells
  // Google nothing about whether the writer is qualified to give mortgage
  // advice. jobTitle + hasCredential + worksFor + a resolvable `url` are the
  // fields that connect the byline to a real, licensed human.
  // NOTE: `@id` and `url` must match the Person node emitted by
  // /authors/{slug} exactly, or Google sees two unrelated Person entities
  // instead of one author with a body of work.
  const personNode = (a: AuthorProfile) => ({
    '@type': 'Person',
    '@id': `${authorPageUrl(a.slug)}#person`,
    name: a.name,
    jobTitle: a.jobTitle,
    description: a.bio,
    url: authorPageUrl(a.slug),
    worksFor: { '@type': 'Organization', name: a.worksFor },
    ...(a.fsraLicence
      ? {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'license',
            name: 'FSRA Mortgage Agent Licence (Level 1)',
            identifier: a.fsraLicence,
            recognizedBy: {
              '@type': 'Organization',
              name: 'Financial Services Regulatory Authority of Ontario',
            },
          },
        }
      : {}),
  });

  // Fall back to Organization authorship when the byline is unverified — an
  // honest signal beats inventing a Person Google can't corroborate.
  const authorNode = author
    ? personNode(author)
    : { '@type': 'Organization', '@id': 'https://indibrick.ca/#organization', name: 'IndiBrick' };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    // mainEntityOfPage is what tells Google this markup describes THIS URL
    // rather than some other page that happens to embed it.
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: post.title.slice(0, 110), // Google truncates headline past ~110 chars
    name: post.title,
    description: post.excerpt,
    ...(post.imageUrl ? { image: [post.imageUrl] } : {}),
    datePublished: post.date,
    // Only claim a modified date when one actually exists.
    ...(post.dateModified ? { dateModified: post.dateModified } : {}),
    inLanguage: 'en-CA',
    articleSection: post.category,
    wordCount: words,
    timeRequired: `PT${minutes}M`,
    isAccessibleForFree: true,
    author: authorNode,
    ...(reviewer ? { reviewedBy: personNode(reviewer) } : {}),
    // Link to the Organization node declared once in app/layout.tsx instead of
    // re-declaring a thin publisher — one entity, referenced everywhere.
    publisher: { '@id': 'https://indibrick.ca/#organization' },
    isPartOf: { '@id': 'https://indibrick.ca/#website' },
    // YMYL disclosure, machine-readable.
    creditText: `IndiBrick — mortgages brokered through ${BROKERAGE.name} (FSRA #${BROKERAGE.fsra})`,
  };

  const displayName = author?.name || 'IndiBrick Editorial';
  const initials = authorInitials(displayName);
  const publishedLabel = new Date(post.date).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const modifiedLabel = post.dateModified
    ? new Date(post.dateModified).toLocaleDateString('en-CA', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  // 🔒 SECURE & SCALABLE: Sanitize content natively. Preserves styling, drops malicious scripts.
  const cleanHTML = sanitizeHtml(post.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'iframe', 'div', 'span', 'p'
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'style', 'id'], // CRITICAL: Preserves our Tailwind CSS classes
      'img': ['src', 'alt', 'width', 'height'],
      'iframe': ['src', 'width', 'height', 'allowfullscreen', 'frameborder'],
      'a': ['href', 'name', 'target', 'rel']
    },
    // The template already renders the post title as the page's <h1>. Any <h1>
    // inside the Firestore body would give the page two competing top-level
    // headings and blur what the page is about — demote to <h2> so the
    // heading outline stays: one H1, then the body's own hierarchy.
    transformTags: {
      h1: 'h2',
    },
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'] // Security best practice
  });

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
      <JsonLd data={articleSchema} />

      {/* --- PROGRESS BAR --- */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-100 z-50">
        <div className="h-full bg-blue-600 w-0 animate-scroll-progress"></div>
      </div>

      {/* --- HEADER SECTION --- */}
      <header className="pt-32 pb-12 px-6 bg-white border-b border-gray-100">
         <div className="container mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition">
                    <ArrowLeft size={12} /> Intelligence Hub
                </Link>
                <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-400">
                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-500">{post.category}</span>
                    <span>•</span>
                    {/* Was hardcoded "5 Min Read" on every post regardless of
                        length — a false signal and one more identical string
                        across the corpus. Now derived from the actual body. */}
                    <span className="flex items-center gap-1"><Clock size={12}/> {minutes} Min Read</span>
                </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-8 max-w-4xl">
                {post.title}
            </h1>

            {/* BYLINE — the primary E-E-A-T surface on a YMYL page. Job title,
                licence number and a link to the author's entity page are the
                signals Google's raters are explicitly told to look for on
                financial advice; the old byline had none of them. */}
            <div className="flex flex-wrap items-center gap-6 text-sm border-t border-gray-100 pt-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">{initials}</div>
                    <div>
                        <p className="font-bold text-slate-900 leading-tight">
                          {/* Links to the author's own entity page, not the shared
                              /about roster — gives Google a crawl path from every
                              article to the Person node and its credentials. */}
                          {author ? (
                            <Link href={`/authors/${author.slug}`} className="hover:text-blue-600 transition">{displayName}</Link>
                          ) : (
                            displayName
                          )}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {author ? `${author.jobTitle}, ${author.worksFor}` : 'IndiBrick Financial'}
                        </p>
                    </div>
                </div>
                <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                {/* <time dateTime> — machine-readable dates. The old markup
                    emitted only a locale-formatted string. */}
                <div className="text-gray-500 font-medium">
                    Published{' '}
                    <time dateTime={post.date} className="text-slate-900">{publishedLabel}</time>
                    {modifiedLabel && (
                      <>
                        {' · Updated '}
                        <time dateTime={post.dateModified} className="text-slate-900">{modifiedLabel}</time>
                      </>
                    )}
                </div>
                {reviewer && (
                  <>
                    <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                    <div className="text-gray-500 font-medium flex items-center gap-1.5">
                      <BadgeCheck size={14} className="text-blue-600" />
                      Reviewed by <span className="text-slate-900">{reviewer.name}</span>
                    </div>
                  </>
                )}
            </div>
         </div>
      </header>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="container mx-auto max-w-7xl px-6 py-12 md:py-20">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
            
            {/* LEFT COLUMN: Article Content */}
            <main className="lg:col-span-8">
                
                <div className="mb-12 rounded-[2rem] overflow-hidden shadow-2xl bg-gray-100 relative aspect-video">
                    <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-1000" 
                    />
                </div>

                <div className="prose prose-lg md:prose-xl prose-slate max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 
                    prose-p:text-gray-600 prose-p:leading-relaxed prose-p:font-medium
                    prose-a:text-blue-600 prose-a:no-underline prose-a:font-bold hover:prose-a:underline
                    prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                    prose-img:rounded-3xl prose-img:shadow-lg">
                    
                    {/* 🔒 SECURE: Render Native sanitized HTML */}
                    <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
                </div>

                {/* INJECTED TOOL */}
                {activeTool && (
                    <div className="mt-20 mb-20 -mx-6 md:-mx-12 p-6 md:p-12 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                        <div className="relative z-10 mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
                            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/50">
                                <Calculator size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{activeTool.title}</h3>
                                <p className="text-blue-200 text-sm font-medium">{activeTool.subtitle}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl p-1 shadow-inner">
                            {activeTool.component}
                        </div>
                    </div>
                )}

                {/* --- CONTEXTUAL INTERNAL LINKS --- */}
                {/* Real in-content links to the tools and situation pages this
                    article is actually about. Previously every post's only
                    outbound links were /contact and four tags pointing at /blog. */}
                <nav className="mt-16 p-8 bg-blue-50/60 rounded-[2rem] border border-blue-100" aria-label="Related tools and guides">
                    <h2 className="text-xs font-black uppercase tracking-widest text-blue-700 mb-5">Keep going</h2>
                    <ul className="space-y-3">
                        {moneyLinks.map((l) => (
                            <li key={l.href}>
                                <Link href={l.href} className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-blue-600 transition">
                                    <ArrowRight size={14} className="text-blue-600 shrink-0" />
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* --- AUTHOR BIO --- */}
                {/* Google's rater guidelines ask "who is responsible for this
                    content and what makes them qualified?". This block is the
                    on-page answer; the Person schema above is the machine one. */}
                <section className="mt-12 p-8 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">About the author</h2>
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 shrink-0 bg-slate-900 rounded-full flex items-center justify-center text-white font-black">
                            {initials}
                        </div>
                        <div>
                            <p className="font-black text-lg text-slate-900 leading-tight">
                                {author ? (
                                    <Link href={`/authors/${author.slug}`} className="hover:text-blue-600 transition">{displayName}</Link>
                                ) : (
                                    displayName
                                )}
                            </p>
                            <p className="text-sm font-bold text-blue-600 mb-3">
                                {author ? `${author.jobTitle} · ${author.worksFor}` : 'IndiBrick Editorial Team'}
                            </p>
                            <p className="text-gray-600 leading-relaxed text-[15px]">
                                {author
                                    ? author.bio
                                    : `Written and fact-checked by the IndiBrick editorial team. Mortgages are brokered through ${BROKERAGE.name} (FSRA #${BROKERAGE.fsra}).`}
                            </p>
                            {author?.fsraLicence && (
                                <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    <BadgeCheck size={14} className="text-blue-600" />
                                    FSRA Licence {author.fsraLicence}
                                </p>
                            )}
                            <p className="mt-4">
                                <Link href="/about" className="text-xs font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 hover:text-blue-600 hover:border-blue-600 transition pb-0.5">
                                    Meet the team
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>

                {/* --- YMYL DISCLOSURE --- */}
                {/* Regulatory transparency doubles as a trust signal: it names
                    the regulator, the licensed brokerage, and the limits of
                    what a general-audience article can be. */}
                <aside className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500 leading-relaxed">
                    <p className="font-black uppercase tracking-widest text-gray-400 mb-2">Editorial &amp; licensing disclosure</p>
                    <p>
                        IndiBrick is an Ontario mortgage brokerage operation. Mortgages are brokered and
                        funded through {BROKERAGE.name}, licensed by the Financial Services Regulatory
                        Authority of Ontario (FSRA&nbsp;#{BROKERAGE.fsra}). This article is general
                        information about Canadian mortgage and housing markets — it is not personalised
                        financial, legal or tax advice, and it does not constitute an offer of credit.
                        Rates, lender policies and government programs change frequently; confirm current
                        details with a licensed mortgage agent before acting.{' '}
                        <Link href="/contact" className="font-bold text-blue-600 hover:underline">Speak to a licensed agent</Link>.
                    </p>
                </aside>

                {/* --- RELATED POSTS --- */}
                {relatedPosts.length > 0 && (
                    <section className="mt-16 pt-12 border-t border-gray-100">
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Related analysis</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {relatedPosts.map((rp) => (
                                <Link key={rp.id} href={`/blog/${rp.slug}`} className="group block">
                                    <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-4">
                                        <img
                                            src={rp.imageUrl}
                                            alt={rp.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                        />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">{rp.category}</p>
                                    <h3 className="font-black text-slate-900 leading-tight group-hover:text-blue-600 transition text-[15px]">
                                        {rp.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* RIGHT COLUMN: Sticky Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
                <div className="sticky top-32">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-slate-900">Need this executed?</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            Reading is research. Execution is wealth. Our team can structure this exact strategy for your portfolio.
                        </p>
                        <a href="/contact" className="block w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition shadow-lg mb-4">
                            Book Strategy Call
                        </a>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Free • No Obligation</p>
                    </div>

                    {/* Was four "tags" (Mortgage / Tax Strategy / Legal /
                        Market Data) that ALL linked to /blog — four identical
                        hrefs with mismatched anchor text on every post in the
                        corpus. Replaced with genuine sibling-post links. */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-8 bg-gray-50 p-8 rounded-[2rem] border border-gray-100 hidden lg:block">
                            <h4 className="font-black uppercase text-xs tracking-widest text-gray-400 mb-6">More on {post.category}</h4>
                            <ul className="space-y-4">
                                {relatedPosts.map((rp) => (
                                    <li key={rp.id}>
                                        <Link href={`/blog/${rp.slug}`} className="block text-sm font-bold text-slate-800 leading-snug hover:text-blue-600 transition">
                                            {rp.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/blog" className="mt-6 inline-block text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition">
                                Browse all analysis →
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
         </div>
      </div>

      {/* --- FOOTER CTA (Mobile Fallback) --- */}
      <section className="lg:hidden py-16 px-6 bg-slate-900 text-white text-center">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Ready to act?</h3>
          <p className="text-gray-400 mb-8 text-sm">Turn this insight into a funded deal.</p>
          <a href="/contact" className="inline-block bg-white text-black px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs">
              Book Call
          </a>
      </section>
    </div>
  );
}