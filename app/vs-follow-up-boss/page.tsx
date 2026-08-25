import type { Metadata } from 'next';
import ComparisonTemplate from '../../components/marketing/ComparisonTemplate';
import type { ComparisonSpec } from '../../lib/comparisonShape';

export const metadata: Metadata = {
  title: 'IndiBrick vs Follow Up Boss | Real Estate CRM Comparison for Ontario Agents',
  description:
    'Comparing IndiBrick and Follow Up Boss for Ontario realtors: pricing, mortgage integration, ad management, and how each platform handles Canadian compliance.',
  alternates: { canonical: 'https://indibrick.ca/vs-follow-up-boss' },
  openGraph: {
    title: 'IndiBrick vs Follow Up Boss',
    description:
      'A Canadian, mortgage-aware CRM vs a US-first real estate CRM — priced, positioned, and compared side-by-side for Ontario agents.',
    url: 'https://indibrick.ca/vs-follow-up-boss',
    type: 'website',
  },
};

const SPEC: ComparisonSpec = {
  slug: 'vs-follow-up-boss',
  competitor: 'Follow Up Boss',
  competitorTagline:
    'US-first real estate CRM. Excellent action-plan engine, but priced per seat with no free tier and no built-in mortgage flow.',
  ourAngle:
    'Canadian by default: CASL, Ontario mortgage math, cross-sell to your broker in one click. Free forever base tier.',
  ourPriceStart: '$0/mo',
  theirPriceStart: 'US$69+/mo',
  positioning:
    'Follow Up Boss is a well-loved US real estate CRM. If you\'re a Texas realtor buying 5 seats, it\'s a strong pick. For Ontario realtors, the price sting (US$69/seat × exchange), the missing mortgage integration, and the lack of CASL-native email tooling add up fast. IndiBrick is Canadian by default — CASL-compliant unsubscribe, semi-annual compounding math on mortgages, and a one-click referral to a licensed FSRA broker when your buyer needs financing.',
  rows: [
    { feature: 'Starting price',                        us: '$0/mo forever', them: 'US$69/user/mo' },
    { feature: 'Free tier',                             us: true, them: false },
    { feature: 'Ontario mortgage math (B-20, CMHC)',    us: true, them: false },
    { feature: 'Cross-sell to a licensed broker',       us: 'Built in', them: 'Manual' },
    { feature: 'CASL-native email + one-click unsub',   us: true, them: 'Manual config' },
    { feature: 'AI deal analyzer for purchase files',   us: true, them: 'Not included' },
    { feature: 'Action plans / drip sequences',         us: true, them: true },
    { feature: 'Multi-touch attribution',               us: true, them: 'Limited' },
    { feature: 'Managed paid ads (done-for-you)',       us: '$897–$2497/mo CAD', them: 'Not offered' },
    { feature: 'Team pipelines + shared visibility',    us: true, them: true },
    { feature: 'Data portability (CSV + JSON export)',  us: 'One click', them: 'Available' },
    { feature: 'Built for Canadian workflows',          us: true, them: false },
    { feature: 'Support timezone',                      us: 'ET', them: 'PT' },
  ],
  faq: [
    {
      q: 'Follow Up Boss is what my brokerage uses — why switch?',
      a: 'You may not need to. Follow Up Boss is a good product. The reasons to look at IndiBrick specifically are: your leads keep bouncing because CASL headers aren\'t set the way Gmail wants them; your buyers keep asking mortgage questions your CRM can\'t answer; you\'re paying US pricing without a Canadian tax reason to do so; or you want a done-for-you Ontario paid ads service that ties directly into your pipeline.',
    },
    {
      q: 'Does IndiBrick have action plans like FUB?',
      a: 'Yes. Drip sequences with up to 20 steps, branch logic on tags/status, and a workflow engine with 30+ triggers (new lead, status change, field change, tag added, cross-sell flagged). Same pattern, Canadian defaults.',
    },
    {
      q: 'How does the mortgage cross-sell work?',
      a: 'When your buyer is ready for financing, you hit "Push to broker" on the deal. IndiBrick routes it to a licensed FSRA broker on our network (or the broker you nominate), keeps you attributed as the referrer, and pays you a 25% commission share on any deal we fund. This runs through Pineapple Financial Inc. (FSRA #12830), our fulfillment partner.',
    },
    {
      q: 'What\'s the catch on the free tier?',
      a: 'None on the CRM side. Free means unlimited contacts, deals, drips (up to 3 active), and workflow automations (up to 5 active). If you outgrow those caps, Marketing Pro at $149 CAD/month per seat lifts them. We make money on Marketing Pro + Managed Ads, not on gating your own contact list.',
    },
    {
      q: 'Can I import my Follow Up Boss data?',
      a: 'Yes. CSV import auto-detects column mappings from FUB, kvCORE, Chime, and Lofty exports, dedupes on email + phone, and preserves stage + status.',
    },
  ],
};

export default function VsFollowUpBossPage() {
  return <ComparisonTemplate spec={SPEC}/>;
}
