// Google Ads conversion tracking helpers.
//
// The site uses gtag.js (installed in app/layout.tsx as AW-17924066227),
// not GTM. These helpers wrap gtag('event', 'conversion', ...) with:
//   1. Enhanced Conversions for Leads — hashed PII (email, phone, name)
//      pushed via gtag('set', 'user_data', ...) BEFORE the conversion
//      event so Google can reconcile clicks lost to iOS ATT / cookie decay.
//   2. Consistent event schema — one function per action (lead_submit,
//      phone_tap, booking_click) so every landing page fires the same
//      shape and Google Ads gets clean signal.
//
// CRITICAL: Enhanced Conversions requires user_data to be `set()` before
// the conversion event fires. Splitting the two calls or reordering them
// silently drops the hashed data — Google Ads still counts the conversion
// but Enhanced Conversions match rate falls to 0% and PMax will drift.
// This is the specific failure mode that broke the account in June.

// ---- Conversion action send_to IDs ------------------------------------
// Fill these in from Google Ads (Tools → Conversions → click each action →
// "Tag setup" → "Use Google tag" → copy the "send_to" value that looks
// like AW-17924066227/AbC-D1234EfGH).
//
// TODO(founder): replace the six placeholder labels below with the real
// send_to values from Google Ads. Until these are set, conversion events
// fire but Google Ads won't attribute them to the right action.
export const CONVERSIONS = {
  LEAD_SUBMIT:      'AW-17924066227/PLACEHOLDER_LEAD_SUBMIT',
  PHONE_TAP:        'AW-17924066227/PLACEHOLDER_PHONE_TAP',
  BOOKING_CLICK:    'AW-17924066227/PLACEHOLDER_BOOKING_CLICK',
  SOFT_ENGAGEMENT:  'AW-17924066227/PLACEHOLDER_SOFT_ENGAGEMENT',
  // Offline conversion action IDs — used by the Cloud Function that
  // uploads Qualified + Funded events. Kept here so all conversion IDs
  // live in one place; the browser never fires these directly.
  QUALIFIED_OFFLINE: 'AW-17924066227/PLACEHOLDER_QUALIFIED_OFFLINE',
  FUNDED_OFFLINE:    'AW-17924066227/PLACEHOLDER_FUNDED_OFFLINE',
} as const;

// ---- Hashing helpers --------------------------------------------------

async function sha256(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const buf = new TextEncoder().encode(normalized);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Google Ads expects E.164 phone format for Enhanced Conversions matching.
// Ontario numbers → +1XXXXXXXXXX. Strip everything non-digit, then pad.
function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// ---- gtag safety wrapper ----------------------------------------------

// gtag is loaded async in layout.tsx. On rare page-first-paint conversions
// this can fire before the script is ready; the || [] fallback queues the
// call and gtag processes the queue on load. Standard pattern.
function gtag(...args: any[]) {
  if (typeof window === 'undefined') return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(arguments);
}

// ---- Primary conversion — form submit ---------------------------------

interface LeadSubmitPayload {
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  leadId?: string;              // Firestore doc id — for debugging + dedup
  source: string;               // e.g. 'situations/declined-by-bank'
  pageSource: string;           // window.location.pathname
  value?: number;               // conversion value in CAD — defaults to $75
}

export async function trackLeadSubmit(payload: LeadSubmitPayload): Promise<void> {
  if (typeof window === 'undefined') return;

  const nameParts = (payload.firstName || '').trim().split(/\s+/);
  const derivedFirst = payload.firstName?.trim() || nameParts[0] || '';
  const derivedLast  = payload.lastName?.trim()  || nameParts.slice(1).join(' ') || '';

  // Hash all PII fields in parallel. All done client-side so no PII ever
  // leaves the user's browser in raw form to our server logs.
  const [emailHash, phoneHash, firstHash, lastHash] = await Promise.all([
    payload.email     ? sha256(payload.email)                       : Promise.resolve(''),
    payload.phone     ? sha256(normalizePhoneE164(payload.phone))   : Promise.resolve(''),
    derivedFirst      ? sha256(derivedFirst)                        : Promise.resolve(''),
    derivedLast       ? sha256(derivedLast)                         : Promise.resolve(''),
  ]);

  // STEP 1 — set user_data BEFORE the event fires. Order matters.
  // Google Ads matches these hashes to signed-in accounts to reclaim
  // conversions lost to cookie/ATT restrictions.
  gtag('set', 'user_data', {
    sha256_email_address: emailHash,
    sha256_phone_number:  phoneHash,
    address: {
      sha256_first_name: firstHash,
      sha256_last_name:  lastHash,
    },
  });

  // STEP 2 — fire the conversion. transaction_id enables dedup if the
  // user double-submits or refreshes the thank-you page.
  gtag('event', 'conversion', {
    send_to: CONVERSIONS.LEAD_SUBMIT,
    value: payload.value ?? 75,
    currency: 'CAD',
    transaction_id: payload.leadId || `${payload.source}-${Date.now()}`,
  });

  // Also fire a GA4-style custom event so downstream analytics (GA4,
  // Meta, LinkedIn Insight, etc.) can subscribe to the same signal via
  // the shared dataLayer without duplicating the tracking call site.
  (window as any).dataLayer.push({
    event: 'lead_submit',
    source: payload.source,
    page_source: payload.pageSource,
    lead_id: payload.leadId,
    timestamp: new Date().toISOString(),
  });

  // Meta Pixel Lead event — the pixel is already installed in layout.tsx.
  const fbq = (window as any).fbq;
  if (typeof fbq === 'function') {
    fbq('track', 'Lead', {
      content_category: payload.source,
      value: payload.value ?? 75,
      currency: 'CAD',
    });
  }

  // Reddit Pixel Lead event with advanced matching. The base pixel init in
  // layout.tsx fires PageVisit anonymously; we re-init here with the user's
  // hashed email + phone for match-key linkage BEFORE firing the Lead event.
  // Reddit's docs recommend this pattern — re-init at the moment of
  // conversion so PII travels with the tracked event, not with every
  // pageview.
  const rdt = (window as any).rdt;
  if (typeof rdt === 'function') {
    rdt('init', 'a2_jct2yhtnylge', {
      email: payload.email || undefined,
      phoneNumber: payload.phone ? normalizePhoneE164(payload.phone) : undefined,
      externalId: payload.leadId || undefined,
    });
    rdt('track', 'Lead', {
      value: payload.value ?? 75,
      currency: 'CAD',
      conversionId: payload.leadId || undefined, // Reddit dedup key
    });
  }
}

// ---- Secondary conversions — signal only ------------------------------

export function trackPhoneTap(pageSource: string): void {
  if (typeof window === 'undefined') return;
  gtag('event', 'conversion', {
    send_to: CONVERSIONS.PHONE_TAP,
    value: 25,
    currency: 'CAD',
  });
  (window as any).dataLayer.push({
    event: 'phone_tap',
    page_source: pageSource,
    timestamp: new Date().toISOString(),
  });
}

export function trackBookingClick(pageSource: string): void {
  if (typeof window === 'undefined') return;
  gtag('event', 'conversion', {
    send_to: CONVERSIONS.BOOKING_CLICK,
    value: 40,
    currency: 'CAD',
  });
  (window as any).dataLayer.push({
    event: 'booking_click',
    page_source: pageSource,
    timestamp: new Date().toISOString(),
  });
}

export function trackSoftEngagement(kind: 'scroll_75' | 'pdf_download', pageSource: string): void {
  if (typeof window === 'undefined') return;
  gtag('event', 'conversion', {
    send_to: CONVERSIONS.SOFT_ENGAGEMENT,
    value: 0,
    currency: 'CAD',
  });
  (window as any).dataLayer.push({
    event: 'soft_engagement',
    engagement_kind: kind,
    page_source: pageSource,
    timestamp: new Date().toISOString(),
  });
}
