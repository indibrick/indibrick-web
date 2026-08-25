// Attribution capture for inbound leads.
//
// Every referral doc can carry an `attribution` sub-object recording
// which channel + campaign + creative brought the lead in. Sources:
//   - UTM params on the URL of the landing page they submitted from
//   - Referrer header at form submit time
//   - Explicit tags from paid ad connectors (later)
//
// Stored as a bag rather than top-level fields so we don't pollute
// the referral schema — this is diagnostic data, not first-class
// pipeline state. The Managed Ads report reads it directly.

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export type UtmKey = typeof UTM_KEYS[number];

// One point-in-time touch — recorded every time we detect a new
// campaign / source / landing page for the same visitor.
export interface AttributionTouch {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
  at: string;              // ISO timestamp
}

export interface AttributionData {
  // Last-touch (what brought them in this session — the click that
  // led to the form submit). Same shape as before for backward compat.
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
  landedAt?: string;
  capturedAt?: string;

  // Multi-touch enrichment (Wave E-5).
  firstTouch?: AttributionTouch;
  lastTouch?: AttributionTouch;
  touchCount?: number;
  // Compressed journey — max 10 touches, oldest first. Storing more
  // than this on a Firestore doc is overkill; long-tail journeys can
  // migrate to a subcollection later if we care.
  journey?: AttributionTouch[];
}

// Extract + sanitize UTM params from a client-provided object. Strings
// only, truncated defensively so an adversary can't stuff megabytes.
const MAX_LEN = 200;

export function projectAttribution(raw: Record<string, any>): AttributionData {
  const out: AttributionData = {};
  if (!raw) return out;
  const clean = (k: string): string | undefined => {
    const v = raw[k];
    if (typeof v !== 'string') return undefined;
    const trimmed = v.trim().slice(0, MAX_LEN);
    return trimmed.length > 0 ? trimmed : undefined;
  };
  const source = clean('utm_source');
  const medium = clean('utm_medium');
  const campaign = clean('utm_campaign');
  const content = clean('utm_content');
  const term = clean('utm_term');
  if (source)   out.source   = source;
  if (medium)   out.medium   = medium;
  if (campaign) out.campaign = campaign;
  if (content)  out.content  = content;
  if (term)     out.term     = term;
  const referrer = clean('referrer');
  const landingPage = clean('landing_page') || clean('landingPage');
  const landedAt = clean('landed_at') || clean('landedAt');
  if (referrer)   out.referrer   = referrer;
  if (landingPage) out.landingPage = landingPage;
  if (landedAt)   out.landedAt   = landedAt;

  // Multi-touch enrichment. Client may pass a `touches` array — we
  // sanitize + cap it.
  const rawTouches: any[] = Array.isArray(raw.touches) ? raw.touches : [];
  if (rawTouches.length > 0) {
    const journey: AttributionTouch[] = rawTouches.slice(-10).map(t => {
      const touch: AttributionTouch = { at: String(t?.at || new Date().toISOString()).slice(0, 40) };
      const sub = (k: string) => {
        const v = t?.[k];
        if (typeof v !== 'string') return;
        const s = v.trim().slice(0, MAX_LEN);
        if (s) (touch as any)[k] = s;
      };
      sub('source'); sub('medium'); sub('campaign'); sub('content'); sub('term');
      sub('referrer'); sub('landingPage');
      return touch;
    });
    if (journey.length > 0) {
      out.journey = journey;
      out.firstTouch = journey[0];
      out.lastTouch = journey[journey.length - 1];
      out.touchCount = journey.length;
    }
  }
  return out;
}

// True if any attribution field is populated. Skips writing an empty
// attribution bag on referrals with no capture data (direct traffic).
export function hasAttribution(a: AttributionData | undefined | null): boolean {
  if (!a) return false;
  return Object.values(a).some(v => typeof v === 'string' && v.length > 0);
}
