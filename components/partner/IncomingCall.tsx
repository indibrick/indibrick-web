'use client';

// Inbound call prompt.
//
// Mounted once, app-wide, because a client ringing back should reach the
// agent wherever they are in the CRM — not only if they happen to have a
// deal open. Reads the shared device, so it never registers its own.

import React from 'react';
import { PhoneIncoming, PhoneOff, Phone } from 'lucide-react';
import { useBrowserPhone } from '../../hooks/useBrowserPhone';

function pretty(e164: string): string {
  const d = String(e164).replace(/\D/g, '').slice(-10);
  if (d.length !== 10) return e164 || 'Unknown caller';
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function IncomingCall() {
  const phone = useBrowserPhone();
  if (!phone.incoming) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[110] w-[19rem] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in-up">
      <div className="h-1 bg-green-500" />
      <div className="p-4">
        <div className="flex items-center gap-2 text-green-700 mb-1">
          <PhoneIncoming size={13} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Incoming call</span>
        </div>
        <div className="text-lg font-black tracking-tight text-slate-900 tabular-nums">
          {pretty(phone.incoming.from)}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={phone.rejectIncoming}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 hover:border-red-500 hover:text-red-600 text-slate-600 text-[10px] font-black uppercase tracking-widest transition"
          >
            <PhoneOff size={12} /> Decline
          </button>
          <button
            onClick={phone.acceptIncoming}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest transition"
          >
            <Phone size={12} /> Answer
          </button>
        </div>
      </div>
    </div>
  );
}
