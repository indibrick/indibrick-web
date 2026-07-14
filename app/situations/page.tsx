import React from 'react';
import Link from 'next/link';
import { buildMetadata } from '../../lib/buildMetadata';
import { AlertCircle, RefreshCw, TrendingDown, Building2, Home, KeyRound, Globe2, HeartHandshake } from 'lucide-react';

export const metadata = buildMetadata({
  title: 'Mortgage Situations — Ontario Broker Playbooks by Life Event',
  description: 'Every mortgage file starts with a situation, not a rate. Pick yours — bank decline, renewal, refi, pre-con closing, investment purchase, first home, newcomer — and get the playbook that fits.',
  slug: '/situations',
  keywords: [
    'mortgage situations Ontario',
    'mortgage broker playbook',
    'declined by bank mortgage',
    'mortgage renewal broker',
    'first time buyer Ontario',
    'newcomer mortgage Canada',
  ],
});

interface Situation {
  href: string;
  title: string;
  blurb: string;
  audience: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tier: 1 | 2 | 3;
  accent: string; // Tailwind text-* color
  bg: string;     // Tailwind bg-*/border-* color combo for icon tile
}

const SITUATIONS: Situation[] = [
  {
    href: '/situations/declined-by-bank',
    title: 'Declined by the bank',
    blurb: 'A rejection at your branch isn\'t a rejection at 45+ other lenders. Send us the decline letter, get a real answer in 24 hours.',
    audience: 'Self-employed · bruised credit · new to Canada · high TDS',
    Icon: AlertCircle,
    tier: 1,
    accent: 'text-red-600',
    bg: 'bg-red-50 border-red-100',
  },
  {
    href: '/situations/mortgage-renewal',
    title: 'Mortgage renewal',
    blurb: 'Your renewal letter is a starting bid. Understand the 120-day rate hold, blend-and-extend, and refi-at-renewal options.',
    audience: '2025–26 renewers · rate-shock avoiders',
    Icon: RefreshCw,
    tier: 1,
    accent: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
  },
  {
    href: '/situations/refinance-debt-consolidation',
    title: 'Refinance / debt consolidation',
    blurb: 'Roll $60k of 22% credit card debt into 7.5% mortgage debt. Free side-by-side plan with break-even math on any penalty.',
    audience: 'High-interest debt · HELOC add-on · equity take-out',
    Icon: TrendingDown,
    tier: 1,
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
  },
  {
    href: '/situations/pre-construction-closing',
    title: 'Pre-construction closing',
    blurb: '85% of 2020–22 GTA pre-con units are appraising below purchase price. Shadow appraisals, B-lender workouts, bridge financing.',
    audience: 'Condo closings · appraisal gaps · interim occupancy',
    Icon: Building2,
    tier: 2,
    accent: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-100',
  },
  {
    href: '/situations/investment-property',
    title: 'Investment property',
    blurb: '1–4 unit rentals, BRRRR strategies, portfolio limits. Route across A, B, and DCR-based lenders for the right cash-flow structure.',
    audience: 'Landlords · BRRRR · portfolio investors',
    Icon: Home,
    tier: 2,
    accent: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-100',
  },
  {
    href: '/situations/first-time-buyer',
    title: 'First-time home buyer',
    blurb: 'Stack HBP + FHSA + LTT rebates + insured 30-yr amortization. Real qualification number, not a rate quote.',
    audience: 'FTHBs · under 20% down · saving in RRSP/FHSA',
    Icon: KeyRound,
    tier: 3,
    accent: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
  },
  {
    href: '/situations/new-to-canada',
    title: 'New to Canada',
    blurb: 'Every Big 6 has a newcomer program with different underwriting. Route your visa + credit + down-payment profile to the fit.',
    audience: 'PR · work permit · study permit · ITIN files',
    Icon: Globe2,
    tier: 3,
    accent: 'text-red-600',
    bg: 'bg-red-50 border-red-100',
  },
  {
    href: '/situations/reverse-mortgage',
    title: 'Reverse mortgage',
    blurb: 'Turn home equity into tax-free cash without moving out. No monthly payments, no requalifying — for Canadian homeowners 55+.',
    audience: 'Homeowners 55+ · retirement income · aging in place',
    Icon: HeartHandshake,
    tier: 2,
    accent: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-100',
  },
];

// User-facing labels — the previous "Highest volume / Specialty file /
// Program-stacking" wording was broker-facing jargon that didn't help the
// reader decide where they fit. These prime the reader to bucket themselves
// by where they are in the mortgage lifecycle instead.
const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Most common',
  2: 'Specialty',
  3: 'Getting started',
};

export default function SituationsHubPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-5xl relative z-10 text-center">
          <span className="inline-block bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 border border-white/10">
            Mortgage Situations · Ontario
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
            Every mortgage file starts <br/>
            <span className="text-blue-400">with a situation.</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Not a rate. Pick the one that matches yours and get the playbook — capture form, real math, and a licensed broker who&apos;s handled that exact file before.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {SITUATIONS.map(s => {
              const { Icon } = s;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group bg-white rounded-3xl p-6 md:p-7 border border-gray-100 shadow-sm hover:border-black hover:shadow-xl transition-all block"
                >
                  <div className={`w-12 h-12 rounded-2xl ${s.bg} border flex items-center justify-center mb-4`}>
                    <Icon size={22} className={s.accent} />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{TIER_LABEL[s.tier]}</p>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition mb-2">{s.title}</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.blurb}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{s.audience}</p>
                  <p className={`text-xs font-black uppercase tracking-widest ${s.accent} mt-5 group-hover:opacity-80 transition`}>
                    Open playbook →
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-16 text-center bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm max-w-3xl mx-auto">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Don&apos;t see your situation?</p>
            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase mb-3">The general path still works</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-xl mx-auto">
              Every situation above eventually funnels into the same 15-minute broker conversation. If yours isn&apos;t listed — second homes, cottages, US real estate, commercial 5+ unit, private banking clients — start on the general apply page and we&apos;ll route from there.
            </p>
            <Link href="/apply" className="inline-flex bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg">
              General Apply →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
