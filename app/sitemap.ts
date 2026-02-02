import { MetadataRoute } from 'next';
import { CityService } from '../services/CityService';
import { ContentService } from '../services/ContentService';
import { PropertyService } from '../services/PropertyService';

// 1. FORCE DYNAMIC: This tells Next.js "Don't cache this. Run it every time."
export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://indibrick.ca';
  
  console.log("------------------------------------------------");
  console.log("GENERATING SITEMAP... (Server Side)");

  // 1. Static Pages
  const staticRoutes = [
    '', 
    '/about', 
    '/services', 
    '/mortgages', 
    '/contact', 
    '/rates', 
    '/listings',
    '/market-news',
    '/careers',
    '/privacy-policy',
    '/terms-and-conditions',
    '/tools',
    '/mortgage-payment-calculator',
    '/land-transfer-tax-calculator-ontario',
    '/affordability-calculator',
    '/closing-costs-calculator',
    '/down-payment-calculator',
    '/mortgage-renewal-calculator',
    '/refinance-calculator',
    '/trigger-rate-calculator',
    '/tools/universal-life-calculator',
    '/tools/segregated-fund-calculator',
    '/commercial-lending',
    '/insurance-financial-protection',
    '/investment-planning-wealth-growth',
    '/pre-construction-projects',
    '/property-management',
    '/realtor-network',
    '/renovation-contractors',
    '/trusted-real-estate-lawyers',
    '/commercial-auto-home-insurance',
    '/mortgage-rate-forecast',
  ];

  const staticPages = staticRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    // 2. Dynamic Data Fetching with Logging
    const cities = await CityService.getAllCities();
    console.log(`> Found ${cities.length} Cities`);

    const posts = await ContentService.fetchPosts();
    console.log(`> Found ${posts.length} Blog Posts`);

    const properties = await PropertyService.fetchProperties();
    console.log(`> Found ${properties.length} Properties`);

    // 3. Map Data to URLs
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

    const blogUrls = posts.map(post => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    const propertyUrls = properties.map(p => ({
        url: `${baseUrl}/listings?id=${p.id}`, 
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    console.log("SITEMAP GENERATION COMPLETE.");
    console.log("------------------------------------------------");

    return [
        ...staticPages, 
        ...cityUrls, 
        ...preConUrls, 
        ...blogUrls, 
        ...propertyUrls
    ];

  } catch (error) {
    console.error("ERROR GENERATING SITEMAP:", error);
    // Fallback to static if DB fails
    return staticPages;
  }
}