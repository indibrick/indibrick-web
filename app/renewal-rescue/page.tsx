import React from 'react';
import { buildMetadata } from '../../lib/buildMetadata';
import RenewalRescueForm from './RenewalRescueForm';

export const metadata = buildMetadata({
  title: 'Renewal Rescue Report — See What Your Bank Won\'t Show You',
  description: 'Your renewal letter is a starting bid, not a final offer. Get a free side-by-side of your bank\'s offer vs today\'s broker-channel rates — delivered by a FSRA-licensed broker within 2 hours.',
  slug: '/renewal-rescue',
  keywords: [
    'mortgage renewal rescue',
    'switch mortgage at renewal',
    'renewal rate shopping Ontario',
    'mortgage renewal broker',
    'blend and extend mortgage',
    '120 day rate hold renewal',
  ],
});

// Landing page — top-ranked CTA from the offer strategist. Copy pulled
// verbatim from the sales agent's Renewal Shock template so the ad, email,
// and landing page tell the same story. Every claim is falsifiable and
// tied to a specific market condition (the 2025-26 renewal cliff).

const STATS = [
  { value: '60%', label: 'of Canadian mortgages renew in 2025–26' },
  { value: '$180–$340', label: 'avg monthly savings on last 40 renewals' },
  { value: '120', label: 'days you can shop before renewal, no penalty' },
];

const WHY_SHOP_ROWS = [
  { bank: '5.79%', broker: '4.29%', label: '5-year fixed insured' },
  { bank: '6.29%', broker: '4.94%', label: '5-year fixed uninsured' },
  { bank: '6.05%', broker: '5.19%', label: '3-year fixed insured' },
];

export default function RenewalRescuePage() {
  return (
    <div className="bg-white">
      {/* HERO — the number is the hook. */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block bg-red-600/20 text-red-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 border border-red-600/30">
              ⚠ Renewal Cliff · 2025–26
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5">
              Your renewal letter <br/>
              <span className="text-red-400">is lying to you.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 max-w-lg">
              The rate your bank offered isn't the rate you have to take. You have <strong className="text-white">120 days before maturity</strong> to shop the entire market with zero penalty and zero credit hit.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Compare your bank's offer vs 45+ lenders</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> 5-year interest delta on your actual balance</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 font-black mt-0.5">✓</span> Blend-and-extend options most brokers won't tell you about</li>
            </ul>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">FSRA-licensed · No form after this one · No credit pull</p>
          </div>

          <div id="rescue-form" className="scroll-mt-24">
            <RenewalRescueForm/>
          </div>
        </div>
      </section>

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

      {/* RATE SNAPSHOT — makes the abstract concrete */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Real Numbers · This Week</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase leading-tight">The gap they don't advertise</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-900 text-white">
              <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</div>
              <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-red-400 text-center">Bank Renewal Offer</div>
              <div className="p-4 md:p-5 text-[10px] font-black uppercase tracking-widest text-emerald-400 text-center">Broker Channel</div>
            </div>
            {WHY_SHOP_ROWS.map((r, i) => (
              <div key={r.label} className={`grid grid-cols-3 items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="p-4 md:p-5 font-bold text-slate-900 text-sm">{r.label}</div>
                <div className="p-4 md:p-5 text-center font-black text-red-500 text-lg md:text-xl tabular-nums line-through">{r.bank}</div>
                <div className="p-4 md:p-5 text-center font-black text-emerald-600 text-lg md:text-xl tabular-nums">{r.broker}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-4 text-center font-medium">Illustrative broker-channel best-tier rates. Your actual rate depends on file, LTV, and lender fit. That's what the report solves for.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">How the report works</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 uppercase">Three fields. Two hours. Zero pitch.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', t: 'Tell us three things', d: 'Balance, renewal month, current rate. That\'s it. No SIN, no application, no credit pull.' },
              { n: '02', t: 'A licensed broker builds it', d: 'Not a bot. A FSRA-licensed advisor runs the math against today\'s live lender rate sheets.' },
              { n: '03', t: 'You get the side-by-side', d: 'Bank offer vs broker-channel best fit, five-year interest delta, blend-and-extend options if any.' },
            ].map(s => (
              <div key={s.n} className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100">
                <p className="text-4xl font-black text-blue-600 tracking-tighter mb-2">{s.n}</p>
                <h3 className="font-black uppercase tracking-tight text-slate-900 text-sm mb-2">{s.t}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="#rescue-form" className="inline-flex bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg">
              See My Renewal Savings →
            </a>
          </div>
        </div>
      </section>

      {/* FAQ — kills the "is this a trick?" objections */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase text-center mb-10">Questions you probably have</h2>
          <div className="space-y-3">
            {[
              { q: 'Is this a hard credit check?', a: 'No. Nothing on this page pulls credit. A soft pull is only done later — with your written consent — if you decide to formally apply.' },
              { q: 'What does the broker actually get paid?', a: 'The lender that funds your renewal pays us. You never pay a broker fee on A-lender or most B-lender business. That fee is built into the rate sheet regardless — the only question is whether it goes to us or to your bank branch.' },
              { q: 'What if my rate ends up worse than my bank\'s?', a: 'Then you renew with your bank. The report just gives you a real comparison — you\'re under no obligation to switch. About 1 in 8 files we run stay with the incumbent because the bank\'s retention team matches once they know we\'re looking.' },
              { q: 'How is 120 days different from just waiting?', a: 'Most lenders will lock a rate for up to 120 days before your maturity date. If rates rise, you\'re protected. If rates drop, you take the lower one. That optionality is worth thousands and it\'s free — but it disappears the day your renewal auto-executes.' },
              { q: 'Do I have to be in Ontario?', a: 'IndiBrick is licensed in Ontario. For other provinces we can refer you to a licensed partner in your region — just tell us on the form.' },
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

      {/* BOTTOM CTA */}
      <section className="py-16 md:py-24 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">
            Your renewal is a starting bid.
          </h2>
          <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Every month you wait is thousands you don't get back. Two hours from now you'll know your real number.
          </p>
          <a href="#rescue-form" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg shadow-blue-500/40">
            Get My Renewal Rescue Report →
          </a>
          <p className="text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest">FSRA-licensed · No credit pull · Response in &lt; 2 hours</p>
        </div>
      </section>
    </div>
  );
}
