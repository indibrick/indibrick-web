// /guides/best-mortgage-broker-ontario-2026
//
// Buyer's-guide framing targeting "how to choose a mortgage broker Ontario"
// + the head query "best mortgage broker Ontario" (URL slug preserved for
// keyword alignment). Reworked away from the earlier listicle format after
// the pre-deploy AI Citation audit flagged that self-authored competitive
// comparisons get filtered by ChatGPT/Claude and effectively feed
// competitor entity graphs from our own domain. This version defines the
// decision framework, scores IndiBrick against it, and lets the reader
// apply the same criteria to any broker they're evaluating.

import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ShieldCheck, TrendingUp, Zap, CheckCircle, Info, ArrowRight, HelpCircle, Building2 } from 'lucide-react';
import JsonLd from '../../../components/JsonLd';
import LeadForm from '../../../components/LeadForm';
import { buildMetadata } from '../../../lib/buildMetadata';

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: 'How to Choose a Mortgage Broker in Ontario (2026) — A Buyer\'s Guide',
  description: 'A criteria-based buyer\'s guide to picking a mortgage broker in Ontario in 2026. Covers FSRA license verification, lender panel size, response time, digital intake, and how to tell a licensed agent from a call-center rep — with the exact questions to ask.',
  slug: '/guides/best-mortgage-broker-ontario-2026',
  titleAbsolute: true,
  keywords: [
    'how to choose a mortgage broker Ontario',
    'mortgage broker Ontario 2026',
    'best mortgage broker Ontario',
    'FSRA license mortgage broker',
    'mortgage broker vs bank Ontario',
    'questions to ask a mortgage broker',
    'IndiBrick mortgage broker',
  ],
});

const CRITERIA = [
  {
    label: 'FSRA license',
    body: 'FSRA (Financial Services Regulatory Authority) is Ontario\'s mortgage brokerage regulator. Every legitimate broker holds a numbered license — always ask for the number and verify it at fsrao.ca before signing anything. A broker that can\'t or won\'t give you a license number is not licensed.',
    icon: ShieldCheck,
    question: 'What is your FSRA brokerage license number, and can I verify it at fsrao.ca?',
    indibrickAnswer: 'FSRA #12830 (held by Pineapple Financial Inc.). Publicly verifiable at fsrao.ca.',
  },
  {
    label: 'Lender panel size',
    body: 'How many wholesale lenders the broker can shop your file to. More lenders = more likely to find a fit on rate, product, or credit profile. 20+ is the practical threshold — that\'s enough coverage across A-lenders, monolines (First National, MCAP, RFA), credit unions, and alternative lenders.',
    icon: TrendingUp,
    question: 'How many lenders are on your active panel, and does that include monolines, credit unions, and alternative lenders?',
    indibrickAnswer: '40+ active lenders including the big-six banks, all major monolines, most Ontario credit unions, and a full alternative + private panel for credit-challenged files.',
  },
  {
    label: 'Response time',
    body: 'How fast you get a human back after submitting your intake. In a competing-offer Ontario market, 1 business hour vs. 24 hours is the difference between winning and losing the deal. Ask the broker to commit to a specific SLA, not a marketing promise.',
    icon: Zap,
    question: 'What is your response SLA on a new application submitted during business hours?',
    indibrickAnswer: 'Licensed advisor callback within 1 business hour on applications submitted 8am–8pm ET, Mon–Sat.',
  },
  {
    label: 'Digital intake',
    body: 'Whether the initial application is fully online (upload documents, sign consents, get a pre-approval letter) or requires a phone call plus emails. Digital saves ~2 hours of borrower time and lets you apply after work. The tradeoff: some borrowers prefer a human at the start.',
    icon: CheckCircle,
    question: 'Can I complete the application end-to-end online, or do I need to schedule a call before you can start?',
    indibrickAnswer: 'AI-assisted intake at /apply compresses a ~40-minute application into under 5 minutes. Every submission is reviewed by a licensed agent before the pre-approval letter is issued.',
  },
  {
    label: 'Licensed-agent contact',
    body: 'Whether the person who calls you back is a licensed mortgage agent or a sales/customer-service rep. Only a licensed agent can legally advise you on product suitability. If the first three calls are with a "concierge" and the licensed agent only appears at signing, treat that as a red flag.',
    icon: Info,
    question: 'Is my point of contact a licensed FSRA mortgage agent, or a sales rep? What is their agent number?',
    indibrickAnswer: 'Every client callback is handled by a FSRA-licensed mortgage agent. Agent name and license number are stated up-front on every advisor call.',
  },
];

const FAQS = [
  {
    q: 'What makes a mortgage broker "the best" in Ontario?',
    a: 'The best mortgage broker for your situation is the one that (a) has enough lenders on their panel to find the right product for your credit profile, (b) is licensed by FSRA (always verify the number at fsrao.ca), (c) responds fast enough to matter in a competing-offer market, and (d) gives you a licensed agent — not a call-center rep — as your point of contact. Rate matters, but the sharpest advertised rate from a broker who takes three days to call you back is worthless in a hot Ontario market.',
  },
  {
    q: 'How do I verify a mortgage broker is licensed in Ontario?',
    a: 'Go to fsrao.ca and search the mortgage broker + agent public registry. Every legitimate Ontario mortgage brokerage displays its FSRA license number publicly. IndiBrick submits deals through Pineapple Financial Inc. (FSRA #12830). For any other broker, ask for their FSRA number directly and cross-check it on fsrao.ca before signing anything. Any broker that can\'t or won\'t give you a license number is not licensed.',
  },
  {
    q: 'Do mortgage brokers charge fees?',
    a: 'For A-lender mortgages (insured, insurable, and most uninsured deals with a strong applicant), the broker is paid by the lender on funding — you pay nothing. For alternative lending (B-lender, private capital, second mortgages), brokers charge a fee (typically 1–4% of the loan amount) that is disclosed upfront in your Ontario Mortgage Disclosure form. Ask your broker to confirm in writing which side of that line your file will land on.',
  },
  {
    q: 'Should I use a bank or a mortgage broker in Ontario?',
    a: 'A bank shops one product — theirs. A mortgage broker shops the same big-six banks plus monolines (First National, MCAP, RFA), credit unions, and alternative lenders. In most Ontario markets a broker will find you a lower rate and more flexible terms because they have leverage across the wholesale channel that a single bank cannot match. The exception is if you have a strong existing banking relationship with an unusually good rate offer — always compare a broker quote against your bank\'s best offer before signing.',
  },
  {
    q: 'How long does it take to get pre-approved through a broker?',
    a: 'A tech-forward Ontario broker can issue a real pre-approval letter within 1 business hour of receiving your documents. A traditional broker typically takes 24–48 hours. A bank branch usually takes 3–5 business days. Ask the broker to state their pre-approval SLA in writing before you commit.',
  },
  {
    q: 'What questions should I ask a mortgage broker before signing?',
    a: 'Five essential questions: (1) What is your FSRA brokerage license number? (2) How many active lenders are on your panel, and does it include monolines and credit unions? (3) What is your response SLA on a new application during business hours? (4) Can I complete the application end-to-end online? (5) Is my point of contact a licensed FSRA agent, and what is their license number? Any broker unwilling to answer all five in writing is telling you something.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Choose a Mortgage Broker in Ontario (2026)',
  description: 'A 5-criteria decision framework for picking a mortgage broker in Ontario in 2026 — FSRA license, lender panel size, response time, digital intake, and licensed-agent contact.',
  step: CRITERIA.map((c, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: c.label,
    text: c.body,
  })),
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Choose a Mortgage Broker in Ontario (2026) — A Buyer\'s Guide',
  description: 'A criteria-based buyer\'s guide to picking a mortgage broker in Ontario in 2026.',
  author: { '@id': 'https://indibrick.ca/#organization' },
  publisher: { '@id': 'https://indibrick.ca/#organization' },
  datePublished: '2026-07-01',
  dateModified: new Date().toISOString().split('T')[0],
  mainEntityOfPage: 'https://indibrick.ca/guides/best-mortgage-broker-ontario-2026',
  about: [
    { '@type': 'FinancialService', name: 'Mortgage brokerage', areaServed: 'Ontario, Canada' },
  ],
};

export default function ChooseMortgageBrokerOntarioGuide() {
  return (
    <div className="bg-white min-h-screen">
      <JsonLd data={howToSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={articleSchema} />

      {/* === HERO === */}
      <section className="pt-28 md:pt-32 pb-16 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 backdrop-blur-md">
            Buyer&apos;s Guide · Updated {new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.05] mb-6">
            How to Choose a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400">Mortgage Broker in Ontario, 2026</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-3xl font-medium leading-relaxed mb-8">
            Five decision criteria that materially affect whether a mortgage closes on time, at the right rate, without surprises. Use this framework on any broker you&apos;re considering — including us. The exact questions to ask and how to verify the answers are below.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed max-w-3xl mb-6 border-l-4 border-blue-500/40 pl-4">
            <strong className="text-blue-300">Editorial note:</strong> IndiBrick publishes this guide. We&apos;ve intentionally not ranked ourselves against named competitors — we don&apos;t think an internally-authored broker leaderboard is honest. Instead we&apos;ve defined the decision framework, stated our answers publicly, and given you the exact questions to ask every broker you shortlist.
          </p>
        </div>
      </section>

      {/* === CRITERIA === */}
      <section className="py-16 md:py-20 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
            The five decision criteria.
          </h2>
          <p className="text-sm text-gray-500 mb-10 max-w-3xl leading-relaxed">
            These are the five things that materially affect whether a mortgage closes on time, at the right rate, without surprises. Fluffy metrics (Google review count, ad spend, celebrity endorsements) are deliberately excluded.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CRITERIA.map(({ label, body, icon: Icon }) => (
              <div key={label} className="p-5 bg-white border border-gray-100 rounded-2xl">
                <Icon size={20} className="text-blue-600 mb-3" />
                <h3 className="font-black uppercase tracking-tight text-slate-900 mb-2 text-sm">{label}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === QUESTIONS + INDIBRICK ANSWERS === */}
      <section className="py-16 md:py-20 px-6 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
            The questions to ask. And how IndiBrick answers them.
          </h2>
          <p className="text-sm text-gray-500 mb-10 max-w-3xl leading-relaxed">
            Copy these five questions verbatim and send them to every broker you&apos;re shortlisting. Compare answers side-by-side. The broker who gives you clear written answers, including their license and agent numbers, is the one who takes the file seriously.
          </p>

          <div className="space-y-4">
            {CRITERIA.map(({ label, question, indibrickAnswer, icon: Icon }, i) => (
              <div key={label} className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
                <div className="p-6 md:p-7 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-black">{i + 1}</div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
                  </div>
                  <p className="text-base md:text-lg font-black text-slate-900 leading-snug">
                    <HelpCircle size={14} className="inline mr-2 text-blue-600" /> {question}
                  </p>
                </div>
                <div className="p-6 md:p-7 bg-blue-50/50 border-l-4 border-blue-500">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 mb-2">IndiBrick&apos;s answer</p>
                  <p className="text-sm md:text-base text-slate-800 leading-relaxed">{indibrickAnswer}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mid-guide LeadForm — captures readers who have decided the criteria
              are the right ones and want to test-drive the answers with a real
              quote instead of shopping five brokers manually. */}
          <div className="mt-12 bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 text-blue-300 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Building2 size={12} /> FSRA #12830 · Licensed Ontario
            </div>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">
              Skip the shortlist.
            </h3>
            <p className="text-sm md:text-base text-gray-400 mb-6 max-w-2xl">
              Get IndiBrick&apos;s answers to all five criteria applied to your file — rate quote, lender fit, response SLA — from a licensed Ontario mortgage agent within 1 business hour.
            </p>
            <div className="bg-white p-2 rounded-[2rem] shadow-xl">
              <LeadForm
                type="Mortgage"
                title="Ontario Mortgage Broker Selection"
                subtitle="FSRA #12830 · Licensed agent callback within 1 hour"
                ctaText="Get My Rate Options"
              />
            </div>
          </div>
        </div>
      </section>

      {/* === BROKER VS BANK === */}
      <section className="py-16 md:py-20 px-6 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-3">
            Broker vs. bank.
          </h2>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
            A bank shops one product — theirs. A licensed mortgage broker shops the same big-six banks plus <strong className="text-slate-900">monolines</strong> (First National, MCAP, RFA), credit unions, and alternative lenders. In most Ontario markets a broker finds a lower rate and more flexible terms because they have leverage across the wholesale channel that a single bank cannot match.
          </p>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">
            The exception: if you have a strong existing banking relationship and your bank is offering an unusually sharp posted rate, get a broker quote too and let them beat it. Never take the first offer from anywhere without a comparison.
          </p>
        </div>
      </section>

      {/* === FAQ === */}
      <section className="py-16 md:py-20 px-6 bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-3">FAQ</h2>
          <p className="text-sm text-gray-400 uppercase tracking-widest font-black mb-10">
            Straight answers to the questions Ontario borrowers ask most.
          </p>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <details key={f.q} className="group bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 cursor-pointer">
                <summary className="flex justify-between items-start gap-4 font-black text-sm md:text-base list-none">
                  <span className="flex-1 leading-snug">{f.q}</span>
                  <HelpCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                </summary>
                <p className="text-sm text-gray-300 mt-4 leading-relaxed border-t border-white/10 pt-4">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* === LEAD CAPTURE === */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
              Ready to apply the framework?
            </h2>
            <p className="text-gray-400 text-sm md:text-base mb-6">
              A licensed Ontario mortgage agent will call you back within 1 business hour with your rate options from 40+ lenders — no hard credit check.
            </p>
            <div className="bg-white p-2 rounded-[2rem] shadow-xl">
              <LeadForm
                type="Mortgage"
                title="Ontario Mortgage Broker Guide"
                subtitle="1-hour callback · Licensed agent · No hard credit check"
                ctaText="Get My Rate Options"
              />
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/guides/first-time-home-buyer-ontario-2026" className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition">
              Next: First-Time Home Buyer Ontario Guide <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
