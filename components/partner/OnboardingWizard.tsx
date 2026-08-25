'use client';

// First-time login wizard.
//
// Renders as a full-screen modal on top of the CRM. Renders only for
// users whose /users/{uid} doc has neither onboardingCompletedAt nor
// onboardingSkippedAt. Dismissable at any step (Skip button posts
// { skipped: true } so we don't nag on subsequent logins).
//
// 6 steps:
//   1. Welcome  — sets the tone, shows what they get
//   2. Identity — display name / brokerage / reply-to; feeds every
//                 outbound email + SMS via /api/partner/sender-identity
//   3. Team     — optional; create a brokerage team so future
//                 teammates can join. Auto-skipped if the user
//                 already joined a team via invite acceptance.
//   4. Stages   — pre-fills with role defaults, editable, saves via
//                 /api/partner/pipeline-stages
//   5. Import   — jump to CSV import (opens it inline)
//   6. Done     — confirmation + Cmd+K hint

import { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Zap, Upload, Sparkles, Loader2, X, User, Users } from 'lucide-react';
import { authedPost, authedFetch, authedGet } from '../../lib/apiClient';
import { useToast } from '../ui/ToastProvider';

interface OnboardingWizardProps {
  displayName: string;
  role: string;
  defaultStages: string[];
  onDismiss: () => void;                     // called when done or skipped
  onOpenCsvImport: () => void;               // parent opens the existing CSV modal
  onStagesSaved: (stages: string[] | null) => void;
}

type Step = 'welcome' | 'identity' | 'team' | 'stages' | 'import' | 'done';
const STEPS: Step[] = ['welcome', 'identity', 'team', 'stages', 'import', 'done'];

export default function OnboardingWizard({ displayName, role, defaultStages, onDismiss, onOpenCsvImport, onStagesSaved }: OnboardingWizardProps) {
  const toast = useToast();
  const [step, setStep] = useState<Step>('welcome');
  const [stages, setStages] = useState<string[]>([...defaultStages]);
  const [savingStages, setSavingStages] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Sender identity — pre-filled from what we know, editable.
  const [idName, setIdName] = useState<string>(displayName || '');
  const [idBrokerage, setIdBrokerage] = useState<string>('');
  const [idReplyTo, setIdReplyTo] = useState<string>('');
  const [savingIdentity, setSavingIdentity] = useState(false);

  // Team step state — skipped entirely if the user already has a
  // team (e.g. auto-joined via invite).
  const [teamName, setTeamName] = useState<string>('');
  const [teamAlreadyJoined, setTeamAlreadyJoined] = useState<boolean>(false);
  const [savingTeam, setSavingTeam] = useState(false);

  useEffect(() => {
    // Best-effort — if this fails we still show the team step, it's a
    // no-op for the user.
    (async () => {
      try {
        const res = await authedGet('/api/partner/team');
        if (res.ok) {
          const data = await res.json();
          setTeamAlreadyJoined(!!data.team);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const first = displayName.split(' ')[0] || 'there';

  const finish = async (skipped: boolean) => {
    setDismissing(true);
    try {
      await authedPost('/api/partner/onboarding', { skipped });
    } catch { /* best-effort */ }
    onDismiss();
  };

  const saveTeamAndContinue = async () => {
    // Empty name = skip (this step is optional). Team already exists
    // = short-circuit to stages.
    if (teamAlreadyJoined || !teamName.trim()) {
      setStep('stages');
      return;
    }
    setSavingTeam(true);
    try {
      const res = await authedFetch('/api/partner/team', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.errors?.[0] || err?.error || 'Could not create team.');
        setSavingTeam(false);
        return;
      }
      setStep('stages');
    } catch (e: any) {
      toast.error('Network error', e?.message);
    } finally {
      setSavingTeam(false);
    }
  };

  const saveIdentityAndContinue = async () => {
    setSavingIdentity(true);
    try {
      const patch: Record<string, string> = {};
      const dn = idName.trim();
      const bn = idBrokerage.trim();
      const rt = idReplyTo.trim();
      if (dn) patch.displayName = dn;
      if (bn) patch.brokerageName = bn;
      if (rt) patch.replyToEmail = rt;
      // Empty is fine — skip the PUT entirely if nothing to save.
      if (Object.keys(patch).length > 0) {
        const res = await authedFetch('/api/partner/sender-identity', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.errors?.[0] || 'Could not save identity.');
          setSavingIdentity(false);
          return;
        }
      }
      setStep('team');
    } catch (e: any) {
      toast.error('Network error', e?.message);
    } finally {
      setSavingIdentity(false);
    }
  };

  const saveStagesAndContinue = async () => {
    setSavingStages(true);
    try {
      const clean = stages.map(s => s.trim()).filter(Boolean);
      const res = await authedFetch('/api/partner/pipeline-stages', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: clean }),
      });
      if (!res.ok) { toast.error('Could not save stages.'); setSavingStages(false); return; }
      onStagesSaved(clean.length === 0 ? null : clean);
      setStep('import');
    } catch (e: any) {
      toast.error('Network error', e?.message);
    } finally {
      setSavingStages(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-gray-200 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition ${s === step ? 'bg-blue-600 w-8' : (STEPS.indexOf(step) > i ? 'bg-blue-600 w-4' : 'bg-gray-200 w-4')}`}/>
            ))}
          </div>
          <button onClick={() => finish(true)} disabled={dismissing}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-slate-900 flex items-center gap-1">
            Skip <X size={11}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {/* WELCOME */}
          {step === 'welcome' && (
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Sparkles size={26} className="text-blue-600"/>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Welcome, {first}.</h1>
              <p className="text-sm md:text-base text-gray-600 mt-3 leading-relaxed">
                This is the IndiBrick CRM. In the next 90 seconds we'll set up your pipeline stages, get your existing book of business in, and hand off to the app.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: Zap,   title: 'Automations', body: 'Trigger emails, tasks, tags when deals move.' },
                  { icon: Upload, title: 'CSV import', body: 'Bring your existing book in — dedupes on email + phone.' },
                  { icon: Sparkles, title: 'AI assist', body: 'Deal analyzer + underwriter intake + copilot.' },
                ].map(f => (
                  <div key={f.title} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <f.icon size={18} className="text-blue-600 mb-2"/>
                    <p className="text-sm font-black text-slate-900">{f.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IDENTITY */}
          {step === 'identity' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Step 2 of 5</p>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                <User size={22} className="text-blue-600"/>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">How should your emails read?</h1>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                This is what shows in the From line and CASL footer of every email or SMS you send from the CRM — mass campaigns, drip sequences, one-off replies. You can change it later under Settings.
              </p>
              <div className="mt-5 space-y-3">
                <label className="block text-sm">
                  <span className="text-slate-700 font-medium">Display name</span>
                  <input type="text" value={idName} onChange={e => setIdName(e.target.value)}
                    placeholder="e.g. Sarah Nguyen"
                    className="mt-1 w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-700 font-medium">Brokerage / company <span className="text-gray-400 font-normal">(optional)</span></span>
                  <input type="text" value={idBrokerage} onChange={e => setIdBrokerage(e.target.value)}
                    placeholder="e.g. Sutton Group West Coast"
                    className="mt-1 w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                </label>
                <label className="block text-sm">
                  <span className="text-slate-700 font-medium">Reply-to email <span className="text-gray-400 font-normal">(optional)</span></span>
                  <input type="email" value={idReplyTo} onChange={e => setIdReplyTo(e.target.value)}
                    placeholder="where replies should land"
                    className="mt-1 w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                </label>
              </div>
            </div>
          )}

          {/* TEAM */}
          {step === 'team' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Step 3 of 5</p>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                <Users size={22} className="text-blue-600"/>
              </div>
              {teamAlreadyJoined ? (
                <>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">You&apos;re already on a team.</h1>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    Your invite landed you in an existing brokerage roster. No action needed here — hit continue.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Working with a team?</h1>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    Create a team now and you can invite teammates from Settings later. Deals stay yours; team members get read/write across the roster. Leave blank if you&apos;re solo — you can create one any time.
                  </p>
                  <div className="mt-5">
                    <label className="block text-sm">
                      <span className="text-slate-700 font-medium">Team name <span className="text-gray-400 font-normal">(optional)</span></span>
                      <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                        placeholder="e.g. Sutton Group West Coast Toronto"
                        className="mt-1 w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STAGES */}
          {step === 'stages' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Step 4 of 5</p>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Your pipeline stages</h1>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Our default for <span className="font-bold text-slate-900">{role.replace('partner_', '')}</span> is below. Rename anything, remove what doesn't fit, add your own vocabulary. You can always change this from the pipeline toolbar later.
              </p>
              <div className="mt-5 space-y-2">
                {stages.map((s, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 w-6">{i + 1}</span>
                    <input type="text" value={s}
                      onChange={e => setStages(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                    <button onClick={() => setStages(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-widest px-2">Remove</button>
                  </div>
                ))}
                <button onClick={() => setStages(prev => [...prev, 'New stage'])}
                  className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-slate-900 rounded-xl p-3 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 transition">
                  + Add stage
                </button>
              </div>
            </div>
          )}

          {/* IMPORT */}
          {step === 'import' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Step 5 of 5</p>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Bring your book in</h1>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Export a CSV from your current CRM (kvCORE / Follow Up Boss / anywhere), then drop it into the importer. We auto-detect column mappings and dedupe against your existing referrals on email + phone.
              </p>
              <button
                onClick={() => { onOpenCsvImport(); setStep('done'); }}
                className="mt-6 bg-slate-900 hover:bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg flex items-center gap-2"
              >
                <Upload size={14}/> Open CSV importer
              </button>
              <p className="text-xs text-gray-500 mt-4">Rather do this later? Hit Continue below — the Import CSV button lives in the pipeline header.</p>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={26} className="text-emerald-600"/>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">You're set.</h1>
              <p className="text-sm md:text-base text-gray-600 mt-3 leading-relaxed max-w-md mx-auto">
                One shortcut worth remembering: <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-slate-900 font-mono text-xs">⌘K</kbd> (or <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-slate-900 font-mono text-xs">Ctrl K</kbd>) opens search from anywhere in the CRM.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <button
            onClick={() => {
              const idx = STEPS.indexOf(step);
              if (idx > 0) setStep(STEPS[idx - 1]);
            }}
            disabled={step === 'welcome' || dismissing}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 disabled:opacity-30 flex items-center gap-1 px-3 py-2">
            <ArrowLeft size={11}/> Back
          </button>

          {step === 'welcome' && (
            <button onClick={() => setStep('identity')}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition shadow-sm flex items-center gap-2">
              Get started <ArrowRight size={12}/>
            </button>
          )}
          {step === 'identity' && (
            <button onClick={saveIdentityAndContinue} disabled={savingIdentity}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50">
              {savingIdentity ? <Loader2 size={12} className="animate-spin"/> : null} Save + continue <ArrowRight size={12}/>
            </button>
          )}
          {step === 'team' && (
            <button onClick={saveTeamAndContinue} disabled={savingTeam}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50">
              {savingTeam ? <Loader2 size={12} className="animate-spin"/> : null}
              {teamAlreadyJoined ? 'Continue' : (teamName.trim() ? 'Create team + continue' : 'Skip for now')} <ArrowRight size={12}/>
            </button>
          )}
          {step === 'stages' && (
            <button onClick={saveStagesAndContinue} disabled={savingStages || stages.length === 0}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50">
              {savingStages ? <Loader2 size={12} className="animate-spin"/> : null} Save + continue <ArrowRight size={12}/>
            </button>
          )}
          {step === 'import' && (
            <button onClick={() => setStep('done')}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition shadow-sm flex items-center gap-2">
              Continue <ArrowRight size={12}/>
            </button>
          )}
          {step === 'done' && (
            <button onClick={() => finish(false)} disabled={dismissing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50">
              {dismissing ? <Loader2 size={12} className="animate-spin"/> : null} Open the CRM <ArrowRight size={12}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
