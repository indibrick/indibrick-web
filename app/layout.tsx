import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import MarketTicker from "../components/MarketTicker";
import Providers from "../components/Providers";
import JsonLd from "../components/JsonLd";
import { CityService } from "../services/CityService"; 

// CONVERSION COMPONENTS
import ExitPopup from "../components/ExitPopup";
import MobileStickyBar from "../components/MobileStickyBar";

// 1. OPTIMIZE FONT LOADER
// We explicitly request the variable font structure to ensure all weights (100-900) are available.
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://indibrick.ca'), 
  title: {
    default: "IndiBrick | The Real Estate Ecosystem",
    template: "%s | IndiBrick"
  },
  description: "Mortgages, Investments, and Insurance for Canadians. Compare rates, calculate payments, and access exclusive real estate deals.",
  keywords: ["Mortgage Broker Ontario", "Real Estate Investing", "Private Lending", "First Time Home Buyer", "Toronto Real Estate"],
  alternates: {
    canonical: './',
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
      {/* 2. APPLY CLASSES DIRECTLY HERE */}
      {/* antialiased = Makes font crisper/thinner (Apple style) */}
      {/* font-[350] = Forces the exact "Book" weight (thinner than normal 400) */}
      <body className={`${inter.className} bg-white text-slate-900 pb-20 md:pb-0 antialiased font-[350]`}> 
        
        <JsonLd data={organizationSchema} />
        
        <Providers>
          <div className="flex flex-col min-h-screen">
            <MarketTicker />
            
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