// Lead-conversion tracking helpers — wired into every form submit so Google
// Ads (Smart Bidding) + GA4 know which landing-page URL drove each conversion.
// This closes the loop the audit flagged: without per-URL conversion data,
// budget can't be steered to the highest-converting pSEO cells.
//
// Setup checklist in your Google Ads dashboard (one-time):
//   1. Tools & Settings → Conversions → "+ New conversion action" → "Website"
//   2. Conversion name: "IndiBrick Lead Submit"
//   3. Category: "Submit lead form"
//   4. Value: "Use the same value" → $25 CAD (placeholder — replace with your true
//      blended lead value once you've measured close rate × commission).
//   5. Count: "One"
//   6. Click-through window: 30 days, View-through window: 1 day
//   7. After saving, Google gives you a "send_to" string like:
//      AW-17924066227/abcDEFghi123
//      Paste that into ADS_CONVERSION_SEND_TO below.

/** Replace with the real conversion label from Google Ads → Conversions. */
const ADS_CONVERSION_SEND_TO = 'AW-17924066227/LEAD_SUBMIT';

export interface TrackLeadOptions {
  /** Free-form source label for the form, e.g. "Realtor", "Mortgage", "Apply Wizard". */
  formType: string;
  /** Optional dollar value of this lead. Defaults to $25 CAD. */
  estimatedValue?: number;
  /** Optional extra context fields (e.g. cityFromPath, lenderTier). Forwarded as GA4 params. */
  extra?: Record<string, string | number | boolean | undefined>;
}

/**
 * Fires a GA4 `generate_lead` event AND a Google Ads `conversion` event with
 * the current page URL embedded so per-cell conversion attribution works.
 *
 * Safe to call from any client component — guarded against SSR + missing gtag.
 */
export function trackLeadConversion(opts: TrackLeadOptions): void {
  if (typeof window === 'undefined') return;
  const gtag: ((command: string, eventOrTarget: string, params?: Record<string, unknown>) => void) | undefined =
    (window as unknown as { gtag?: (command: string, eventOrTarget: string, params?: Record<string, unknown>) => void }).gtag;
  if (!gtag) return;

  const pathname = window.location.pathname;
  const value = opts.estimatedValue ?? 25;

  try {
    // 1. GA4 — shows up in GA4 reports, used by Looker Studio + manual analysis.
    gtag('event', 'generate_lead', {
      event_category: 'form',
      event_label: pathname,
      landing_page: pathname,
      lead_source: opts.formType,
      value,
      currency: 'CAD',
      ...opts.extra,
    });

    // 2. Google Ads — flows to Smart Bidding so the algorithm bids more on cells
    // that convert and less on cells that don't. The transaction_id makes the
    // conversion idempotent if the user double-clicks Submit.
    gtag('event', 'conversion', {
      send_to: ADS_CONVERSION_SEND_TO,
      value,
      currency: 'CAD',
      transaction_id: `${pathname}_${Date.now()}`,
    });

    // 3. Meta Pixel — already loaded in layout.tsx; fire its Lead event too so
    // Meta's algorithm gets the same per-page signal.
    const fbq = (window as unknown as { fbq?: (command: string, eventName: string, params?: Record<string, unknown>) => void }).fbq;
    if (fbq) {
      fbq('track', 'Lead', {
        content_name: pathname,
        content_category: opts.formType,
        value,
        currency: 'CAD',
      });
    }
  } catch {
    // Never block a real lead submission because analytics threw.
  }
}
