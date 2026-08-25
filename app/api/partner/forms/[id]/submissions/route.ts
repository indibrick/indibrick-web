// List submissions for a form (admin only).
//
// Supports paged read + a CSV export when `?export=csv` is passed —
// gives the realtor a way to bulk-download historical submissions for
// their own records / their accountant / dispute resolution.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return '';
  // Collect all keys observed across payloads plus a fixed frame.
  const frame = ['submittedAt', 'dedupePolicy', 'dedupedInto', 'ip'];
  const payloadKeys = new Set<string>();
  rows.forEach(r => {
    const p = r.payload || {};
    for (const k of Object.keys(p)) payloadKeys.add(k);
  });
  const headers = [...frame, ...Array.from(payloadKeys).map(k => `payload.${k}`)];
  const escape = (v: any) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const r of rows) {
    const row: string[] = [];
    for (const h of headers) {
      if (h.startsWith('payload.')) row.push(escape((r.payload || {})[h.slice(8)]));
      else row.push(escape(r[h]));
    }
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAuth(req, { roles: ['admin', 'internal_agent'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const formSnap = await adminDb.collection('forms').doc(params.id).get();
  if (!formSnap.exists) return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  const slug = (formSnap.data() as any)?.slug as string | undefined;
  if (!slug) return NextResponse.json({ error: 'Form missing slug' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const asCsv = searchParams.get('export') === 'csv';
  const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') || (asCsv ? 500 : 100))));

  const snap = await adminDb.collection('form_submissions')
    .where('formSlug', '==', slug)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (asCsv) {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}-submissions.csv"`,
      },
    });
  }
  return NextResponse.json({ submissions: rows });
}
