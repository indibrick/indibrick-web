// Lightweight identity ping — returns the caller's uid + role if
// admin, 403 otherwise. Used by /admin/seo-os/layout.tsx to gate the
// shell before rendering anything sensitive.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  const guard = await requireAuth(req, { roles: ['admin'] });
  if (!guard.ok) return guard.response;
  return NextResponse.json({
    uid: guard.session.uid,
    email: guard.session.email,
    role: guard.session.role,
    ok: true,
  });
}
