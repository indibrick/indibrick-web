import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle, X, ArrowRight, Sparkles, Zap, Target, Users, TrendingUp, Lock,
} from 'lucide-react';
import WaitlistForm from '../../components/marketing/WaitlistForm';

export const metadata: Metadata = {
  title: 'Pricing | IndiBrick CRM for Realtors + Insurance Agents',
  description:
    'The CRM built for Ontario realtors and insurance agents — free forever base tier, optional marketing suite, and done-for-you managed ads. No credit card required to start.',
  alternates: { canonical: 'https://indibrick.ca/pricing' },
  openGraph: {
    title: 'IndiBrick Pricing | Free CRM + Marketing + Managed Ads',
    description:
      'Free CRM base tier for Ontario realtors and insurance agents. Add marketing automation or fully-managed paid ads when you\'re ready to scale.',
    url: 'https://indibrick.ca/pricing',
    type: 'website',
  },
};

const TIERS = [
  {
    name: 'Free CRM',
    subtitle: 'Everything you need to run your book',
    price: '$0',
    priceSub: 'forever, no credit card',
    accent: 'from-emerald-500 to-emerald-700',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    highlight: false,
    cta: 'Get on the waitlist',
    features: [
      'Unlimited contacts + deals',
      'Custom pipeline stages',
      'SMS + call log per deal',
      'Email drip sequences',
      'CSV import from any CRM',
      'iOS-style unified inbox',
      'AI deal analyzer + copilot',
      'Cross-sell flag automation',
      'CASL-compliant unsubscribe',
    ],
    notIncluded: [
      'Mass email campaigns beyond 200/mo',
      'Managed ad services',
    ],
  },
  {
    name: 'Marketing Pro',
    subtitle: 'Grow the book you already have',
    price: '$149',
    priceSub: 'per month, per seat',
    accent: 'from-blue-500 to-blue-700',
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-700',
    highlight: true,
    badge: 'Most popular',
    cta: 'Join the pilot',
    features: [
      'Everything in Free CRM',
      'Unlimited mass campaigns',
      'Advanced drip templates + branching',
      'A/B subject line testing',
      'Own from-address + brokerage identity',
      'Deliverability reporting (bounces + complaints)',
      'Workflow automation (30+ triggers)',
      'Team calendar sync + booking',
      'Priority Slack support',
    ],
    notIncluded: [
      'We build + run your paid ads',
    ],
  },
  {
    name: 'Managed Ads',
    subtitle: 'Done-for-you paid acquisition',
    price: '$897+',
    priceSub: 'per month · Starter / Growth / Scale',
    accent: 'from-purple-500 to-purple-700',
    accentBg: 'bg-purple-50',
    accentText: 'text-purple-700',
    highlight: false,
    cta: 'Talk to us',
    features: [
      'Everything in Marketing Pro',
      'Google + Meta campaign build',
      'Landing pages built for your market',
      'Weekly optimization + creative rotation',
      'Attribution report inside your CRM',
      'Cost-per-lead + cost-per-funded tracking',
      'Dedicated account strategist',
      'Ad spend billed separately + transparent',
    ],
    notIncluded: [],
  },
];

const COMPARE = [
  { row: 'Contacts + deals', free: 'Unlimited', pro: 'Unlimited', ads: 'Unlimited' },
  { row: 'Mass email / month', free: '200', pro: 'Unlimited', ads: 'Unlimited' },
  { row: 'SMS included', free: 'Pay per usage', pro: 'Pay per usage', ads: 'Pay per usage' },
  { row: 'Drip sequences', free: '3 active', pro: 'Unlimited', ads: 'Unlimited' },
  { row: 'Workflow automations', free: '5 active', pro: 'Unlimited', ads: 'Unlimited' },
  { row: 'From your own email domain', free: false, pro: true, ads: true },
  { row: 'Deliverability reporting', free: false, pro: true, ads: true },
  { row: 'AI deal analyzer + copilot', free: true, pro: true, ads: true },
  { row: 'Attribution reporting', free: 'Basic', pro: 'Advanced', ads: 'Advanced + spend' },
  { row: 'Paid ad management', free: false, pro: false, ads: true },
  { row: 'Landing pages built for you', free: false, pro: false, ads: true },
  { row: 'Dedicated strategist', free: false, pro: false, ads: true },
];

const FAQ = [
  {
    q: 'Is the free tier really free forever?',
    a: 'Yes. No credit card, no trial period, no surprise upgrades. We built IndiBrick because our own realtors kept getting priced out of GoHighLevel and Follow Up Boss right when they were finally starting to use them. The Free tier stays free — we make money on Marketing Pro and Managed Ads, not on locking you out of your own contacts.',
  },
  {
    q: 'Can I export my data if I leave?',
    a: 'Any time. Every partner has a one-click export (CSV + JSON) covering every contact, message, and task. Your data is yours — walking out with it is not something you have to fight for.',
  },
  {
    q: 'Do I have to be an Ontario realtor to use this?',
    a: 'Right now, yes — our current pilot is Ontario realtors and Ontario-licensed insurance agents. That will open up nationally over 2026. Get on the waitlist and we\'ll notify you when your province is live.',
  },
  {
    q: 'How does Managed Ads work?',
    a: 'You pick a tier (Starter $897, Growth $1497, Scale $2497 CAD/mo). We build the campaigns, write the copy, spin up landing pages, and pipe every lead into your CRM with full attribution. You watch the cost-per-lead + cost-per-funded numbers in your dashboard. Ad spend is separate and paid directly to Google/Meta — we never mark it up.',
  },
  {
    q: 'What about SMS and phone calls — is Twilio included?',
    a: 'SMS and calls run through your own Twilio subaccount (or ours as a passthrough at cost). We handle the CRM side; you pay Twilio\'s actual per-message and per-minute rates with no markup from us.',
  },
  {
    q: 'When can I start?',
    a: 'Join the waitlist and we\'ll get you set up in the current pilot cohort. First 50 partners land inside two weeks of signup.',
  },
];

function Check() { return <CheckCircle size={16} className="text-emerald-600"/>; }
function Dash()  { return <X size={16} className="text-neutral-300"/>; }

function CompareCell({ value }: { value: string | boolean }) {
  if (value === true) return <div className="flex justify-center"><Check/></div>;
  if (value === false) return <div className="flex justify-center"><Dash/></div>;
  return <span className="text-sm text-neutral-700">{value}</span>;
}

// Structured data — Product / OfferCatalog + FAQPage. Emitted inline
// on the page so it renders on server-side output where crawlers +
// LLM ingestion pipelines actually look.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'IndiBrick CRM',
      description:
        'The CRM built for Ontario realtors and insurance agents — free forever base tier, optional marketing suite, and done-for-you managed ads.',
      brand: { '@type': 'Brand', name: 'IndiBrick' },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'CAD',
        lowPrice: '0',
        highPrice: '2497',
        offerCount: 3,
        offers: [
          {
            '@type': 'Offer',
            name: 'Free CRM',
            price: '0',
            priceCurrency: 'CAD',
            description: 'Unlimited contacts, deals, and SMS + call log per deal. No credit card required.',
            availability: 'https://schema.org/InStock',
            url: 'https://indibrick.ca/pricing#free-crm',
          },
          {
            '@type': 'Offer',
            name: 'Marketing Pro',
            price: '149',
            priceCurrency: 'CAD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '149',
              priceCurrency: 'CAD',
              billingIncrement: 1,
              unitCode: 'MON',
            },
            description: 'Unlimited mass campaigns, advanced drips, A/B subject testing, own from-address.',
            availability: 'https://schema.org/InStock',
            url: 'https://indibrick.ca/pricing#marketing-pro',
          },
          {
            '@type': 'Offer',
            name: 'Managed Ads',
            price: '897',
            priceCurrency: 'CAD',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '897',
              priceCurrency: 'CAD',
              billingIncrement: 1,
              unitCode: 'MON',
            },
            description: 'Done-for-you paid acquisition — Google + Meta campaigns, landing pages, weekly optimization.',
            availability: 'https://schema.org/InStock',
            url: 'https://indibrick.ca/pricing#managed-ads',
          },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

export default function PricingPage() {
  return (
    <div className="bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* HERO */}
      <section className="relative bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-[140px] translate-x-1/3 -translate-y-1/4 pointer-events-none bg-gradient-to-b from-blue-600/30 to-transparent"/>
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <span className="inline-block bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border border-white/10">
            Ontario realtors + insurance agents · pilot cohort open
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            The CRM that pays<br/>for itself.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
            Free forever base tier. Add marketing when you&apos;re ready to scale. Layer in
            done-for-you paid ads when you want us running the top of your funnel.
            No credit card to start, no lock-in to leave.
          </p>
        </div>
      </section>

      {/* TIER CARDS */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map(t => (
              <div key={t.name}
                className={`relative rounded-3xl border ${t.highlight ? 'border-blue-600 shadow-2xl md:-translate-y-3' : 'border-neutral-200'} bg-white p-6 md:p-8 flex flex-col`}>
                {t.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                    {t.badge}
                  </span>
                )}
                <div>
                  <h3 className={`text-xl font-black tracking-tight text-slate-900`}>{t.name}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{t.subtitle}</p>
                </div>
                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br ${t.accent}`}>{t.price}</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">{t.priceSub}</div>
                </div>
                <ul className="mt-6 space-y-2 flex-1">
                  {t.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                      <CheckCircle size={16} className={`${t.accentText} mt-0.5 shrink-0`}/>
                      <span>{f}</span>
                    </li>
                  ))}
                  {t.notIncluded.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-neutral-400">
                      <X size={16} className="mt-0.5 shrink-0"/>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="#waitlist"
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-widest transition ${
                    t.highlight ? 'bg-slate-900 text-white hover:bg-blue-600' : `${t.accentBg} ${t.accentText} hover:bg-slate-900 hover:text-white`
                  }`}>
                  {t.cta} <ArrowRight size={12}/>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center">Compare tiers</h2>
          <p className="mt-2 text-center text-neutral-500">Everything included at a glance.</p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-neutral-500">Feature</th>
                  <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-emerald-700">Free CRM</th>
                  <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-blue-700">Marketing Pro</th>
                  <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-purple-700">Managed Ads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {COMPARE.map(row => (
                  <tr key={row.row}>
                    <td className="px-4 py-3 text-neutral-900 font-medium">{row.row}</td>
                    <td className="px-4 py-3 text-center"><CompareCell value={row.free}/></td>
                    <td className="px-4 py-3 text-center"><CompareCell value={row.pro}/></td>
                    <td className="px-4 py-3 text-center"><CompareCell value={row.ads}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: '6-minute pre-approval', body: 'Realtors can qualify a buyer at the showing without leaving the CRM.' },
              { icon: Target, title: 'Attribution built-in', body: 'Multi-touch tracking on every lead — see which campaign actually funds.' },
              { icon: Lock, title: 'CASL + Gmail compliant', body: 'RFC 8058 one-click unsubscribe. Bounce + complaint tracking baked in.' },
            ].map(f => (
              <div key={f.title} className="bg-white border border-neutral-200 rounded-2xl p-6">
                <f.icon className="text-blue-600 mb-3" size={22}/>
                <h3 className="text-lg font-black text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center">Common questions</h2>
          <div className="mt-10 space-y-6">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-neutral-200 p-5">
                <h3 className="font-black text-slate-900">{q}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <Sparkles className="mx-auto mb-4 text-blue-400" size={28}/>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Join the pilot cohort</h2>
          <p className="mt-3 text-white/70">
            Ontario realtors and insurance agents only, for now. We&apos;ll get you set up inside two weeks.
          </p>
          <div className="mt-8 text-left">
            <WaitlistForm/>
          </div>
        </div>
      </section>
    </div>
  );
}
