// Native publish: seoContent → /posts collection, which the existing
// /blog/[slug] route already renders. Zero new public surface — the
// content just appears on the site once written.
//
// Also stamps the seoContent doc so the SEO OS knows the article is
// live (status: 'published' + publishedTo entry).

import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SeoContentDoc } from '@/lib/seoContentShape';

export interface NativePublishResult {
  remoteId: string;         // /posts doc id
  publishedUrl: string;     // absolute URL
}

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://indibrick.ca';

// Slug uniqueness — /blog/[slug] queries by slug and expects one hit.
// If a post with this slug already exists, append -2 / -3 / ... until
// we find a free one.
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  if (!adminDb) throw new Error('No DB');
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const snap = await adminDb.collection('posts').where('slug', '==', slug).limit(1).get();
    if (snap.empty) return slug;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
    if (attempt > 20) throw new Error(`Slug ${baseSlug} has too many collisions`);
  }
}

export async function publishToNativeBlog(
  contentId: string,
  content: SeoContentDoc & { id: string },
  publishedByEmail: string | null,
): Promise<NativePublishResult> {
  if (!adminDb) throw new Error('No DB');

  const baseSlug = content.slug || content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 160);
  const finalSlug = await ensureUniqueSlug(baseSlug);
  const nowIso = new Date().toISOString();

  // Match the existing BlogPost shape (types.ts).
  const postDoc = {
    title: content.title,
    slug: finalSlug,
    category: content.target?.keywordPrimary || 'General',
    author: publishedByEmail || 'IndiBrick Editorial',
    date: nowIso,
    imageUrl: '', // operator can add later via existing blog admin
    excerpt: content.excerpt || '',
    content: content.bodyHtml,
    status: 'published' as const,
    // Non-standard tracking fields; existing BlogPost interface ignores them.
    seoContentId: contentId,
    seoOsPublished: true,
    seoOsPublishedAt: nowIso,
  };

  const postRef = await adminDb.collection('posts').add(postDoc);
  const publishedUrl = `${SITE_ORIGIN}/blog/${finalSlug}`;

  // Stamp seoContent — status → published, append publishedTo entry.
  await adminDb.collection('seoContent').doc(contentId).update({
    status: 'published',
    updatedAt: FieldValue.serverTimestamp(),
    publishedTo: FieldValue.arrayUnion({
      destination: 'native',
      destinationId: postRef.id,
      publishedUrl,
      publishedAt: nowIso,
    }),
  });

  return { remoteId: postRef.id, publishedUrl };
}
