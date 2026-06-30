import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// One-shot cleanup endpoint for CSV-imported duplicates. Groups
// CSV-imported referrals (and the matching leads docs) by (phone, email),
// keeps the OLDEST in each group, deletes the rest.
//
// Two modes:
//   POST /api/admin/dedupe-leads          → delete duplicates
//   POST /api/admin/dedupe-leads?preview  → return the count without deleting

function normPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

function normEmail(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

// CSV-only scope: leaves organic web leads and partner-injected referrals alone.
function isCsvImported(d: any): boolean {
  return d?.referrerId === 'CSV_IMPORT' || d?.type === 'CSV Upload';
}

// Cross-source scope: every referral is in play. Used when a CSV upload
// duplicated into both CSV-tagged AND web-inbound records, so the dedupe
// has to match across origin tags.
function isAnyReferral(_d: any): boolean {
  return true;
}

async function deleteInChunks(refs: FirebaseFirestore.DocumentReference[]) {
  // Firestore batch limit is 500 ops. Use 450 as a safety margin.
  for (let i = 0; i < refs.length; i += 450) {
    const slice = refs.slice(i, i + 450);
    const batch = adminDb!.batch();
    slice.forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { adminKey } = body || {};
    const url = new URL(request.url);
    const preview = url.searchParams.has('preview');
    // When ?all=1, scan every referral regardless of referrerId — needed when
    // CSV uploads also created duplicate "web inbound" referrals.
    const scopeAll = url.searchParams.get('all') === '1';
    const inScope = scopeAll ? isAnyReferral : isCsvImported;

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin Key' }, { status: 401 });
    }
    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 1. Group CSV-imported referrals by (phone, email). Keep the oldest in
    //    each group, mark every other doc for deletion.
    const referralsSnap = await adminDb.collection('referrals').get();
    const groups = new Map<string, { id: string; ts: number; leadId?: string }[]>();

    referralsSnap.forEach((doc) => {
      const d = doc.data() as any;
      if (!inScope(d)) return;
      const p = normPhone(d.clientPhone || '');
      const e = normEmail(d.clientEmail || '');
      if (!p || !e) return; // require BOTH per chosen dedupe policy
      const key = `${p}|${e}`;
      const ts = Date.parse(d.referralDate || '') || 0;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ id: doc.id, ts, leadId: d.leadId });
    });

    const referralsToDelete: FirebaseFirestore.DocumentReference[] = [];
    const leadsToDelete: FirebaseFirestore.DocumentReference[] = [];
    let groupsWithDupes = 0;

    groups.forEach((arr) => {
      if (arr.length < 2) return;
      groupsWithDupes++;
      // Oldest first — that one survives, the rest go.
      arr.sort((a, b) => a.ts - b.ts);
      const toRemove = arr.slice(1);
      toRemove.forEach((r) => {
        referralsToDelete.push(adminDb!.collection('referrals').doc(r.id));
        if (r.leadId) leadsToDelete.push(adminDb!.collection('leads').doc(r.leadId));
      });
    });

    if (preview) {
      return NextResponse.json({
        preview: true,
        groupsWithDupes,
        referralsToDelete: referralsToDelete.length,
        leadsToDelete: leadsToDelete.length,
        message: `Found ${groupsWithDupes} duplicate group${groupsWithDupes === 1 ? '' : 's'} — ${referralsToDelete.length} referral${referralsToDelete.length === 1 ? '' : 's'} + ${leadsToDelete.length} lead${leadsToDelete.length === 1 ? '' : 's'} would be removed.`,
      });
    }

    await deleteInChunks(referralsToDelete);
    await deleteInChunks(leadsToDelete);

    return NextResponse.json({
      success: true,
      groupsWithDupes,
      referralsDeleted: referralsToDelete.length,
      leadsDeleted: leadsToDelete.length,
      message: `Removed ${referralsToDelete.length} duplicate referral${referralsToDelete.length === 1 ? '' : 's'} and ${leadsToDelete.length} duplicate lead${leadsToDelete.length === 1 ? '' : 's'} across ${groupsWithDupes} group${groupsWithDupes === 1 ? '' : 's'}.`,
    });

  } catch (error: any) {
    console.error('Dedupe Leads Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
