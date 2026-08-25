// Return the most recent run summary — powers the dashboard header
// "last run" strip without scanning /aiCitations.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { configuredEngines } from '@/lib/citationEngines/index';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('aiCitationRuns')
    .orderBy('startedAt', 'desc').limit(1).get();
  const lastRun = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };

  // Also expose which engines are configured on this instance so the
  // dashboard can surface "chatgpt: no API key set" chips.
  return NextResponse.json({
    lastRun,
    configuredEngines: configuredEngines(),
  });
}
