'use client';

// Cross-sell opportunities dashboard.
//
// Owner view: your flags across all statuses, most-recent first.
// Admin view: every Open + Contacted flag across the team.
//
// Row actions (Mark Contacted / Mark Converted / Dismiss) POST to
// /api/partner/cross-sell-flags/[id]. Dismisses feed the rule
// dismiss-rate metric that auto-disables high-noise rules.

import { useState } from 'react';
import { ArrowRight, CheckCircle, XCircle, MessageSquare, TrendingUp, Clock, User, RefreshCw, Sparkles } from 'lucide-react';
import { useCrossSellFlags, type CrossSellFlag, type CrossSellStatus } from '../../hooks/useCrossSellFlags';
import { formatCurrency } from '../../lib/crmHelpers';
import { EmptyState, LoadingState } from '../ui/StateFeedback';

interface CrossSellPanelProps {
  currentUid: string | undefined;
  isAdmin: boolean;
  onOpenDeal?: (referralId: string) => void;
}

const STATUS_BADGE: Record<CrossSellStatus, { label: string; className: string }> = {
  Open:      { label: 'OPEN',      className: 'bg-amber-100 text-amber-800 border-amber-200' },
  Contacted: { label: 'CONTACTED', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  Converted: { label: 'CONVERTED', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  Dismissed: { label: 'DISMISSED', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function ageDays(flaggedAt: any): number {
  if (!flaggedAt) return 0;
  const ms = typeof flaggedAt?.toMillis === 'function'
    ? flaggedAt.toMillis()
    : (typeof flaggedAt === 'string' ? new Date(flaggedAt).getTime() : NaN);
  if (isNaN(ms)) return 0;
  return Math.floor((Date.now() - ms) / 86400000);
}

function FlagRow({
  flag,
  onOpenDeal,
  onContacted,
  onConverted,
  onDismissed,
  onReopen,
}: {
  flag: CrossSellFlag;
  onOpenDeal?: (id: string) => void;
  onContacted: () => void;
  onConverted: () => void;
  onDismissed: () => void;
  onReopen: () => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | 'contacted' | 'converted' | 'dismissed'>(null);
  const [note, setNote] = useState('');
  const days = ageDays(flag.flaggedAt);
  const badge = STATUS_BADGE[flag.status];
  const isTerminal = flag.status === 'Converted' || flag.status === 'Dismissed';

  const submit = () => {
    if (pendingAction === 'contacted') onContacted();
    if (pendingAction === 'converted') onConverted();
    if (pendingAction === 'dismissed') onDismissed();
    setShowNote(false);
    setPendingAction(null);
    setNote('');
  };

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm ${flag.status === 'Open' && days >= 3 ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${badge.className}`}>
              {badge.label}
            </span>
            {flag.status === 'Open' && (
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${days >= 7 ? 'bg-red-100 text-red-800' : days >= 3 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                {days}d old
              </span>
            )}
            {flag.crossSellKind === 'realtor-offer-to-mortgage' && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Realtor → Mortgage</span>
            )}
          </div>
          <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">{flag.clientName}</h3>
          {typeof flag.loanAmount === 'number' && flag.loanAmount > 0 && (
            <p className="text-xs text-gray-500 font-bold mt-0.5">Est. loan {formatCurrency(flag.loanAmount)}</p>
          )}
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{flag.summary}</p>
          {flag.actionNote && (
            <p className="text-xs text-gray-500 mt-2 italic leading-relaxed border-l-2 border-gray-200 pl-3">
              <MessageSquare size={10} className="inline mr-1"/> {flag.actionNote}
            </p>
          )}
        </div>
        {onOpenDeal && (
          <button
            onClick={() => onOpenDeal(flag.sourceReferralId)}
            className="shrink-0 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1 transition"
          >
            Open deal <ArrowRight size={10}/>
          </button>
        )}
      </div>

      {/* Timeline metadata */}
      <div className="flex items-center gap-4 flex-wrap text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
        {flag.contactedAt && (<span className="flex items-center gap-1"><MessageSquare size={10}/> Contacted {new Date(flag.contactedAt).toLocaleDateString()}</span>)}
        {flag.convertedAt && (<span className="flex items-center gap-1 text-emerald-700"><TrendingUp size={10}/> Converted {new Date(flag.convertedAt).toLocaleDateString()}</span>)}
        {flag.dismissedAt && (<span className="flex items-center gap-1 text-gray-500"><XCircle size={10}/> Dismissed {new Date(flag.dismissedAt).toLocaleDateString()}</span>)}
        {flag.lastEscalationLevel && flag.lastEscalationLevel > 0 && flag.status === 'Open' && (
          <span className="flex items-center gap-1 text-amber-700"><Clock size={10}/> Escalated L{flag.lastEscalationLevel}</span>
        )}
      </div>

      {/* Actions */}
      {!isTerminal && !showNote && (
        <div className="flex items-center gap-2 flex-wrap">
          {flag.status === 'Open' && (
            <button
              onClick={() => { setPendingAction('contacted'); setShowNote(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1 transition shadow-sm"
            >
              <MessageSquare size={10}/> Mark Contacted
            </button>
          )}
          <button
            onClick={() => { setPendingAction('converted'); setShowNote(true); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1 transition shadow-sm"
          >
            <Sparkles size={10}/> Mark Converted
          </button>
          <button
            onClick={() => { setPendingAction('dismissed'); setShowNote(true); }}
            className="ml-auto text-gray-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
            title="Not applicable — trains the rules engine to fire less"
          >
            <XCircle size={10}/> Dismiss
          </button>
        </div>
      )}

      {/* Note prompt (optional but strongly encouraged for dismisses) */}
      {showNote && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 animate-fade-in">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            {pendingAction === 'dismissed' ? 'Why dismiss? (helps tune the rule)' : 'Add a note (optional)'}
          </p>
          <textarea
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 500))}
            placeholder={pendingAction === 'dismissed' ? "e.g. Client already has mortgage locked with TD" : 'Notes on your conversation…'}
            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex items-center gap-2 mt-2 justify-end">
            <button
              onClick={() => { setShowNote(false); setPendingAction(null); setNote(''); }}
              className="text-gray-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition"
            >Cancel</button>
            <button
              onClick={submit}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition shadow-sm"
            >Confirm</button>
          </div>
        </div>
      )}

      {isTerminal && (
        <button
          onClick={onReopen}
          className="text-gray-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
        >
          <RefreshCw size={10}/> Reopen
        </button>
      )}
    </div>
  );
}

export default function CrossSellPanel({ currentUid, isAdmin, onOpenDeal }: CrossSellPanelProps) {
  const { flags, openCount, loading, markContacted, markConverted, dismiss, reopen } = useCrossSellFlags({
    currentUid,
    isAdmin,
  });
  const [filter, setFilter] = useState<'all' | CrossSellStatus>('all');

  const visible = filter === 'all' ? flags : flags.filter(f => f.status === filter);

  const openFlags = flags.filter(f => f.status === 'Open').length;
  const contactedFlags = flags.filter(f => f.status === 'Contacted').length;
  const convertedFlags = flags.filter(f => f.status === 'Converted').length;
  const dismissedFlags = flags.filter(f => f.status === 'Dismissed').length;

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open',      value: openFlags,      tone: 'amber' },
          { label: 'Contacted', value: contactedFlags, tone: 'blue' },
          { label: 'Converted', value: convertedFlags, tone: 'emerald' },
          { label: 'Dismissed', value: dismissedFlags, tone: 'gray' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setFilter(filter === s.label as any ? 'all' : s.label as any)}
            className={`bg-white p-4 rounded-2xl border transition text-left ${filter === s.label ? 'border-slate-900 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <p className={`text-[10px] font-black uppercase tracking-widest text-${s.tone}-700 mb-1`}>{s.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Filter chip */}
      {filter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            {filter} <XCircle size={10}/>
          </button>
        </div>
      )}

      {/* Body */}
      {loading && <LoadingState label="Loading opportunities"/>}

      {!loading && flags.length === 0 && (
        <EmptyState
          icon={CheckCircle}
          title="No cross-sell opportunities yet"
          description={isAdmin
            ? 'When a realtor deal hits Offer Made without a linked mortgage, it will land here.'
            : 'When one of your realtor deals hits Offer Made without a linked mortgage, we\'ll surface the opportunity here.'}
        />
      )}

      {!loading && flags.length > 0 && (
        <div className="space-y-3">
          {visible.map(f => (
            <FlagRow
              key={f.id}
              flag={f}
              onOpenDeal={onOpenDeal}
              onContacted={() => markContacted(f.id)}
              onConverted={() => markConverted(f.id)}
              onDismissed={() => dismiss(f.id)}
              onReopen={() => reopen(f.id)}
            />
          ))}
        </div>
      )}

      {/* Footer — the fatigue guardrail philosophy */}
      {!loading && flags.length > 0 && (
        <p className="text-[10px] text-gray-500 font-medium text-center leading-relaxed pt-2">
          <span className="font-bold">Dismiss</span> teaches the rules engine to fire less. If more than 30% of flags from a rule are dismissed over 14 days, the rule auto-disables.
        </p>
      )}
    </div>
  );
}
