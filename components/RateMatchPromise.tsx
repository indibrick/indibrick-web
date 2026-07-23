import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

// RateMatchPromise — the productized rate/beat guarantee both audit agents
// flagged as free conversion lift (True North: "beat it or $500"; Butler:
// "$500 Rate Guarantee"; IndiBrick: nothing). Named "Rate-Match Promise"
// to keep the language compliance-safe: it's a MATCH commitment, not a
// superlative promise ("lowest rates"), and it's contingent on lender fit
// which every experienced borrower understands.
//
// Ships as a mid-page band on rate-sensitive pages (renewal-rescue,
// refi-payout-plan, situations/mortgage-renewal, six-minute-approval).
// Not shown on YMYL-heavy pages where a rate promise reads as
// out-of-context (reverse-mortgage, declined-by-bank, pre-con-closing).

export interface RateMatchPromiseProps {
  /** Optional CTA target — defaults to #lead-form on the host page. */
  ctaHref?: string;
  /** Optional CTA label. */
  ctaLabel?: string;
  /** Accent color matched to the host page. */
  accent?: 'blue' | 'emerald';
}

const ACCENT_MAP = {
  blue:    { pill: 'bg-blue-500/15 text-blue-300 border-blue-500/30',       btn: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/40' },
  emerald: { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/40' },
};

export function RateMatchPromise({
  ctaHref = '#lead-form',
  ctaLabel = 'Send Your Rate — We\'ll Match or Explain Why',
  accent = 'blue',
}: RateMatchPromiseProps) {
  const a = ACCENT_MAP[accent];
  return (
    <section className="py-12 md:py-16 bg-slate-900 text-white">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-sm">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-center">
            <div>
              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border ${a.pill}`}>
                💎 The IndiBrick Rate-Match Promise
              </span>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase leading-tight mb-4">
                Show us a lower rate we&apos;re eligible to fund — we match it or tell you honestly why we can&apos;t.
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>Bring us a written rate quote from any A- or B-lender your file qualifies at.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>If we can source the same or lower rate through our 45+ lender panel, we match it.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>If we can&apos;t, you get a written explanation of why (product mismatch, penalty structure, LTV, etc.) — not a sales pitch.</span>
                </li>
              </ul>
              <p className="text-[11px] text-gray-500 italic mt-4 leading-relaxed">
                Rates depend on file qualification. Match applies to like-for-like products (same term, amortization, insurability, prepayment terms). No obligation and no fee for the review.
              </p>
            </div>
            <div className="flex md:justify-end">
              <Link
                href={ctaHref}
                className={`inline-flex ${a.btn} text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg text-center`}
              >
                {ctaLabel} <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RateMatchPromise;
