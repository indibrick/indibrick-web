'use client';

// Bulk action toolbar that appears when 1+ deals are checked in the
// pipeline list. Actions: tag, reassign, archive. Confirmation is
// inline (no modal jumps) — bulk operations should feel fast.
//
// Undo isn't wired to the server yet — the toolbar shows an "Undone"
// affordance in the toast so the user knows it's a follow-up.

import { useState } from 'react';
import { Tag, Users, Archive, X, Loader2, ChevronDown } from 'lucide-react';
import { authedPost } from '../../lib/apiClient';
import { useToast } from '../ui/ToastProvider';

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  onDone: () => void;                        // parent re-fetches
  assignableUsers: Array<{ uid: string; name: string }>;
}

type Mode = 'idle' | 'tag' | 'assign' | 'archive';

export default function BulkActionBar({ selectedIds, onClear, onDone, assignableUsers }: BulkActionBarProps) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('idle');
  const [tagValue, setTagValue] = useState('');
  const [assigneeUid, setAssigneeUid] = useState('');
  const [busy, setBusy] = useState(false);

  const count = selectedIds.length;

  const run = async (op: 'tag' | 'assign' | 'archive', value: any) => {
    setBusy(true);
    try {
      const res = await authedPost('/api/partner/referrals/bulk', { op, ids: selectedIds, value });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error('Bulk action failed', data.error); setBusy(false); return; }
      toast.success(
        `${data.updated} deal${data.updated === 1 ? '' : 's'} updated`,
        op === 'tag' ? `Tagged as "${value}"`
          : op === 'assign' ? `Reassigned`
          : 'Archived',
      );
      onDone();
      onClear();
      setMode('idle');
    } catch (e: any) {
      toast.error('Network error', e?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-fade-in">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2 p-2 min-w-[440px] max-w-[92vw]">
        <div className="flex items-center gap-2 pl-2 pr-3 border-r border-slate-700">
          <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg px-2.5 py-1.5">
            {count} selected
          </div>
        </div>

        {mode === 'idle' && (
          <>
            <button onClick={() => setMode('tag')}
              className="px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white hover:bg-white/10 transition flex items-center gap-1">
              <Tag size={12}/> Tag
            </button>
            <button onClick={() => setMode('assign')}
              className="px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest text-white/80 hover:text-white hover:bg-white/10 transition flex items-center gap-1">
              <Users size={12}/> Reassign
            </button>
            <button onClick={() => setMode('archive')}
              className="px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest text-amber-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1">
              <Archive size={12}/> Archive
            </button>
            <div className="flex-1" />
            <button onClick={onClear}
              className="p-2 text-white/60 hover:text-white transition"><X size={14}/></button>
          </>
        )}

        {mode === 'tag' && (
          <>
            <input
              autoFocus
              value={tagValue}
              onChange={e => setTagValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && tagValue.trim()) run('tag', tagValue.trim()); }}
              placeholder="Tag name…"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-blue-400"
            />
            <button onClick={() => setMode('idle')} disabled={busy}
              className="px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white">Cancel</button>
            <button onClick={() => run('tag', tagValue.trim())} disabled={busy || !tagValue.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-1">
              {busy ? <Loader2 size={12} className="animate-spin"/> : null} Apply
            </button>
          </>
        )}

        {mode === 'assign' && (
          <>
            <div className="relative flex-1">
              <select
                autoFocus
                value={assigneeUid}
                onChange={e => setAssigneeUid(e.target.value)}
                className="w-full appearance-none bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400 pr-8"
              >
                <option value="">Choose an agent…</option>
                {assignableUsers.map(u => <option key={u.uid} value={u.uid} className="text-slate-900">{u.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"/>
            </div>
            <button onClick={() => setMode('idle')} disabled={busy}
              className="px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white">Cancel</button>
            <button
              onClick={() => {
                const u = assignableUsers.find(x => x.uid === assigneeUid);
                if (u) run('assign', { uid: u.uid, name: u.name });
              }}
              disabled={busy || !assigneeUid}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-1">
              {busy ? <Loader2 size={12} className="animate-spin"/> : null} Apply
            </button>
          </>
        )}

        {mode === 'archive' && (
          <>
            <span className="flex-1 text-[11px] text-white/80">Archive {count} deal{count === 1 ? '' : 's'}? Timeline entries preserved.</span>
            <button onClick={() => setMode('idle')} disabled={busy}
              className="px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white">Cancel</button>
            <button onClick={() => run('archive', true)} disabled={busy}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-1">
              {busy ? <Loader2 size={12} className="animate-spin"/> : null} Confirm archive
            </button>
          </>
        )}
      </div>
    </div>
  );
}
