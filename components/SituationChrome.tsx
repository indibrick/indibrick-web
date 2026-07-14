// Shared visual chrome for /situations/* landing pages. Nothing fancy —
// just the FAQ accordion, stat strip, and bottom CTA repeated across every
// page. Keeps the per-page files short enough to read in one pass.

import React from 'react';

interface StatStripProps {
  stats: { value: string; label: string }[];
  accentTextClass?: string; // Tailwind text-* color for the big number
}

export function StatStrip({ stats, accentTextClass = 'text-emerald-400' }: StatStripProps) {
  // Static class map — Tailwind JIT can't evaluate `md:grid-cols-${n}`.
  const gridClass = stats.length === 2 ? 'md:grid-cols-2'
    : stats.length === 4 ? 'md:grid-cols-4'
    : 'md:grid-cols-3';
  return (
    <section className="bg-slate-950 text-white py-8 border-t border-white/5">
      <div className={`container mx-auto px-6 max-w-6xl grid grid-cols-1 ${gridClass} gap-6 text-center`}>
        {stats.map(s => (
          <div key={s.label}>
            <p className={`text-3xl md:text-4xl font-black tracking-tighter ${accentTextClass}`}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

interface FAQProps {
  items: { q: string; a: string }[];
  accentTextClass?: string; // color of the "+" icon
}

export function FAQ({ items, accentTextClass = 'text-blue-600' }: FAQProps) {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase text-center mb-10">Questions you probably have</h2>
        <div className="space-y-3">
          {items.map(f => (
            <details key={f.q} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <summary className="cursor-pointer list-none p-5 flex justify-between items-center hover:bg-gray-50 transition">
                <span className="font-black text-slate-900 text-sm">{f.q}</span>
                <span className={`${accentTextClass} font-black text-xl group-open:rotate-45 transition`}>+</span>
              </summary>
              <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

interface BottomCTAProps {
  headline: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;    // usually "#lead-form" to scroll back to the top form
  buttonClass?: string;  // Tailwind bg-* hover:bg-* text-* shadow-* — falls back to blue
  footerNote?: string;
}

export function BottomCTA({ headline, body, buttonLabel, buttonHref, buttonClass, footerNote }: BottomCTAProps) {
  return (
    <section className="py-16 md:py-24 bg-slate-900 text-white text-center">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">{headline}</h2>
        <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">{body}</p>
        <a href={buttonHref} className={`inline-flex text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg ${buttonClass || 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/40'}`}>
          {buttonLabel} →
        </a>
        {footerNote && <p className="text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest">{footerNote}</p>}
      </div>
    </section>
  );
}

// Small hero-tag pill with accent color. Colocated because every hero uses it.
interface HeroTagProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroTag({ children, className = 'bg-blue-600/20 text-blue-300 border-blue-500/30' }: HeroTagProps) {
  return (
    <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 border ${className}`}>
      {children}
    </span>
  );
}

// "Related situations" strip. Sits above the BottomCTA on each page and
// exposes 2–3 adjacent playbooks (declined-by-bank ↔ new-to-canada,
// mortgage-renewal ↔ refi-debt-consolidation, etc). Helps a reader who
// landed on the wrong page get to the right one without bouncing to Google.
interface RelatedSituation {
  href: string;
  title: string;
  blurb: string;    // one-liner explaining WHY this is related
}

interface RelatedSituationsProps {
  items: RelatedSituation[];
  accentTextClass?: string;
}

export function RelatedSituations({ items, accentTextClass = 'text-blue-600' }: RelatedSituationsProps) {
  if (!items || items.length === 0) return null;
  return (
    <section className="py-12 md:py-16 bg-white border-t border-gray-100">
      <div className="container mx-auto px-6 max-w-5xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 text-center">Related situations</p>
        <h3 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase text-center mb-6">Might also fit your file</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {items.map(r => (
            <a key={r.href} href={r.href}
               className="block bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-100 hover:border-black hover:bg-white hover:shadow-md transition group">
              <p className={`text-sm font-black text-slate-900 group-hover:text-blue-600 transition mb-1`}>{r.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-2">{r.blurb}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${accentTextClass}`}>Open playbook →</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
