// Preview a mass send BEFORE anything is written.
//
// Body: { templateId, recipientFilter: { assignedToMe?, status?, leadTag?, dealType?, tagged?, ids? } }
//   Returns: total recipient count + first 3 rendered previews so the
//   sender can spot bad merge-tag output or dropped recipients before
//   committing.
//
// Preview always runs against the caller's OWN scope — no way to
// peek at other agents' books unless caller is admin.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';
import { interpolate } from '@/lib/mergeTags';
import { FUNDED_STATUSES, LOST_STATUSES } from '@/lib/crmHelpers';

interface RecipientFilter {
  assignedToMe?: boolean;
  status?: string;
  leadTag?: string;
  dealType?: string;
  ids?: string[];               // explicit override — used when picking off a checkbox list
  excludeFunded?: boolean;
  excludeLost?: boolean;
}

async function collectRecipients(
  db: FirebaseFirestore.Firestore,
  filter: RecipientFilter,
  uid: string,
  role: string,
  channel: 'email' | 'sms',
  cap: number,
): Promise<any[]> {
  // Start scope: mine (default) or team (admin only, when explicitly asked)
  let query: FirebaseFirestore.Query = db.collection('referrals');
  if (role !== 'admin' || filter.assignedToMe !== false) {
    query = query.where('assignedAgentId', '==', uid);
  }
  if (filter.status) query = query.where('status', '==', filter.status);
  if (filter.leadTag) query = query.where('leadTag', '==', filter.leadTag);
  if (filter.dealType) query = query.where('dealType', '==', filter.dealType);
  // Cap the scan at 5× cap — post-filter for channel + funded/lost.
  const snap = await query.limit(cap * 5).get();
  let rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  if (filter.excludeFunded !== false) rows = rows.filter(r => !FUNDED_STATUSES.includes(r.status));
  if (filter.excludeLost !== false)   rows = rows.filter(r => !LOST_STATUSES.includes(r.status));

  // Channel-required field.
  if (channel === 'email') rows = rows.filter(r => !!String(r.clientEmail || '').trim());
  else                     rows = rows.filter(r => !!String(r.clientPhone || '').trim());

  // Explicit id override takes precedence — intersect if provided.
  if (Array.isArray(filter.ids) && filter.ids.length > 0) {
    const set = new Set(filter.ids);
    rows = rows.filter(r => set.has(r.id));
  }

  return rows.slice(0, cap);
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  const templateId: string = String(body?.templateId || '');
  const filter: RecipientFilter = body?.recipientFilter || {};
  if (!templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 });

  const tSnap = await adminDb.collection('email_templates').doc(templateId).get();
  if (!tSnap.exists) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  const tmpl = tSnap.data() || {};
  if (tmpl.ownerUid !== uid && role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const channel: 'email' | 'sms' = tmpl.channel === 'sms' ? 'sms' : 'email';

  // Full recipient count (up to a hard cap of 2000 for preview).
  const recipients = await collectRecipients(adminDb, filter, uid, role, channel, 2000);
  const samples = recipients.slice(0, 3).map(r => ({
    referralId: r.id,
    clientName: r.clientName,
    clientEmail: r.clientEmail,
    clientPhone: r.clientPhone,
    subject: interpolate(String(tmpl.subject || ''), r),
    body: interpolate(String(tmpl.body || ''), r),
  }));

  return NextResponse.json({
    channel,
    recipientCount: recipients.length,
    samples,
    templateName: tmpl.name,
  });
}
