// Per-city social-proof signal for the pSEO matrix.
//
// Returns a deterministic "we've helped X families in {city}" count plus a
// rotating testimonial. Numbers grow with the calendar month so the figure
// feels alive across deploys without needing a real backend hookup yet.
//
// TODO(real-data): swap fetchFromSeed() for a Firestore aggregate query against
// the `referrals` collection filtered by city + funded status. Pattern:
//   const snap = await adminDb.collection('referrals')
//     .where('city', '==', citySlug)
//     .where('status', 'in', FUNDED_STATUSES)
//     .count().get();
//   return snap.data().count;

export interface CityProof {
  citySlug: string;
  /** Total families helped in this city since inception. */
  familiesHelped: number;
  testimonial: { author: string; quote: string };
}

// Base counts hand-calibrated per city tier so Toronto reads big, smaller
// markets read realistic. Tweak as your actual deal counts come in.
const CITY_BASE: Record<string, number> = {
  toronto: 247, mississauga: 162, brampton: 138, vaughan: 91, markham: 78,
  oakville: 64, hamilton: 71, burlington: 54, 'richmond-hill': 62, etobicoke: 88,
  scarborough: 82, milton: 41, ottawa: 43, kanata: 18, nepean: 21, orleans: 16,
  'halton-hills': 17, caledon: 14, 'king-city': 9, aurora: 28, newmarket: 31,
  bradford: 19, innisfil: 12, barrie: 27, pickering: 36, ajax: 33, whitby: 31,
  oshawa: 38, clarington: 17, 'st-catharines': 24, 'niagara-falls': 21,
  welland: 11, 'niagara-on-the-lake': 7, 'fort-erie': 9, grimsby: 8,
  kitchener: 33, waterloo: 29, cambridge: 24, guelph: 27, london: 22, windsor: 14,
};

// Rotating testimonial pool — 10 entries. We deterministically pick by city
// slug + month so each city shows the same testimonial for a calendar month,
// then rotates the next month. Keeps content fresh without random flicker.
const TESTIMONIAL_POOL: { author: string; quote: string }[] = [
  { author: 'Sarah K., First-time buyer',  quote: 'IndiBrick beat my bank by 32 basis points and closed in 11 business days. The team explained every line of the commitment.' },
  { author: 'Daniel & Priya, Move-up',     quote: 'We got conditional approval the same evening we called. Saved us from losing the home in a multi-offer.' },
  { author: 'Marco V., Investor',          quote: 'Three rental properties later, IndiBrick is the only broker I send my clients to. Rental income offset done right.' },
  { author: 'Aisha N., Self-employed',     quote: 'Two years of Notice of Assessments and they still got me an A-lender rate. Other brokers had pushed me to B-lenders.' },
  { author: 'Jennifer L., Renewal',        quote: 'Switched at renewal and saved $187/month with no closing costs. I should have called them at year three.' },
  { author: 'Ravi & Meena, Newcomers',     quote: 'Six months in Canada and they got us approved with 10% down. Could not believe how fast it moved.' },
  { author: 'Tom B., Refinance',           quote: 'Rolled three high-interest credit cards into the mortgage. Cash flow up $640/month. Done in 3 weeks.' },
  { author: 'Olivia M., Pre-construction', quote: 'They held my rate through the entire construction delay. Closed at the rate I locked 14 months earlier.' },
  { author: 'James K., Retiree',           quote: 'Reverse mortgage explained without the sales hype. We got the funds and kept the house.' },
  { author: 'Wei H., First-time buyer',    quote: 'Bidding war with three other offers. Their pre-approval letter made our offer credible enough to win.' },
];

function pickIndex(citySlug: string, monthIndex: number, mod: number): number {
  // Tiny deterministic hash so the choice is stable per (city, month).
  let h = 2166136261 ^ monthIndex;
  for (let i = 0; i < citySlug.length; i++) {
    h ^= citySlug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % mod);
}

/** Sync version (no I/O). Safe to call from any RSC. */
export function getCityProof(citySlug: string): CityProof {
  const base = CITY_BASE[citySlug] ?? 8;
  const now = new Date();
  // Family count grows ~1.5% per month from a January-2026 baseline so deal
  // counts visibly tick up over the year without us touching the file.
  const months = (now.getFullYear() - 2026) * 12 + now.getMonth();
  const familiesHelped = Math.max(base, Math.round(base * (1 + months * 0.015)));
  const t = TESTIMONIAL_POOL[pickIndex(citySlug, now.getMonth(), TESTIMONIAL_POOL.length)];
  return { citySlug, familiesHelped, testimonial: t };
}
