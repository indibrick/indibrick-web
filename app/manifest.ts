import { MetadataRoute } from 'next';

// Web App Manifest for install-to-home-screen + PWA signals.
// Next 14 App Router serves this at /manifest.webmanifest automatically.
//
// Shortcuts point at the 4 highest-intent conversion pages so an installed
// user can jump straight into rates / apply / renewal-rescue / housing-index
// without opening a browser tab first. Analytics via ?utm_source=pwa* so
// we can measure how much PWA traffic is worth.
//
// TODO(design): the icons array currently reuses /logo.png at both sizes.
// Generating true 192×192 + 512×512 maskable variants is a separate task —
// a manifest that declares sizes it can't actually serve fails Lighthouse
// PWA silently but doesn't hurt SEO.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IndiBrick — Ontario Mortgage Brokerage',
    short_name: 'IndiBrick',
    description: 'Ontario mortgages, live rates, calculators, and pre-construction. FSRA-licensed brokerage.',
    start_url: '/?utm_source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#0B1120',
    background_color: '#FFFFFF',
    lang: 'en-CA',
    dir: 'ltr',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Compare live rates',
        short_name: 'Rates',
        url: '/rates?utm_source=pwa_shortcut',
        description: 'Wholesale mortgage rates, updated multiple times daily.',
      },
      {
        name: 'Apply for a mortgage',
        short_name: 'Apply',
        url: '/apply?utm_source=pwa_shortcut',
        description: 'Start your mortgage application in 90 seconds.',
      },
      {
        name: 'Renewal Rescue',
        short_name: 'Renewal',
        url: '/renewal-rescue?utm_source=pwa_shortcut',
        description: 'Free renewal review before you auto-sign your bank offer.',
      },
      {
        name: 'Housing Index',
        short_name: 'HPI',
        url: '/housing-index?utm_source=pwa_shortcut',
        description: 'IndiBrick Ontario Housing Index — monthly market data.',
      },
    ],
  };
}
