'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { app, db } from '../../../firebase';
import { 
  Lock, LogOut, CheckCircle, Clock, Loader2, UploadCloud, 
  FileText, ShieldCheck, Activity, MessageSquare, Send, X, AlertTriangle,
  Landmark, User, ChevronRight, Check, Users
} from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'Received', label: 'Received', desc: 'File opened.' },
  { id: 'Underwriting', label: 'Underwriting', desc: 'Verifying details.' },
  { id: 'Approved', label: 'Approved', desc: 'Commitment issued.' },
  { id: 'Firm Sale', label: 'Firm / Met', desc: 'Conditions cleared.' },
  { id: 'Funded', label: 'Funded', desc: 'Transaction complete.' }
];

export default function ClientDashboard() {
  const router = useRouter();
  const auth = getAuth(app);
  
  const [user, setUser] = useState<any>(null);
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [uploadingItem, setUploadingItem] = useState<string | null>(null);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: 'Hello! I am your IndiBrick Copilot. I have secure access to your file. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/client/login');
      } else {
        setUser(currentUser);
        await fetchClientDeal(currentUser.email!);
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const fetchClientDeal = async (email: string) => {
    try {
      const q = query(collection(db, 'referrals'), where('clientEmail', '==', email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const activeDeal = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];
        const res = await fetch(`/api/client/portal-data?leadId=${activeDeal.leadId || activeDeal.id}`);
        if (res.ok) {
           const freshData = await res.json();
           setDeal({ ...activeDeal, vault: freshData.vault, requiredDocuments: freshData.requiredDocuments });
        } else {
           setDeal(activeDeal);
        }
      } else {
        setError('No active files found for this email address.');
      }
    } catch (err) {
      console.error("Error fetching deal:", err);
      setError('Failed to load your file data. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, requirementName: string) => {
    const file = e.target.files?.[0];
    if (!file || !deal) return;

    setUploadingItem(requirementName);
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
      });

      const res = await fetch('/api/client/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fileBase64: base64,
            mimeType: file.type,
            fileName: file.name,
            leadId: deal.leadId || deal.id,
            requirementName: requirementName
        })
      });

      if (!res.ok) throw new Error("Upload failed");
      await fetchClientDeal(user.email!);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingItem(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !deal) return;

    const newMsgs = [...chatMessages, { role: 'user' as const, content: chatInput }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/client/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMsgs,
          clientName: deal.clientName,
          dealStatus: deal.status,
          dealService: deal.serviceNeeded || 'Mortgage',
          assignedAgent: deal.assignedAgentName || 'your advisor'
        })
      });
      const data = await res.json();
      setChatMessages([...newMsgs, { role: 'ai', content: data.reply }]);
    } catch (err) {
      setChatMessages([...newMsgs, { role: 'ai', content: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/client/login');
  };

  const getCurrentStageIndex = () => {
     if (!deal) return 0;
     let status = deal.status;
     if (status === 'New Web Lead' || status === 'Contacted') status = 'Received';
     if (status === 'Firm / Conditional') status = 'Firm Sale';
     if (status === 'Closed') status = 'Funded';

     const index = PIPELINE_STAGES.findIndex(s => s.id === status);
     return index === -1 ? 0 : index;
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
         <AlertTriangle size={48} className="text-red-500 mb-4" />
         <h2 className="text-2xl font-black uppercase text-slate-900 mb-2">No Active Files</h2>
         <p className="text-gray-500 mb-8 max-w-md">{error || "We couldn't locate an active file linked to your email address."}</p>
         <button onClick={handleLogout} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs">Sign Out</button>
      </div>
    );
  }

  const currentStageIdx = getCurrentStageIndex();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      
      {/* CTO FIX: Removed header:not(.dash-header) so the Global Site Header appears normally! */}
      <style dangerouslySetInnerHTML={{__html: `footer { display: none !important; }`}} />

      {/* --- DASHBOARD ACTION BAR --- */}
      <div className="bg-white border-b border-slate-100  top-0 z-20 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-3 py-1 flex justify-between items-center">
           <div className="flex items-center gap-3">
              {/* CTO FIX: Replaced "IB" with the actual logo! */}
              <img src="/logo.png" alt="IndiBrick" className="h-28 md:h-40 w-auto object-contain" />
              <span className="font-bold text-slate-900 hidden md:block border-l border-slate-300 pl-3 ml-1">Secure Client Portal</span>
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 text-green-700">
                 <ShieldCheck size={16}/>
                 <span className="text-[11px] font-bold uppercase tracking-widest">TLS 1.3 Encrypted</span>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <button onClick={handleLogout} className="text-xs font-bold text-slate-500 uppercase hover:text-slate-900 transition flex items-center gap-2">
                 <span className="hidden sm:inline">Sign Out</span> <LogOut size={16}/> 
              </button>
           </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
         
         {/* 1. PROGRESS TRACKER */}
         <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-100 pb-6">
               <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1">
                     Welcome, {deal.clientName.split(' ')[0]}
                  </h1>
                  <p className="text-slate-500 font-medium text-sm">
                     Application ID: #{deal.leadId?.substring(0,8) || deal.id.substring(0,8)} • {deal.serviceNeeded}
                  </p>
               </div>
               <div className="text-left md:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Current Status</p>
                  <p className="text-xl font-black text-blue-600">{deal.status}</p>
               </div>
            </div>

            {/* Stepper */}
            <div className="relative pt-4 pb-2">
               {/* Connecting Line */}
               <div className="absolute top-8 left-0 w-full h-1 bg-slate-100 rounded-full"></div>
               <div 
                  className="absolute top-8 left-0 h-1 bg-blue-600 rounded-full transition-all duration-1000"
                  style={{ width: `${(currentStageIdx / (PIPELINE_STAGES.length - 1)) * 100}%` }}
               ></div>

               <div className="relative flex justify-between">
                  {PIPELINE_STAGES.map((stage, idx) => {
                     const isCompleted = idx <= currentStageIdx;
                     const isCurrent = idx === currentStageIdx;
                     return (
                        <div key={stage.id} className="flex flex-col items-center w-1/5 relative">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500 z-10 ${isCompleted ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-transparent'}`}>
                              {isCompleted && <Check size={14} strokeWidth={3} />}
                           </div>
                           <div className="mt-3 text-center hidden md:block">
                              <p className={`text-[11px] font-bold uppercase tracking-wider ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                 {stage.label}
                              </p>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>

         {/* 2. MAIN DASHBOARD GRID */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: DOCUMENT CENTER (Col-span-8) */}
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                     <div>
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                           <FileText size={20} className="text-slate-400"/> Document Center
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Securely upload requested files for underwriting review.</p>
                     </div>
                  </div>

                  {(!deal.requiredDocuments || deal.requiredDocuments.length === 0) ? (
                     <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <CheckCircle className="mx-auto text-green-500 mb-3" size={32}/>
                        <h3 className="font-bold text-slate-900">No Action Required</h3>
                        <p className="text-sm text-slate-500 mt-1">Your advisor has all necessary documents at this time.</p>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        
                        {/* SECTION: ACTION REQUIRED */}
                        <div>
                           <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-3">Action Required</h4>
                           <div className="space-y-3">
                              {deal.requiredDocuments.filter((req: string) => {
                                 const uploaded = deal.vault?.filter((v: any) => v.requirementName === req) || [];
                                 return uploaded.length === 0;
                              }).map((req: string, i: number) => {
                                 const isUploading = uploadingItem === req;
                                 return (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-orange-200 bg-orange-50/50">
                                       <div className="flex items-center gap-3">
                                          <AlertTriangle size={18} className="text-orange-500 shrink-0"/>
                                          <span className="font-bold text-sm text-slate-900">{req}</span>
                                       </div>
                                       <label className={`shrink-0 px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${isUploading ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
                                          {isUploading ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>}
                                          {isUploading ? 'Encrypting...' : 'Upload File'}
                                          <input type="file" accept=".pdf,image/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(e, req)} />
                                       </label>
                                    </div>
                                 );
                              })}
                              {deal.requiredDocuments.filter((req: string) => (deal.vault?.filter((v: any) => v.requirementName === req) || []).length === 0).length === 0 && (
                                 <p className="text-xs text-slate-500 italic">All requested documents have been uploaded.</p>
                              )}
                           </div>
                        </div>

                        {/* SECTION: SECURED & VERIFIED */}
                        <div className="pt-6">
                           <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Secured Documents</h4>
                           <div className="space-y-3">
                              {deal.vault?.map((file: any, fileIdx: number) => (
                                 <div key={fileIdx} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                       <div className="bg-slate-100 text-slate-600 p-2 rounded-lg shrink-0">
                                          <FileText size={16} />
                                       </div>
                                       <div className="truncate">
                                          <p className="text-sm font-bold text-slate-800 truncate">{file.fileName}</p>
                                          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">Satisfies: {file.requirementName}</p>
                                       </div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1.5 rounded-md shrink-0 flex items-center gap-1 border border-green-100">
                                       <Lock size={10}/> Uploaded
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>

                     </div>
                  )}
               </div>
            </div>

            {/* RIGHT: UPDATES & DETAILS (Col-span-4) */}
            <div className="lg:col-span-4 space-y-8">
               
               {/* ADVISOR UPDATES (TIMELINE) */}
               <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col h-[400px]">
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 shrink-0">
                     <Activity size={16} className="text-blue-600"/> Advisor Updates
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                     {deal.timeline?.slice().reverse().map((log: any, i: number) => {
                        // In professional mode, we only show non-system messages (human notes) to the client.
                        // Or we can show system messages related to document uploads.
                        if (log.isSystemMessage && !log.content.includes('Document Uploaded')) return null;

                        return (
                           <div key={i} className="relative pl-4 border-l-2 border-slate-200">
                              <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                 {new Date(log.timestamp).toLocaleDateString()} • {log.author}
                              </p>
                              <div className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                                 {log.content}
                              </div>
                           </div>
                        )
                     })}
                     {(!deal.timeline || deal.timeline.filter((l:any) => !l.isSystemMessage || l.content.includes('Document')).length === 0) && (
                        <p className="text-sm text-slate-400 font-medium text-center italic mt-10">No recent updates.</p>
                     )}
                  </div>
               </div>

               {/* DEAL TEAM */}
               <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                     <Users size={14}/> Your Advisor
                  </h3>
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                        {deal.assignedAgentName?.charAt(0) || 'I'}
                     </div>
                     <div>
                        <p className="font-bold text-slate-900">{deal.assignedAgentName || 'IndiBrick HQ'}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lead Strategist</p>
                     </div>
                  </div>
               </div>

            </div>

         </div>
      </main>

      {/* --- FLOATING AI COPILOT WIDGET --- */}
      <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end transition-all duration-300 ${isChatOpen ? 'w-full max-w-[360px] px-4 sm:px-0' : ''}`}>
         
         <div className={`bg-white w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 flex flex-col mb-4 origin-bottom-right ${isChatOpen ? 'h-[450px] opacity-100 scale-100' : 'h-0 opacity-0 scale-95 pointer-events-none'}`}>
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center"><MessageSquare size={12}/></div>
                  <div>
                     <span className="font-bold text-sm block leading-none">IndiBrick Assistant</span>
                  </div>
               </div>
               <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition"><X size={16}/></button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3 custom-scrollbar">
               {chatMessages.map((msg, i) => (
                  <div key={i} className={`max-w-[85%] p-3 rounded-xl text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'ai' ? 'bg-white border border-slate-200 text-slate-700 self-start rounded-tl-sm' : 'bg-slate-900 text-white self-end rounded-tr-sm'}`}>
                     {msg.content}
                  </div>
               ))}
               {isChatLoading && (
                  <div className="bg-white border border-slate-200 text-slate-500 self-start rounded-xl rounded-tl-sm p-3 flex gap-1 shadow-sm">
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  </div>
               )}
               <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
               <input 
                 type="text" 
                 value={chatInput} 
                 onChange={e => setChatInput(e.target.value)} 
                 placeholder="Type your question..." 
                 className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-blue-500 transition placeholder:text-slate-400"
               />
               <button disabled={!chatInput.trim() || isChatLoading} className="bg-slate-900 text-white px-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 shrink-0">
                  <Send size={16} />
               </button>
            </form>
         </div>

         <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform border-4 border-white ${isChatOpen ? 'rotate-90 scale-0 opacity-0' : ''}`}>
            <MessageSquare size={20} />
         </button>
      </div>

    </div>
  );
}