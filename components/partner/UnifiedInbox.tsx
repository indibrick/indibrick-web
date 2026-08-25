'use client';
// One thread view mixing every touch we have on a contact — SMS,
// calls, emails, human notes, system events — sorted newest first.
// This is the "conversation" tab GHL/FUB lead their demo with.

import { useUnifiedTimeline, type TimelineRow } from '@/hooks/useUnifiedTimeline';
import { Mail, MessageSquare, PhoneCall, StickyNote, Info, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Props {
  referralId: string;
}

function timeShort(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function iconFor(row: TimelineRow) {
  switch (row.kind) {
    case 'sms':    return <MessageSquare size={14} className="text-blue-600"/>;
    case 'call':   return <PhoneCall size={14} className="text-emerald-600"/>;
    case 'email':  return <Mail size={14} className="text-purple-600"/>;
    case 'note':   return <StickyNote size={14} className="text-amber-600"/>;
    default:       return <Info size={14} className="text-neutral-500"/>;
  }
}

function DirectionArrow({ dir }: { dir?: string | null }) {
  if (dir === 'inbound') return <ArrowDownLeft size={11} className="text-neutral-400"/>;
  if (dir === 'outbound') return <ArrowUpRight size={11} className="text-neutral-400"/>;
  return null;
}

function Row({ row }: { row: TimelineRow }) {
  const isSystem = row.kind === 'system';
  return (
    <div className={`flex gap-3 px-3 py-2.5 border-b border-neutral-100 ${isSystem ? 'bg-neutral-50' : 'bg-white'}`}>
      <div className="mt-1 shrink-0">{iconFor(row)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="uppercase tracking-wide font-medium text-neutral-700">{row.kind}</span>
          <DirectionArrow dir={row.direction}/>
          <span>·</span>
          <span>{timeShort(row.at)}</span>
          {row.status && <span className="ml-auto text-[10px] uppercase text-neutral-400">{row.status}</span>}
        </div>
        {row.subject && (
          <div className="text-sm font-medium text-neutral-900 mt-0.5 truncate">{row.subject}</div>
        )}
        {row.body && (
          <div className="text-sm text-neutral-700 mt-0.5 whitespace-pre-wrap break-words line-clamp-4">{row.body}</div>
        )}
        {(row.from || row.to) && (
          <div className="text-[11px] text-neutral-500 mt-1 truncate">
            {row.from && <span>from {row.from}</span>}
            {row.from && row.to && <span> · </span>}
            {row.to && <span>to {row.to}</span>}
          </div>
        )}
        {row.meta?.recordingUrl && (
          <a href={row.meta.recordingUrl} target="_blank" rel="noreferrer"
             className="text-xs text-blue-600 hover:underline mt-1 inline-block">
            Recording ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function UnifiedInbox({ referralId }: Props) {
  const { rows, loading, error, refresh } = useUnifiedTimeline(referralId);

  if (loading) return <div className="text-sm text-neutral-500 p-4">Loading conversation…</div>;
  if (error) return <div className="text-sm text-red-600 p-4">{error}</div>;

  if (rows.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-neutral-500">No conversation history yet.</p>
        <p className="text-xs text-neutral-400 mt-1">SMS, calls, emails, and notes will appear here in one thread.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-neutral-50">
        <div className="text-xs text-neutral-500">{rows.length} events</div>
        <button onClick={refresh} className="text-xs text-neutral-500 hover:text-neutral-900">Refresh</button>
      </div>
      <div className="overflow-y-auto flex-1">
        {rows.map(r => <Row key={`${r.kind}:${r.id}`} row={r}/>)}
      </div>
    </div>
  );
}
