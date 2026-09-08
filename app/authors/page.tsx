// Contributor index — /authors
//
// Hub page linking every author entity. Gives Google a single crawlable
// entry point to the Person nodes and makes the editorial team a
// first-class part of the site graph rather than a section of /about.

import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { allAuthors, authorInitials, BROKERAGE } from '../../lib/authors';
import { buildMetadata } from '../../lib/buildMetadata';

export const metadata = buildMetadata({
  title: 'Contributors — Licensed Ontario Mortgage Professionals | IndiBrick',
  description:
    'The licensed mortgage agents and editorial team behind IndiBrick\'s Ontario mortgage and housing analysis. FSRA licence details and article archives for every contributor.',
  slug: '/authors',
  titleAbsolute: true,
  keywords: [
    'IndiBrick contributors',
    'licensed mortgage agents Ontario',
    'FSRA licensed mortgage broker',
    'Ontario mortgage experts',
  ],
});

export const revalidate = 3600;

export default function AuthorsIndexPage() {
  const authors = allAuthors();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'IndiBrick Contributors',
    description: 'Licensed mortgage professionals and editorial contributors publishing on IndiBrick.',
    url: 'https://indibrick.ca/authors',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: authors.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://indibrick.ca/authors/${a.slug}`,
        name: a.name,
      })),
    },
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>

      <section className="bg-slate-900 text-white pt-28 pb-14 md:pt-36 md:pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Contributors</h1>
          <p className="mt-5 text-lg text-white/70 max-w-2xl leading-relaxed">
            Everything published here is written or reviewed by a named person. Mortgage content is
            authored or reviewed by agents licensed in Ontario, with files submitted through{' '}
            <strong className="text-white">{BROKERAGE.name}</strong>, FSRA Brokerage&nbsp;#{BROKERAGE.fsra}.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authors.map((a) => (
              <Link key={a.slug} href={`/authors/${a.slug}`}
                className="group rounded-2xl border border-neutral-200 hover:border-slate-900 transition p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black shrink-0">
                    {authorInitials(a.name)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-black text-slate-900 group-hover:text-blue-600 transition">{a.name}</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{a.jobTitle}</p>
                    {a.licensed && (
                      <span className="mt-2 inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                        <ShieldCheck size={10}/>
                        {a.fsraLicence ? `FSRA ${a.fsraLicence}` : 'Licensed'}
                      </span>
                    )}
                    <p className="mt-3 text-sm text-neutral-600 line-clamp-3">{a.bio}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-slate-900">
                      Profile <ArrowRight size={11}/>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
