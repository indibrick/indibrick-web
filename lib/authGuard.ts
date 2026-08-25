// Server-side Firebase ID token verification for /api/* routes.
//
// Every partner-facing API route MUST call requireAuth() at the top and
// derive uid + role from the returned session — never from request body,
// query string, or headers other than Authorization. Prior to this
// helper, several routes accepted `userId` / `context.uid` from the
// request payload, which meant any signed-in user could impersonate any
// other by editing the payload.
//
// Usage:
//   const guard = await requireAuth(req, { roles: ['admin', 'internal_agent'] });
//   if (!guard.ok) return guard.response;
//   const { uid, role } = guard.session;

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from './firebaseAdmin';

export interface AuthSession {
  uid: string;
  email: string | null;
  role: string;
}

type GuardResult =
  | { ok: true; session: AuthSession }
  | { ok: false; response: NextResponse };

interface RequireAuthOpts {
  // If provided, the caller's role must be in this list. Omit for
  // "any signed-in user is fine — the route enforces its own row-level
  // checks against the session uid."
  roles?: string[];
}

function unauthorized(msg: string): NextResponse {
  return NextResponse.json({ error: msg }, { status: 401 });
}

function forbidden(msg: string): NextResponse {
  return NextResponse.json({ error: msg }, { status: 403 });
}

export async function requireAuth(
  req: NextRequest,
  opts: RequireAuthOpts = {},
): Promise<GuardResult> {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return { ok: false, response: unauthorized('Missing Bearer token') };
  }
  const token = header.slice(7).trim();
  if (!token) {
    return { ok: false, response: unauthorized('Empty Bearer token') };
  }

  // getAuth() throws if firebase-admin isn't initialized. adminDb is
  // gated on that init, so if it's null we can't verify anything.
  if (!adminDb) {
    return { ok: false, response: NextResponse.json({ error: 'Auth backend unavailable' }, { status: 503 }) };
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch (e: any) {
    return { ok: false, response: unauthorized(`Invalid token: ${e?.code || 'verify-failed'}`) };
  }

  // Look up the profile role. Custom claim `admin` short-circuits so we
  // don't need a users/ document read on every request once claims are
  // wired up. Until then we fall back to the /users/{uid}.role field.
  let role: string = 'client';
  if (decoded.admin === true) {
    role = 'admin';
  } else {
    try {
      const snap = await adminDb.collection('users').doc(decoded.uid).get();
      if (snap.exists) {
        const data = snap.data() || {};
        if (typeof data.role === 'string') role = data.role;
      }
    } catch {
      // Missing profile → treat as base 'client'. The role check below
      // will reject if the route requires a stronger role.
    }
  }

  if (opts.roles && !opts.roles.includes(role)) {
    return { ok: false, response: forbidden(`Role '${role}' not permitted`) };
  }

  return {
    ok: true,
    session: { uid: decoded.uid, email: decoded.email ?? null, role },
  };
}
