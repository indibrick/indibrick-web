// Live message subscription for a deal's SMS + call thread.
//
// Reads happen client-side (Firestore rules gate them by
// participantUids); writes go through /api/partner/messages (SMS) and
// /api/partner/call (voice). The Firestore subscription updates the
// thread in real time so inbound SMS lands the moment Twilio posts to
// our webhook.

import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { authedPost } from '../lib/apiClient';

export type MessageChannel = 'sms' | 'call';
export type MessageDirection = 'inbound' | 'outbound';

export interface MessageDoc {
  id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  body?: string;
  fromNumber?: string;
  toNumber?: string;
  clientPhone?: string;
  agentPhone?: string;
  referralId: string;
  senderUid?: string;
  senderEmail?: string;
  status?: string;
  segmentCount?: number;
  durationSeconds?: number;
  recordingUrl?: string;
  errorMessage?: string;
  createdAt?: any;
  read?: boolean;
}

interface UseMessagesResult {
  messages: MessageDoc[];
  loading: boolean;
  sending: boolean;
  calling: boolean;
  sendSms: (body: string) => Promise<{ ok: boolean; error?: string }>;
  /**
   * `agentPhone` is required for mode 'phone' and ignored for 'browser',
   * which rings through WebRTC instead of a handset.
   */
  callClient: (
    agentPhone: string,
    opts?: { mode?: 'phone' | 'browser'; preset?: 'full' | 'record_only' | 'private' },
  ) => Promise<{ ok: boolean; error?: string }>;
}

export function useMessages(referralId: string | undefined): UseMessagesResult {
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!referralId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'messages'),
      where('referralId', '==', referralId),
      orderBy('createdAt', 'asc'),
      limit(200),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      (err) => {
        console.error('[useMessages] subscribe error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [referralId]);

  const sendSms = async (body: string) => {
    if (!referralId || !body.trim()) return { ok: false, error: 'Empty message' };
    setSending(true);
    try {
      const res = await authedPost('/api/partner/messages', { referralId, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error' };
    } finally {
      setSending(false);
    }
  };

  const callClient = async (
    agentPhone: string,
    opts?: { mode?: 'phone' | 'browser'; preset?: 'full' | 'record_only' | 'private' },
  ) => {
    const mode = opts?.mode || 'phone';
    // Browser calls ring through WebRTC, so no handset is needed.
    if (!referralId || (mode === 'phone' && !agentPhone)) {
      return { ok: false, error: 'Missing agent phone' };
    }
    setCalling(true);
    try {
      const res = await authedPost('/api/partner/call', {
        referralId,
        ...(mode === 'phone' ? { agentPhone } : {}),
        mode,
        ...(opts?.preset ? { preset: opts.preset } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Network error' };
    } finally {
      setCalling(false);
    }
  };

  return { messages, loading, sending, calling, sendSms, callClient };
}
