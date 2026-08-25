// Turn a calendar item into a content draft.
//
// Only meaningful for 'blog' + 'gbp_post' types. Reuses the same
// Claude generator as POST /content by proxying the calendar item's
// target fields into a content generation request. Writes the new
// draft, links back onto the calendar item's linkedContentId, and
// marks the calendar item 'in_progress'.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { callClaude } from '@/lib/anthropicClient';
import { CONTENT_SYSTEM_PROMPT, PROMPT_VERSION, buildContentPrompt } from '@/lib/seoContentPrompts';
import { validateSeoContent } from '@/lib/seoContentShape';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const itemRef = adminDb.collection('seoCalendar').doc(params.id);
  const snap = await itemRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'Calendar item not found' }, { status: 404 });
  const item = snap.data() as any;

  if (item.type !== 'blog' && item.type !== 'gbp_post') {
    return NextResponse.json({
      error: `Can only spawn content for blog / gbp_post types — this item is ${item.type}.`,
    }, { status: 400 });
  }
  if (item.linkedContentId) {
    return NextResponse.json({
      error: 'Content already spawned. Open the linked draft instead.',
      contentId: item.linkedContentId,
    }, { status: 409 });
  }

  const keywordPrimary = item.target?.keywordPrimary || item.title;
  if (!keywordPrimary) return NextResponse.json({ error: 'No keyword or title on item.' }, { status: 400 });

  let result;
  try {
    result = await callClaude<any>(buildContentPrompt({
      keywordPrimary,
      city: item.target?.city,
      propertyType: item.target?.propertyType,
      priceRange: item.target?.priceRange,
      extraContext: item.brief,
    }), {
      model: 'quality',
      systemPrompt: CONTENT_SYSTEM_PROMPT,
      expectJson: true,
      maxTokens: 8192,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Claude call failed: ${e?.message}` }, { status: 502 });
  }
  const gen = result.json;
  if (!gen || !gen.title || !gen.bodyHtml) {
    return NextResponse.json({
      error: 'Model returned unparseable JSON — try again.',
      raw: result.text.slice(0, 1000),
    }, { status: 500 });
  }

  const doc: Record<string, any> = {
    kind: item.type === 'gbp_post' ? 'gbp_post' : 'blog',
    status: 'draft',
    title: String(gen.title).slice(0, 160),
    slug: String(gen.slug || slugify(gen.title)).slice(0, 200),
    excerpt: String(gen.excerpt || '').slice(0, 500),
    bodyHtml: String(gen.bodyHtml),
    target: {
      city: item.target?.city,
      propertyType: item.target?.propertyType,
      priceRange: item.target?.priceRange,
      keywordPrimary,
    },
    aiModel: result.model,
    promptVersion: PROMPT_VERSION,
    sourceCalendarItemId: params.id,
    generatedAt: new Date().toISOString(),
    aeoDirectAnswerBlocks: Number(gen.aeoDirectAnswerBlocks || 0),
    geoReadinessScore: Number(gen.geoReadinessScore || 0),
    tenantId: 'indibrick',
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    generationInputTokens: result.inputTokens,
    generationOutputTokens: result.outputTokens,
    generationCostUsd: result.estimatedCostUsd,
    generationLatencyMs: result.latencyMs,
  };
  // Firestore Admin SDK throws on `undefined` field values — scrub before write.
  const scrub = (o: any) => { if (!o || typeof o !== 'object') return; for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]; };
  scrub(doc); scrub(doc.target);

  const errors = validateSeoContent(doc);
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 400 });

  const contentRef = await adminDb.collection('seoContent').add(doc);
  await itemRef.update({
    linkedContentId: contentRef.id,
    status: 'in_progress',
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ contentId: contentRef.id, costUsd: result.estimatedCostUsd });
}

function slugify(s: string): string {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}
