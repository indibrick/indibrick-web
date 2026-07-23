// GCLID capture + persistence.
//
// Captures Google's click identifier from the URL when a paid visitor lands,
// stashes it in a first-party cookie for 90 days (Google's max attribution
// window), and exposes it to form submit handlers so we can persist it on
// the lead doc in Firestore. This is what enables the offline-conversion
// import pipeline — without a stored gclid, Google Ads can't reconcile a
// funded deal back to the original ad click.

const COOKIE_NAME = 'gclid';
const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days — Google's attribution window

// Also handles gbraid (iOS Web-to-App) + wbraid (iOS App-to-Web) which are
// the successor identifiers when GCLID is unavailable due to ATT/ITP.
const CLICK_ID_PARAMS = ['gclid', 'gbraid', 'wbraid'] as const;

export function captureGclid(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    for (const param of CLICK_ID_PARAMS) {
      const value = url.searchParams.get(param);
      if (value) {
        document.cookie = `${param}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
      }
    }
  } catch { /* URL parse can fail on odd hosts — non-fatal */ }
}

export function getGclid(): string | null {
  if (typeof document === 'undefined') return null;
  for (const param of CLICK_ID_PARAMS) {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${param}=([^;]+)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

// Which click-id type is stored (for debugging + reporting).
export function getClickIdType(): 'gclid' | 'gbraid' | 'wbraid' | null {
  if (typeof document === 'undefined') return null;
  for (const param of CLICK_ID_PARAMS) {
    if (document.cookie.match(new RegExp(`(?:^|;\\s*)${param}=`))) return param;
  }
  return null;
}
