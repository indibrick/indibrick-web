import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Linkedin, Shield } from 'lucide-react';
import { TEAM, PAGE_BROKER, type TeamMember } from '../data/team';

// BrokerCard — puts a real, named human face on every landing page. Both
// competitive-audit agents flagged the missing broker face as one of the
// top-3 trust gaps between IndiBrick and best-in-Canada brokerages
// (Nesto shows 5, True North shows 1, IndiBrick was showing 0).
//
// One canonical face per page — assignment lives in data/team.ts under
// PAGE_BROKER. The "handles X within Y" line is what makes this a
// commitment device rather than a stock photo: the visitor sees who is
// responsible and how fast they respond.
//
// Emits schema.org Person JSON-LD so LLM crawlers get first-class entity
// data — the audit called out anonymous mortgage content as a YMYL
// downrank signal. This closes it.

export interface BrokerCardProps {
  /** Explicit broker slug — overrides the pageSource → broker lookup. */
  brokerSlug?: keyof typeof TEAM;
  /** Landing page path — used to look up the assigned broker. */
  pageSource?: string;
  /** What this broker "handles" on THIS page (overrides team.ts default). */
  handles?: string;
  /** Response SLA (overrides team.ts default). */
  withinSLA?: string;
  /** Visual variant matching the page's accent color. */
  accent?: 'blue' | 'emerald' | 'red' | 'amber' | 'purple';
}

const ACCENT_MAP = {
  blue: { border: 'border-blue-100', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  emerald: { border: 'border-emerald-100', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  red: { border: 'border-red-100', chip: 'bg-red-50 text-red-700 border-red-200' },
  amber: { border: 'border-amber-100', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  purple: { border: 'border-purple-100', chip: 'bg-purple-50 text-purple-700 border-purple-200' },
};

function resolveBroker(props: BrokerCardProps): TeamMember | null {
  if (props.brokerSlug && TEAM[props.brokerSlug]) return TEAM[props.brokerSlug];
  if (props.pageSource && PAGE_BROKER[props.pageSource]) {
    return TEAM[PAGE_BROKER[props.pageSource]];
  }
  return TEAM.mudit; // Default to founder
}

export function BrokerCard(props: BrokerCardProps) {
  const broker = resolveBroker(props);
  if (!broker) return null;

  const accent = ACCENT_MAP[props.accent || 'blue'];
  const handles = props.handles || broker.handles.handles;
  const withinSLA = props.withinSLA || broker.handles.withinSLA;

  // schema.org Person — closes the anonymous-content YMYL penalty.
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `https://indibrick.ca/team/${broker.slug}#person`,
    name: broker.name,
    jobTitle: broker.roles.join(', '),
    image: `https://indibrick.ca${broker.photo}`,
    url: `https://indibrick.ca/about`,
    sameAs: [broker.linkedin],
    worksFor: { '@id': 'https://indibrick.ca/#organization' },
    knowsAbout: ['Canadian mortgages', 'Ontario real estate', 'FSRA regulation'],
    knowsLanguage: broker.languages,
    memberOf: {
      '@type': 'Organization',
      name: 'Pineapple Financial Inc.',
      identifier: 'FSRA #12830',
    },
  };

  return (
    <section className="py-12 md:py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-6 max-w-4xl">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
        <div className={`bg-gray-50 rounded-3xl p-6 md:p-8 border ${accent.border} shadow-sm flex flex-col md:flex-row items-start gap-5 md:gap-8`}>
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden relative border-4 border-white shadow-md shrink-0 mx-auto md:mx-0">
            <Image src={broker.photo} fill alt={broker.name} className="object-cover" sizes="112px" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Personally reviewed by</p>
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mb-1">{broker.name}</h3>
            <p className="text-xs font-bold text-slate-600 mb-3">{broker.displayTitle}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${accent.chip}`}>
                <Shield size={11}/> FSRA #12830
              </span>
              {broker.yearsExperience && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-slate-700 border border-gray-200">
                  {broker.yearsExperience}+ yrs
                </span>
              )}
              {broker.languages.length > 1 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-slate-700 border border-gray-200">
                  {broker.languages.join(' · ')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              I personally review every <strong className="text-slate-900">{handles}</strong> and respond <strong className="text-slate-900">within {withinSLA}</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <a
                href={broker.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0077b5] text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#005e93] transition"
              >
                <Linkedin size={14}/> LinkedIn
              </a>
              <Link
                href="/about"
                className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 underline"
              >
                Meet the team →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrokerCard;
