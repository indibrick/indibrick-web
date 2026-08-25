import type { Metadata } from 'next';
import ComparisonTemplate from '../../components/marketing/ComparisonTemplate';
import type { ComparisonSpec } from '../../lib/comparisonShape';

export const metadata: Metadata = {
  title: 'IndiBrick vs GoHighLevel | Real Estate + Insurance CRM Comparison',
  description:
    'Comparing IndiBrick and GoHighLevel for Ontario realtors and insurance agents: pricing, deliverability, learning curve, and what each platform is actually built for.',
  alternates: { canonical: 'https://indibrick.ca/vs-gohighlevel' },
  openGraph: {
    title: 'IndiBrick vs GoHighLevel',
    description:
      'A specialist real estate + insurance CRM vs a general-purpose agency platform — priced, positioned, and compared side-by-side.',
    url: 'https://indibrick.ca/vs-gohighlevel',
    type: 'website',
  },
};

const SPEC: ComparisonSpec = {
  slug: 'vs-gohighlevel',
  competitor: 'GoHighLevel',
  competitorTagline:
    'Sold to agencies as a white-label SaaS. Powerful but built for marketing agencies, not individual realtors or brokers.',
  ourAngle:
    'Purpose-built for Ontario real estate + insurance. Free forever base tier. CASL + Canadian compliance baked in.',
  ourPriceStart: '$0/mo',
  theirPriceStart: '$97+/mo',
  positioning:
    'GoHighLevel is a legitimate platform if you\'re building an agency and reselling to clients. For an Ontario realtor or insurance agent trying to run their own book, it\'s a lot of platform for what you actually use — and you\'re paying $97+/month before you\'ve closed a deal. IndiBrick starts free, ships with the pipelines and integrations Ontario brokers actually need on day one, and lets you export everything the moment you want to leave.',
  rows: [
    { feature: 'Starting price',                       us: '$0/mo forever', them: '$97/mo (Starter, 1 sub-account)' },
    { feature: 'Setup complexity',                     us: 'Sign in, import CSV, go', them: 'Days of configuration + training' },
    { feature: 'Purpose-built for real estate CRMs',   us: true, them: false },
    { feature: 'Canadian CASL-compliant email',        us: true, them: 'Manual config required' },
    { feature: 'RFC 8058 one-click unsubscribe',       us: true, them: 'Available via workflow' },
    { feature: 'Ontario mortgage + insurance workflows',us: true, them: false },
    { feature: 'AI deal analyzer + copilot',           us: true, them: 'Not included — buy separately' },
    { feature: 'Multi-touch attribution built in',     us: true, them: 'Add-on' },
    { feature: 'Managed Ads (done-for-you)',           us: '$897–$2497/mo', them: 'Not offered' },
    { feature: 'Own from-address + verified sender',   us: true, them: true },
    { feature: 'Data portability (CSV + JSON export)', us: 'One click, unlimited', them: 'Subject to plan tier' },
    { feature: 'Sub-account / white-label',            us: 'Not the model', them: true },
    { feature: 'Learning curve',                       us: 'Under an hour', them: 'Days to weeks' },
    { feature: 'Support channel',                      us: 'Slack + email', them: 'Ticket + community' },
  ],
  faq: [
    {
      q: 'Is IndiBrick a GoHighLevel white-label?',
      a: 'No. We built IndiBrick from scratch for a specific audience — Ontario realtors and Ontario-licensed insurance agents — and we do not resell agency infrastructure. Every workflow, template, and integration was designed for how Canadian brokers actually work.',
    },
    {
      q: 'GoHighLevel does more — why would I pick IndiBrick?',
      a: 'GoHighLevel does more in the sense that a Swiss Army knife does more than a chef\'s knife. If you\'re building an agency and reselling CRM access to ten clients, GHL is genuinely the right pick. If you\'re one realtor trying to close more mortgages this quarter, you want a tool that ships pre-configured for your job. Every extra feature you don\'t use in GHL is a form you have to walk past to get to the one you need.',
    },
    {
      q: 'What about deliverability — GHL uses Mailgun by default?',
      a: 'We\'re ESP-agnostic and lean toward Postmark for transactional (drips, one-offs) plus SendGrid for high-volume campaigns. Both are Gmail + Yahoo bulk-sender compliant (Feb 2024 + May 2025 rules). Our bounce/complaint webhook auto-writes to your suppression list so a hard bounce never reaches the same address twice.',
    },
    {
      q: 'Can I actually leave with my data?',
      a: 'Any time. One-click export gives you CSV or JSON of every contact, deal, message, and task. Your data is yours — you don\'t have to fight for it.',
    },
    {
      q: 'How does pricing scale as I grow?',
      a: 'Free tier stays free. Marketing Pro adds mass campaigns, advanced drips, deliverability reporting, and workflow automation at $149 CAD/month per seat. Managed Ads is a separate service tier if you want us running your Google + Meta ads for you ($897 / $1497 / $2497 CAD/month based on ad spend). No lock-in, no annual contracts.',
    },
  ],
};

export default function VsGoHighLevelPage() {
  return <ComparisonTemplate spec={SPEC}/>;
}
