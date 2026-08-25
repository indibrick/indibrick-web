// Bulk CSV import for /referrals.
//
// The client posts a JSON array of projected rows (already parsed +
// mapped in the browser via lib/csvImport.ts). Server side we:
//   1. Dedupe against existing referrals by (clientEmail, clientPhone)
//   2. Batch-write in chunks of 400 (Firestore commit ceiling is 500)
//   3. Stamp assignedAgentId to the caller (or ADMIN_INBOX per row)
//   4. Return counts for the UI to render a summary
//
// The rules engine gets triggered by each created doc → user
// workflows fire, notifications land, insurance opportunities open
// automatically when the imported deals hit Funded status downstream.
// _systemUpdate is deliberately NOT set: an imported deal SHOULD be
// evaluated by rules on subsequent user activity, and the rules
// engine's initial-state gates prevent spurious fires on the create.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';

const MAX_ROWS = 5000;

interface ImportRow {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  status?: string;
  notes?: string;
  dealType?: string;
  leadTag?: string;
  loanAmount?: number;
  referralSource?: string;
}

interface ImportResult {
  received: number;
  imported: number;
  skippedDupes: number;
  skippedInvalid: number;
  skippedReasons: string[];
  createdIds: string[];
}

function normalizePhone(raw?: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}
function normalizeEmail(raw?: string): string {
  return String(raw || '').trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin', 'internal_agent'] });
  if (!guard.ok) return guard.response;
  const { uid, email } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: 'rows must be an array' }, { status: 400 });
  }
  const rows: ImportRow[] = body.rows;
  if (rows.length === 0) return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Import capped at ${MAX_ROWS} rows per batch. Split into multiple imports.` }, { status: 400 });
  }

  const assignToSelf = body.assignToSelf !== false;
  const defaultDealType = String(body.defaultDealType || 'Mortgage');
  const defaultStatus = String(body.defaultStatus || 'New');
  const defaultTag = body.defaultTag ? String(body.defaultTag).slice(0, 60) : null;

  // Dedup: build a set of existing (email, phone) so we skip rows
  // that already exist. Limit scan to 5000 recent — realtor imports
  // are new-book onboarding, not merging against a huge existing set.
  // A future perf pass moves this to a per-key lookup.
  const existingSnap = await adminDb.collection('referrals')
    .orderBy('referralDate', 'desc').limit(5000).get();
  const existingEmails = new Set<string>();
  const existingPhones = new Set<string>();
  existingSnap.forEach(d => {
    const data = d.data();
    const e = normalizeEmail(data.clientEmail);
    const p = normalizePhone(data.clientPhone);
    if (e) existingEmails.add(e);
    if (p) existingPhones.add(p);
  });

  const result: ImportResult = {
    received: rows.length,
    imported: 0,
    skippedDupes: 0,
    skippedInvalid: 0,
    skippedReasons: [],
    createdIds: [],
  };

  const nowIso = new Date().toISOString();
  let batch = adminDb.batch();
  let batchCount = 0;

  for (const row of rows) {
    const name = String(row.clientName || '').trim();
    const emailN = normalizeEmail(row.clientEmail);
    const phoneN = normalizePhone(row.clientPhone);
    if (!name && !emailN && !phoneN) {
      result.skippedInvalid += 1;
      continue;
    }
    if (!name) {
      result.skippedInvalid += 1;
      if (result.skippedReasons.length < 6) result.skippedReasons.push('Missing name');
      continue;
    }
    // Dedup by email OR phone match against existing.
    if ((emailN && existingEmails.has(emailN)) || (phoneN && existingPhones.has(phoneN))) {
      result.skippedDupes += 1;
      continue;
    }
    // Also dedup within this batch — importing the same lead twice
    // in one file is common (agents export from multiple sources).
    if (emailN) existingEmails.add(emailN);
    if (phoneN) existingPhones.add(phoneN);

    const ref = adminDb.collection('referrals').doc();
    const doc: Record<string, any> = {
      clientName: name,
      clientEmail: emailN || '',
      clientPhone: phoneN || '',
      referrerId: uid,
      referrerName: email || 'CSV Import',
      assignedAgentId: assignToSelf ? uid : 'ADMIN_INBOX',
      assignedAgentName: assignToSelf ? (email || 'Import') : 'Admin Triage',
      status: row.status || defaultStatus,
      dealType: row.dealType || defaultDealType,
      dealCategory: 'potential',
      notes: row.notes || '',
      leadTag: row.leadTag || defaultTag,
      loanAmount: row.loanAmount || 0,
      callCount: 0,
      referralDate: nowIso,
      referralSource: row.referralSource || 'CSV Import',
      type: 'CSV Import',
      participants: [],
      participantIds: [],
      pushedForMortgage: true,
      importedBy: uid,
      importedAt: nowIso,
      timeline: [{
        type: 'system',
        author: 'System',
        content: `📥 Imported via CSV (${row.referralSource || 'unknown source'}).`,
        timestamp: nowIso,
        isSystemMessage: true,
      }],
      createdAt: FieldValue.serverTimestamp(),
    };
    batch.set(ref, doc);
    result.createdIds.push(ref.id);
    batchCount += 1;
    result.imported += 1;

    if (batchCount >= 400) {
      await batch.commit();
      batch = adminDb.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();

  return NextResponse.json(result);
}
