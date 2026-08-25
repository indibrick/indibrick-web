'use client';

// Public unsubscribe confirmation page.
//
// Two UX paths:
//   1. If Gmail/Yahoo already POSTed to /api/unsubscribe/[token]
//      (List-Unsubscribe-Post one-click) and the user clicks the link
//      afterward, we already show "you're unsubscribed."
//   2. If they click the link first (no one-click POST), we show a
//      confirm button. Some brands prefer this to avoid accidental
//      unsubscribes from mail-scanner previews.

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, Mail, XCircle } from 'lucide-react';

interface TokenInfo {
  email: string;
  tenantId: string;
  ctx?: string | null;
  alreadyOptedOut: boolean;
}

export default function UnsubscribePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'confirming' | 'done' | 'error'>('loading');
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/unsubscribe/${encodeURIComponent(params.token)}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { setStatus('error'); setError(data.error || 'invalid link'); return; }
        setInfo(data);
        setStatus(data.alreadyOptedOut ? 'done' : 'ready');
      })
      .catch(() => { setStatus('error'); setError('network error'); });
  }, [params.token]);

  const confirm = async () => {
    setStatus('confirming');
    try {
      const r = await fetch(`/api/unsubscribe/${encodeURIComponent(params.token)}`, { method: 'POST' });
      if (r.ok) setStatus('done');
      else { setStatus('error'); setError('could not unsubscribe'); }
    } catch { setStatus('error'); setError('network error'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border border-gray-200 shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={22} className="animate-spin text-slate-500 mx-auto mb-3"/>
            <p className="text-sm font-bold text-slate-700">Loading…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={26} className="text-red-600"/>
            </div>
            <h1 className="text-xl font-black text-slate-900">Link isn't valid</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {error || 'The unsubscribe link may have been altered or truncated.'}
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Reply "unsubscribe" to any email from us and we'll remove you manually within 10 business days (CASL-compliant).
            </p>
          </>
        )}

        {status === 'ready' && info && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Mail size={26} className="text-blue-600"/>
            </div>
            <h1 className="text-xl font-black text-slate-900">Unsubscribe {info.email}?</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              You'll be removed from all campaign emails from IndiBrick partners within 10 business days.
            </p>
            <button onClick={confirm}
              className="mt-6 w-full bg-slate-900 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg">
              Confirm unsubscribe
            </button>
            <p className="text-[10px] text-gray-400 mt-3">Transactional messages (deal updates, booking confirmations) are excluded and will continue.</p>
          </>
        )}

        {status === 'confirming' && (
          <>
            <Loader2 size={22} className="animate-spin text-slate-500 mx-auto mb-3"/>
            <p className="text-sm font-bold text-slate-700">Unsubscribing…</p>
          </>
        )}

        {status === 'done' && info && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={26} className="text-emerald-600"/>
            </div>
            <h1 className="text-xl font-black text-slate-900">Unsubscribed</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              <span className="font-bold text-slate-900">{info.email}</span> won't receive further campaign emails from IndiBrick partners.
            </p>
            <p className="text-[10px] text-gray-500 mt-4">
              If you're an active IndiBrick client, we may still contact you about your existing file — that's a legal obligation, not marketing.
            </p>
          </>
        )}

        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8 pt-6 border-t border-gray-100">
          IndiBrick · Ontario, Canada
        </p>
      </div>
    </div>
  );
}
