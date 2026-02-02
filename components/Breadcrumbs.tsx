'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Hide on homepage
  if (!pathname || pathname === '/') return null;

  // Generate path segments
  const segments = pathname.split('/').filter(item => item !== '');
  
  // AEO: Generate Schema.org JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": segments.map((segment, index) => {
        const url = `https://indibrick.ca/${segments.slice(0, index + 1).join('/')}`;
        return {
            "@type": "ListItem",
            "position": index + 2, // 1 is Home
            "name": segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // "mortgage-payment" -> "Mortgage Payment"
            "item": url
        };
    })
  };
  
  // Add Home to Schema
  breadcrumbSchema.itemListElement.unshift({
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://indibrick.ca"
  });

  return (
    <div className="bg-gray-50 border-b border-gray-100 py-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      <div className="container mx-auto px-6">
        <nav className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-black transition flex items-center gap-1">
             <Home size={12} /> Home
          </Link>
          
          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join('/')}`;
            const isLast = index === segments.length - 1;
            const title = segment.replace(/-/g, ' '); // Decode URL slug

            return (
              <React.Fragment key={href}>
                <ChevronRight size={10} className="mx-2 text-gray-300" />
                {isLast ? (
                  <span className="text-black select-none truncate max-w-[200px]">
                    {title}
                  </span>
                ) : (
                  <Link href={href} className="hover:text-black transition">
                    {title}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
}