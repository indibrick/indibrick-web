// Author entity page — /authors/{slug}
//
// Why this exists: on a YMYL (Your Money or Your Life) financial site,
// Google's Quality Rater Guidelines expect the author of financial advice
// to resolve to a page establishing WHO they are, WHAT credential they
// hold, and WHAT ELSE they have written. Before this, every blog byline
// pointed at /about — six authors sharing one URL, which establishes an
// organisation but not an author entity.
//
// Each page emits a full `Person` node with `hasCredential` naming FSRA
// as the recognising authority, plus a real archive of that author's
// posts. That archive is the "body of work" signal; an author page with
// no linked articles is close to worthless.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck, ArrowRight, FileText, Building2 } from 'lucide-react';
import { allAuthors, authorBySlug, authorPageUrl, authorInitials, BROKERAGE } from '../../../lib/authors';
import { ContentService } from '../../../services/ContentService';
import { buildMetadata } from '../../../lib/buildMetadata';
import type { BlogPost } from '../../../types';

export const revalidate = 3600;

interface Props { params: { slug: string } }

export function generateStaticParams() {
  return allAuthors().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const author = authorBySlug(params.slug);
  if (!author) {
    return buildMetadata({
      title: 'Author Not Found',
      description: 'This author profile could not be located.',
      slug: `/authors/${params.slug}`,
      noindex: true,
    });
  }
  const credential = author.fsraLicence
    ? `FSRA licence ${author.fsraLicence}. `
    : '';
  return buildMetadata({
    title: `${author.name} — ${author.jobTitle} | IndiBrick`,
    description: `${author.bio} ${credential}Articles on Ontario mortgages, rates and housing policy.`.slice(0, 158),
    slug: `/authors/${params.slug}`,
    titleAbsolute: true,
    keywords: [
      author.name,
      `${author.name} mortgage`,
      `${author.name} IndiBrick`,
      'Ontario mortgage agent',
      'licensed mortgage broker Ontario',
    ],
  });
}

export default async function AuthorPage({ params }: Props) {
  const author = authorBySlug(params.slug);
  if (!author) notFound();

  // This author's published posts — the body-of-work signal.
  let posts: BlogPost[] = [];
  try {
    const all = await ContentService.fetchPosts();
    posts = all
      .filter((p: any) =>
        p.status !== 'draft'
        && !p.noindex
        && String(p.author || '').trim().toLowerCase() === author.name.toLowerCase(),
      )
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    // Firestore unreachable at build — render the profile without the
    // archive rather than failing the page.
    posts = [];
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${authorPageUrl(author.slug)}#profilepage`,
        url: authorPageUrl(author.slug),
        name: `${author.name} — ${author.jobTitle}`,
        mainEntity: { '@id': `${authorPageUrl(author.slug)}#person` },
        isPartOf: { '@id': 'https://indibrick.ca/#website' },
      },
      {
        '@type': 'Person',
        '@id': `${authorPageUrl(author.slug)}#person`,
        name: author.name,
        url: authorPageUrl(author.slug),
        jobTitle: author.jobTitle,
        description: author.bio,
        worksFor: {
          '@type': 'Organization',
          name: author.worksFor,
        },
        // Only assert a credential when we hold a verifiable licence number.
        ...(author.fsraLicence
          ? {
              hasCredential: {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'Mortgage Agent Licence',
                identifier: author.fsraLicence,
                recognizedBy: {
                  '@type': 'GovernmentOrganization',
                  name: 'Financial Services Regulatory Authority of Ontario',
                  alternateName: 'FSRA',
                  url: 'https://www.fsrao.ca/',
                },
              },
            }
          : {}),
        knowsAbout: [
          'Ontario mortgages',
          'Mortgage refinancing',
          'Mortgage renewal',
          'CMHC mortgage insurance',
          'OSFI B-20 stress test',
        ],
      },
      // The author's article archive, so Google can associate the body of
      // work with the Person entity above.
      ...(posts.length > 0
        ? [{
            '@type': 'ItemList',
            '@id': `${authorPageUrl(author.slug)}#articles`,
            itemListElement: posts.slice(0, 25).map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `https://indibrick.ca/blog/${p.slug}`,
              name: p.title,
            })),
          }]
        : []),
    ],
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Profile header */}
      <section className="bg-slate-900 text-white pt-28 pb-14 md:pt-36 md:pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link href="/authors" className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition">
            ← All contributors
          </Link>
          <div className="mt-6 flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black shrink-0">
              {authorInitials(author.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">{author.name}</h1>
              <p className="mt-2 text-lg text-white/70">{author.jobTitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Building2 size={12}/> {author.worksFor}
                </span>
                {author.licensed && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={12}/>
                    {author.fsraLicence ? `FSRA ${author.fsraLicence}` : 'Licensed Mortgage Agent'}
                  </span>
                )}
              </div>
              <p className="mt-5 text-base text-white/80 leading-relaxed max-w-2xl">{author.bio}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Credential disclosure — YMYL transparency */}
      <section className="py-8 bg-neutral-50 border-b border-neutral-200">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-sm text-neutral-700 leading-relaxed">
            {author.licensed ? (
              <>
                {author.name} is a licensed mortgage professional in Ontario. Mortgages referenced
                on this site are submitted through <strong>{BROKERAGE.name}</strong>, FSRA
                Brokerage&nbsp;#{BROKERAGE.fsra}. Licence status is verifiable through the{' '}
                <a href="https://www.fsrao.ca/consumers/check-if-your-financial-services-professional-registered"
                  target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  FSRA public register
                </a>.
              </>
            ) : (
              <>
                {author.name} contributes in an editorial capacity and is <strong>not</strong> a
                licensed mortgage agent. Articles under this byline are explanatory and are
                reviewed by a licensed agent before publication where they touch mortgage
                qualification, rates or lender policy. See our{' '}
                <Link href="/editorial-policy" className="text-blue-600 hover:underline">editorial policy</Link>.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Article archive */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Articles by {author.name.split(' ')[0]}
          </h2>
          {posts.length === 0 && (
            <p className="mt-4 text-sm text-neutral-500">
              No published articles under this byline yet.
            </p>
          )}
          {posts.length > 0 && (
            <div className="mt-8 space-y-3">
              {posts.map((p: any) => (
                <Link key={p.slug} href={`/blog/${p.slug}`}
                  className="group block rounded-2xl border border-neutral-200 hover:border-slate-900 transition p-5">
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="text-neutral-400 group-hover:text-blue-600 mt-1 shrink-0"/>
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 group-hover:text-blue-600 transition">{p.title}</h3>
                      {p.excerpt && (
                        <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{p.excerpt}</p>
                      )}
                      <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        {p.date ? new Date(p.date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        {p.category ? ` · ${p.category}` : ''}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/about"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white px-5 py-3 text-[11px] font-black uppercase tracking-widest transition">
              Meet the team <ArrowRight size={12}/>
            </Link>
            <Link href="/editorial-policy"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 hover:border-slate-900 px-5 py-3 text-[11px] font-black uppercase tracking-widest transition">
              Editorial policy <ArrowRight size={12}/>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
