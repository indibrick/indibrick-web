// Sentry — Edge runtime (middleware, edge API routes).
// We don't currently use edge runtime, but @sentry/nextjs expects the
// file. Init stays gated on DSN for consistency.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV,
  });
}
