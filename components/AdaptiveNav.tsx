'use client';

// Adaptive nav. Renders the full <Header /> for organic traffic, and a
// stripped-down <MinimalNav /> for paid landings (utm_source = google/ads/
// facebook/meta, or gclid/fbclid present). Suppressing the global nav for
// paid clicks keeps the conversion path single-track — required by audit 2E.
//
// We persist the paid signal to sessionStorage so a paid visitor doesn't
// "lose" the minimal nav on internal navigation that drops the UTM params.

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from './Header';
import MinimalNav from './MinimalNav';

const PAID_KEY = 'ib_paid_session';
const PAID_SOURCES = ['google', 'gads', 'google_ads', 'facebook', 'fb', 'meta', 'meta_ads', 'instagram', 'tiktok'];

const AdaptiveNav: React.FC = () => {
  const params = useSearchParams();
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // Server render + first paint both run the same default (organic Header)
    // to avoid hydration mismatch. The swap happens after mount.
    const utm = (params?.get('utm_source') || '').toLowerCase();
    const hasClickId = params?.get('gclid') || params?.get('fbclid') || params?.get('wbraid') || params?.get('gbraid');
    const flagged =
      PAID_SOURCES.some((s) => utm.includes(s)) ||
      Boolean(hasClickId) ||
      (typeof window !== 'undefined' && window.sessionStorage.getItem(PAID_KEY) === '1');

    if (flagged && typeof window !== 'undefined') {
      window.sessionStorage.setItem(PAID_KEY, '1');
    }
    setIsPaid(flagged);
  }, [params]);

  return isPaid ? <MinimalNav /> : <Header />;
};

export default AdaptiveNav;
