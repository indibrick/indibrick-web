// Shared team roster consumed by <BrokerCard> across the 11 landing pages.
//
// One canonical record per licensed broker so if a title, LinkedIn URL, or
// FSRA license number ever changes, we only edit here. Also serves as the
// data source for the schema.org Person JSON-LD that ships in each
// BrokerCard render.
//
// TODO(license#): once each broker's personal FSRA agent/broker license #
// is confirmed, replace the "M[TBD]" placeholders. Until then, the
// brokerage-level license (Pineapple Financial, FSRA #12830) is what
// appears in the visible chip.

export type BrokerRole = 'Broker' | 'Mortgage Agent Level 2' | 'Mortgage Agent Level 1' | 'Co-Founder';

export interface TeamMember {
  slug: string;                    // Stable id for React keys + future /team/[slug] pages
  name: string;
  roles: BrokerRole[];             // Ordered: primary role first (used for the visible chip)
  displayTitle: string;            // Human-readable chip text (may combine multiple roles)
  photo: string;                   // Path under /public
  linkedin: string;
  fsraAgentLicense?: string;       // Personal license — placeholder until confirmed
  yearsExperience?: number;
  languages: string[];             // For newcomer / cross-cultural matching
  bio: string;                     // One-sentence bio for compact contexts
  handles: {
    // What each broker OWNS on the landing pages — used by <BrokerCard>
    // to render "I personally review every X within Y" copy.
    handles: string;
    withinSLA: string;
  };
}

export const TEAM: Record<string, TeamMember> = {
  mudit: {
    slug: 'mudit-chhura',
    name: 'Mudit Chhura',
    roles: ['Co-Founder'],
    displayTitle: 'Co-Founder, IndiBrick',
    photo: '/mudit-in.jpg',
    linkedin: 'https://www.linkedin.com/in/muditchhura',
    yearsExperience: 5,
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Co-founder of IndiBrick. Leads platform development and partner relationships across the GTA broker network.',
    handles: {
      handles: 'partner + realtor referral files',
      withinSLA: '2 business hours',
    },
  },
  vikas: {
    slug: 'vikas-sharma',
    name: 'Vikas Sharma',
    roles: ['Broker'],
    displayTitle: 'Broker · Part of Dream Home + Life',
    photo: '/vikas-in.jpg',
    linkedin: 'https://www.linkedin.com/in/vikas-sharma-3ba675348/',
    yearsExperience: 22,
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: '22+ years across major Canadian banks and brokerages. Advice-over-sales philosophy. Handles complex approvals and bank-decline rescues.',
    handles: {
      handles: 'complex approvals, declined files, self-employed',
      withinSLA: '1 business day',
    },
  },
  nitish: {
    slug: 'nitish-gupta',
    name: 'Nitish Gupta',
    roles: ['Co-Founder', 'Mortgage Agent Level 1'],
    displayTitle: 'Co-Founder · Mortgage Agent Level 1',
    photo: '/nitish.jpg',
    linkedin: 'https://www.linkedin.com/in/nitish-g-74a5b139/',
    yearsExperience: 6,
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Ex-banker with 6 years at major financial institutions. Co-founder of IndiBrick and a licensed mortgage agent focused on institutional-quality file preparation.',
    handles: {
      handles: 'purchase + renewal files, business development',
      withinSLA: '2 business hours',
    },
  },
};

// Default rotation for pages that don't specify a broker: the founder-led
// side of the team surfaces first, then the senior broker. Kept as an
// ordered array so a caller can do TEAM_ORDER[0] to always get the primary.
export const TEAM_ORDER: (keyof typeof TEAM)[] = ['mudit', 'vikas', 'nitish'];

// Broker → landing page assignment. Each page picks who "personally
// reviews every file" for that magnet. Tuned so the broker's actual
// specialty matches the intent of the page.
export const PAGE_BROKER: Record<string, keyof typeof TEAM> = {
  '/renewal-rescue': 'vikas',                       // 22yr veteran = renewal shopping
  '/six-minute-approval': 'nitish',                 // Ex-banker = fast institutional pre-approval
  '/refi-payout-plan': 'vikas',                     // Debt consolidation → senior broker
  '/situations/declined-by-bank': 'vikas',          // Bank decline rescues = senior broker
  '/situations/mortgage-renewal': 'vikas',
  '/situations/refinance-debt-consolidation': 'vikas',
  '/situations/pre-construction-closing': 'nitish', // Institutional knowledge for closing files
  '/situations/investment-property': 'mudit',       // Partner + realtor referral network
  '/situations/reverse-mortgage': 'vikas',          // 55+ audience wants the veteran
  '/situations/first-time-buyer': 'nitish',         // FTHB program stacking
  '/situations/new-to-canada': 'mudit',             // Multilingual (Hindi + Punjabi)
};
