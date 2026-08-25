'use client';

// Dry-run panel — shown inline inside the WorkflowBuilder as a
// collapsible panel. Lets the admin test a workflow before enabling
// it: pick a sample referral (or auto-pick the most recent),
// optionally mock a status/tag change, and see:
//   1. Would the trigger fire?
//   2. Would the conditions pass?
//   3. What actions would run (with interpolated titles/bodies)?
//
// Note: the DRAFT the editor holds isn't persisted yet, so the
// dry-run endpoint reads the current STORED workflow. Editors that
// haven't saved yet see the last-saved version tested. UX-honest
// message tells the user this.

import { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, Mail, Bell, Zap, Tag, Activity, Globe, Ban } from 'lucide-react';
import { authedPost } from '../../lib/apiClient';
import { useToast } from '../ui/ToastProvider';
import type { ActionPreview } from '../../lib/workflowInterpreter';

interface DryRunPanelProps {
  workflowId: string | undefined;   // undefined = unsaved draft, disable the panel
  dirtyDraft: boolean;              // editor has unsaved changes
}

interface DryRunResponse {
  workflow: { id: string; name: string; triggerType: string };
  sampleReferralId: string;
  triggerFired: boolean;
  conditionsPassed: boolean;
  skippedReason?: string;
  actions: ActionPreview[];
}

const ACTION_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  notify_user: Bell,
  send_email: Mail,
  create_task: Activity,
  set_status: Zap,
  add_tag: Tag,
  webhook: Globe,
  send_sms: Ban,
};

export default function WorkflowDryRunPanel({ workflowId, dirtyDraft }: DryRunPanelProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DryRunResponse | null>(null);
  const [referralId, setReferralId] = useState('');
  const [mockStatus, setMockStatus] = useState('');
  const [mockTag, setMockTag] = useState('');
  const [treatAsCreate, setTreatAsCreate] = useState(true);

  const run = async () => {
    if (!workflowId) {
      toast.warn('Save the workflow first', 'The dry-run reads the stored copy — save your draft to test the latest.');
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const mockAfter: Record<string, any> = {};
      if (mockStatus.trim()) mockAfter.status = mockStatus.trim();
      if (mockTag.trim()) mockAfter.leadTag = mockTag.trim();
      const res = await authedPost(`/api/partner/workflows/${workflowId}/dry-run`, {
        referralId: referralId.trim() || undefined,
        mockAfter: Object.keys(mockAfter).length ? mockAfter : undefined,
        treatAsCreate,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error('Dry-run failed', data.error); setRunning(false); return; }
      setResult(data);
    } catch (e: any) {
      toast.error('Network error', e?.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="bg-white p-4 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2"><Play size={12}/> Test run</h3>
          <p className="text-[10px] text-gray-500 mt-1">Preview which actions would fire without writing anything.</p>
        </div>
        <button onClick={() => setOpen(v => !v)}
          className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 flex items-center gap-1">
          {open ? <>Hide <ChevronUp size={11}/></> : <>Show <ChevronDown size={11}/></>}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {dirtyDraft && workflowId && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
              Draft has unsaved changes. Dry-run evaluates the last <em>saved</em> version — save first to test what you're editing.
            </div>
          )}
          {!workflowId && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
              Save the workflow first to run a dry-run.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Sample referral id (optional)</span>
              <input type="text" value={referralId} onChange={e => setReferralId(e.target.value)}
                placeholder="Latest if empty"
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900 font-mono"/>
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Mock status change to</span>
              <input type="text" value={mockStatus} onChange={e => setMockStatus(e.target.value)}
                placeholder="e.g. Firm Sale"
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900"/>
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Mock lead tag to</span>
              <input type="text" value={mockTag} onChange={e => setMockTag(e.target.value)}
                placeholder="e.g. Hot"
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900"/>
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={treatAsCreate} onChange={e => setTreatAsCreate(e.target.checked)}
              className="w-4 h-4 accent-slate-900"/>
            <span className="font-bold text-slate-900">Treat as create</span>
            <span className="text-gray-500">— unchecked = use the referral's current state as `before` (needed for change triggers)</span>
          </label>

          <button onClick={run} disabled={running || !workflowId}
            className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm disabled:opacity-50">
            {running ? <Loader2 size={11} className="animate-spin"/> : <Play size={11}/>} Run dry-run
          </button>

          {result && (
            <div className="mt-3 space-y-2">
              <div className={`p-3 rounded-xl border ${result.triggerFired && result.conditionsPassed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} flex items-start gap-2`}>
                {result.triggerFired && result.conditionsPassed
                  ? <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5"/>
                  : <XCircle size={14} className="text-amber-600 shrink-0 mt-0.5"/>}
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {result.triggerFired && result.conditionsPassed
                      ? `Would fire — ${result.actions.length} action${result.actions.length === 1 ? '' : 's'}`
                      : 'Would not fire'}
                  </p>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Trigger {result.triggerFired ? 'matched' : 'did not match'}
                    {result.triggerFired ? ` · Conditions ${result.conditionsPassed ? 'passed' : 'failed'}` : ''}
                  </p>
                  {result.skippedReason && (
                    <p className="text-[11px] text-slate-600 mt-1">{result.skippedReason}</p>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">Sample: {result.sampleReferralId}</p>
                </div>
              </div>

              {result.actions.length > 0 && (
                <div className="space-y-2">
                  {result.actions.map((a, i) => {
                    const Icon = ACTION_ICON[a.type] || Zap;
                    return (
                      <div key={i} className={`bg-white border ${a.supported ? 'border-gray-200' : 'border-red-200 bg-red-50'} rounded-xl p-3 flex items-start gap-2`}>
                        <Icon size={14} className={a.supported ? 'text-blue-600 shrink-0 mt-0.5' : 'text-red-600 shrink-0 mt-0.5'}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900">{a.type}</p>
                          <p className="text-xs text-slate-700 mt-0.5">{a.summary}</p>
                          {!a.supported && <p className="text-[10px] text-red-700 font-bold mt-1">This action won't dispatch until its backend is wired.</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
