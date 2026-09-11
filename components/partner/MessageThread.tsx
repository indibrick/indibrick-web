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
import { PhoneCall, PhoneIncoming, Loader2, Send, AlertCircle, CheckCheck, Clock, Play,
  Laptop, Smartphone, Mic, MicOff, ChevronDown } from 'lucide-react';
import { useBrowserPhone } from '../../hooks/useBrowserPhone';
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
  const [showCallInput, setShowCallInput] = useState(false);

  // How the agent takes the call, and what gets captured. Both persist
  // for the session so the choice is made once, not per call.
  const [mode, setMode] = useState<'phone' | 'browser'>('phone');
  const [preset, setPreset] = useState<'full' | 'record_only' | 'private'>('full');
  const [showOptions, setShowOptions] = useState(false);
  const browserPhone = useBrowserPhone();
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

    // Browser calls place through the Voice SDK, which books via the
    // same endpoint and needs no handset.
    if (mode === 'browser') {
      if (!browserPhone.available) {
        setError('Browser calling is not set up on this environment.');
        return;
      }
      await browserPhone.call({ referralId, preset });
      if (browserPhone.error) setError(browserPhone.error);
      return;
    }

    if (!phoneForCall.trim()) {
      // Prompt for the phone inline instead of stealing modal space
      // for a permanent input strip. Once entered, remembered for the
      // rest of the session.
      setShowCallInput(true);
      return;
    }
    const res = await callClient(phoneForCall, { mode: 'phone', preset });
    if (!res.ok) setError(res.error || 'Call failed');
  };

  const onBrowserCall = browserPhone.state === 'on_call'
    || browserPhone.state === 'ringing'
    || browserPhone.state === 'connecting';

  const PRESET_LABEL: Record<typeof preset, string> = {
    full: 'Record & summarise',
    record_only: 'Record only',
    private: 'Private · not recorded',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header — compact. Call action is a single icon-only button; the
          "your phone" prompt only surfaces when the agent actually
          clicks Call without a stored number. */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Messages · Calls</h3>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5 truncate">
            {clientPhone ? `${clientName || 'Client'} · ${clientPhone}` : (clientName || 'Client')}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {onBrowserCall ? (
            <>
              <button
                onClick={browserPhone.toggleMute}
                title={browserPhone.muted ? 'Unmute' : 'Mute'}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-slate-600 hover:border-slate-900 transition"
              >
                {browserPhone.muted ? <MicOff size={12}/> : <Mic size={12}/>}
              </button>
              <button
                onClick={browserPhone.hangUp}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition"
              >
                <PhoneCall size={11} className="rotate-[135deg]"/>
                {browserPhone.state === 'on_call'
                  ? `${String(Math.floor(browserPhone.elapsed / 60)).padStart(2, '0')}:${String(browserPhone.elapsed % 60).padStart(2, '0')}`
                  : browserPhone.state === 'ringing' ? 'Ringing' : 'Connecting'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCall}
                disabled={calling || !clientPhone}
                title={clientPhone
                  ? (mode === 'browser' ? 'Call from this browser' : 'Ring your phone, then bridge the client')
                  : 'Client has no phone on file'}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-l-lg transition disabled:opacity-40"
              >
                {calling ? <Loader2 size={11} className="animate-spin" />
                  : mode === 'browser' ? <Laptop size={11}/> : <PhoneCall size={11} />} Call
              </button>
              <button
                onClick={() => setShowOptions(v => !v)}
                title="Call options"
                aria-expanded={showOptions}
                className="inline-flex items-center justify-center bg-slate-900 hover:bg-blue-600 text-white px-1.5 py-1.5 rounded-r-lg border-l border-white/20 transition -ml-1"
              >
                <ChevronDown size={11} className={showOptions ? 'rotate-180 transition' : 'transition'}/>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Call options — how you take it, and what gets kept. Collapsed by
          default so the common case stays one click. */}
      {showOptions && !onBrowserCall && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-3 shrink-0">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Take the call on</div>
            <div className="flex gap-1">
              <button
                onClick={() => setMode('phone')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition ${mode === 'phone' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'}`}
              >
                <Smartphone size={11}/> My phone
              </button>
              <button
                onClick={() => setMode('browser')}
                disabled={!browserPhone.available}
                title={browserPhone.available ? 'Cheaper, but desk only' : 'Not configured on this environment'}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition disabled:opacity-40 ${mode === 'browser' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'}`}
              >
                <Laptop size={11}/> This browser
              </button>
            </div>
          </div>

          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Recording</div>
            <div className="space-y-1">
              {(['full', 'record_only', 'private'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`w-full text-left text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition ${preset === p ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'}`}
                >
                  {PRESET_LABEL[p]}
                </button>
              ))}
            </div>
            {preset === 'private' && (
              <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
                No audio, no transcript, no summary. The client hears no recording notice, because there is none.
              </p>
            )}
          </div>
        </div>
      )}

      {/* On-demand "your phone" prompt — only visible when agent tried
          to call without one on file. Small, tucked below the header. */}
      {showCallInput && (
        <div className="px-4 py-2 border-b border-blue-100 bg-blue-50 flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-800">Your phone</span>
          <input
            type="tel"
            value={phoneForCall}
            onChange={e => setPhoneForCall(e.target.value)}
            placeholder="+14165551234"
            autoFocus
            className="flex-1 px-2 py-1 text-xs font-medium bg-white border border-blue-200 rounded outline-none focus:border-blue-600 text-slate-900"
          />
          <button
            onClick={async () => {
              if (!phoneForCall.trim()) return;
              setShowCallInput(false);
              await handleCall();
            }}
            className="text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition"
          >
            Ring
          </button>
        </div>
      )}

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
