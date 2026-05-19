'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc, arrayUnion } from 'firebase/firestore'; 
import { db } from '../../firebase'; 

export default function PartnerCRM() {
  const { user, loading, logout } = useAdmin();
  const router = useRouter();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analyzer' | 'calendar'>('pipeline');
  const [pipelineView, setPipelineView] = useState<'all' | 'mine' | 'incoming' | 'outbound'>('mine');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterTag, setFilterTag] = useState('all'); 
  const [filterStatus, setFilterStatus] = useState('all');
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
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', service: 'General Inquiry', message: '', assignedTo: 'ADMIN_INBOX' });
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ description: '', dueDate: '', referralId: 'general' });

  const [analyzerForm, setAnalyzerForm] = useState({ income: '', downPayment: '', propertyValue: '', creditScore: '', debts: '', notes: '' });
  const [analyzerStatus, setAnalyzerStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analyzerResult, setAnalyzerResult] = useState<any>(null);

  // --- AI INTAKE FORM (single-page adaptive form, agent fills while on the phone) ---
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [intakePhase, setIntakePhase] = useState<'form' | 'review' | 'sending'>('form');
  const [intakeGenerating, setIntakeGenerating] = useState(false);
  const [intakeChecklist, setIntakeChecklist] = useState<string[]>([]);
  const [intakeSummary, setIntakeSummary] = useState('');
  const [intakeFinancials, setIntakeFinancials] = useState<any>(null);
  const [intakeNewItem, setIntakeNewItem] = useState('');

  type OtherProperty = { address: string; value: string; balance: string; rent: string; payment: string };
  const [intakeData, setIntakeData] = useState({
      goal: 'Purchase' as 'Purchase' | 'Refinance' | 'Renewal Transfer',
      fthb: 'No' as 'Yes' | 'No' | 'Not Sure',
      // subject property
      subjectAddress: '',
      propertyValue: '',          // purchase price OR estimated market value depending on goal
      propertyTaxes: '',
      hasRentalIncome: 'No' as 'Yes' | 'No',
      monthlyRent: '',
      basementStatus: 'Not Sure' as 'Legal' | 'Not Legal' | 'Not Sure',
      // purchase-only
      downPayment: '',
      downPaymentSource: 'Savings' as 'Savings' | 'Gift' | 'RRSP HBP' | 'Sale of Property' | 'Other',
      // refi/renewal only
      currentLender: '',
      currentBalance: '',
      currentRate: '',
      renewalDate: '',
      // applicants
      numApplicants: '1' as '1' | '2' | '3+',
      creditScore: '680-749' as '750+' | '680-749' | '600-679' | 'Below 600' | 'Not Sure',
      empType: 'T4 / Salaried' as 'T4 / Salaried' | 'Self-Employed / Business Owner' | 'Hourly / Part-Time',
      annualIncome: '',
      incomeYear1: '',
      incomeYear2: '',
      coEmpType: 'T4 / Salaried' as 'T4 / Salaried' | 'Self-Employed / Business Owner' | 'Hourly / Part-Time',
      coAnnualIncome: '',
      coIncomeYear1: '',
      coIncomeYear2: '',
      // liabilities
      monthlyDebtPayments: '',
      substantialDebts: '',
      otherPropertiesList: [] as OtherProperty[],
  });

  const addOtherProperty = () => setIntakeData(p => ({ ...p, otherPropertiesList: [...p.otherPropertiesList, { address: '', value: '', balance: '', rent: '', payment: '' }] }));
  const updateOtherProperty = (idx: number, field: keyof OtherProperty, value: string) => setIntakeData(p => {
      const list = [...p.otherPropertiesList];
      if (list[idx]) list[idx] = { ...list[idx], [field]: value };
      return { ...p, otherPropertiesList: list };
  });
  const removeOtherProperty = (idx: number) => setIntakeData(p => ({ ...p, otherPropertiesList: p.otherPropertiesList.filter((_, i) => i !== idx) }));

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Whether the user has manually picked a pipeline view this session. Stops loadProfileAndData() from clobbering admin's "Mine" selection.
  const hasPickedView = useRef(false);

  // Kanban vs list view
  const [boardLayout, setBoardLayout] = useState<'list' | 'kanban'>('list');

  // --- UNIQUE ROLE PIPELINE STAGES ---
  const getPipelineStages = (role: string) => {
      switch(role) {
          case 'partner_realtor': return ['Lead Received', 'Showing', 'Offer Made', 'Conditional', 'Firm Sale', 'Closed', 'Lost'];
          case 'partner_lawyer': return ['File Opened', 'Title Search', 'Docs Prepared', 'Signing', 'Closed', 'Cancelled'];
          case 'partner_referral': return ['Referred', 'Contacted', 'Processing', 'Funded / Paid', 'Declined'];
          default: return ['Received', 'Contacted', 'Underwriting', 'Approved', 'Firm / Conditional', 'Closed', 'Declined'];
      }
  };
  const PIPELINE_STAGES = getPipelineStages(partnerRole);

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
            // Admins default to 'all' on first load, but don't fight the user if they later pick 'mine'
            setPipelineView(prev => (currentRole === 'admin' && prev === 'mine' && !hasPickedView.current) ? 'all' : prev);
        }
        hasPickedView.current = true;
        setFullName(loadedFullName);
        
        let activePipeline: any[] = [];
        if (currentRole === 'admin') {
            const snap = await getDocs(collection(db, 'referrals'));
            activePipeline = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
            const profile = { uid: user.uid, role: currentRole, displayName: loadedFullName };
            const { sent, received, mine } = await CRMService.getPartnerDashboard(profile as any);
            activePipeline = [...sent, ...received, ...mine];
            activePipeline = activePipeline.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        }
        setAllReferrals(activePipeline);

        let fetchedTasks: Task[] = [];
        try {
            const tRes = await fetch(`/api/partner/tasks?userId=${user.uid}&role=${currentRole}`);
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

  const handleGoogleSync = async () => {
      setIsSyncingGoogle(true);
      try {
          const res = await fetch('/api/partner/calendar-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user?.uid, tasks: allTasks }) });
          const data = await res.json();
          if (data.url) window.location.href = data.url; 
          else alert(data.message || 'Calendar synced successfully!');
      } catch (err) { alert('Failed to connect to Google Calendar.'); }
      setIsSyncingGoogle(false);
  };

  const handleManualTaskSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      let clientName = 'Personal Task';
      if (newTask.referralId !== 'general') {
          const deal = allReferrals.find(d => d.id === newTask.referralId);
          if (deal) clientName = deal.clientName;
      }
      await fetch('/api/partner/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referralId: newTask.referralId, clientName: clientName, assigneeId: user.uid, dueDate: newTask.dueDate, description: newTask.description, status: 'Pending' }) });
      setShowNewTaskForm(false); setNewTask({ description: '', dueDate: '', referralId: 'general' }); loadProfileAndData();
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

  const handleManualLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let assignedAgentId = newClient.assignedTo;
    let assignedAgentName = 'Admin Triage';
    if (assignedAgentId === user.uid) assignedAgentName = fullName;
    else if (assignedAgentId !== 'ADMIN_INBOX') {
        const partner = ecosystemPartners.find(p => p.uid === assignedAgentId);
        if (partner) {
            assignedAgentName = partner.displayName;
            notifyParticipants(partner.email, `IndiBrick CRM: New Lead Assigned (${newClient.name})`, `<p><strong>${fullName}</strong> has assigned a new lead to your pipeline.</p><p><strong>Client:</strong> ${newClient.name}</p>`);
        }
    }
    const payload = { ...newClient, type: 'Manual Entry', dealCategory: 'potential', assignedAgentId, assignedAgentName, callCount: 0, participants: [] };
    const result = await CRMService.createReferral({ uid: user.uid, role: partnerRole, displayName: fullName } as any, payload as any);
    if (result.success && result.id && assignedAgentId !== 'ADMIN_INBOX') {
        try { await CRMService.createTouchCadence(result.id, newClient.name, assignedAgentId); }
        catch (e) { console.warn('Cadence creation failed', e); }
    }
    setShowNewReferralForm(false); setNewClient({ name: '', phone: '', email: '', service: 'General Inquiry', message: '', assignedTo: 'ADMIN_INBOX' });
    loadProfileAndData();
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
         const emailsArray = Array.from(emails).filter(e => e && e !== '');
         for (const email of emailsArray) {
             await addDoc(collection(db, "mail"), { to: email, message: { subject, html: `<div style="font-family: sans-serif; padding: 20px;">${htmlContent}</div>` } });
         }
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
      setSelectedDeal(null); setTargetPartnerId(''); loadProfileAndData();
      
    } else if (logType === 'task') {
      const tempTask: Task = { id: `tmp-${Date.now()}`, referralId: selectedDeal.id, clientName: selectedDeal.clientName, assigneeId: user.uid, dueDate: taskDate, description: logInput, status: 'Pending' } as any;
      setAllTasks(prev => [...prev, tempTask]);
      await fetch('/api/partner/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referralId: selectedDeal.id, clientName: selectedDeal.clientName, assigneeId: user.uid, dueDate: taskDate, description: logInput, status: 'Pending' }) });
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
              // Refresh tasks list only (not the whole pipeline)
              try {
                  const tRes = await fetch(`/api/partner/tasks?userId=${user.uid}&role=${partnerRole}`);
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

  const handleCategoryUpdate = async (newCategory: 'active' | 'potential') => {
    if (!selectedDeal || !user) return;
    await updateDoc(doc(db, "referrals", selectedDeal.id), { dealCategory: newCategory });

    if (newCategory === 'active' && selectedDeal.clientEmail) {
       if (window.confirm("Deal marked as Active! Would you like to automatically generate a Client Portal account and email them their secure login credentials?")) {
           try {
               const res = await fetch('/api/partner/onboard-client', {
                   method: 'POST', headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify({ leadId: selectedDeal.id, clientEmail: selectedDeal.clientEmail, clientName: selectedDeal.clientName, agentName: fullName, notes: selectedDeal.notes, requiredDocs: selectedDeal.requiredDocuments || [] })
               });
               if (res.ok) alert("✅ Client account created and welcome email sent!");
               else alert("❌ Failed to send welcome email.");
           } catch (e) { alert("Network error. Could not reach server."); }
       }
    } else if (newCategory === 'active' && !selectedDeal.clientEmail) {
       alert("Deal marked as Active. Cannot auto-generate client portal because no email address is on file.");
    }

    setSelectedDeal({ ...selectedDeal, dealCategory: newCategory });
    setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, dealCategory: newCategory } : r));
  };

  const handleEditClientSave = async () => {
     if (!selectedDeal) return;
     await updateDoc(doc(db, "referrals", selectedDeal.id), { clientName: editClientForm.name, clientPhone: editClientForm.phone, clientEmail: editClientForm.email });
     const patch = { clientName: editClientForm.name, clientPhone: editClientForm.phone, clientEmail: editClientForm.email };
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

  const formatCurrency = (n: number) => {
      if (!n || isNaN(n)) return '$0';
      if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
      if (n >= 1_000) return `$${(n/1_000).toFixed(0)}K`;
      return `$${n.toLocaleString()}`;
  };

  const FUNDED_STATUSES = ['Funded', 'Closed', 'Firm Sale', 'Firm / Conditional', 'Funded / Paid'];
  const LOST_STATUSES = ['Declined', 'Lost', 'Cancelled'];

  const handleAddParticipant = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pUid = e.target.value;
      if (!pUid || !selectedDeal) return;
      const partner = ecosystemPartners.find(p => p.uid === pUid);
      if (!partner) return;

      const newParticipant = { uid: partner.uid, name: partner.displayName, role: partner.role || 'Partner', email: partner.email };
      await updateDoc(doc(db, "referrals", selectedDeal.id), { participants: arrayUnion(newParticipant) });
      const updatedParticipants = [...(selectedDeal.participants || []), newParticipant];
      setSelectedDeal({...selectedDeal, participants: updatedParticipants});
      setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, participants: updatedParticipants } : r));
      notifyParticipants(partner.email, `IndiBrick CRM: Added to Deal Team`, `<p>You have been added to the deal team for <strong>${selectedDeal.clientName}</strong>.</p>`);
      e.target.value = "";
  };

  const handleCompleteTask = async (taskId: string) => {
      // Optimistic local update; skip full pipeline reload
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
      await fetch('/api/partner/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) });
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this lead?")) {
      await CRMService.deleteReferral(id); setSelectedDeal(null); loadProfileAndData();
    }
  };

  const handleOpenDealModal = async (deal: any) => {
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
  };

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
              alert('Document not yet available. Please try again in a moment.');
          }
      } catch(e: any) {
          alert(e.message || 'Could not load document.');
      }
  };

  const handleOpenTaskDeal = (referralId: string) => {
    if (referralId === 'general') return;
    const found = allReferrals.find(d => d.id === referralId);
    if (found) handleOpenDealModal(found); 
  };

  // --- AI CHAT INTAKE (agent-driven, RAG-backed, draft mode until agent confirms) ---

  // Pure-function calculator: takes the financials Gemini extracts and returns LTV/GDS/TDS + risk band
  const computeMortgageMetrics = (f: any) => {
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
      // ~5.5%/yr factor approximates a 25yr amort at current rates
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
  };

  // Build the full underwriter-style summary string we save + email
  const buildEnrichedSummary = (aiSummary: string, financials: any) => {
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
  };

  const resetIntakeForm = () => {
      setIntakePhase('form');
      setIntakeChecklist([]);
      setIntakeSummary('');
      setIntakeFinancials(null);
      setIntakeNewItem('');
      // Note: we intentionally do NOT clear intakeData — agents may reopen mid-flow
  };

  // Build the financials object from raw form values (also used for the live metric preview at the bottom of the form)
  const intakeDataToFinancials = (d: typeof intakeData) => {
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
          otherPropertiesEquity: otherProps.reduce((acc, p) => acc + Math.max(0, Number(p.value || 0) - Number(p.balance || 0)), 0),
          otherPropertiesPayments: otherProps.reduce((acc, p) => acc + Number(p.payment || 0), 0),
          otherPropertiesRent: otherProps.reduce((acc, p) => acc + Number(p.rent || 0), 0),
      };
  };

  // Agent hits "Generate" → call the structured intake endpoint and move to review
  const generateIntake = async () => {
      if (!selectedDeal) return;
      setIntakeGenerating(true);
      const financials = intakeDataToFinancials(intakeData);
      try {
          const res = await fetch('/api/partner/intake-generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  formData: intakeData,
                  financials,
                  leadId: selectedDeal.leadId || selectedDeal.id,
                  clientName: selectedDeal.clientName,
                  agentName: fullName,
              }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to generate');
          setIntakeSummary(data.summary || '');
          setIntakeChecklist(data.checklist || []);
          setIntakeFinancials(data.financials || financials);
          setIntakePhase('review');
      } catch (e: any) {
          alert(e.message || 'Could not generate summary. Please retry.');
      } finally {
          setIntakeGenerating(false);
      }
  };

  // Agent confirms — write to CRM and email the client
  const confirmIntake = async () => {
      if (!selectedDeal || intakeChecklist.length === 0) return;
      setIntakePhase('sending');
      const enriched = buildEnrichedSummary(intakeSummary, intakeFinancials);
      try {
          const res = await fetch('/api/partner/intake-send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  leadId: selectedDeal.leadId || selectedDeal.id,
                  summary: enriched,
                  checklist: intakeChecklist,
                  clientName: selectedDeal.clientName,
                  clientEmail: selectedDeal.clientEmail || '',
                  agentName: fullName,
              }),
          });
          if (!res.ok) throw new Error('Failed to send');

          // Optimistic local update — modal reflects the new summary + required docs immediately
          setSelectedDeal((prev: any) => prev ? { ...prev, dealSummary: enriched, requiredDocuments: intakeChecklist } : prev);
          setAllReferrals(prev => prev.map(r => r.id === selectedDeal.id ? { ...r, dealSummary: enriched, requiredDocuments: intakeChecklist } : r));

          setShowIntakeForm(false);
          resetIntakeForm();
      } catch (e) {
          alert('Could not send intake. Please retry.');
          setIntakePhase('review');
      }
  };

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

  const stageAgeStyle = (days: number) => {
      if (days <= 2) return 'bg-green-50 text-green-700 border-green-200';
      if (days <= 6) return 'bg-amber-50 text-amber-700 border-amber-200';
      return 'bg-red-50 text-red-700 border-red-200';
  };

  // Memoized — called multiple times per render (list + kanban + empty-state check)
  const filteredDeals = useMemo(() => {
      let filtered = allReferrals;
      if (pipelineView === 'mine') filtered = filtered.filter(r => r.assignedAgentId === user?.uid);
      if (pipelineView === 'incoming') filtered = filtered.filter(r => r.assignedAgentId === 'ADMIN_INBOX');
      if (pipelineView === 'outbound') filtered = filtered.filter(r => r.referrerId === 'INDIBRICK_WEB' && r.assignedAgentId !== 'ADMIN_INBOX');

      if (partnerRole === 'admin' && filterAssignee !== 'all') filtered = filtered.filter(r => r.assignedAgentId === filterAssignee);
      if (filterTag !== 'all') filtered = filtered.filter(r => r.leadTag === filterTag);
      if (filterStatus !== 'all') filtered = filtered.filter(r => r.status === filterStatus);

      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(r => r.clientName?.toLowerCase().includes(q) || r.clientEmail?.toLowerCase().includes(q) || r.clientPhone?.includes(q));
      }
      return [...filtered].sort((a, b) => {
          if (sortOrder === 'newest') return new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime();
          return new Date(a.referralDate).getTime() - new Date(b.referralDate).getTime();
      });
  }, [allReferrals, pipelineView, filterAssignee, filterTag, filterStatus, searchQuery, sortOrder, partnerRole, user?.uid]);

  const getFilteredDeals = () => filteredDeals;

  const publishToBorrowDirect = async () => {
     if(!bdForm.loanAmount || !bdForm.ltv || !bdForm.aiSummary) return alert("Please fill all fields and provide summary.");
     setIsPublishing(true);
     try {
        const payload = { referralId: selectedDeal.id, loanAmount: Number(bdForm.loanAmount), ltv: Number(bdForm.ltv), position: bdForm.position, propertyType: bdForm.propertyType, location: bdForm.location || 'Ontario', aiSummary: bdForm.aiSummary, status: 'Live', createdAt: new Date().toISOString() };
        const docRef = await addDoc(collection(db, 'borrow_direct_deals'), payload);
        setBdDeal({ id: docRef.id, ...payload });
        await CRMService.logActivity(selectedDeal.id, { type: 'note', author: 'System Admin', content: `🛡️ Pushed to BorrowDirect Marketplace (Loan: $${payload.loanAmount}, LTV: ${payload.ltv}%)`, timestamp: new Date().toISOString() });
        loadProfileAndData();
     } catch (err) { alert("Failed to publish to marketplace."); } finally { setIsPublishing(false); }
  };

  // Pipeline financial aggregates — derived from loanAmount/expectedCommission on referrals
  const pipelineStats = useMemo(() => {
      const thisYear = new Date().getFullYear();
      let activeValue = 0, fundedValueYTD = 0, fundedCommissionYTD = 0, fundedCount = 0, activeCount = 0;
      let inflightCommission = 0;
      allReferrals.forEach(r => {
          const amt = Number(r.loanAmount || 0);
          const com = Number(r.expectedCommission || 0);
          const fundedAt = r.fundedAt ? new Date(r.fundedAt) : new Date(r.referralDate || Date.now());
          if (FUNDED_STATUSES.includes(r.status)) {
              if (fundedAt.getFullYear() === thisYear) {
                  fundedValueYTD += amt;
                  fundedCommissionYTD += com;
                  fundedCount += 1;
              }
          } else if (!LOST_STATUSES.includes(r.status)) {
              activeValue += amt;
              inflightCommission += com;
              activeCount += 1;
          }
      });
      return { activeValue, activeCount, fundedValueYTD, fundedCommissionYTD, fundedCount, inflightCommission, avgDeal: fundedCount ? fundedValueYTD / fundedCount : 0 };
  }, [allReferrals]);

  if (loading || dataLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  const todaysTasks = allTasks.filter(t => t.dueDate === todayDateString && t.status !== 'Completed');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 pb-20 md:pb-0 pt-24">
      <style dangerouslySetInnerHTML={{__html: `nav:not(.portal-nav), footer, [class*="fixed"][class*="bottom-"]:not(.portal-nav) { display: none !important; }`}} />

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
          <button onClick={() => setActiveTab('analyzer')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'analyzer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BrainCircuit size={16} /> Deal Analyzer</button>
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Calendar size={16} /> Schedule</button>
        </nav>
        <div className="p-6 border-t border-slate-800"><button onClick={logout} className="w-full flex items-center gap-3 text-xs font-bold uppercase text-slate-500 hover:text-red-400 transition"><LogOut size={14}/> Sign Out</button></div>
      </aside>

      {/* MOBILE NAV */}
      <nav className="portal-nav md:hidden fixed bottom-0 left-0 w-full bg-[#0B0F19] text-slate-400 z-40 flex justify-between items-center px-6 py-3 pb-safe border-t border-slate-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
         <button onClick={() => setActiveTab('pipeline')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'pipeline' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><Briefcase size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Deals</span></button>
         <button onClick={() => setActiveTab('analyzer')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'analyzer' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><BrainCircuit size={20} /><span className="text-[9px] font-black uppercase tracking-widest">AI</span></button>
         <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'calendar' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}><Calendar size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Tasks</span></button>
         <button onClick={logout} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-red-400 transition"><LogOut size={20} /><span className="text-[9px] font-black uppercase tracking-widest">Exit</span></button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="md:ml-64 flex-1 p-4 md:p-10 overflow-x-hidden">
        
        <header className="portal-header flex flex-row justify-between items-center mb-6 md:mb-8 gap-4">
           <div>
             <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
               {activeTab === 'pipeline' ? 'Command Center' : activeTab === 'analyzer' ? 'AI Underwriter' : 'Calendar'}
             </h1>
             <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 hidden sm:block">
               {activeTab === 'pipeline' ? 'Enterprise pipeline and SLA tracking.' : activeTab === 'analyzer' ? 'Instant scenario qualification and structuring.' : 'Manage AI-generated follow-ups and deadlines.'}
             </p>
           </div>
           
           <button onClick={() => setShowNewReferralForm(true)} className="shrink-0 bg-slate-900 text-white px-4 py-3 md:px-5 md:py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5">
              <Plus size={16} /> <span className="hidden md:inline">Inject Lead</span><span className="md:hidden">Add</span>
           </button>
        </header>

        {/* --- TAB: CALENDAR --- */}
        {activeTab === 'calendar' && (
           <div className="animate-fade-in-up max-w-6xl mx-auto space-y-4 md:space-y-6">
              <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={20}/></button>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 w-32 md:w-48 text-center">{monthNames[currentMonth]} {currentYear}</h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={20}/></button>
                 </div>
                 
                 <div className="flex gap-2 w-full md:w-auto">
                     <button onClick={() => setShowNewTaskForm(true)} className="flex-1 md:flex-none bg-slate-900 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition flex items-center justify-center gap-2 shadow-sm">
                        <Plus size={14}/> Add
                     </button>
                     <button onClick={handleGoogleSync} disabled={isSyncingGoogle} className="flex-1 md:flex-none bg-white border border-gray-200 text-slate-700 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:border-blue-400 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                        {isSyncingGoogle ? <Loader2 size={14} className="animate-spin"/> : <Calendar size={14}/>}
                        {isSyncingGoogle ? 'Syncing...' : 'Sync'}
                     </button>
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
                       const dayTasks = allTasks.filter(t => t.dueDate === dateStr);
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

              {/* PIPELINE REVENUE STRIP (top, full-width) */}
              <div className="xl:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
                         ) : (<div className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700">My Pipeline</div>)}
                     </div>

                     <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto no-scrollbar">
                         <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-0.5 shrink-0">
                             <button onClick={() => setBoardLayout('list')} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${boardLayout === 'list' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500'}`} title="List view">List</button>
                             <button onClick={() => setBoardLayout('kanban')} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${boardLayout === 'kanban' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500'}`} title="Kanban board view">Board</button>
                         </div>
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
                     </div>
                 </div>

                 {/* DEAL CARDS */}
                 {boardLayout === 'kanban' ? (
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
                        {PIPELINE_STAGES.map(stage => {
                            const stageDeals = getFilteredDeals().filter(d => d.status === stage);
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
                                            const days = getDaysInStage(deal);
                                            const sla = getSLAHealth(deal);
                                            return (
                                                <div key={deal.id} onClick={() => handleOpenDealModal(deal)} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:border-black cursor-pointer transition group">
                                                    <div className="flex justify-between items-start gap-2 mb-2">
                                                        <h5 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition truncate">{deal.clientName}</h5>
                                                        {Number(deal.loanAmount) > 0 && <span className="text-[9px] font-black text-slate-700 shrink-0">{formatCurrency(Number(deal.loanAmount))}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                                        {!isTerminal && <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${stageAgeStyle(days)}`}>{days}d</span>}
                                                        {sla.callSLA === 'breached' && !isTerminal && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">SLA</span>}
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
                     {getFilteredDeals().map((deal) => {
                        const progress = getStageProgress(deal.status);
                        const isWon = ['Closed', 'Funded', 'Firm Sale', 'Firm / Conditional'].includes(deal.status);
                        const activeTask = allTasks.find(t => t.referralId === deal.id && t.status !== 'Completed');
                        const sla = getSLAHealth(deal);
                        
                        return (
                         <div key={deal.id} onClick={() => handleOpenDealModal(deal)} className="group bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm hover:border-black transition-all cursor-pointer relative overflow-hidden">
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
                                             <span className="text-[10px] md:text-xs text-gray-500 font-bold">{deal.serviceNeeded || deal.serviceRequested || deal.type || 'New Lead'}</span>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-gray-50 pt-3 sm:pt-0">
                                     {/* SLA Gauges */}
                                     <div className="flex gap-2">
                                        {sla.callSLA === 'breached' && !isWon && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1 animate-pulse"><AlertCircle size={10}/> Call SLA</span>}
                                        {sla.subSLA === 'breached' && !isWon && <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1"><Clock size={10}/> Submit SLA</span>}
                                     </div>
                                     <div className="text-right flex flex-col items-end gap-1">
                                         <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest hidden sm:block">Status</p>
                                         <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${isWon ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{deal.status}</span>
                                         {!isWon && !LOST_STATUSES.includes(deal.status) && (() => {
                                            const days = getDaysInStage(deal);
                                            return (
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${stageAgeStyle(days)}`}>
                                                    {days === 0 ? 'New today' : `${days}d in stage`}
                                                </span>
                                            );
                                         })()}
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
                     })}

                     {getFilteredDeals().length === 0 && (
                         <div className="text-center p-10 bg-white rounded-2xl border border-dashed border-gray-200">
                             <Target className="mx-auto text-gray-300 mb-3" size={32} />
                             <p className="text-gray-500 font-bold text-sm mb-1">Pipeline Empty</p>
                         </div>
                     )}
                 </div>
                 )}
              </div>

              {/* RIGHT: STATS & TASKS */}
              <div className="xl:col-span-4 space-y-4 md:space-y-6 hidden lg:block">
                 {/* Conversion + breached SLA call-outs (more actionable than vanity YTD) */}
                 <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-black uppercase tracking-tight text-sm mb-4 flex items-center gap-2 text-slate-900"><AlertCircle size={16} className="text-red-500"/> Needs Attention</h3>
                    {(() => {
                        const breaches = allReferrals.filter(r => !FUNDED_STATUSES.includes(r.status) && !LOST_STATUSES.includes(r.status) && getSLAHealth(r).callSLA === 'breached');
                        if (breaches.length === 0) return <p className="text-xs text-gray-400 font-medium bg-gray-50 p-3 rounded-xl text-center border border-gray-100">All SLAs healthy. 🔥</p>;
                        return (
                            <div className="space-y-2">
                                {breaches.slice(0,5).map(r => (
                                    <div key={r.id} onClick={() => handleOpenDealModal(r)} className="p-3 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center cursor-pointer hover:border-red-400 transition">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black text-slate-900 truncate">{r.clientName}</p>
                                            <p className="text-[9px] font-bold text-red-700 uppercase tracking-widest">{Math.floor(getSLAHealth(r).hoursSinceCreation)}h since intake</p>
                                        </div>
                                        {r.clientPhone && (
                                            <a href={`tel:${r.clientPhone}`} onClick={e => e.stopPropagation()} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1 shrink-0"><PhoneCall size={10}/> Call</a>
                                        )}
                                    </div>
                                ))}
                                {breaches.length > 5 && <p className="text-[10px] text-gray-500 font-bold text-center pt-1">+{breaches.length - 5} more SLA breaches</p>}
                            </div>
                        );
                    })()}
                 </div>

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

      {/* 🚀 ENTERPRISE DEAL COMMAND CENTER (MODAL) 🚀 */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div className="w-full max-w-[95vw] lg:max-w-7xl bg-[#F8FAFC] h-[95vh] rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                       {selectedDeal.clientName}
                    </h2>
                    {selectedDeal.dealCategory === 'active' ? (
                       <button onClick={() => handleCategoryUpdate('potential')} className="bg-green-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-green-400 transition shadow-sm"><CheckCircle size={12}/> Active Deal</button>
                    ) : (
                       <button onClick={() => handleCategoryUpdate('active')} className="bg-orange-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-green-400 transition shadow-sm"><Star size={12}/> Activate & Email Login</button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { resetIntakeForm(); setShowIntakeForm(true); }} className="hidden md:flex bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest items-center gap-2 transition shadow-lg"><Bot size={14}/> Launch AI Intake</button>
                    <button onClick={() => setSelectedDeal(null)} className="bg-white/10 hover:bg-white text-white hover:text-black p-2 rounded-lg transition"><X size={16}/></button>
                </div>
            </div>

            {/* Modal Body - 3 Columns. On mobile the body itself scrolls (columns stack); on desktop each column scrolls internally. */}
            <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row min-h-0">
               
               {/* COL 1: INTELLIGENCE & SLA (25%) */}
               <div className="w-full lg:w-1/4 bg-white border-r border-gray-200 p-5 overflow-y-auto hidden lg:block space-y-6">
                  
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><Gauge size={12}/> SLA Health</h4>
                     <div className="space-y-3">
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                           <div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase">Mandatory Touches</span><span className="text-[10px] font-black">{selectedDeal.callCount || 0}/5</span></div>
                           <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full transition-all ${((selectedDeal.callCount||0)/5)*100 >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} style={{width: `${Math.min(100, ((selectedDeal.callCount||0)/5)*100)}%`}}></div>
                           </div>
                        </div>
                        <div className={`p-3 rounded-xl border flex items-center justify-between ${getSLAHealth(selectedDeal).callSLA === 'breached' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                           <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><PhoneCall size={12}/> 12Hr Initial Call</span>
                           <CheckCircle size={14} className={getSLAHealth(selectedDeal).callSLA === 'breached' ? 'hidden' : 'block'}/>
                           <AlertCircle size={14} className={getSLAHealth(selectedDeal).callSLA === 'breached' ? 'block' : 'hidden'}/>
                        </div>
                     </div>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><Target size={12}/> Deal Settings</h4>
                     <div className="space-y-3">
                         <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Status Pipeline</label>
                            <select value={selectedDeal.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-slate-900 outline-none cursor-pointer">
                               {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Lead Tag</label>
                            <select value={selectedDeal.leadTag || ''} onChange={(e) => handleTagUpdate(e.target.value)} className="w-full bg-purple-50 border border-purple-200 text-purple-800 rounded-lg p-2 text-xs font-bold outline-none cursor-pointer">
                                <option value="">No Tag</option>
                                <option value="PURCHASE">PURCHASE</option>
                                <option value="First Time Buyer">First Time Buyer</option>
                                <option value="Renewal">Renewal</option>
                                <option value="Refinance">Refinance</option>
                                <option value="Reverse Mortgage">Reverse Mortgage</option>
                                <option value="Realtor Lead">Realtor Lead</option>
                            </select>
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
                                defaultValue={selectedDeal.loanAmount || ''}
                                onBlur={(e) => {
                                    const amt = Number(e.target.value || 0);
                                    const com = Number(selectedDeal.expectedCommission ?? Math.round(amt * 0.01));
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
                                defaultValue={selectedDeal.expectedCommission || ''}
                                onBlur={(e) => handleDealValueSave(Number(selectedDeal.loanAmount || 0), Number(e.target.value || 0))}
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
                        <p className="mb-1"><strong>Source:</strong> {selectedDeal.referrerId === 'INDIBRICK_WEB' ? 'IndiBrick Landing Page' : 'Realtor Partner'}</p>
                        <p><strong>Name:</strong> {selectedDeal.referrerName}</p>
                     </div>
                  </div>

               </div>

               {/* COL 2: INTERACTION & TIMELINE (50%) */}
               <div className="w-full lg:w-1/2 flex flex-col bg-[#F8FAFC] min-h-0">
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
                                <option value="">Select Assignee...</option><option value="ADMIN_INBOX">📥 Admin Inbox (HQ)</option>
                                {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
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
                                 await fetch('/api/partner/request-document', {
                                     method: 'POST', headers: {'Content-Type': 'application/json'},
                                     body: JSON.stringify({ leadId: selectedDeal.id, documentNames: [docRequests[0]], clientEmail: selectedDeal.clientEmail, clientName: selectedDeal.clientName, agentName: fullName })
                                 });
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
                            <textarea className={`w-full bg-white border-2 p-4 pr-12 rounded-xl font-medium focus:border-black outline-none transition resize-none text-sm shadow-sm ${logType === 'note_internal' ? 'border-amber-200 focus:border-amber-500 bg-amber-50/30' : 'border-gray-200'}`} rows={2} placeholder={logType === 'log_call' ? "Notes from call (will increment SLA counter)..." : logType === 'note_client' ? "Type a message directly to the client's portal..." : "Type an internal note visible only to the deal team..."} value={logInput} onChange={e => setLogInput(e.target.value)} required />
                            <button className={`absolute right-2 bottom-3 p-2 rounded-lg text-white transition shadow-sm ${logType === 'log_call' ? 'bg-blue-600 hover:bg-blue-700' : logType === 'note_internal' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-black'}`}><Send size={14} /></button>
                          </form>
                      )}
                  </div>

                  {/* Scrollable content area — wraps NBA + Summary + Timeline so they scroll as one cohesive panel
                      (without this wrapper, NBA/Summary stole height from the timeline and broke its overflow scroll). */}
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">

                  {/* Next Best Action — heuristic-driven nudge so agents never have to think "what now?" */}
                  {(() => {
                      const dealTasks = allTasks.filter(t => t.referralId === selectedDeal.id && t.status !== 'Completed' && t.dueDate >= todayDateString);
                      const callCount = selectedDeal.callCount || 0;
                      const requiredDocs = selectedDeal.requiredDocuments || [];
                      const vault = selectedDeal.vault || [];
                      const days = getDaysInStage(selectedDeal);
                      const sla = getSLAHealth(selectedDeal);
                      const isTerminal = FUNDED_STATUSES.includes(selectedDeal.status) || LOST_STATUSES.includes(selectedDeal.status);

                      if (isTerminal) return null;

                      let cta: { tone: string; icon: any; title: string; sub: string; action?: () => void; actionLabel?: string } | null = null;

                      if (sla.callSLA === 'breached' && callCount === 0) {
                          cta = { tone: 'red', icon: AlertCircle, title: 'SLA Breach — call now', sub: `Lead has gone untouched for ${Math.floor(sla.hoursSinceCreation)} hours. Speed-to-lead drops conversion ~50% past 24h.`, actionLabel: selectedDeal.clientPhone ? 'Call client' : undefined, action: selectedDeal.clientPhone ? () => window.location.href = `tel:${selectedDeal.clientPhone}` : undefined };
                      } else if (callCount < 5 && dealTasks.length === 0) {
                          cta = { tone: 'blue', icon: PhoneCall, title: `Log call #${callCount + 1} of 5`, sub: 'No upcoming tasks scheduled. Brokerage data shows files convert at 6+ touches.', actionLabel: 'Log a call', action: () => { setLogType('log_call'); } };
                      } else if (requiredDocs.length === 0 && callCount >= 1) {
                          cta = { tone: 'blue', icon: Bot, title: 'Run AI Intake to generate doc checklist', sub: 'You\'ve made contact. Capture income/credit/scenario data so AI can build a B-20 underwriter summary + client doc list.', actionLabel: 'Launch AI Intake', action: () => { resetIntakeForm(); setShowIntakeForm(true); } };
                      } else if (requiredDocs.length > 0 && vault.length === 0) {
                          cta = { tone: 'amber', icon: FileText, title: 'No documents uploaded yet', sub: `${requiredDocs.length} document${requiredDocs.length === 1 ? '' : 's'} requested. Send a portal reminder if the client hasn't logged in.`, actionLabel: 'Activate & email portal', action: () => handleCategoryUpdate('active') };
                      } else if (days >= 5 && dealTasks.length === 0) {
                          cta = { tone: 'amber', icon: Clock, title: `Stalled ${days} days in "${selectedDeal.status}"`, sub: 'No follow-up scheduled. Update status or set a task before this deal goes cold.', actionLabel: 'Schedule task', action: () => setLogType('task') };
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
                              {selectedDeal.dealSummary || "No summary generated. Launch AI Intake to populate."}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Timeline — flows inside the parent scrollable wrapper, no separate scroll */}
                  <div className="p-5 space-y-4">
                    {selectedDeal.timeline?.slice().reverse().map((log: any, i: number) => {
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

               {/* COL 3: DEAL TEAM & VAULT (25%) */}
               <div className="w-full lg:w-1/4 bg-white border-l border-gray-200 p-5 overflow-y-auto hidden lg:block space-y-8">
                  
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
                            {selectedDeal.clientPhone ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <a href={`tel:${selectedDeal.clientPhone}`} className="flex-1 flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 transition px-3 py-2 rounded-lg text-white">
                                        <PhoneCall size={12}/> {selectedDeal.clientPhone}
                                    </a>
                                    <a href={`sms:${selectedDeal.clientPhone}`} aria-label="Send SMS" className="bg-white/10 hover:bg-white hover:text-slate-900 transition px-3 py-2 rounded-lg flex items-center justify-center" title="Send SMS">
                                        <Send size={12}/>
                                    </a>
                                </div>
                            ) : (
                                <p className="text-xs font-bold mb-2 flex items-center gap-2 text-gray-500"><PhoneCall size={12}/> No phone on file</p>
                            )}
                            {selectedDeal.clientEmail ? (
                                <a href={`mailto:${selectedDeal.clientEmail}`} className="text-xs font-bold flex items-center gap-2 truncate text-blue-300 hover:text-white transition"><Mail size={12}/> {selectedDeal.clientEmail}</a>
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
                     </div>
                     <div className="space-y-2 mb-3">
                         <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">M</div>
                             <div className="truncate">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mortgage Agent</p>
                                <p className="text-xs font-bold text-slate-900 truncate">{selectedDeal.assignedAgentName === 'Admin Triage' ? 'IndiBrick HQ' : selectedDeal.assignedAgentName}</p>
                             </div>
                         </div>
                         {selectedDeal.referrerId !== 'INDIBRICK_WEB' && (
                             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                 <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs shrink-0">R</div>
                                 <div className="truncate">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Referral Partner</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{selectedDeal.referrerName}</p>
                                 </div>
                             </div>
                         )}
                         {selectedDeal.participants?.map((p: any, idx: number) => (
                             <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                 <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-black text-xs shrink-0"><User size={14}/></div>
                                 <div className="truncate">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">{p.role}</p>
                                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                     
                     <div className="flex items-center gap-2">
                        <select onChange={handleAddParticipant} value="" className="flex-1 bg-white border border-gray-200 text-[10px] font-bold uppercase rounded-lg p-2 outline-none cursor-pointer">
                           <option value="" disabled>+ Add Participant</option>
                           {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName} ({p.role?.replace('partner_','')})</option>)}
                        </select>
                     </div>
                     <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase text-center"><Mail size={10} className="inline mr-1"/> Team notified on updates</p>
                  </div>

                  {/* Document Vault */}
                  {selectedDeal.vault && selectedDeal.vault.length > 0 && (
                     <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><FileText size={12}/> Document Vault</h4>
                        <div className="space-y-2">
                           {selectedDeal.vault.map((doc: any, i: number) => (
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
      )}

      {/* 🤖 AI CHAT INTAKE WIZARD OVERLAY 🤖 */}
      {showIntakeForm && selectedDeal && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-fade-in">
            <div className="bg-black text-white p-6 flex justify-between items-center shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><Bot size={20}/></div>
                   <div>
                      <h2 className="text-xl font-black uppercase tracking-wide">AI Intake — {intakePhase === 'review' ? 'Review & Send' : intakePhase === 'sending' ? 'Sending…' : 'Capture Scenario'}</h2>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Client: {selectedDeal.clientName}</p>
                   </div>
                </div>
                <button onClick={() => { setShowIntakeForm(false); resetIntakeForm(); }} className="hover:text-gray-300"><X size={24}/></button>
            </div>

            {/* Phase progress bar */}
            <div className="w-full bg-gray-100 h-1.5">
                <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: intakePhase === 'review' ? '85%' : intakePhase === 'sending' ? '100%' : '35%' }}></div>
            </div>

            {/* PHASE: SINGLE-PAGE FORM — optimized for fast keyboard entry during a call */}
            {intakePhase === 'form' && (
                <form
                    onSubmit={(e) => { e.preventDefault(); generateIntake(); }}
                    className="flex-1 flex flex-col min-h-0"
                >
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
                                        <select autoFocus value={intakeData.goal} onChange={e => setIntakeData(p => ({ ...p, goal: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                                            <option>Purchase</option><option>Refinance</option><option>Renewal Transfer</option>
                                        </select>
                                    </label>
                                    {intakeData.goal === 'Purchase' && (
                                        <label className="col-span-2 md:col-span-2 animate-fade-in">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">First-Time Home Buyer?</span>
                                            <select value={intakeData.fthb} onChange={e => setIntakeData(p => ({ ...p, fthb: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
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
                                        <input type="text" value={intakeData.subjectAddress} onChange={e => setIntakeData(p => ({ ...p, subjectAddress: e.target.value }))} placeholder="123 Main St, Toronto ON" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                    </label>
                                    <label className="col-span-1 md:col-span-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">{intakeData.goal === 'Purchase' ? 'Purchase Price ($)' : 'Est. Market Value ($)'}</span>
                                        <input type="number" inputMode="decimal" value={intakeData.propertyValue} onChange={e => setIntakeData(p => ({ ...p, propertyValue: e.target.value }))} placeholder="e.g. 850000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                    </label>
                                    <label className="col-span-1 md:col-span-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Annual Property Taxes ($)</span>
                                        <input type="number" inputMode="decimal" value={intakeData.propertyTaxes} onChange={e => setIntakeData(p => ({ ...p, propertyTaxes: e.target.value }))} placeholder="e.g. 4500" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                    </label>
                                    <label className="col-span-2 md:col-span-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Rental Income from this Property?</span>
                                        <select value={intakeData.hasRentalIncome} onChange={e => setIntakeData(p => ({ ...p, hasRentalIncome: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                                            <option>No</option><option>Yes</option>
                                        </select>
                                    </label>
                                    {intakeData.hasRentalIncome === 'Yes' && (
                                        <>
                                            <label className="col-span-1 md:col-span-1 animate-fade-in">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Monthly Rent ($)</span>
                                                <input type="number" inputMode="decimal" value={intakeData.monthlyRent} onChange={e => setIntakeData(p => ({ ...p, monthlyRent: e.target.value }))} placeholder="e.g. 2400" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                            </label>
                                            <label className="col-span-1 md:col-span-1 animate-fade-in">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Basement Legality</span>
                                                <select value={intakeData.basementStatus} onChange={e => setIntakeData(p => ({ ...p, basementStatus: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                                                    <option>Legal</option><option>Not Legal</option><option>Not Sure</option>
                                                </select>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* ─── DOWN PAYMENT (Purchase only) ─── */}
                            {intakeData.goal === 'Purchase' && (
                                <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-fade-in">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">3</div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Down Payment</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <label className="col-span-2 md:col-span-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Down Payment ($)</span>
                                            <input type="number" inputMode="decimal" value={intakeData.downPayment} onChange={e => setIntakeData(p => ({ ...p, downPayment: e.target.value }))} placeholder="e.g. 75000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                        </label>
                                        <label className="col-span-2 md:col-span-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Source</span>
                                            <select value={intakeData.downPaymentSource} onChange={e => setIntakeData(p => ({ ...p, downPaymentSource: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                                                <option>Savings</option><option>Gift</option><option>RRSP HBP</option><option>Sale of Property</option><option>Other</option>
                                            </select>
                                        </label>
                                    </div>
                                </section>
                            )}

                            {/* ─── EXISTING MORTGAGE (Refi/Renewal only) ─── */}
                            {intakeData.goal !== 'Purchase' && (
                                <section className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm animate-fade-in">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">3</div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Existing Mortgage</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <label className="col-span-2 md:col-span-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Lender</span>
                                            <input type="text" value={intakeData.currentLender} onChange={e => setIntakeData(p => ({ ...p, currentLender: e.target.value }))} placeholder="TD, Scotia, MCAP…" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                        </label>
                                        <label className="col-span-1 md:col-span-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Balance ($)</span>
                                            <input type="number" inputMode="decimal" value={intakeData.currentBalance} onChange={e => setIntakeData(p => ({ ...p, currentBalance: e.target.value }))} placeholder="e.g. 450000" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                        </label>
                                        <label className="col-span-1 md:col-span-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Rate (%)</span>
                                            <input type="number" inputMode="decimal" step="0.01" value={intakeData.currentRate} onChange={e => setIntakeData(p => ({ ...p, currentRate: e.target.value }))} placeholder="e.g. 5.24" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                        </label>
                                        <label className="col-span-2 md:col-span-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Renewal / Maturity Date</span>
                                            <input type="date" value={intakeData.renewalDate} onChange={e => setIntakeData(p => ({ ...p, renewalDate: e.target.value }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
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
                                        <select value={intakeData.numApplicants} onChange={e => setIntakeData(p => ({ ...p, numApplicants: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                                            <option>1</option><option>2</option><option>3+</option>
                                        </select>
                                    </label>
                                    <label className="col-span-1 md:col-span-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Estimated Credit Score</span>
                                        <select value={intakeData.creditScore} onChange={e => setIntakeData(p => ({ ...p, creditScore: e.target.value as any }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
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
                                            <select value={intakeData.empType} onChange={e => setIntakeData(p => ({ ...p, empType: e.target.value as any }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                                                <option>T4 / Salaried</option><option>Self-Employed / Business Owner</option><option>Hourly / Part-Time</option>
                                            </select>
                                        </label>
                                        <label className="col-span-2 md:col-span-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Annual Income ($)</span>
                                            <input type="number" inputMode="decimal" value={intakeData.annualIncome} onChange={e => setIntakeData(p => ({ ...p, annualIncome: e.target.value }))} placeholder="e.g. 85000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                        </label>
                                        {intakeData.empType.startsWith('Self-Employed') && (
                                            <>
                                                <label className="col-span-1 md:col-span-2 animate-fade-in">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Line 15000 — Last Year ($)</span>
                                                    <input type="number" inputMode="decimal" value={intakeData.incomeYear1} onChange={e => setIntakeData(p => ({ ...p, incomeYear1: e.target.value }))} placeholder="e.g. 82000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                                </label>
                                                <label className="col-span-1 md:col-span-2 animate-fade-in">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Line 15000 — Prior Year ($)</span>
                                                    <input type="number" inputMode="decimal" value={intakeData.incomeYear2} onChange={e => setIntakeData(p => ({ ...p, incomeYear2: e.target.value }))} placeholder="e.g. 78000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Applicant 2 (only when more than 1) */}
                                {intakeData.numApplicants !== '1' && (
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 animate-fade-in">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-3">Applicant 2</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <label className="col-span-2 md:col-span-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Employment Type</span>
                                                <select value={intakeData.coEmpType} onChange={e => setIntakeData(p => ({ ...p, coEmpType: e.target.value as any }))} className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black cursor-pointer">
                                                    <option>T4 / Salaried</option><option>Self-Employed / Business Owner</option><option>Hourly / Part-Time</option>
                                                </select>
                                            </label>
                                            <label className="col-span-2 md:col-span-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Annual Income ($)</span>
                                                <input type="number" inputMode="decimal" value={intakeData.coAnnualIncome} onChange={e => setIntakeData(p => ({ ...p, coAnnualIncome: e.target.value }))} placeholder="e.g. 70000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                            </label>
                                            {intakeData.coEmpType.startsWith('Self-Employed') && (
                                                <>
                                                    <label className="col-span-1 md:col-span-2 animate-fade-in">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Line 15000 — Last Year ($)</span>
                                                        <input type="number" inputMode="decimal" value={intakeData.coIncomeYear1} onChange={e => setIntakeData(p => ({ ...p, coIncomeYear1: e.target.value }))} placeholder="e.g. 68000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                                    </label>
                                                    <label className="col-span-1 md:col-span-2 animate-fade-in">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Line 15000 — Prior Year ($)</span>
                                                        <input type="number" inputMode="decimal" value={intakeData.coIncomeYear2} onChange={e => setIntakeData(p => ({ ...p, coIncomeYear2: e.target.value }))} placeholder="e.g. 65000" className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
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
                                        <input type="number" inputMode="decimal" value={intakeData.monthlyDebtPayments} onChange={e => setIntakeData(p => ({ ...p, monthlyDebtPayments: e.target.value }))} placeholder="e.g. 850 (cars, CCs, lines)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                    </label>
                                    <label className="col-span-2 md:col-span-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Notes (optional)</span>
                                        <input type="text" value={intakeData.substantialDebts} onChange={e => setIntakeData(p => ({ ...p, substantialDebts: e.target.value }))} placeholder="$500 Auto, $350 CCs, $100 LOC" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-black" />
                                    </label>
                                </div>

                                {/* Other properties */}
                                <div className="flex justify-between items-center mb-2 mt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Other Real Estate Owned</p>
                                    <button type="button" onClick={addOtherProperty} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus size={12}/> Add Property</button>
                                </div>
                                {intakeData.otherPropertiesList.length === 0 ? (
                                    <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center bg-gray-50">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No other properties added</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {intakeData.otherPropertiesList.map((prop, idx) => (
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

                            {/* Live metric preview — recomputes as the agent types, so they have a sense of where the file lands before hitting Generate */}
                            {(() => {
                                const m = computeMortgageMetrics(intakeDataToFinancials(intakeData));
                                if (!m || Number(intakeData.propertyValue || 0) === 0) return null;
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
                            <button type="button" onClick={() => { setShowIntakeForm(false); resetIntakeForm(); }} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 transition">Cancel</button>
                            <button
                                type="submit"
                                disabled={intakeGenerating}
                                className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition flex items-center gap-2 shadow-xl disabled:opacity-50"
                            >
                                {intakeGenerating ? <Loader2 className="animate-spin" size={14}/> : <Bot size={14}/>}
                                {intakeGenerating ? 'Analyzing file…' : 'Generate Summary & Checklist'}
                                {!intakeGenerating && <ArrowRight size={14}/>}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* PHASE: REVIEW & CONFIRM */}
            {intakePhase === 'review' && (() => {
                const m = computeMortgageMetrics(intakeFinancials);
                return (
                <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 md:p-10 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="mb-6">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Review before sending to {selectedDeal.clientName}</h3>
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
                            value={intakeSummary}
                            onChange={(e) => setIntakeSummary(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Checklist */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><FileText size={12}/> Document Checklist ({intakeChecklist.length})</h4>
                        </div>
                        <ul className="space-y-2 mb-3">
                            {intakeChecklist.map((item, i) => (
                                <li key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 group">
                                    <CheckCircle size={14} className="text-green-500 shrink-0"/>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => setIntakeChecklist(prev => prev.map((it, idx) => idx === i ? e.target.value : it))}
                                        className="flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIntakeChecklist(prev => prev.filter((_, idx) => idx !== i))}
                                        className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600"
                                        aria-label="Remove"
                                    ><Trash2 size={14}/></button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={intakeNewItem}
                                onChange={(e) => setIntakeNewItem(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (intakeNewItem.trim()) { setIntakeChecklist(prev => [...prev, intakeNewItem.trim()]); setIntakeNewItem(''); } } }}
                                placeholder="Add another document (e.g. 2024 T4, void cheque)…"
                                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => { if (intakeNewItem.trim()) { setIntakeChecklist(prev => [...prev, intakeNewItem.trim()]); setIntakeNewItem(''); } }}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-sm"
                            ><Plus size={14} className="inline mr-1"/> Add</button>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => setIntakePhase('form')}
                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                        ><ChevronLeft size={14} className="inline mr-1"/> Back to form</button>

                        <div className="flex flex-col items-end">
                            {!selectedDeal.clientEmail && <p className="text-[10px] font-bold text-red-600 mb-1 uppercase tracking-widest">No email on file — checklist will save but not be emailed</p>}
                            <button
                                type="button"
                                disabled={intakeChecklist.length === 0 || !intakeSummary.trim()}
                                onClick={confirmIntake}
                                className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition flex items-center gap-2 shadow-2xl disabled:opacity-40"
                            ><CheckCircle size={16}/> Confirm & {selectedDeal.clientEmail ? 'Email Client' : 'Save'}</button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* PHASE: SENDING */}
            {intakePhase === 'sending' && (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    <Loader2 size={40} className="animate-spin text-blue-600 mb-4"/>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Saving & emailing client…</h3>
                    <p className="text-sm text-gray-500 mt-2">Updating the CRM and sending the secure portal link.</p>
                </div>
            )}

        </div>
      )}
    </div>
  );
}