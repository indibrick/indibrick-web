// Referrals visible to the caller by way of team membership — i.e.
// deals owned or assigned to any teammate (owner OR fellow member).
//
// This is a supplemental read path for the UI. The classic "my
// deals" pipeline still comes from the existing Firestore
// subscription in useCRMData. Wave J-2 adds this endpoint so the
// shell can layer a "Team deals" strip on top without touching the
// legacy subscription paths.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { resolveTeamVisibleUids } from '@/lib/teamVisibility';

const MAX_ROWS = 500;

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const teamUids = await resolveTeamVisibleUids(uid);
  // Exclude the caller themselves — their own deals already surface
  // via the standard pipeline read.
  const otherUids = teamUids.filter(u => u !== uid);
  if (otherUids.length === 0) return NextResponse.json({ referrals: [], teamUids });

  // Firestore `in` is capped at 30. Chunk if we ever cross that.
  const chunks: string[][] = [];
  for (let i = 0; i < otherUids.length; i += 30) chunks.push(otherUids.slice(i, i + 30));

  const seen = new Set<string>();
  const rows: any[] = [];

  for (const chunk of chunks) {
    const [assignedSnap, referredSnap] = await Promise.all([
      adminDb.collection('referrals').where('assignedAgentId', 'in', chunk).limit(MAX_ROWS).get(),
      adminDb.collection('referrals').where('referrerId', 'in', chunk).limit(MAX_ROWS).get(),
    ]);
    for (const d of assignedSnap.docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      rows.push({ id: d.id, ...(d.data() as any) });
    }
    for (const d of referredSnap.docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      rows.push({ id: d.id, ...(d.data() as any) });
    }
    if (rows.length >= MAX_ROWS) break;
  }

  rows.sort((a, b) => String(b.referralDate || '').localeCompare(String(a.referralDate || '')));
  return NextResponse.json({ referrals: rows.slice(0, MAX_ROWS), teamUids });
}
