'use client';

// Full-screen AI Intake modal for the partner CRM. Owns all its own
// state — the parent only supplies the deal being intake'd + a callback
// to run when the summary is saved. Everything else (form/review/sending
// phase, intakeData, checklist, financials) lives here.
//
// Extracted from app/partner/page.tsx during Phase 1 componentization.

import React, { useEffect, useState } from 'react';
import {
  Bot, X, Sparkles, Loader2, Bot as BotIcon, ArrowRight, ChevronLeft,
  FileText, CheckCircle, Trash2, Plus, Save, Mail, Send,
} from 'lucide-react';
import { authedPost } from '../../lib/apiClient';
import { BLANK_INTAKE, type IntakeData, type OtherProperty } from '../../lib/crmHelpers';
import { useToast } from '../ui/ToastProvider';

interface DealLike {
  id: string;
  leadId?: string;
  clientName: string;
  clientEmail?: string;
}

interface IntakeWizardProps {
  open: boolean;
  onClose: () => void;
  deal: DealLike | null;
  agentName: string;
  // Called when the AI summary is saved (with or without emailing the
  // client). Parent uses the patch to apply an optimistic update so the
  // deal modal + pipeline reflect the new summary without a full reload.
  onSaved: (patch: { dealSummary: string; requiredDocuments?: string[] }) => void;
}

// ─── Pure helpers (extracted from partner/page.tsx) ─────────────────

type Financials = {
  goal: 'Purchase' | 'Refinance' | 'Renewal Transfer';
  propertyValue: number;
  downPayment: number;
  currentMortgageBalance: number;
  annualPropertyTaxes: number;
  monthlyRentIncome: number;
  primaryAnnualIncome: number;
  coAnnualIncome: number;
  employmentType: string;
  creditScore: string;
  monthlyDebtPayments: number;
  otherPropertiesEquity: number;
  otherPropertiesPayments: number;
  otherPropertiesRent: number;
};

function intakeDataToFinancials(d: IntakeData): Financials {
  const propValue = Number(d.propertyValue || 0);
  const downPmt = d.goal === 'Purchase' ? Number(d.downPayment || 0) : 0;
  const otherProps = d.otherPropertiesList || [];
  return {
    goal: d.goal,
    propertyValue: propValue,
    downPayment: downPmt,
    currentMortgageBalance: d.goal !== 'Purchase' ? Number(d.currentBalance || 0) : 0,
    annualPropertyTaxes: Number(d.propertyTaxes || 0),
    monthlyRentIncome: d.hasRentalIncome === 'Yes' ? Number(d.monthlyRent || 0) : 0,
    primaryAnnualIncome: Number(d.annualIncome || 0),
    coAnnualIncome: d.numApplicants !== '1' ? Number(d.coAnnualIncome || 0) : 0,
    employmentType: d.empType,
    creditScore: d.creditScore,
    monthlyDebtPayments: Number(d.monthlyDebtPayments || 0),
    otherPropertiesEquity: otherProps.reduce((acc: number, p: OtherProperty) => acc + Math.max(0, Number(p.value || 0) - Number(p.balance || 0)), 0),
    otherPropertiesPayments: otherProps.reduce((acc: number, p: OtherProperty) => acc + Number(p.payment || 0), 0),
    otherPropertiesRent: otherProps.reduce((acc: number, p: OtherProperty) => acc + Number(p.rent || 0), 0),
  };
}

// Pure calculator: takes the financials Gemini extracts and returns
// LTV/GDS/TDS + risk band. The 5.5%/yr factor approximates a 25yr amort.
function computeMortgageMetrics(f: Financials | null) {
  if (!f) return null;
  const propValue = Number(f.propertyValue || 0);
  const downPmt = Number(f.downPayment || 0);
  const goal = String(f.goal || 'Purchase');
  const mtgAmount = goal === 'Purchase'
    ? Math.max(0, propValue - downPmt)
    : Number(f.currentMortgageBalance || 0);

  const ltv = propValue > 0 ? (mtgAmount / propValue) * 100 : 0;

  const totalAnnualIncome = Number(f.primaryAnnualIncome || 0) + Number(f.coAnnualIncome || 0);
  const monthlyIncome = totalAnnualIncome / 12;
  const estMortgagePayment = mtgAmount * 0.0055;
  const monthlyTaxes = Number(f.annualPropertyTaxes || 0) / 12;
  const heating = 150;
  const adjustedMonthlyIncome = monthlyIncome
    + (Number(f.monthlyRentIncome || 0) * 0.5)
    + (Number(f.otherPropertiesRent || 0) * 0.5);
  const gdsExpenses = estMortgagePayment + monthlyTaxes + heating;
  const tdsExpenses = gdsExpenses + Number(f.monthlyDebtPayments || 0) + Number(f.otherPropertiesPayments || 0);

  const gds = adjustedMonthlyIncome > 0 ? (gdsExpenses / adjustedMonthlyIncome) * 100 : 0;
  const tds = adjustedMonthlyIncome > 0 ? (tdsExpenses / adjustedMonthlyIncome) * 100 : 0;

  let band = '🛑 HIGH RISK (Exceeds standard limits. Private routing likely required)';
  if (gds < 39 && tds < 44 && ltv <= 80) band = '✅ STRONG CONVENTIONAL FILE (Within B-20 Guidelines)';
  else if (tds < 50 && ltv <= 80) band = '⚠️ MARGINAL FILE (B-Lender or Alternative routing recommended)';

  return {
    ltv: ltv.toFixed(2),
    gds: gds.toFixed(1),
    tds: tds.toFixed(1),
    mtgAmount: Math.round(mtgAmount),
    band,
  };
}

function buildEnrichedSummary(aiSummary: string, financials: Financials | null): string {
  const m = computeMortgageMetrics(financials);
  if (!m) return aiSummary;
  const lines = [
    '🤖 AI UNDERWRITER ANALYSIS',
    aiSummary?.trim() || '',
    '',
    `Risk Assessment: ${m.band}`,
    '',
    '-- KEY METRICS --',
    `Estimated LTV: ${m.ltv}%`,
    `Estimated GDS: ${m.gds}% (Limit 39%)`,
    `Estimated TDS: ${m.tds}% (Limit 44%)`,
    `Mortgage Required: $${m.mtgAmount.toLocaleString()}`,
  ];
  return lines.filter(Boolean).join('\n');
}

// ─── Component ──────────────────────────────────────────────────────

export default function IntakeWizard({ open, onClose, deal, agentName, onSaved }: IntakeWizardProps) {
  const toast = useToast();
  const [phase, setPhase] = useState<'form' | 'review' | 'sending'>('form');
  const [generating, setGenerating] = useState(false);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [newItem, setNewItem] = useState('');
  const [data, setData] = useState<IntakeData>(() => structuredClone(BLANK_INTAKE));

  // Reset every time the wizard opens — a fresh client should never
  // see the previous client's answers. structuredClone avoids sharing
  // the nested otherPropertiesList across resets.
  useEffect(() => {
    if (open) {
      setPhase('form');
      setChecklist([]);
      setSummary('');
      setFinancials(null);
      setNewItem('');
      setData(structuredClone(BLANK_INTAKE));
    }
  }, [open]);

  const addOtherProperty = () =>
    setData(p => ({ ...p, otherPropertiesList: [...p.otherPropertiesList, { address: '', value: '', balance: '', rent: '', payment: '' }] }));

  const updateOtherProperty = (idx: number, field: keyof OtherProperty, value: string) =>
    setData(p => ({
      ...p,
      otherPropertiesList: p.otherPropertiesList.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));

  const removeOtherProperty = (idx: number) =>
    setData(p => ({ ...p, otherPropertiesList: p.otherPropertiesList.filter((_, i) => i !== idx) }));

  const generateIntake = async () => {
    if (!deal) return;
    setGenerating(true);
    const nextFin = intakeDataToFinancials(data);
    try {
      const res = await authedPost('/api/partner/intake-generate', {
        formData: data,
        financials: nextFin,
        leadId: deal.leadId || deal.id,
        clientName: deal.clientName,
        agentName,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate');
      setSummary(json.summary || '');
      setChecklist(json.checklist || []);
      setFinancials(json.financials || nextFin);
      setPhase('review');
    } catch (e: any) {
      toast.error('Could not generate summary', e.message);
    } finally {
      setGenerating(false);
    }
  };

  // Agent confirms. CRM gets the full underwriter note (PURPOSE/PROFILE
  // /INCOME/CREDIT + metrics); the client (when skipEmail is false) is
  // emailed ONLY the plain data summary to confirm it's correct — no
  // document checklist, no internal risk metrics.
  const confirmIntake = async (skipEmail: boolean = false) => {
    if (!deal || !summary.trim()) return;
    setPhase('sending');
    const crmSummary = buildEnrichedSummary(summary, financials);
    try {
      const res = await authedPost('/api/partner/intake-send', {
        leadId: deal.leadId || deal.id,
        summary,          // plain — this is what the client sees
        crmSummary,       // enriched with risk band + LTV/GDS/TDS — internal only
        checklist,
        clientName: deal.clientName,
        clientEmail: deal.clientEmail || '',
        agentName,
        skipEmail,
      });
      if (!res.ok) throw new Error('Failed to save');

      onSaved({
        dealSummary: crmSummary,
        requiredDocuments: checklist.length > 0 ? checklist : undefined,
      });
      onClose();
    } catch (e) {
      toast.error('Could not save intake', 'Please retry.');
      setPhase('review');
    }
  };

  if (!open || !deal) return null;

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in">
      <div className="bg-black text-white p-4 md:p-6 flex justify-between items-center gap-2 shrink-0 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0"><Bot size={20}/></div>
          <div className="min-w-0">
            <h2 className="text-base md:text-xl font-black uppercase tracking-wide truncate">AI Intake — {phase === 'review' ? 'Review & Send' : phase === 'sending' ? 'Sending…' : 'Capture Scenario'}</h2>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase truncate">Client: {deal.clientName}</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:text-gray-300 shrink-0"><X size={24}/></button>
      </div>

      {/* Phase progress bar */}
      <div className="w-full bg-gray-100 h-1.5">
        <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: phase === 'review' ? '85%' : phase === 'sending' ? '100%' : '35%' }}></div>
      </div>

      {/* PHASE: SINGLE-PAGE FORM — optimized for fast keyboard entry during a call */}
      {phase === 'form' && (
        <form onSubmit={(e) => { e.preventDefault(); generateIntake(); }} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto w-full p-5 md:p-8 space-y-6">

              {/* ─── GOAL ─── */}
              <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">1</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Goal</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="col-span-2 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Primary Goal</span>
                    <select autoFocus value={data.goal} onChange={e => setData(p => ({ ...p, goal: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                      <option>Purchase</option><option>Refinance</option><option>Renewal Transfer</option>
                    </select>
                  </label>
                  {data.goal === 'Purchase' && (
                    <label className="col-span-2 md:col-span-2 animate-fade-in">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">First-Time Home Buyer?</span>
                      <select value={data.fthb} onChange={e => setData(p => ({ ...p, fthb: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                        <option>No</option><option>Yes</option><option>Not Sure</option>
                      </select>
                    </label>
                  )}
                </div>
              </section>

              {/* ─── SUBJECT PROPERTY ─── */}
              <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">2</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Subject Property</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="col-span-2 md:col-span-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Address</span>
                    <input type="text" value={data.subjectAddress} onChange={e => setData(p => ({ ...p, subjectAddress: e.target.value }))} placeholder="123 Main St, Toronto ON" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                  </label>
                  <label className="col-span-1 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">{data.goal === 'Purchase' ? 'Purchase Price ($)' : 'Est. Market Value ($)'}</span>
                    <input type="number" inputMode="decimal" value={data.propertyValue} onChange={e => setData(p => ({ ...p, propertyValue: e.target.value }))} placeholder="e.g. 850000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                  </label>
                  <label className="col-span-1 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Annual Property Taxes ($)</span>
                    <input type="number" inputMode="decimal" value={data.propertyTaxes} onChange={e => setData(p => ({ ...p, propertyTaxes: e.target.value }))} placeholder="e.g. 4500" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                  </label>
                  <label className="col-span-2 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Rental Income from this Property?</span>
                    <select value={data.hasRentalIncome} onChange={e => setData(p => ({ ...p, hasRentalIncome: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                      <option>No</option><option>Yes</option>
                    </select>
                  </label>
                  {data.hasRentalIncome === 'Yes' && (
                    <>
                      <label className="col-span-1 md:col-span-1 animate-fade-in">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Monthly Rent ($)</span>
                        <input type="number" inputMode="decimal" value={data.monthlyRent} onChange={e => setData(p => ({ ...p, monthlyRent: e.target.value }))} placeholder="e.g. 2400" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                      </label>
                      <label className="col-span-1 md:col-span-1 animate-fade-in">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Basement Legality</span>
                        <select value={data.basementStatus} onChange={e => setData(p => ({ ...p, basementStatus: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                          <option>Legal</option><option>Not Legal</option><option>Not Sure</option>
                        </select>
                      </label>
                    </>
                  )}
                </div>
              </section>

              {/* ─── DOWN PAYMENT (Purchase only) ─── */}
              {data.goal === 'Purchase' && (
                <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">3</div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Down Payment</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="col-span-2 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Down Payment ($)</span>
                      <input type="number" inputMode="decimal" value={data.downPayment} onChange={e => setData(p => ({ ...p, downPayment: e.target.value }))} placeholder="e.g. 75000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                    </label>
                    <label className="col-span-2 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Source</span>
                      <select value={data.downPaymentSource} onChange={e => setData(p => ({ ...p, downPaymentSource: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                        <option>Savings</option><option>Gift</option><option>RRSP HBP</option><option>Sale of Property</option><option>Other</option>
                      </select>
                    </label>
                  </div>
                </section>
              )}

              {/* ─── EXISTING MORTGAGE (Refi/Renewal only) ─── */}
              {data.goal !== 'Purchase' && (
                <section className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">3</div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Existing Mortgage</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="col-span-2 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Lender</span>
                      <input type="text" value={data.currentLender} onChange={e => setData(p => ({ ...p, currentLender: e.target.value }))} placeholder="TD, Scotia, MCAP…" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                    </label>
                    <label className="col-span-1 md:col-span-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Balance ($)</span>
                      <input type="number" inputMode="decimal" value={data.currentBalance} onChange={e => setData(p => ({ ...p, currentBalance: e.target.value }))} placeholder="e.g. 450000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                    </label>
                    <label className="col-span-1 md:col-span-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Rate (%)</span>
                      <input type="number" inputMode="decimal" step="0.01" value={data.currentRate} onChange={e => setData(p => ({ ...p, currentRate: e.target.value }))} placeholder="e.g. 5.24" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                    </label>
                    <label className="col-span-2 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Renewal / Maturity Date</span>
                      <input type="date" value={data.renewalDate} onChange={e => setData(p => ({ ...p, renewalDate: e.target.value }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                    </label>
                  </div>
                </section>
              )}

              {/* ─── APPLICANTS ─── */}
              <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">4</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Applicants</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <label className="col-span-1 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Number of Applicants</span>
                    <select value={data.numApplicants} onChange={e => setData(p => ({ ...p, numApplicants: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                      <option>1</option><option>2</option><option>3+</option>
                    </select>
                  </label>
                  <label className="col-span-1 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Estimated Credit Score</span>
                    <select value={data.creditScore} onChange={e => setData(p => ({ ...p, creditScore: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                      <option>750+</option><option>680-749</option><option>600-679</option><option>Below 600</option><option>Not Sure</option>
                    </select>
                  </label>
                </div>

                {/* Applicant 1 */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-3">Applicant 1</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="col-span-2 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Employment Type</span>
                      <select value={data.empType} onChange={e => setData(p => ({ ...p, empType: e.target.value as any }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                        <option>T4 / Salaried</option><option>Self-Employed / Business Owner</option><option>Hourly / Part-Time</option>
                      </select>
                    </label>
                    <label className="col-span-2 md:col-span-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Annual Income ($)</span>
                      <input type="number" inputMode="decimal" value={data.annualIncome} onChange={e => setData(p => ({ ...p, annualIncome: e.target.value }))} placeholder="e.g. 85000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                    </label>
                    {data.empType.startsWith('Self-Employed') && (
                      <>
                        <label className="col-span-1 md:col-span-2 animate-fade-in">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Line 15000 — Last Year ($)</span>
                          <input type="number" inputMode="decimal" value={data.incomeYear1} onChange={e => setData(p => ({ ...p, incomeYear1: e.target.value }))} placeholder="e.g. 82000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                        </label>
                        <label className="col-span-1 md:col-span-2 animate-fade-in">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Line 15000 — Prior Year ($)</span>
                          <input type="number" inputMode="decimal" value={data.incomeYear2} onChange={e => setData(p => ({ ...p, incomeYear2: e.target.value }))} placeholder="e.g. 78000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Applicant 2 (only when more than 1) */}
                {data.numApplicants !== '1' && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 animate-fade-in">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-3">Applicant 2</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <label className="col-span-2 md:col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Employment Type</span>
                        <select value={data.coEmpType} onChange={e => setData(p => ({ ...p, coEmpType: e.target.value as any }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                          <option>T4 / Salaried</option><option>Self-Employed / Business Owner</option><option>Hourly / Part-Time</option>
                        </select>
                      </label>
                      <label className="col-span-2 md:col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Annual Income ($)</span>
                        <input type="number" inputMode="decimal" value={data.coAnnualIncome} onChange={e => setData(p => ({ ...p, coAnnualIncome: e.target.value }))} placeholder="e.g. 70000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                      </label>
                      {data.coEmpType.startsWith('Self-Employed') && (
                        <>
                          <label className="col-span-1 md:col-span-2 animate-fade-in">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Line 15000 — Last Year ($)</span>
                            <input type="number" inputMode="decimal" value={data.coIncomeYear1} onChange={e => setData(p => ({ ...p, coIncomeYear1: e.target.value }))} placeholder="e.g. 68000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                          </label>
                          <label className="col-span-1 md:col-span-2 animate-fade-in">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Line 15000 — Prior Year ($)</span>
                            <input type="number" inputMode="decimal" value={data.coIncomeYear2} onChange={e => setData(p => ({ ...p, coIncomeYear2: e.target.value }))} placeholder="e.g. 65000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* ─── LIABILITIES & PORTFOLIO ─── */}
              <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">5</div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Liabilities & Portfolio</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <label className="col-span-2 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Monthly Debt Payments ($)</span>
                    <input type="number" inputMode="decimal" value={data.monthlyDebtPayments} onChange={e => setData(p => ({ ...p, monthlyDebtPayments: e.target.value }))} placeholder="e.g. 850 (cars, CCs, lines)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                  </label>
                  <label className="col-span-2 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Notes (optional)</span>
                    <input type="text" value={data.substantialDebts} onChange={e => setData(p => ({ ...p, substantialDebts: e.target.value }))} placeholder="$500 Auto, $350 CCs, $100 LOC" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                  </label>
                </div>

                {/* Other properties */}
                <div className="flex justify-between items-center mb-2 mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Other Real Estate Owned</p>
                  <button type="button" onClick={addOtherProperty} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus size={12}/> Add Property</button>
                </div>
                {data.otherPropertiesList.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No other properties added</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.otherPropertiesList.map((prop, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 relative animate-fade-in">
                        <button type="button" onClick={() => removeOtherProperty(idx)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Property {idx + 1}</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <input type="text" placeholder="Address" value={prop.address} onChange={e => updateOtherProperty(idx, 'address', e.target.value)} className="col-span-2 md:col-span-5 p-2.5 bg-white border border-gray-200 rounded-lg font-bold text-xs outline-none focus:border-black" />
                          <input type="number" inputMode="decimal" placeholder="Value ($)" value={prop.value} onChange={e => updateOtherProperty(idx, 'value', e.target.value)} className="p-2.5 bg-white border border-gray-200 rounded-lg font-bold text-xs outline-none focus:border-black" />
                          <input type="number" inputMode="decimal" placeholder="Mtg Balance ($)" value={prop.balance} onChange={e => updateOtherProperty(idx, 'balance', e.target.value)} className="p-2.5 bg-white border border-gray-200 rounded-lg font-bold text-xs outline-none focus:border-black" />
                          <input type="number" inputMode="decimal" placeholder="Rent ($/mo)" value={prop.rent} onChange={e => updateOtherProperty(idx, 'rent', e.target.value)} className="p-2.5 bg-white border border-gray-200 rounded-lg font-bold text-xs outline-none focus:border-black" />
                          <input type="number" inputMode="decimal" placeholder="Mtg Pmt ($/mo)" value={prop.payment} onChange={e => updateOtherProperty(idx, 'payment', e.target.value)} className="p-2.5 bg-white border border-gray-200 rounded-lg font-bold text-xs outline-none focus:border-black" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Live metric preview — recomputes as the agent types, so
                  they have a sense of where the file lands before hitting
                  Generate. */}
              {(() => {
                const m = computeMortgageMetrics(intakeDataToFinancials(data));
                if (!m || Number(data.propertyValue || 0) === 0) return null;
                return (
                  <section className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2"><Sparkles size={14} className="text-blue-300"/><span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Live Preview</span></div>
                      <div className="flex gap-6 text-sm font-black">
                        <span><span className="text-gray-400 text-[10px] uppercase tracking-widest mr-1.5">LTV</span>{m.ltv}%</span>
                        <span><span className="text-gray-400 text-[10px] uppercase tracking-widest mr-1.5">GDS</span>{m.gds}%</span>
                        <span><span className="text-gray-400 text-[10px] uppercase tracking-widest mr-1.5">TDS</span>{m.tds}%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-300 mt-2 font-medium">{m.band}</p>
                  </section>
                );
              })()}
            </div>
          </div>

          {/* Sticky bottom action bar */}
          <div className="border-t border-gray-200 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] shrink-0">
            <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
              <button type="button" onClick={onClose} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 transition">Cancel</button>
              <button
                type="submit"
                disabled={generating}
                className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition flex items-center gap-2 shadow-xl disabled:opacity-50"
              >
                {generating ? <Loader2 className="animate-spin" size={14}/> : <Bot size={14}/>}
                {generating ? 'Analyzing file…' : 'Generate Summary & Checklist'}
                {!generating && <ArrowRight size={14}/>}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* PHASE: REVIEW & CONFIRM */}
      {phase === 'review' && (() => {
        const m = computeMortgageMetrics(financials);
        return (
          <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 md:p-10 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Review before sending to {deal.clientName}</h3>
              <p className="text-sm text-gray-500 mt-1">Verify the summary, tweak the checklist if needed, then send. Nothing has been emailed yet.</p>
            </div>

            {/* Metrics card */}
            {m && (
              <div className="bg-slate-900 text-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-3">Underwriter Snapshot</p>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">LTV</p>
                      <p className="text-2xl font-black tracking-tighter">{m.ltv}%</p>
                      <p className="text-[9px] font-bold text-gray-500 mt-1">Loan-to-Value</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">GDS</p>
                      <p className="text-2xl font-black tracking-tighter">{m.gds}%</p>
                      <p className="text-[9px] font-bold text-gray-500 mt-1">Limit 39%</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">TDS</p>
                      <p className="text-2xl font-black tracking-tighter">{m.tds}%</p>
                      <p className="text-[9px] font-bold text-gray-500 mt-1">Limit 44%</p>
                    </div>
                  </div>
                  <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-sm font-bold">{m.band}</div>
                  <p className="text-[10px] text-gray-500 mt-3">Mortgage required: <span className="text-white font-black">${m.mtgAmount.toLocaleString()}</span></p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5"><Bot size={12}/> AI Summary (sent to client)</h4>
              <textarea
                rows={6}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Checklist */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><FileText size={12}/> Document Checklist ({checklist.length})</h4>
              </div>
              <ul className="space-y-2 mb-3">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 group">
                    <CheckCircle size={14} className="text-green-500 shrink-0"/>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => setChecklist(prev => prev.map((it, idx) => idx === i ? e.target.value : it))}
                      className="flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setChecklist(prev => prev.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600"
                      aria-label="Remove"
                    ><Trash2 size={14}/></button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newItem.trim()) { setChecklist(prev => [...prev, newItem.trim()]); setNewItem(''); } } }}
                  placeholder="Add another document (e.g. 2024 T4, void cheque)…"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => { if (newItem.trim()) { setChecklist(prev => [...prev, newItem.trim()]); setNewItem(''); } }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-sm"
                ><Plus size={14} className="inline mr-1"/> Add</button>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 mt-auto pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setPhase('form')}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition self-start md:self-auto"
              ><ChevronLeft size={14} className="inline mr-1"/> Back to form</button>

              <div className="flex flex-col items-stretch md:items-end gap-2">
                {!deal.clientEmail && <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest md:text-right">No email on file — only "Save to File" is available</p>}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Option 1: save the AI summary to the CRM WITHOUT emailing */}
                  <button
                    type="button"
                    disabled={!summary.trim()}
                    onClick={() => confirmIntake(true)}
                    className="bg-white border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition flex items-center justify-center gap-2 disabled:opacity-40"
                  ><Save size={15}/> Save Summary to File</button>

                  {/* Option 2: save AND email the client the summary + document checklist + secure portal link */}
                  <button
                    type="button"
                    disabled={!summary.trim() || !deal.clientEmail}
                    onClick={() => confirmIntake(false)}
                    title={!deal.clientEmail ? 'Add a client email to enable emailing' : ''}
                    className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-40"
                  ><Mail size={15}/> Save & Email Summary + Checklist</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PHASE: SENDING */}
      {phase === 'sending' && (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <Loader2 size={40} className="animate-spin text-blue-600 mb-4"/>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Saving & emailing client…</h3>
          <p className="text-sm text-gray-500 mt-2">Updating the CRM and sending the secure portal link.</p>
        </div>
      )}
    </div>
  );
}
