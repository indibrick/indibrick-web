// Dimensions for the pSEO matrix: /real-estate/[city]/[type]/[priceRange]
// 40 cities × 4 types × 5 price bands = 800 unique landing pages.

export interface PropertyTypeDef {
  slug: string;
  label: string;          // "Condo"
  plural: string;         // "Condos"
  ownership: 'freehold' | 'condo' | 'mixed';
  blurb: string;          // 1-2 sentence positioning used in page copy
  typicalSize: string;    // e.g. "500–900 sqft"
  typicalBeds: string;    // e.g. "1–3 bedrooms"
}

export const PROPERTY_TYPES: PropertyTypeDef[] = [
  {
    slug: 'condo',
    label: 'Condo',
    plural: 'Condos',
    ownership: 'condo',
    blurb: 'Low-maintenance vertical living with amenity-rich buildings and walkable transit-friendly addresses. Ideal for first-time buyers, investors, and downsizers.',
    typicalSize: '500–1,100 sqft',
    typicalBeds: '1–3 bedrooms',
  },
  {
    slug: 'townhouse',
    label: 'Townhouse',
    plural: 'Townhouses',
    ownership: 'mixed',
    blurb: 'Freehold and condo townhouses bridge the gap between condo affordability and detached privacy. Strong investor product with minimal exterior maintenance.',
    typicalSize: '1,200–2,000 sqft',
    typicalBeds: '2–4 bedrooms',
  },
  {
    slug: 'detached',
    label: 'Detached',
    plural: 'Detached Homes',
    ownership: 'freehold',
    blurb: 'Fully freehold land + structure. Highest long-term appreciation, full renovation flexibility, and the strongest move-up buyer demand in the Ontario market.',
    typicalSize: '1,800–3,500 sqft',
    typicalBeds: '3–5 bedrooms',
  },
  {
    slug: 'semi-detached',
    label: 'Semi-Detached',
    plural: 'Semi-Detached Homes',
    ownership: 'freehold',
    blurb: 'Freehold ownership at a meaningful discount to fully-detached. Common in mature transit-served corridors and a perennial first-time-buyer favourite.',
    typicalSize: '1,400–2,400 sqft',
    typicalBeds: '3–4 bedrooms',
  },
];

export interface PriceRangeDef {
  slug: string;
  label: string;       // "Under $500K"
  short: string;       // "<$500K" for badges
  min: number;
  max: number;        // Infinity-safe; use Number.MAX_SAFE_INTEGER for "over"
  position: 'entry' | 'first-move-up' | 'mid' | 'upper' | 'luxury';
}

export const PRICE_RANGES: PriceRangeDef[] = [
  { slug: 'under-500k', label: 'Under $500K', short: '<$500K', min: 0,        max: 500_000,    position: 'entry' },
  { slug: '500-750k',   label: '$500K – $750K', short: '$500K–$750K', min: 500_000,  max: 750_000,    position: 'first-move-up' },
  { slug: '750k-1m',    label: '$750K – $1M',   short: '$750K–$1M',   min: 750_000,  max: 1_000_000,  position: 'mid' },
  { slug: '1-1.5m',     label: '$1M – $1.5M',   short: '$1M–$1.5M',   min: 1_000_000, max: 1_500_000, position: 'upper' },
  { slug: 'over-1.5m',  label: 'Over $1.5M',    short: '>$1.5M',      min: 1_500_000, max: Number.MAX_SAFE_INTEGER, position: 'luxury' },
];

/** O(1) lookups for route handlers. */
export function getTypeBySlug(slug: string): PropertyTypeDef | null {
  return PROPERTY_TYPES.find((t) => t.slug === slug) || null;
}
export function getPriceRangeBySlug(slug: string): PriceRangeDef | null {
  return PRICE_RANGES.find((p) => p.slug === slug) || null;
}
