'use client';

// Cold-call dialer.
//
// Dial a number that is not in the CRM, have the conversation, then
// decide whether it is worth keeping. Nothing is written to the pipeline
// until the agent says so — creating a lead for every number dialled
// would fill it with people who said no.
//
// Only rendered for partner_mortgage and admin; the API enforces the
// same rule, so hiding the button is convenience, not the control.

import React, { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, UserPlus, X, Loader2, Delete, Check } from 'lucide-react';
import { authedPost } from '../../lib/apiClient';
import { useBrowserPhone } from '../../hooks/useBrowserPhone';

type Preset = 'full' | 'record_only' | 'private';

function prettyPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function ColdDialer({ agentPhone, onConverted }: {
  agentPhone?: string;
  onConverted?: (referralId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState('');
  const [mode, setMode] = useState<'phone' | 'browser'>('phone');
  const [preset, setPreset] = useState<Preset>('full');
  const [myPhone, setMyPhone] = useState(agentPhone || '');
  const [dialing, setDialing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The call just placed, and therefore the one that can become a lead.
  const [lastCallId, setLastCallId] = useState<string | null>(null);
  const [lastNumber, setLastNumber] = useState<string>('');

  const [showSave, setShowSave] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const browserPhone = useBrowserPhone();
  const live = browserPhone.state === 'on_call' || browserPhone.state === 'ringing' || browserPhone.state === 'connecting';
  const e164 = `+1${digits.replace(/\D/g, '')}`;
  const ready = digits.replace(/\D/g, '').length === 10;

  const dial = async () => {
    if (!ready) return;
    setError(null); setSaved(null); setDialing(true);
    try {
      const res = await authedPost('/api/partner/cold-call', {
        to: e164,
        mode,
        preset,
        ...(mode === 'phone' ? { agentPhone: myPhone } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || `HTTP ${res.status}`); return; }

      setLastCallId(data.id);
      setLastNumber(data.to || e164);

      if (mode === 'browser' && data.ticket) {
        // The hook books its own ticket for referral calls; here the
        // ticket already exists, so connect straight to it.
        await browserPhone.callTicket(data.ticket);
        if (browserPhone.error) setError(browserPhone.error);
      }
    } catch (e: any) {
      setError(e?.message || 'Call failed');
    } finally {
      setDialing(false);
    }
  };

  const saveLead = async () => {
    if (!lastCallId || !leadName.trim()) return;
    setSaving(true); setError(null);
    try {
      const res = await authedPost('/api/partner/cold-call/convert', {
        messageId: lastCallId,
        clientName: leadName.trim(),
        clientEmail: leadEmail.trim(),
        notes: leadNotes.trim(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Could not save the lead.'); return; }
      setSaved(data.matchedExisting
        ? 'That number already had a deal — the call was attached to it.'
        : 'Lead added to your pipeline.');
      setShowSave(false);
      setLeadName(''); setLeadEmail(''); setLeadNotes('');
      if (data.referralId) onConverted?.(data.referralId);
    } finally {
      setSaving(false);
    }
  };

  const KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl transition shadow-sm"
      >
        <Phone size={13} /> Cold dialler
      </button>

      {open && (
        <div className="fixed inset-0 z-[96] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !live && setOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Cold dialler</h3>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">Canadian and US numbers</p>
              </div>
              <button onClick={() => !live && setOpen(false)} disabled={live}
                className="text-gray-400 hover:text-slate-900 p-1 disabled:opacity-30"><X size={16} /></button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div className="text-center">
                <div className="text-2xl font-black tracking-tight text-slate-900 tabular-nums min-h-[2rem]">
                  {digits ? prettyPhone(digits) : <span className="text-gray-300">(___) ___-____</span>}
                </div>
              </div>

              {!live && (
                <div className="grid grid-cols-3 gap-2">
                  {KEYS.map(k => (
                    <button key={k}
                      onClick={() => setDigits(d => (d.replace(/\D/g, '').length < 10 ? d + k : d))}
                      className="py-3 rounded-xl border border-gray-200 hover:border-slate-900 text-lg font-bold text-slate-900 transition tabular-nums"
                    >{k}</button>
                  ))}
                  <button onClick={() => setDigits('')}
                    className="col-span-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 transition">
                    <Delete size={12} /> Clear
                  </button>
                </div>
              )}

              {!live && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <button onClick={() => setMode('phone')}
                      className={`flex-1 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition ${mode === 'phone' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200'}`}>My phone</button>
                    <button onClick={() => setMode('browser')} disabled={!browserPhone.available}
                      className={`flex-1 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition disabled:opacity-40 ${mode === 'browser' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-gray-200'}`}>Browser</button>
                  </div>
                  {mode === 'phone' && (
                    <input value={myPhone} onChange={e => setMyPhone(e.target.value)} placeholder="Your phone +1416…"
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-900" />
                  )}
                  <select value={preset} onChange={e => setPreset(e.target.value as Preset)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-900">
                    <option value="full">Record &amp; summarise</option>
                    <option value="record_only">Record only</option>
                    <option value="private">Private · not recorded</option>
                  </select>
                </div>
              )}

              {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
              {saved && <p className="text-[11px] text-green-700 font-medium inline-flex items-center gap-1"><Check size={12} />{saved}</p>}

              {live ? (
                <div className="flex gap-2">
                  <button onClick={browserPhone.toggleMute}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                    {browserPhone.muted ? <MicOff size={12} /> : <Mic size={12} />} {browserPhone.muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button onClick={browserPhone.hangUp}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition">
                    <PhoneOff size={12} /> {browserPhone.state === 'on_call'
                      ? `${String(Math.floor(browserPhone.elapsed / 60)).padStart(2,'0')}:${String(browserPhone.elapsed % 60).padStart(2,'0')}`
                      : 'End'}
                  </button>
                </div>
              ) : (
                <button onClick={dial} disabled={!ready || dialing}
                  className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl transition">
                  {dialing ? <Loader2 size={13} className="animate-spin" /> : <Phone size={13} />} Call
                </button>
              )}

              {/* Offered only after a call, because that is when the agent
                  actually knows whether it was worth keeping. */}
              {lastCallId && !live && !showSave && (
                <button onClick={() => setShowSave(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-600 transition">
                  <UserPlus size={12} /> Save {prettyPhone(lastNumber.replace('+1',''))} as a lead
                </button>
              )}

              {showSave && (
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Name *" autoFocus
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-900" />
                  <input value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="Email (optional)"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-900" />
                  <textarea value={leadNotes} onChange={e => setLeadNotes(e.target.value)} rows={2} placeholder="What did they say?"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-slate-900 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowSave(false)}
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900">Cancel</button>
                    <button onClick={saveLead} disabled={!leadName.trim() || saving}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest transition">
                      {saving ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />} Add to pipeline
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
