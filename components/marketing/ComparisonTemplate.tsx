import Link from 'next/link';
import { CheckCircle, X, ArrowRight, Scale, Sparkles } from 'lucide-react';
import WaitlistForm from './WaitlistForm';
import type { ComparisonSpec } from '../../lib/comparisonShape';

interface Props { spec: ComparisonSpec; }

function CompCell({ value }: { value: string | boolean }) {
  if (value === true) return <div className="flex justify-center"><CheckCircle className="text-emerald-600" size={16}/></div>;
  if (value === false) return <div className="flex justify-center"><X className="text-neutral-300" size={16}/></div>;
  return <span className="text-sm text-neutral-700">{value}</span>;
}

export default function ComparisonTemplate({ spec }: Props) {
  // JSON-LD FAQ schema so the page shows in AI + Google answer boxes
  // with the actual Q&As populated.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: spec.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="bg-white text-slate-900">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>

      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-[140px] translate-x-1/3 -translate-y-1/4 pointer-events-none bg-gradient-to-b from-blue-600/30 to-transparent"/>
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border border-white/10">
            <Scale size={12}/> IndiBrick vs {spec.competitor}
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            IndiBrick vs {spec.competitor}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/70 max-w-3xl leading-relaxed">
            {spec.positioning}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <Link href="/pricing"
              className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-blue-100 text-[11px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition">
              See our pricing <ArrowRight size={12}/>
            </Link>
            <Link href="#waitlist"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition">
              Join the pilot <ArrowRight size={12}/>
            </Link>
          </div>
        </div>
      </section>

      {/* TL;DR */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800">IndiBrick</div>
              <div className="mt-1 text-3xl font-black text-slate-900">{spec.ourPriceStart}</div>
              <div className="mt-3 text-sm text-slate-700 leading-relaxed">{spec.ourAngle}</div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{spec.competitor}</div>
              <div className="mt-1 text-3xl font-black text-slate-900">{spec.theirPriceStart}</div>
              <div className="mt-3 text-sm text-neutral-600 leading-relaxed">{spec.competitorTagline}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE MATRIX */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center">Side-by-side</h2>
          <p className="mt-2 text-center text-neutral-500">Feature-by-feature comparison across the surface most realtors care about.</p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Feature</th>
                  <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-emerald-700">IndiBrick</th>
                  <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-neutral-500">{spec.competitor}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {spec.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                    <td className="px-4 py-3 text-neutral-900 font-medium">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><CompCell value={row.us}/></td>
                    <td className="px-4 py-3 text-center"><CompCell value={row.them}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center">Common questions</h2>
          <div className="mt-10 space-y-6">
            {spec.faq.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="font-black text-slate-900">{q}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="waitlist" className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <Sparkles className="mx-auto mb-4 text-blue-400" size={28}/>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Try IndiBrick instead</h2>
          <p className="mt-3 text-white/70">
            Free forever base tier. No credit card. Ontario realtors + insurance agents.
          </p>
          <div className="mt-8 text-left">
            <WaitlistForm/>
          </div>
        </div>
      </section>
    </div>
  );
}
