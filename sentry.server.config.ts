// Sentry — server-side init (Node runtime API routes + RSC).

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      // Same PII scrub as the browser config.
      if (event.request?.data) {
        try {
          const d = event.request.data as any;
          for (const k of ['clientEmail', 'clientPhone', 'email', 'phone', 'auth', 'password']) {
            if (d && d[k]) d[k] = '[redacted]';
          }
        } catch { /* noop */ }
      }
      // Firestore auth errors during misconfigured local dev are noisy
      // and not actionable — drop them.
      if (event.exception?.values?.[0]?.value?.includes('adminDb unavailable')) return null;
      return event;
    },
  });
}
