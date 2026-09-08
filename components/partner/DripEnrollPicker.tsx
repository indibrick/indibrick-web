'use client';

// Multi-select client picker for drip enrollment.
//
// Replaces the window.prompt status filter that used to drive "Enroll from
// pipeline". The enroll endpoint has always accepted an explicit
// `referralIds` array — it was just never exposed, so the only way to enroll
// was to describe a filter and hope it matched who you meant.
//
// Picking specific people matters for a launch campaign: the Simcoe sequence
// is for buyers interested in four named communities, which is not a pipeline
// status and never will be.

import React, { useState, useMemo } from 'react';
import { X, Search, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Referral {
  id: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  status?: string;
  type?: string;
  referralDate?: string;
}

interface Props {
  sequenceName: string;
  stepCount: number;
  referrals: Referral[];
  onCancel: () => void;
  onEnroll: (referralIds: string[]) => Promise<void>;
}

export default function DripEnrollPicker({
  sequenceName, stepCount, referrals, onCancel, onEnroll,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  // A client with no email address can never receive a drip. Show them, but
  // greyed out and unselectable, so it's obvious why the count differs from
  // what you expected rather than silently dropping them server-side.
  const { eligible, ineligible } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = (r: Referral) =>
      !q ||
      String(r.clientName || '').toLowerCase().includes(q) ||
      String(r.clientEmail || '').toLowerCase().includes(q) ||
      String(r.status || '').toLowerCase().includes(q);
    const filtered = referrals.filter(match);
    return {
      eligible: filtered.filter((r) => String(r.clientEmail || '').includes('@')),
      ineligible: filtered.filter((r) => !String(r.clientEmail || '').includes('@')),
    };
  }, [referrals, search]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const allShownSelected = eligible.length > 0 && eligible.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) eligible.forEach((r) => next.delete(r.id));
      else eligible.forEach((r) => next.add(r.id));
      return next;
    });

  const submit = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      await onEnroll(Array.from(selected));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">

        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Enroll clients</p>
            <h3 className="text-lg font-black tracking-tight text-slate-900 truncate">{sequenceName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {stepCount} step{stepCount === 1 ? '' : 's'}. Day offsets run from enrollment, so everyone selected starts at day 0 today.
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-slate-900 hover:bg-gray-100 rounded-lg transition shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 shrink-0 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or status…"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-slate-900 transition"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allShownSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Select all shown ({eligible.length})
              </span>
            </label>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-slate-900 transition">
                Clear {selected.size}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {eligible.length === 0 && ineligible.length === 0 && (
            <div className="text-center py-12">
              <Users size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-500">No clients match that search.</p>
            </div>
          )}

          {eligible.map((r) => (
            <label
              key={r.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                selected.has(r.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(r.id)}
                onChange={() => toggle(r.id)}
                className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900 cursor-pointer shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900 truncate">{r.clientName || 'Unnamed client'}</p>
                <p className="text-[11px] text-gray-500 truncate">{r.clientEmail}</p>
              </div>
              {r.status && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-1 rounded shrink-0">
                  {r.status}
                </span>
              )}
            </label>
          ))}

          {ineligible.length > 0 && (
            <div className="pt-3 mt-2 border-t border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5 px-3 mb-2">
                <AlertTriangle size={11} /> No email address — cannot be enrolled ({ineligible.length})
              </p>
              {ineligible.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 opacity-60">
                  <div className="w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-500 truncate">{r.clientName || 'Unnamed client'}</p>
                    <p className="text-[11px] text-gray-400">{r.clientPhone || 'no contact details'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3 bg-gray-50">
          <p className="text-[11px] text-gray-500 leading-snug flex items-center gap-1.5 min-w-0">
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
            <span className="truncate">Opted-out clients are skipped automatically.</span>
          </p>
          <button
            onClick={submit}
            disabled={selected.size === 0 || busy}
            className="bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition shrink-0"
          >
            {busy ? 'Enrolling…' : `Enroll ${selected.size || ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
