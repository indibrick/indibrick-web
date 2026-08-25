// Partner data export.
//
// Every partner can pull their own book of business — referrals,
// messages (SMS/calls), tasks, and their sender identity — as either
// JSON (default) or CSV per collection.
//
// CASL / data-portability posture: if a partner asks us to hand back
// what we have on them, this is the endpoint. Also useful for
// migrating off (which we should support without friction — user was
// explicit about "the tech being perfect").
//
// Admins can pass ?uid=X to export any partner's data.
//
// Query:
//   ?format=json | csv   (default json)
//   ?collection=referrals | messages | tasks | all   (default all)
//   ?uid=<uid>           (admin-only override)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { toCsv } from '@/lib/csvExport';

const MAX_PER_COLLECTION = 20000;

function csvOr(rows: Array<Record<string, any>>, columns: string[] | undefined, format: 'json' | 'csv'): string {
  if (format === 'csv') return toCsv(rows, columns);
  return JSON.stringify(rows, null, 2);
}

function normalize(doc: Record<string, any>): Record<string, any> {
  // Flatten Firestore Timestamp-ish shapes so CSV / JSON both stay
  // readable. Anything with a toDate() (server SDK Timestamp) or
  // {_seconds} (from REST) → ISO string.
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v && typeof v === 'object') {
      if (typeof (v as any).toDate === 'function') { out[k] = (v as any).toDate().toISOString(); continue; }
      if ('_seconds' in (v as any)) { out[k] = new Date((v as any)._seconds * 1000).toISOString(); continue; }
    }
    out[k] = v;
  }
  return out;
}

async function loadReferrals(uid: string): Promise<any[]> {
  if (!adminDb) return [];
  const seen = new Set<string>();
  const rows: any[] = [];
  const assigned = await adminDb.collection('referrals')
    .where('assignedAgentId', '==', uid).limit(MAX_PER_COLLECTION).get();
  for (const d of assigned.docs) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    rows.push({ id: d.id, ...normalize(d.data() as any) });
  }
  const referred = await adminDb.collection('referrals')
    .where('referrerId', '==', uid).limit(MAX_PER_COLLECTION).get();
  for (const d of referred.docs) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    rows.push({ id: d.id, ...normalize(d.data() as any) });
  }
  return rows;
}

async function loadMessages(referralIds: string[]): Promise<any[]> {
  if (!adminDb || referralIds.length === 0) return [];
  // Firestore `in` maxes at 30 values; chunk.
  const rows: any[] = [];
  for (let i = 0; i < referralIds.length; i += 30) {
    const chunk = referralIds.slice(i, i + 30);
    const snap = await adminDb.collection('messages')
      .where('referralId', 'in', chunk)
      .limit(MAX_PER_COLLECTION).get();
    for (const d of snap.docs) rows.push({ id: d.id, ...normalize(d.data() as any) });
    if (rows.length >= MAX_PER_COLLECTION) break;
  }
  return rows;
}

async function loadTasks(uid: string): Promise<any[]> {
  if (!adminDb) return [];
  const rows: any[] = [];
  // Tasks can be either owned or assigned; union.
  try {
    const owned = await adminDb.collection('tasks')
      .where('ownerUid', '==', uid).limit(MAX_PER_COLLECTION).get();
    for (const d of owned.docs) rows.push({ id: d.id, ...normalize(d.data() as any) });
  } catch { /* collection may not exist yet */ }
  try {
    const assignedTo = await adminDb.collection('tasks')
      .where('assignedToUid', '==', uid).limit(MAX_PER_COLLECTION).get();
    const seen = new Set(rows.map(r => r.id));
    for (const d of assignedTo.docs) {
      if (!seen.has(d.id)) rows.push({ id: d.id, ...normalize(d.data() as any) });
    }
  } catch { /* collection may not exist yet */ }
  return rows;
}

// Explicit CSV column lists so exports are stable across schema drift.
// Extra unknown fields on a doc still land in JSON but are omitted from
// CSV headers to keep column count sane for spreadsheet imports.
const REFERRAL_COLS = [
  'id', 'referralDate', 'clientName', 'clientEmail', 'clientPhone',
  'dealType', 'status', 'loanAmount', 'expectedCommission',
  'assignedAgentId', 'assignedAgentName', 'referrerId', 'referrerName',
  'callCount', 'lastUpdated',
];
const MESSAGE_COLS = [
  'id', 'referralId', 'channel', 'direction', 'body', 'clientPhone',
  'senderEmail', 'status', 'durationSeconds', 'recordingUrl', 'createdAt',
];
const TASK_COLS = [
  'id', 'title', 'description', 'status', 'ownerUid', 'assignedToUid',
  'dueAt', 'referralId', 'createdAt', 'completedAt',
];

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'json').toLowerCase() as 'json' | 'csv';
  const collection = (searchParams.get('collection') || 'all').toLowerCase();
  const overrideUid = searchParams.get('uid');

  let uid = guard.session.uid;
  if (overrideUid && overrideUid !== uid) {
    if (guard.session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    uid = overrideUid;
  }

  // Sender identity is small enough to always include.
  const userSnap = await adminDb.collection('users').doc(uid).get();
  const senderIdentity = userSnap.exists ? (userSnap.data()?.senderIdentity || null) : null;

  const wantAll = collection === 'all';
  const wantRef = wantAll || collection === 'referrals';
  const wantMsg = wantAll || collection === 'messages';
  const wantTask = wantAll || collection === 'tasks';

  const referrals = wantRef ? await loadReferrals(uid) : [];
  const messages = wantMsg
    ? await loadMessages(wantRef ? referrals.map(r => r.id) : (await loadReferrals(uid)).map(r => r.id))
    : [];
  const tasks = wantTask ? await loadTasks(uid) : [];

  // Single-collection CSV → return raw text. Multi-collection CSV
  // returns a JSON envelope with pre-serialized CSV strings — a
  // single .csv file can't hold multiple tables. This preserves
  // scriptable access for callers who want CSVs of each.
  if (format === 'csv' && !wantAll) {
    let body = '';
    let filename = 'export.csv';
    if (wantRef)      { body = csvOr(referrals, REFERRAL_COLS, 'csv'); filename = 'referrals.csv'; }
    else if (wantMsg) { body = csvOr(messages, MESSAGE_COLS, 'csv'); filename = 'messages.csv'; }
    else if (wantTask){ body = csvOr(tasks, TASK_COLS, 'csv'); filename = 'tasks.csv'; }
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  const payload: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    uid,
    senderIdentity,
    counts: {
      referrals: referrals.length,
      messages: messages.length,
      tasks: tasks.length,
    },
  };
  if (format === 'csv') {
    payload.csv = {
      referrals: wantRef ? toCsv(referrals, REFERRAL_COLS) : null,
      messages: wantMsg ? toCsv(messages, MESSAGE_COLS) : null,
      tasks: wantTask ? toCsv(tasks, TASK_COLS) : null,
    };
  } else {
    if (wantRef) payload.referrals = referrals;
    if (wantMsg) payload.messages = messages;
    if (wantTask) payload.tasks = tasks;
  }

  return NextResponse.json(payload);
}
