import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield, Home, Sparkles, ShieldCheck, TrendingUp, Users, CheckCircle,
  ArrowRight, Zap, Lock, Clock, DollarSign, Award, FileText,
} from 'lucide-react';
import WaitlistForm from '../../components/marketing/WaitlistForm';

export const metadata: Metadata = {
  title: 'For Ontario Insurance Agents | Free Bound-Insurance Leads | IndiBrick',
  description:
    'Ontario insurance agents: get pre-qualified home-insurance leads from IndiBrick mortgage closings. First-come, first-served claim. 15% referral fee on bound premium. Join the current cohort.',
  alternates: { canonical: 'https://indibrick.ca/for-insurance-agents' },
  openGraph: {
    title: 'For Ontario Insurance Agents | IndiBrick Lead Feed',
    description:
      'Pre-qualified home insurance leads from mortgage closings. First-come, first-served claim. Free platform.',
    url: 'https://indibrick.ca/for-insurance-agents',
    type: 'website',
  },
};

export default function ForInsuranceAgentsPage() {
  return (
    <div className="bg-white text-slate-900">
      {/* ─── BLOCK 1: HERO ─── */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-[140px] translate-x-1/3 -translate-y-1/4 pointer-events-none bg-gradient-to-b from-emerald-500/30 to-transparent" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <span className="inline-block bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border border-white/10">
            For Ontario Insurance Agents · Free Access
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] mb-5 max-w-3xl">
            Every mortgage we fund is <span className="text-emerald-400">a bound-insurance lead</span> for you.
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mb-8">
            IndiBrick funds mortgages across Ontario. Every one needs bound home insurance to close — and every one is a warm, qualified lead. Claim the ones you want, quote fast, bind faster. <strong className="text-white">15% referral fee on bound annual premium.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href="#waitlist" className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg shadow-emerald-500/40">
              Request access <ArrowRight size={14}/>
            </Link>
            <Link href="#how" className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 transition">
              How it works
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span className="flex items-center gap-1.5"><ShieldCheck size={11}/> FSRA-licensed source</span>
            <span className="flex items-center gap-1.5"><Zap size={11}/> Live claim feed</span>
            <span className="flex items-center gap-1.5"><Award size={11}/> ~40 leads / month</span>
            <span className="flex items-center gap-1.5"><Lock size={11}/> No CRM switch required</span>
          </div>
        </div>
      </section>

      {/* ─── BLOCK 2: THE PROBLEM ─── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 block">The problem</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6">Cold outbound + expensive PPC + rate-shoppers who never bind.</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl">
            You spend $80–$140 per lead on Google Search "home insurance Ontario," get connected with three people who wanted a comparison quote and ghosted, and burn a half-day on quotes that never bind. The best insurance leads — the ones that MUST bind because a mortgage is closing — go to whoever the borrower's bank happens to recommend. That should be you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: DollarSign, title: '$80–$140', body: 'average CPL on Google Search for "home insurance Ontario" (2025 auction data).' },
              { icon: Clock, title: '12–18%', body: 'bind rate on cold PPC insurance leads. Mortgage-triggered leads: 60–80%.' },
              { icon: TrendingUp, title: '~40 / month', body: 'home insurance opportunities IndiBrick generates from Ontario mortgage closings at current volume.' },
            ].map(s => (
              <div key={s.title} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <s.icon size={22} className="text-emerald-600 mb-3"/>
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
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 block">What you get</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">Warm leads from real mortgage closings. Free to receive.</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-3xl">
            The IndiBrick Insurance Desk sits alongside our mortgage brokerage. Every mortgage we fund generates a claimable home-insurance opportunity in a shared pool. You claim, quote, bind — no monthly fee, no minimum spend. We take 15% of the bound annual premium as a referral fee. That's it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: Zap, tag: 'Live pool',
                title: 'First-come, first-served claim feed',
                body: 'When a mortgage funds, an insurance opportunity lands in the shared pool with client name, coverage type, and closing date. Every active insurance agent gets a live notification. Click Claim, it\'s yours — atomically. No double-assignment races.',
              },
              {
                icon: Home, tag: 'Pre-qualified',
                title: 'Bound-required leads only',
                body: 'These aren\'t rate-shoppers. They HAVE a closing date. They MUST bind coverage to fund. Bind rate on mortgage-triggered leads is 60–80% vs. 12–18% on cold PPC. You know before you quote whether it\'ll close.',
              },
              {
                icon: DollarSign, tag: 'Simple',
                title: '15% of bound annual premium',
                body: 'On a $2,000/yr home policy, that\'s $300 to IndiBrick, $1,700 to your agency. Paid within 30 days of policy effective date. Renewals in year 2+ are 100% yours.',
              },
              {
                icon: FileText, tag: 'No CRM switch',
                title: 'Runs alongside Applied Epic / EZLynx',
                body: 'You keep your policy management + accounting where it is. IndiBrick Pro is a lead feed + light pipeline for the leads you claim from us. No import, no migration, no data lock-in.',
              },
              {
                icon: Sparkles, tag: 'Auto reminders',
                title: 'Built-in renewal cadence',
                body: '120 / 60 / 30 / 7 day escalating alerts before every renewal so you never lose a policy to lapse. Fully automated once the policy is bound in the system.',
              },
              {
                icon: TrendingUp, tag: 'Book snapshot',
                title: 'Live book premium tracker',
                body: 'Your dashboard shows bound + renewed annual premium in real time. Filter by carrier, coverage type, or claim date. Export whenever you want.',
              },
            ].map(f => (
              <div key={f.title} className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <f.icon size={18} className="text-emerald-600"/>
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
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 block">How it works</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-10">From mortgage funding to bound policy in 4 steps.</h2>
          <div className="space-y-6">
            {[
              {
                num: '01', when: 'MORTGAGE FUNDS',
                title: 'A qualified client hits our pipeline',
                body: 'IndiBrick funds a mortgage in Ontario. Client name, contact info, and coverage need (Home / Bundle) flow into an opportunity in the shared insurance pool. You get a live notification in the Insurance Desk.',
              },
              {
                num: '02', when: 'YOU CLAIM',
                title: 'One click, atomically yours',
                body: 'Open the Insurance Desk → click Claim on the lead. First agent wins — everyone else sees "Already claimed." No lead-selling, no bidding, no 4-hour lead-response scramble.',
              },
              {
                num: '03', when: 'YOU QUOTE + BIND',
                title: 'Work the lead in your own carrier portals',
                body: 'You already have BSpoke or Applied Rating or the carrier direct portals. Quote in whatever you use — IndiBrick doesn\'t force a workflow. When you bind, log carrier + policy # + premium in IndiBrick Pro so the referral fee triggers.',
              },
              {
                num: '04', when: 'RENEWAL + RETENTION',
                title: '120/60/30/7 day auto-alerts fire in your inbox',
                body: 'Never lose a policy to lapse. When the renewal is within 4 months, we start firing escalating reminders — you decide the follow-up cadence. Renewals in year 2+ are 100% your commission.',
              },
            ].map(step => (
              <div key={step.num} className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-[100px_1fr] gap-5 md:gap-8">
                <div>
                  <div className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-400">{step.num}</div>
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
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 block">Why IndiBrick vs. buying leads</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-8">Different economics. Different quality.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-3">The leads themselves are different</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                A mortgage-triggered lead HAS to bind — no coverage, no fund. That's structurally different from a "get 3 quotes" form-fill. Every IndiBrick lead comes with a closing date, verified income for the underwriting, and the phone number their broker already has on file.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                You're not competing against every ad tech company for their attention. You're the one insurance agent they'll speak with today.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-3">Cost per bound policy, not per click</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                PPC: $120 CPL × 6 leads per bind = $720 acquisition cost. IndiBrick: 15% of $2,000 annual premium × 100% bind rate = $300 acquisition cost, and you only pay after the policy binds.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Renewals stay yours: year 2 onward is your full commission. That $2,000 policy compounds every year, on us for the origin.
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
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 block">Join the cohort</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4">Ontario insurance agents only. Capacity throttled to mortgage volume.</h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6">
                We cap agent intake at what our mortgage-funding volume can support. If we sign 40 agents in Q1 but only fund 45 mortgages, each agent sees ~1 lead — that's a bad deal for you. We open new spots as our funded volume grows. Priority reviewed in submission order.
              </p>
              <div className="space-y-3">
                {[
                  '2 business hours to first response',
                  'No monthly fee, no minimum, no exclusivity',
                  '15% referral fee only on bound premium — never on quotes',
                  'Onboarding call + first claimable lead walkthrough',
                ].map(b => (
                  <div key={b} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5"/>
                    <span className="text-sm text-slate-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <WaitlistForm
              kind="insurance_agent"
              accentClass="bg-emerald-600 hover:bg-emerald-500"
              brokerageLabel="Agency"
              volumeLabel="Policies bound / year"
              volumeHint="e.g. 180 policies"
            />
          </div>
        </div>
      </section>

      {/* ─── BLOCK 7: FAQ ─── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase text-center mb-10">Questions insurance agents ask</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Do I have to switch off Applied Epic / EZLynx?',
                a: 'No. IndiBrick Pro doesn\'t replace your policy management system. It\'s a lead feed + light pipeline for the specific leads you claim from us. Keep your existing carrier portals, accounting, and CRM — we just hand you warm opportunities that never touched an ad platform.',
              },
              {
                q: 'How does the 15% referral fee work in Ontario?',
                a: 'Referral compensation between licensed insurance and mortgage professionals is permitted under RIBO Rule 12 with proper disclosure. We disclose to the borrower at claim, and the fee (15% of bound annual premium) is remitted to IndiBrick within 30 days of policy effective date. Renewals in year 2+ are 100% yours — no ongoing residual owed.',
              },
              {
                q: 'What coverage types do these leads need?',
                a: 'Primarily home insurance (mortgage lenders require it to fund). Some leads add auto or bundle at intake — you\'ll see the client\'s indicated coverage on the claimable card. About 30% end up as multi-line (Home + Auto), which most carriers reward with a 15–20% discount you can offer.',
              },
              {
                q: 'What if someone else claims a lead before I do?',
                a: 'You see "Already claimed" and the card disappears from your pool. Notifications are broadcast to every active agent simultaneously, so it\'s a real race — usually the agent who responds within 5 minutes of the ping wins. Our fastest partner responded in 42 seconds last month.',
              },
              {
                q: 'What territories are you accepting?',
                a: 'GTA (Toronto core + Peel + York + Halton + Durham) and Ottawa. Adding Hamilton + Kitchener-Waterloo next quarter based on funded volume there. Submit the form even if you\'re outside — we\'ll queue you for the geographic expansion.',
              },
              {
                q: 'Do you also refer life / disability / critical illness?',
                a: 'Yes — when a mortgage closes, we surface the mortgage-life insurance opportunity to whoever holds the home policy first. Multi-carrier agencies with life licensing get priority. Flag your life-licensing status on the intake form.',
              },
            ].map(f => (
              <details key={f.q} className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <summary className="cursor-pointer list-none p-5 flex justify-between items-center hover:bg-gray-50 transition">
                  <span className="font-black text-slate-900 text-sm">{f.q}</span>
                  <span className="font-black text-xl group-open:rotate-45 transition text-emerald-600">+</span>
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
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">Free platform. Warm leads. Ontario only.</h2>
          <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl mx-auto">
            The next intake closes when the territory fills.
          </p>
          <Link href="#waitlist" className="inline-flex bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs items-center gap-2 transition shadow-lg shadow-emerald-500/40">
            Request access <ArrowRight size={14}/>
          </Link>
          <p className="text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest">RIBO-compliant referrals · Free access · 2-hour response</p>
        </div>
      </section>
    </div>
  );
}
