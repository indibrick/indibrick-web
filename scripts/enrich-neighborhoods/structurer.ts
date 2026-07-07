// Turns a ResearchBundle into a Partial<EnrichedExtras> using Claude.
// The prompt aggressively suppresses hallucination: Claude is instructed
// to ONLY use fields grounded in the research bundle we hand it. If the
// research doesn't cover a field, we tell it to leave the field out.

import Anthropic from '@anthropic-ai/sdk';
import { CONFIG } from './config';
import type { ResearchBundle, EnrichmentResult, EnrichedExtras } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM = `You are a research-grounded metadata extractor for real estate neighborhood profiles in Ontario, Canada.

Your one rule: ONLY include facts that are DIRECTLY supported by the research provided to you.
Do NOT fill in facts from your training data. If the research doesn't cover a field, LEAVE IT OUT entirely.

Return valid JSON in exactly this shape (all fields optional — omit any you can't ground in the research):

{
  "walkScore": <number 0-100, only if provided in walk_score research>,
  "transitScore": <number 0-100, only if provided in walk_score research>,
  "bikeScore": <number 0-100, only if provided in walk_score research>,
  "transitStations": [
    { "name": "<exact station name from OSM transit list>", "lines": ["<transit line if known from name>"] }
  ],
  "notableSpots": [
    { "name": "<exact name from OSM parks/cafes/restaurants/landmarks list OR Wikipedia mentions>", "kind": "park|restaurant|cafe|landmark|shop" }
  ],
  "architecturalEra": "<one-sentence phrase, ONLY if Wikipedia extract discusses the neighborhood's development period>",
  "historyBlurb": "<2-3 sentence factual paragraph, ONLY from Wikipedia extract; paraphrase; do NOT invent detail>",
  "buyerProfile": "<one-sentence characterization of who buys/lives there, ONLY if Wikipedia or research clearly supports the claim>"
}

Also return two extra fields for the caller:
- "confidence": "high" if Wikipedia AND OSM both returned useful data; "medium" if one returned useful data; "low" if neither did
- "notes": short strings explaining any judgment calls

Rules:
1. Include no more than 5 transit stations, 6 notable spots, 3 schools.
2. Names must appear VERBATIM in the research — no paraphrasing landmark names.
3. If the Wikipedia extract is generic ("A neighbourhood in Ontario") without specifics, leave architecturalEra and historyBlurb OUT.
4. If OSM returned zero transit/parks/cafes/restaurants/landmarks, do NOT invent any — leave notableSpots and transitStations OUT.
5. Never quote Walk Score numbers that weren't in the walk_score field of the research.
6. Better to return {} + confidence:"low" than to guess.
7. Output ONLY the JSON object. No prose, no markdown fences.`;

export async function structure(bundle: ResearchBundle): Promise<EnrichmentResult> {
  const userPayload = {
    neighborhood: bundle.neighborhood,
    city: bundle.cityName,
    wikipedia_extract: bundle.wikipedia?.extract || null,
    wikipedia_url: bundle.wikipedia?.url || null,
    walk_score: bundle.walkScore,
    osm_transit_stations: bundle.osm.transit,
    osm_parks: bundle.osm.parks,
    osm_cafes: bundle.osm.cafes,
    osm_restaurants: bundle.osm.restaurants,
    osm_landmarks: bundle.osm.landmarks,
  };

  const sources: string[] = [];
  if (bundle.wikipedia) sources.push(bundle.wikipedia.url);
  if (bundle.osm.transit.length || bundle.osm.parks.length || bundle.osm.landmarks.length) {
    sources.push('OpenStreetMap');
  }
  if (bundle.walkScore.walk !== null || bundle.walkScore.transit !== null || bundle.walkScore.bike !== null) {
    sources.push(bundle.walkScore.sourceUrl);
  }

  // If we got NOTHING, don't burn a Claude call. Return an empty result.
  if (sources.length === 0) {
    return {
      key: bundle.key,
      update: {},
      sources: [],
      confidence: 'low',
      notes: ['No external data — Wikipedia missing, Nominatim geocode failed, walkscore.com no page.'],
    };
  }

  try {
    const msg = await client.messages.create({
      model: CONFIG.model,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(userPayload, null, 2) }],
    });
    const text = msg.content
      .filter((b) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');
    const parsed = extractJson(text);
    const confidence = (parsed?.confidence as 'high' | 'medium' | 'low') || 'medium';
    const notes = Array.isArray(parsed?.notes) ? parsed.notes : [];
    delete parsed?.confidence;
    delete parsed?.notes;
    const cleaned = cleanUpdate(parsed as Partial<EnrichedExtras>);
    return { key: bundle.key, update: cleaned, sources, confidence, notes };
  } catch (e: any) {
    console.warn(`  [claude] ${bundle.key} failed: ${e.message}`);
    return { key: bundle.key, update: {}, sources, confidence: 'low', notes: [`Claude call failed: ${e.message}`] };
  }
}

function extractJson(text: string): any {
  // Claude usually returns clean JSON. Strip code fences just in case.
  const clean = text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Try to find the first {...} block.
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {}
    }
    return null;
  }
}

// Enforce max array lengths + drop empty structures so the resulting entry
// promotes to flagship tier ONLY when we have real content.
function cleanUpdate(u: Partial<EnrichedExtras>): Partial<EnrichedExtras> {
  const out: Partial<EnrichedExtras> = {};
  if (typeof u.walkScore === 'number' && u.walkScore >= 0 && u.walkScore <= 100) out.walkScore = u.walkScore;
  if (typeof u.transitScore === 'number' && u.transitScore >= 0 && u.transitScore <= 100) out.transitScore = u.transitScore;
  if (typeof u.bikeScore === 'number' && u.bikeScore >= 0 && u.bikeScore <= 100) out.bikeScore = u.bikeScore;
  if (Array.isArray(u.transitStations) && u.transitStations.length) {
    out.transitStations = u.transitStations
      .filter((t) => t?.name && typeof t.name === 'string')
      .slice(0, CONFIG.maxTransitStations)
      .map((t) => ({ name: t.name, ...(t.lines?.length ? { lines: t.lines } : {}) }));
    if (!out.transitStations.length) delete out.transitStations;
  }
  if (Array.isArray(u.notableSpots) && u.notableSpots.length) {
    const validKinds = new Set(['restaurant', 'cafe', 'park', 'landmark', 'shop']);
    out.notableSpots = u.notableSpots
      .filter((s: any) => s?.name && validKinds.has(s?.kind))
      .slice(0, CONFIG.maxNotableSpots);
    if (!out.notableSpots.length) delete out.notableSpots;
  }
  if (typeof u.architecturalEra === 'string' && u.architecturalEra.trim().length > 20) {
    out.architecturalEra = u.architecturalEra.trim();
  }
  if (typeof u.historyBlurb === 'string' && u.historyBlurb.trim().length > 40) {
    out.historyBlurb = u.historyBlurb.trim();
  }
  if (typeof u.buyerProfile === 'string' && u.buyerProfile.trim().length > 20) {
    out.buyerProfile = u.buyerProfile.trim();
  }
  return out;
}
