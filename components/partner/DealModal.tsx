'use client';

// DealModal — the giant 3-column deal detail overlay.
//
// Extracted from app/partner/page.tsx during Wave C to close the
// componentization that was deferred through Phase 1. All state +
// handlers stay in the parent — this component is a stateless view
// with a big props signature. Trade-off is intentional: the parent
// still owns the same complexity, but the JSX is no longer inline in
// a 2500-line file.

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Bot, Calendar, CheckCircle, Clock, Edit2, FileText, Gauge, Loader2, Lock, Mail, Network, PhoneCall, Save, Send, Shield, Sparkles, Star, Tag, Target, Trash2, User, Users, Wallet, X } from 'lucide-react';
import { CRMService } from '../../services/CRMService';
import { authedPost } from '../../lib/apiClient';
import { formatCurrency, REFERRAL_SOURCES, FUNDED_STATUSES, LOST_STATUSES } from '../../lib/crmHelpers';
import MessageThread from './MessageThread';
import UnifiedInbox from './UnifiedInbox';
import CustomFieldsInline from './CustomFieldsInline';
import type { CustomFieldDef } from '../../lib/customFieldsShape';
import type { useToast } from '../ui/ToastProvider';

// Pure helpers used inside the modal body. Extracted from parent
// during Wave C — no closure state, so they live here directly.

const SUBMITTED_STATES = ['Underwriting', 'Approved', 'Funded', 'Firm Sale', 'Firm / Conditional'];

function getSLAHealth(deal: any) {
  const hoursSinceCreation = (Date.now() - new Date(deal.referralDate || Date.now()).getTime()) / (1000 * 60 * 60);
  const callCount = deal.callCount || 0;
  const callSLA: 'passed' | 'breached' | 'pending' = callCount > 0 ? 'passed' : (hoursSinceCreation > 12 ? 'breached' : 'pending');
  const isSubmitted = SUBMITTED_STATES.includes(deal.status);
  const subSLA: 'passed' | 'breached' | 'pending' = isSubmitted ? 'passed' : (hoursSinceCreation > 48 ? 'breached' : 'pending');
  return { callCount, callSLA, subSLA, hoursSinceCreation };
}

function getDaysInStage(deal: any): number {
  const since = deal.stageEnteredAt || deal.referralDate;
  if (!since) return 0;
  return Math.floor((Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24));
}

// Right-column messaging.
//
// Primary interaction is MessageThread — SMS + calls, with its own
// composer. The full-history view (email + notes + SMS + calls in one
// stream) is exposed as an on-demand modal so the sidebar stays
// uncluttered when the agent just wants to text the client.
function DealConversation({ referralId, clientName, clientPhone }: {
  referralId: string; clientName?: string; clientPhone?: string;
}) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  return (
    <div className="space-y-2">
      <MessageThread referralId={referralId} clientName={clientName} clientPhone={clientPhone}/>
      <button
        onClick={() => setShowFullHistory(true)}
        className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 py-2 rounded-lg border border-dashed border-gray-200 hover:border-gray-400 transition"
      >
        View full history · email · notes
      </button>

      {showFullHistory && (
        <div className="fixed inset-0 z-[95] bg-slate-900/70 flex items-center justify-center p-4"
          onClick={() => setShowFullHistory(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Full conversation history</h3>
                <p className="text-xs text-neutral-500 truncate">{clientName || 'Client'} — every SMS, call, email, and note</p>
              </div>
              <button onClick={() => setShowFullHistory(false)} className="text-neutral-500 hover:text-neutral-900 p-1"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <UnifiedInbox referralId={referralId}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal DealMeta shape we consume — matches the useCRMData hook.
interface DealMetaEntry {
  sla: { callCount: number; callSLA: string; subSLA: string; hoursSinceCreation: number };
  days: number;
  progress: number;
  isWon: boolean;
  activeTask: any;
  score: number;
  scoreBand: 'red' | 'amber' | 'green';
  scoreHint: string;
}

interface EcoPartner { uid?: string; displayName?: string; email?: string; role?: string; }

export interface DealModalProps {
  deal: any;
  onClose: () => void;

  // State from parent (still owned there for handler continuity).
  logType: 'note_internal' | 'note_client' | 'log_call' | 'task' | 'route' | 'doc' | 'borrow_direct';
  setLogType: (v: DealModalProps['logType']) => void;
  logInput: string;
  setLogInput: (v: string) => void;
  taskDate: string;
  setTaskDate: (v: string) => void;
  targetPartnerId: string;
  setTargetPartnerId: (v: string) => void;
  docRequests: string[];
  setDocRequests: React.Dispatch<React.SetStateAction<string[]>>;
  bdForm: { loanAmount: string; ltv: string; position: string; propertyType: string; location: string; aiSummary: string };
  setBdForm: React.Dispatch<React.SetStateAction<any>>;
  isPublishing: boolean;
  nudgingOwner: boolean;
  isEditingClient: boolean;
  setIsEditingClient: (v: boolean) => void;
  editClientForm: { name: string; phone: string; email: string };
  setEditClientForm: React.Dispatch<React.SetStateAction<any>>;
  isEditingSummary: boolean;
  setIsEditingSummary: (v: boolean) => void;
  editSummaryText: string;
  setEditSummaryText: (v: string) => void;

  // Callbacks up to parent for continued state control.
  setSelectedDeal: React.Dispatch<React.SetStateAction<any>>;
  setAllReferrals: React.Dispatch<React.SetStateAction<any[]>>;
  setShowIntakeForm: (v: boolean) => void;

  // Handlers.
  handleStatusChange: (newStatus: string) => Promise<void>;
  handleTagUpdate: (newTag: string) => Promise<void>;
  handleReferralSourceUpdate: (value: string) => Promise<void>;
  handleActionSubmit: (e: React.FormEvent) => Promise<void>;
  handleCategoryUpdate: (newCategory: 'active' | 'potential') => Promise<void>;
  handleNudgeOwner: () => Promise<void>;
  handleEditClientSave: () => Promise<void>;
  handleSaveSummary: () => Promise<void>;
  handleDealValueSave: (loan: number, commission: number) => Promise<void>;
  handleAddParticipant: (e: React.ChangeEvent<HTMLSelectElement>) => Promise<void>;
  handleRemoveParticipant: (participant: any) => Promise<void>;
  handleDownloadVaultDoc: (doc: any) => Promise<void>;
  publishToBorrowDirect: () => Promise<void>;

  // Read-only context.
  fullName: string;
  partnerRole: string;
  user: { uid: string } | null;
  ecosystemPartners: EcoPartner[];
  PIPELINE_STAGES: readonly string[];
  customDealFields: CustomFieldDef[];
  dealMeta: Map<string, DealMetaEntry>;

  toast: ReturnType<typeof useToast>;

  // Copilot-flow toasts that render inside the modal body but whose
  // state lives in the parent (fired from the parent's handleActionSubmit
  // + escalation detector).
  aiTaskToast: { dueDate: string; description: string; isDefault?: boolean } | null;
  setAiTaskToast: (v: DealModalProps['aiTaskToast']) => void;
  escalationToast: { clientName: string } | null;
  setEscalationToast: (v: DealModalProps['escalationToast']) => void;

  // Data-refetch trigger for one flow that reloads after a doc request.
  loadProfileAndData: () => Promise<void> | void;

  // Full tasks list — Next Best Action IIFE inside the modal filters
  // this against the current deal's id.
  allTasks: any[];
}

export default function DealModal(props: DealModalProps) {
  const {
    deal, onClose,
    logType, setLogType, logInput, setLogInput, taskDate, setTaskDate,
    targetPartnerId, setTargetPartnerId, docRequests, setDocRequests,
    bdForm, setBdForm, isPublishing, nudgingOwner,
    isEditingClient, setIsEditingClient, editClientForm, setEditClientForm,
    isEditingSummary, setIsEditingSummary, editSummaryText, setEditSummaryText,
    setSelectedDeal, setAllReferrals, setShowIntakeForm,
    handleStatusChange, handleTagUpdate, handleReferralSourceUpdate, handleActionSubmit,
    handleCategoryUpdate, handleNudgeOwner, handleEditClientSave, handleSaveSummary,
    handleDealValueSave, handleAddParticipant, handleRemoveParticipant, handleDownloadVaultDoc,
    publishToBorrowDirect,
    fullName, partnerRole, user, ecosystemPartners, PIPELINE_STAGES, customDealFields, dealMeta,
    toast,
    aiTaskToast, setAiTaskToast, escalationToast, setEscalationToast,
    loadProfileAndData,
    allTasks,
  } = props;

  if (!deal) return null;

  // Today's date as YYYY-MM-DD in the local zone — used by the Next
  // Best Action selector to find non-past-due tasks for this deal.
  const todayDateString = new Date().toISOString().split('T')[0];

  return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div className="w-full max-w-[95vw] lg:max-w-7xl bg-[#F8FAFC] h-[95vh] rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 md:p-5 flex justify-between items-center gap-2 shrink-0">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                    <h2 className="text-lg md:text-2xl font-black tracking-tight flex items-center gap-3 truncate">
                       {deal.clientName}
                    </h2>
                    {/* Workflow marker: deal is in the realtor's list
                        but not yet requested for mortgage financing.
                        Admins can still see it (compliance + audit).
                        The chip tells the OWNER whether the file has
                        been handed to the brokerage. */}
                    {deal.pushedForMortgage === false && (
                      <span className="shrink-0 bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-slate-600" title="Not yet flagged for IndiBrick mortgage financing. Use Push for Mortgage when you want a broker on it.">
                        <Lock size={10}/> Not Pushed
                      </span>
                    )}
                    {deal.pushedForMortgage === true && deal.pushedForMortgageAt && (
                      <span className="shrink-0 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-500/40" title={`Pushed ${new Date(deal.pushedForMortgageAt).toLocaleDateString()}`}>
                        <CheckCircle size={10}/> Pushed
                      </span>
                    )}
                    {deal.dealCategory === 'active' ? (
                       <button onClick={() => handleCategoryUpdate('potential')} className="shrink-0 bg-green-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-green-400 transition shadow-sm"><CheckCircle size={12}/> Active Deal</button>
                    ) : (
                       <button onClick={() => handleCategoryUpdate('active')} className="shrink-0 bg-orange-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-green-400 transition shadow-sm"><Star size={12}/> <span className="hidden sm:inline">Activate & Email Login</span><span className="sm:hidden">Activate</span></button>
                    )}
                </div>
                <div className="flex gap-2 shrink-0">
                    {/* Push-for-mortgage CTA — only shown to the deal's
                        participants (referrer/assignee/participant) on
                        deals not yet pushed. Non-participants can never
                        see this because they can't open the modal
                        anyway (Firestore rules block the read). */}
                    {deal.pushedForMortgage === false && (
                      <button
                        onClick={async () => {
                          const note = window.prompt("Optional note for the broker (context on the client / financing needs):", "");
                          if (note === null) return; // user cancelled
                          try {
                            const res = await authedPost(`/api/partner/referrals/${deal.id}/push`, { note });
                            const data = await res.json();
                            if (!res.ok) { toast.error('Push failed', data?.error); return; }
                            const nowIso = new Date().toISOString();
                            const patch = { pushedForMortgage: true, pushedForMortgageAt: nowIso, pushedForMortgageBy: user?.uid, assignedAgentId: data.assignedTo || deal.assignedAgentId };
                            setSelectedDeal((prev: any) => prev ? { ...prev, ...patch } : prev);
                            setAllReferrals(prev => prev.map(r => r.id === deal.id ? { ...r, ...patch } : r));
                            toast.success('Deal pushed to IndiBrick', 'A broker will contact you shortly.');
                          } catch (e: any) {
                            toast.error('Network error', 'Please retry.');
                          }
                        }}
                        className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white px-3 md:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition shadow-lg"
                      >
                        <ArrowUpRight size={14}/> <span className="hidden sm:inline">Push for Mortgage</span><span className="sm:hidden">Push</span>
                      </button>
                    )}
                    <button onClick={() => setShowIntakeForm(true)} className="flex bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest items-center gap-2 transition shadow-lg"><Bot size={14}/> <span className="hidden sm:inline">Launch AI Intake</span><span className="sm:hidden">Intake</span></button>
                    <button onClick={() => onClose()} className="bg-white/10 hover:bg-white text-white hover:text-black p-2 rounded-lg transition"><X size={16}/></button>
                </div>
            </div>

            {/* Modal Body - 3 Columns. On mobile the body itself scrolls (columns stack); on desktop each column scrolls internally. */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row min-h-0">
               
               {/* COL 1: INTELLIGENCE & SLA (25%) — stacks on mobile, scrolls internally on desktop */}
               <div className="w-full lg:w-1/4 bg-white lg:border-r border-b lg:border-b-0 border-gray-200 p-5 lg:overflow-y-auto space-y-6">
                  
                  {/* Deal Score — 0-100 heuristic on top of SLA. Green/amber/red band mirrors the kanban chip. */}
                  {(() => {
                      const m = dealMeta.get(deal.id);
                      if (!m) return null;
                      const barColor = m.scoreBand === 'green' ? 'bg-emerald-500' : m.scoreBand === 'amber' ? 'bg-amber-500' : 'bg-red-500';
                      const bg = m.scoreBand === 'green' ? 'bg-emerald-50 border-emerald-200' : m.scoreBand === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
                      const textColor = m.scoreBand === 'green' ? 'text-emerald-800' : m.scoreBand === 'amber' ? 'text-amber-800' : 'text-red-800';
                      return (
                          <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><Sparkles size={12}/> Deal Score</h4>
                              <div className={`p-3 rounded-xl border ${bg}`}>
                                  <div className="flex items-baseline justify-between mb-2">
                                      <span className={`text-3xl font-black tracking-tight ${textColor}`}>{m.score}</span>
                                      <span className={`text-[9px] font-black uppercase tracking-widest ${textColor}`}>{m.scoreBand}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white/70 rounded-full overflow-hidden mb-2">
                                      <div className={`h-full ${barColor} transition-all`} style={{ width: `${m.score}%` }} />
                                  </div>
                                  <p className={`text-[10px] font-semibold ${textColor}`}>{m.scoreHint}</p>
                              </div>
                          </div>
                      );
                  })()}

                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><Gauge size={12}/> SLA Health</h4>
                     <div className="space-y-3">
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                           <div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase">Mandatory Touches</span><span className="text-[10px] font-black">{deal.callCount || 0}/5</span></div>
                           <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full transition-all ${((deal.callCount||0)/5)*100 >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} style={{width: `${Math.min(100, ((deal.callCount||0)/5)*100)}%`}}></div>
                           </div>
                        </div>
                        <div className={`p-3 rounded-xl border flex items-center justify-between ${getSLAHealth(deal).callSLA === 'breached' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                           <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><PhoneCall size={12}/> 12Hr Initial Call</span>
                           <CheckCircle size={14} className={getSLAHealth(deal).callSLA === 'breached' ? 'hidden' : 'block'}/>
                           <AlertCircle size={14} className={getSLAHealth(deal).callSLA === 'breached' ? 'block' : 'hidden'}/>
                        </div>
                     </div>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><Target size={12}/> Deal Settings</h4>
                     <div className="space-y-3">
                         <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Status Pipeline</label>
                            <select value={deal.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none cursor-pointer">
                               {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Lead Tag</label>
                            <select value={deal.leadTag || ''} onChange={(e) => handleTagUpdate(e.target.value)} className="w-full bg-purple-50 border border-purple-200 text-purple-800 rounded-lg p-2 text-xs font-bold outline-none cursor-pointer">
                                <option value="">No Tag</option>
                                <option value="PURCHASE">PURCHASE</option>
                                <option value="First Time Buyer">First Time Buyer</option>
                                <option value="Renewal">Renewal</option>
                                <option value="Refinance">Refinance</option>
                                <option value="Reverse Mortgage">Reverse Mortgage</option>
                                <option value="Realtor Lead">Realtor Lead</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1 flex items-center gap-1"><Wallet size={10}/> Referral Source (payout)</label>
                            {partnerRole === 'admin' ? (
                                <select value={deal.referralPartnerId || deal.referralSource || ''} onChange={(e) => handleReferralSourceUpdate(e.target.value)} className="w-full bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 text-xs font-bold outline-none cursor-pointer">
                                    <option value="">Not set</option>
                                    {REFERRAL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                    <optgroup label="Specific Referral Partner">
                                        {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName}{p.role ? ` (${p.role.replace('partner_', '')})` : ''}</option>)}
                                    </optgroup>
                                </select>
                            ) : (
                                <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 text-xs font-bold">{deal.referralSource || 'Not set'}</div>
                            )}
                            {deal.landingPageSlug && <p className="text-[9px] text-amber-600 mt-1 font-bold">From {deal.referrerName}&apos;s landing page</p>}
                         </div>
                     </div>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><Wallet size={12}/> Deal Value</h4>
                     <div className="space-y-3">
                         <div>
                             <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Loan Amount ($)</label>
                             <input
                                type="number"
                                inputMode="decimal"
                                defaultValue={deal.loanAmount || ''}
                                onBlur={(e) => {
                                    const amt = Number(e.target.value || 0);
                                    const com = Number(deal.expectedCommission ?? Math.round(amt * 0.01));
                                    handleDealValueSave(amt, com);
                                }}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                                placeholder="e.g. 650000"
                             />
                         </div>
                         <div>
                             <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Expected Commission ($)</label>
                             <input
                                type="number"
                                inputMode="decimal"
                                defaultValue={deal.expectedCommission || ''}
                                onBlur={(e) => handleDealValueSave(Number(deal.loanAmount || 0), Number(e.target.value || 0))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                                placeholder="Auto: 1% of loan"
                             />
                             <p className="text-[9px] text-gray-400 mt-1">Default = 1% of loan; edit to match your split.</p>
                         </div>
                     </div>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><ArrowDownLeft size={12}/> Origin Source</h4>
                     <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-medium text-gray-700">
                        <p className="mb-1"><strong>Source:</strong> {deal.referrerId === 'INDIBRICK_WEB' ? 'IndiBrick Landing Page' : 'Realtor Partner'}</p>
                        <p><strong>Name:</strong> {deal.referrerName}</p>
                     </div>
                  </div>

               </div>

               {/* COL 2: INTERACTION & TIMELINE (50%) — primary on mobile (order-first); natural order on desktop */}
               <div className="w-full lg:w-1/2 flex flex-col bg-[#F8FAFC] min-h-0 order-first lg:order-none">
                  {/* AI Copilot toast — surfaces auto-scheduled follow-ups so the agent SEES a task got created */}
                  {aiTaskToast && (
                      <div className={`border-b px-5 py-3 flex items-start gap-3 shrink-0 animate-fade-in-up ${aiTaskToast.isDefault ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 ${aiTaskToast.isDefault ? 'bg-amber-600' : 'bg-blue-600'}`}><Sparkles size={14}/></div>
                          <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-black uppercase tracking-widest ${aiTaskToast.isDefault ? 'text-amber-700' : 'text-blue-700'}`}>
                                  {aiTaskToast.isDefault ? 'No explicit date detected — default 7-day follow-up scheduled' : 'AI Copilot scheduled a follow-up'}
                              </p>
                              <p className="text-xs font-bold text-slate-900 mt-0.5">📅 {aiTaskToast.dueDate} — {aiTaskToast.description}</p>
                          </div>
                          <button onClick={() => setAiTaskToast(null)} className={`shrink-0 ${aiTaskToast.isDefault ? 'text-amber-400 hover:text-amber-900' : 'text-blue-400 hover:text-blue-900'}`}><X size={14}/></button>
                      </div>
                  )}

                  {/* Competing-broker escalation flash — high-visibility red. Save-the-deal
                      task is created server-side; this is the agent's ping to act on it now. */}
                  {escalationToast && (
                      <div className="border-b px-5 py-3 flex items-start gap-3 shrink-0 animate-fade-in-up bg-red-50 border-red-200">
                          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 animate-pulse"><AlertCircle size={14}/></div>
                          <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Competing broker signal detected</p>
                              <p className="text-xs font-bold text-slate-900 mt-0.5">Save-the-deal task added for today. Call {escalationToast.clientName} before end of day.</p>
                          </div>
                          <button onClick={() => setEscalationToast(null)} className="shrink-0 text-red-400 hover:text-red-900"><X size={14}/></button>
                      </div>
                  )}

                  {/* Action Bar */}
                  <div className="bg-white p-4 border-b border-gray-200 shrink-0">
                      <div className="flex overflow-x-auto whitespace-nowrap no-scrollbar gap-2 mb-3">
                          <button onClick={() => setLogType('note_internal')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'note_internal' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-black'}`}><Lock size={12} className="inline mr-1"/> Internal Note</button>
                          <button onClick={() => setLogType('note_client')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'note_client' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-black'}`}><User size={12} className="inline mr-1"/> Client Update</button>
                          <button onClick={() => setLogType('log_call')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'log_call' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-blue-600'}`}><PhoneCall size={12} className="inline mr-1"/> Log Call</button>
                          <button onClick={() => setLogType('task')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'task' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-orange-500'}`}><Calendar size={12} className="inline mr-1"/> Task</button>
                          <button onClick={() => setLogType('doc')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'doc' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-yellow-500'}`}><FileText size={12} className="inline mr-1"/> Req Doc</button>
                          <button onClick={() => setLogType('route')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'route' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-purple-600'}`}><Network size={12} className="inline mr-1"/> Assign</button>
                          
                          <button onClick={() => setLogType('borrow_direct')} className={`shrink-0 min-w-max px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'borrow_direct' ? 'bg-green-500 text-black shadow-sm' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-green-500'}`}>
                              <Shield size={12} className="inline mr-1"/> Private Debt
                          </button>
                      </div>

                      {/* Action Inputs */}
                      {logType === 'route' ? (
                          <div className="flex gap-2">
                             <select className="flex-1 p-3 rounded-xl border border-purple-200 outline-none font-bold text-xs bg-purple-50" value={targetPartnerId} onChange={e => setTargetPartnerId(e.target.value)}>
                                <option value="">Select Assignee...</option>
                                {user?.uid && deal.assignedAgentId !== user.uid && (
                                    <option value={user.uid}>👤 Me ({fullName})</option>
                                )}
                                <option value="ADMIN_INBOX">📥 Admin Inbox (HQ)</option>
                                {ecosystemPartners.filter(p => p.uid !== user?.uid && p.uid !== deal.assignedAgentId).map(p => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                            </select>
                            <button onClick={handleActionSubmit} disabled={!targetPartnerId} className="bg-purple-600 text-white px-6 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition disabled:opacity-50">Transfer</button>
                          </div>
                      ) : logType === 'task' ? (
                          <div className="flex gap-2">
                             <input type="date" className="w-1/3 p-3 rounded-xl border border-orange-200 outline-none font-bold text-xs bg-orange-50 text-orange-900" value={taskDate} onChange={e => setTaskDate(e.target.value)} required />
                             <input type="text" className="flex-1 bg-white border border-orange-200 p-3 rounded-xl focus:border-orange-500 outline-none font-bold text-xs" placeholder="Task description..." value={logInput} onChange={e => setLogInput(e.target.value)} />
                             <button onClick={handleActionSubmit} disabled={!taskDate || !logInput} className="bg-orange-500 text-white px-6 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 transition disabled:opacity-50">Set</button>
                          </div>
                      ) : logType === 'doc' ? (
                           <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 flex gap-2">
                             <input type="text" className="flex-1 p-3 rounded-lg border border-yellow-300 outline-none font-bold text-xs bg-white" placeholder="Document Name (e.g. 2024 T4)" value={docRequests[0]} onChange={e => setDocRequests([e.target.value])} required />
                             <button onClick={async (e) => {
                                 e.preventDefault();
                                 if(!docRequests[0].trim()) return;
                                 const btn = e.currentTarget; btn.disabled = true; btn.innerHTML = '...';
                                 await authedPost('/api/partner/request-document', { leadId: deal.id, documentNames: [docRequests[0]], clientEmail: deal.clientEmail, clientName: deal.clientName, agentName: fullName });
                                 setDocRequests(['']); btn.disabled = false; btn.innerHTML = 'Request'; loadProfileAndData();
                             }} className="bg-yellow-500 text-white px-6 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-yellow-600 transition">Request</button>
                           </div>
                      ) : logType === 'borrow_direct' ? (
                          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                              <h4 className="text-xs font-black uppercase text-green-900 mb-2">Push to Private Debt Market</h4>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                  <input type="number" placeholder="Loan Amt ($)" value={bdForm.loanAmount} onChange={e=>setBdForm({...bdForm, loanAmount: e.target.value})} className="p-2 rounded-lg border border-green-200 outline-none text-xs font-bold" />
                                  <input type="number" placeholder="Est. LTV %" value={bdForm.ltv} onChange={e=>setBdForm({...bdForm, ltv: e.target.value})} className="p-2 rounded-lg border border-green-200 outline-none text-xs font-bold" />
                              </div>
                              <textarea rows={2} placeholder="Deal summary for private lenders..." value={bdForm.aiSummary} onChange={e=>setBdForm({...bdForm, aiSummary: e.target.value})} className="w-full p-2 rounded-lg border border-green-200 outline-none text-xs font-medium resize-none mb-2" />
                              <button onClick={publishToBorrowDirect} disabled={isPublishing} className="w-full bg-green-600 text-white py-2 rounded-lg font-black uppercase text-[10px] hover:bg-green-700 transition">Submit to Marketplace</button>
                          </div>
                      ) : (
                          <form onSubmit={handleActionSubmit} className="relative">
                            <textarea
                              className={`w-full bg-white border-2 p-4 pr-16 rounded-xl font-medium focus:border-black outline-none transition resize-none text-sm shadow-sm ${logType === 'note_internal' ? 'border-amber-200 focus:border-amber-500 bg-amber-50/30' : 'border-gray-200'}`}
                              rows={2}
                              placeholder={logType === 'log_call' ? "Notes from call (will increment SLA counter)..." : logType === 'note_client' ? "Type a message directly to the client's portal..." : "Type an internal note visible only to the deal team..."}
                              value={logInput}
                              onChange={e => setLogInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  handleActionSubmit(e as any);
                                }
                              }}
                              required
                            />
                            <button
                              type="submit"
                              onClick={handleActionSubmit}
                              disabled={!logInput.trim()}
                              className={`absolute right-2 bottom-3 px-3 py-1.5 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition shadow-sm disabled:opacity-40 inline-flex items-center gap-1 ${logType === 'log_call' ? 'bg-blue-600 hover:bg-blue-700' : logType === 'note_internal' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-black'}`}
                            >
                              <Send size={12}/> {logType === 'log_call' ? 'Log' : 'Save'}
                            </button>
                          </form>
                      )}
                  </div>

                  {/* Scrollable content area — wraps NBA + Summary + Timeline so they scroll as one cohesive panel
                      (without this wrapper, NBA/Summary stole height from the timeline and broke its overflow scroll).
                      On mobile the whole modal body scrolls, so the internal scroll is scoped to lg+. */}
                  <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto custom-scrollbar">

                  {/* Next Best Action — heuristic-driven nudge so agents never have to think "what now?" */}
                  {(() => {
                      const dealTasks = allTasks.filter(t => t.referralId === deal.id && t.status !== 'Completed' && t.dueDate >= todayDateString);
                      const callCount = deal.callCount || 0;
                      const requiredDocs = deal.requiredDocuments || [];
                      const vault = deal.vault || [];
                      const days = getDaysInStage(deal);
                      const sla = getSLAHealth(deal);
                      const isTerminal = FUNDED_STATUSES.includes(deal.status) || LOST_STATUSES.includes(deal.status);

                      if (isTerminal) return null;

                      let cta: { tone: string; icon: any; title: string; sub: string; action?: () => void; actionLabel?: string } | null = null;

                      if (sla.callSLA === 'breached' && callCount === 0) {
                          cta = { tone: 'red', icon: AlertCircle, title: 'SLA Breach — call now', sub: `Lead has gone untouched for ${Math.floor(sla.hoursSinceCreation)} hours. Speed-to-lead drops conversion ~50% past 24h.`, actionLabel: deal.clientPhone ? 'Call client' : undefined, action: deal.clientPhone ? () => window.location.href = `tel:${deal.clientPhone}` : undefined };
                      } else if (callCount < 5 && dealTasks.length === 0) {
                          cta = { tone: 'blue', icon: PhoneCall, title: `Log call #${callCount + 1} of 5`, sub: 'No upcoming tasks scheduled. Brokerage data shows files convert at 6+ touches.', actionLabel: 'Log a call', action: () => { setLogType('log_call'); } };
                      } else if (requiredDocs.length === 0 && callCount >= 1) {
                          cta = { tone: 'blue', icon: Bot, title: 'Run AI Intake to generate doc checklist', sub: 'You\'ve made contact. Capture income/credit/scenario data so AI can build a B-20 underwriter summary + client doc list.', actionLabel: 'Launch AI Intake', action: () => setShowIntakeForm(true) };
                      } else if (requiredDocs.length > 0 && vault.length === 0) {
                          cta = { tone: 'amber', icon: FileText, title: 'No documents uploaded yet', sub: `${requiredDocs.length} document${requiredDocs.length === 1 ? '' : 's'} requested. Send a portal reminder if the client hasn't logged in.`, actionLabel: 'Activate & email portal', action: () => handleCategoryUpdate('active') };
                      } else if (days >= 5 && dealTasks.length === 0) {
                          cta = { tone: 'amber', icon: Clock, title: `Stalled ${days} days in "${deal.status}"`, sub: 'No follow-up scheduled. Update status or set a task before this deal goes cold.', actionLabel: 'Schedule task', action: () => setLogType('task') };
                      }

                      if (!cta) return null;

                      const tones: Record<string, string> = {
                          red: 'bg-red-50 border-red-200 text-red-900',
                          blue: 'bg-blue-50 border-blue-200 text-blue-900',
                          amber: 'bg-amber-50 border-amber-200 text-amber-900',
                      };
                      const btnTones: Record<string, string> = {
                          red: 'bg-red-600 hover:bg-red-700 text-white',
                          blue: 'bg-blue-600 hover:bg-blue-700 text-white',
                          amber: 'bg-amber-600 hover:bg-amber-700 text-white',
                      };
                      const Icon = cta.icon;
                      return (
                          <div className="px-5 pt-5 pb-0">
                              <div className={`rounded-xl p-4 border-2 flex items-start gap-3 ${tones[cta.tone]}`}>
                                  <div className="shrink-0 mt-0.5"><Icon size={18}/></div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-black uppercase tracking-widest mb-0.5">Next Best Action</p>
                                      <p className="text-sm font-black mb-1">{cta.title}</p>
                                      <p className="text-xs font-medium opacity-80 leading-relaxed">{cta.sub}</p>
                                  </div>
                                  {cta.action && cta.actionLabel && (
                                      <button onClick={cta.action} className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-sm ${btnTones[cta.tone]}`}>{cta.actionLabel}</button>
                                  )}
                              </div>
                          </div>
                      );
                  })()}

                  {/* AI Deal Summary Section */}
                  <div className="px-5 pt-5 pb-0">
                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 relative group">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-800 mb-2 flex items-center justify-between">
                           <span className="flex items-center gap-1.5"><Bot size={12}/> AI Deal Summary</span>
                           <button onClick={() => setIsEditingSummary(!isEditingSummary)} className="text-blue-600 hover:text-blue-900"><Edit2 size={12}/></button>
                        </h4>
                        {isEditingSummary ? (
                           <div className="flex flex-col gap-2 animate-fade-in">
                              <textarea value={editSummaryText} onChange={e => setEditSummaryText(e.target.value)} className="w-full p-3 rounded-lg text-sm bg-white border border-blue-300 outline-none" rows={6} />
                              <button onClick={handleSaveSummary} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold self-end flex items-center gap-1 hover:bg-blue-700"><Save size={12}/> Save</button>
                           </div>
                        ) : (
                           <div className="text-xs text-blue-900 font-medium whitespace-pre-wrap leading-relaxed">
                              {deal.dealSummary || "No summary generated. Launch AI Intake to populate."}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Timeline — flows inside the parent scrollable wrapper, no separate scroll */}
                  <div className="p-5 space-y-4">
                    {deal.timeline?.slice().reverse().map((log: any, i: number) => {
                       const isInternal = log.content.includes('🔒 INTERNAL:');
                       const isCall = log.content.includes('📞 LOGGED CALL:');
                       const isClient = log.content.includes('💬 CLIENT UPDATE:');
                       const displayContent = log.content.replace('🔒 INTERNAL: ', '').replace('📞 LOGGED CALL: ', '').replace('💬 CLIENT UPDATE: ', '');

                       if (log.isSystemMessage && !isInternal && !isCall && displayContent.includes('Document Uploaded')) return null;

                       return (
                         <div key={i} className={`p-4 rounded-2xl text-sm border shadow-sm ${isInternal ? 'bg-amber-50 border-amber-100' : isCall ? 'bg-blue-50 border-blue-100' : isClient ? 'bg-slate-900 text-white border-black' : log.isSystemMessage ? 'bg-gray-100 border-gray-200 text-center text-xs' : 'bg-white border-gray-200'}`}>
                           {!log.isSystemMessage && !isInternal && !isCall && <div className="flex justify-between items-center mb-1.5"><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><User size={12}/> {log.author}</span><span className="text-[9px] font-bold text-gray-400">{new Date(log.timestamp).toLocaleString()}</span></div>}
                           {(isInternal || isCall || isClient) && (
                               <div className="flex justify-between items-center mb-2">
                                  <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isInternal ? 'text-amber-800' : isCall ? 'text-blue-800' : 'text-gray-300'}`}>
                                     {isInternal && <><Lock size={10}/> Internal Note by {log.author}</>}
                                     {isCall && <><PhoneCall size={10}/> Call Logged by {log.author}</>}
                                     {isClient && <><User size={10}/> Sent to Client by {log.author}</>}
                                  </span>
                                  <span className={`text-[9px] font-bold ${isClient ? 'text-gray-400' : 'text-gray-400'}`}>{new Date(log.timestamp).toLocaleString()}</span>
                               </div>
                           )}
                           <div className={`font-medium whitespace-pre-wrap ${log.isSystemMessage && !isInternal && !isCall ? 'text-[9px] font-bold uppercase tracking-widest text-gray-500' : isClient ? 'text-gray-200' : 'text-slate-800'}`}>
                               {displayContent}
                           </div>
                         </div>
                       )
                    })}
                  </div>

                  </div>{/* end scrollable wrapper for NBA + Summary + Timeline */}
               </div>

               {/* COL 3: DEAL TEAM & VAULT (25%) — stacks on mobile, scrolls internally on desktop */}
               <div className="w-full lg:w-1/4 bg-white lg:border-l border-t lg:border-t-0 border-gray-200 p-5 lg:overflow-y-auto space-y-6">

                  {/* Phase 8 Wave 1 — SMS + call thread. Live-subscribes
                      to /messages; sends via /api/partner/messages and
                      /api/partner/call. Only renders once a phone is on
                      file — a client with no clientPhone gets a
                      placeholder empty state so agents know to add one. */}
                  <DealConversation
                    referralId={deal.id}
                    clientName={deal.clientName}
                    clientPhone={deal.clientPhone}
                  />

                  {/* Wave A — per-user custom fields. Renders only when
                      the current user has defined at least one field via
                      the Fields settings modal. Values save through the
                      standard referrals PATCH endpoint. */}
                  {customDealFields.length > 0 && (
                    <CustomFieldsInline
                      referralId={deal.id}
                      defs={customDealFields}
                      initialValues={deal.customFields || {}}
                      canEdit
                      onSaved={(cf) => {
                        setSelectedDeal((prev: any) => prev ? { ...prev, customFields: cf } : prev);
                        setAllReferrals(prev => prev.map(r => r.id === deal.id ? { ...r, customFields: cf } : r));
                      }}
                    />
                  )}

                  {/* Client Contact Info (Editable) */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl relative">
                      <div className="flex justify-between items-start mb-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Client Information</h4>
                          <button onClick={() => setIsEditingClient(!isEditingClient)} className="text-gray-400 hover:text-white"><Edit2 size={12}/></button>
                      </div>
                      
                      {isEditingClient ? (
                         <div className="space-y-3 animate-fade-in">
                            <input type="text" value={editClientForm.name} onChange={e=>setEditClientForm({...editClientForm, name: e.target.value})} className="w-full bg-slate-800 p-2 rounded text-xs outline-none" placeholder="Name" />
                            <input type="text" value={editClientForm.phone} onChange={e=>setEditClientForm({...editClientForm, phone: e.target.value})} className="w-full bg-slate-800 p-2 rounded text-xs outline-none" placeholder="Phone" />
                            <input type="email" value={editClientForm.email} onChange={e=>setEditClientForm({...editClientForm, email: e.target.value})} className="w-full bg-slate-800 p-2 rounded text-xs outline-none" placeholder="Email" />
                            <button onClick={handleEditClientSave} className="w-full bg-blue-600 text-white py-2 rounded text-xs font-bold hover:bg-blue-500">Save</button>
                         </div>
                      ) : (
                         <>
                            {deal.clientPhone ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <a href={`tel:${deal.clientPhone}`} className="flex-1 flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 transition px-3 py-2 rounded-lg text-white">
                                        <PhoneCall size={12}/> {deal.clientPhone}
                                    </a>
                                    <a href={`sms:${deal.clientPhone}`} aria-label="Send SMS" className="bg-white/10 hover:bg-white hover:text-slate-900 transition px-3 py-2 rounded-lg flex items-center justify-center" title="Send SMS">
                                        <Send size={12}/>
                                    </a>
                                </div>
                            ) : (
                                <p className="text-xs font-bold mb-2 flex items-center gap-2 text-gray-500"><PhoneCall size={12}/> No phone on file</p>
                            )}
                            {deal.clientEmail ? (
                                <a href={`mailto:${deal.clientEmail}`} className="text-xs font-bold flex items-center gap-2 truncate text-blue-300 hover:text-white transition"><Mail size={12}/> {deal.clientEmail}</a>
                            ) : (
                                <p className="text-xs font-bold flex items-center gap-2 truncate text-gray-500"><Mail size={12}/> No email</p>
                            )}
                         </>
                      )}
                  </div>

                  {/* Deal Team */}
                  <div>
                     <div className="flex justify-between items-center mb-3">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><Users size={12}/> Deal Team Matrix</h4>
                         {partnerRole === 'admin' && (
                             <button
                                 type="button"
                                 onClick={handleNudgeOwner}
                                 disabled={nudgingOwner}
                                 title="Email the assigned agent a reminder to follow up"
                                 className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-50"
                             >
                                 {nudgingOwner ? <Loader2 size={11} className="animate-spin"/> : <Mail size={11}/>} Nudge Owner
                             </button>
                         )}
                     </div>
                     <div className="space-y-2 mb-3">
                         <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">M</div>
                             <div className="truncate">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mortgage Agent</p>
                                <p className="text-xs font-bold text-slate-900 truncate">{deal.assignedAgentName === 'Admin Triage' ? 'IndiBrick HQ' : deal.assignedAgentName}</p>
                             </div>
                         </div>
                         {deal.referrerId !== 'INDIBRICK_WEB' && (
                             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                 <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs shrink-0">R</div>
                                 <div className="truncate">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Referral Partner</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{deal.referrerName}</p>
                                 </div>
                             </div>
                         )}
                         {deal.participants?.map((p: any, idx: number) => (
                             <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                                 <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-black text-xs shrink-0"><User size={14}/></div>
                                 <div className="truncate flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">{p.role}</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                                 </div>
                                 {partnerRole === 'admin' && (
                                     <button type="button" onClick={() => handleRemoveParticipant(p)} title={`Remove ${p.name} from the deal team`} className="opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={14}/></button>
                                 )}
                             </div>
                         ))}
                     </div>
                     
                     {partnerRole === 'admin' ? (
                        <>
                          <div className="flex items-center gap-2">
                             <select onChange={handleAddParticipant} value="" className="flex-1 bg-white border border-gray-200 text-[10px] font-bold uppercase rounded-lg p-2 outline-none cursor-pointer">
                                <option value="" disabled>+ Add Participant</option>
                                {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName} ({p.role?.replace('partner_','')})</option>)}
                             </select>
                          </div>
                          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase text-center"><Mail size={10} className="inline mr-1"/> Added members can view + edit · team notified on updates</p>
                        </>
                     ) : (
                        <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase text-center">Only an admin can change the deal team</p>
                     )}
                  </div>

                  {/* Document Vault */}
                  {deal.vault && deal.vault.length > 0 && (
                     <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><FileText size={12}/> Document Vault</h4>
                        <div className="space-y-2">
                           {deal.vault.map((doc: any, i: number) => (
                              <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between group hover:border-black transition">
                                 <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="text-slate-400 shrink-0"><FileText size={14} /></div>
                                    <div className="truncate">
                                       <p className="text-[10px] font-bold text-slate-900 truncate">{doc.documentType || doc.fileName || 'Document'}</p>
                                    </div>
                                 </div>
                                 <button
                                    onClick={() => handleDownloadVaultDoc(doc)}
                                    className="text-gray-400 hover:text-black transition"
                                    aria-label="Download document"
                                 ><ArrowDownLeft size={14} className="rotate-180" /></button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

               </div>
            </div>
          </div>
        </div>
  );
}
