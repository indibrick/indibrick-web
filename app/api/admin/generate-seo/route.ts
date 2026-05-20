import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Blog SEO generator — the agent supplies a Title + Content, this returns a clean
 * URL slug and a compelling meta-description excerpt so they never have to write
 * either by hand. Called from the portal-x-99 Content tab.
 *
 * The slug is also used as the Firestore document id (see ContentService.createPost),
 * so it MUST be URL-safe — we sanitize whatever the model returns rather than trusting it.
 */

function slugify(s: string): string {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, '')        // strip any HTML
    .replace(/['"]/g, '')           // drop quotes outright
    .replace(/[^a-z0-9\s-]/g, ' ')  // non url-safe chars -> space
    .replace(/\s+/g, '-')           // spaces -> hyphens
    .replace(/-+/g, '-')            // collapse repeats
    .replace(/^-|-$/g, '')          // trim leading/trailing hyphens
    .slice(0, 70)
    .replace(/-$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const { title, content, category } = await req.json();

    if (!title && !content) {
      return NextResponse.json({ error: 'Provide at least a title or content' }, { status: 400 });
    }

    const plainContent = String(content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    let slug = '';
    let excerpt = '';

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `
You are an SEO editor for IndiBrick, a Canadian (Ontario) mortgage + real estate firm.
Produce SEO metadata for this blog post.

TITLE: ${title || '(none)'}
CATEGORY: ${category || 'General'}
CONTENT (plain text, truncated): ${plainContent.slice(0, 4000)}

Return JSON only:
{
  "slug": "lowercase-kebab-case URL slug, 3-7 words, include the main keyword, NO stop-words, NO year unless central, max ~60 chars",
  "excerpt": "compelling Google meta description, 140-160 characters, written for a Canadian homebuyer/investor, includes the primary keyword naturally, no clickbait, ends as a complete sentence"
}`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());
        if (parsed.slug) slug = slugify(parsed.slug);
        if (parsed.excerpt) excerpt = String(parsed.excerpt).replace(/\s+/g, ' ').trim().slice(0, 200);
      } catch (e) {
        console.warn('SEO generation via Gemini failed, using fallbacks', e);
      }
    }

    // Deterministic fallbacks so the agent is never blocked
    if (!slug) slug = slugify(title) || `post-${Date.now()}`;
    if (!excerpt) {
      excerpt = plainContent.slice(0, 155).trim();
      if (plainContent.length > 155) excerpt += '…';
      if (!excerpt) excerpt = String(title || 'Read more on the IndiBrick blog.');
    }

    return NextResponse.json({ slug, excerpt });
  } catch (error: any) {
    console.error('generate-seo error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
