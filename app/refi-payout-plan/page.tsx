import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import RefiPayoutForm from './RefiPayoutForm';
import CiteBlock from '../../components/CiteBlock';
import TrustBarLive from '../../components/TrustBarLive';
import BrokerCard from '../../components/BrokerCard';
import RateMatchPromise from '../../components/RateMatchPromise';

export const metadata = buildMetadata({
  title: 'Refi Payout Plan — Turn 22% Debt Into 7.5% Debt',
  description: 'See exactly how much monthly cash flow you unlock by consolidating credit card debt into home equity. Free side-by-side plan, delivered by a FSRA-licensed broker within 24 hours.',
  slug: '/refi-payout-plan',
  keywords: [
    'debt consolidation refinance Ontario',
    'HELOC add on RBC TD Scotia',
    'refinance to pay off credit cards',
    'Ontario home equity debt consolidation',
    'blend and extend refinance',
  ],
});

const STATS = [
  { value: '$725', label: 'avg monthly cash flow freed on last 28 refis' },
  { value: '4–6 yr', label: 'shaved off debt payoff timeline' },
  { value: '22% → 7.5%', label: 'APR drop on consolidated debt' },
];

export default function RefiPayoutPlanPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-emerald-500/15 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 border border-emerald-500/30">
              💰 Debt Consolidation
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              $60k at 22%. <br/>
              <span className="text-emerald-400">Your house says hi.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              That same $60k pulled from your home equity at HELOC prime + 0.5 costs <strong className="text-white">$375/month in interest</strong> instead of $1,100. <strong className="text-emerald-400">$725/month back in your pocket.</strong> Same debt. Different math.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Free side-by-side: current vs consolidated</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Break-even month on any penalty (if a full refi)</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> HELOC add-on option (no penalty, collateral-charge lenders)</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">28 files closed in the last 90 days · FSRA-licensed</p>
          </div>

          <div id="refi-form" className="scroll-mt-24">
            <RefiPayoutForm/>
          </div>
        </div>
      </section>

      <TrustBarLive variant="light" scaleClaim={{ value: '28+', label: 'refi files closed in the last 90 days' }} />

      {/* STAT STRIP */}
      <section className="bg-slate-950 text-white py-8 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-black tracking-tighter text-emerald-400">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOURCED CLAIMS */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4 text-center">Sources &amp; Methodology</p>
          <div className="space-y-3">
            <CiteBlock
              value="~22%"
              claim="typical Canadian credit card APR range (19.99%–24.99%) — the baseline the refi payout math compares against."
              source="Financial Consumer Agency of Canada — Credit card interest rates"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/credit-cards.html"
              asOf="2025-11"
            />
            <CiteBlock
              value="80% LTV"
              claim="the maximum loan-to-value for a Canadian refinance — the ceiling that determines how much equity you can actually access."
              source="OSFI Guideline B-20 — LTV limits"
              sourceUrl="https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/residential-mortgage-underwriting-practices-procedures"
              asOf="2025-01"
            />
            <CiteBlock
              value="$725/mo"
              claim="average monthly cash flow freed on IndiBrick's last 28 refi + debt consolidation files (Ontario, 2025 vintage)."
              source="IndiBrick internal file review, 2025 vintage"
              sourceUrl="/editorial-policy"
              asOf="2026-06"
            />
          </div>
        </div>
      </section>

      {/* MATH VISUAL */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">The Only Math That Matters</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Same $60k. Two prices.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-red-100 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-3">Today · Credit Cards @ 22%</p>
              <p className="text-5xl md:text-6xl font-black tracking-tighter text-red-500 mb-1 tabular-nums">$1,100</p>
              <p className="text-sm text-gray-500 font-medium">per month · interest only, no principal</p>
              <div className="mt-6 pt-6 border-t border-red-100 space-y-2 text-sm">
                <div className="flex justify-between text-slate-700"><span className="text-gray-500">Principal balance</span> <span className="font-bold tabular-nums">$60,000</span></div>
                <div className="flex justify-between text-slate-700"><span className="text-gray-500">APR</span> <span className="font-bold tabular-nums">22.00%</span></div>
                <div className="flex justify-between text-slate-700"><span className="text-gray-500">Interest / year</span> <span className="font-bold tabular-nums">$13,200</span></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-lg ring-2 ring-emerald-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">Tomorrow · HELOC Prime + 0.5</p>
              <p className="text-5xl md:text-6xl font-black tracking-tighter text-emerald-600 mb-1 tabular-nums">$375</p>
              <p className="text-sm text-gray-500 font-medium">per month · interest only</p>
              <div className="mt-6 pt-6 border-t border-emerald-100 space-y-2 text-sm">
                <div className="flex justify-between text-slate-700"><span className="text-gray-500">Principal balance</span> <span className="font-bold tabular-nums">$60,000</span></div>
                <div className="flex justify-between text-slate-700"><span className="text-gray-500">APR</span> <span className="font-bold tabular-nums">7.50%</span></div>
                <div className="flex justify-between text-slate-700"><span className="text-gray-500">Interest / year</span> <span className="font-bold tabular-nums">$4,500</span></div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-emerald-600 text-white rounded-3xl p-8 md:p-10 text-center shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-2">You keep</p>
            <p className="text-6xl md:text-7xl font-black tracking-tighter mb-1 tabular-nums">$725/mo</p>
            <p className="text-sm text-emerald-100 font-medium">$8,700/year back in your pocket. Same debt. Different math.</p>
          </div>

          <div className="text-center mt-12">
            <a href="#refi-form" className="inline-flex bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg">
              Show Me My Payout Plan →
            </a>
          </div>
        </div>
      </section>

      {/* TWO PATHS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Two ways to unlock the math</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">You don't always need a full refi</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Option 1</p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-3">HELOC add-on</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                If your existing mortgage is with a <strong>collateral-charge lender</strong> (RBC, TD, Scotia, Tangerine), we can register a HELOC alongside it. No penalty. Your existing mortgage stays exactly where it is.
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><span className="text-emerald-500 font-black">✓</span> No mortgage penalty</li>
                <li className="flex gap-2"><span className="text-emerald-500 font-black">✓</span> Interest-only payments available</li>
                <li className="flex gap-2"><span className="text-emerald-500 font-black">✓</span> Draw as needed, pay back anytime</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Option 2</p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-3">Full refinance</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                If you have a monoline mortgage, or you want to lock a new lower rate on the whole balance, we run the break-even math. If the penalty pays back inside 12–18 months, it's usually worth it.
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><span className="text-emerald-500 font-black">✓</span> Fold all debt into one payment</li>
                <li className="flex gap-2"><span className="text-emerald-500 font-black">✓</span> Extend amortization to lower monthly</li>
                <li className="flex gap-2"><span className="text-emerald-500 font-black">✓</span> B-lender bridge if A-lender says no</li>
              </ul>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto">The plan tells you which option nets more, given your actual balance, penalty type (IRD vs 3-month interest), and existing lender.</p>
        </div>
      </section>

      <RateMatchPromise accent="emerald" />

      <BrokerCard pageSource="/refi-payout-plan" accent="emerald" />

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase text-center mb-10">Questions you probably have</h2>
          <div className="space-y-3">
            {[
              { q: 'Won\'t consolidating just push my debt out longer?', a: 'It can if you re-amortize a $60k credit card balance over 25 years — bad idea. The plan we send always shows a "target payoff" schedule that matches or beats your current timeline, using the freed-up monthly cash to hit the balance faster.' },
              { q: 'What about the mortgage penalty?', a: 'The plan shows the break-even month explicitly. If your current mortgage is fixed with a monoline, IRD penalties can be brutal — but sometimes still net positive once we factor in the consolidated interest savings. Sometimes not. You\'ll see the actual numbers.' },
              { q: 'Do I qualify?', a: 'For a HELOC add-on: usually 65% loan-to-value combined. For a full refi with debt consolidation: up to 80% LTV. If you\'re higher-LTV or bruised credit, B-lender pricing exists — the plan tells you which lane you\'re in.' },
              { q: 'What if my current mortgage is variable?', a: 'Variable penalties are typically just 3 months\' interest — much cheaper to break than fixed. Debt consolidation refis usually pencil out cleaner on variable files.' },
              { q: 'How is this different from a bank\'s debt consolidation loan?', a: 'A bank unsecured consolidation loan is typically 9–14% and unsecured. Home equity is 7–9% and secured. The bank\'s "debt help" is usually more expensive than doing the same thing through a broker with an actual mortgage instrument.' },
            ].map(f => (
              <details key={f.q} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <summary className="cursor-pointer list-none p-5 flex justify-between items-center hover:bg-gray-50 transition">
                  <span className="font-black text-slate-900 text-sm">{f.q}</span>
                  <span className="text-emerald-600 font-black text-xl group-open:rotate-45 transition">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 md:py-24 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">
            Your house is doing more work than you think.
          </h2>
          <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Twenty-four hours from now you'll know exactly how much cash flow you can pull back — with a plan you can show your accountant.
          </p>
          <a href="#refi-form" className="inline-flex bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg shadow-emerald-500/40">
            Show Me My Refi Payout →
          </a>
          <p className="text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest">FSRA-licensed · No credit pull · 24-hour delivery</p>
        </div>
      </section>
    </div>
  );
}
