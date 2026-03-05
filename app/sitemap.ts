import { MetadataRoute } from 'next';
import { CityService } from '../services/CityService';
import { ContentService } from '../services/ContentService';
import { PropertyService } from '../services/PropertyService';

// 🚀 CTO DIRECTIVE: Shift from force-dynamic to ISR. 
// Revalidate every 3600 seconds (1 hour). This protects our database 
// from bot-spam while keeping Google fed with fresh data.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://indibrick.ca';
  
  console.log("🚀 [SEO] GENERATING CACHED SITEMAP...");

  // 1. Core Platform Pages
  const staticRoutes = [
    '', '/about', '/services', '/mortgages', '/contact', '/rates', 
    '/listings', '/market-news', '/careers', '/privacy-policy', 
    '/terms-and-conditions', '/tools', '/mortgage-payment-calculator', 
    '/land-transfer-tax-calculator-ontario', '/affordability-calculator', 
    '/closing-costs-calculator', '/down-payment-calculator', 
    '/mortgage-renewal-calculator', '/refinance-calculator', 
    '/trigger-rate-calculator', '/tools/universal-life-calculator', 
    '/tools/segregated-fund-calculator', '/commercial-lending', 
    '/insurance-financial-protection', '/investment-planning-wealth-growth', 
    '/pre-construction-projects', '/property-management', '/realtor-network', 
    '/renovation-contractors', '/trusted-real-estate-lawyers', 
    '/commercial-auto-home-insurance', '/mortgage-rate-forecast',
  ];

  const staticPages = staticRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    // 2. Parallel Data Fetching for Maximum Speed
    const [cities, posts, properties] = await Promise.all([
      CityService.getAllCities(),
      ContentService.fetchPosts(),
      PropertyService.fetchProperties()
    ]);

    console.log(`📊 Indexing: ${cities.length} Cities | ${posts.length} Posts | ${properties.length} Properties`);

    // 3. Map Data to High-Value Arbitrage URLs
    const cityUrls = cities.map(city => ({
        url: `${baseUrl}/mortgage-real-estate/${city.slug}`,
        lastModified: new Date(), 
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    const preConUrls = cities.map(city => ({
        url: `${baseUrl}/pre-construction-condos/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
    }));

    const blogUrls = posts.map(post => {
        // Defensive date parsing for Firestore timestamps
        const lastMod = post.date?.toDate ? post.date.toDate() : new Date(post.date || Date.now());
        return {
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: lastMod,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        };
    });

    const propertyUrls = properties.map(p => ({
        // 🚨 URGENT SEO FIX: Moving away from ?id= queries to clean URLs
        // Ensure your Next.js routing supports /listings/[id] or /listings/[slug]
        url: `${baseUrl}/listings/${p.slug || p.id}`, 
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    console.log("✅ [SEO] SITEMAP GENERATION COMPLETE.");

    return [
        ...staticPages, 
        ...cityUrls, 
        ...preConUrls, 
        ...blogUrls, 
        ...propertyUrls
    ];

  } catch (error) {
    console.error("❌ CRITICAL SITEMAP ERROR:", error);
    // Fallback gracefully so Google doesn't penalize the domain
    return staticPages;
  }
}