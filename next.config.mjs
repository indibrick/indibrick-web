/** @type {import('next').NextConfig} */

// Security headers applied site-wide. CSP ships in Report-Only mode first —
// browsers will LOG violations but NOT block anything. Watch reports for
// 48h, add any missing sources to the allowlist, then rename the header
// key to `Content-Security-Policy` (drop `-Report-Only`) to enforce.
//
// Scope is drafted against the site's actual third parties:
//   - Google Ads gtag (AW-17924066227)          → googletagmanager.com, google-analytics.com
//   - Meta Pixel (1274827808145119)             → connect.facebook.net, facebook.com
//   - Reddit Pixel (a2_jct2yhtnylge)            → redditstatic.com (script), alb.reddit.com (beacon)
//   - Firebase Auth + Firestore                 → *.googleapis.com, *.firebaseio.com
//   - Firebase Storage (client vault uploads)   → firebasestorage.googleapis.com
//   - Pineapple pre-approval embed              → gopineapple.ca, *.gopineapple.ca
//   - Google Fonts via next/font/google         → fonts.googleapis.com / gstatic
//
// If you later add HubSpot / Calendly / YouTube embeds / a new tag manager,
// extend the CSP or those integrations will silently fail.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.googleadservices.com https://connect.facebook.net https://*.firebaseio.com https://apis.google.com https://www.gstatic.com https://www.redditstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: https://www.googletagmanager.com https://www.google-analytics.com https://*.googleadservices.com https://www.facebook.com https://firebasestorage.googleapis.com https://*.redditstatic.com https://*.reddit.com",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.facebook.com https://gopineapple.ca https://*.gopineapple.ca https://*.pineapplemortgage.com https://*.reddit.com https://*.redditstatic.com",
  "frame-src 'self' https://gopineapple.ca https://*.gopineapple.ca https://www.googletagmanager.com https://td.doubleclick.net https://www.facebook.com",
  "frame-ancestors 'self'",
  "form-action 'self' https://gopineapple.ca",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',      // City-detect on rate/listings pages
      'payment=(self)',           // Application-fee capture if added
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=(self)',
      'browsing-topics=()',       // Explicit opt-out of Topics API
      'interest-cohort=()',       // Legacy FLoC opt-out — harmless
    ].join(', '),
  },
  // Report-Only for the first 48h. Rename this key to
  // `Content-Security-Policy` to enforce.
  { key: 'Content-Security-Policy-Report-Only', value: CSP },
];

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    unoptimized: true,
  },
  transpilePackages: ['undici', 'firebase', '@firebase/auth', '@firebase/component', '@firebase/util'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // API routes should never be indexed by search engines regardless of caller.
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
      // Long-cache the manifest + icons.
      { source: '/manifest.webmanifest', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
    ];
  },
};

export default nextConfig;
