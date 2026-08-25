// SEO OS content — list + create (generate) drafts.
//
// POST: takes a target keyword + context, calls Claude, writes a
// draft into /seoContent. Never publishes autonomously — status
// always starts as 'draft', the operator moves it to in_review /
// approved via PATCH.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { callClaude } from '@/lib/anthropicClient';
import {
  CONTENT_SYSTEM_PROMPT,
  PROMPT_VERSION,
  buildContentPrompt,
  type ContentGenerationInput,
} from '@/lib/seoContentPrompts';
import { validateSeoContent } from '@/lib/seoContentShape';

const MAX_LIST = 200;

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const kind = searchParams.get('kind');

  let q: FirebaseFirestore.Query = adminDb.collection('seoContent')
    .orderBy('updatedAt', 'desc').limit(MAX_LIST);
  if (status) q = q.where('status', '==', status);
  if (kind) q = q.where('kind', '==', kind);

  try {
    const snap = await q.get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (e: any) {
    // Firestore's "index required" error carries a URL to auto-create
    // it. Surface both to terminal + client so the fix is one click.
    console.error('[seo-os/content GET] query failed:', e?.message, e?.stack);
    return NextResponse.json({
      error: e?.message || 'Query failed',
      hint: 'If the message mentions a missing composite index, run: firebase deploy --only firestore:indexes',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const input: ContentGenerationInput = {
    keywordPrimary: String(body.keywordPrimary || '').trim(),
    keywordSecondary: Array.isArray(body.keywordSecondary)
      ? body.keywordSecondary.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 8)
      : undefined,
    city: body.city ? String(body.city).trim() : undefined,
    propertyType: body.propertyType ? String(body.propertyType).trim() : undefined,
    priceRange: body.priceRange ? String(body.priceRange).trim() : undefined,
    competitorUrls: Array.isArray(body.competitorUrls)
      ? body.competitorUrls.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 5)
      : undefined,
    extraContext: body.extraContext ? String(body.extraContext).slice(0, 2000) : undefined,
  };
  if (!input.keywordPrimary) return NextResponse.json({ error: 'keywordPrimary required' }, { status: 400 });

  // Call Claude — Opus for quality here since it's one article at a time.
  let result;
  try {
    result = await callClaude<any>(buildContentPrompt(input), {
      model: 'quality',
      systemPrompt: CONTENT_SYSTEM_PROMPT,
      expectJson: true,
      maxTokens: 8192,
    });
  } catch (e: any) {
    console.error('[seo-os/content] Claude call threw:', e?.message, e?.stack);
    return NextResponse.json({ error: `Claude call failed: ${e?.message || String(e)}` }, { status: 502 });
  }
  const gen = result.json;
  if (!gen || !gen.title || !gen.bodyHtml) {
    console.error('[seo-os/content] Unparseable JSON. Raw response:\n', result.text);
    return NextResponse.json({
      error: 'Model returned unparseable JSON — try again or narrow the prompt.',
      raw: result.text.slice(0, 2000),
    }, { status: 500 });
  }

  try {
    const doc: Record<string, any> = {
      kind: body.kind === 'gbp_post' ? 'gbp_post' : 'blog',
      status: 'draft',
      title: String(gen.title).slice(0, 160),
      slug: String(gen.slug || slugify(gen.title)).slice(0, 200),
      excerpt: String(gen.excerpt || '').slice(0, 500),
      bodyHtml: String(gen.bodyHtml),
      target: {
        city: input.city,
        propertyType: input.propertyType,
        priceRange: input.priceRange,
        keywordPrimary: input.keywordPrimary,
        keywordSecondary: input.keywordSecondary,
      },
      aiModel: result.model,
      promptVersion: PROMPT_VERSION,
      sourceCalendarItemId: body.calendarItemId ? String(body.calendarItemId) : null,
      generatedAt: new Date().toISOString(),
      aeoDirectAnswerBlocks: Number(gen.aeoDirectAnswerBlocks || 0),
      geoReadinessScore: Number(gen.geoReadinessScore || 0),
      tenantId: 'indibrick',
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      // Cost tracking — stamped on every generated doc so the dashboard
      // running-total is just a sum() query, no separate ledger.
      generationInputTokens: result.inputTokens,
      generationOutputTokens: result.outputTokens,
      generationCostUsd: result.estimatedCostUsd,
      generationLatencyMs: result.latencyMs,
    };

    // Firestore rejects `undefined` values — scrub them from optional
    // fields that may not be set on any given generation.
    scrubUndefined(doc);
    scrubUndefined(doc.target);

    const errors = validateSeoContent(doc);
    if (errors.length > 0) {
      return NextResponse.json({ errors, generated: doc }, { status: 400 });
    }

    const ref = await adminDb.collection('seoContent').add(doc);

    // If this generation was spawned from a calendar item, link back.
    if (body.calendarItemId) {
      try {
        await adminDb.collection('seoCalendar').doc(String(body.calendarItemId))
          .update({ linkedContentId: ref.id, updatedAt: FieldValue.serverTimestamp() });
      } catch { /* best-effort */ }
    }

    return NextResponse.json({ id: ref.id, ...doc, generationCostUsd: result.estimatedCostUsd });
  } catch (e: any) {
    console.error('[seo-os/content] doc build/write failed:', e?.message, e?.stack);
    return NextResponse.json({ error: e?.message || 'Write failed' }, { status: 500 });
  }
}

// Firestore's Admin SDK throws on `undefined` field values. Drop
// them recursively so an unset optional (e.g. no city passed) doesn't
// blow up the write.
function scrubUndefined(o: Record<string, any> | undefined): void {
  if (!o || typeof o !== 'object') return;
  for (const k of Object.keys(o)) {
    if (o[k] === undefined) delete o[k];
    else if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) scrubUndefined(o[k]);
  }
}

function slugify(s: string): string {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}
