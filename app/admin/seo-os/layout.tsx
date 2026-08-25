'use client';
// SEO OS admin shell.
//
// Strict admin gate — NOTHING renders until /api/admin/whoami
// confirms the caller has role: 'admin'. Non-admins see a lockout
// screen with a "back to /partner" link. This is stricter than the
// existing /admin/* pages which render the shell immediately and
// only gate data — safer default for the SEO OS given it will hold
// integration credentials + publish keys.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { authedGet } from '../../../lib/apiClient';
import {
  FileText, Calendar, Gauge, Link2, Send, Radio, Lock, Loader2,
} from 'lucide-react';

const TABS = [
  { href: '/admin/seo-os/content',       label: 'Content',       icon: FileText },
  { href: '/admin/seo-os/calendar',      label: 'Calendar',      icon: Calendar },
  { href: '/admin/seo-os/audits',        label: 'Audits',        icon: Gauge },
  { href: '/admin/seo-os/backlinks',     label: 'Backlinks',     icon: Link2 },
  { href: '/admin/seo-os/publish',       label: 'Publish',       icon: Send },
  { href: '/admin/seo-os/ai-visibility', label: 'AI Visibility', icon: Radio },
];

type GateState = 'checking' | 'ok' | 'not-signed-in' | 'not-admin' | 'error';

export default function SeoOsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [gate, setGate] = useState<GateState>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setGate('not-signed-in'); return; }
      try {
        const res = await authedGet('/api/admin/whoami');
        if (res.status === 403) { setGate('not-admin'); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setGate('ok');
      } catch (e: any) {
        setErrorMsg(e?.message || 'Auth check failed.');
        setGate('error');
      }
    });
    return () => unsub();
  }, []);

  if (gate === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-sm text-neutral-500 gap-2">
        <Loader2 size={16} className="animate-spin"/> Verifying admin session…
      </div>
    );
  }

  if (gate === 'not-signed-in') {
    return (
      <LockScreen title="Sign in required"
        body="You need to sign in with an admin account to reach the SEO OS."
        cta={{ label: 'Sign in', onClick: () => router.push('/login?next=' + encodeURIComponent(pathname || '/admin/seo-os')) }}
      />
    );
  }

  if (gate === 'not-admin') {
    return (
      <LockScreen title="Admin only"
        body="Your account isn't authorized for the SEO OS. If this is wrong, ask an existing admin to grant you the role."
        cta={{ label: 'Back to CRM', onClick: () => router.push('/partner') }}
      />
    );
  }

  if (gate === 'error') {
    return (
      <LockScreen title="Couldn't verify your session"
        body={errorMsg || 'Something went wrong checking your admin role.'}
        cta={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    );
  }

  // OK path — render the SEO OS shell.
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/admin/seo-os" className="text-lg font-black tracking-tight text-neutral-900">
            SEO OS
          </Link>
          <Link href="/partner" className="text-xs text-neutral-500 hover:text-neutral-900">
            Back to CRM →
          </Link>
        </div>
        <nav className="mx-auto max-w-7xl px-4 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map(t => {
            const active = pathname?.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href}
                className={`inline-flex items-center gap-2 px-3 py-2.5 text-[11px] font-black uppercase tracking-widest transition border-b-2 shrink-0 ${
                  active ? 'border-blue-600 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}>
                <t.icon size={13}/> {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}

function LockScreen({ title, body, cta }: { title: string; body: string; cta: { label: string; onClick: () => void } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="text-neutral-500" size={22}/>
        </div>
        <h1 className="text-xl font-black tracking-tight text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{body}</p>
        <button onClick={cta.onClick}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-600">
          {cta.label}
        </button>
      </div>
    </div>
  );
}
