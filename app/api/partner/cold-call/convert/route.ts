// Turn a cold call into a CRM lead.
//
// The agent dials, has the conversation, and only then decides whether
// it is worth keeping. That order matters: creating a referral for every
// number dialled would fill the pipeline with people who said no, and a
// pipeline full of noise is one nobody works.
//
// Converting links the existing call record to the new referral, so the
// recording, transcript and summary the call already produced follow the
// lead in rather than being stranded on an orphan message.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { TRANSCRIPTS_COLLECTION } from '@/lib/callTranscriptShape';

export const runtime = 'nodejs';

const ALLOWED_ROLES = new Set(['partner_mortgage', 'admin']);

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, email } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const userSnap = await adminDb.collection('users').doc(uid).get();
  const user = userSnap.data() || {};
  if (!ALLOWED_ROLES.has(user.role || 'client')) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const messageId = String(body?.messageId || '');
  const clientName = String(body?.clientName || '').trim();
  if (!messageId || !clientName) {
    return NextResponse.json({ error: 'messageId and clientName are required.' }, { status: 400 });
  }

  const msgRef = adminDb.collection('messages').doc(messageId);
  const msgSnap = await msgRef.get();
  if (!msgSnap.exists) return NextResponse.json({ error: 'Call not found.' }, { status: 404 });
  const msg = msgSnap.data() as any;

  if (msg.senderUid !== uid && (user.role !== 'admin')) {
    return NextResponse.json({ error: 'That call is not yours.' }, { status: 403 });
  }
  if (msg.convertedReferralId) {
    // Idempotent: a double-click must not create a second lead.
    return NextResponse.json({ success: true, referralId: msg.convertedReferralId, alreadyConverted: true });
  }

  const nowIso = new Date().toISOString();
  const phone = String(msg.clientPhone || '');

  // An existing deal on this number wins over a duplicate.
  const dupe = await adminDb.collection('referrals').where('clientPhone', '==', phone).limit(1).get();
  if (!dupe.empty) {
    await msgRef.update({ referralId: dupe.docs[0].id, convertedReferralId: dupe.docs[0].id });
    return NextResponse.json({
      success: true,
      referralId: dupe.docs[0].id,
      matchedExisting: true,
      message: 'A deal already exists for that number — the call was attached to it.',
    });
  }

  const referral = await adminDb.collection('referrals').add({
    leadId: null,
    referrerId: uid,
    referrerName: user.displayName || email || 'Cold call',
    assignedAgentId: uid,
    assignedAgentName: user.displayName || email || '',
    status: 'New Web Lead',
    source: 'cold_call',
    clientName,
    clientPhone: phone,
    clientEmail: String(body?.clientEmail || '').trim() || '',
    city: String(body?.city || '').trim() || '',
    message: String(body?.notes || '').trim(),
    referralDate: nowIso,
    callCount: 1,
    timeline: [{
      type: 'system',
      author: email || uid.slice(0, 8),
      content: `📞 Created from a cold call to ${phone}`
        + (body?.notes ? `\n\n${String(body.notes).trim()}` : ''),
      timestamp: nowIso,
      isSystemMessage: false,
    }],
    lastUpdated: nowIso,
    lastUpdatedBy: uid,
    tenantId: 'indibrick',
  });

  // Link the call, and any transcript it produced, to the new lead so the
  // summary lands on the file rather than nowhere.
  await msgRef.update({ referralId: referral.id, convertedReferralId: referral.id });
  try {
    const t = await adminDb.collection(TRANSCRIPTS_COLLECTION).doc(messageId).get();
    if (t.exists) await t.ref.update({ referralId: referral.id });
  } catch (e) {
    console.warn('[cold-call/convert] transcript relink failed', e);
  }

  return NextResponse.json({ success: true, referralId: referral.id });
}
