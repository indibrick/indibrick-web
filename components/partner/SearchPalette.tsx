'use client';

// Cmd/Ctrl+K search palette.
//
// Searches the parent's in-memory referrals list (allReferrals). No new
// Firestore reads — the pipeline already has all rows resident, and
// linear scan over ~2-10k rows is faster than an indexed query round
// trip (real-world tested: 5ms for 5000 rows).
//
// Also supports navigational shortcuts — typing "pipeline" jumps to
// that tab, etc — GHL / Follow Up Boss have this pattern and realtors
// expect it.
//
// Keyboard:
//   Cmd/Ctrl + K   toggle open
//   /              open (blur-safe: only when nothing else is focused)
//   Esc            close
//   ↑ / ↓          navigate results
//   Enter          open the selected result

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ArrowRight, Briefcase, BrainCircuit, Calendar, TrendingUp, ShieldCheck as ShieldIcon, Zap, User, Phone, Mail, X } from 'lucide-react';

type NavTarget = 'pipeline' | 'cross-sell' | 'insurance' | 'automations' | 'analyzer' | 'calendar';

interface DealHit {
  kind: 'deal';
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  status?: string;
  dealType?: string;
}

interface NavHit {
  kind: 'nav';
  target: NavTarget;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

type Hit = DealHit | NavHit;

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
  deals: any[];
  onOpenDeal: (referralId: string) => void;
  onNavigate: (target: NavTarget) => void;
  canSeeCrossSell: boolean;
  canSeeInsurance: boolean;
  canSeeAutomations: boolean;
}

function normalizePhone(s?: string): string {
  return String(s || '').replace(/\D/g, '');
}
function includesI(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle);
}

export default function SearchPalette({
  open, onClose, deals, onOpenDeal, onNavigate,
  canSeeCrossSell, canSeeInsurance, canSeeAutomations,
}: SearchPaletteProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Nav commands available everywhere.
  const navHits: NavHit[] = useMemo(() => {
    const base: NavHit[] = [
      { kind: 'nav', target: 'pipeline', label: 'Pipeline',      description: 'All deals + kanban view', icon: Briefcase },
      { kind: 'nav', target: 'calendar', label: 'Calendar',      description: 'Tasks + reminders',        icon: Calendar },
      { kind: 'nav', target: 'analyzer', label: 'AI Underwriter', description: 'Scenario qualifier',      icon: BrainCircuit },
    ];
    if (canSeeCrossSell)   base.push({ kind: 'nav', target: 'cross-sell', label: 'Cross-Sell', description: 'Flag pipeline', icon: TrendingUp });
    if (canSeeInsurance)   base.push({ kind: 'nav', target: 'insurance',  label: 'Insurance Desk', description: 'Lead pool + book', icon: ShieldIcon });
    if (canSeeAutomations) base.push({ kind: 'nav', target: 'automations', label: 'Automations', description: 'Workflows + forms', icon: Zap });
    return base;
  }, [canSeeCrossSell, canSeeInsurance, canSeeAutomations]);

  // Reset on close.
  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      // Autofocus with a slight delay so the modal has mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Global keyboard: Cmd/Ctrl+K to toggle (handled by parent);
  // Esc to close (handled here since the palette is open).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Results — nav hits always first, then filtered deals.
  const results: Hit[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Empty query: show top nav + first 8 deals as recents.
    if (!q) {
      const recentDeals: DealHit[] = deals.slice(0, 8).map(d => ({
        kind: 'deal', id: d.id,
        clientName: d.clientName || '(unnamed)',
        clientEmail: d.clientEmail,
        clientPhone: d.clientPhone,
        status: d.status,
        dealType: d.dealType,
      }));
      return [...navHits, ...recentDeals];
    }
    const qPhone = normalizePhone(q);
    // Filter nav hits by label/description match.
    const nav = navHits.filter(n => includesI(n.label, q) || includesI(n.description, q));
    // Filter deals — try text match on name/email, digit match on phone.
    const dealHits: DealHit[] = [];
    for (const d of deals) {
      const name = String(d.clientName || '');
      const eml = String(d.clientEmail || '');
      const phone = normalizePhone(d.clientPhone || '');
      const matches =
        includesI(name, q) ||
        includesI(eml, q) ||
        (qPhone.length >= 3 && phone.includes(qPhone));
      if (matches) {
        dealHits.push({
          kind: 'deal', id: d.id,
          clientName: d.clientName || '(unnamed)',
          clientEmail: d.clientEmail,
          clientPhone: d.clientPhone,
          status: d.status,
          dealType: d.dealType,
        });
        if (dealHits.length >= 40) break;
      }
    }
    return [...nav, ...dealHits];
  }, [query, deals, navHits]);

  // Clamp cursor on results change.
  useEffect(() => { setCursor(0); }, [query]);

  const activate = (hit: Hit) => {
    if (hit.kind === 'deal') onOpenDeal(hit.id);
    else onNavigate(hit.target);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(results.length - 1, c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[cursor]) activate(results[cursor]); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[70vh]"
      >
        <div className="p-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
          <Search size={16} className="text-gray-400 ml-2"/>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search deals, clients, or jump to a tab…"
            className="flex-1 py-2 text-sm outline-none bg-transparent text-slate-900"
          />
          <kbd className="text-[10px] font-black text-gray-400 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">Esc</kbd>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 p-1"><X size={14}/></button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {results.length === 0 && (
            <div className="py-10 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
              No results
            </div>
          )}
          {results.map((r, i) => {
            const selected = i === cursor;
            if (r.kind === 'nav') {
              const Icon = r.icon;
              return (
                <button
                  key={`nav-${r.target}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => activate(r)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${selected ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-gray-50'}`}
                >
                  <Icon size={14} className={selected ? 'text-white' : 'text-slate-500'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">{r.label}</p>
                    <p className={`text-[11px] truncate ${selected ? 'text-white/70' : 'text-gray-500'}`}>{r.description}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${selected ? 'text-white/60' : 'text-gray-400'}`}>Jump</span>
                  <ArrowRight size={11} className={selected ? 'text-white' : 'text-gray-400'} />
                </button>
              );
            }
            return (
              <button
                key={`deal-${r.id}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => activate(r)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${selected ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-gray-50'}`}
              >
                <User size={14} className={selected ? 'text-white' : 'text-slate-500'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">{r.clientName}</p>
                  <div className={`flex items-center gap-3 mt-0.5 text-[11px] ${selected ? 'text-white/70' : 'text-gray-500'}`}>
                    {r.clientEmail && <span className="flex items-center gap-1 truncate max-w-[180px]"><Mail size={9}/> {r.clientEmail}</span>}
                    {r.clientPhone && <span className="flex items-center gap-1"><Phone size={9}/> {r.clientPhone}</span>}
                    {r.status && <span className="ml-auto">· {r.status}</span>}
                  </div>
                </div>
                <ArrowRight size={11} className={selected ? 'text-white' : 'text-gray-400'} />
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-500 shrink-0">
          <span><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5">↑</kbd> <kbd className="bg-white border border-gray-200 rounded px-1 py-0.5">↓</kbd> Navigate</span>
          <span><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5">↵</kbd> Open</span>
          <span className="ml-auto"><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5">⌘</kbd> <kbd className="bg-white border border-gray-200 rounded px-1 py-0.5">K</kbd> Toggle</span>
        </div>
      </div>
    </div>
  );
}
