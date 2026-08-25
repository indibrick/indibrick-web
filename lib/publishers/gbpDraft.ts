// GBP "publish" isn't a real publish — no API call. This module
// shapes the content into a GBP-post-ready object the UI copies to
// clipboard. Operator pastes into the GBP web UI manually, then
// flips the queue row to "posted" so the console reflects reality.
//
// GBP post rules we validate against:
//   - Title (Google calls this "summary"): 4-58 characters
//   - Body: 1-1500 characters
//   - CTA URL: valid URL, optional
//   - No hashtags, no all-caps, no emojis in title (Google warns)

import type { SeoContentDoc } from '@/lib/seoContentShape';

export interface GbpDraft {
  title: string;                 // 4-58 chars — will be truncated with warning
  body: string;                  // 1-1500 chars — will be truncated with warning
  ctaUrl: string | null;
  warnings: string[];            // human-readable warnings surfaced in UI
  charCounts: {
    title: number;
    body: number;
  };
}

const TITLE_MAX = 58;
const BODY_MAX = 1500;
const TITLE_MIN = 4;
const BODY_MIN = 1;

// Strip HTML → plain text with paragraph breaks preserved. GBP posts
// are plain text; anything HTML gets flattened.
function htmlToPlain(html: string): string {
  return html
    // Turn common block boundaries into double newlines.
    .replace(/<\/(p|div|section|article|li|h[1-6])>/gi, '\n\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    // Strip all remaining tags.
    .replace(/<[^>]+>/g, '')
    // Collapse whitespace.
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  // Truncate at a word boundary when possible.
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const stem = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return stem + '…';
}

// Detect the first well-formed URL in the content — becomes the CTA link.
function firstUrlIn(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"']+/);
  return m ? m[0] : null;
}

export function prepareGbpDraft(
  content: Pick<SeoContentDoc, 'title' | 'excerpt' | 'bodyHtml'>,
  overrides: { ctaUrl?: string } = {},
): GbpDraft {
  const warnings: string[] = [];

  let title = (content.title || '').trim();
  if (title.length < TITLE_MIN) warnings.push(`Title is only ${title.length} chars — GBP requires at least ${TITLE_MIN}.`);
  if (title.length > TITLE_MAX) {
    warnings.push(`Title trimmed from ${title.length} → ${TITLE_MAX} chars for GBP.`);
    title = truncate(title, TITLE_MAX);
  }

  // Body prefers excerpt (short, purposeful) then falls back to plain-text
  // of the full HTML if the excerpt is too short to stand on its own.
  const excerpt = (content.excerpt || '').trim();
  const plainBody = htmlToPlain(content.bodyHtml || '');
  let body = excerpt.length > 120 ? excerpt : plainBody;
  if (body.length < BODY_MIN) warnings.push('Body is empty — nothing to post.');
  if (body.length > BODY_MAX) {
    warnings.push(`Body trimmed from ${body.length} → ${BODY_MAX} chars for GBP.`);
    body = truncate(body, BODY_MAX);
  }

  // CTA URL: operator override first, else find one in the content, else null.
  const ctaUrl = overrides.ctaUrl?.trim() || firstUrlIn(plainBody);
  if (ctaUrl && !/^https?:\/\//.test(ctaUrl)) {
    warnings.push('CTA URL does not start with http(s):// — GBP will reject.');
  }

  return {
    title, body, ctaUrl,
    warnings,
    charCounts: { title: title.length, body: body.length },
  };
}
