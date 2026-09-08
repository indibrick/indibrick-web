import React from 'react';
import { TrustBar, type TrustBarProps } from './TrustBar';
import { getGoogleRating, aggregateRatingSchema } from '../lib/googleReviews';

// Server-side wrapper that feeds TrustBar the LIVE Google Business Profile
// rating instead of a hardcoded one.
//
// TrustBar itself stays a dumb presentational component with no data
// dependency — it renders whatever rating it is handed, and hides the badge
// when handed nothing. This wrapper is the only thing that talks to Google,
// so there is exactly one place where a rating can enter the site.
//
// When GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID are unset, or the profile has
// too few reviews to average honestly, `getGoogleRating()` returns null, the
// badge stays hidden, and the strip falls back to the FSRA credential. That
// is the intended state until the profile has real reviews — it is never a
// reason to substitute a placeholder number.

type Props = Omit<TrustBarProps, 'rating' | 'reviewCount' | 'reviewsUrl'> & {
  /**
   * Emit schema.org AggregateRating alongside the badge. Off by default:
   * TrustBar ships on 11 pages and duplicating rating markup across all of
   * them is itself a structured-data smell. Turn it on for ONE canonical
   * page (the homepage or /about), not for the whole set.
   */
  emitSchema?: boolean;
};

export default async function TrustBarLive({ emitSchema = false, ...rest }: Props) {
  const live = await getGoogleRating();
  const ratingSchema = emitSchema ? aggregateRatingSchema(live) : null;

  return (
    <>
      {ratingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FinancialService',
              name: 'IndiBrick',
              url: 'https://indibrick.ca',
              aggregateRating: ratingSchema,
            }),
          }}
        />
      )}
      <TrustBar
        {...rest}
        rating={live?.rating}
        reviewCount={live?.reviewCount}
        reviewsUrl={live?.reviewsUrl}
      />
    </>
  );
}
