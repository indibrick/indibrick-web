// Enqueue an internal-team notification email.
//
// Wraps the /mail write that used to happen from the client SDK — the
// mail collection is server-only now (Wave E), so client-side addDoc
// against it throws "Missing or insufficient permissions" and rattles
// the whole log-a-call flow. This endpoint accepts the same shape and
// writes via admin SDK.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

const MAX_RECIPIENTS = 20;

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const recipients: string[] = Array.isArray(body.recipients)
    ? body.recipients.map((s: any) => String(s).trim()).filter(Boolean).slice(0, MAX_RECIPIENTS)
    : [];
  const subject = String(body.subject || '').slice(0, 200);
  const html = String(body.html || '').slice(0, 50_000);
  if (recipients.length === 0 || !subject || !html) {
    return NextResponse.json({ error: 'recipients, subject, and html required' }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const wrapped = `<div style="font-family: sans-serif; padding: 20px;">${html}</div>`;
  const promises = recipients.map(to =>
    adminDb!.collection('mail').add({
      to,
      message: { subject, html: wrapped },
      _sentAt: nowIso,
      _senderUid: guard.session.uid,
      _source: 'partner-notify',
    }),
  );
  await Promise.all(promises);
  return NextResponse.json({ ok: true, sent: recipients.length });
}
