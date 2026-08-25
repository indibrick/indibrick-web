// Unified conversation feed for one referral. Merges:
//   - SMS + call rows from /messages
//   - Email rows from /mail (matched on client email in `to`)
//   - Human/system notes from referral.timeline (call outcomes, stage
//     changes, assignments) — flattened into the same stream so the
//     UI never needs three tabs
//
// Sorted newest-first. Capped at 200 rows total. Access-checked
// against the caller.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { resolveTeamVisibleUids, isReferralVisibleToTeam } from '@/lib/teamVisibility';

interface TimelineRow {
  id: string;
  kind: 'sms' | 'call' | 'email' | 'note' | 'system';
  direction?: 'inbound' | 'outbound' | null;
  at: string;            // ISO — normalized sort key
  from?: string | null;
  to?: string | null;
  subject?: string | null;
  body?: string | null;
  status?: string | null;
  meta?: Record<string, any>;
}

function tsToIso(v: any): string {
  if (!v) return new Date(0).toISOString();
  if (typeof v === 'string') return v;
  if (v.toDate) return v.toDate().toISOString();
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  return new Date(0).toISOString();
}

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const referralId = String(searchParams.get('referralId') || '');
  if (!referralId) return NextResponse.json({ error: 'referralId required' }, { status: 400 });

  const refSnap = await adminDb.collection('referrals').doc(referralId).get();
  if (!refSnap.exists) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
  const referral = refSnap.data() || {};
  let isOn =
    referral.referrerId === uid ||
    referral.assignedAgentId === uid ||
    (Array.isArray(referral.participantIds) && referral.participantIds.includes(uid));
  if (!isOn && role !== 'admin') {
    const teamUids = await resolveTeamVisibleUids(uid);
    isOn = isReferralVisibleToTeam(uid, teamUids, referral as any);
  }
  if (!isOn && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const clientEmail = String(referral.clientEmail || '').trim().toLowerCase();

  // 1) /messages — SMS + calls in one collection already.
  const msgSnap = await adminDb.collection('messages')
    .where('referralId', '==', referralId)
    .orderBy('createdAt', 'desc')
    .limit(150)
    .get();

  // 2) /mail — only meaningful if the referral has an email. Query
  //    on `to` array-contains for exact matches; caller queues mail
  //    with `to: [clientEmail]` in mass-send + drip runner.
  let mailDocs: any[] = [];
  if (clientEmail) {
    const mailSnap = await adminDb.collection('mail')
      .where('to', 'array-contains', clientEmail)
      .limit(150)
      .get();
    mailDocs = mailSnap.docs;
  }

  const rows: TimelineRow[] = [];

  for (const d of msgSnap.docs) {
    const m = d.data() as any;
    const kind: TimelineRow['kind'] = m.channel === 'call' ? 'call' : 'sms';
    rows.push({
      id: d.id,
      kind,
      direction: m.direction || null,
      at: tsToIso(m.createdAt),
      from: m.senderEmail || m.agentPhone || null,
      to: m.clientPhone || null,
      body: kind === 'sms' ? (m.body || null) : null,
      status: m.status || null,
      meta: {
        durationSeconds: m.durationSeconds || null,
        recordingUrl: m.recordingUrl || null,
        transcript: m.transcript || null,
        twilioSid: m.twilioSid || null,
      },
    });
  }

  for (const d of mailDocs) {
    const m = d.data() as any;
    // Trigger Email extension writes delivery details onto the doc;
    // fall back to _sentAt (which we set at enqueue time) so the row
    // still sorts sensibly before delivery completes.
    const at = tsToIso(m.delivery?.endTime || m._sentAt || m.createdAt);
    rows.push({
      id: d.id,
      kind: 'email',
      direction: 'outbound',
      at,
      from: m.from || null,
      to: Array.isArray(m.to) ? m.to[0] : m.to,
      subject: m.message?.subject || null,
      body: null, // full HTML body kept off the timeline row; UI can request on click
      status: m.delivery?.state || 'queued',
      meta: {
        batchId: m._batchId || null,
        dripRunId: m._dripRunId || null,
        sequenceId: m._sequenceId || null,
      },
    });
  }

  // 3) referral.timeline — inline notes/system entries.
  const inline: any[] = Array.isArray(referral.timeline) ? referral.timeline : [];
  for (const entry of inline) {
    if (!entry) continue;
    rows.push({
      id: `note:${entry.timestamp || Math.random()}`,
      kind: entry.isSystemMessage ? 'system' : 'note',
      at: tsToIso(entry.timestamp),
      from: entry.author || null,
      body: entry.content || null,
    });
  }

  rows.sort((a, b) => b.at.localeCompare(a.at));
  return NextResponse.json({ rows: rows.slice(0, 200), totalScanned: rows.length });
}
