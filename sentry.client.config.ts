// Sentry — browser-side init. Auto-loaded by @sentry/nextjs.
//
// Init is skipped entirely when NEXT_PUBLIC_SENTRY_DSN is unset —
// which means dev doesn't need a Sentry account, but prod without
// the DSN is silently unmonitored (health-check config.sentry:false
// surfaces the miss).

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Only trace 10% of navigations in prod; 100% in dev if enabled.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Session replay for a small fraction of sessions + 100% of errors
    // — massively helps debug production UI issues without shipping
    // full-time recording.
    replaysSessionSampleRate: 0.02,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    // Don't spam the console in dev.
    debug: false,
    // Strip anything that looks like PII from breadcrumbs. The CRM
    // touches client email/phone constantly; unfiltered breadcrumbs
    // would violate PIPEDA even in error reports.
    beforeSend(event) {
      // Coarse redaction — swap known PII fields inside the request
      // body if we ever attach it.
      if (event.request?.data) {
        try {
          const d = event.request.data as any;
          for (const k of ['clientEmail', 'clientPhone', 'email', 'phone', 'auth', 'password']) {
            if (d && d[k]) d[k] = '[redacted]';
          }
        } catch { /* noop */ }
      }
      return event;
    },
  });
}
