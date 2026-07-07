// Shared types for the enrichment pipeline. Mirror of what the site's
// NeighborhoodExtras uses, kept local so the pipeline can run without
// importing from the Next.js app.

export interface EnrichedExtras {
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
  transitStations?: { name: string; lines?: string[] }[];
  notableSchools?: {
    name: string;
    band?: string;
    fraserBand?:
      | 'Well above provincial average'
      | 'Above provincial average'
      | 'At provincial average'
      | 'Below provincial average';
  }[];
  notableSpots?: { name: string; kind: 'restaurant' | 'cafe' | 'park' | 'landmark' | 'shop' }[];
  architecturalEra?: string;
  historyBlurb?: string;
  medianAge?: number;
  buyerProfile?: string;
}

export interface ResearchBundle {
  key: string; // "city|neighborhood-slug"
  neighborhood: string;
  city: string;
  cityName: string;
  wikipedia: {
    title: string;
    extract: string;
    url: string;
  } | null;
  osm: {
    bbox: [number, number, number, number] | null; // [south, west, north, east]
    lat: number | null;
    lon: number | null;
    transit: string[];
    parks: string[];
    cafes: string[];
    restaurants: string[];
    landmarks: string[];
  };
  walkScore: {
    walk: number | null;
    transit: number | null;
    bike: number | null;
    sourceUrl: string;
  };
}

export interface EnrichmentResult {
  key: string;
  update: Partial<EnrichedExtras>;
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
}
