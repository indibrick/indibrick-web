'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../AdminContext';
import { CRMService } from '../../services/CRMService';
import { Referral, Task, ActivityLog } from '../../types';
import { 
  Plus, Send, X, Wallet, Activity, PhoneCall, Calendar, Mail, Network, Trash2,
  Filter, Star, Zap, BrainCircuit, ShieldCheck, Target, CheckCircle, Loader2, 
  Briefcase, LogOut, ChevronRight, Clock, User, Search, FileText, ArrowDownLeft, Users,
  ChevronLeft, AlertCircle, Shield, Landmark, ArrowUpRight, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore'; 
import { db } from '../../firebase'; 

export default function PartnerCRM() {
  const { user, loading, logout } = useAdmin();
  const router = useRouter();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'pipeline' | 'analyzer' | 'calendar'>('pipeline');
  const [pipelineView, setPipelineView] = useState<'all' | 'mine' | 'incoming' | 'outbound'>('mine');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState(''); 
  
  const [allReferrals, setAllReferrals] = useState<Referral[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); 
  const [ecosystemPartners, setEcosystemPartners] = useState<any[]>([]); 
  
  const [referralVolume, setReferralVolume] = useState('$0.00');
  const [fullName, setFullName] = useState(''); 
  const [partnerRole, setPartnerRole] = useState<string>('partner_realtor');

  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [logType, setLogType] = useState<'note' | 'log_call' | 'log_email' | 'task' | 'route' | 'doc' | 'borrow_direct'>('note');
  const [logInput, setLogInput] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [targetPartnerId, setTargetPartnerId] = useState('');
  const [docRequests, setDocRequests] = useState<string[]>(['']); 
  
  // --- BORROW DIRECT STATE ---
  const [bdDeal, setBdDeal] = useState<any>(null);
  const [bdBids, setBdBids] = useState<any[]>([]);
  const [bdForm, setBdForm] = useState({ loanAmount: '', ltv: '', position: '1st', propertyType: 'Detached', location: '', aiSummary: '' });
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // --- FORMS ---
  const [showNewReferralForm, setShowNewReferralForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', service: 'General Inquiry', message: '', assignedTo: 'ADMIN_INBOX' });

  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ description: '', dueDate: '', referralId: 'general' });

  const [analyzerForm, setAnalyzerForm] = useState({ income: '', downPayment: '', propertyValue: '', creditScore: '', debts: '', notes: '' });
  const [analyzerStatus, setAnalyzerStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analyzerResult, setAnalyzerResult] = useState<any>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // --- UNIQUE ROLE PIPELINE STAGES ---
  const getPipelineStages = (role: string) => {
      switch(role) {
          case 'partner_realtor': 
              return ['Lead Received', 'Showing', 'Offer Made', 'Conditional', 'Firm Sale', 'Closed', 'Lost'];
          case 'partner_lawyer': 
              return ['File Opened', 'Title Search', 'Docs Prepared', 'Signing', 'Closed', 'Cancelled'];
          case 'partner_referral': 
              return ['Referred', 'Contacted', 'Processing', 'Funded / Paid', 'Declined'];
          default: // Admin & Mortgage
              return ['Received', 'Contacted', 'Underwriting', 'Approved', 'Firm / Conditional', 'Closed', 'Declined'];
      }
  };
  const PIPELINE_STAGES = getPipelineStages(partnerRole);

  // --- AUTH & INIT ---
  useEffect(() => {
    if (!loading && !user) router.push('/partner/login');
    else if (user) loadProfileAndData();
  }, [user, loading, router]);

  // Load BorrowDirect Status when a deal is clicked
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
                setBdDeal(null);
                setBdBids([]);
             }
             setBdForm(prev => ({...prev, location: selectedDeal.city || ''}));
          } catch (e) {
             console.error("BorrowDirect fetch error", e);
          }
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
            if (currentRole === 'admin' && pipelineView === 'mine') setPipelineView('all');
        }
        setFullName(loadedFullName);
        
        let activePipeline: Referral[] = [];
        if (currentRole === 'admin') {
            const snap = await getDocs(collection(db, 'referrals'));
            activePipeline = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Referral[];
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
        } catch (taskErr) {
            fetchedTasks = await CRMService.fetchDailyTasks(user.uid);
        }
        setAllTasks(fetchedTasks);

        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsersList = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() as any }));
        
        // VITAL: Non-admins ONLY get admins returned in this list for routing.
        if (currentRole === 'admin') setEcosystemPartners(allUsersList);
        else setEcosystemPartners(allUsersList.filter(u => u.role === 'admin'));

        setSelectedDeal(currentSelected => {
            if (!currentSelected) return null;
            const updated = activePipeline.find(d => d.id === currentSelected.id);
            return updated ? { ...updated } : currentSelected;
        });
    } catch (e) { console.error("Data Load Error", e); }
  };

  // --- CALENDAR HELPERS ---
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const todayDateString = new Date().toISOString().split('T')[0];
  const todaysTasks = allTasks.filter(t => t.dueDate === todayDateString && t.status !== 'Completed');

  const handlePrevMonth = () => { currentMonth === 0 ? (setCurrentMonth(11), setCurrentYear(currentYear - 1)) : setCurrentMonth(currentMonth - 1); };
  const handleNextMonth = () => { currentMonth === 11 ? (setCurrentMonth(0), setCurrentYear(currentYear + 1)) : setCurrentMonth(currentMonth + 1); };

  const handleGoogleSync = async () => {
      setIsSyncingGoogle(true);
      try {
          const res = await fetch('/api/partner/calendar-sync', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user?.uid, tasks: allTasks })
          });
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

      await fetch('/api/partner/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              referralId: newTask.referralId,
              clientName: clientName,
              assigneeId: user.uid,
              dueDate: newTask.dueDate,
              description: newTask.description,
              status: 'Pending'
          })
      });

      setShowNewTaskForm(false);
      setNewTask({ description: '', dueDate: '', referralId: 'general' });
      loadProfileAndData();
  };

  const handleAnalyzeDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzerForm.income.trim() || !analyzerForm.propertyValue.trim()) return;
    setAnalyzerStatus('loading'); setAnalyzerResult(null);

    const scenarioString = `Income: $${analyzerForm.income}. Down Payment: $${analyzerForm.downPayment}. Property Value: $${analyzerForm.propertyValue}. Credit: ${analyzerForm.creditScore}. Debts: $${analyzerForm.debts}. Notes: ${analyzerForm.notes}`;

    try {
        const res = await fetch('/api/partner/deal-analyzer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario: scenarioString, partnerName: fullName })
        });
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
    
    if (assignedAgentId === user.uid) {
        assignedAgentName = fullName;
    } else if (assignedAgentId !== 'ADMIN_INBOX') {
        const partner = ecosystemPartners.find(p => p.uid === assignedAgentId);
        if (partner) {
            assignedAgentName = partner.displayName;
            
            // FIREBASE EMAIL TRIGGER FOR NEW LEAD ASSIGNMENT
            if (partner.email) {
                try {
                    await addDoc(collection(db, "mail"), {
                        to: partner.email,
                        message: {
                            subject: `IndiBrick CRM: New Lead Assigned (${newClient.name})`,
                            html: `<div style="font-family: sans-serif; padding: 20px;">
                                      <h2>New Lead Assigned</h2>
                                      <p><strong>${fullName}</strong> has assigned a new lead to your IndiBrick pipeline.</p>
                                      <p><strong>Client:</strong> ${newClient.name}</p>
                                      <p><strong>Service Needed:</strong> ${newClient.service}</p>
                                      <p>Log in to your Partner Portal to view full details and contact the client.</p>
                                   </div>`
                        }
                    });
                } catch(emailErr) { console.warn("Failed to send assignment email", emailErr); }
            }
        }
    }

    const payload = { ...newClient, type: 'Manual Entry', dealCategory: 'potential', assignedAgentId, assignedAgentName };
    await CRMService.createReferral({ uid: user.uid, role: partnerRole, displayName: fullName } as any, payload as any);
    setShowNewReferralForm(false);
    setNewClient({ name: '', phone: '', email: '', service: 'General Inquiry', message: '', assignedTo: 'ADMIN_INBOX' });
    loadProfileAndData();
  };

  // --- BORROW DIRECT LOGIC ---
  const generateAISummary = () => {
     setIsGeneratingSummary(true);
     setTimeout(() => {
        const text = `High-yield private debt opportunity located in ${bdForm.location || 'Ontario'}. Client is seeking $${Number(bdForm.loanAmount).toLocaleString()} in ${bdForm.position} position against a ${bdForm.propertyType} property. Estimated LTV is solid at ${bdForm.ltv}%. Exit strategy aligns with 12-month refinance timeline. Appraisals and credit documentation available upon term sheet submission.`;
        setBdForm(prev => ({...prev, aiSummary: text}));
        setIsGeneratingSummary(false);
     }, 1500);
  };

  const publishToBorrowDirect = async () => {
     if(!bdForm.loanAmount || !bdForm.ltv || !bdForm.aiSummary) return alert("Please fill all fields and generate summary.");
     setIsPublishing(true);
     try {
        const payload = {
            referralId: selectedDeal.id,
            loanAmount: Number(bdForm.loanAmount),
            ltv: Number(bdForm.ltv),
            position: bdForm.position,
            propertyType: bdForm.propertyType,
            location: bdForm.location || 'Ontario',
            aiSummary: bdForm.aiSummary,
            status: 'Live',
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'borrow_direct_deals'), payload);
        setBdDeal({ id: docRef.id, ...payload });
        
        await CRMService.logActivity(selectedDeal.id, {
            type: 'note', author: 'System Admin', 
            content: `🛡️ Pushed to BorrowDirect Marketplace (Loan: $${payload.loanAmount}, LTV: ${payload.ltv}%)`, 
            timestamp: new Date().toISOString()
        });
        
        loadProfileAndData();
     } catch (err) {
        console.error(err);
        alert("Failed to publish to marketplace.");
     } finally {
        setIsPublishing(false);
     }
  };

  const awardBid = async (bid: any) => {
     try {
        await updateDoc(doc(db, "borrow_direct_bids", bid.id), { status: 'Accepted' });
        await updateDoc(doc(db, "borrow_direct_deals", bdDeal.id), { status: 'Awarded', awardedToLenderId: bid.lenderId });
        setBdDeal({...bdDeal, status: 'Awarded', awardedToLenderId: bid.lenderId});
        
        await CRMService.logActivity(selectedDeal.id, {
            type: 'note', author: 'System Admin', 
            content: `🏆 BorrowDirect Deal Awarded to ${bid.lenderName}! Client details and Vault unlocked for lender.`, 
            timestamp: new Date().toISOString()
        });

        try {
            const lenderDoc = await getDoc(doc(db, "users", bid.lenderId));
            if (lenderDoc.exists() && lenderDoc.data().email) {
                await addDoc(collection(db, "mail"), {
                    to: lenderDoc.data().email,
                    message: {
                        subject: `🏆 Deal Awarded: $${bdDeal.loanAmount.toLocaleString()} Mortgage`,
                        html: `<div style="font-family: sans-serif; padding: 20px;">
                                <h2 style="color: #0f172a;">Congratulations ${bid.lenderName}!</h2>
                                <p style="color: #475569; font-size: 16px;">Your term sheet for the <strong>$${bdDeal.loanAmount.toLocaleString()}</strong> mortgage has been <strong>ACCEPTED</strong>.</p>
                                <p style="color: #16a34a; font-weight: bold;">✓ The client file and document vault are now unlocked.</p>
                              </div>`
                    }
                });
            }
        } catch(e) { console.warn("Email dispatch error", e); }

        loadProfileAndData();
        alert("Deal Awarded! Lender notified and client file unlocked.");
     } catch (e) {
        alert("Error awarding deal.");
     }
  };

  // --- CRM ACTIONS ---
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !user) return;

    if (logType === 'route') {
      let routedName = 'Admin Triage';
      if (targetPartnerId === user.uid) {
          routedName = fullName;
          await CRMService.routeLeadToPartner(selectedDeal.id, fullName, user.uid, fullName);
      } else if (targetPartnerId === 'ADMIN_INBOX') {
          await CRMService.routeLeadToPartner(selectedDeal.id, fullName, 'ADMIN_INBOX', 'Admin Triage');
      } else {
         const partner = ecosystemPartners.find(p => p.uid === targetPartnerId);
         if (partner) {
             routedName = partner.displayName;
             await CRMService.routeLeadToPartner(selectedDeal.id, fullName, partner.uid, partner.displayName);
             
             if (partner.email) {
                 try {
                     await addDoc(collection(db, "mail"), {
                         to: partner.email,
                         message: {
                             subject: `IndiBrick CRM: Lead Re-assigned To You (${selectedDeal.clientName})`,
                             html: `<div style="font-family: sans-serif; padding: 20px;">
                                       <h2>Lead Assigned</h2>
                                       <p><strong>${fullName}</strong> has routed an existing deal to your pipeline.</p>
                                       <p><strong>Client:</strong> ${selectedDeal.clientName}</p>
                                       <p>Log in to your Partner Portal to view full details.</p>
                                    </div>`
                         }
                     });
                 } catch(emailErr) {}
             }
         }
      }
      setSelectedDeal(null); setTargetPartnerId(''); loadProfileAndData();
      
    } else if (logType === 'task') {
      await fetch('/api/partner/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              referralId: selectedDeal.id, clientName: selectedDeal.clientName,
              assigneeId: user.uid, dueDate: taskDate, description: logInput, status: 'Pending'
          })
      });
      setLogInput(''); setTaskDate(''); loadProfileAndData();
      
    } else if (logType === 'borrow_direct') {
       // Handled Separately
    } else {
      let prefix = logType === 'log_call' ? '📞 LOGGED CALL: ' : logType === 'log_email' ? '✉️ LOGGED EMAIL: ' : '';
      const finalNoteContent = prefix + logInput;
      const activity: ActivityLog = { type: 'note', author: fullName, content: finalNoteContent, timestamp: new Date().toISOString() };
      
      await CRMService.logActivity(selectedDeal.id, activity);
      setLogInput(''); loadProfileAndData();

      fetch('/api/ai-copilot', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralId: selectedDeal.id, clientName: selectedDeal.clientName, assigneeId: user.uid, noteContent: finalNoteContent })
      }).then(res => res.json()).then(data => {
          if (data.taskScheduled) loadProfileAndData(); 
      }).catch(err => console.error("AI Copilot Error:", err));
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedDeal || !user) return;
    await CRMService.updateReferralStatus(selectedDeal.id, newStatus, fullName);
    setSelectedDeal({ ...selectedDeal, status: newStatus });
    loadProfileAndData();
  };

  const handleCategoryUpdate = async (newCategory: 'active' | 'potential') => {
    if (!selectedDeal || !user) return;
    await updateDoc(doc(db, "referrals", selectedDeal.id), { dealCategory: newCategory });
    setSelectedDeal({ ...selectedDeal, dealCategory: newCategory });
    loadProfileAndData();
  };

  const handleCompleteTask = async (taskId: string) => {
      await fetch('/api/partner/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) });
      loadProfileAndData();
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this lead?")) {
      await CRMService.deleteReferral(id);
      setSelectedDeal(null);
      loadProfileAndData();
    }
  };

  const handleOpenTaskDeal = (referralId: string) => {
    if (referralId === 'general') return;
    const found = allReferrals.find(d => d.id === referralId);
    if (found) { setSelectedDeal(found); setLogType('note'); }
  };

  // --- UI HELPERS ---
  const getStageProgress = (status: string) => {
      const index = PIPELINE_STAGES.indexOf(status);
      if (status === 'Declined' || status === 'Lost' || status === 'Cancelled') return 100; 
      return index === -1 ? 10 : Math.max(10, (index / (PIPELINE_STAGES.length - 1)) * 100);
  };

  const getFilteredDeals = () => {
      let filtered = allReferrals;
      if (pipelineView === 'mine') filtered = filtered.filter(r => r.assignedAgentId === user?.uid);
      if (pipelineView === 'incoming') filtered = filtered.filter(r => r.assignedAgentId === 'ADMIN_INBOX');
      if (pipelineView === 'outbound') filtered = filtered.filter(r => r.referrerId === 'INDIBRICK_WEB' && r.assignedAgentId !== 'ADMIN_INBOX');
      if (partnerRole === 'admin' && filterAssignee !== 'all') filtered = filtered.filter(r => r.assignedAgentId === filterAssignee);
      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(r => r.clientName?.toLowerCase().includes(q) || r.clientEmail?.toLowerCase().includes(q) || r.clientPhone?.includes(q));
      }
      return filtered.sort((a, b) => {
          if (sortOrder === 'newest') return new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime();
          return new Date(a.referralDate).getTime() - new Date(b.referralDate).getTime();
      });
  };

  if (loading || !user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 pb-20 md:pb-0">
      
      <style dangerouslySetInnerHTML={{__html: `
        [class*="fixed"][class*="bottom-"]:not(nav) { display: none !important; }
      `}} />

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#0B0F19] text-white flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
             <Zap size={20} className="text-white"/>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter">IndiBrick CRM</h2>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">{partnerRole.replace('partner_', '')}</p>
        </div>
        
        <nav className="space-y-1 px-4 flex-1">
          <button onClick={() => setActiveTab('pipeline')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'pipeline' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <Briefcase size={16} /> Pipeline
          </button>
          {partnerRole === 'admin' && (
              <button onClick={() => setActiveTab('analyzer')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'analyzer' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                 <BrainCircuit size={16} /> Deal Analyzer
              </button>
          )}
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <Calendar size={16} /> Schedule
          </button>
        </nav>
        
        <div className="p-6 border-t border-slate-800">
           <button onClick={logout} className="w-full flex items-center gap-3 text-xs font-bold uppercase text-slate-500 hover:text-red-400 transition">
              <LogOut size={14}/> Sign Out
           </button>
        </div>
      </aside>

      {/* MOBILE APP-STYLE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0B0F19] text-slate-400 z-40 flex justify-between items-center px-6 py-3 pb-safe border-t border-slate-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
         <button onClick={() => setActiveTab('pipeline')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'pipeline' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}>
            <Briefcase size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Deals</span>
         </button>
         {partnerRole === 'admin' && (
             <button onClick={() => setActiveTab('analyzer')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'analyzer' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}>
                <BrainCircuit size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">AI</span>
             </button>
         )}
         <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'calendar' ? 'text-blue-500 scale-110' : 'hover:text-white'}`}>
            <Calendar size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Tasks</span>
         </button>
         <button onClick={logout} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-red-400 transition">
            <LogOut size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Exit</span>
         </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="md:ml-64 flex-1 p-4 md:p-10 overflow-x-hidden">
        
        <header className="flex flex-row justify-between items-center mb-6 md:mb-8 gap-4">
           <div>
             <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
               {activeTab === 'pipeline' ? 'Pipeline' : activeTab === 'analyzer' ? 'AI Underwriter' : 'Calendar'}
             </h1>
             <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 hidden sm:block">
               {activeTab === 'pipeline' ? 'Track, manage, and close your active clients.' : activeTab === 'analyzer' ? 'Instant scenario qualification and structuring.' : 'Manage AI-generated follow-ups and deadlines.'}
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

        {/* --- TAB: PIPELINE --- */}
        {activeTab === 'pipeline' && (
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
              
              {/* LEFT: PIPELINE BOARD */}
              <div className="xl:col-span-8 space-y-4 md:space-y-6">
                 
                 <div className="bg-white p-2.5 md:p-3 rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between items-center gap-3 md:gap-4 overflow-hidden">
                     
                     <div className="w-full flex gap-1 p-1 bg-gray-100/80 rounded-xl lg:w-auto border border-gray-200/50 overflow-x-auto no-scrollbar">
                         {partnerRole === 'admin' ? (
                             <>
                                 <button onClick={() => setPipelineView('all')} className={`flex-1 min-w-[70px] lg:flex-none px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${pipelineView === 'all' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-slate-900'}`}>All</button>
                                 <button onClick={() => setPipelineView('mine')} className={`flex-1 min-w-[70px] lg:flex-none px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${pipelineView === 'mine' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-slate-900'}`}>Mine</button>
                                 <button onClick={() => setPipelineView('incoming')} className={`flex-1 min-w-[70px] lg:flex-none px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${pipelineView === 'incoming' ? 'bg-white shadow-sm text-blue-600 border border-gray-200' : 'text-gray-500 hover:text-slate-900'}`}>Inbox</button>
                             </>
                         ) : (
                             <div className="flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 text-center">My Active Pipeline</div>
                         )}
                     </div>

                     <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                         <div className="flex flex-1 lg:flex-none items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-48 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-50 transition">
                            <Search size={14} className="text-gray-400 shrink-0" />
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full placeholder:text-gray-400" />
                         </div>
                         {partnerRole === 'admin' && (
                             <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl hover:border-gray-300 transition">
                                 <Users size={14} className="text-blue-500 shrink-0" />
                                 <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer max-w-[100px] truncate">
                                     <option value="all">All Agents</option>
                                     <option value="ADMIN_INBOX">Admin Inbox</option>
                                     {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                                 </select>
                             </div>
                         )}
                         <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl hover:border-gray-300 transition">
                             <Filter size={14} className="text-blue-500 shrink-0" />
                             <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer max-w-[100px]">
                                 <option value="newest">Newest</option>
                                 <option value="oldest">Oldest</option>
                             </select>
                         </div>
                     </div>
                 </div>

                 {/* DEAL CARDS WITH STALE DETECTOR */}
                 <div className="space-y-3 md:space-y-4">
                     {getFilteredDeals().map((deal) => {
                        const progress = getStageProgress(deal.status);
                        const isDeclined = deal.status === 'Declined' || deal.status === 'Lost' || deal.status === 'Cancelled';
                        const isWon = deal.status === 'Closed' || deal.status === 'Funded' || deal.status === 'Firm Sale';
                        const activeTask = allTasks.find(t => t.referralId === deal.id && t.status !== 'Completed');

                        const lastActivityMs = deal.timeline && deal.timeline.length > 0 
                            ? new Date(deal.timeline[deal.timeline.length - 1].timestamp).getTime() 
                            : new Date(deal.referralDate || Date.now()).getTime();
                        const daysSinceActivity = Math.floor((Date.now() - lastActivityMs) / (1000 * 60 * 60 * 24));
                        const isStale = daysSinceActivity >= 10 && !['Closed', 'Funded', 'Declined', 'Dead Deal', 'Lost', 'Cancelled'].includes(deal.status);

                        return (
                         <div key={deal.id} onClick={() => { setSelectedDeal(deal); setLogType('note'); }} className="group bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 cursor-pointer relative overflow-hidden">
                             {deal.dealCategory === 'active' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}

                             <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3 md:gap-4">
                                 <div className="flex gap-3 md:gap-4 items-center">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${deal.dealCategory === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}>
                                         {deal.clientName.charAt(0)}
                                     </div>
                                     <div>
                                         <h3 className="text-base md:text-lg font-black text-slate-900 group-hover:text-blue-600 transition tracking-tight">{deal.clientName}</h3>
                                         <div className="flex items-center gap-2 mt-0.5">
                                             <span className={`px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest ${deal.dealCategory === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                 {deal.dealCategory === 'active' ? '🔥 Active' : '⭐ Potential'}
                                             </span>
                                             <span className="text-[10px] md:text-xs text-gray-400 font-medium truncate max-w-[150px]">{deal.serviceNeeded}</span>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-gray-50 pt-3 sm:pt-0">
                                     <div className="text-left sm:text-right hidden md:block">
                                         <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-1">Assigned</p>
                                         <div className="flex items-center gap-1.5 justify-end">
                                             <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[7px] font-bold shrink-0">
                                                 {deal.assignedAgentName === 'Admin Triage' ? 'HQ' : deal.assignedAgentName?.charAt(0) || '?'}
                                             </div>
                                             <p className="text-[10px] font-bold text-slate-700 truncate max-w-[80px]">{deal.assignedAgentName === 'Admin Triage' ? 'Inbox' : deal.assignedAgentName}</p>
                                         </div>
                                     </div>
                                     <div className="text-right flex-1 sm:flex-none">
                                         <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-1 sm:block hidden">Status</p>
                                         <div className="flex items-center justify-end">
                                             {isStale && (
                                                <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border bg-red-50 text-red-600 border-red-200 mr-2 flex items-center gap-1">
                                                    <AlertCircle size={10} /> Stale
                                                </span>
                                             )}
                                             <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${isWon ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                 {deal.status}
                                             </span>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div className="mb-4 hidden md:block">
                                 <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                                     <div className={`h-full rounded-full transition-all duration-1000 ${isDeclined ? 'bg-red-500' : isWon ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
                                 </div>
                             </div>

                             <div className="pt-2 md:pt-3 border-t border-gray-50 flex justify-between items-center">
                                 <div className="flex items-center gap-2 text-[10px] font-medium w-full">
                                     {activeTask ? (
                                        <span className="text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md font-bold truncate max-w-xs"><Calendar size={12}/> Due: {activeTask.description}</span>
                                     ) : (
                                        <span className="text-gray-400 flex items-center gap-1"><Clock size={12}/> No pending tasks.</span>
                                     )}
                                 </div>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-600 transition flex items-center gap-1 shrink-0">Open <ChevronRight size={10}/></span>
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
              </div>

              {/* RIGHT: STATS & TASKS */}
              <div className="xl:col-span-4 space-y-4 md:space-y-6 hidden lg:block">
                 <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 rounded-full blur-2xl -mr-8 -mt-8"></div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 mb-2 text-green-400"><Wallet size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Funded YTD</span></div>
                       <h3 className="text-3xl font-black tracking-tighter">{referralVolume}</h3>
                    </div>
                 </div>

                 <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                     <h3 className="font-black uppercase tracking-tight text-sm mb-4 flex items-center gap-2 text-slate-900"><CheckCircle size={16} className="text-blue-600"/> Today's Action Items</h3>
                     {todaysTasks.length === 0 ? (
                         <p className="text-xs text-gray-400 font-medium bg-gray-50 p-3 rounded-xl text-center">Inbox zero achieved.</p>
                     ) : (
                         <div className="space-y-2">
                             {todaysTasks.map(task => (
                                 <div key={task.id} onClick={() => { if(task.referralId !== 'general') { setActiveTab('pipeline'); handleOpenTaskDeal(task.referralId); } }} className={`group p-3 bg-white border border-gray-100 shadow-sm rounded-xl flex justify-between items-start transition ${task.referralId !== 'general' ? 'cursor-pointer hover:border-blue-400' : ''}`}>
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
      </main>

      {/* 📱 DEAL EDITOR MODAL (WITH BORROW DIRECT INTEGRATION) 📱 */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-end p-0 md:p-4">
          <div className="w-full md:max-w-xl bg-white h-[90vh] md:h-full shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-2xl animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-200 flex flex-col rounded-t-[2rem] md:rounded-[2rem] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 md:p-6 pb-6 md:pb-8 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">{selectedDeal.clientName}</h2>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${selectedDeal.dealCategory === 'active' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                {selectedDeal.dealCategory === 'active' ? 'Active' : 'Potential'}
                            </span>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">📞 {selectedDeal.clientPhone} • ✉️ {selectedDeal.clientEmail}</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={() => handleCategoryUpdate(selectedDeal.dealCategory === 'active' ? 'potential' : 'active')} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"><Star size={14}/></button>
                        <button onClick={() => handleDeleteLead(selectedDeal.id)} className="bg-red-500/20 text-red-400 hover:bg-red-50 hover:text-white p-2 rounded-lg transition"><Trash2 size={14}/></button>
                        <button onClick={() => setSelectedDeal(null)} className="bg-white/10 hover:bg-white text-white hover:text-black p-2 rounded-full md:rounded-lg transition"><X size={14}/></button>
                    </div>
                </div>

                <div className="relative z-10 mt-5 md:mt-6 bg-white/10 p-1 rounded-xl flex gap-1 overflow-x-auto no-scrollbar">
                  {PIPELINE_STAGES.map(status => (
                    <button key={status} onClick={() => handleStatusChange(status)} className={`flex-1 min-w-max py-1.5 px-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition ${selectedDeal.status === status ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-white'}`}>
                      {status}
                    </button>
                  ))}
                </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col p-5 md:p-6 bg-gray-50 overflow-y-auto pb-32 md:pb-6">
              
              {/* THE VAULT VIEWER */}
              {selectedDeal.vault && selectedDeal.vault.length > 0 && (
                 <div className="mb-5 md:mb-6">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                       <FileText size={12}/> Document Vault ({selectedDeal.vault.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {selectedDeal.vault.map((doc: any, i: number) => (
                          <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-400 transition">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg shrink-0">
                                   <FileText size={14} />
                                </div>
                                <div className="truncate">
                                   <p className="text-[10px] font-bold text-slate-900 truncate">{doc.documentType || 'Document'}</p>
                                   <p className="text-[8px] text-gray-400 uppercase tracking-widest truncate">{doc.fileName}</p>
                                </div>
                             </div>
                             <a 
                               href={doc.downloadUrl} target="_blank" rel="noopener noreferrer"
                               className="bg-gray-100 hover:bg-slate-900 hover:text-white p-1.5 rounded-lg transition text-slate-600 shrink-0"
                               title="Download File"
                             >
                                <ArrowDownLeft size={12} className="rotate-180" />
                             </a>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              {/* --- BORROW DIRECT TRACKER (Visible to Partners & Admins) --- */}
              {bdDeal && (
                 <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Landmark size={20}/></div>
                          <div>
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900">BorrowDirect Market</h4>
                             <p className="text-sm font-bold text-amber-800">Status: <span className="bg-white/50 px-2 py-0.5 rounded ml-1 border border-amber-200/50">{bdDeal.status}</span></p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-0.5">Term Sheets</p>
                          <p className="text-2xl font-black text-amber-600 tracking-tighter">{bdBids.length}</p>
                       </div>
                    </div>
                    {bdDeal.status === 'Funded' && (
                       <div className="mt-3 pt-3 border-t border-amber-200 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-green-700 flex items-center gap-1.5"><CheckCircle size={14}/> Referral Bonus Earned</span>
                          <span className="text-xs font-black text-green-800 bg-green-100 px-3 py-1 rounded-md">Processing</span>
                       </div>
                    )}
                 </div>
              )}

              {/* Interaction Controls - UI SQUISH FIX */}
              <div className="flex overflow-x-auto whitespace-nowrap flex-nowrap no-scrollbar gap-2 mb-5 border-b border-gray-200 pb-4 w-full shrink-0">
                  <button onClick={() => setLogType('note')} className={`shrink-0 min-w-max px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'note' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-black'}`}>Note</button>
                  <button onClick={() => setLogType('log_call')} className={`shrink-0 min-w-max px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'log_call' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-600'}`}><PhoneCall size={12} className="inline mr-1"/> Call</button>
                  <button onClick={() => setLogType('log_email')} className={`shrink-0 min-w-max px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'log_email' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-green-600'}`}><Mail size={12} className="inline mr-1"/> Email</button>
                  <button onClick={() => setLogType('task')} className={`shrink-0 min-w-max px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'task' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-500'}`}><Calendar size={12} className="inline mr-1"/> Task</button>
                  <button onClick={() => setLogType('doc')} className={`shrink-0 min-w-max px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'doc' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-yellow-500'}`}><FileText size={12} className="inline mr-1"/> Req Doc</button>
                  
                  {/* ROUTING VISIBLE TO ALL - STRICT DROPDOWN LOGIC */}
                  <button onClick={() => setLogType('route')} className={`shrink-0 min-w-max px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'route' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-purple-600'}`}><Network size={12} className="inline mr-1"/> Assign</button>
                  
                  {partnerRole === 'admin' && (
                    <button onClick={() => setLogType('borrow_direct')} className={`shrink-0 min-w-max px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${logType === 'borrow_direct' ? 'bg-amber-500 text-black shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-amber-500'}`}>
                        <Shield size={12} className="inline mr-1"/> Private Debt
                    </button>
                  )}
              </div>

              {/* Action Input Area - UI SQUISH FIX */}
              <div className="mb-5 shrink-0">
                  {logType === 'borrow_direct' ? (
                      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
                          {bdDeal ? (
                             <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-gray-100 pb-2">Active Term Sheets</h4>
                                {bdBids.length === 0 ? (
                                   <p className="text-xs text-gray-400 font-medium">Awaiting bids from marketplace lenders...</p>
                                ) : (
                                   <div className="space-y-4">
                                      {bdBids.map(bid => (
                                         <div key={bid.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                   <p className="text-[10px] font-black uppercase text-gray-500 mb-1">{bid.lenderName}</p>
                                                   <p className="text-sm font-bold text-slate-900">Rate: {bid.proposedRate}% | Fee: {bid.lenderFee}%</p>
                                                </div>
                                                {bid.status === 'Pending' ? (
                                                   <button onClick={() => awardBid(bid)} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-sm">Award</button>
                                                ) : (
                                                   <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-100 px-3 py-1.5 rounded-lg">Awarded</span>
                                                )}
                                            </div>
                                            {/* RENDER THE CONDITIONS SUBMITTED BY THE LENDER */}
                                            {bid.conditions && (
                                                <div className="bg-white p-3 rounded-lg border border-gray-200 mt-1 text-xs font-medium text-slate-700">
                                                   <span className="text-[9px] font-black uppercase text-gray-400 block mb-1 flex items-center gap-1"><AlertCircle size={10}/> Lender Conditions:</span>
                                                   {bid.conditions}
                                                </div>
                                            )}
                                         </div>
                                      ))}
                                   </div>
                                )}
                             </div>
                          ) : (
                             <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Push to BorrowDirect</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                   <div><label className="text-[9px] font-bold text-gray-400 uppercase">Loan Amount</label><input type="number" value={bdForm.loanAmount} onChange={e=>setBdForm({...bdForm, loanAmount: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm outline-none focus:border-amber-500"/></div>
                                   <div><label className="text-[9px] font-bold text-gray-400 uppercase">Est. LTV %</label><input type="number" value={bdForm.ltv} onChange={e=>setBdForm({...bdForm, ltv: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm outline-none focus:border-amber-500"/></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                   <div>
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Position</label>
                                      <select value={bdForm.position} onChange={e=>setBdForm({...bdForm, position: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm outline-none focus:border-amber-500 appearance-none cursor-pointer">
                                         <option>1st</option><option>2nd</option><option>3rd</option>
                                      </select>
                                   </div>
                                   <div>
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Property Type</label>
                                      <select value={bdForm.propertyType} onChange={e=>setBdForm({...bdForm, propertyType: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm outline-none focus:border-amber-500 appearance-none cursor-pointer">
                                         <option>Detached</option><option>Condo</option><option>Townhouse</option><option>Commercial</option>
                                      </select>
                                   </div>
                                </div>
                                <div>
                                   <div className="flex justify-between mb-1">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">AI Exec Summary</label>
                                      <button type="button" onClick={generateAISummary} className="text-[9px] font-black uppercase text-blue-600 hover:underline flex items-center gap-1"><Zap size={10}/> Auto-Generate</button>
                                   </div>
                                   <textarea value={bdForm.aiSummary} onChange={e=>setBdForm({...bdForm, aiSummary: e.target.value})} rows={3} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-medium text-xs outline-none focus:border-amber-500 resize-none placeholder:text-gray-400" placeholder={isGeneratingSummary ? "AI is analyzing deal..." : "Enter deal summary for lenders..."} disabled={isGeneratingSummary}></textarea>
                                </div>
                                <button onClick={publishToBorrowDirect} disabled={isPublishing} className="w-full bg-amber-500 text-black py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition shadow-md flex justify-center items-center gap-2 disabled:opacity-50">
                                   {isPublishing ? 'Publishing...' : 'Publish to Marketplace'} <ArrowUpRight size={14}/>
                                </button>
                             </div>
                          )}
                      </div>
                  ) : logType === 'route' ? (
                      <div className="bg-purple-50 p-4 md:p-5 rounded-2xl border border-purple-100">
                           <select className="w-full p-3 rounded-xl border border-purple-200 outline-none mb-3 font-bold text-xs bg-white" value={targetPartnerId} onChange={e => setTargetPartnerId(e.target.value)}>
                              <option value="">Select Assignee...</option>
                              
                              {/* STRICT DROPDOWN LOGIC */}
                              {partnerRole === 'admin' && (
                                  <option value={user?.uid}>🙋‍♂️ Assign to Me ({fullName})</option>
                              )}
                              
                              <option value="ADMIN_INBOX">📥 Admin Inbox (HQ)</option>
                              
                              {/* ecosystemPartners is pre-filtered. Admins see everyone, non-admins see only Admins */}
                              {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => (
                                  <option key={p.uid} value={p.uid}>{p.displayName} ({p.role ? p.role.replace('partner_', '') : 'Admin'})</option>
                              ))}
                          </select>
                          <button onClick={handleActionSubmit} disabled={!targetPartnerId} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition shadow-md disabled:opacity-50">Transfer Deal</button>
                      </div>
                  ) : logType === 'task' ? (
                      <div className="bg-orange-50 p-4 md:p-5 rounded-2xl border border-orange-100">
                           <input type="date" className="w-full mb-3 p-3 rounded-xl border border-orange-200 outline-none font-bold text-xs bg-white text-slate-700" value={taskDate} onChange={e => setTaskDate(e.target.value)} required />
                           <textarea className="w-full bg-white border border-orange-200 p-3 rounded-xl focus:border-orange-500 outline-none mb-3 resize-none font-medium text-xs" rows={2} placeholder="What needs to be done?" value={logInput} onChange={e => setLogInput(e.target.value)} />
                           <button onClick={handleActionSubmit} disabled={!taskDate} className="w-full bg-orange-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 transition shadow-md disabled:opacity-50">Set Reminder</button>
                      </div>
                  ) : logType === 'doc' ? (
                      <div className="bg-yellow-50 p-4 md:p-5 rounded-2xl border border-yellow-100">
                           <div className="flex justify-between items-center mb-3">
                              <h4 className="text-[9px] font-black uppercase tracking-widest text-yellow-800">Add Requirements</h4>
                           </div>
                           
                           {docRequests.map((req, index) => (
                              <div key={index} className="flex gap-2 mb-2">
                                 <input 
                                    type="text" 
                                    className="flex-1 p-3 rounded-xl border border-yellow-200 outline-none font-bold text-xs bg-white" 
                                    placeholder="e.g. 2024 T4" 
                                    value={req} 
                                    onChange={e => {
                                       const newReqs = [...docRequests];
                                       newReqs[index] = e.target.value;
                                       setDocRequests(newReqs);
                                    }} 
                                    required 
                                 />
                                 {docRequests.length > 1 && (
                                    <button type="button" onClick={() => {
                                       const newReqs = docRequests.filter((_, i) => i !== index);
                                       setDocRequests(newReqs);
                                    }} className="bg-white border border-yellow-200 text-red-500 hover:bg-red-50 hover:border-red-200 p-3 rounded-xl transition">
                                       <X size={14}/>
                                    </button>
                                 )}
                              </div>
                           ))}

                           <button type="button" onClick={() => setDocRequests([...docRequests, ''])} className="mb-4 text-[9px] font-black uppercase tracking-widest text-yellow-600 hover:text-yellow-800 flex items-center gap-1 transition">
                              <Plus size={10}/> Add Another Document
                           </button>

                           <button onClick={async (e) => {
                               e.preventDefault();
                               const validDocs = docRequests.filter(d => d.trim() !== '');
                               if(validDocs.length === 0) return;
                               
                               const btn = e.currentTarget;
                               btn.disabled = true;
                               btn.innerHTML = 'Sending...';

                               await fetch('/api/partner/request-document', {
                                   method: 'POST', headers: {'Content-Type': 'application/json'},
                                   body: JSON.stringify({ leadId: selectedDeal.id, documentNames: validDocs, clientEmail: selectedDeal.clientEmail, clientName: selectedDeal.clientName, agentName: fullName })
                               });
                               
                               alert('Documents requested and secure email sent to client!');
                               setDocRequests(['']);
                               btn.disabled = false;
                               btn.innerHTML = 'Request & Email Client';
                               loadProfileAndData();
                           }} className="w-full bg-yellow-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-600 transition shadow-md">
                               Request & Email Client
                           </button>
                      </div>
                  ) : (
                      <form onSubmit={handleActionSubmit} className="relative">
                        <textarea className="w-full bg-white border border-gray-200 p-4 pr-12 rounded-2xl font-medium focus:border-blue-500 outline-none transition resize-none text-[14px] shadow-sm" rows={2} placeholder={logType === 'log_call' ? "Notes from call..." : logType === 'log_email' ? "Notes from email..." : "Log an update..."} value={logInput} onChange={e => setLogInput(e.target.value)} required />
                        <button className={`absolute right-2 bottom-3 p-2 rounded-xl text-white transition shadow-sm ${logType === 'log_call' ? 'bg-blue-600 hover:bg-blue-700' : logType === 'log_email' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-black'}`}>
                            <Send size={14} />
                        </button>
                      </form>
                  )}
              </div>

              {/* Timeline */}
              <div className="flex-1 space-y-3">
                {(selectedDeal.message || selectedDeal.notes) && (
                    <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Original Inquiry</p>
                       <p className="text-xs font-medium text-slate-800 leading-relaxed italic">"{selectedDeal.message || selectedDeal.notes}"</p>
                    </div>
                )}
                {selectedDeal.timeline?.slice().reverse().map((log: any, i: number) => (
                  <div key={i} className={`p-4 rounded-2xl text-xs border shadow-sm ${log.isSystemMessage ? 'bg-gray-100 border-gray-200 text-center' : 'bg-white border-gray-200'}`}>
                    {!log.isSystemMessage && <div className="flex justify-between items-center mb-1.5"><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><User size={10}/> {log.author}</span><span className="text-[8px] font-bold text-gray-400">{new Date(log.timestamp).toLocaleString()}</span></div>}
                    <div className={`text-slate-800 font-medium whitespace-pre-wrap ${log.isSystemMessage ? 'text-[9px] font-bold uppercase tracking-widest text-gray-500' : ''}`}>
                        {log.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📱 MOBILE-OPTIMIZED MANUAL TASK MODAL 📱 */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-2xl animate-in fade-in slide-in-from-bottom-8 md:zoom-in-95 duration-200 mb-0 md:mb-auto pb-10 md:pb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><Calendar size={20} className="text-blue-600"/> Add Task</h2>
                    <button onClick={() => setShowNewTaskForm(false)} className="text-gray-400 hover:text-black bg-gray-100 p-1.5 rounded-full"><X size={14}/></button>
                </div>
                <form onSubmit={handleManualTaskSubmit} className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Description</label>
                        <input type="text" required value={newTask.description} onChange={e=>setNewTask({...newTask, description: e.target.value})} placeholder="What needs to be done?" className="w-full bg-gray-50 border border-gray-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-[14px] md:text-sm" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Due Date</label>
                        <input type="date" required value={newTask.dueDate} onChange={e=>setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-[14px] md:text-sm" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-blue-600 block mb-1.5">Link to Client (Optional)</label>
                        <select value={newTask.referralId} onChange={e=>setNewTask({...newTask, referralId: e.target.value})} className="w-full bg-blue-50 border border-blue-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-[14px] md:text-sm text-blue-900 appearance-none cursor-pointer">
                            <option value="general">No Client (Personal Task)</option>
                            {allReferrals.map(deal => <option key={deal.id} value={deal.id}>{deal.clientName}</option>)}
                        </select>
                    </div>

                    <button type="submit" className="w-full bg-slate-900 text-white py-4 md:py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition shadow-lg mt-2">
                        Schedule Task
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* 📱 MOBILE-OPTIMIZED INJECT LEAD MODAL 📱 */}
      {showNewReferralForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-[0_-20px_50px_rgba(0,0,0,0.5)] md:shadow-2xl animate-in fade-in slide-in-from-bottom-8 md:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar pb-24 md:pb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"><Plus size={20} className="text-blue-600"/> Inject Lead</h2>
                    <button onClick={() => setShowNewReferralForm(false)} className="text-gray-400 hover:text-black bg-gray-100 p-1.5 rounded-full"><X size={14}/></button>
                </div>
                <form onSubmit={handleManualLeadSubmit} className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Client Name</label>
                        <input type="text" required value={newClient.name} onChange={e=>setNewClient({...newClient, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-[14px] md:text-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Phone</label>
                            <input type="tel" required value={newClient.phone} onChange={e=>setNewClient({...newClient, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-[14px] md:text-sm" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Email</label>
                            <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-[14px] md:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Service Required</label>
                        <select value={newClient.service} onChange={e=>setNewClient({...newClient, service: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-[14px] md:text-sm appearance-none cursor-pointer">
                            <option>Mortgage Pre-Approval</option>
                            <option>Property Search</option>
                            <option>Legal Closing</option>
                            <option>General Inquiry</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-blue-600 block mb-1.5">Initial Assignment</label>
                        <select value={newClient.assignedTo} onChange={e=>setNewClient({...newClient, assignedTo: e.target.value})} className="w-full bg-blue-50 border border-blue-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition font-bold text-[14px] md:text-sm text-blue-900 appearance-none cursor-pointer">
                            {partnerRole === 'admin' ? (
                                <>
                                  <option value={user?.uid}>🙋‍♂️ Assign to Me ({fullName})</option>
                                  <option value="ADMIN_INBOX">📥 Admin Inbox (HQ)</option>
                                  {ecosystemPartners.filter(p => p.uid !== user?.uid).map(p => <option key={p.uid} value={p.uid}>{p.displayName} ({p.role ? p.role.replace('partner_', '') : 'Admin'})</option>)}
                                </>
                            ) : (
                                <>
                                  <option value="ADMIN_INBOX">📥 Send to IndiBrick HQ</option>
                                  <option value={user?.uid}>🙋‍♂️ Keep in My Pipeline</option>
                                  {/* Non-admins can also assign directly to HQ Admins if needed */}
                                  {ecosystemPartners.map(p => <option key={p.uid} value={p.uid}>{p.displayName} (Admin)</option>)}
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Context / Notes</label>
                        <textarea value={newClient.message} onChange={e=>setNewClient({...newClient, message: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-4 md:p-3 rounded-xl outline-none focus:border-blue-500 transition resize-none font-medium text-[14px] md:text-xs" rows={2}></textarea>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white py-4 md:py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition shadow-lg mt-1">
                        Add to Pipeline
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}