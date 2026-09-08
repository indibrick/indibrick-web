// Live Google Business Profile rating.
//
// ─── Why ────────────────────────────────────────────────────────────
// TrustBar previously defaulted to a 4.9 rating over 47 reviews, and every
// caller relied on the default — so eight pages published an aggregate
// rating nobody had verified. Publishing an unsubstantiated rating is two
// separate problems at once: an FSRA/Competition Act advertising exposure
// on a regulated site, and precisely what Google's spammy-structured-markup
// manual action targets.
//
// This reads the real number from the Google Business Profile instead.
//
// ─── Contract ───────────────────────────────────────────────────────
// Returns `null` when unconfigured, when the call fails, or when Google
// reports no reviews. Callers MUST hide the badge on null. There is no
// fallback rating and no default — a rating we cannot source is a rating
// we do not display.
//
// ─── Setup ──────────────────────────────────────────────────────────
//   1. Google Cloud Console → enable "Places API (New)".
//   2. Create an API key. Restrict it to Places API (New). Because this
//      only ever runs server-side, restrict by IP if you can — do NOT use
//      an HTTP-referrer restriction, which is for browser keys.
//   3. Find the Place ID for the business:
//      https://developers.google.com/maps/documentation/places/web-service/place-id
//   4. Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID.
//
// Cost note: this is one request per revalidation window per deployment,
// not per pageview. At a 12-hour window that is ~2 requests/day, which sits
// inside the free tier.

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places';
const TIMEOUT_MS = 6000;

/** Below this, an average is noise and we withhold it rather than publish it. */
const MIN_REVIEWS_TO_PUBLISH = 5;

export interface GoogleRating {
  /** Average star rating, e.g. 4.8. */
  rating: number;
  /** Total number of ratings behind that average. */
  reviewCount: number;
  /** Deep link to the profile so the claim is independently checkable. */
  reviewsUrl: string;
  /** When this was read from Google. */
  fetchedAt: string;
}

export function isGoogleReviewsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID);
}

/**
 * Read the live rating. Null on every failure path — never throws to the
 * caller, because a page render must not depend on a third-party API.
 */
export async function getGoogleRating(): Promise<GoogleRating | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${PLACES_ENDPOINT}/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri',
      },
      signal: controller.signal,
      // Ratings move slowly. Twice a day keeps us inside the free tier and
      // still reflects new reviews the same day they land.
      next: { revalidate: 43200 },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[googleReviews] ${res.status} reading place ${placeId}`);
      return null;
    }

    const data = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
    };

    const rating = typeof data.rating === 'number' ? data.rating : null;
    const reviewCount = typeof data.userRatingCount === 'number' ? data.userRatingCount : null;

    // No reviews yet, or too few for an average to mean anything.
    if (rating === null || reviewCount === null || reviewCount < MIN_REVIEWS_TO_PUBLISH) {
      return null;
    }

    return {
      rating,
      reviewCount,
      reviewsUrl: data.googleMapsUri || `https://search.google.com/local/reviews?placeid=${placeId}`,
      fetchedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    clearTimeout(timer);
    console.warn('[googleReviews] fetch failed:', e?.name === 'AbortError' ? 'timeout' : e?.message);
    return null;
  }
}

/**
 * schema.org AggregateRating built ONLY from a live reading.
 *
 * This replaces the hardcoded `5.0 / 127` block that used to ship in
 * components/Testimonials.tsx. Returns null with no live data, and callers
 * must then emit no rating markup at all rather than a placeholder.
 */
export function aggregateRatingSchema(r: GoogleRating | null) {
  if (!r) return null;
  return {
    '@type': 'AggregateRating',
    ratingValue: r.rating.toFixed(1),
    reviewCount: r.reviewCount,
    bestRating: '5',
    worstRating: '1',
  };
}
