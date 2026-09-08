import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap, Home, Sparkles, ShieldCheck, TrendingUp, Users, CheckCircle,
  ArrowRight, Bot, Lock, Clock, DollarSign, Award,
} from 'lucide-react';
import WaitlistForm from '../../components/marketing/WaitlistForm';

export const metadata: Metadata = {
  title: 'For Ontario Realtors | Free Mortgage Co-Pilot | IndiBrick',
  description:
    'Free mortgage co-pilot for Ontario realtors: pre-approval in 6 minutes, live rate + qualification checks during showings, and 25% referral fee on every deal we fund. Join the current cohort.',
  alternates: { canonical: 'https://indibrick.ca/for-realtors' },
  openGraph: {
    title: 'For Ontario Realtors | IndiBrick Mortgage Co-Pilot',
    description:
      'Real-time buyer qualification + AI underwriter + 25% referral fee on funded deals. Ontario realtors only.',
    url: 'https://indibrick.ca/for-realtors',
    type: 'website',
  },
};

export default function ForRealtorsPage() {
  return (
    <div className="bg-white text-slate-900">
      {/* ─── BLOCK 1: HERO ─── */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-[140px] translate-x-1/3 -translate-y-1/4 pointer-events-none bg-gradient-to-b from-blue-600/30 to-transparent" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <span className="inline-block bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border border-white/10">
            For Ontario Realtors · Free Pro Tier
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5 max-w-3xl">
            Your unfair advantage on <span className="text-blue-400">every offer.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mb-8">
            A mortgage co-pilot that pre-qualifies your buyer in 6 minutes, tells you the exact price they can offer at 5.5% vs 6.0%, and pays you a <strong className="text-white">25% referral fee</strong> when we fund the deal — no data-entry, no chasing lenders, no leaving your CRM.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href="#waitlist" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg shadow-blue-500/40">
              Request access <ArrowRight size={14}/>
            </Link>
            <Link href="#how" className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 transition">
              How it works
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span className="flex items-center gap-1.5"><ShieldCheck size={11}/> FSRA licensed</span>
            <span className="flex items-center gap-1.5"><Clock size={11}/> 2-hour response</span>
            <span className="flex items-center gap-1.5"><Award size={11}/> 50+ lender panel</span>
            <span className="flex items-center gap-1.5"><Lock size={11}/> Your deals stay yours</span>
          </div>
        </div>
      </section>

      {/* ─── BLOCK 2: THE PROBLEM ─── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 block">The problem</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6">Buyers don't know what they can offer. You lose deals waiting to find out.</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl">
            A pre-approval from 2 months ago is useless the week rates move. Your buyer walks into a listing, falls in love, and now you're texting three mortgage brokers hoping one gets back to you before the showing ends. Meanwhile the other agent has a mortgage broker on speed-dial and their client just wrote a firm offer with no financing condition.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Clock, title: '68% of buyers', body: 'have a stale pre-approval by the time they write an offer (CMHC 2025).' },
              { icon: TrendingUp, title: '$14,000+', body: 'average price difference between what a buyer thinks they qualify for and what they actually do at current rates.' },
              { icon: Users, title: '1 in 3 offers', body: 'fall through on financing conditions. Every one of them cost you commission.' },
            ].map(s => (
              <div key={s.title} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <s.icon size={22} className="text-blue-600 mb-3"/>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOCK 3: THE OFFER ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 block">What you get</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">A licensed broker embedded in your pipeline. Free.</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-3xl">
            IndiBrick Pro is what happens when a full FSRA-licensed brokerage builds a workspace for realtors instead of another AI chatbot. Everything below is free while you're a partner — we make money on funded deals, not on you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: Bot, tag: 'Real-time',
                title: 'AI Deal Analyzer',
                body: 'Paste any scenario (income, down payment, credit, price) → instant B-20 underwriter analysis, approval confidence score, and a specific action plan. Turn a showing into a firm offer in 6 minutes.',
              },
              {
                icon: Zap, tag: 'Live',
                title: 'Push Deal for Mortgage',
                body: 'One button hands the file to a licensed broker with 50+ A/B/private lenders. Your client gets a real rate quote same-day. You get a status feed so you always know where the file stands.',
              },
              {
                icon: DollarSign, tag: 'Every deal',
                title: '25% referral fee on funded mortgages',
                body: 'On a $600k mortgage at 1.1% commission, that\'s $1,650 to you per funded deal. Paid within 30 days of funding. FSRA-compliant.',
              },
              {
                icon: Lock, tag: 'Default private',
                title: 'Your book stays yours',
                body: 'Your CRM data is invisible to IndiBrick until YOU push a specific deal. Not sold, not shared, not used for competitive analysis. PIPEDA-compliant with an audit trail.',
              },
              {
                icon: Home, tag: 'Toronto + GTA',
                title: 'Buyer leads (limited)',
                body: 'When we get a buyer client who\'s already pre-approved and needs a realtor in your territory, we send them your way. First-come, first-served on active partners.',
              },
              {
                icon: TrendingUp, tag: 'Cross-sell',
                title: 'Insurance auto-referral',
                body: 'Every funded mortgage needs bound insurance. We handle that separately with our insurance-agent network, and you get credit on the source deal.',
              },
            ].map(f => (
              <div key={f.title} className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <f.icon size={18} className="text-blue-600"/>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{f.tag}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOCK 4: HOW IT WORKS ─── */}
      <section id="how" className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3 block">How it works</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-10">Three moments where we save your deal.</h2>
          <div className="space-y-6">
            {[
              {
                num: '01', when: 'BEFORE THE SHOWING',
                title: 'Get an accurate qualification, live',
                body: 'Your buyer says "we\'re pre-approved at $850k." You paste their scenario into the AI Deal Analyzer — get back "with your rate at 6.14% and $1,200 in monthly debts, that\'s actually $772k." Now you know which listings to show. Takes 90 seconds.',
              },
              {
                num: '02', when: 'AT THE OFFER',
                title: 'Confirm financing in minutes, not days',
                body: 'You\'re at the property, offer deadline is tomorrow. Push the deal — a licensed IndiBrick broker calls the buyer within 2 hours, runs actual credit + lender fit, and confirms a firm rate. You write with confidence. If we can\'t fund, we tell you fast so you can rescope.',
              },
              {
                num: '03', when: 'AFTER FUNDING',
                title: 'Get paid + set up the next referral',
                body: 'Deal funds → 25% referral fee lands in your account within 30 days. Client needs home insurance to close → we handle it, you get credit on the timeline. Client mentions their sister is house-hunting → we route her back to you.',
              },
            ].map(step => (
              <div key={step.num} className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-[100px_1fr] gap-5 md:gap-8">
                <div>
                  <div className="text-4xl md:text-5xl font-black tracking-tighter text-blue-400">{step.num}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{step.when}</div>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BLOCK 5: WHY US ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 block">Why partner with IndiBrick</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-8">We're not a CRM. We're the broker.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-3">A licensed brokerage, not a tech vendor</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Every deal you push is worked by a real FSRA-licensed Mortgage Agent Level 1 or higher. We're accountable to the regulator, insured, and answer to your client the same way you do.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                kvCORE, Follow Up Boss, Broker Wolf — they're CRM software. When a deal breaks, they can't fix it. When your client needs a mortgage at 8pm on a Sunday, we're on the phone.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-3">We invest in mortgage tech so you don't have to</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                B-20 stress test calculators, LTV/GDS/TDS auto-computation, rate feeds from 50+ lenders, private-lender co-marketplace, AI intake with Gemini underwriter — you get all of it inside the partner workspace, free.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                You never have to become the mortgage expert to sell the house. You just have to know when to hand it to us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BLOCK 6: WAITLIST FORM ─── */}
      <section id="waitlist" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 block">Join the cohort</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4">Ontario realtors only. Limited spots per territory.</h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6">
                We throttle partner intake to what our mortgage pipeline can support. If we sign 40 realtors in Q1 and close 45 mortgages in Q1, each realtor sees ~1 buyer-referral back. That's a bad deal for you. So we cap by territory and open spots as our funded volume grows.
              </p>
              <div className="space-y-3">
                {[
                  '2 business hours to first response',
                  'No monthly fee, no contract, no exclusivity',
                  '25% referral fee paid within 30 days of funding',
                  'Onboarding call + demo of the AI Deal Analyzer',
                ].map(b => (
                  <div key={b} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5"/>
                    <span className="text-sm text-slate-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <WaitlistForm
              kind="realtor"
              accentClass="bg-blue-600 hover:bg-blue-500"
              brokerageLabel="Brokerage"
              volumeLabel="Sides / year"
              volumeHint="e.g. 24 sides"
            />
          </div>
        </div>
      </section>

      {/* ─── BLOCK 7: FAQ ─── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase text-center mb-10">Questions realtors actually ask</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Am I switching my CRM?',
                a: 'No. Keep kvCORE / Follow Up Boss / whatever you use. IndiBrick Pro is a separate workspace you open when you need a mortgage answer or want to push a specific deal for financing. Your client data never leaves your own CRM unless you explicitly push a file.',
              },
              {
                q: 'What does "your deals stay yours" actually mean?',
                a: 'A deal you log in IndiBrick Pro is marked "Not Pushed" by default. That means IndiBrick brokers cannot work the mortgage on it. When you hit "Push for Mortgage", it flips to "Pushed" and a broker gets assigned. Admin can see it for compliance and audit only — never for prospecting. PIPEDA-compliant.',
              },
              {
                q: 'How does the referral fee work in Ontario?',
                a: 'FSRA Rule 2020-001 allows a licensed brokerage to pay a referral fee to any licensed realtor for a mortgage lead, as long as it\'s disclosed to the borrower. We handle the disclosure paperwork. Fee is 25% of the broker\'s earned commission on funded volume, capped at $2,500 per deal. E-transfer or direct deposit, 30 days from funding.',
              },
              {
                q: 'What if my deal doesn\'t fund?',
                a: 'No fee owed either way. If we can\'t place your file, we tell you within 48 hours and give you our reasoning (LTV, credit, income docs, whatever) so you can either fix it with the client or route to your existing broker without wasted time.',
              },
              {
                q: 'What territories are open right now?',
                a: 'Toronto core, Peel Region, York Region, Halton, and Ottawa. We add territories as our broker capacity grows. If you\'re outside these areas, submit the form — we\'ll queue you for the next expansion.',
              },
              {
                q: 'Do you compete with realtors on the buyer side?',
                a: 'No. IndiBrick is a mortgage brokerage. When we get an inbound buyer client (mortgage-shopping, not house-shopping), we hand them to a realtor partner in their territory. First-come, first-served on active partners with capacity.',
              },
            ].map(f => (
              <details key={f.q} className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <summary className="cursor-pointer list-none p-5 flex justify-between items-center hover:bg-gray-50 transition">
                  <span className="font-black text-slate-900 text-sm">{f.q}</span>
                  <span className="font-black text-xl group-open:rotate-45 transition text-blue-600">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-20 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">Free tool. Real broker. Ontario only.</h2>
          <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">
            The next cohort intake closes when the territory fills.
          </p>
          <Link href="#waitlist" className="inline-flex bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg shadow-blue-500/40">
            Request access <ArrowRight size={14}/>
          </Link>
          <p className="text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest">FSRA-licensed · PIPEDA-compliant · 2-hour response</p>
        </div>
      </section>
    </div>
  );
}
