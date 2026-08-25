'use client';
// SEO OS landing — will roll up counts across the 6 collections once
// Phase 1 lands. For Phase 0 it's an intentionally empty scaffold.

import Link from 'next/link';
import { FileText, Calendar, Gauge, Link2, Send, Radio, ArrowRight } from 'lucide-react';

const CARDS = [
  { href: '/admin/seo-os/content',       title: 'Content',       body: 'AI-drafted articles, review + approve pipeline.',            icon: FileText, phase: 'Phase 1.1' },
  { href: '/admin/seo-os/calendar',      title: 'Calendar',      body: '30-day schedule generated from your keyword set.',           icon: Calendar, phase: 'Phase 1.2' },
  { href: '/admin/seo-os/audits',        title: 'Audits',        body: 'Per-URL score across schema, metadata, indexability, speed, GEO.', icon: Gauge,   phase: 'Phase 1.3' },
  { href: '/admin/seo-os/backlinks',     title: 'Backlinks',     body: 'Prospected guest-post / citation targets with topic-fit score.',    icon: Link2,   phase: 'Phase 1.4' },
  { href: '/admin/seo-os/publish',       title: 'Publish',       body: 'One-click cross-channel publish to WordPress / Shopify / GBP.',     icon: Send,    phase: 'Phase 2' },
  { href: '/admin/seo-os/ai-visibility', title: 'AI Visibility', body: 'Continuous citation tracking across ChatGPT / Claude / Perplexity / Gemini / AIO.', icon: Radio, phase: 'Phase 3' },
];

export default function SeoOsLanding() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-neutral-900">SEO OS</h1>
        <p className="mt-1 text-sm text-neutral-500 max-w-3xl">
          IndiBrick&apos;s in-house SEO content engine, calendar, audit, backlink research, one-click publishing,
          and AI-citation tracking — running natively on the existing stack.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map(c => (
          <Link key={c.href} href={c.href}
            className="group rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-900 transition">
            <div className="flex items-center gap-2">
              <c.icon size={16} className="text-neutral-500 group-hover:text-neutral-900"/>
              <span className="text-base font-semibold text-neutral-900">{c.title}</span>
              <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-neutral-400">{c.phase}</span>
            </div>
            <p className="mt-2 text-sm text-neutral-600">{c.body}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 group-hover:text-neutral-900">
              Open <ArrowRight size={12}/>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-xs text-neutral-500">
        Phase 0 shell — all six surfaces are placeholders until Phase 1 wires the first four and Phase 2/3 wire the last two.
      </div>
    </div>
  );
}
