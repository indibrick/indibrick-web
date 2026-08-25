'use client';

// Bell-icon inbox in the partner header. Subscribes to the user's
// /notifications via useNotifications, renders a scrollable dropdown
// with per-row actions (mark read, snooze 1d/7d, dismiss, jump to
// deal). Snoozed rows are hidden from the badge but visible in the
// dropdown so the user can undo.
//
// The task-fatigue guardrail Sales Coach flagged as adoption risk #1
// is enforced by two affordances on every row:
//   1. 1-click Dismiss  → row disappears + rule_events tally
//   2. 1-click Snooze 7d → row hidden from badge, undoable
// If a rule's dismiss rate crosses 30% over 14 days, the rules-admin
// UI (future) auto-disables it based on that tally.

import { useState } from 'react';
import { Bell, Check, X, Clock, ArrowRight, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { useNotifications, type NotificationDoc } from '../../hooks/useNotifications';

interface InAppInboxProps {
  currentUid: string | undefined;
  onOpenDeal?: (referralId: string) => void;
}

function severityStyles(s: NotificationDoc['severity']) {
  switch (s) {
    case 'urgent': return { icon: AlertTriangle, dot: 'bg-red-500', border: 'border-l-red-500' };
    case 'warn':   return { icon: AlertTriangle, dot: 'bg-amber-500', border: 'border-l-amber-500' };
    default:       return { icon: Info,          dot: 'bg-blue-500',  border: 'border-l-blue-500' };
  }
}

function relativeTime(iso: string | any | undefined): string {
  if (!iso) return '';
  // Handle both Firestore Timestamp objects and ISO strings.
  const ms = typeof iso === 'string'
    ? new Date(iso).getTime()
    : (typeof iso?.toMillis === 'function' ? iso.toMillis() : NaN);
  if (isNaN(ms)) return '';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function isSnoozed(n: NotificationDoc): boolean {
  if (!n.snoozedUntil) return false;
  const until = new Date(n.snoozedUntil).getTime();
  return !isNaN(until) && until > Date.now();
}

export default function InAppInbox({ currentUid, onOpenDeal }: InAppInboxProps) {
  const [open, setOpen] = useState(false);
  const {
    notifications, unreadCount, loading,
    markRead, dismiss, snooze7d, snooze1d, unsnooze,
  } = useNotifications(currentUid);

  const activeCount = notifications.filter(n => !isSnoozed(n)).length;
  const snoozedCount = notifications.filter(isSnoozed).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:border-slate-900 hover:bg-slate-50 transition text-slate-700 shadow-sm"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop for click-outside close */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[70vh]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inbox</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  {loading ? 'Loading…' : `${activeCount} active${snoozedCount > 0 ? ` · ${snoozedCount} snoozed` : ''}`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-slate-900 p-1"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading && (
                <div className="p-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                  Loading…
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Check size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-black text-slate-900">You're all caught up</p>
                  <p className="text-xs text-gray-500 mt-1">No pending alerts.</p>
                </div>
              )}
              {!loading && notifications.map(n => {
                const { icon: Icon, dot, border } = severityStyles(n.severity);
                const snoozed = isSnoozed(n);
                return (
                  <div
                    key={n.id}
                    className={`border-l-4 ${border} border-b border-gray-100 p-4 transition ${n.read ? 'bg-white' : 'bg-blue-50/30'} ${snoozed ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${dot} mt-1.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black text-slate-900 leading-snug">{n.title}</p>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0 mt-0.5">
                            {relativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.body}</p>
                        {snoozed && n.snoozedUntil && (
                          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                            <Clock size={10}/> Snoozed until {new Date(n.snoozedUntil).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Row actions — keep it flat, 1-click */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {n.link?.referralId && onOpenDeal && (
                        <button
                          onClick={() => {
                            markRead(n.id);
                            onOpenDeal(n.link!.referralId!);
                            setOpen(false);
                          }}
                          className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                        >
                          Open deal <ArrowRight size={10}/>
                        </button>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="text-gray-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
                        >
                          <Check size={10}/> Read
                        </button>
                      )}
                      {snoozed ? (
                        <button
                          onClick={() => unsnooze(n.id)}
                          className="text-gray-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
                        >
                          <RefreshCw size={10}/> Unsnooze
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => snooze1d(n.id)}
                            className="text-gray-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg hover:bg-gray-50 transition"
                            title="Hide for 1 day"
                          >
                            1d
                          </button>
                          <button
                            onClick={() => snooze7d(n.id)}
                            className="text-gray-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg hover:bg-gray-50 transition"
                            title="Hide for 7 days (auto-tuning signal)"
                          >
                            7d
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => dismiss(n.id)}
                        className="ml-auto text-gray-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
                        title="Not applicable — dismiss"
                      >
                        <X size={10}/> Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer — inline "task fatigue" note surfaces the philosophy */}
            {!loading && notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50 shrink-0">
                <p className="text-[10px] text-gray-500 font-medium text-center leading-relaxed">
                  Not useful? <span className="font-bold">Dismiss</span> teaches the rules engine to fire less. <span className="font-bold">Snooze</span> hides without training.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
