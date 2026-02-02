import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/portal-x-99/'],
    },
    sitemap: 'https://indibrick.ca/sitemap.xml',
  };
}