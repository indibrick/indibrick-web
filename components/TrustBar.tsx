import React from 'react';
import { Star, Shield, TrendingUp } from 'lucide-react';

// TrustBar — the missing third-party proof strip both audit agents flagged
// as the single biggest gap between IndiBrick and best-in-Canada
// brokerages. Renders in three panes: Google reviews (or placeholder
// count), FSRA license chip, scale claim.
//
// Ships directly under the hero on every landing page.
//
// This component is deliberately DUMB — it holds no data dependency and
// makes no network call. It renders whatever rating it is handed and hides
// the badge when handed nothing. The live Google Business Profile reading
// arrives via components/TrustBarLive.tsx, which is the single place a
// rating can enter the site. Do not reintroduce a default rating here.

export interface TrustBarProps {
  /** Star rating from the live Google profile. Omit to hide the badge. */
  rating?: number;
  /** Live review count. Omit to hide the badge — never pass a placeholder. */
  reviewCount?: number;
  /** Google Business Profile URL — where the review badge deep-links. */
  reviewsUrl?: string;
  /** Scale claim — files placed / clients served / etc. */
  scaleClaim?: {
    value: string;
    label: string;
  };
  /** Optional color hint. Defaults to neutral. */
  variant?: 'light' | 'dark';
}

export function TrustBar({
  rating,
  reviewCount,
  reviewsUrl = 'https://g.page/indibrick',
  scaleClaim = { value: '$18M+', label: 'placed in 2025' },
  variant = 'light',
}: TrustBarProps) {
  // Review badge is OPT-IN. It previously defaulted to 4.9 / "47+ Google
  // reviews" and every caller relied on the default — so 8 situation pages
  // published a review count nobody had verified. Advertising an aggregate
  // rating you can't substantiate is an FSRA/Competition Act exposure and,
  // separately, is exactly what Google's spammy-structured-markup manual
  // action targets. Pass BOTH `rating` and `reviewCount` from a real
  // Google Business Profile reading to show the badge; omit to hide it.
  const showReviews = typeof rating === 'number' && typeof reviewCount === 'number' && reviewCount > 0;
  const bg = variant === 'dark' ? 'bg-slate-900 text-white border-white/10' : 'bg-white text-slate-900 border-gray-100';
  const muted = variant === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const divider = variant === 'dark' ? 'divide-white/10' : 'divide-gray-100';

  return (
    <section className={`${bg} border-y`} aria-label="Trust signals">
      <div className="container mx-auto px-6 max-w-6xl py-5 md:py-6">
        <div className={`grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x ${divider} text-center md:text-left`}>

          {/* Google Reviews badge — only when real, caller-supplied numbers
              are available. Falls back to the FSRA regulatory credential,
              which is a verifiable trust signal we can always stand behind. */}
          {showReviews ? (
            <a
              href={reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center md:justify-start gap-3 py-3 md:py-0 md:px-4 hover:opacity-80 transition`}
              aria-label={`${rating} stars from ${reviewCount} Google reviews`}
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} className={i <= Math.floor(rating as number) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-black tabular-nums">{(rating as number).toFixed(1)} <span className={`text-xs font-bold ${muted}`}>/ 5</span></p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>{reviewCount} Google reviews</p>
              </div>
            </a>
          ) : (
            <div className="flex items-center justify-center md:justify-start gap-3 py-3 md:py-0 md:px-4">
              <Shield size={18} className="text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-black">Licensed Brokerage</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>Ontario · FSRA regulated</p>
              </div>
            </div>
          )}

          {/* FSRA License chip */}
          <div className="flex items-center justify-center md:justify-center gap-3 py-3 md:py-0 md:px-4">
            <Shield size={18} className="text-emerald-600" />
            <div className="text-left">
              <p className="text-sm font-black">FSRA #12830</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>Regulated · Pineapple Financial</p>
            </div>
          </div>

          {/* Scale claim */}
          <div className="flex items-center justify-center md:justify-end gap-3 py-3 md:py-0 md:px-4">
            <TrendingUp size={18} className="text-blue-600" />
            <div className="text-left">
              <p className="text-sm font-black tabular-nums">{scaleClaim.value}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>{scaleClaim.label}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default TrustBar;
