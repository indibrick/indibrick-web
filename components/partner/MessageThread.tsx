'use client';

// iMessage-style thread for SMS + call history on a single deal.
//
// Left-aligned (grey) = inbound from client. Right-aligned (blue) =
// outbound from agent. Call rows render inline with duration +
// recording playback (server writes the URL when Twilio posts the
// recording-status webhook).
//
// This is Wave 1's core "you can now sell it" UI. Every realtor CRM
// has a version of this — Follow Up Boss, Lofty, Chime, kvCORE.

import { useEffect, useMemo, useRef, useState } from 'react';
import { PhoneCall, PhoneIncoming, Loader2, Send, AlertCircle, CheckCheck, Clock, Play } from 'lucide-react';
import { useMessages, type MessageDoc } from '../../hooks/useMessages';
import { LoadingState } from '../ui/StateFeedback';

interface MessageThreadProps {
  referralId: string;
  clientName?: string;
  clientPhone?: string;
  agentPhone?: string;   // Agent's cell/desk to bridge into for click-to-call
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTimestamp(ts: any): string {
  if (!ts) return '';
  const ms = typeof ts === 'string'
    ? new Date(ts).getTime()
    : (typeof ts?.toMillis === 'function' ? ts.toMillis() : NaN);
  if (isNaN(ms)) return '';
  const d = new Date(ms);
  return d.toLocaleString('en-CA', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  if (status === 'delivered' || status === 'read') {
    return <CheckCheck size={11} className="text-emerald-300" aria-label="Delivered" />;
  }
  if (status === 'sent') {
    return <CheckCheck size={11} className="text-white/60" aria-label="Sent" />;
  }
  if (status === 'queued' || status === 'sending' || status === 'initiated' || status === 'ringing' || status === 'in-progress') {
    return <Clock size={11} className="text-white/60" aria-label="Sending" />;
  }
  if (status === 'failed' || status === 'undelivered' || status === 'busy' || status === 'no-answer') {
    return <AlertCircle size={11} className="text-red-400" aria-label={status} />;
  }
  return null;
}

function SmsBubble({ m }: { m: MessageDoc }) {
  const isOutbound = m.direction === 'outbound';
  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[75%] ${isOutbound ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-900'} rounded-2xl px-4 py-2.5 shadow-sm`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
        <div className={`flex items-center gap-1.5 mt-1 text-[10px] font-medium ${isOutbound ? 'text-white/70' : 'text-gray-500'}`}>
          <span>{formatTimestamp(m.createdAt)}</span>
          {isOutbound && <StatusBadge status={m.status} />}
          {typeof m.segmentCount === 'number' && m.segmentCount > 1 && (
            <span title="Message split into multiple SMS segments">· {m.segmentCount} segments</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CallRow({ m }: { m: MessageDoc }) {
  const isOutbound = m.direction === 'outbound';
  const Icon = isOutbound ? PhoneCall : PhoneIncoming;
  const label = isOutbound ? 'Outbound call' : 'Inbound call';
  const status = m.status || '';
  const failed = status === 'failed' || status === 'busy' || status === 'no-answer' || status === 'undelivered';
  return (
    <div className="flex justify-center mb-3">
      <div className={`inline-flex items-center gap-2 border ${failed ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'} rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm`}>
        <Icon size={12} className={failed ? 'text-red-600' : 'text-slate-500'} />
        <span>{label}</span>
        {m.durationSeconds ? <span className="text-gray-500">· {formatDuration(m.durationSeconds)}</span> : null}
        {failed && <span className="text-red-700">· {status}</span>}
        {m.recordingUrl && (
          <a href={m.recordingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
            <Play size={11} /> Recording
          </a>
        )}
        <span className="text-gray-400">· {formatTimestamp(m.createdAt)}</span>
      </div>
    </div>
  );
}

export default function MessageThread({ referralId, clientName, clientPhone, agentPhone }: MessageThreadProps) {
  const { messages, loading, sending, calling, sendSms, callClient } = useMessages(referralId);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phoneForCall, setPhoneForCall] = useState(agentPhone || '');
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const segmentPreview = useMemo(() => {
    const len = draft.length;
    if (len === 0) return null;
    // GSM-7 = 160 chars/segment; unicode = 70. Rough approximation.
    const isUnicode = /[^\x00-\x7F]/.test(draft);
    const segLen = isUnicode ? 70 : 160;
    const segments = Math.max(1, Math.ceil(len / segLen));
    return `${len} chars · ${segments} segment${segments > 1 ? 's' : ''}`;
  }, [draft]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setError(null);
    const res = await sendSms(draft);
    if (res.ok) {
      setDraft('');
    } else {
      setError(res.error || 'Send failed');
    }
  };

  const handleCall = async () => {
    setError(null);
    if (!phoneForCall.trim()) {
      setError('Enter your phone number to be bridged into the call.');
      return;
    }
    const res = await callClient(phoneForCall);
    if (!res.ok) setError(res.error || 'Call failed');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Messages · Calls</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 truncate">
            {clientPhone ? `${clientName || 'Client'} · ${clientPhone}` : (clientName || 'Client')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="tel"
            value={phoneForCall}
            onChange={e => setPhoneForCall(e.target.value)}
            placeholder="Your phone (E.164)"
            className="w-40 px-2 py-1.5 text-[11px] font-medium bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-900 text-slate-900"
          />
          <button
            onClick={handleCall}
            disabled={calling || !clientPhone}
            title={clientPhone ? 'Bridge you and the client via Twilio' : 'Client has no phone on file'}
            className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 transition disabled:opacity-50"
          >
            {calling ? <Loader2 size={11} className="animate-spin" /> : <PhoneCall size={11} />} Call
          </button>
        </div>
      </div>

      {/* Thread body */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 md:p-4 bg-gray-50 min-h-[280px] max-h-[420px] custom-scrollbar">
        {loading && <div className="py-8"><LoadingState label="Loading thread"/></div>}
        {!loading && messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm font-black text-slate-900">No messages yet</p>
            <p className="text-xs text-gray-500 mt-1">Send an SMS or start a call to begin the thread.</p>
          </div>
        )}
        {!loading && messages.map(m => (
          m.channel === 'call'
            ? <CallRow key={m.id} m={m} />
            : <SmsBubble key={m.id} m={m} />
        ))}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-gray-100 bg-white shrink-0">
        {error && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
            <AlertCircle size={12} /> {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder={clientPhone ? 'Text this client…' : 'Client has no phone on file'}
            disabled={!clientPhone}
            className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-slate-900 resize-none text-slate-900 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !draft.trim() || !clientPhone}
            className="bg-blue-600 hover:bg-blue-500 text-white h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-1 transition shadow-sm disabled:opacity-50"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            ⌘/Ctrl + Enter to send
          </p>
          {segmentPreview && (
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{segmentPreview}</p>
          )}
        </div>
      </div>
    </div>
  );
}
