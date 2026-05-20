import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Drafts a full blog article body (clean HTML) from a title + optional bullet-point notes.
 * Output is intended to drop straight into the post `content` field, which is later
 * sanitized on render (app/blog/[slug]) — so we only emit a safe subset of tags.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ error: 'AI key not configured' }, { status: 500 });

    const { title, notes, category } = await req.json();
    if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a senior content writer for IndiBrick, a Canadian (Ontario) mortgage + real estate firm.
Write a complete, publish-ready blog article.

TITLE: ${title}
CATEGORY: ${category || 'Mortgage'}
KEY POINTS THE WRITER WANTS COVERED:
${notes?.trim() || '(none provided — use your expertise to cover the topic thoroughly for an Ontario audience)'}

REQUIREMENTS:
- Audience: Canadian homebuyers, homeowners, and real-estate investors in Ontario.
- Tone: authoritative but accessible, helpful, no hype, no fabricated statistics.
- Length: roughly 600-900 words.
- Output CLEAN HTML using ONLY these tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>. Do NOT include <html>, <head>, <body>, <h1>, <style>, or <script>.
- Start with an engaging intro <p> (do not repeat the title as an <h1>).
- Use <h2> for main sections and <h3> for subsections.
- End with a brief, non-pushy call-to-action paragraph encouraging the reader to speak with an IndiBrick advisor.
- Where you reference rules (B-20, CMHC, land transfer tax, etc.), be accurate and general; avoid stating specific current rates as fact.

Output ONLY the HTML. No markdown fences, no commentary.`;

    const result = await model.generateContent(prompt);
    let content = result.response.text().trim();
    // Strip accidental markdown code fences if the model adds them
    content = content.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim();

    if (!content) return NextResponse.json({ error: 'Empty draft returned' }, { status: 502 });

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('generate-article error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
