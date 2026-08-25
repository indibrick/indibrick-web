// Admin invites — issue + list.
//
// POST creates a pending /invites doc and returns a signed URL. The
// signed token is bound to the invite id + email + role, TTL 14 days.
// GET lists open + accepted invites.
//
// Consumption happens via /api/accept-invite (see route.ts there):
// the invitee signs in via Firebase Auth (any method), then that
// endpoint verifies the token, confirms the auth email matches, and
// stamps the role on /users/{uid}.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';
import { signInviteToken } from '@/lib/inviteToken';

const ALLOWED_ROLES = [
  'partner_realtor', 'partner_lawyer', 'partner_insurance', 'internal_agent',
];

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL
    || process.env.SITE_URL
    || 'https://indibrick.ca';
}

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  const { uid } = guard.session;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const email = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || '');
  const note = String(body.note || '').slice(0, 500);
  const teamId = body.teamId ? String(body.teamId).slice(0, 128) : undefined;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: `role must be one of ${ALLOWED_ROLES.join(', ')}` }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 14 * 86400_000).toISOString();

  const inviteRef = adminDb.collection('invites').doc();
  const token = signInviteToken({
    inviteId: inviteRef.id,
    email,
    role,
    tenantId: 'indibrick',
    invitedBy: uid,
    teamId,
  });

  await inviteRef.set({
    email,
    role,
    tenantId: 'indibrick',
    invitedBy: uid,
    teamId: teamId || null,
    note,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso,
    expiresAt,
  });

  const acceptUrl = `${siteOrigin()}/accept-invite/${token}`;
  return NextResponse.json({ id: inviteRef.id, acceptUrl });
}

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const snap = await adminDb.collection('invites')
    .orderBy('createdAt', 'desc').limit(200).get();
  const invites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ invites });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get('id') || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await adminDb.collection('invites').doc(id).update({
    status: 'revoked',
    revokedAt: new Date().toISOString(),
  });
  return NextResponse.json({ success: true });
}
