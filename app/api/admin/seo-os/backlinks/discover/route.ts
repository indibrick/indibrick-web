// Discover backlink prospects for a target page.
//
// Calls Claude with web_search enabled — real search hits, real
// pages. No fabricated DR / traffic numbers; anything the model
// doesn't have a source for gets nulled at write time.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { callClaude } from '@/lib/anthropicClient';
import { BACKLINK_SYSTEM_PROMPT, buildBacklinkDiscoveryPrompt } from '@/lib/seoContentPrompts';
import { validateBacklinkTarget } from '@/lib/backlinkShape';

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  const ourUrl = String(body?.ourUrl || '').trim();
  const topic = String(body?.topic || '').trim();
  const maxProspects = Math.min(20, Math.max(1, Number(body?.maxProspects || 10)));
  if (!ourUrl || !topic) return NextResponse.json({ error: 'ourUrl and topic required' }, { status: 400 });
  try { new URL(ourUrl); } catch { return NextResponse.json({ error: 'ourUrl must be absolute' }, { status: 400 }); }

  const discoveryRunId = `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  let result;
  try {
    result = await callClaude<any[]>(buildBacklinkDiscoveryPrompt({ ourUrl, topic, maxProspects }), {
      model: 'quality',
      systemPrompt: BACKLINK_SYSTEM_PROMPT,
      webSearch: true,
      expectJson: true,
      maxTokens: 4096,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Claude call failed: ${e?.message}` }, { status: 502 });
  }

  const arr = Array.isArray(result.json) ? result.json : [];
  if (arr.length === 0) {
    return NextResponse.json({
      error: 'No prospects returned — try a broader topic or run again.',
      raw: result.text.slice(0, 1000),
    }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  let written = 0;
  const dupes: string[] = [];
  const errors: string[] = [];

  for (const p of arr) {
    // Skip duplicates by (url, targetOurUrl).
    const url = String(p.url || '').trim();
    if (!url) continue;
    const dupSnap = await adminDb.collection('backlinkTargets')
      .where('url', '==', url).where('targetOurUrl', '==', ourUrl).limit(1).get();
    if (!dupSnap.empty) { dupes.push(url); continue; }

    let domain = '';
    try { domain = new URL(url).host; } catch { continue; }

    const doc: Record<string, any> = {
      url,
      domain,
      prospectType: ['guest_post', 'resource_link', 'citation', 'directory'].includes(p.prospectType)
        ? p.prospectType : 'guest_post',
      reviewStatus: 'new',
      topicFitScore: Math.max(0, Math.min(100, Number(p.topicFitScore || 0))),
      anchorSafetyScore: Math.max(0, Math.min(100, Number(p.anchorSafetyScore || 0))),
      pageRelevanceScore: Math.max(0, Math.min(100, Number(p.pageRelevanceScore || 0))),
      // Never trust model-provided metrics. Only accept explicit
      // sourced numbers via a future integration.
      domainRating: null,
      monthlyOrganicTraffic: null,
      metricsSource: null,
      targetOurUrl: ourUrl,
      agentNotes: p.agentNotes ? String(p.agentNotes).slice(0, 500) : '',
      discoveredAt: nowIso,
      discoveryRunId,
      discoveredBy: uid,
      tenantId: 'indibrick',
    };
    const errs = validateBacklinkTarget(doc);
    if (errs.length > 0) { errors.push(...errs); continue; }

    await adminDb.collection('backlinkTargets').add(doc);
    written += 1;
  }

  return NextResponse.json({
    discoveryRunId,
    written,
    duplicatesSkipped: dupes.length,
    validationErrors: errors,
    webSearchCalls: result.webSearchCalls,
    costUsd: result.estimatedCostUsd,
    model: result.model,
  });
}
