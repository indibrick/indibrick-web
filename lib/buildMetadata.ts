import type { Metadata } from 'next';

const SITE_URL = 'https://indibrick.ca';
const SITE_NAME = 'IndiBrick Financial';
const DEFAULT_IMAGE = '/icon.png';

export interface BuildMetadataInput {
  /** Page title — the layout will append " | IndiBrick" via its template unless titleAbsolute is true. */
  title: string;
  /** Meta description (≤160 chars ideal for Google snippet truncation). Reused in og:description + twitter description. */
  description: string;
  /** Path relative to site root, e.g. "/apply" or "/aura-lakeview-village". Used for canonical + og:url. */
  slug: string;
  /** Image for share previews. Path under /public (e.g. "/aura/hero.jpg") or an absolute URL. Defaults to /icon.png. */
  image?: string;
  /** Optional keywords array. */
  keywords?: string[];
  /** Bypass the layout's "%s | IndiBrick" title template when the title is already self-contained. */
  titleAbsolute?: boolean;
}

/**
 * Build a fully-populated Next.js Metadata object — title, description, canonical,
 * Open Graph and Twitter cards — from a small per-page input.
 *
 * Why this exists: most pages on the site only set `title` + `description`. In Next's
 * App Router, when a child page doesn't override `openGraph`, the layout's defaults
 * are inherited as-is — which is why every shared link used to show the same preview
 * card. Using this helper guarantees every page ships its own og:title/description/image.
 */
export function buildMetadata({
  title,
  description,
  slug,
  image,
  keywords,
  titleAbsolute,
}: BuildMetadataInput): Metadata {
  const path = slug.startsWith('/') ? slug : `/${slug}`;
  const url = `${SITE_URL}${path}`;
  const imgPath = image || DEFAULT_IMAGE;
  const imgUrl = imgPath.startsWith('http')
    ? imgPath
    : `${SITE_URL}${imgPath.startsWith('/') ? imgPath : `/${imgPath}`}`;

  // effectiveTitle is what the browser <title> will ACTUALLY render.
  // - titleAbsolute:true → the title as-provided (bypasses layout template).
  // - titleAbsolute:false → the layout's "%s | IndiBrick" template runs,
  //   yielding "{title} | IndiBrick".
  //
  // Before this fix, OG/Twitter were fed the RAW `title` while <title>
  // was fed the templated version, so 99% of pages shipped mismatched
  // titles between Google SERPs (brand appended) and Facebook/LinkedIn
  // previews (no brand). Now both use effectiveTitle → identical everywhere.
  const effectiveTitle = titleAbsolute ? title : `${title} | IndiBrick`;

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      locale: 'en_CA',
      siteName: SITE_NAME,
      title: effectiveTitle,
      description,
      url,
      images: [
        {
          url: imgUrl,
          width: 1200,
          height: 630,
          alt: effectiveTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: effectiveTitle,
      description,
      images: [imgUrl],
    },
  };
}
