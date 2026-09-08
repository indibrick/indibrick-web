import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import SixMinuteForm from './SixMinuteForm';
import CiteBlock from '../../components/CiteBlock';
import TrustBarLive from '../../components/TrustBarLive';
import BrokerCard from '../../components/BrokerCard';
import RateMatchPromise from '../../components/RateMatchPromise';

export const metadata = buildMetadata({
  title: 'Mortgage Approval Snapshot — Know What You Qualify For',
  description: 'Get your conditional mortgage qualification range with a callback from a FSRA-licensed broker within 1 business hour. Or use our instant pre-approval tool and get an answer in minutes.',
  slug: '/six-minute-approval',
  keywords: [
    'mortgage pre-approval Ontario',
    'instant mortgage approval Ontario',
    'first time buyer pre-approval Toronto',
    'mortgage qualification snapshot',
    'stress-tested mortgage rate',
    'Pineapple pre-approval',
  ],
});

const STATS = [
  { value: '1 hour', label: 'callback from a licensed advisor' },
  { value: 'Instant', label: 'self-serve pre-approval tool' },
  { value: '50+', label: 'lenders quoted on your file' },
];

export default function SixMinuteApprovalPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/25 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-blue-600/20 text-blue-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 border border-blue-500/30">
              ⚡ Instant or 1-Hour Advisor Callback
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              A real number, <br/>
              <span className="text-blue-400">not a sales call.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              Two ways in. <strong className="text-white">Fill the form</strong> and a licensed advisor calls you within <strong className="text-emerald-400">1 business hour</strong> with the exact dollar amount you qualify for. Or <strong className="text-white">skip the wait</strong> and use our instant pre-approval tool — real answer in minutes.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Conditional qualification range with a real dollar figure</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Stress-tested against B-20 — the number that actually funds</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> No credit pull unless you decide to formally apply</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <a
                href="https://gopineapple.ca/muditchhura/preapproval"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition shadow-lg shadow-emerald-500/30"
              >
                ⚡ Instant Pre-Approval Tool
              </a>
              <a
                href="#approval-form"
                className="inline-flex justify-center items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition border border-white/10"
              >
                Or 1-hour callback →
              </a>
            </div>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · Advisor hours: Mon–Sat 9am–8pm ET</p>
          </div>

          <div id="approval-form" className="scroll-mt-24">
            <SixMinuteForm/>
          </div>
        </div>
      </section>

      <TrustBarLive variant="light" scaleClaim={{ value: '$18M+', label: 'placed in 2025 · 50+ lender panel' }} />

      {/* STAT STRIP */}
      <section className="bg-slate-950 text-white py-8 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-black tracking-tighter text-blue-400">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOURCED CLAIMS */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4 text-center">Sources &amp; Methodology</p>
          <div className="space-y-3">
            <CiteBlock
              value="B-20 stress test"
              claim="mortgage applicants are qualified at the greater of the contract rate + 2% or the Bank of Canada's minimum qualifying rate — the actual policy that governs Canadian pre-approval math."
              source="OSFI Guideline B-20 — Residential Mortgage Underwriting Practices and Procedures"
              sourceUrl="https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/residential-mortgage-underwriting-practices-procedures"
              asOf="2025-01"
            />
            <CiteBlock
              value="50+"
              claim="A-lender, B-lender, and private lender relationships accessible through IndiBrick's brokerage partner (Pineapple Financial Inc.) — the lender pool that determines how much you actually qualify for."
              source="IndiBrick lender panel, internal register"
              sourceUrl="/editorial-policy"
              asOf="2026-07"
            />
            <CiteBlock
              value="Insured / uninsured / B"
              claim="the three tiers of Canadian mortgage lending — pre-approval quality depends on identifying the right tier for your file before the full credit application."
              source="Financial Consumer Agency of Canada — Mortgage basics"
              sourceUrl="https://www.canada.ca/en/financial-consumer-agency/services/mortgages.html"
              asOf="2025-11"
            />
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">What Lands in Your Inbox</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">Your snapshot, in one page</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">The Number</p>
              <p className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-1 tabular-nums">$782,400</p>
              <p className="text-sm text-gray-500 font-medium">Example — conditional qualification range at today's stress-tested rate</p>
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between"><span className="text-gray-500">Stress-tested rate</span> <span className="font-bold tabular-nums">6.29%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Contract rate today</span> <span className="font-bold tabular-nums">4.29%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Est. payment @ 25yr</span> <span className="font-bold tabular-nums">$4,265/mo</span></div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">What The Snapshot Isn't</p>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3"><span className="text-red-400 font-black mt-0.5">✗</span><div><p className="font-black text-white">Not a hard credit pull.</p><p className="text-gray-400">Your credit score is not touched to produce the snapshot.</p></div></li>
                <li className="flex gap-3"><span className="text-red-400 font-black mt-0.5">✗</span><div><p className="font-black text-white">Not a rate hold.</p><p className="text-gray-400">Rates move. This tells you what you qualify for at today's numbers.</p></div></li>
                <li className="flex gap-3"><span className="text-red-400 font-black mt-0.5">✗</span><div><p className="font-black text-white">Not a signed pre-approval.</p><p className="text-gray-400">If you like the number, we can turn it into a full pre-approval same-day.</p></div></li>
                <li className="flex gap-3"><span className="text-emerald-400 font-black mt-0.5">✓</span><div><p className="font-black text-white">It IS a real number.</p><p className="text-gray-400">Same math the bank uses. Just faster, and without the branch runaround.</p></div></li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <a href="#approval-form" className="inline-flex bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg">
              Get My Approval Snapshot →
            </a>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Especially good if…</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">You want the answer, not a pitch</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { t: 'First-time buyer in the GTA', d: 'You want to know if you\'re priced in or priced out before you tell your realtor.' },
              { t: 'Made an offer, need to move fast', d: 'You have 5 business days to firm up financing. We work at that pace.' },
              { t: 'Told "no" by your bank', d: 'A rejection at your branch isn\'t a rejection at 50+ other lenders. Get a real number.' },
            ].map(a => (
              <div key={a.t} className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
                <h3 className="font-black uppercase tracking-tight text-slate-900 text-sm mb-2">{a.t}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RateMatchPromise accent="blue" />

      <BrokerCard pageSource="/six-minute-approval" accent="blue" />

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase text-center mb-10">Questions you probably have</h2>
          <div className="space-y-3">
            {[
              { q: 'Instant tool vs 1-hour callback — which one should I use?', a: 'The instant pre-approval tool is a self-serve digital application (powered by our brokerage partner Pineapple). It gives you a real number in minutes and is perfect if you already know your basics. The 1-hour advisor callback is better if you want a human to walk you through your file — self-employed, new to Canada, bruised credit, second mortgage, or any file with wrinkles.' },
              { q: 'What does "1 business hour" actually mean?', a: 'Mon–Sat 9am–8pm ET. Submit inside those hours and a licensed advisor calls you back within 60 minutes. Submit outside those hours and you get a call at the next business-hour open.' },
              { q: 'How is this different from a bank pre-approval?', a: 'A bank pre-approval takes days, pulls credit, and only tells you what THAT bank will lend. Our snapshot doesn\'t pull credit, and reflects what 50+ lenders would each offer — because we quote all of them.' },
              { q: 'What if my file needs a B-lender?', a: 'The snapshot flags that. B-lender full approval takes longer, but the initial file-fit assessment doesn\'t. You\'ll know your path either way — A-lender, B-lender, or private.' },
              { q: 'Is this an offer of credit?', a: 'No. The snapshot is a conditional qualification range, not a legally binding commitment. A full mortgage commitment requires a formal application, document review, credit consent, and lender approval — all of which we can start same-day if you like the number.' },
            ].map(f => (
              <details key={f.q} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <summary className="cursor-pointer list-none p-5 flex justify-between items-center hover:bg-gray-50 transition">
                  <span className="font-black text-slate-900 text-sm">{f.q}</span>
                  <span className="text-blue-600 font-black text-xl group-open:rotate-45 transition">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA — two paths side by side */}
      <section className="py-16 md:py-24 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">
            Two ways to your number.
          </h2>
          <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Skip the wait with our instant pre-approval tool, or have a licensed advisor call you within 1 business hour.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
            <a
              href="https://gopineapple.ca/muditchhura/preapproval"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex justify-center items-center bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg shadow-emerald-500/40"
            >
              ⚡ Instant Pre-Approval Tool
            </a>
            <a
              href="#approval-form"
              className="flex-1 inline-flex justify-center items-center bg-blue-600 hover:bg-blue-500 text-white px-6 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg shadow-blue-500/40"
            >
              1-Hour Advisor Callback →
            </a>
          </div>
          <p className="text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest">FSRA-licensed · No credit pull unless you formally apply</p>
        </div>
      </section>
    </div>
  );
}
