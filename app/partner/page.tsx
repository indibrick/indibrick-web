'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toStoredPhone } from '@/lib/phone';
import { useAdmin } from '../../AdminContext';
import { CRMService } from '../../services/CRMService';
import { Referral, Task, ActivityLog } from '../../types';
import { 
  Plus, Send, X, Wallet, Activity, PhoneCall, Calendar, Mail, Network, Trash2,
  Filter, Star, Zap, BrainCircuit, ShieldCheck, Target, CheckCircle, Loader2, 
  Briefcase, LogOut, ChevronRight, Clock, User, Search, FileText, ArrowDownLeft, Users,
  ChevronLeft, AlertCircle, Shield, Landmark, ArrowUpRight, Lock, Tag, Gauge, Bot, ListChecks, Edit2, Save, ArrowRight, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc, arrayUnion, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import PartnerCopilot from '../../components/PartnerCopilot';
import IntakeWizard from '../../components/partner/IntakeWizard';
import ColdDialer from '../../components/partner/ColdDialer';
import IncomingCall from '../../components/partner/IncomingCall';
import { BrowserPhoneProvider } from '../../hooks/useBrowserPhone';
import InAppInbox from '../../components/partner/InAppInbox';
import CrossSellPanel from '../../components/partner/CrossSellPanel';
import InsurancePanel from '../../components/partner/InsurancePanel';
import MessageThread from '../../components/partner/MessageThread';
import WorkflowsPanel from '../../components/partner/WorkflowsPanel';
import FormsPanel from '../../components/partner/FormsPanel';
import CampaignsPanel from '../../components/partner/CampaignsPanel';
import DripsPanel from '../../components/partner/DripsPanel';
import ManagedAdsPanel from '../../components/partner/ManagedAdsPanel';
import CsvImportModal from '../../components/partner/CsvImportModal';
import SearchPalette from '../../components/partner/SearchPalette';
import PipelineStagesModal from '../../components/partner/PipelineStagesModal';
import CustomFieldsModal from '../../components/partner/CustomFieldsModal';
import CustomFieldsInline from '../../components/partner/CustomFieldsInline';
import BulkActionBar from '../../components/partner/BulkActionBar';
import OnboardingWizard from '../../components/partner/OnboardingWizard';
import ReportsPanel from '../../components/partner/ReportsPanel';
import DealModal from '../../components/partner/DealModal';
import SenderIdentityEditor from '../../components/partner/SenderIdentityEditor';
import MyAdsPanel from '../../components/partner/MyAdsPanel';
import ExportButtons from '../../components/partner/ExportButtons';
import TeamCard from '../../components/partner/TeamCard';
import TeamReportPanel from '../../components/partner/TeamReportPanel';
import { useToast } from '../../components/ui/ToastProvider';
import type { CustomFieldDef } from '../../lib/customFieldsShape';
import { TrendingUp, ShieldCheck as ShieldIcon, Zap as ZapIcon, Upload as UploadIcon, Command as CommandIcon, Settings as SettingsIcon, BarChart3 as BarChartIcon, DollarSign as DollarIcon } from 'lucide-react';

// Feature flag — insurance role tab (Phase 5). Enable per-env when you
// have onboarded at least one insurance-role user via /users/{uid}.role
// = 'partner_insurance', or in dev to click through the UI with seeded
// data. Defaults to on so the tab appears; set NEXT_PUBLIC_INSURANCE_
// ROLE_ENABLED=false to hide the tab everywhere until ready.
const INSURANCE_ROLE_ENABLED = process.env.NEXT_PUBLIC_INSURANCE_ROLE_ENABLED !== 'false';
import { authedGet, authedPost, authedPut } from '../../lib/apiClient';
import { useCRMData } from '../../hooks/useCRMData';
import {
  FUNDED_STATUSES,
  LOST_STATUSES,
  REFERRAL_SOURCES,
  CARD_VIRTUAL_STYLE,
  formatCurrency,
  computeDealScore,
  stageAgeStyle,
  BLANK_INTAKE,
  type OtherProperty,
} from '../../lib/crmHelpers';

// Global style that hides the public-site nav/footer when the portal is on
// screen. Hoisted to module scope so React doesn't re-emit it on every render.
const PORTAL_CHROME_HIDER = `nav:not(.portal-nav), footer, [class*="fixed"][class*="bottom-"]:not(.portal-nav) { display: none !important; }`;

export default function PartnerCRM() {
  const { user, loading, logout } = useAdmin();
  const router = useRouter();
  const toast = useToast();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analyzer' | 'calendar' | 'cross-sell' | 'insurance' | 'automations' | 'reports' | 'managed-ads' | 'settings'>('pipeline');
  // Sub-tab within the Automations screen (Workflows | Forms). Kept
  // local to the parent so switching top-tabs and coming back returns
  // to the same sub-view.
  const [automationsView, setAutomationsView] = useState<'workflows' | 'forms' | 'campaigns' | 'drips'>('workflows');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showStagesEditor, setShowStagesEditor] = useState(false);
  const [showCustomFieldsEditor, setShowCustomFieldsEditor] = useState(false);
  // Per-user stage override. Null = use role default.
  const [customStages, setCustomStages] = useState<string[] | null>(null);
  // Per-user custom deal-field definitions.
  const [customDealFields, setCustomDealFields] = useState<CustomFieldDef[]>([]);
  // First-time onboarding wizard visibility. `null` = still loading;
  // `true` = show; `false` = user already dismissed/completed.
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Bulk-selection mode. When on, cards render checkboxes and click
  // toggles selection instead of opening the deal modal.
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const clearBulk = useCallback(() => {
    setSelectedIds(new Set());
    setBulkMode(false);
  }, []);

  // Global Cmd/Ctrl+K listener — opens the search palette from
  // anywhere in the CRM. Bind at document level so it fires even when
  // focus is on the pipeline body (typing in the search filter is not
  // Cmd+K, so no conflict).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [pipelineView, setPipelineView] = useState<'all' | 'mine' | 'incoming' | 'outbound' | 'team'>('mine');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterReferralSource, setFilterReferralSource] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState(''); 
  
  const [allReferrals, setAllReferrals] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); 
  const [ecosystemPartners, setEcosystemPartners] = useState<any[]>([]); 
  
  const [referralVolume, setReferralVolume] = useState('$0.00');
  const [fullName, setFullName] = useState(''); 
  const [partnerRole, setPartnerRole] = useState<string>('partner_realtor');

  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [logType, setLogType] = useState<'note_internal' | 'note_client' | 'log_call' | 'task' | 'route' | 'doc' | 'borrow_direct'>('note_internal');
  const [logInput, setLogInput] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [targetPartnerId, setTargetPartnerId] = useState('');
  const [docRequests, setDocRequests] = useState<string[]>(['']);

  // Brief toast surfaced when the AI Copilot auto-schedules a follow-up from a note
  const [aiTaskToast, setAiTaskToast] = useState<{ dueDate: string; description: string; isDefault?: boolean } | null>(null);
  // Escalation flash — shown when the note copy tripped the competing-broker regex.
  const [escalationToast, setEscalationToast] = useState<{ clientName: string } | null>(null);
  
  // --- CLIENT EDIT STATE ---
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientForm, setEditClientForm] = useState({ name: '', phone: '', email: '' });

  // --- DEAL SUMMARY STATE ---
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editSummaryText, setEditSummaryText] = useState('');

  // --- BORROW DIRECT STATE ---
  const [bdDeal, setBdDeal] = useState<any>(null);
  const [bdBids, setBdBids] = useState<any[]>([]);
  const [bdForm, setBdForm] = useState({ loanAmount: '', ltv: '', position: '1st', propertyType: 'Detached', location: '', aiSummary: '' });
  const [isPublishing, setIsPublishing] = useState(false);

  // --- FORMS ---
  const [showNewReferralForm, setShowNewReferralForm] = useState(false);
  // assignedTo starts empty; the submit handler resolves it based on
  // role (admin → ADMIN_INBOX, partner → self). Also re-set on the
  // "New lead" button click below with the correct default now that
  // partnerRole is known.
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', service: 'General Inquiry', message: '', assignedTo: '', referralSource: 'Self-Generated' });
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ description: '', dueDate: '', referralId: 'general' });

  const [analyzerForm, setAnalyzerForm] = useState({ income: '', downPayment: '', propertyValue: '', creditScore: '', debts: '', notes: '' });
  const [analyzerStatus, setAnalyzerStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analyzerResult, setAnalyzerResult] = useState<any>(null);

  // AI Intake wizard is now a self-contained component (components/partner/
  // IntakeWizard.tsx). This flag only controls open/close; every phase,
  // form-state, and API call lives inside the wizard.
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  // Google Calendar OAuth connection state — the "Sync" button now
  // toggles between "Connect" (no refresh token yet) and "Sync Now"
  // (already connected). Populated on mount + refreshed when the OAuth
  // callback returns to /partner?calendar=connected.
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Whether the user has manually picked a pipeline view this session. Stops loadProfileAndData() from clobbering admin's "Mine" selection.
  const hasPickedView = useRef(false);

  // Kanban vs list view
  const [boardLayout, setBoardLayout] = useState<'list' | 'kanban'>('list');

  // Render-cap so the initial paint isn't ~1000 React tree nodes. Search and
  // filter still apply to the full pipeline; this only controls how many
  // cards are mounted at once. Resets to PAGE_SIZE whenever filters change so
  // the user always sees the top of the filtered list.
  const PAGE_SIZE = 100;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // --- UNIQUE ROLE PIPELINE STAGES ---
  const getPipelineStages = (role: string) => {
      switch(role) {
          case 'partner_realtor': return ['Lead Received', 'Showing', 'Offer Made', 'Conditional', 'Firm Sale', 'Closed', 'Lost'];
          case 'partner_lawyer': return ['File Opened', 'Title Search', 'Docs Prepared', 'Signing', 'Closed', 'Cancelled'];
          case 'partner_referral': return ['Referred', 'Contacted', 'Processing', 'Funded / Paid', 'Declined'];
          case 'partner_insurance': return ['New', 'Contacted', 'Quoted', 'Bound', 'Renewed', 'Cancelled', 'Lost'];
          case 'partner_mortgage': return ['Received', 'Contacted', 'Underwriting', 'Approved', 'Firm / Conditional', 'Closed', 'Declined'];
          default: return ['Received', 'Contacted', 'Underwriting', 'Approved', 'Firm / Conditional', 'Closed', 'Declined'];
      }
  };
  // Per-user override (customStages on /users/{uid}) beats the role
  // default. Editable via the Stages modal in the pipeline header.
  const roleDefaultStages = getPipelineStages(partnerRole);
  const PIPELINE_STAGES = customStages && customStages.length > 0 ? customStages : roleDefaultStages;

  // --- AUTH & INIT ---
  useEffect(() => {
    if (!loading && !user) { router.push('/partner/login'); return; }
    if (user) loadProfileAndData();
  }, [user, loading, router]);

  useEffect(() => {
    const fetchBorrowDirectData = async () => {
       if (selectedDeal?.id) {
          try {
             const q = query(collection(db, 'borrow_direct_deals'), where('referralId', '==', selectedDeal.id));
             const snap = await getDocs(q);
             if (!snap.empty) {
                const bd = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setBdDeal(bd);
                const bidsQ = query(collection(db, 'borrow_direct_bids'), where('dealId', '==', bd.id));
                const bidsSnap = await getDocs(bidsQ);
                setBdBids(bidsSnap.docs.map(d => ({id: d.id, ...d.data()})));
             } else {
                setBdDeal(null); setBdBids([]);
             }
             setBdForm(prev => ({...prev, location: selectedDeal.city || ''}));
          } catch (e) { console.error("BorrowDirect fetch error", e); }
       }
    };
    fetchBorrowDirectData();
  }, [selectedDeal?.id]);

  const loadProfileAndData = async () => {
    if (!user) return;
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let currentRole = 'partner_realtor'; 
        let loadedFullName = user.displayName || 'Partner';
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            setReferralVolume(data.referralVolume || '$0.00');
            setPartnerRole(data.role || 'partner_realtor');
            currentRole = data.role || 'partner_realtor';
            loadedFullName = data.displayName || loadedFullName;
            // Per-user custom pipeline stages override.
            setCustomStages(Array.isArray(data.customStages) && data.customStages.length > 0 ? data.customStages : null);
            // Per-user custom deal field definitions.
            setCustomDealFields(Array.isArray(data.customDealFields) ? data.customDealFields : []);
            // First-time login: show onboarding unless completed/skipped.
            const seenOnboarding = !!data.onboardingCompletedAt || !!data.onboardingSkippedAt;
            setShowOnboarding(!seenOnboarding);
            // Admins default to 'all' on first load, but don't fight the user if they later pick 'mine'
            setPipelineView(prev => (currentRole === 'admin' && prev === 'mine' && !hasPickedView.current) ? 'all' : prev);
        }
        hasPickedView.current = true;
        setFullName(loadedFullName);
        
        let activePipeline: any[] = [];
        if (currentRole === 'admin') {
            // No row cap per spec — admin sees the entire pipeline. Sort
            // newest-first server-side so the working set is at the top.
            const adminQ = query(collection(db, 'referrals'), orderBy('referralDate', 'desc'));
            const snap = await getDocs(adminQ);
            activePipeline = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
            const profile = { uid: user.uid, role: currentRole, displayName: loadedFullName };
            const { sent, received, mine, participating } = await CRMService.getPartnerDashboard(profile as any);
            activePipeline = [...sent, ...received, ...mine, ...(participating || [])];
            // Wave K-3: layer team-visible deals on top of the caller's
            // own book so a teammate sees the roster's whole pipeline
            // when a team owner has enrolled them.
            try {
              const tRes = await authedGet('/api/partner/referrals/team-visible');
              if (tRes.ok) {
                const data = await tRes.json();
                if (Array.isArray(data.referrals)) {
                  activePipeline = [...activePipeline, ...data.referrals];
                }
              }
            } catch { /* best-effort — team is optional */ }
            activePipeline = activePipeline.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        }
        setAllReferrals(activePipeline);

        let fetchedTasks: Task[] = [];
        try {
            const tRes = await authedGet('/api/partner/tasks');
            if(tRes.ok) {
                const tData = await tRes.json();
                fetchedTasks = tData.tasks || [];
            }
        } catch (taskErr) { fetchedTasks = await CRMService.fetchDailyTasks(user.uid); }
        setAllTasks(fetchedTasks);

        // Ecosystem partners change rarely — fetch only on first load
        if (ecosystemPartners.length === 0) {
            const usersSnap = await getDocs(collection(db, 'users'));
            setEcosystemPartners(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() as any })));
        }

        setSelectedDeal(currentSelected => {
            if (!currentSelected) return null;
            const updated = activePipeline.find(d => d.id === currentSelected.id);
            return updated ? { ...updated, vault: currentSelected?.vault || updated.vault } : currentSelected;
        });
        
        setDataLoading(false);
    } catch (e) { console.error("Data Load Error", e); setDataLoading(false); }
  };

  const handlePrevMonth = () => { currentMonth === 0 ? (setCurrentMonth(11), setCurrentYear(currentYear - 1)) : setCurrentMonth(currentMonth - 1); };
  const handleNextMonth = () => { currentMonth === 11 ? (setCurrentMonth(0), setCurrentYear(currentYear + 1)) : setCurrentMonth(currentMonth + 1); };
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const todayDateString = new Date().toISOString().split('T')[0];

  // Check whether the current user has connected Google Calendar. Runs
  // on mount + whenever the OAuth callback returns to /partner?calendar=connected.
  const refreshCalendarStatus = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/partner/calendar-oauth/status?uid=${user.uid}`);
      const data = await res.json();
      setCalendarConnected(!!data.connected);
      setCalendarEmail(data.email || null);
    } catch { /* silent — the button will fall back to "Connect" */ }
  };

  useEffect(() => {
    if (!user?.uid) return;
    refreshCalendarStatus();

    // Handle the return trip from Google's OAuth consent screen. The
    // callback route redirects to /partner?calendar=connected|cancelled|error.
    // Strip the params from the URL after we read them so a refresh
    // doesn't re-trigger the alert.
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const calFlag = params.get('calendar');
    if (calFlag === 'connected') {
      const em = params.get('email');
      toast.success('Google Calendar connected', em ? `Linked as ${em}` : undefined);
      refreshCalendarStatus();
    } else if (calFlag === 'cancelled') {
      toast.info('Google Calendar connection cancelled.');
    } else if (calFlag === 'error') {
      toast.error('Google Calendar connection failed', params.get('reason') || 'Unknown error');
    }
    if (calFlag) {
      params.delete('calendar');
      params.delete('email');
      params.delete('reason');
      const qs = params.toString();
      window.history.replaceState({}, '', `/partner${qs ? `?${qs}` : ''}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Two-state action for the calendar button.
  // - Not connected → open Google OAuth consent (new tab, so state survives).
  // - Connected     → push the current task list into their Google Calendar.
  const handleGoogleSync = async () => {
      if (!user?.uid) return;
      setIsSyncingGoogle(true);
      try {
          if (!calendarConnected) {
            const res = await fetch(`/api/partner/calendar-oauth/authorize?uid=${user.uid}`);
            const data = await res.json();
            if (data.authUrl) {
              // Same tab so we come back to /partner cleanly and the mount
              // effect above picks up ?calendar=connected.
              window.location.href = data.authUrl;
              return;
            }
            toast.error('Google Calendar', data.error || 'Could not build auth URL.');
          } else {
            const res = await authedPost('/api/partner/calendar-sync', { tasks: allTasks });
            const data = await res.json();
            if (data.connected === false) {
              // Refresh token got revoked from the Google side. Fall back
              // to "Connect" flow.
              setCalendarConnected(false);
              toast.warn('Reconnect Google Calendar', data.message);
            } else {
              toast.success('Calendar synced', data.message || `Pushed ${data.pushed || 0} task(s).`);
            }
          }
      } catch (err) { toast.error('Google Calendar action failed.'); }
      setIsSyncingGoogle(false);
  };

  const handleGoogleDisconnect = async () => {
      if (!user?.uid) return;
      if (!window.confirm('Disconnect Google Calendar? Future tasks will no longer sync until you reconnect.')) return;
      try {
          await fetch('/api/partner/calendar-oauth/disconnect', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid }),
          });
          setCalendarConnected(false);
          setCalendarEmail(null);
      } catch { toast.error('Disconnect failed.'); }
  };

  const handleManualTaskSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      let clientName = 'Personal Task';
      if (newTask.referralId !== 'general') {
          const deal = allReferrals.find(d => d.id === newTask.referralId);
          if (deal) clientName = deal.clientName;
      }
      // Optimistic: append the new task locally so the calendar updates
      // immediately. The full data refetch is unnecessary for a single task.
      const tempTask: Task = { id: `tmp-${Date.now()}`, referralId: newTask.referralId, clientName, assigneeId: user.uid, dueDate: newTask.dueDate, description: newTask.description, status: 'Pending' } as any;
      setAllTasks(prev => [...prev, tempTask]);
      await authedPost('/api/partner/tasks', { referralId: newTask.referralId, clientName: clientName, dueDate: newTask.dueDate, description: newTask.description, status: 'Pending' });
      setShowNewTaskForm(false); setNewTask({ description: '', dueDate: '', referralId: 'general' });
  };

  const handleAnalyzeDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzerForm.income.trim() || !analyzerForm.propertyValue.trim()) return;
    setAnalyzerStatus('loading'); setAnalyzerResult(null);
    const scenarioString = `Income: $${analyzerForm.income}. Down Payment: $${analyzerForm.downPayment}. Property Value: $${analyzerForm.propertyValue}. Credit: ${analyzerForm.creditScore}. Debts: $${analyzerForm.debts}. Notes: ${analyzerForm.notes}`;
    try {
        const res = await fetch('/api/partner/deal-analyzer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: scenarioString, partnerName: fullName }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAnalyzerResult(data); setAnalyzerStatus('success');
    } catch (err: any) { setAnalyzerStatus('error'); }
  };

  const [injectingLead, setInjectingLead] = useState(false);
  const [nudgingOwner, setNudgingOwner] = useState(false);

  const handleManualLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newClient.name.trim()) { toast.warn('Client name is required.'); return; }

    setInjectingLead(true);
    try {
      // Role-aware fallback: partners default to self; admin defaults
      // to the triage inbox. Empty `assignedTo` (initial mount / reset)
      // resolves to the right target based on who's logged in.
      let assignedAgentId = newClient.assignedTo
        || (partnerRole === 'admin' ? 'ADMIN_INBOX' : user.uid);
      let assignedAgentName = 'Admin Triage';
      if (assignedAgentId === user.uid) assignedAgentName = fullName;
      else if (assignedAgentId !== 'ADMIN_INBOX') {
          const partner = ecosystemPartners.find(p => p.uid === assignedAgentId);
          if (partner) {
              assignedAgentName = partner.displayName;
              notifyParticipants(partner.email, `IndiBrick CRM: New Lead Assigned (${newClient.name})`, `<p><strong>${fullName}</strong> has assigned a new lead to your pipeline.</p><p><strong>Client:</strong> ${newClient.name}</p>`);
          }
      }
      // referralSource may hold a partner UID (admin picked a specific partner) or a generic label
      const srcPartner = ecosystemPartners.find(p => p.uid === newClient.referralSource);
      const referralSource = srcPartner ? srcPartner.displayName : (newClient.referralSource || 'Self-Generated');
      const referralPartnerId = srcPartner ? srcPartner.uid : '';
      const referralPartnerName = srcPartner ? srcPartner.displayName : '';
      // Phase 4 privacy: realtor-created deals start PRIVATE — invisible
      // to brokerage admin. The realtor can flip pushedForMortgage via
      // the "Push for Mortgage" button when they want IndiBrick on it.
      // Every other role's deals are always visible internally, so they
      // start pushed.
      const isRealtorCreator = partnerRole === 'partner_realtor';
      const pushedForMortgage = !isRealtorCreator;
      const nowIso = new Date().toISOString();
      const payload = {
        ...newClient,
        type: 'Manual Entry',
        dealCategory: 'potential',
        assignedAgentId, assignedAgentName,
        callCount: 0,
        participants: [], participantIds: [],
        referralSource, referralPartnerId, referralPartnerName,
        pushedForMortgage,
        pushedForMortgageAt: pushedForMortgage ? nowIso : null,
        pushedForMortgageBy: pushedForMortgage ? user.uid : null,
      };
      const result = await CRMService.createReferral({ uid: user.uid, role: partnerRole, displayName: fullName, email: user.email } as any, payload as any);
      if (!result.success) throw new Error('Could not save the lead.');
      if (result.id && assignedAgentId !== 'ADMIN_INBOX') {
          try { await CRMService.createTouchCadence(result.id, newClient.name, assignedAgentId); }
          catch (e) { console.warn('Cadence creation failed', e); }
      }
      setShowNewReferralForm(false);
      setNewClient({ name: '', phone: '', email: '', service: 'General Inquiry', message: '', assignedTo: partnerRole === 'admin' ? 'ADMIN_INBOX' : (user?.uid || ''), referralSource: 'Self-Generated' });

      // Optimistic: prepend the new lead to local state instead of re-fetching
      // the whole pipeline. Drops the perceived save latency from seconds to
      // instant on accounts with hundreds of referrals.
      if (result.id) {
          const optimisticDeal = {
              id: result.id,
              ...payload,
              clientName: newClient.name,
              clientPhone: toStoredPhone(newClient.phone),
              clientEmail: newClient.email,
              serviceNeeded: newClient.service,
              status: 'New Web Lead',
              referralDate: new Date().toISOString(),
              referrerId: user.uid,
              referrerName: fullName,
          };
          setAllReferrals(prev => [optimisticDeal, ...prev]);
      }
    } catch (err: any) {
      toast.error('Failed to inject lead', err.message);
    } finally {
      setInjectingLead(false);
    }
  };

  const notifyParticipants = async (specificEmail: string | null, subject: string, htmlContent: string) => {
      try {
         const emails = new Set<string>();
         if (specificEmail) emails.add(specificEmail);
         else if (selectedDeal) {
             if (selectedDeal.referrerEmail) emails.add(selectedDeal.referrerEmail);
             if (selectedDeal.clientEmail && htmlContent.includes('Client Visible')) emails.add(selectedDeal.clientEmail);
             const agent = ecosystemPartners.find(p => p.uid === selectedDeal.assignedAgentId);
             if (agent && agent.email) emails.add(agent.email);
             if (selectedDeal.participants) { selectedDeal.participants.forEach((p: any) => { if (p.email) emails.add(p.email); }); }
         }
         const recipients = Array.from(emails).filter(e => e && e !== '');
         if (recipients.length === 0) return;
         // Server-side enqueue — /mail collection is denied to client
         // writes by design (Wave E). This endpoint proxies via admin SDK.
         await authedPost('/api/partner/notify', { recipients, subject, html: htmlContent });
      } catch (e) { console.warn("Email dispatch failed", e); }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !user) return;

    if (logType === 'route') {
      let routedName = 'Admin Triage';
      const previouslyUnassigned = selectedDeal.assignedAgentId === 'ADMIN_INBOX';
      if (targetPartnerId === user.uid) {
          routedName = fullName;
          await CRMService.routeLeadToPartner(selectedDeal.id, fullName, user.uid, fullName);
          if (previouslyUnassigned) {
              try { await CRMService.createTouchCadence(selectedDeal.id, selectedDeal.clientName, user.uid); } catch(e) {}
          }
      } else if (targetPartnerId === 'ADMIN_INBOX') {
          await CRMService.routeLeadToPartner(selectedDeal.id, fullName, 'ADMIN_INBOX', 'Admin Triage');
      } else {
         const partner = ecosystemPartners.find(p => p.uid === targetPartnerId);
         if (partner) {
             routedName = partner.displayName;
             await CRMService.routeLeadToPartner(selectedDeal.id, fullName, partner.uid, partner.displayName);
             if (previouslyUnassigned) {
                 try { await CRMService.createTouchCadence(selectedDeal.id, selectedDeal.clientName, partner.uid); } catch(e) {}
             }
             notifyParticipants(partner.email, `IndiBrick CRM: Lead Assigned To You`, `<p>You have been assigned ${selectedDeal.clientName} by ${fullName}. A 5-touch follow-up cadence has been scheduled in your calendar.</p>`);
         }
      }
      // Optimistic: patch the deal locally instead of reloading the whole
      // pipeline after a route change.
      const routedAgentId = targetPartnerId === user.uid ? user.uid : targetPartnerId;
      setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, assignedAgentId: routedAgentId, assignedAgentName: routedName } : r));
      setSelectedDeal(null); setTargetPartnerId('');

    } else if (logType === 'task') {
      const tempTask: Task = { id: `tmp-${Date.now()}`, referralId: selectedDeal.id, clientName: selectedDeal.clientName, assigneeId: user.uid, dueDate: taskDate, description: logInput, status: 'Pending' } as any;
      setAllTasks(prev => [...prev, tempTask]);
      await authedPost('/api/partner/tasks', { referralId: selectedDeal.id, clientName: selectedDeal.clientName, dueDate: taskDate, description: logInput, status: 'Pending' });
      setLogInput(''); setTaskDate('');

    } else {
      let isSystemMessage = false;
      let finalNoteContent = logInput;
      let newCallCount = selectedDeal.callCount || 0;

      if (logType === 'log_call') {
          isSystemMessage = true;
          finalNoteContent = `📞 LOGGED CALL: ${logInput}`;
          newCallCount = (selectedDeal.callCount || 0) + 1;
          await updateDoc(doc(db, "referrals", selectedDeal.id), { callCount: newCallCount });
      } else if (logType === 'note_internal') {
          isSystemMessage = true;
          finalNoteContent = `🔒 INTERNAL: ${logInput}`;
      } else if (logType === 'note_client') {
          isSystemMessage = false;
          finalNoteContent = `💬 CLIENT UPDATE: ${logInput}`;
      }

      const activity: ActivityLog = { type: 'note', author: fullName, content: finalNoteContent, timestamp: new Date().toISOString(), isSystemMessage };
      await CRMService.logActivity(selectedDeal.id, activity);
      notifyParticipants(null, `Deal Update: ${selectedDeal.clientName}`, `<p><strong>${fullName}</strong> added a new update:</p><p>${finalNoteContent}</p>`);

      // Optimistic: append to timeline + bump call count locally instead of a full pipeline reload
      const newTimeline = [...(selectedDeal.timeline || []), activity];
      setSelectedDeal((prev: any) => prev ? { ...prev, timeline: newTimeline, callCount: newCallCount } : prev);
      setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, timeline: newTimeline, callCount: newCallCount } : r));
      setLogInput('');

      // AI Copilot scans EVERY note (including internal) for implicit follow-up dates
      // — "call him Tuesday at 2", "follow up after the long weekend", "check in next Wed"
      // — and auto-creates a task. Internal notes are where agents most often park these.
      try {
          const res = await fetch('/api/ai-copilot', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referralId: selectedDeal.id, clientName: selectedDeal.clientName, assigneeId: user.uid, noteContent: finalNoteContent })
          });
          const data = await res.json();
          if (data.taskScheduled) {
              // Surface a toast so the agent can SEE that the AI caught it
              if (data.task) setAiTaskToast(data.task);
          }
          if (data.escalated) {
              // Fire the escalation flash. Save-the-deal task was already
              // added server-side; just flag the agent visually.
              setEscalationToast({ clientName: selectedDeal.clientName });
          }
          if (data.taskScheduled || data.escalated) {
              // Refresh tasks list only (not the whole pipeline)
              try {
                  const tRes = await authedGet('/api/partner/tasks');
                  if (tRes.ok) { const tData = await tRes.json(); setAllTasks(tData.tasks || []); }
              } catch (e) {}
          }
      } catch(err) { console.error("AI Copilot Error:", err); }
    }
  };

  // Auto-dismiss the AI task toast after a few seconds so it doesn't linger
  useEffect(() => {
      if (!aiTaskToast) return;
      const t = setTimeout(() => setAiTaskToast(null), 6000);
      return () => clearTimeout(t);
  }, [aiTaskToast]);

  // Escalation flash stays longer — 12s — because it's an action item the
  // agent needs to actually process, not just an "FYI".
  useEffect(() => {
      if (!escalationToast) return;
      const t = setTimeout(() => setEscalationToast(null), 12000);
      return () => clearTimeout(t);
  }, [escalationToast]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedDeal || !user) return;
    const prevStatus = selectedDeal.status;

    // Capture a reason on terminal lost statuses — critical for funnel analysis
    let lostReason: string | null = null;
    if (LOST_STATUSES.includes(newStatus) && !LOST_STATUSES.includes(prevStatus)) {
        const reason = window.prompt(`Why is this deal marked "${newStatus}"? (Bank approved cheaper, client ghosted, credit decline, etc.)`);
        if (reason === null) return; // User cancelled — abort the status change
        lostReason = reason.trim();
    }

    // Capture funded date on transition into a funded state
    const becameFunded = FUNDED_STATUSES.includes(newStatus) && !FUNDED_STATUSES.includes(prevStatus);

    await CRMService.updateReferralStatus(selectedDeal.id, newStatus, fullName);

    const patch: any = { stageEnteredAt: new Date().toISOString() };
    if (lostReason !== null) patch.lostReason = lostReason;
    if (becameFunded) patch.fundedAt = new Date().toISOString();
    await updateDoc(doc(db, "referrals", selectedDeal.id), patch);

    if (lostReason) {
        await CRMService.logActivity(selectedDeal.id, {
            type: 'system', author: 'System',
            content: `🛑 Lost Reason: ${lostReason}`,
            timestamp: new Date().toISOString(), isSystemMessage: true
        });
    }

    notifyParticipants(null, `Status Change: ${selectedDeal.clientName}`, `<p>Status updated to <strong>${newStatus}</strong> by ${fullName}.${lostReason ? ` Reason: ${lostReason}` : ''}</p>`);
    const updated = { ...selectedDeal, status: newStatus, ...patch };
    setSelectedDeal(updated);
    setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, ...updated } : r));
  };

  const handleTagUpdate = async (newTag: string) => {
    if (!selectedDeal || !user) return;
    await updateDoc(doc(db, "referrals", selectedDeal.id), { leadTag: newTag });
    setSelectedDeal({ ...selectedDeal, leadTag: newTag });
    setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, leadTag: newTag } : r));
  };

  // Referral source drives compensation: who (if anyone) gets paid out on this file.
  // The select value is either a partner UID (specific referral partner) or a generic label.
  const handleReferralSourceUpdate = async (value: string) => {
    if (!selectedDeal || !user) return;
    const partner = ecosystemPartners.find(p => p.uid === value);
    const patch = partner
      ? { referralSource: partner.displayName, referralPartnerId: partner.uid, referralPartnerName: partner.displayName }
      : { referralSource: value, referralPartnerId: '', referralPartnerName: '' };
    await updateDoc(doc(db, "referrals", selectedDeal.id), patch);
    setSelectedDeal({ ...selectedDeal, ...patch });
    setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, ...patch } : r));
  };

  // Admin-only: email the assigned agent (lead owner) a reminder to follow up with the client.
  const handleNudgeOwner = async () => {
    if (!selectedDeal) return;
    const owner = ecosystemPartners.find(p => p.uid === selectedDeal.assignedAgentId);
    if (selectedDeal.assignedAgentId === 'ADMIN_INBOX' || !owner?.email) {
      toast.warn('Route to an agent first', 'This lead has no assigned owner with an email on file.');
      return;
    }
    setNudgingOwner(true);
    try {
      await notifyParticipants(
        owner.email,
        `⏰ Follow-up needed: ${selectedDeal.clientName}`,
        `<p>Hi ${owner.displayName || 'there'},</p>
         <p><strong>${fullName}</strong> is asking you to follow up with <strong>${selectedDeal.clientName}</strong>${selectedDeal.serviceNeeded ? ` regarding their ${selectedDeal.serviceNeeded}` : ''}.</p>
         <p>Current stage: <strong>${selectedDeal.status}</strong>. Please reach out to the client and update the deal.</p>
         <p><a href="https://indibrick.ca/partner/login" style="color:#2563eb;font-weight:bold;">Open the CRM →</a></p>`
      );
      const entry = { type: 'system', author: fullName, content: `📧 Reminder emailed to ${owner.displayName} to follow up with the client.`, timestamp: new Date().toISOString(), isSystemMessage: true };
      await CRMService.logActivity(selectedDeal.id, entry as any);
      setSelectedDeal((prev: any) => prev ? { ...prev, timeline: [...(prev.timeline || []), entry] } : prev);
      toast.success('Reminder sent', `Emailed to ${owner.displayName}.`);
    } catch (e) {
      toast.error('Could not send the reminder', 'Please try again.');
    } finally {
      setNudgingOwner(false);
    }
  };

  const handleCategoryUpdate = async (newCategory: 'active' | 'potential') => {
    if (!selectedDeal || !user) return;
    await updateDoc(doc(db, "referrals", selectedDeal.id), { dealCategory: newCategory });

    if (newCategory === 'active' && selectedDeal.clientEmail) {
       if (window.confirm("Deal marked as Active! Would you like to automatically generate a Client Portal account and email them their secure login credentials?")) {
           try {
               const res = await authedPost('/api/partner/onboard-client', {
                   leadId: selectedDeal.id, clientEmail: selectedDeal.clientEmail, clientName: selectedDeal.clientName, agentName: fullName, notes: selectedDeal.notes, requiredDocs: selectedDeal.requiredDocuments || []
               });
               if (res.ok) toast.success('Client account created', 'Welcome email sent.');
               else toast.error('Failed to send welcome email.');
           } catch (e) { toast.error('Network error', 'Could not reach server.'); }
       }
    } else if (newCategory === 'active' && !selectedDeal.clientEmail) {
       toast.info('Deal marked Active', 'No email on file — client portal not auto-generated.');
    }

    setSelectedDeal({ ...selectedDeal, dealCategory: newCategory });
    setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, dealCategory: newCategory } : r));
  };

  const handleEditClientSave = async () => {
     if (!selectedDeal) return;
     const clientPhone = toStoredPhone(editClientForm.phone);
     await updateDoc(doc(db, "referrals", selectedDeal.id), { clientName: editClientForm.name, clientPhone, clientEmail: editClientForm.email });
     const patch = { clientName: editClientForm.name, clientPhone, clientEmail: editClientForm.email };
     setSelectedDeal({...selectedDeal, ...patch});
     setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, ...patch } : r));
     setIsEditingClient(false);
  };

  const handleSaveSummary = async () => {
     if (!selectedDeal) return;
     await updateDoc(doc(db, "referrals", selectedDeal.id), { dealSummary: editSummaryText });
     setSelectedDeal({...selectedDeal, dealSummary: editSummaryText});
     setIsEditingSummary(false);
     setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, dealSummary: editSummaryText } : r));
  };

  const handleDealValueSave = async (loanAmount: number, expectedCommission: number) => {
     if (!selectedDeal) return;
     await updateDoc(doc(db, "referrals", selectedDeal.id), { loanAmount, expectedCommission });
     setSelectedDeal({...selectedDeal, loanAmount, expectedCommission });
     setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, loanAmount, expectedCommission } : r));
  };

  const handleAddParticipant = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pUid = e.target.value;
      if (!pUid || !selectedDeal) return;
      const partner = ecosystemPartners.find(p => p.uid === pUid);
      if (!partner) return;

      const newParticipant = { uid: partner.uid, name: partner.displayName, role: partner.role || 'Partner', email: partner.email };
      // participantIds (flat UIDs) is what getPartnerDashboard queries via array-contains so the
      // collaborator can actually see + update the deal; participants keeps the richer display objects.
      await updateDoc(doc(db, "referrals", selectedDeal.id), {
          participants: arrayUnion(newParticipant),
          participantIds: arrayUnion(partner.uid),
      });
      const updatedParticipants = [...(selectedDeal.participants || []), newParticipant];
      const updatedParticipantIds = Array.from(new Set([...(selectedDeal.participantIds || []), partner.uid]));
      setSelectedDeal({...selectedDeal, participants: updatedParticipants, participantIds: updatedParticipantIds});
      setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, participants: updatedParticipants, participantIds: updatedParticipantIds } : r));
      notifyParticipants(partner.email, `IndiBrick CRM: Added to Deal Team`, `<p>You have been added to the deal team for <strong>${selectedDeal.clientName}</strong>.</p>`);
      e.target.value = "";
  };

  // Admin-only: remove a collaborator from the deal team (drops them from both arrays).
  const handleRemoveParticipant = async (participant: any) => {
      if (!selectedDeal) return;
      const updatedParticipants = (selectedDeal.participants || []).filter((p: any) => p.uid !== participant.uid);
      const updatedParticipantIds = (selectedDeal.participantIds || []).filter((id: string) => id !== participant.uid);
      await updateDoc(doc(db, "referrals", selectedDeal.id), { participants: updatedParticipants, participantIds: updatedParticipantIds });
      setSelectedDeal({ ...selectedDeal, participants: updatedParticipants, participantIds: updatedParticipantIds });
      setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, participants: updatedParticipants, participantIds: updatedParticipantIds } : r));
  };

  const handleCompleteTask = async (taskId: string) => {
      // Optimistic local update; skip full pipeline reload
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
      await authedPut('/api/partner/tasks', { taskId });
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this lead?")) {
      await CRMService.deleteReferral(id);
      setSelectedDeal(null);
      // Optimistic: drop the deal from local state instead of reloading.
      setAllReferrals(prev => prev.filter(r => r.id !== id));
    }
  };

  // useCallback so the function reference is stable across renders. Without
  // this, every keystroke in the open deal modal would hand each DealListCard
  // a new onOpen prop and defeat React.memo.
  const handleOpenDealModal = useCallback(async (deal: any) => {
      setSelectedDeal(deal);
      // Default to Log Call: it's the highest-leverage action and the only one that advances the touch-SLA counter
      setLogType('log_call');
      setEditClientForm({ name: deal.clientName, phone: deal.clientPhone, email: deal.clientEmail });
      setEditSummaryText(deal.dealSummary || '');
      try {
          const res = await fetch(`/api/client/portal-data?leadId=${deal.leadId || deal.id}`);
          if (res.ok) {
              const freshData = await res.json();
              setSelectedDeal(prev => prev?.id === deal.id ? { ...prev, vault: freshData.vault } : prev);
          }
      } catch(e) {}
  }, []);

  const handleDownloadVaultDoc = async (vDoc: any) => {
      if (vDoc?.downloadUrl) { window.open(vDoc.downloadUrl, '_blank', 'noopener,noreferrer'); return; }
      if (!selectedDeal) return;
      try {
          const res = await fetch(`/api/client/portal-data?leadId=${selectedDeal.leadId || selectedDeal.id}`);
          if (!res.ok) throw new Error('Could not generate download link');
          const fresh = await res.json();
          const match = (fresh.vault || []).find((v: any) => v.storagePath === vDoc.storagePath);
          if (match?.downloadUrl) {
              setSelectedDeal((prev: any) => prev ? { ...prev, vault: fresh.vault } : prev);
              window.open(match.downloadUrl, '_blank', 'noopener,noreferrer');
          } else {
              toast.warn('Document not yet available', 'Please try again in a moment.');
          }
      } catch(e: any) {
          toast.error('Could not load document', e.message);
      }
  };

  const handleOpenTaskDeal = (referralId: string) => {
    if (referralId === 'general') return;
    const found = allReferrals.find(d => d.id === referralId);
    if (found) handleOpenDealModal(found); 
  };

  // AI Intake handlers are now inside components/partner/IntakeWizard.
  // See <IntakeWizard onSaved={...}/> at the bottom of the render for the
  // parent-side wiring (optimistic patch on save).

  const getSLAHealth = (deal: any) => {
     const hoursSinceCreation = (Date.now() - new Date(deal.referralDate || Date.now()).getTime()) / (1000 * 60 * 60);
     const callCount = deal.callCount || 0;
     const callSLA = callCount > 0 ? 'passed' : (hoursSinceCreation > 12 ? 'breached' : 'pending');
     const isSubmitted = ['Underwriting', 'Approved', 'Funded', 'Firm Sale', 'Firm / Conditional'].includes(deal.status);
     const subSLA = isSubmitted ? 'passed' : (hoursSinceCreation > 48 ? 'breached' : 'pending');
     return { callCount, callSLA, subSLA, hoursSinceCreation };
  };

  const getStageProgress = (status: string) => {
      const index = PIPELINE_STAGES.indexOf(status);
      if (status === 'Declined' || status === 'Lost' || status === 'Cancelled') return 100;
      return index === -1 ? 10 : Math.max(10, (index / (PIPELINE_STAGES.length - 1)) * 100);
  };

  // Days the deal has been sitting in its current pipeline stage (falls back to referralDate for legacy deals)
  const getDaysInStage = (deal: any) => {
      const since = deal.stageEnteredAt || deal.referralDate;
      if (!since) return 0;
      return Math.floor((Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24));
  };

  const publishToBorrowDirect = async () => {
     if(!bdForm.loanAmount || !bdForm.ltv || !bdForm.aiSummary) { toast.warn('Fill all fields and provide a summary.'); return; }
     setIsPublishing(true);
     try {
        const payload = { referralId: selectedDeal.id, loanAmount: Number(bdForm.loanAmount), ltv: Number(bdForm.ltv), position: bdForm.position, propertyType: bdForm.propertyType, location: bdForm.location || 'Ontario', aiSummary: bdForm.aiSummary, status: 'Live', createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, 'borrow_direct_deals'), payload);
        setBdDeal({ id: docRef.id, ...payload });
        await CRMService.logActivity(selectedDeal.id, { type: 'note', author: 'System Admin', content: `🛡️ Pushed to BorrowDirect Marketplace (Loan: $${payload.loanAmount}, LTV: ${payload.ltv}%)`, timestamp: new Date().toISOString() });
     } catch (err) { toast.error('Failed to publish to marketplace.'); } finally { setIsPublishing(false); }
  };

  // All derived pipeline data — filteredDeals, pipelineStats, tasksByDate/
  // ByReferralId, dealsByStage, dealMeta — is produced by one hook so the
  // memo chain lives in one place. See hooks/useCRMData.ts for the shapes.
  const {
    deferredSearch,
    filteredDeals,
    pipelineStats,
    tasksByDate,
    tasksByReferralId,
    dealsByStage,
    dealMeta,
  } = useCRMData({
    allReferrals,
    allTasks,
    pipelineView,
    filterAssignee,
    filterTag,
    filterStatus,
    filterReferralSource,
    sortOrder,
    searchQuery,
    partnerRole,
    currentUid: user?.uid,
    pipelineStages: PIPELINE_STAGES,
    onFilterChange: () => setVisibleCount(PAGE_SIZE),
  });

  if (loading || dataLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  const todaysTasks = (tasksByDate.get(todayDateString) || []).filter(t => t.status !== 'Completed');

  // One Twilio device for the whole portal. Registering per component
  // would make a single inbound call ring the same agent several
  // times, each refreshing its own token.
  return (
    <BrowserPhoneProvider>
      <IncomingCall />
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 pb-20 md:pb-0 pt-24">
      <style dangerouslySetInnerHTML={{__html: PORTAL_CHROME_HIDER}} />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#0B0F19] text-white flex-col fixed h-[calc(100vh-6rem)] top-24 z-20 shadow-2xl">
        <div className="p-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
             <Zap size={20} className="text-white"/>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter">IndiBrick OS</h2>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Enterprise Engine</p>
        </div>
        <nav className="portal-nav space-y-1 px-4 flex-1">
          <button onClick={() => setActiveTab('pipeline')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'pipeline' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Briefcase size={16} /> Pipeline</button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BarChartIcon size={16} /> Reports</button>
          {/* Cross-Sell dashboard is aggregation of pushed-deal flags —
              realtors don't need this; they're the SOURCE of flags,
              not consumers. Sales Coach: don't try to be Broker Wolf. */}
          {partnerRole !== 'partner_realtor' && (
            <button onClick={() => setActiveTab('cross-sell')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'cross-sell' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><TrendingUp size={16} /> Cross-Sell</button>
          )}
          {/* Insurance panel — visible to insurance agents + admins. */}
          {INSURANCE_ROLE_ENABLED && (partnerRole === 'partner_insurance' || partnerRole === 'admin') && (
            <button onClick={() => setActiveTab('insurance')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'insurance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><ShieldIcon size={16} /> Insurance</button>
          )}
          {/* Automations — admin-only in Wave 2. */}
          {partnerRole === 'admin' && (
            <button onClick={() => setActiveTab('automations')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'automations' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><ZapIcon size={16} /> Automations</button>
          )}
          {/* Managed Ads — admin-only. Client roster + attribution reports. */}
          {partnerRole === 'admin' && (
            <button onClick={() => setActiveTab('managed-ads')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'managed-ads' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><DollarIcon size={16} /> Managed Ads</button>
          )}
          <button onClick={() => setActiveTab('analyzer')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'analyzer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BrainCircuit size={16} /> Deal Analyzer</button>
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Calendar size={16} /> Schedule</button>
          {/* Wave I-1: sender identity + Managed Ads self-view + data
              export live here. Available to everyone — the settings a
              partner owns for themselves, distinct from admin-scoped
              config that hangs off Automations / Managed Ads tabs. */}
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><SettingsIcon size={16} /> Settings</button>
        </nav>
        <div className="p-6 border-t border-slate-800"><button onClick={logout} className="w-full flex items-center gap-3 text-xs font-bold uppercase text-slate-500 hover:text-red-400 transition"><LogOut size={14}/> Sign Out</button></div>
      </aside>

      {/* MOBILE NAV */}
      <nav className="portal-nav md:hidden fixed bottom-0 left-0 w-full bg-[#0B0F19] text-slate-400 z-40 flex justify-between items-center px-6 py-3 pb-safe border-t border-slate-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
         <button onClick={() => setActiveTab('pipeline')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'pipeline' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><Briefcase size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Deals</span></button>
         <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'reports' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><BarChartIcon size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Reports</span></button>
         {partnerRole !== 'partner_realtor' && (
           <button onClick={() => setActiveTab('cross-sell')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'cross-sell' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><TrendingUp size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Flags</span></button>
         )}
         {INSURANCE_ROLE_ENABLED && (partnerRole === 'partner_insurance' || partnerRole === 'admin') && (
           <button onClick={() => setActiveTab('insurance')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'insurance' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><ShieldIcon size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Insurance</span></button>
         )}
         <button onClick={() => setActiveTab('analyzer')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'analyzer' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><BrainCircuit size={20} /><span className="text-[9px] font-black uppercase tracking-widest">AI</span></button>
         <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'calendar' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><Calendar size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Tasks</span></button>
         <button onClick={logout} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-red-400 transition"><LogOut size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Exit</span></button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="md:ml-64 flex-1 p-4 md:p-10 overflow-x-hidden">
        
        <header className="portal-header flex flex-row justify-between items-center mb-6 md:mb-8 gap-4">
           <div>
             <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
               {activeTab === 'pipeline' ? 'Command Center'
                 : activeTab === 'reports' ? 'Reports'
                 : activeTab === 'cross-sell' ? 'Cross-Sell Opportunities'
                 : activeTab === 'insurance' ? 'Insurance Desk'
                 : activeTab === 'automations' ? 'Automations'
                 : activeTab === 'managed-ads' ? 'Managed Ads'
                 : activeTab === 'settings' ? 'Settings'
                 : activeTab === 'analyzer' ? 'AI Underwriter'
                 : 'Calendar'}
             </h1>
             <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 hidden sm:block">
               {activeTab === 'pipeline' ? 'Enterprise pipeline and SLA tracking.'
                 : activeTab === 'reports' ? 'Production, funnel, and speed-to-lead trends.'
                 : activeTab === 'cross-sell' ? (partnerRole === 'admin' ? 'All open cross-sell flags across the team.' : 'Cross-sell opportunities from your realtor deals.')
                 : activeTab === 'insurance' ? 'Claim mortgage-funding insurance leads and manage your book.'
                 : activeTab === 'automations' ? 'Build workflows that fire when your CRM data changes.'
                 : activeTab === 'managed-ads' ? 'Client roster + attribution reports for the paid-ads service tier.'
                 : activeTab === 'settings' ? 'Your sender identity, Managed Ads report, and data export.'
                 : activeTab === 'analyzer' ? 'Instant scenario qualification and structuring.'
                 : 'Manage AI-generated follow-ups and deadlines.'}
             </p>
           </div>
           
           <div className="flex items-center gap-2 shrink-0">
             {/* Rules-engine inbox: live-subscribes to /notifications for
                 the current uid. Empty when no rules have fired for you. */}
             <InAppInbox
               currentUid={user?.uid}
               onOpenDeal={(referralId) => handleOpenDealModal({ id: referralId })}
             />
             <button
               onClick={() => setShowSearch(true)}
               title="Search deals + jump to any tab (Cmd/Ctrl + K)"
               className="hidden md:inline-flex bg-white border border-gray-200 hover:border-slate-900 text-slate-500 hover:text-slate-900 px-3 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition items-center gap-2 shadow-sm"
             >
               <CommandIcon size={12} /> K
             </button>
             <button
               onClick={() => setShowCsvImport(true)}
               title="Import your existing book from a CSV export"
               className="hidden md:inline-flex bg-white border border-gray-200 hover:border-slate-900 text-slate-900 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition items-center gap-2 shadow-sm"
             >
               <UploadIcon size={14} /> Import CSV
             </button>
             <button onClick={() => { setNewClient({ name: '', phone: '', email: '', service: 'General Inquiry', message: '', assignedTo: partnerRole === 'admin' ? 'ADMIN_INBOX' : (user?.uid || ''), referralSource: 'Self-Generated' }); setShowNewReferralForm(true); }} className="bg-slate-900 text-white px-4 py-3 md:px-5 md:py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5">
                <Plus size={16} /> <span className="hidden md:inline">Inject Lead</span><span className="md:hidden">Add</span>
             </button>
           </div>
        </header>

        {showCsvImport && (
          <CsvImportModal
            onClose={() => setShowCsvImport(false)}
            onImported={() => {
              // Reload the pipeline so newly-imported rows appear.
              loadProfileAndData();
            }}
          />
        )}

        {showStagesEditor && (
          <PipelineStagesModal
            onClose={() => setShowStagesEditor(false)}
            initial={customStages}
            defaults={roleDefaultStages}
            onSaved={(next) => setCustomStages(next)}
          />
        )}

        {showCustomFieldsEditor && (
          <CustomFieldsModal
            onClose={() => setShowCustomFieldsEditor(false)}
            initial={customDealFields}
            onSaved={(next) => setCustomDealFields(next)}
          />
        )}

        {showOnboarding === true && (
          <OnboardingWizard
            displayName={fullName || 'Partner'}
            role={partnerRole}
            defaultStages={roleDefaultStages}
            onDismiss={() => setShowOnboarding(false)}
            onOpenCsvImport={() => setShowCsvImport(true)}
            onStagesSaved={(next) => setCustomStages(next)}
          />
        )}

        {bulkMode && selectedIds.size > 0 && (
          <BulkActionBar
            selectedIds={Array.from(selectedIds)}
            onClear={clearBulk}
            onDone={() => loadProfileAndData()}
            assignableUsers={[
              ...(user ? [{ uid: user.uid, name: fullName || 'Me' }] : []),
              ...ecosystemPartners.filter(p => p.uid && p.uid !== user?.uid).map(p => ({ uid: p.uid as string, name: (p.displayName || p.email || p.uid) as string })),
            ]}
          />
        )}

        {/* Global search — searches the in-memory pipeline (no extra
            Firestore reads) + navigational shortcuts. Cmd/Ctrl + K
            from anywhere in the CRM opens it. */}
        <SearchPalette
          open={showSearch}
          onClose={() => setShowSearch(false)}
          deals={allReferrals}
          canSeeCrossSell={partnerRole !== 'partner_realtor'}
          canSeeInsurance={INSURANCE_ROLE_ENABLED && (partnerRole === 'partner_insurance' || partnerRole === 'admin')}
          canSeeAutomations={partnerRole === 'admin'}
          onOpenDeal={(referralId) => {
            setActiveTab('pipeline');
            handleOpenDealModal({ id: referralId });
          }}
          onNavigate={(target) => setActiveTab(target)}
        />

        {/* --- TAB: REPORTS --- */}
        {activeTab === 'reports' && (
          <div className="max-w-6xl mx-auto">
            <ReportsPanel allReferrals={allReferrals} currentUid={user?.uid} />
          </div>
        )}

        {/* --- TAB: CROSS-SELL --- (hidden from realtors) */}
        {activeTab === 'cross-sell' && partnerRole !== 'partner_realtor' && (
          <div className="max-w-6xl mx-auto">
            <CrossSellPanel
              currentUid={user?.uid}
              isAdmin={partnerRole === 'admin'}
              onOpenDeal={(referralId) => {
                setActiveTab('pipeline');
                handleOpenDealModal({ id: referralId });
              }}
            />
          </div>
        )}

        {/* --- TAB: INSURANCE --- (insurance agents + admins) */}
        {activeTab === 'insurance' && INSURANCE_ROLE_ENABLED && (partnerRole === 'partner_insurance' || partnerRole === 'admin') && (
          <div className="max-w-6xl mx-auto">
            <InsurancePanel
              currentUid={user?.uid}
              onOpenDeal={(referralId) => {
                setActiveTab('pipeline');
                handleOpenDealModal({ id: referralId });
              }}
            />
          </div>
        )}

        {/* --- TAB: MANAGED ADS --- (admin only) */}
        {activeTab === 'managed-ads' && partnerRole === 'admin' && (
          <div className="max-w-6xl mx-auto">
            <ManagedAdsPanel currentUid={user?.uid} />
          </div>
        )}

        {/* --- TAB: AUTOMATIONS --- (admins only) */}
        {activeTab === 'automations' && (
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Sub-tab strip: Workflows | Forms. Both live under
                Automations because they're two sides of the same coin —
                forms capture; workflows react to what's captured. */}
            <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1">
              <button onClick={() => setAutomationsView('workflows')}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition ${automationsView === 'workflows' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                Workflows
              </button>
              <button onClick={() => setAutomationsView('forms')}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition ${automationsView === 'forms' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                Forms
              </button>
              <button onClick={() => setAutomationsView('campaigns')}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition ${automationsView === 'campaigns' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                Campaigns
              </button>
              <button onClick={() => setAutomationsView('drips')}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition ${automationsView === 'drips' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                Drips
              </button>
            </div>
            {automationsView === 'workflows'
              ? <WorkflowsPanel isAdmin={partnerRole === 'admin'} />
              : automationsView === 'forms'
              ? <FormsPanel isAdmin={partnerRole === 'admin'} />
              : automationsView === 'campaigns'
              ? <CampaignsPanel currentUid={user?.uid} displayName={fullName || 'IndiBrick Partner'} />
              : <DripsPanel currentUid={user?.uid} referrals={allReferrals} />}
          </div>
        )}

        {/* --- TAB: SETTINGS (Wave I-1) --- */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <section className="bg-white p-6 rounded-2xl border border-gray-200">
              <SenderIdentityEditor/>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-gray-200">
              <TeamCard/>
            </section>

            {/* Team performance report — renders nothing for non-owners. */}
            <section className="bg-white p-6 rounded-2xl border border-gray-200">
              <TeamReportPanel/>
            </section>

            {/* Managed Ads self-view — renders an upsell for partners
                without a profile; renders the full attribution report
                for partners on the service tier. */}
            <section className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="text-base font-semibold text-neutral-900 mb-3">Your Managed Ads report</h3>
              <MyAdsPanel uid={user?.uid || null}/>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="text-base font-semibold text-neutral-900">Export your data</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-lg">
                Download every contact, deal, message, and task on your account.
                Your data is yours — take it with you any time.
              </p>
              <div className="mt-4"><ExportButtons/></div>
            </section>
          </div>
        )}

        {/* --- TAB: CALENDAR --- */}
        {activeTab === 'calendar' && (
           <div className="animate-fade-in-up max-w-6xl mx-auto space-y-4 md:space-y-6">
              <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={20}/></button>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 w-32 md:w-48 text-center">{monthNames[currentMonth]} {currentYear}</h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={20}/></button>
                 </div>
                 
                 <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
                     {calendarConnected && (
                       <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1.5 md:mr-2">
                         <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                         Google Calendar{calendarEmail ? ` · ${calendarEmail}` : ''}
                         <button onClick={handleGoogleDisconnect} className="ml-2 text-gray-400 hover:text-red-500 underline">disconnect</button>
                       </div>
                     )}
                     <div className="flex gap-2 w-full md:w-auto">
                     <button onClick={() => setShowNewTaskForm(true)} className="flex-1 md:flex-none bg-slate-900 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-sm">
                        <Plus size={14}/> Add
                     </button>
                     <button onClick={handleGoogleSync} disabled={isSyncingGoogle} className="flex-1 md:flex-none bg-white border border-gray-200 text-slate-700 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:border-blue-400 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                        {isSyncingGoogle ? <Loader2 size={14} className="animate-spin"/> : <Calendar size={14}/>}
                        {isSyncingGoogle
                          ? (calendarConnected ? 'Syncing...' : 'Redirecting...')
                          : (calendarConnected ? 'Sync Now' : 'Connect Google Calendar')}
                     </button>
                     </div>
                 </div>
              </div>

              <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                       <div key={day} className="py-2 md:py-3 text-center text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{day.substring(0,3)}</div>
                    ))}
                 </div>
                 <div className="grid grid-cols-7 bg-gray-100 gap-px">
                    {calendarBlanks.map(blank => <div key={`blank-${blank}`} className="bg-white min-h-[80px] md:min-h-[120px]"></div>)}
                    {calendarDays.map(day => {
                       const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                       const dayTasks = tasksByDate.get(dateStr) || [];
                       const isToday = todayDateString === dateStr;

                       return (
                          <div key={day} className="bg-white min-h-[80px] md:min-h-[120px] p-1.5 md:p-2 transition hover:bg-gray-50">
                             <div className={`w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-[10px] md:text-xs font-bold mb-1 md:mb-2 ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600'}`}>
                                {day}
                             </div>
                             <div className="space-y-1">
                                {dayTasks.map(task => (
                                   <div key={task.id} onClick={() => { 
                                       if(task.referralId !== 'general'){
                                           setActiveTab('pipeline'); 
                                           handleOpenTaskDeal(task.referralId); 
                                       }
                                   }} className={`p-1 md:p-1.5 rounded-md transition ${task.referralId !== 'general' ? 'cursor-pointer hover:bg-blue-100 hover:shadow-sm' : ''} ${task.status === 'Completed' ? 'bg-gray-50 border border-gray-100 text-gray-400 line-through' : 'bg-blue-50 border border-blue-100 text-blue-800'}`}>
                                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest truncate">{task.clientName}</p>
                                      <p className="text-[9px] md:text-[10px] font-medium truncate leading-tight hidden md:block mt-0.5">{task.description}</p>
                                   </div>
                                ))}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        )}

        {/* --- TAB: AI DEAL ANALYZER --- */}
        {activeTab === 'analyzer' && (
           <div className="animate-fade-in-up max-w-5xl mx-auto">
              <div className="bg-slate-900 text-white rounded-[2rem] p-6 md:p-8 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
                 
                 <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
                    <div className="w-full lg:w-1/2">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2 flex items-center gap-2 md:gap-3">
                           <BrainCircuit className="text-blue-400" size={24} /> Deal Analyzer
                        </h2>
                        <p className="text-gray-400 text-[10px] md:text-xs mb-6 leading-relaxed">
                           Instantly verify if your client qualifies before writing an offer. AI references our live brokerage guidelines and B-20 rules.
                        </p>
                        
                        <form onSubmit={handleAnalyzeDeal} className="space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Income ($)</label>
                                  <input required type="number" placeholder="120000" value={analyzerForm.income} onChange={e=>setAnalyzerForm({...analyzerForm, income: e.target.value})} className="w-full bg-white/10 border border-white/10 p-3 rounded-xl text-white font-bold text-sm outline-none focus:border-blue-500 transition" />
                              </div>
                              <div>
                                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Down Pmt ($)</label>
                                  <input required type="number" placeholder="50000" value={analyzerForm.downPayment} onChange={e=>setAnalyzerForm({...analyzerForm, downPayment: e.target.value})} className="w-full bg-white/10 border border-white/10 p-3 rounded-xl text-white font-bold text-sm outline-none focus:border-blue-500 transition" />
                              </div>
                              <div>
                                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Property Value ($)</label>
                                  <input required type="number" placeholder="600000" value={analyzerForm.propertyValue} onChange={e=>setAnalyzerForm({...analyzerForm, propertyValue: e.target.value})} className="w-full bg-white/10 border border-white/10 p-3 rounded-xl text-white font-bold text-sm outline-none focus:border-blue-500 transition" />
                              </div>
                              <div>
                                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Credit Score</label>
                                  <input required type="number" placeholder="680" value={analyzerForm.creditScore} onChange={e=>setAnalyzerForm({...analyzerForm, creditScore: e.target.value})} className="w-full bg-white/10 border border-white/10 p-3 rounded-xl text-white font-bold text-sm outline-none focus:border-blue-500 transition" />
                              </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Monthly Debts ($)</label>
                              <input type="number" placeholder="450" value={analyzerForm.debts} onChange={e=>setAnalyzerForm({...analyzerForm, debts: e.target.value})} className="w-full bg-white/10 border border-white/10 p-3 rounded-xl text-white font-bold text-sm outline-none focus:border-blue-500 transition" />
                           </div>
                           <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Context (Optional)</label>
                              <textarea rows={2} placeholder="Self-employed, open to B-Lenders." value={analyzerForm.notes} onChange={e=>setAnalyzerForm({...analyzerForm, notes: e.target.value})} className="w-full bg-white/10 border border-white/10 p-3 rounded-xl text-white font-bold text-sm outline-none focus:border-blue-500 transition resize-none" />
                           </div>

                           <button disabled={analyzerStatus === 'loading'} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg mt-2">
                              {analyzerStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                              {analyzerStatus === 'loading' ? 'Underwriting File...' : 'Run Scenario'}
                           </button>
                        </form>
                    </div>

                    {/* The Results Panel */}
                    <div className="w-full lg:w-1/2 h-full flex flex-col">
                       {analyzerStatus === 'idle' && (
                          <div className="flex-1 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center p-8 opacity-50 min-h-[250px]">
                             <Target size={40} className="mb-3 text-blue-400"/>
                             <p className="font-bold text-sm">Awaiting Scenario</p>
                             <p className="text-[10px]">Enter client details to generate ratios.</p>
                          </div>
                       )}

                       {analyzerResult && (
                          <div className="flex-1 bg-white text-slate-900 rounded-[2rem] p-5 shadow-xl animate-fade-in flex flex-col">
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                 <div className="bg-gray-50 rounded-xl p-3 flex flex-col justify-center items-center text-center border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">GDS Ratio</p>
                                    <p className="text-lg md:text-xl font-black text-slate-900">{analyzerResult.gds}</p>
                                 </div>
                                 <div className="bg-gray-50 rounded-xl p-3 flex flex-col justify-center items-center text-center border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">TDS Ratio</p>
                                    <p className="text-lg md:text-xl font-black text-slate-900">{analyzerResult.tds}</p>
                                 </div>
                              </div>

                              <div className="mb-4 flex-1">
                                 <h3 className="font-black uppercase tracking-tight text-[10px] text-gray-400 mb-2 flex items-center gap-2"><ShieldCheck size={12}/> Underwriter Analysis</h3>
                                 <p className="text-slate-700 text-[11px] md:text-xs leading-relaxed font-medium">
                                    {analyzerResult.analysis}
                                 </p>
                              </div>

                              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                 <h3 className="font-black uppercase tracking-tight text-[10px] text-blue-800 mb-2 flex items-center gap-2"><CheckCircle size={12}/> Action Plan</h3>
                                 <ul className="space-y-1.5">
                                    {analyzerResult.actionPlan.map((step: string, i: number) => (
                                       <li key={i} className="flex items-start gap-2 text-[9px] md:text-[10px] text-blue-900 font-medium">
                                          <span className="font-black">{i+1}.</span> {step}
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- TAB: PIPELINE --- */}
        {activeTab === 'pipeline' && (
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">

              {/* Cold dialler — mortgage agents and admins only. Dial a
                  number that is not in the CRM, then decide afterwards
                  whether it is worth keeping. The API enforces the same
                  role rule, so hiding this is convenience, not control. */}
              {(partnerRole === 'partner_mortgage' || partnerRole === 'admin') && (
                <div className="xl:col-span-12">
                  {/* The agent types their handset once inside the
                      dialler; there is no stored number on this page to
                      seed it from. A converted lead is prepended
                      optimistically rather than refetching the pipeline. */}
                  <ColdDialer
                    onConverted={(referralId) => {
                      setAllReferrals(prev => prev.some((r: any) => r.id === referralId)
                        ? prev
                        : [{ id: referralId, clientName: 'New cold-call lead', status: 'New Web Lead', assignedAgentId: user?.uid }, ...prev]);
                    }}
                  />
                </div>
              )}

              {/* Cold dialler — mortgage agents and admins. The API
                  enforces the same rule, so hiding it is convenience. */}
              {(partnerRole === 'partner_mortgage' || partnerRole === 'admin') && (
                <div className="xl:col-span-12">
                  <ColdDialer
                    onConverted={(referralId) => {
                      setAllReferrals(prev => prev.some((r: any) => r.id === referralId)
                        ? prev
                        : [{ id: referralId, clientName: 'New cold-call lead', status: 'New Web Lead', assignedAgentId: user?.uid }, ...prev]);
                    }}
                  />
                </div>
              )}

              {/* PIPELINE REVENUE STRIP (top, full-width). Admins get an
                  extra Speed-to-Lead tile — rolling 14-day median from
                  lead-created to first logged call. */}
              <div className={`xl:col-span-12 grid grid-cols-2 gap-3 md:gap-4 ${partnerRole === 'admin' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1 text-blue-600"><Activity size={12}/><span className="text-[9px] font-black uppercase tracking-widest">Active Pipeline</span></div>
                      <p className="text-2xl font-black tracking-tighter text-slate-900">{formatCurrency(pipelineStats.activeValue)}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">{pipelineStats.activeCount} live deals</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1 text-green-600"><CheckCircle size={12}/><span className="text-[9px] font-black uppercase tracking-widest">Funded YTD</span></div>
                      <p className="text-2xl font-black tracking-tighter text-slate-900">{formatCurrency(pipelineStats.fundedValueYTD)}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">{pipelineStats.fundedCount} closed</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1 text-purple-600"><Wallet size={12}/><span className="text-[9px] font-black uppercase tracking-widest">Inflight Commission</span></div>
                      <p className="text-2xl font-black tracking-tighter text-slate-900">{formatCurrency(pipelineStats.inflightCommission)}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">Expected if all fund</p>
                  </div>
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/20 rounded-full blur-2xl"></div>
                      <div className="relative">
                          <div className="flex items-center gap-2 mb-1 text-green-400"><Star size={12}/><span className="text-[9px] font-black uppercase tracking-widest">Commission YTD</span></div>
                          <p className="text-2xl font-black tracking-tighter">{formatCurrency(pipelineStats.fundedCommissionYTD)}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">Avg deal: {formatCurrency(pipelineStats.avgDeal)}</p>
                      </div>
                  </div>
                  {/* Admin-only: Speed-to-Lead. Green ≤2h, amber ≤6h, red slower.
                      Anchor value is the median; subtitle exposes the sample size and
                      how many recent leads still have no logged call at all. */}
                  {partnerRole === 'admin' && (() => {
                      const m = pipelineStats.speedToLeadMedianHrs;
                      const hasData = m !== null && pipelineStats.speedToLeadSampleSize > 0;
                      const band = !hasData ? 'gray' : m! <= 2 ? 'green' : m! <= 6 ? 'amber' : 'red';
                      const dot = band === 'green' ? 'text-emerald-600' : band === 'amber' ? 'text-amber-600' : band === 'red' ? 'text-red-600' : 'text-gray-400';
                      const displayValue = !hasData
                          ? '—'
                          : m! < 1 ? `${Math.round(m! * 60)}m`
                          : m! < 24 ? `${m!.toFixed(1)}h`
                          : `${(m! / 24).toFixed(1)}d`;
                      return (
                          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm" title="Median hours from lead created → first logged call (rolling 14 days)">
                              <div className={`flex items-center gap-2 mb-1 ${dot}`}><Zap size={12}/><span className="text-[9px] font-black uppercase tracking-widest">Speed to Lead</span></div>
                              <p className="text-2xl font-black tracking-tighter text-slate-900">{displayValue}</p>
                              <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                                  {hasData
                                      ? `Median · ${pipelineStats.speedToLeadSampleSize}/${pipelineStats.speedToLeadCoveredCount} called · 14d`
                                      : `No calls logged in trailing 14d`}
                              </p>
                          </div>
                      );
                  })()}
              </div>

              {/* LEFT: PIPELINE BOARD */}
              <div className="xl:col-span-8 space-y-4 md:space-y-6">

                 {/* CONTROLS ISLANDS */}
                 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                     <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex gap-1 w-full lg:w-auto overflow-x-auto no-scrollbar shrink-0">
                         {partnerRole === 'admin' ? (
                             <>
                                 <button onClick={() => { hasPickedView.current = true; setPipelineView('all'); }} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${pipelineView === 'all' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>All</button>
                                 <button onClick={() => { hasPickedView.current = true; setPipelineView('mine'); }} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${pipelineView === 'mine' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Mine</button>
                                 <button onClick={() => { hasPickedView.current = true; setPipelineView('incoming'); }} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${pipelineView === 'incoming' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Inbox</button>
                             </>
                         ) : (
                             <>
                                 <button onClick={() => { hasPickedView.current = true; setPipelineView('mine'); }} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${pipelineView === 'mine' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Mine</button>
                                 {/* Team button only surfaces if the caller has team-visible deals — otherwise it's noise. */}
                                 {allReferrals.some(r => Array.isArray(r.teamVisibleUids) && r.teamVisibleUids.includes(user?.uid) && r.assignedAgentId !== user?.uid && r.referrerId !== user?.uid) && (
                                     <button onClick={() => { hasPickedView.current = true; setPipelineView('team'); }} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${pipelineView === 'team' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Team</button>
                                 )}
                             </>
                         )}
                     </div>

                     <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto no-scrollbar">
                         <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-0.5 shrink-0">
                             <button onClick={() => setBoardLayout('list')} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${boardLayout === 'list' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500'}`} title="List view">List</button>
                             <button onClick={() => setBoardLayout('kanban')} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${boardLayout === 'kanban' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500'}`} title="Kanban board view">Board</button>
                         </div>
                         <button onClick={() => setShowStagesEditor(true)}
                             className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 hover:border-slate-900 transition shrink-0"
                             title="Customize your pipeline stages">
                             <SettingsIcon size={11}/> Stages
                         </button>
                         <button onClick={() => setShowCustomFieldsEditor(true)}
                             className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 hover:border-slate-900 transition shrink-0"
                             title="Define custom fields you want to track on every deal">
                             <SettingsIcon size={11}/> Fields
                         </button>
                         <button onClick={() => { setBulkMode(m => !m); if (bulkMode) setSelectedIds(new Set()); }}
                             className={`flex items-center gap-1 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-widest transition shrink-0 border ${bulkMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-slate-900 hover:border-slate-900'}`}
                             title="Toggle bulk selection">
                             {bulkMode ? 'Exit select' : 'Select'}
                         </button>
                         <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl focus-within:border-blue-400 transition shrink-0">
                            <Search size={14} className="text-gray-400" />
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full" />
                         </div>
                         {partnerRole === 'admin' && (
                             <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="bg-gray-50 border border-gray-100 text-xs font-bold text-slate-700 outline-none cursor-pointer rounded-xl px-3 py-2.5 shrink-0">
                                 <option value="all">All Agents</option><option value="ADMIN_INBOX">Admin Inbox</option>
                                 {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                             </select>
                         )}
                         <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="bg-gray-50 border border-gray-100 text-xs font-bold text-slate-700 outline-none cursor-pointer rounded-xl px-3 py-2.5 shrink-0">
                             <option value="all">All Tags</option>
                             <option value="PURCHASE">PURCHASE</option>
                             <option value="First Time Buyer">First Time Buyer</option>
                             <option value="Renewal">Renewal</option>
                             <option value="Refinance">Refinance</option>
                             <option value="Reverse Mortgage">Reverse Mortgage</option>
                             <option value="Realtor Lead">Realtor Lead</option>
                         </select>
                         <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 border border-gray-100 text-xs font-bold text-slate-700 outline-none cursor-pointer rounded-xl px-3 py-2.5 shrink-0">
                             <option value="all">All Statuses</option>
                             {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                         <select value={filterReferralSource} onChange={(e) => setFilterReferralSource(e.target.value)} className="bg-gray-50 border border-gray-100 text-xs font-bold text-slate-700 outline-none cursor-pointer rounded-xl px-3 py-2.5 shrink-0" title="Filter by referral source / partner">
                             <option value="all">All Sources</option>
                             {REFERRAL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                             <optgroup label="Referral Partner">
                                 {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                             </optgroup>
                         </select>
                     </div>
                 </div>

                 {/* DEAL CARDS */}
                 {boardLayout === 'kanban' ? (
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
                        {PIPELINE_STAGES.map(stage => {
                            const stageDeals = dealsByStage.get(stage) || [];
                            const stageValue = stageDeals.reduce((acc, d) => acc + Number(d.loanAmount || 0), 0);
                            const isTerminal = ['Declined','Lost','Cancelled','Funded','Closed','Firm Sale','Firm / Conditional','Funded / Paid'].includes(stage);
                            return (
                                <div key={stage} className="shrink-0 w-72 bg-gray-100 rounded-2xl p-3 snap-start">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">{stage}</h4>
                                            <p className="text-[9px] font-bold text-gray-500">{stageDeals.length} · {formatCurrency(stageValue)}</p>
                                        </div>
                                        {!isTerminal && stageDeals.length > 0 && <span className="bg-white text-slate-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-gray-200">{stageDeals.length}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        {stageDeals.length === 0 ? (
                                            <div className="bg-white/60 border border-dashed border-gray-200 rounded-xl p-3 text-center">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Empty</p>
                                            </div>
                                        ) : stageDeals.map(deal => {
                                            const meta = dealMeta.get(deal.id);
                                            const days = meta?.days ?? 0;
                                            const sla = meta?.sla ?? { callCount: 0, callSLA: 'pending', subSLA: 'pending', hoursSinceCreation: 0 };
                                            return (
                                                <div key={deal.id} onClick={() => handleOpenDealModal(deal)} style={CARD_VIRTUAL_STYLE} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:border-black cursor-pointer transition group">
                                                    <div className="flex justify-between items-start gap-2 mb-2">
                                                        <h5 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition truncate">{deal.clientName}</h5>
                                                        {Number(deal.loanAmount) > 0 && <span className="text-[9px] font-black text-slate-700 shrink-0">{formatCurrency(Number(deal.loanAmount))}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                                        {!isTerminal && <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${stageAgeStyle(days)}`}>{days}d</span>}
                                                        {sla.callSLA === 'breached' && !isTerminal && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">SLA</span>}
                                                        {!isTerminal && meta && (
                                                            <span
                                                                title={meta.scoreHint}
                                                                className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                                                    meta.scoreBand === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    : meta.scoreBand === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                                }`}
                                                            >{meta.score}</span>
                                                        )}
                                                        <span className="text-[9px] font-bold text-gray-500"><PhoneCall size={9} className="inline"/> {sla.callCount}/5</span>
                                                    </div>
                                                    {deal.clientPhone && (
                                                        <a href={`tel:${deal.clientPhone}`} onClick={e => e.stopPropagation()} className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 w-full"><PhoneCall size={10}/> Call</a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 ) : (
                 <div className="space-y-3 md:space-y-4">
                     {filteredDeals.slice(0, visibleCount).map((deal) => (
                       <DealListCard
                         key={deal.id}
                         deal={deal}
                         meta={dealMeta.get(deal.id)}
                         onOpen={handleOpenDealModal}
                         bulkMode={bulkMode}
                         isSelected={selectedIds.has(deal.id)}
                         onToggleSelect={toggleSelect}
                       />
                     ))}

                     {visibleCount < filteredDeals.length && (
                         <div className="flex flex-col items-center gap-3 pt-4 pb-2">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                 Showing {visibleCount} of {filteredDeals.length}
                             </p>
                             <div className="flex gap-2">
                                 <button
                                     type="button"
                                     onClick={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, filteredDeals.length))}
                                     className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition"
                                 >
                                     Show {Math.min(PAGE_SIZE, filteredDeals.length - visibleCount)} more
                                 </button>
                                 <button
                                     type="button"
                                     onClick={() => setVisibleCount(filteredDeals.length)}
                                     className="bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-black transition"
                                 >
                                     Show all ({filteredDeals.length - visibleCount} remaining)
                                 </button>
                             </div>
                         </div>
                     )}

                     {filteredDeals.length === 0 && (
                         <div className="text-center p-10 bg-white rounded-2xl border border-dashed border-gray-200">
                             <Target className="mx-auto text-gray-300 mb-3" size={32} />
                             <p className="text-gray-500 font-bold text-sm mb-1">Pipeline Empty</p>
                         </div>
                     )}
                 </div>
                 )}
              </div>

              {/* RIGHT: TASKS */}
              <div className="xl:col-span-4 space-y-4 md:space-y-6 hidden lg:block">
                 <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                     <h3 className="font-black uppercase tracking-tight text-sm mb-4 flex items-center gap-2 text-slate-900"><CheckCircle size={16} className="text-blue-600"/> Today's Action Items</h3>
                     {todaysTasks.length === 0 ? (
                         <p className="text-xs text-gray-400 font-medium bg-gray-50 p-3 rounded-xl text-center border border-gray-100">Inbox zero achieved.</p>
                     ) : (
                         <div className="space-y-2">
                             {todaysTasks.map(task => (
                                 <div key={task.id} onClick={() => { if(task.referralId !== 'general') { handleOpenTaskDeal(task.referralId); } }} className={`group p-3 bg-white border border-gray-100 shadow-sm rounded-xl flex justify-between items-start transition cursor-pointer hover:border-black`}>
                                     <div>
                                         <p className="text-[10px] font-black text-slate-900 mb-0.5 group-hover:text-blue-600 transition">{task.clientName}</p>
                                         <p className="text-[10px] text-gray-500 font-medium line-clamp-2">{task.description}</p>
                                     </div>
                                     <button onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id); }} className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-green-500 hover:border-green-500 text-transparent hover:text-white transition shrink-0 z-10">
                                         <CheckCircle size={10} />
                                     </button>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
              </div>
           </div>
        )}
      </main>

      {/* ➕ INJECT NEW LEAD MODAL */}
      {showNewReferralForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"><Plus size={18}/></div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight leading-none">Inject Lead</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Added by {fullName}</p>
                </div>
              </div>
              <button onClick={() => setShowNewReferralForm(false)} className="bg-white/10 hover:bg-white hover:text-black text-white p-2 rounded-lg transition"><X size={16}/></button>
            </div>

            <form onSubmit={handleManualLeadSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Client Name *</label>
                <input required type="text" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Jane Smith" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Phone</label>
                  <input type="tel" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="(416) 555-0199" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Email</label>
                  <input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="jane@email.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Service Needed</label>
                <select value={newClient.service} onChange={e => setNewClient({ ...newClient, service: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                  <option>General Inquiry</option>
                  <option>Purchase</option>
                  <option>Refinance</option>
                  <option>Renewal</option>
                  <option>First Time Buyer</option>
                  <option>Reverse Mortgage</option>
                  <option>Commercial</option>
                  <option>Insurance</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Assign To</label>
                <select value={newClient.assignedTo} onChange={e => setNewClient({ ...newClient, assignedTo: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                  <option value={user?.uid || ''}>Me ({fullName})</option>
                  <option value="ADMIN_INBOX">📥 Admin Inbox (HQ Triage)</option>
                  {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => (
                    <option key={p.uid} value={p.uid}>{p.displayName}{p.role ? ` (${p.role.replace('partner_', '')})` : ''}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Assigning to a person auto-creates the 5-touch follow-up cadence.</p>
              </div>

              {partnerRole === 'admin' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Referral Source</label>
                  <select value={newClient.referralSource} onChange={e => setNewClient({ ...newClient, referralSource: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                    {REFERRAL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    <optgroup label="Specific Referral Partner">
                      {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName}{p.role ? ` (${p.role.replace('partner_', '')})` : ''}</option>)}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Used to track who gets paid out when this file funds.</p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Notes</label>
                <textarea rows={3} value={newClient.message} onChange={e => setNewClient({ ...newClient, message: e.target.value })} placeholder="Context from the call…" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm outline-none focus:border-black resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewReferralForm(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 transition">Cancel</button>
                <button type="submit" disabled={injectingLead || !newClient.name.trim()} className="flex-1 bg-black text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                  {injectingLead ? <><Loader2 size={15} className="animate-spin"/> Injecting…</> : <><Plus size={15}/> Inject Lead</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 ENTERPRISE DEAL COMMAND CENTER (MODAL) 🚀 */}
      {selectedDeal && (
        <DealModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          logType={logType} setLogType={setLogType}
          logInput={logInput} setLogInput={setLogInput}
          taskDate={taskDate} setTaskDate={setTaskDate}
          targetPartnerId={targetPartnerId} setTargetPartnerId={setTargetPartnerId}
          docRequests={docRequests} setDocRequests={setDocRequests}
          bdForm={bdForm} setBdForm={setBdForm}
          isPublishing={isPublishing} nudgingOwner={nudgingOwner}
          isEditingClient={isEditingClient} setIsEditingClient={setIsEditingClient}
          editClientForm={editClientForm} setEditClientForm={setEditClientForm}
          isEditingSummary={isEditingSummary} setIsEditingSummary={setIsEditingSummary}
          editSummaryText={editSummaryText} setEditSummaryText={setEditSummaryText}
          setSelectedDeal={setSelectedDeal}
          setAllReferrals={setAllReferrals}
          setShowIntakeForm={setShowIntakeForm}
          handleStatusChange={handleStatusChange}
          handleTagUpdate={handleTagUpdate}
          handleReferralSourceUpdate={handleReferralSourceUpdate}
          handleActionSubmit={handleActionSubmit}
          handleCategoryUpdate={handleCategoryUpdate}
          handleNudgeOwner={handleNudgeOwner}
          handleEditClientSave={handleEditClientSave}
          handleSaveSummary={handleSaveSummary}
          handleDealValueSave={handleDealValueSave}
          handleAddParticipant={handleAddParticipant}
          handleRemoveParticipant={handleRemoveParticipant}
          handleDownloadVaultDoc={handleDownloadVaultDoc}
          publishToBorrowDirect={publishToBorrowDirect}
          fullName={fullName}
          partnerRole={partnerRole}
          user={user}
          ecosystemPartners={ecosystemPartners}
          PIPELINE_STAGES={PIPELINE_STAGES}
          customDealFields={customDealFields}
          dealMeta={dealMeta}
          toast={toast}
          aiTaskToast={aiTaskToast}
          setAiTaskToast={setAiTaskToast}
          escalationToast={escalationToast}
          setEscalationToast={setEscalationToast}
          loadProfileAndData={loadProfileAndData}
          allTasks={allTasks}
        />
      )}


      {/* AI Intake wizard — full-screen modal owned by IntakeWizard. */}
      <IntakeWizard
        open={showIntakeForm}
        onClose={() => setShowIntakeForm(false)}
        deal={selectedDeal}
        agentName={fullName}
        onSaved={async (patch) => {
          setSelectedDeal((prev: any) => prev ? { ...prev, ...patch } : prev);
          if (selectedDeal) {
            setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, ...patch } : r));
          }
          // Running the AI intake is an implicit push — the realtor
          // has authorized a broker to review the file. Auto-push if
          // the deal is still private (fire-and-forget, silent on
          // failure so the intake success flow isn't blocked).
          if (selectedDeal && selectedDeal.pushedForMortgage === false) {
            try {
              await authedPost(`/api/partner/referrals/${selectedDeal.id}/push`, {
                note: 'Auto-pushed on AI Intake completion',
              });
              const nowIso = new Date().toISOString();
              const pushPatch = { pushedForMortgage: true, pushedForMortgageAt: nowIso, pushedForMortgageBy: user?.uid };
              setSelectedDeal((prev: any) => prev ? { ...prev, ...pushPatch } : prev);
              setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, ...pushPatch } : r));
            } catch { /* silent */ }
          }
        }}
      />

      {/* Gemini Copilot — floating launcher + slide-in chat. Read tools run
          inline; every write is gated behind a confirmation card. Callback
          triggers a data reload so CRM state stays in sync with any
          approved changes. */}
      {user && (
        <PartnerCopilot
          ctx={{
            uid: user.uid,
            role: partnerRole === 'admin' ? 'admin' : 'agent',
            selectedDealId: selectedDeal?.id,
            pipelineFilter: {
              status: filterStatus !== 'all' ? filterStatus : undefined,
              tag: filterTag !== 'all' ? filterTag : undefined,
              assignee: filterAssignee !== 'all' ? filterAssignee : undefined,
              source: filterReferralSource !== 'all' ? filterReferralSource : undefined,
            },
            viewScope: pipelineView,
          }}
          onToolExecuted={() => { loadProfileAndData(); }}
        />
      )}
    </div>
    </BrowserPhoneProvider>
  );
}

// Memoized list-view deal card. The parent re-renders on every keystroke in
// the open deal modal (state lives on PartnerCRM). Without memoization, all
// ~1000 cards would reconcile per keystroke — that's the typing lag the
// user reported. React.memo + stable `deal`/`meta`/`onOpen` references means
// each card render is a single shallow prop compare.
//
// content-visibility on the wrapper additionally lets the browser skip
// paint/layout for off-screen cards.
interface DealMeta {
    sla: { callCount: number; callSLA: string; subSLA: string; hoursSinceCreation: number };
    days: number;
    progress: number;
    isWon: boolean;
    activeTask: any;
    score: number;
    scoreBand: 'red' | 'amber' | 'green';
    scoreHint: string;
}

const DealListCard = React.memo(function DealListCard({
    deal,
    meta,
    onOpen,
    bulkMode = false,
    isSelected = false,
    onToggleSelect,
}: {
    deal: any;
    meta: DealMeta | undefined;
    onOpen: (deal: any) => void;
    bulkMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
}) {
    const progress = meta?.progress ?? 10;
    const isWon = meta?.isWon ?? false;
    const sla = meta?.sla ?? { callCount: 0, callSLA: 'pending', subSLA: 'pending', hoursSinceCreation: 0 };
    const days = meta?.days ?? 0;

    // In bulk mode, click toggles selection instead of opening the deal.
    // The checkbox itself also toggles (stopPropagation so click on the
    // whole card and click on the box behave identically).
    const handleClick = () => bulkMode ? onToggleSelect?.(deal.id) : onOpen(deal);

    return (
        <div
            onClick={handleClick}
            style={CARD_VIRTUAL_STYLE}
            className={`group bg-white rounded-2xl p-4 md:p-5 border shadow-sm hover:border-black transition-all cursor-pointer relative overflow-hidden ${isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'}`}
        >
            {bulkMode && (
              <div className="absolute top-3 right-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onClick={e => e.stopPropagation()}
                  onChange={() => onToggleSelect?.(deal.id)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                  aria-label={`Select ${deal.clientName || 'deal'}`}
                />
              </div>
            )}
            {deal.dealCategory === 'active' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}

            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3 md:gap-4">
                <div className="flex gap-3 md:gap-4 items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${deal.dealCategory === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}>
                        {deal.clientName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-black text-slate-900 group-hover:text-blue-600 transition tracking-tight">{deal.clientName}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {deal.leadTag && <span className="px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 border border-purple-200">{deal.leadTag}</span>}
                            {(deal.referralPartnerId || deal.referralSource === 'Realtor Partner' || deal.referralSource === 'Other Partner') && <span className="px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200" title="Compensation payout owed">💰 {deal.referralPartnerName || deal.referralSource}</span>}
                            <span className="text-[10px] md:text-xs text-gray-500 font-bold">{deal.serviceNeeded || deal.serviceRequested || deal.type || 'New Lead'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-gray-50 pt-3 sm:pt-0">
                    <div className="flex gap-2 items-center flex-wrap">
                        {sla.callSLA === 'breached' && !isWon && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1 animate-pulse"><AlertCircle size={10}/> Call SLA</span>}
                        {sla.subSLA === 'breached' && !isWon && <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1"><Clock size={10}/> Submit SLA</span>}
                        {meta && !isWon && !LOST_STATUSES.includes(deal.status) && (
                            <span
                                title={meta.scoreHint}
                                className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                                    meta.scoreBand === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : meta.scoreBand === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                            ><Gauge size={10}/> Score {meta.score}</span>
                        )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest hidden sm:block">Status</p>
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${isWon ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{deal.status}</span>
                        {!isWon && !LOST_STATUSES.includes(deal.status) && (
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${stageAgeStyle(days)}`}>
                                {days === 0 ? 'New today' : `${days}d in stage`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-3 hidden md:flex items-center gap-3 flex-wrap">
                {Number(deal.loanAmount) > 0 && (
                    <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Wallet size={10}/> {formatCurrency(Number(deal.loanAmount))}
                    </span>
                )}
                {(() => {
                    const required = (deal.requiredDocuments || []).length;
                    const uploaded = (deal.vault || []).length;
                    if (required === 0 && uploaded === 0) return null;
                    const complete = required > 0 && uploaded >= required;
                    return (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border ${complete ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            <FileText size={10}/> Docs {uploaded}/{required || uploaded}
                        </span>
                    );
                })()}
            </div>

            <div className="mb-4 hidden md:block">
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="pt-2 md:pt-3 border-t border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                        <PhoneCall size={12} className={sla.callCount >= 5 ? 'text-green-500' : 'text-orange-500'}/> Touches: {sla.callCount}/5
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 hidden sm:block">
                        <User size={12} className="inline mr-1"/> Assigned: {deal.assignedAgentName === 'Admin Triage' ? 'HQ' : deal.assignedAgentName}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {deal.clientPhone && (
                        <a href={`tel:${deal.clientPhone}`} onClick={(e) => e.stopPropagation()} className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm" title={`Call ${deal.clientPhone}`}>
                            <PhoneCall size={10}/> Call
                        </a>
                    )}
                    {deal.clientPhone && (
                        <a href={`sms:${deal.clientPhone}`} onClick={(e) => e.stopPropagation()} className="bg-slate-900 hover:bg-black text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm hidden md:inline-flex" title="Send SMS">
                            <Send size={10}/> SMS
                        </a>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black transition flex items-center gap-1">Manage <ChevronRight size={10}/></span>
                </div>
            </div>
        </div>
    );
});