import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AdaptiveNav from "../components/AdaptiveNav";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import Providers from "../components/Providers";
import JsonLd from "../components/JsonLd";
import { CityService } from "../services/CityService"; 

// CONVERSION COMPONENTS
import ExitPopup from "../components/ExitPopup";
import MobileStickyBar from "../components/MobileStickyBar";

// 1. OPTIMIZE FONT LOADER
const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  // display:'swap' eliminates the render-blocking-webfont FOIT that the
  // audit tool flagged as the site's render-blocking script.
  display: 'swap',
});

// 2. ENTERPRISE SEO & AEO METADATA INJECTION
export const metadata: Metadata = {
  metadataBase: new URL('https://indibrick.ca'), 
  title: {
    default: "IndiBrick | The Real Estate Ecosystem",
    template: "%s | IndiBrick"
  },
  description: "Mortgages, Investments, and Insurance for Canadians. Compare rates, calculate payments, and access exclusive real estate deals.",
  keywords: ["Mortgage Broker Ontario", "Real Estate Investing", "Private Lending", "First Time Home Buyer", "Toronto Real Estate", "Canadian Mortgages"],
  alternates: {
    canonical: './',
    // Self-referencing hreflang signals language intent without faking a
    // French mirror we don't actually publish. x-default is the fallback
    // hreflang Google uses when no locale matches.
    languages: {
      'en-CA': './',
      'x-default': './',
    },
  },
  // Web App Manifest + PWA hints. Manifest lives at app/manifest.ts (Next
  // App Router auto-generates the /manifest.webmanifest route).
  manifest: '/manifest.webmanifest',
  themeColor: '#0B1120',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IndiBrick',
  },
  // Explicit robots defaults with max-image-preview:large — unlocks Google
  // Discover eligibility + rich image results in SERPs.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  
  // Open Graph for rich link previews (LinkedIn, Facebook, iMessage)
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://indibrick.ca',
    siteName: 'IndiBrick Financial',
    title: 'IndiBrick | The Real Estate Ecosystem',
    description: 'Complete 360° financial solutions for Canadians. Mortgages, real estate, and insurance.',
    images: [{
      url: '/icon.png', 
      width: 800,
      height: 800,
      alt: 'IndiBrick Financial Ecosystem'
    }],
  },

  // Twitter Cards for X/Twitter previews
  twitter: {
    card: 'summary_large_image',
    title: 'IndiBrick | The Real Estate Ecosystem',
    description: 'Complete 360° financial solutions for Canadians.',
    images: ['/icon.png'],
  },

  // Facebook Domain Verification
  verification: {
    other: {
      'facebook-domain-verification': 't20u0vbymu3n3li70fo6vhq8xmkaz9',
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cities = await CityService.getAllCities();

  // Rich Organization schema — LLMs (ChatGPT/Perplexity/Claude) and Google's
  // Knowledge Graph both weight license + address + sameAs heavily when
  // deciding whether to cite a financial services entity. Kept minimal but
  // factual — every field here has to be defensible.
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['FinancialService', 'LocalBusiness'],
    '@id': 'https://indibrick.ca/#organization',
    name: 'IndiBrick',
    legalName: 'IndiBrick Financial',
    alternateName: 'IndiBrick Financial',
    url: 'https://indibrick.ca',
    logo: 'https://indibrick.ca/logo.png',
    image: 'https://indibrick.ca/icon.png',
    description: 'Ontario mortgage brokerage and real estate platform. Mortgages brokered through Pineapple Financial Inc. (FSRA #12830). Serving the GTA, Vaughan, Brampton, and Niagara.',
    foundingDate: '2024',
    founders: [
      { '@type': 'Person', name: 'Mudit Chhura' },
      { '@type': 'Person', name: 'Saad Shaikh' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Vaughan',
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Ontario' },
      { '@type': 'City', name: 'Toronto' },
      { '@type': 'City', name: 'Vaughan' },
      { '@type': 'City', name: 'Brampton' },
      { '@type': 'City', name: 'Mississauga' },
      { '@type': 'City', name: 'Hamilton' },
    ],
    // FSRA license held by the brokerage IndiBrick submits deals through.
    // Named as an Organization identifier so LLMs can disambiguate.
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'FSRA', value: '12830' },
    ],
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'license',
      name: 'FSRA Mortgage Brokerage License',
      recognizedBy: {
        '@type': 'Organization',
        name: 'Financial Services Regulatory Authority of Ontario',
      },
      identifier: '12830',
    },
    parentOrganization: {
      '@type': 'FinancialService',
      name: 'Pineapple Financial Inc.',
      identifier: 'FSRA #12830',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+1-437-241-6392',
        email: 'sales@indibrick.ca',
        contactType: 'customer service',
        areaServed: 'CA',
        availableLanguage: 'en',
      },
    ],
    email: 'sales@indibrick.ca',
    telephone: '+1-437-241-6392',
    priceRange: '$$',
    // sameAs deliberately omitted for now — Knowledge Graph counts dead
    // profile links as a trust hit. Add the real handles here once
    // Instagram / LinkedIn / Facebook pages are live and verified.
  };

  // Site-wide WebSite schema — enables Google's Sitelinks Search Box +
  // gives LLMs a canonical name → URL mapping.
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://indibrick.ca/#website',
    url: 'https://indibrick.ca',
    name: 'IndiBrick',
    publisher: { '@id': 'https://indibrick.ca/#organization' },
    inLanguage: 'en-CA',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://indibrick.ca/blog?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        {/* Preconnect to the origins we hit on every render — gtag + Meta
            Pixel are on the critical path. dns-prefetch is the cheaper
            fallback for hosts we call less frequently. Saves ~150–300ms
            of TTFB on mid-range mobile. */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.redditstatic.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className={`${inter.className} bg-white text-slate-900 pb-20 md:pb-0 antialiased font-[350]`}>

        {/* --- GOOGLE ADS TAG (AW-17924066227) --- */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17924066227"
          strategy="afterInteractive"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17924066227');
          `}
        </Script>
        {/* --- END GOOGLE TAG --- */}

        {/* --- META PIXEL (1274827808145119) — fires PageView on every route --- */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1274827808145119');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1274827808145119&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* --- END META PIXEL --- */}

        {/* --- REDDIT PIXEL (a2_jct2yhtnylge) — fires PageVisit on every route.
            Same "afterInteractive" strategy as the other pixels so it doesn't
            block first paint. Uses Reddit's official snippet verbatim.
            Advanced matching (email / phone / externalId) is wired at the
            per-form level via lib/tracking.ts (rdt call inside trackLeadSubmit)
            so PII stays scoped to the actual conversion moment. */}
        <Script id="reddit-pixel" strategy="afterInteractive">
          {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js?pixel_id=a2_jct2yhtnylge",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','a2_jct2yhtnylge');rdt('track','PageVisit');`}
        </Script>
        {/* --- END REDDIT PIXEL --- */}

        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        
        <Providers>
          <div className="flex flex-col min-h-screen">
            
            {/* AdaptiveNav reads URL search params to swap to a stripped-down
                nav for paid traffic. Wrapped in Suspense so the rest of the
                page can still prerender statically — without Suspense, the
                useSearchParams() inside AdaptiveNav forces every page into
                dynamic rendering. <Header /> is the prerendered fallback. */}
            <Suspense fallback={<Header />}>
              <AdaptiveNav />
            </Suspense>
            
            <main className="flex-grow">
              <Breadcrumbs />
              {children}
            </main>
            
            <Footer cities={cities} />

            {/* HIGH PERFORMANCE LEAD CAPTURE */}
            <ExitPopup />
            <MobileStickyBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}