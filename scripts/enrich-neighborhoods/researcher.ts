// Per-neighborhood research: hits four free external sources and packages
// what it finds into a ResearchBundle. Downstream, the LLM structuring
// step is instructed to ONLY use fields from this bundle — no training
// data, no memory. That's the whole anti-hallucination discipline.

import { CONFIG } from './config';
import type { ResearchBundle } from './types';

// ─── HTTP helper with timeout + retry ───

async function fetchWithRetry(url: string, init?: RequestInit, attempt = 1): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.httpTimeoutMs);
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'User-Agent': CONFIG.userAgent, ...(init?.headers || {}) },
    });
    clearTimeout(timer);
    if (res.ok || res.status === 404) return res;
    // 5xx / 429 → retry
    if (attempt < CONFIG.maxRetries) {
      await sleep(CONFIG.retryBaseMs * attempt);
      return fetchWithRetry(url, init, attempt + 1);
    }
    return res;
  } catch (e: any) {
    if (attempt < CONFIG.maxRetries) {
      await sleep(CONFIG.retryBaseMs * attempt);
      return fetchWithRetry(url, init, attempt + 1);
    }
    console.warn(`  [http] failed ${url}: ${e.message}`);
    return null;
  }
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Wikipedia REST API ───

async function fetchWikipedia(neighborhood: string, cityName: string): Promise<ResearchBundle['wikipedia']> {
  // Try several title variants — Wikipedia is inconsistent about neighborhood
  // article naming.
  const variants = [
    `${neighborhood}, ${cityName}`,
    `${neighborhood} (neighbourhood)`,
    `${neighborhood} (${cityName})`,
    `${neighborhood}, Toronto`, // Etobicoke/Scarborough/etc. → Toronto in Wikipedia
    `${neighborhood}, Ottawa`,
    neighborhood,
  ];

  for (const title of variants) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetchWithRetry(url);
    if (!res || !res.ok) continue;
    const data: any = await res.json().catch(() => null);
    if (!data || data.type === 'disambiguation') continue;
    const extract: string = data.extract || '';
    // Sanity check: does the article actually mention the city? Filters
    // false-positive hits (e.g. a "The Annex" article that's not the Toronto one).
    if (!extract.toLowerCase().includes(cityName.toLowerCase().split(' ')[0]) &&
        !extract.toLowerCase().includes('ontario')) {
      continue;
    }
    return {
      title: data.title,
      extract,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  }
  return null;
}

// ─── Nominatim geocoding ───

async function geocode(neighborhood: string, cityName: string): Promise<{ lat: number; lon: number; bbox: [number, number, number, number] } | null> {
  const q = `${neighborhood}, ${cityName}, Ontario, Canada`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`;
  const res = await fetchWithRetry(url);
  if (!res || !res.ok) return null;
  const data: any[] = await res.json().catch(() => []);
  if (!data.length) return null;
  const hit = data[0];
  const lat = parseFloat(hit.lat);
  const lon = parseFloat(hit.lon);
  const bbox = hit.boundingbox
    ? ([parseFloat(hit.boundingbox[0]), parseFloat(hit.boundingbox[2]), parseFloat(hit.boundingbox[1]), parseFloat(hit.boundingbox[3])] as [number, number, number, number])
    : ([lat - 0.005, lon - 0.008, lat + 0.005, lon + 0.008] as [number, number, number, number]);
  return { lat, lon, bbox };
}

// ─── OpenStreetMap Overpass ───

// Query Overpass for transit stops + amenities within the bbox. One
// consolidated call so we hit Overpass exactly once per neighborhood.
async function fetchOSM(bbox: [number, number, number, number]): Promise<Omit<ResearchBundle['osm'], 'bbox' | 'lat' | 'lon'>> {
  const [south, west, north, east] = bbox;
  const q = `[out:json][timeout:25];
(
  node[railway=station](${south},${west},${north},${east});
  node[railway=halt](${south},${west},${north},${east});
  node[public_transport=station](${south},${west},${north},${east});
  node[highway=bus_stop][name](${south},${west},${north},${east});
  node[leisure=park][name](${south},${west},${north},${east});
  way[leisure=park][name](${south},${west},${north},${east});
  node[amenity=cafe][name](${south},${west},${north},${east});
  node[amenity=restaurant][name](${south},${west},${north},${east});
  node[tourism=attraction][name](${south},${west},${north},${east});
  node[historic][name](${south},${west},${north},${east});
);
out center tags;`;
  const url = 'https://overpass-api.de/api/interpreter';
  const res = await fetchWithRetry(url, { method: 'POST', body: q });
  const emptyResult = { transit: [], parks: [], cafes: [], restaurants: [], landmarks: [] };
  if (!res || !res.ok) return emptyResult;
  const data: any = await res.json().catch(() => null);
  if (!data?.elements) return emptyResult;

  const transit = new Set<string>();
  const parks = new Set<string>();
  const cafes = new Set<string>();
  const restaurants = new Set<string>();
  const landmarks = new Set<string>();

  for (const el of data.elements) {
    const tags = el.tags || {};
    const name = tags.name;
    if (!name) continue;
    if (tags.railway === 'station' || tags.railway === 'halt' || tags.public_transport === 'station' || tags.highway === 'bus_stop') {
      transit.add(name);
    } else if (tags.leisure === 'park') {
      parks.add(name);
    } else if (tags.amenity === 'cafe') {
      cafes.add(name);
    } else if (tags.amenity === 'restaurant') {
      restaurants.add(name);
    } else if (tags.tourism === 'attraction' || tags.historic) {
      landmarks.add(name);
    }
  }

  return {
    transit: [...transit].slice(0, CONFIG.maxTransitStations * 2),
    parks: [...parks].slice(0, CONFIG.maxNotableSpots),
    cafes: [...cafes].slice(0, CONFIG.maxNotableSpots),
    restaurants: [...restaurants].slice(0, CONFIG.maxNotableSpots),
    landmarks: [...landmarks].slice(0, CONFIG.maxNotableSpots),
  };
}

// ─── Walk Score public HTML ───

// Scrape https://www.walkscore.com/score/{address}. The page embeds the
// score into meta tags + a specific div. Best-effort — return nulls if we
// can't confidently extract.
async function fetchWalkScore(neighborhood: string, cityName: string): Promise<ResearchBundle['walkScore']> {
  // Walk Score URL pattern: "score/{address-slug}"
  const slug = `${neighborhood}-${cityName}-on`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const url = `https://www.walkscore.com/score/${slug}`;
  const res = await fetchWithRetry(url);
  const empty = { walk: null, transit: null, bike: null, sourceUrl: url };
  if (!res || !res.ok) return empty;
  const html = await res.text().catch(() => '');
  // Match the three scores. Walk Score renders them inline with class hooks.
  const walk = matchScore(html, /Walk Score[^<>]*[:>\s]?(\d{1,3})/i);
  const transit = matchScore(html, /Transit Score[^<>]*[:>\s]?(\d{1,3})/i);
  const bike = matchScore(html, /Bike Score[^<>]*[:>\s]?(\d{1,3})/i);
  return { walk, transit, bike, sourceUrl: url };
}

function matchScore(html: string, re: RegExp): number | null {
  const m = html.match(re);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n;
}

// ─── Main entry ───

export async function research(neighborhood: string, city: string, cityName: string): Promise<ResearchBundle> {
  const key = `${city}|${slugify(neighborhood)}`;

  // Sequenced with waits so we respect each service's rate limit.
  await sleep(CONFIG.wikipediaIntervalMs);
  const wikipedia = await fetchWikipedia(neighborhood, cityName);

  await sleep(CONFIG.nominatimIntervalMs);
  const geo = await geocode(neighborhood, cityName);

  let osm: ResearchBundle['osm'] = {
    bbox: geo?.bbox || null,
    lat: geo?.lat || null,
    lon: geo?.lon || null,
    transit: [],
    parks: [],
    cafes: [],
    restaurants: [],
    landmarks: [],
  };
  if (geo) {
    await sleep(CONFIG.overpassIntervalMs);
    const overpass = await fetchOSM(geo.bbox);
    osm = { ...osm, ...overpass };
  }

  await sleep(CONFIG.walkscoreIntervalMs);
  const walkScore = await fetchWalkScore(neighborhood, cityName);

  return { key, neighborhood, city, cityName, wikipedia, osm, walkScore };
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
