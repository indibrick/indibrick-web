'use client';
// Invite landing page. Users arrive here from a signed URL admin
// generated. Flow:
//   - Not signed in → nudge to /login (they sign in via existing
//     Firebase Auth flow with the invited email address).
//   - Signed in → POST the token to /api/accept-invite, which
//     matches the signed email against their auth email, sets role,
//     and marks the invite consumed. Redirect to /partner.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { authedFetch } from '@/lib/apiClient';
import { CheckCircle, LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = String(params?.token || '');
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [state, setState] = useState<'idle' | 'accepting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const accept = async () => {
    setState('accepting');
    setError(null);
    try {
      const res = await authedFetch('/api/accept-invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setState('success');
      setTimeout(() => router.push('/partner'), 1500);
    } catch (e: any) {
      setError(e?.message || 'Failed to accept invite.');
      setState('error');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">You&apos;ve been invited</h1>
        <p className="mt-2 text-sm text-neutral-600">
          IndiBrick CRM invited you to join the platform. Accept below and you&apos;ll land in your dashboard.
        </p>

        {checking && (
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 size={16} className="animate-spin"/> Checking your session…
          </div>
        )}

        {!checking && !user && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-neutral-700">
              Sign in first — use the email address the invite was sent to.
            </p>
            <button onClick={() => router.push(`/login?next=/accept-invite/${encodeURIComponent(token)}`)}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
              <LogIn size={14}/> Sign in
            </button>
          </div>
        )}

        {!checking && user && state === 'idle' && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-neutral-700">
              Signed in as <span className="font-medium text-neutral-900">{user.email}</span>.
            </p>
            <button onClick={accept}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
              <CheckCircle size={14}/> Accept invite
            </button>
          </div>
        )}

        {state === 'accepting' && (
          <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 size={16} className="animate-spin"/> Accepting…
          </div>
        )}

        {state === 'success' && (
          <div className="mt-6 flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle size={16}/> Success — heading to your dashboard.
          </div>
        )}

        {state === 'error' && error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5"/>
            <div>
              <div className="font-medium">Couldn&apos;t accept the invite.</div>
              <div className="mt-1 text-xs">{error}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
