import { MetadataRoute } from 'next';

// AI training + answer-engine crawlers are explicitly welcomed by name.
// A wildcard `User-agent: *` covers them technically, but named allow-blocks
// are the signal these operators check first — and are what shows in their
// public transparency reports. Especially relevant now that a growing share
// of top-of-funnel traffic comes from ChatGPT / Perplexity / Claude citations
// rather than blue-link search.
const AI_CRAWLERS = [
  'GPTBot',                // OpenAI (ChatGPT training + search index)
  'OAI-SearchBot',         // OpenAI (ChatGPT browsing)
  'ClaudeBot',             // Anthropic (Claude training + browsing)
  'anthropic-ai',          // Anthropic (legacy)
  'PerplexityBot',         // Perplexity (answer engine)
  'Perplexity-User',       // Perplexity (user browsing)
  'Google-Extended',       // Google (Gemini + Bard AI training opt-in)
  'CCBot',                 // Common Crawl (feeds many LLM training sets)
  'Applebot-Extended',     // Apple Intelligence
  'ByteSpider',            // ByteDance (Doubao)
  'FacebookBot',           // Meta (Llama training)
  'meta-externalagent',    // Meta (browsing)
  'YouBot',                // You.com
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/portal-x-99/', '/partner/', '/lender/', '/secure-portal/'],
      },
      // Explicit allow-blocks for AI crawlers. Same permissions as the
      // wildcard, but the named entry is what these operators log + honor.
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/api/', '/admin/', '/portal-x-99/', '/partner/', '/lender/', '/secure-portal/'],
      })),
    ],
    sitemap: 'https://indibrick.ca/sitemap.xml',
    host: 'https://indibrick.ca',
  };
}
