'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../../AdminContext';
import { CRMService } from '../../services/CRMService';
import { Referral, Task, ActivityLog } from '../../types';
import { 
  Plus, Send, X, Wallet, Activity, Upload, 
  PhoneCall, Calendar, Mail, Network, Trash2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../firebase'; 

export default function EnterpriseCRM() {
  const { user, loading } = useAdmin();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'mine'>('received');
  const [sentReferrals, setSentReferrals] = useState<Referral[]>([]);
  const [receivedReferrals, setReceivedReferrals] = useState<Referral[]>([]);
  const [myLeads, setMyLeads] = useState<Referral[]>([]);
  const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
  const [ecosystemPartners, setEcosystemPartners] = useState<any[]>([]); 
  
  // Profile
  const [referralVolume, setReferralVolume] = useState('$0.00');
  const [firstName, setFirstName] = useState('');
  const [partnerRole, setPartnerRole] = useState<'partner_realtor' | 'partner_lawyer' | 'partner_mortgage' | 'admin' | 'other'>('partner_realtor');

  // Modals & Inputs
  const [selectedDeal, setSelectedDeal] = useState<Referral | null>(null);
  const [logType, setLogType] = useState<'note' | 'log_call' | 'log_email' | 'task' | 'route'>('note');
  const [logInput, setLogInput] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [targetPartnerId, setTargetPartnerId] = useState('');
  const [showNewReferralForm, setShowNewReferralForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', service: 'General Inquiry', message: '' });

  // --- INIT ---
  useEffect(() => {
    if (!loading && !user) router.push('/partner/login');
    if (user) loadProfileAndData();
  }, [user, loading]);

  const loadProfileAndData = async () => {
    if (!user) return;
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            setReferralVolume(data.referralVolume || '$0.00');
            setPartnerRole(data.role as any);
            setFirstName((data.displayName || user.displayName || 'Partner').split(' ')[0]);
            
            // Auto-set default tab based on role
            if (['partner_mortgage', 'admin'].includes(data.role) && activeTab === 'received') {
                setActiveTab('mine');
            }
        }
        
        const profile = { uid: user.uid, role: userDoc.exists() ? userDoc.data().role : 'partner', displayName: user.displayName || 'Partner' };
        const { sent, received, mine } = await CRMService.getPartnerDashboard(profile as any);
        setSentReferrals(sent);
        setReceivedReferrals(received);
        setMyLeads(mine);
        
        const tasks = await CRMService.fetchDailyTasks(user.uid);
        setDailyTasks(tasks);

        const partners = await CRMService.getEcosystemPartners();
        setEcosystemPartners(partners.filter(p => p.uid !== user.uid));
    } catch (e) { console.error("Data Load Error", e); }
  };

  const getStatusOptions = () => {
    if (partnerRole === 'partner_lawyer') return ['File Open', 'Title Search', 'Signing Set', 'Funds Requested', 'Closed'];
    if (partnerRole === 'partner_mortgage' || partnerRole === 'admin') return ['Application', 'Underwriting', 'Commitment Issued', 'Funded', 'Declined'];
    return ['Contacted', 'Showing', 'Offer Made', 'Firm / Conditional', 'Closed', 'Dead Deal'];
  };

  // --- HANDLERS ---
  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedDeal || !user) return;
    await CRMService.updateReferralStatus(selectedDeal.id, newStatus, user.displayName || 'Partner');
    loadProfileAndData();
    setSelectedDeal({ ...selectedDeal, status: newStatus });
  };

  const handleManualLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await CRMService.createReferral({ uid: user.uid, role: partnerRole, displayName: user.displayName || 'Partner' } as any, { ...newClient, type: 'Manual Entry' });
    setShowNewReferralForm(false);
    setNewClient({ name: '', phone: '', email: '', service: 'General Inquiry', message: '' });
    loadProfileAndData();
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1); 
        
        const parsedLeads = rows.map(row => {
          const cols = row.split(','); 
          return { name: cols[0]?.trim(), phone: cols[1]?.trim(), email: cols[2]?.trim(), notes: cols[3]?.trim() };
        }).filter(lead => lead.name); 

        if (parsedLeads.length > 0) {
           await CRMService.batchImportLeads({ uid: user.uid, role: partnerRole, displayName: user.displayName }, parsedLeads);
           alert(`Successfully imported ${parsedLeads.length} leads into the engine.`);
           loadProfileAndData();
        }
      } catch (error) {
        alert("Error parsing CSV. Ensure format is: Name, Phone, Email, Notes");
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this lead? This action cannot be undone.")) {
      await CRMService.deleteReferral(id);
      setSelectedDeal(null);
      loadProfileAndData();
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !user) return;

    if (logType === 'route') {
      const partner = ecosystemPartners.find(p => p.uid === targetPartnerId);
      if (partner) {
        await CRMService.routeLeadToPartner(selectedDeal.id, user.displayName || 'Partner', partner.uid, partner.displayName);
        alert(`Lead routed securely to ${partner.displayName}`);
        setSelectedDeal(null); 
      }
    } else if (logType === 'task') {
      await CRMService.scheduleTask({
          referralId: selectedDeal.id, clientName: selectedDeal.clientName, assigneeId: user.uid,
          dueDate: taskDate, description: logInput || `Follow up with ${selectedDeal.clientName}`, status: 'Pending'
      });
      alert('Task Scheduled Successfully.');
    } else {
      let prefix = '';
      if (logType === 'log_call') prefix = '📞 LOGGED CALL: ';
      if (logType === 'log_email') prefix = '✉️ LOGGED EMAIL: ';

      const activity: ActivityLog = {
        type: 'note', 
        author: user.displayName || 'Partner',
        content: prefix + logInput,
        timestamp: new Date().toISOString()
      };
      await CRMService.logActivity(selectedDeal.id, activity);
    }

    setLogInput('');
    setTaskDate('');
    loadProfileAndData();
  };

  const handleCompleteTask = async (taskId: string) => {
      await CRMService.completeTask(taskId);
      loadProfileAndData();
  };

  const getActiveLeads = () => {
    if (activeTab === 'received') return receivedReferrals;
    if (activeTab === 'sent') return sentReferrals;
    return myLeads;
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Activity className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                 {partnerRole.replace('partner_', '').toUpperCase()} CRM Engine
               </p>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Online, {firstName}.</h1>
            </div>
            
            <div className="flex gap-3">
                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-200 text-slate-900 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-black transition flex items-center gap-2">
                   <Upload size={14} /> Import CSV
                </button>
                <button onClick={() => setShowNewReferralForm(true)} className="bg-black text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-2 shadow-lg">
                   <Plus size={14} /> Manual Lead
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PIPELINE COL */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex gap-8 border-b border-gray-200 mb-6">
              {['partner_mortgage', 'admin'].includes(partnerRole) && (
                  <button onClick={() => setActiveTab('mine')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'mine' ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                    My Leads {myLeads.length > 0 && `(${myLeads.length})`}
                  </button>
              )}
              <button onClick={() => setActiveTab('received')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'received' ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                {partnerRole === 'admin' ? 'Triage Inbox' : 'Received Leads'} {receivedReferrals.length > 0 && `(${receivedReferrals.length})`}
              </button>
              <button onClick={() => setActiveTab('sent')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'sent' ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                Sent Leads
              </button>
            </div>

            {getActiveLeads().map((deal) => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal as any)} className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-500 hover:shadow-lg transition cursor-pointer flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{deal.clientName}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase mt-1">Date: {new Date(deal.referralDate).toLocaleDateString()}</p>
                    </div>
                    <span className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">{deal.status}</span>
                </div>
            ))}
            
            {getActiveLeads().length === 0 && (
                <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-300">
                    <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">No leads in this section.</p>
                </div>
            )}
        </div>

        {/* TASKS COL */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-green-400"><Wallet size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Funded YTD</span></div>
                  <h3 className="text-4xl font-black tracking-tighter">{referralVolume}</h3>
               </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-black uppercase tracking-tight mb-4 flex items-center gap-2"><Calendar size={18}/> Today's Tasks</h3>
                {dailyTasks.length === 0 ? (
                    <p className="text-sm text-gray-400 font-medium">No tasks scheduled for today. Inbox zero achieved.</p>
                ) : (
                    <div className="space-y-3">
                        {dailyTasks.map(task => (
                            <div key={task.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black text-blue-600">{task.clientName}</p>
                                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                </div>
                                <button onClick={() => handleCompleteTask(task.id)} className="text-[10px] font-bold uppercase bg-white border border-gray-200 px-2 py-1 rounded hover:bg-green-500 hover:text-white transition">Done</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* ENTERPRISE DEAL MODAL */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full p-8 overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">{selectedDeal.clientName}</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">📞 {selectedDeal.clientPhone} • ✉️ {selectedDeal.clientEmail}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleDeleteLead(selectedDeal.id)} className="p-2 text-red-400 bg-red-50 rounded-full hover:bg-red-500 hover:text-white transition" title="Delete Lead"><Trash2 size={16}/></button>
                    <button onClick={() => setSelectedDeal(null)} className="p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition"><X size={16}/></button>
                </div>
            </div>

            {/* Status Pipeline */}
            <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Advance Pipeline Stage</p>
                <div className="flex flex-wrap gap-2">
                  {getStatusOptions().map(status => (
                    <button key={status} onClick={() => handleStatusUpdate(status)} className={`py-2 px-4 text-[10px] font-bold uppercase rounded-lg border transition ${selectedDeal.status === status ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-black'}`}>
                      {status}
                    </button>
                  ))}
                </div>
            </div>

            {/* Offline Omnichannel Controls */}
            <div className="flex-1 flex flex-col">
              <div className="flex flex-wrap gap-4 mb-4 border-b border-gray-100 pb-2">
                  <button onClick={() => setLogType('note')} className={`text-[11px] font-black uppercase tracking-widest ${logType === 'note' ? 'text-black' : 'text-gray-400'}`}>Note</button>
                  <button onClick={() => setLogType('log_call')} className={`text-[11px] font-black uppercase tracking-widest ${logType === 'log_call' ? 'text-blue-600' : 'text-gray-400'}`}><PhoneCall size={12} className="inline mr-1"/> Log Call</button>
                  <button onClick={() => setLogType('log_email')} className={`text-[11px] font-black uppercase tracking-widest ${logType === 'log_email' ? 'text-green-600' : 'text-gray-400'}`}><Mail size={12} className="inline mr-1"/> Log Email</button>
                  <button onClick={() => setLogType('task')} className={`text-[11px] font-black uppercase tracking-widest ${logType === 'task' ? 'text-orange-600' : 'text-gray-400'}`}><Calendar size={12} className="inline mr-1"/> Task</button>
                  <button onClick={() => setLogType('route')} className={`text-[11px] font-black uppercase tracking-widest ${logType === 'route' ? 'text-purple-600' : 'text-gray-400'}`}><Network size={12} className="inline mr-1"/> Route</button>
              </div>

              {/* Dynamic Action Area */}
              <div className="mb-4">
                  {logType === 'route' ? (
                      <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                           <select className="w-full p-3 rounded-xl border border-purple-200 outline-none mb-4" value={targetPartnerId} onChange={e => setTargetPartnerId(e.target.value)}>
                              <option value="">Select Partner...</option>
                              {ecosystemPartners.map(p => (
                                  <option key={p.uid} value={p.uid}>{p.displayName} ({p.role.replace('partner_', '')})</option>
                              ))}
                          </select>
                          <button onClick={handleActionSubmit} disabled={!targetPartnerId} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-purple-700 transition">Execute Routing Protocol</button>
                      </div>
                  ) : logType === 'task' ? (
                      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                           <input type="date" className="w-full mb-3 p-3 rounded-xl border border-orange-200 outline-none" value={taskDate} onChange={e => setTaskDate(e.target.value)} required />
                           <textarea className="w-full bg-white border border-orange-200 p-3 rounded-xl focus:border-orange-500 outline-none mb-3 resize-none" rows={2} placeholder="Task description..." value={logInput} onChange={e => setLogInput(e.target.value)} />
                           <button onClick={handleActionSubmit} disabled={!taskDate} className="w-full bg-orange-600 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-orange-700 transition">Schedule Task</button>
                      </div>
                  ) : (
                      <form onSubmit={handleActionSubmit} className="space-y-3">
                        <textarea className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl font-medium focus:border-black outline-none transition resize-none" rows={3} placeholder={logType === 'log_call' ? "Notes from your call..." : logType === 'log_email' ? "Notes on the email you sent offline..." : "Add a general note..."} value={logInput} onChange={e => setLogInput(e.target.value)} required />
                        <button className="w-full bg-black text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition">
                            {logType === 'log_call' ? 'Save Call Log' : logType === 'log_email' ? 'Save Email Log' : 'Save Note'}
                        </button>
                      </form>
                  )}
              </div>

              {/* Timeline History */}
              <div className="bg-gray-50 rounded-2xl p-4 flex-1 overflow-y-auto space-y-4 border border-gray-100 min-h-[250px]">
                {selectedDeal.timeline?.slice().reverse().map((log, i) => (
                  <div key={i} className={`p-3 rounded-xl text-sm border ${log.isSystemMessage ? 'bg-gray-100 border-transparent text-center' : 'bg-white border-gray-200 shadow-sm'}`}>
                    {!log.isSystemMessage && <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-500 uppercase">{log.author}</span><span className="text-[9px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span></div>}
                    <p className={`text-slate-800 ${log.isSystemMessage ? 'text-[10px] font-bold uppercase tracking-widest text-gray-500' : ''}`}>{log.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MANUAL LEAD MODAL */}
      {showNewReferralForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ingest Lead</h2>
                    <button onClick={() => setShowNewReferralForm(false)} className="text-gray-400 hover:text-black"><X size={20}/></button>
                </div>
                <form onSubmit={handleManualLeadSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Client Name</label>
                        <input type="text" required value={newClient.name} onChange={e=>setNewClient({...newClient, name: e.target.value})} className="w-full mt-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-black" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phone</label>
                            <input type="tel" required value={newClient.phone} onChange={e=>setNewClient({...newClient, phone: e.target.value})} className="w-full mt-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-black" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Email</label>
                            <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} className="w-full mt-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-black" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Service Required</label>
                        <select value={newClient.service} onChange={e=>setNewClient({...newClient, service: e.target.value})} className="w-full mt-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-black appearance-none">
                            <option>Mortgage Pre-Approval</option>
                            <option>Property Search</option>
                            <option>Legal Closing</option>
                            <option>General Inquiry</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Internal Notes</label>
                        <textarea value={newClient.message} onChange={e=>setNewClient({...newClient, message: e.target.value})} className="w-full mt-1 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-black resize-none" rows={3}></textarea>
                    </div>
                    <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition shadow-lg mt-2">
                        Inject to Pipeline
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}