// Next.js instrumentation entry (Node 18+ / Next 14+).
// Called once per runtime at boot — routes Sentry SDK init to the
// correct config file for each runtime.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
