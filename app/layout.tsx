import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
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

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'IndiBrick Financial',
    url: 'https://indibrick.ca',
    logo: 'https://indibrick.ca/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-437-241-6392', 
      contactType: 'customer service',
      areaServed: 'CA',
      availableLanguage: 'en'
    }
  };

  return (
    <html lang="en">
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

        <JsonLd data={organizationSchema} />
        
        <Providers>
          <div className="flex flex-col min-h-screen">
            
            <Header />
            
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