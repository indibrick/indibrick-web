'use client';

// Drip sequences dashboard.

import { useState } from 'react';
import { Plus, Zap, Users, CheckCircle, Clock } from 'lucide-react';
import { useDripSequences } from '../../hooks/useDripSequences';
import DripSequenceEditor from './DripSequenceEditor';
import { EmptyState, LoadingState } from '../ui/StateFeedback';
import { useToast } from '../ui/ToastProvider';
import type { DripSequenceDoc } from '../../lib/dripShape';

interface DripsPanelProps {
  currentUid: string | undefined;
}

function formatTs(ts: any): string {
  if (!ts) return '—';
  const ms = typeof ts === 'string' ? new Date(ts).getTime()
    : (typeof ts?.toMillis === 'function' ? ts.toMillis() : NaN);
  if (isNaN(ms)) return '—';
  return new Date(ms).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function DripsPanel({ currentUid }: DripsPanelProps) {
  const toast = useToast();
  const { sequences, loading, create, update, remove, enroll } = useDripSequences(currentUid);
  const [editing, setEditing] = useState<null | { mode: 'new' } | { mode: 'edit'; seq: DripSequenceDoc }>(null);

  const enrollFromMyPipeline = async (seqId: string, filter: any) => {
    const res = await enroll(seqId, { recipientFilter: filter });
    if (!res.ok) { toast.error('Enroll failed', res.error); return; }
    const bits = [`${res.enrolled ?? 0} enrolled`];
    if (res.suppressedCount) bits.push(`${res.suppressedCount} suppressed`);
    if (res.alreadyEnrolledCount) bits.push(`${res.alreadyEnrolledCount} already in sequence`);
    toast.success('Enrollment queued', bits.join(' · '));
  };

  return (
    <div className="animate-fade-in-up space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Drip sequences</h2>
          <p className="text-xs text-gray-500 mt-0.5">Multi-step email follow-ups scheduled by days after enrollment.</p>
        </div>
        <button onClick={() => setEditing({ mode: 'new' })}
          className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm">
          <Plus size={12}/> New sequence
        </button>
      </div>

      {loading && <LoadingState label="Loading sequences"/>}

      {!loading && sequences.filter(s => !s.archivedAt).length === 0 && (
        <EmptyState
          icon={Zap}
          title="No drip sequences yet"
          description="Build a multi-step nurture — day 0 welcome, day 3 tips, day 7 CTA. Uses your existing email templates."
          action={{ label: 'New sequence', onClick: () => setEditing({ mode: 'new' }) }}
        />
      )}

      {!loading && sequences.filter(s => !s.archivedAt).length > 0 && (
        <div className="space-y-3">
          {sequences.filter(s => !s.archivedAt).map(seq => (
            <div key={seq.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${seq.enabled ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {seq.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{(seq.steps?.length || 0)} step{(seq.steps?.length || 0) === 1 ? '' : 's'}</span>
                    {seq.respectSuppression !== false && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-0.5"><CheckCircle size={10}/> respects opt-outs</span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight truncate">{seq.name}</h3>
                  {seq.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{seq.description}</p>}
                  <div className="flex items-center gap-4 flex-wrap text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><Users size={10}/> {seq.enrollmentCount || 0} enrolled all-time</span>
                    <span className="flex items-center gap-1"><Clock size={10}/> {seq.activeRuns || 0} active</span>
                    <span>· Updated {formatTs(seq.updatedAt)}</span>
                  </div>
                  {(seq.steps || []).slice(0, 5).map((step, i) => (
                    <div key={i} className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                      <span className="w-8 shrink-0 font-black text-slate-500 tracking-widest">D{step.waitDaysAfterEnroll}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${step.enabled === false ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-800'}`}>
                        step {i + 1}
                      </span>
                      <span className="text-slate-700 truncate">{step.templateId ? '' : '(no template picked)'}</span>
                    </div>
                  ))}
                  {(seq.steps?.length || 0) > 5 && <p className="text-[10px] text-gray-400 mt-1 pl-10">…{(seq.steps!.length - 5)} more</p>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => setEditing({ mode: 'edit', seq })}
                    className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (!seq.enabled) { toast.warn('Enable the sequence first.'); return; }
                      const status = window.prompt('Enroll everyone with which status? (Blank = every non-funded/non-lost)\nExamples: Contacted, In Progress, New', 'Contacted');
                      if (status === null) return;
                      enrollFromMyPipeline(seq.id, { status: status || undefined });
                    }}
                    disabled={!seq.enabled}
                    className="bg-white border border-gray-200 hover:border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition disabled:opacity-50">
                    Enroll from pipeline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <DripSequenceEditor
          currentUid={currentUid}
          initial={editing.mode === 'edit' ? editing.seq : undefined}
          onSave={async payload => {
            const res = editing.mode === 'edit' ? await update(editing.seq.id, payload) : await create(payload);
            if (res.ok) setEditing(null);
            return res;
          }}
          onCancel={() => setEditing(null)}
          onDelete={editing.mode === 'edit' ? async () => { await remove(editing.seq.id); setEditing(null); } : undefined}
        />
      )}

      {!loading && sequences.filter(s => !s.archivedAt).length > 0 && (
        <p className="text-[10px] text-gray-400 text-center">
          Runner sweeps every 5 min. Each step's CASL footer + Gmail one-click unsubscribe are baked in — same pipe as Campaigns.
        </p>
      )}
    </div>
  );
}
