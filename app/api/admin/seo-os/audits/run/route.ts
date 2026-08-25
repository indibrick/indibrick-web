// Run an audit on one URL. Writes the result + auto-upserts calendar
// fix items for each open issue. Idempotent per (url, issueCode) so
// re-runs don't multiply items.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { runAudit } from '@/lib/seoAuditRunner';

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  const url = String(body?.url || '').trim();
  const skipAeo = !!body?.skipAeo;
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  try { new URL(url); } catch { return NextResponse.json({ error: 'url must be absolute' }, { status: 400 }); }

  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  let result;
  try {
    result = await runAudit({ url, runId, triggeredBy: uid, skipAeoCall: skipAeo });
  } catch (e: any) {
    return NextResponse.json({ error: `Audit failed: ${e?.message || String(e)}` }, { status: 500 });
  }

  // Persist audit doc.
  const auditRef = await adminDb.collection('seoAudits').add({
    ...result,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Auto-upsert calendar fix items for each issue. Key: (url, code).
  // Firestore doesn't have a native "upsert on composite key" — we
  // query by both, and set or update.
  const spawnedIds: string[] = [];
  for (const issue of result.issues) {
    if (issue.severity === 'low') continue; // don't spam the calendar with low-severity items
    try {
      const existingSnap = await adminDb.collection('seoCalendar')
        .where('target.url', '==', url)
        .where('linkedAuditIssueCode', '==', issue.code)
        .where('status', 'in', ['pending', 'in_progress'])
        .limit(1).get();

      const nowTs = FieldValue.serverTimestamp();
      const scheduledDate = new Date().toISOString().slice(0, 10);
      const doc = {
        type: 'fix',
        status: 'pending',
        source: 'audit_derived',
        scheduledDate,
        title: `Fix (${issue.dimension}/${issue.severity}): ${issue.message.slice(0, 180)}`,
        brief: issue.suggestion || issue.message,
        target: { url },
        linkedAuditId: auditRef.id,
        linkedAuditIssueCode: issue.code,
        createdBy: uid,
        createdAt: nowTs,
        updatedAt: nowTs,
        tenantId: 'indibrick',
      };
      if (existingSnap.empty) {
        const ref = await adminDb.collection('seoCalendar').add(doc);
        spawnedIds.push(ref.id);
      } else {
        // Refresh the existing item's audit link but leave status alone.
        await existingSnap.docs[0].ref.update({
          linkedAuditId: auditRef.id,
          updatedAt: nowTs,
        });
        spawnedIds.push(existingSnap.docs[0].id);
      }
    } catch (e) {
      console.warn('[audits/run] fix item upsert failed', e);
    }
  }

  await auditRef.update({ spawnedCalendarItemIds: spawnedIds });

  return NextResponse.json({
    auditId: auditRef.id,
    result: { ...result, spawnedCalendarItemIds: spawnedIds },
  });
}
