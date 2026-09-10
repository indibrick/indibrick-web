'use client';

// In-browser dialer, wrapping the Twilio Voice SDK.
//
// ─── How a browser call actually places ─────────────────────────────
//   1. POST /api/partner/call with mode:'browser'. That runs the same
//      auth, rate limit and permission checks as the handset path and
//      returns a TICKET.
//   2. Device.connect({ ticket }). The browser never sends a phone
//      number — /api/twilio/voice-browser resolves it from the ticket.
//      That is what stops a token holder dialling arbitrary numbers.
//
// The SDK is imported dynamically so it never lands in the server bundle
// and never runs during SSR — it touches window and WebRTC at import.

import { useCallback, useEffect, useRef, useState } from 'react';
import { authedFetch, authedPost } from '../lib/apiClient';

export type PhoneState =
  | 'unsupported'   // no mic, or browser calling not configured
  | 'idle'          // ready to dial
  | 'connecting'    // ticket booked, waiting on the SDK
  | 'ringing'
  | 'on_call'
  | 'error';

export interface BrowserPhone {
  state: PhoneState;
  available: boolean;
  error: string | null;
  /** Seconds elapsed on the current call. */
  elapsed: number;
  call: (opts: { referralId: string; preset?: 'full' | 'record_only' | 'private' }) => Promise<void>;
  hangUp: () => void;
  toggleMute: () => void;
  muted: boolean;
}

export function useBrowserPhone(): BrowserPhone {
  const [state, setState] = useState<PhoneState>('unsupported');
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const deviceRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setElapsed(0);
  }, []);

  // Probe availability and register the device once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await authedFetch('/api/partner/voice-token');
        const data = await res.json();
        if (cancelled) return;
        if (!data?.available || !data?.token) { setAvailable(false); setState('unsupported'); return; }

        // Dynamic import: the SDK touches window at module scope.
        const { Device } = await import('@twilio/voice-sdk');
        if (cancelled) return;

        const device = new Device(data.token, {
          // Opus over PCMU — better audio on the same bandwidth, which
          // matters because this audio is also what gets transcribed.
          codecPreferences: ['opus', 'pcmu'] as any,
        });

        device.on('error', (e: any) => {
          setError(e?.message || 'device error');
          setState('error');
        });
        // Tokens are short-lived by design; re-mint before they lapse.
        device.on('tokenWillExpire', async () => {
          try {
            const r = await authedFetch('/api/partner/voice-token');
            const d = await r.json();
            if (d?.token) device.updateToken(d.token);
          } catch { /* the next call surfaces it */ }
        });

        await device.register();
        if (cancelled) { device.destroy(); return; }

        deviceRef.current = device;
        setAvailable(true);
        setState('idle');
      } catch (e: any) {
        if (!cancelled) { setAvailable(false); setState('unsupported'); setError(e?.message || null); }
      }
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      try { deviceRef.current?.destroy(); } catch { /* already gone */ }
    };
  }, []);

  const call = useCallback(async (opts: { referralId: string; preset?: 'full' | 'record_only' | 'private' }) => {
    const device = deviceRef.current;
    if (!device) { setError('Browser calling is not ready.'); setState('error'); return; }

    setError(null);
    setState('connecting');

    try {
      // Book first. This is where permission and rate limiting live —
      // the browser is not trusted to skip it.
      const res = await authedPost('/api/partner/call', {
        referralId: opts.referralId,
        mode: 'browser',
        ...(opts.preset ? { preset: opts.preset } : {}),
      });
      const booking = await res.json();
      if (!res.ok || !booking?.ticket) {
        setError(booking?.error || 'Could not start the call.');
        setState('error');
        return;
      }

      const conn = await device.connect({ params: { ticket: booking.ticket } });
      connRef.current = conn;

      conn.on('ringing', () => setState('ringing'));
      conn.on('accept', () => {
        setState('on_call');
        const startedAt = Date.now();
        timerRef.current = setInterval(
          () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
          1000,
        );
      });
      conn.on('disconnect', () => { connRef.current = null; setMuted(false); stopTimer(); setState('idle'); });
      conn.on('cancel', () => { connRef.current = null; stopTimer(); setState('idle'); });
      conn.on('error', (e: any) => { setError(e?.message || 'call error'); stopTimer(); setState('error'); });
    } catch (e: any) {
      setError(e?.message || 'call failed');
      setState('error');
    }
  }, [stopTimer]);

  const hangUp = useCallback(() => {
    try { connRef.current?.disconnect(); } catch { /* already down */ }
    connRef.current = null;
    stopTimer();
    setState('idle');
  }, [stopTimer]);

  const toggleMute = useCallback(() => {
    const c = connRef.current;
    if (!c) return;
    const next = !muted;
    try { c.mute(next); setMuted(next); } catch { /* ignore */ }
  }, [muted]);

  return { state, available, error, elapsed, call, hangUp, toggleMute, muted };
}
