'use client';

// Insurance agent dashboard.
//
// Two side-by-side sections:
//   1. AVAILABLE (top) — shared pool of insurance opportunities spawned
//      by recent mortgage fundings. First-come, first-served claim.
//   2. YOUR BOOK (below) — the agent's claimed leads across the
//      insurance pipeline stages, with per-row status.
//
// Rendered inside the /partner CRM as a new "Insurance" tab when the
// signed-in role is partner_insurance OR admin, and the feature flag
// NEXT_PUBLIC_INSURANCE_ROLE_ENABLED is on.

import { useState } from 'react';
import {
  Shield, Zap, ArrowRight, Home, CarFront, HeartPulse, Sparkles,
  Clock, CheckCircle, User, XCircle,
} from 'lucide-react';
import { useInsuranceLeads, type InsuranceLead } from '../../hooks/useInsuranceLeads';
import { formatCurrency } from '../../lib/crmHelpers';
import { EmptyState, LoadingState } from '../ui/StateFeedback';

interface InsurancePanelProps {
  currentUid: string | undefined;
  onOpenDeal?: (referralId: string) => void;
}

function coverageIcon(kind?: string) {
  switch (kind) {
    case 'Home':     return Home;
    case 'Auto':     return CarFront;
    case 'Life':     return HeartPulse;
    case 'Bundle':   return Sparkles;
    default:         return Shield;
  }
}

function daysSince(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86400000);
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86400000);
}

const STATUS_BADGE: Record<string, string> = {
  New:       'bg-amber-100 text-amber-800 border-amber-200',
  Contacted: 'bg-blue-100 text-blue-800 border-blue-200',
  Quoted:    'bg-indigo-100 text-indigo-800 border-indigo-200',
  Bound:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  Renewed:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  Lost:      'bg-red-100 text-red-800 border-red-200',
};

function ClaimableCard({
  lead,
  onClaim,
  claiming,
}: {
  lead: InsuranceLead;
  onClaim: () => void;
  claiming: boolean;
}) {
  const Icon = coverageIcon(lead.insuranceCoverageType);
  const age = daysSince(lead.referralDate);
  return (
    <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm hover:border-amber-400 transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1">
              <Zap size={10}/> Unclaimed
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
              <Icon size={11}/> {lead.insuranceCoverageType || 'Home'} insurance
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${age > 2 ? 'text-red-700' : 'text-gray-500'}`}>
              · {age === 0 ? 'today' : `${age}d ago`}
            </span>
          </div>
          <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">{lead.clientName || 'Unnamed'}</h3>
          {lead.clientEmail && <p className="text-xs text-gray-500 mt-0.5">{lead.clientEmail}</p>}
          {lead.notes && <p className="text-xs text-gray-600 mt-2 leading-relaxed">{lead.notes}</p>}
        </div>
      </div>
      <button
        onClick={onClaim}
        disabled={claiming}
        className="w-full bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {claiming ? 'Claiming…' : (<><Sparkles size={12}/> Claim this lead <ArrowRight size={12}/></>)}
      </button>
    </div>
  );
}

function BookRow({ lead, onOpen }: { lead: InsuranceLead; onOpen?: (id: string) => void }) {
  const Icon = coverageIcon(lead.insuranceCoverageType);
  const days = daysUntil(lead.insuranceRenewalDate);
  const status = lead.status || 'New';
  const badge = STATUS_BADGE[status] || STATUS_BADGE.New;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:border-slate-900 transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${badge}`}>{status.toUpperCase()}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1">
              <Icon size={11}/> {lead.insuranceCoverageType || 'Home'}
            </span>
            {lead.insuranceCarrier && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">· {lead.insuranceCarrier}</span>
            )}
          </div>
          <h4 className="text-sm md:text-base font-black text-slate-900 tracking-tight truncate">{lead.clientName || 'Unnamed'}</h4>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {typeof lead.insurancePremiumAnnual === 'number' && lead.insurancePremiumAnnual > 0 && (
              <span>Premium {formatCurrency(lead.insurancePremiumAnnual)}/yr</span>
            )}
            {lead.insurancePolicyNumber && (<span>· Policy {lead.insurancePolicyNumber}</span>)}
            {days !== null && (
              <span className={`flex items-center gap-1 ${days <= 30 ? 'text-red-700' : days <= 60 ? 'text-amber-700' : 'text-gray-500'}`}>
                <Clock size={10}/> Renews in {days}d
              </span>
            )}
          </div>
        </div>
        {onOpen && (
          <button
            onClick={() => onOpen(lead.id)}
            className="shrink-0 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1 transition"
          >
            Open <ArrowRight size={10}/>
          </button>
        )}
      </div>
    </div>
  );
}

export default function InsurancePanel({ currentUid, onOpenDeal }: InsurancePanelProps) {
  const { claimable, mine, loading, claim } = useInsuranceLeads(currentUid);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    setFeedback(null);
    const res = await claim(id);
    setClaimingId(null);
    if (res.ok) {
      setFeedback({ ok: true, msg: 'Claimed. The lead is now in your book below.' });
    } else if (res.claimedBy) {
      setFeedback({ ok: false, msg: 'Another agent grabbed this one first — better luck on the next lead!' });
    } else {
      setFeedback({ ok: false, msg: res.error || 'Claim failed. Try again.' });
    }
  };

  const totalAnnualPremium = mine
    .filter(l => l.status === 'Bound' || l.status === 'Renewed')
    .reduce((acc, l) => acc + Number(l.insurancePremiumAnnual || 0), 0);
  const bookByStatus = mine.reduce<Record<string, number>>((acc, l) => {
    const s = l.status || 'New';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Book stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Available',   value: claimable.length,                 sub: 'in pool' },
          { label: 'Contacted',   value: bookByStatus['Contacted'] || 0,   sub: 'in progress' },
          { label: 'Bound',       value: bookByStatus['Bound'] || 0,       sub: 'active policies' },
          { label: 'Book Premium', value: formatCurrency(totalAnnualPremium), sub: 'annual, bound + renewed' },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-gray-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{s.value}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${feedback.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          {feedback.ok ? <CheckCircle size={16}/> : <XCircle size={16}/>}
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto text-gray-500 hover:text-slate-900"><XCircle size={14}/></button>
        </div>
      )}

      {/* AVAILABLE section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-amber-500"/>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Available Leads</h2>
          <span className="text-xs text-gray-500 font-bold">· {claimable.length} in pool</span>
        </div>
        {loading && <LoadingState label="Loading pool"/>}
        {!loading && claimable.length === 0 && (
          <EmptyState
            icon={Zap}
            title="No unclaimed leads right now"
            description="When an IndiBrick mortgage funds, a home-insurance opportunity lands here for the first insurance agent to claim."
            compact
          />
        )}
        {!loading && claimable.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {claimable.map(lead => (
              <ClaimableCard
                key={lead.id}
                lead={lead}
                claiming={claimingId === lead.id}
                onClaim={() => handleClaim(lead.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* YOUR BOOK section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-slate-900"/>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Your Book</h2>
          <span className="text-xs text-gray-500 font-bold">· {mine.length} lead{mine.length === 1 ? '' : 's'}</span>
        </div>
        {loading && <LoadingState label="Loading your book"/>}
        {!loading && mine.length === 0 && (
          <EmptyState
            icon={User}
            title="Your book is empty"
            description="Claim your first lead above and it'll appear here with its full pipeline."
            compact
          />
        )}
        {!loading && mine.length > 0 && (
          <div className="space-y-2">
            {mine.map(lead => (
              <BookRow key={lead.id} lead={lead} onOpen={onOpenDeal} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
