// Generate a 30-day (or arbitrary) calendar from a keyword list.
// Uses Sonnet for cost — one call, up to N items back.
//
// Idempotency: every item stamped with a `generationRunId` so if the
// operator hits generate twice for the same batch we don't double-write.
// The runId is client-provided; the UI generates a uuid before submit.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { callClaude } from '@/lib/anthropicClient';
import { PROMPT_VERSION, buildCalendarPrompt, type CalendarGenerationInput } from '@/lib/seoContentPrompts';
import { validateCalendarItem } from '@/lib/seoCalendarShape';

const MAX_ITEMS = 60;

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const keywords: string[] = Array.isArray(body.keywords)
    ? body.keywords.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 30)
    : [];
  if (keywords.length === 0) return NextResponse.json({ error: 'keywords required (1-30)' }, { status: 400 });

  const startDate = String(body.startDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json({ error: 'startDate must be YYYY-MM-DD' }, { status: 400 });
  }
  const daysCount = Math.min(MAX_ITEMS, Math.max(1, Number(body.daysCount || 30)));
  const generationRunId = String(body.generationRunId || `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  // Idempotency check — if this runId already produced items, return them.
  const existing = await adminDb.collection('seoCalendar')
    .where('generationRunId', '==', generationRunId).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ generationRunId, note: 'already generated', existingCount: existing.size });
  }

  const input: CalendarGenerationInput = {
    keywords,
    startDate,
    daysCount,
    brokerageContext: body.brokerageContext ? String(body.brokerageContext).slice(0, 500) : undefined,
  };

  let result;
  try {
    result = await callClaude<any[]>(buildCalendarPrompt(input), {
      model: 'balanced',
      expectJson: true,
      maxTokens: 8192,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Claude call failed: ${e?.message}` }, { status: 502 });
  }
  const arr = Array.isArray(result.json) ? result.json : [];
  if (arr.length === 0) {
    return NextResponse.json({
      error: 'Model returned no items — try again.',
      raw: result.text.slice(0, 1000),
    }, { status: 500 });
  }

  const nowTs = FieldValue.serverTimestamp();
  let written = 0;
  const errors: string[] = [];

  const batch = adminDb.batch();
  for (const item of arr.slice(0, MAX_ITEMS)) {
    const doc: Record<string, any> = {
      type: item.type || 'blog',
      status: 'pending',
      source: 'ai_generated',
      scheduledDate: String(item.scheduledDate || startDate).slice(0, 10),
      title: String(item.title || '').slice(0, 240),
      brief: item.brief ? String(item.brief).slice(0, 2000) : '',
      // Firestore Admin SDK throws on `undefined` — omit target entirely when absent.
      ...(item.target ? { target: item.target } : {}),
      generationRunId,
      promptVersion: PROMPT_VERSION,
      createdBy: uid,
      createdAt: nowTs,
      updatedAt: nowTs,
      tenantId: 'indibrick',
    };
    const errs = validateCalendarItem(doc);
    if (errs.length > 0) { errors.push(...errs); continue; }
    const ref = adminDb.collection('seoCalendar').doc();
    batch.set(ref, doc);
    written += 1;
  }
  if (written === 0) return NextResponse.json({ error: 'All items failed validation', errors }, { status: 500 });
  await batch.commit();

  return NextResponse.json({
    generationRunId,
    written,
    validationErrors: errors,
    costUsd: result.estimatedCostUsd,
    model: result.model,
  });
}
