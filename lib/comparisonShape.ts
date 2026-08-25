// Shared shape + rendering primitives for competitor comparison
// pages (vs-gohighlevel, vs-follow-up-boss, etc.). Each page passes
// its comparison data through the same template so we get uniform
// SEO structure, JSON-LD, and CTA behavior.

export interface ComparisonRow {
  feature: string;
  us: string | true;
  them: string | false;
}

export interface ComparisonSpec {
  slug: string;             // e.g. "vs-gohighlevel"
  competitor: string;       // "GoHighLevel"
  competitorTagline: string;// short one-liner about them
  ourAngle: string;         // why we win in a sentence
  ourPriceStart: string;    // "$0"
  theirPriceStart: string;  // "$97"
  positioning: string;      // 2-3 sentence intro
  rows: ComparisonRow[];
  faq: Array<{ q: string; a: string }>;
}
