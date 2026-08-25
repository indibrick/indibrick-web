// Client-side UTM capture helpers.
//
// The visitor's UTMs may be present on the current URL (they just
// clicked the ad) OR they may have arrived earlier via a different
// page (organic, direct) and be cached in sessionStorage from a prior
// visit. Both paths feed the same attribution bag on form submit.

const STORAGE_KEY = 'ib_utm';
const STORAGE_LANDED_AT = 'ib_landed_at';
const STORAGE_JOURNEY = 'ib_touches';
const MAX_JOURNEY = 10;

export interface CapturedAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
  landed_at?: string;
  // Multi-touch: the journey we've observed for this visitor. Wraps
  // as an array capped at 10 entries. First entry = first touch.
  touches?: Array<{
    at: string;
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
    referrer?: string;
    landingPage?: string;
  }>;
}

// Call on every landing page mount. Behavior:
//   - Current URL has UTMs → append as a new touch to the journey.
//     Last-touch fields on the top-level record refresh; first-touch
//     stays whatever it was.
//   - No UTMs → append a lightweight touch (landing + referrer) only
//     if this is the visitor's very first observation.
// Journey persists in localStorage (cross-session for the same
// browser) rather than sessionStorage — a visitor who clicks a Meta
// ad Monday and returns Friday should keep Monday's campaign in the
// journey.
export function captureAttributionFromWindow(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
      .some(k => params.has(k));

    const nowIso = new Date().toISOString();
    const referrer = document.referrer || undefined;
    const landingPage = window.location.href;

    // Read prior stashed record for touch continuity.
    let prev: CapturedAttribution | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) prev = JSON.parse(raw);
    } catch { /* localStorage may be blocked; fall through with prev=null */ }

    const touches = Array.isArray(prev?.touches) ? [...prev!.touches!] : [];

    if (hasUtm) {
      const newTouch = {
        at: nowIso,
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
        content: params.get('utm_content') || undefined,
        term: params.get('utm_term') || undefined,
        referrer,
        landingPage,
      };
      // Dedupe against the LAST touch if it's the same campaign
      // (prevents an infinite journey from repeated navigation).
      const last = touches[touches.length - 1];
      if (!last || last.campaign !== newTouch.campaign || last.source !== newTouch.source) {
        touches.push(newTouch);
        while (touches.length > MAX_JOURNEY) touches.shift();
      }
      const rec: CapturedAttribution = {
        utm_source: newTouch.source,
        utm_medium: newTouch.medium,
        utm_campaign: newTouch.campaign,
        utm_content: newTouch.content,
        utm_term: newTouch.term,
        landing_page: landingPage,
        referrer,
        landed_at: nowIso,
        touches,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
      window.sessionStorage.setItem(STORAGE_LANDED_AT, nowIso);
      return;
    }

    // No UTMs — only record if this is the visitor's first observation.
    if (!prev) {
      const firstTouch = { at: nowIso, referrer, landingPage };
      const rec: CapturedAttribution = {
        landing_page: landingPage,
        referrer,
        landed_at: nowIso,
        touches: [firstTouch],
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
      window.sessionStorage.setItem(STORAGE_LANDED_AT, nowIso);
    }
  } catch { /* privacy-mode / disabled storage — fine to skip */ }
}

export function readStoredAttribution(): CapturedAttribution | null {
  if (typeof window === 'undefined') return null;
  try {
    // localStorage first (multi-session), fall back to legacy sessionStorage.
    const raw = window.localStorage.getItem(STORAGE_KEY)
      || window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as CapturedAttribution;
    return null;
  } catch { return null; }
}
