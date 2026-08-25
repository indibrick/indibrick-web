'use client';

// Gemini "Ask Copilot" panel for the partner CRM. Renders a floating
// launcher button + slide-in chat sheet. Streams tokens over SSE from
// /api/partner/copilot and gates every write behind a confirmation card
// (per the delete-safety constraint — no silent mutations).

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Loader2, Check, XCircle, AlertTriangle } from 'lucide-react';
import { getAuth } from 'firebase/auth';

type Role = 'user' | 'assistant';

interface PendingToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  summary: string;
}

interface ExecutedToolCall {
  name: string;
  summary: string;
  affected?: string[];
}

interface Message {
  id: string;
  role: Role;
  text: string;
  pending?: PendingToolCall;
  executed?: ExecutedToolCall[];
  error?: string;
}

interface CopilotContext {
  uid: string;
  role: 'admin' | 'agent';
  selectedDealId?: string;
  pipelineFilter?: any;
  viewScope?: 'all' | 'my' | 'incoming' | 'outbound';
}

interface Props {
  ctx: CopilotContext | null;
  onToolExecuted?: (call: ExecutedToolCall) => void;
}

// Suggested starter prompts — chip row shown when the chat is empty.
const STARTERS = [
  'What deals are stalled?',
  'Summarize my day',
  'Which leads went cold in the last 7 days?',
  'Draft a follow-up for the deal I have open',
];

export default function PartnerCopilot({ ctx, onToolExecuted }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sessionId] = useState(() => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const sendPayload = useCallback(
    async (payload: { message?: string; confirmationResponse?: { approved: boolean; editedArgs?: any; reason?: string } }) => {
      if (!ctx) return;
      setStreaming(true);
      // Placeholder assistant message for token streaming into.
      const assistantId = `m-${Date.now()}-a`;
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', text: '', executed: [] }]);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Copilot streams SSE so we can't use authedFetch as-is — attach
        // the Firebase ID token manually. Same header shape as lib/apiClient.
        const idToken = await getAuth().currentUser?.getIdToken().catch(() => null);
        const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (idToken) authHeaders.Authorization = `Bearer ${idToken}`;
        const res = await fetch('/api/partner/copilot', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ sessionId, ...payload, context: ctx }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({ error: 'Request failed' }));
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, error: errBody.error || 'Request failed' } : m)));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // Parse SSE frames — event + data pairs separated by blank lines.
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';
          for (const frame of frames) {
            const eventMatch = frame.match(/^event: (.+)$/m);
            const dataMatch = frame.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;
            const evt = eventMatch[1];
            let data: any;
            try { data = JSON.parse(dataMatch[1]); } catch { continue; }
            switch (evt) {
              case 'token':
                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + (data.text || '') } : m)));
                break;
              case 'tool_pending':
                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, pending: data } : m)));
                break;
              case 'tool_executed':
                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, executed: [...(m.executed || []), data] } : m)));
                onToolExecuted?.(data);
                break;
              case 'tool_error':
                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, error: `${data.name}: ${data.error}` } : m)));
                break;
              case 'error':
                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, error: data.message || 'Assistant error' } : m)));
                break;
              case 'done':
                // No-op — stream will end on its own.
                break;
            }
          }
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, error: e?.message || 'Connection error' } : m)));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [ctx, sessionId, onToolExecuted],
  );

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming || !ctx) return;
      const userMsg: Message = { id: `m-${Date.now()}-u`, role: 'user', text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      sendPayload({ message: trimmed });
    },
    [sendPayload, streaming, ctx],
  );

  const handleConfirm = useCallback(
    (msgId: string, approved: boolean) => {
      // Clear the pending marker so the confirmation card disappears.
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, pending: undefined } : m)));
      sendPayload({ confirmationResponse: { approved } });
    },
    [sendPayload],
  );

  if (!ctx) return null;

  return (
    <>
      {/* Floating launcher — sits above the pipeline, out of the way. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="portal-nav fixed bottom-6 right-6 z-40 bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-full shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest"
          aria-label="Open Gemini Copilot"
        >
          <Sparkles size={16} />
          Ask Copilot
        </button>
      )}

      {/* Slide-in chat sheet — fixed to the right edge on desktop, full-width on mobile. */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end pointer-events-none">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto sm:bg-transparent sm:backdrop-blur-none"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white shadow-2xl border border-gray-200 flex flex-col w-full sm:w-[440px] h-[80vh] sm:h-screen sm:rounded-none rounded-t-2xl pointer-events-auto animate-[slideIn_.2s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Copilot</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Gemini · Read-safe writes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close copilot"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message list */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center text-center pt-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-3">
                    <Sparkles size={24} className="text-blue-600" />
                  </div>
                  <p className="font-black text-sm text-slate-900 mb-1">Ask about your pipeline</p>
                  <p className="text-xs text-gray-500 mb-5 max-w-[280px]">
                    Summaries, follow-up drafts, task scheduling. Every write is confirmed before it lands.
                  </p>
                  <div className="w-full space-y-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSend(s)}
                        className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-slate-700 font-semibold"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-50 border border-gray-100 text-slate-900'
                  }`}>
                    {m.text && <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>}
                    {m.role === 'assistant' && !m.text && streaming && (
                      <div className="flex items-center gap-1.5 text-gray-400 py-1">
                        <Loader2 size={12} className="animate-spin" />
                        <span className="text-xs">Thinking...</span>
                      </div>
                    )}

                    {/* Executed tool receipts */}
                    {m.executed && m.executed.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {m.executed.map((ex, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                            <Check size={12} className="mt-0.5 flex-shrink-0" />
                            <span className="font-semibold">{ex.summary}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pending confirmation card */}
                    {m.pending && (
                      <div className="mt-3 border-2 border-amber-300 bg-amber-50 rounded-xl p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-amber-800">Confirm change</p>
                            <p className="text-xs text-slate-800 font-semibold mt-0.5">{m.pending.summary}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirm(m.id, true)}
                            disabled={streaming}
                            className="flex-1 bg-emerald-600 text-white text-[11px] uppercase tracking-widest font-black py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirm(m.id, false)}
                            disabled={streaming}
                            className="flex-1 bg-white border border-gray-300 text-slate-700 text-[11px] uppercase tracking-widest font-black py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {m.error && (
                      <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                        {m.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="border-t border-gray-100 p-3 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a deal, a task, the pipeline..."
                disabled={streaming}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="bg-slate-900 text-white px-3.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition disabled:opacity-40 flex items-center justify-center"
              >
                {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          </div>

          <style jsx>{`
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to   { transform: translateX(0);    opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
