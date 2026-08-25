'use client';

// Public form-render page (/f/{slug}).
//
// Fetches the form definition server-side via /api/forms/[slug], then
// renders the fields + submits to /api/forms/[slug]/submit. Success
// state either shows the configured success message OR redirects to
// the form's redirectUrl.

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { captureAttributionFromWindow, readStoredAttribution } from '../../../lib/utmCapture';

// Cloudflare Turnstile global (loaded via injected script tag).
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; theme?: 'light' | 'dark' | 'auto' }) => string;
      reset: (id?: string) => void;
    };
  }
}

interface RemoteField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  mapTo?: string;
}
interface RemoteForm {
  slug: string;
  headline: string;
  subheadline: string;
  submitLabel: string;
  fields: RemoteField[];
  requireCaptcha?: boolean;
  turnstileSiteKey?: string | null;
}

export default function PublicFormPage({ params }: { params: { slug: string } }) {
  const [form, setForm] = useState<RemoteForm | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'notfound'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('Thanks — we\'ll be in touch shortly.');
  const [values, setValues] = useState<Record<string, any>>({});
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaWidgetIdRef = useRef<string | null>(null);

  // Attribution capture — reads UTM params (if any) or stamps the
  // landing page + referrer for direct visitors. Persisted in
  // sessionStorage so subsequent navigations don't overwrite.
  useEffect(() => { captureAttributionFromWindow(); }, []);

  useEffect(() => {
    fetch(`/api/forms/${encodeURIComponent(params.slug)}`)
      .then(async r => {
        if (r.status === 404 || r.status === 410) { setStatus('notfound'); return; }
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { setStatus('error'); setError(data.error || 'Unavailable'); return; }
        setForm(data.form);
        setStatus('ready');
      })
      .catch(() => { setStatus('error'); setError('Unavailable'); });
  }, [params.slug]);

  // Lazy-load the Turnstile script + render the widget once the form
  // is fetched and requireCaptcha is set. We poll every 100ms for
  // window.turnstile (rather than fighting the async loader's timing)
  // and cap at ~5s. Skipped entirely when no site key is configured.
  useEffect(() => {
    if (!form?.requireCaptcha || !form.turnstileSiteKey) return;
    const scriptId = 'cf-turnstile-script';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (window.turnstile && captchaRef.current) {
        try {
          captchaWidgetIdRef.current = window.turnstile.render(captchaRef.current, {
            sitekey: form.turnstileSiteKey!,
            callback: (token: string) => setCaptchaToken(token),
            theme: 'light',
          });
        } catch { /* second render attempt no-op */ }
        clearInterval(timer);
      } else if (tries > 50) {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [form?.requireCaptcha, form?.turnstileSiteKey]);

  const setValue = (key: string, v: any) => setValues(p => ({ ...p, [key]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (form.requireCaptcha && form.turnstileSiteKey && !captchaToken) {
      setError('Please complete the challenge below.');
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      const payload: Record<string, any> = { ...values };
      if (captchaToken) payload._captchaToken = captchaToken;
      // Attach attribution from sessionStorage / current URL. Server
      // side sanitizes + projects into the referral doc.
      const attribution = readStoredAttribution();
      if (attribution) payload._attribution = attribution;
      const res = await fetch(`/api/forms/${encodeURIComponent(params.slug)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setError(data.error || 'Submit failed');
        // Burn the token — Turnstile tokens are one-shot. Reset the
        // widget so the user can retry with a fresh challenge.
        setCaptchaToken('');
        try { window.turnstile?.reset(captchaWidgetIdRef.current || undefined); } catch { /* noop */ }
        return;
      }
      if (data.redirectUrl) { window.location.href = String(data.redirectUrl); return; }
      if (data.successMessage) setSuccessMessage(String(data.successMessage));
      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || 'Network error');
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>;
  }
  if (status === 'notfound') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md text-center">
          <h1 className="text-2xl font-black text-slate-900">Form not found</h1>
          <p className="text-sm text-gray-500 mt-2">This form may have been removed or disabled.</p>
        </div>
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-xl max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-600"/>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Submitted</h1>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{successMessage}</p>
        </div>
      </div>
    );
  }
  if (!form) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{form.headline}</h1>
          {form.subheadline && <p className="text-sm md:text-base text-gray-600 mt-3 leading-relaxed">{form.subheadline}</p>}
        </div>

        <form onSubmit={submit} className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 md:p-8 space-y-4">
          {form.fields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                {f.label}{f.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {f.type === 'textarea' ? (
                <textarea rows={3} required={f.required} value={values[f.key] ?? ''}
                  onChange={e => setValue(f.key, e.target.value)}
                  placeholder={f.placeholder || ''}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-black resize-none text-slate-900" />
              ) : f.type === 'select' ? (
                <select required={f.required} value={values[f.key] ?? ''}
                  onChange={e => setValue(f.key, e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-black text-slate-900">
                  <option value="">Choose…</option>
                  {(f.options || []).map((o, i) => <option key={i} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!values[f.key]}
                    onChange={e => setValue(f.key, e.target.checked)}
                    className="w-4 h-4 accent-slate-900" />
                  <span className="text-sm text-slate-700">{f.placeholder || 'Yes'}</span>
                </label>
              ) : (
                <input
                  type={f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : f.type === 'number' ? 'number' : 'text'}
                  required={f.required} value={values[f.key] ?? ''}
                  onChange={e => setValue(f.key, e.target.value)}
                  placeholder={f.placeholder || ''}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-black text-slate-900" />
              )}
            </label>
          ))}

          {form.requireCaptcha && form.turnstileSiteKey && (
            <div className="flex justify-center pt-1">
              <div ref={captchaRef} className="cf-turnstile" />
            </div>
          )}

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}

          <button type="submit" disabled={status === 'submitting'}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {status === 'submitting' ? (<><Loader2 className="animate-spin" size={14}/> Submitting…</>) : (<>{form.submitLabel} <ArrowRight size={14}/></>)}
          </button>
        </form>

        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-6">
          Powered by IndiBrick
        </p>
      </div>
    </div>
  );
}
