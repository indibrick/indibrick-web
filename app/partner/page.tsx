'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../AdminContext';
import { CRMService } from '../../services/CRMService';
import { Referral, PartnerProfile } from '../../types';
import { 
  Plus, ArrowUpRight, ArrowDownLeft, Send, X, 
  Wallet, Users, Briefcase, ChevronRight, Activity 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../firebase'; 

export default function PartnerPortal() {
  const { user, loading } = useAdmin();
  const router = useRouter();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
  const [sentReferrals, setSentReferrals] = useState<Referral[]>([]);
  const [receivedReferrals, setReceivedReferrals] = useState<Referral[]>([]);
  
  // User Profile Data
  const [referralVolume, setReferralVolume] = useState('$0.00');
  const [firstName, setFirstName] = useState('');
  const [partnerRole, setPartnerRole] = useState<'partner_realtor' | 'partner_lawyer' | 'other'>('partner_realtor');

  // Modal State
  const [selectedDeal, setSelectedDeal] = useState<Referral | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [showNewReferralForm, setShowNewReferralForm] = useState(false);
  
  // New Lead Form
  const [newClient, setNewClient] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    service: 'Mortgage Pre-Approval', 
    message: '' 
  });

  // --- INIT ---
  useEffect(() => {
    if (!loading && !user) router.push('/partner/login');
    if (user) {
        loadProfileAndData();
    }
  }, [user, loading]);

  const loadProfileAndData = async () => {
    if (!user) return;
    
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            setReferralVolume(data.referralVolume || '$0.00');
            setPartnerRole(data.role as any);
            const nameParts = (data.displayName || user.displayName || 'Partner').split(' ');
            setFirstName(nameParts[0]);
        }
    } catch (e) {
        console.error("Profile Load Error", e);
    }

    const profile = { uid: user.uid, role: 'partner', displayName: user.displayName || 'Partner' } as PartnerProfile;
    const { sent, received } = await CRMService.getPartnerDashboard(profile);
    setSentReferrals(sent);
    setReceivedReferrals(received);
  };

  // --- STATUS LOGIC ---
  const getStatusOptions = () => {
    if (partnerRole === 'partner_lawyer') {
      return ['File Open', 'Title Search', 'Signing Set', 'Funds Requested', 'Closed'];
    }
    return ['Contacted', 'Showing', 'Offer Made', 'Firm / Conditional', 'Closed', 'Dead Deal'];
  };

  // --- HANDLERS ---
  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedDeal || !user) return;
    await CRMService.updateReferralStatus(selectedDeal.id, newStatus, user.displayName || 'Partner');
    loadProfileAndData();
    setSelectedDeal({ ...selectedDeal, status: newStatus });
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !user || !noteInput.trim()) return;
    await CRMService.addNoteToReferral(selectedDeal.id, noteInput, user.displayName || 'Partner');
    setNoteInput('');
    loadProfileAndData();
  };
  
  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const profile = { uid: user.uid, role: partnerRole, displayName: user.displayName || 'Partner' } as PartnerProfile;
    
    const finalData = {
        ...newClient,
        message: `[Service: ${newClient.service}] ${newClient.message}`,
        type: newClient.service 
    };

    await CRMService.createReferral(profile, finalData);
    setShowNewReferralForm(false);
    setNewClient({ name: '', phone: '', email: '', service: 'Mortgage Pre-Approval', message: '' }); 
    loadProfileAndData();
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Activity className="animate-spin text-gray-400"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans pb-20">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                 {partnerRole === 'partner_lawyer' ? 'Legal Portal' : 'Realtor Portal'}
               </p>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                 Hi, {firstName}.
               </h1>
            </div>
            
            <button 
                onClick={() => setShowNewReferralForm(true)} 
                className="bg-black text-white pl-5 pr-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-2 shadow-lg shadow-black/20"
            >
               <Plus size={16} /> Send Lead
            </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* DASHBOARD STATS (UPDATED LOGIC) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 text-green-400">
                     <Wallet size={24} />
                     <span className="text-xs font-black uppercase tracking-widest">Funded Volume</span>
                  </div>
                  <h3 className="text-5xl font-black tracking-tighter mb-2">{referralVolume}</h3>
                  <p className="text-sm text-gray-400 font-medium">Total closed business value YTD.</p>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] relative overflow-hidden border border-gray-100 shadow-sm">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 text-blue-600">
                     <Users size={24} />
                     <span className="text-xs font-black uppercase tracking-widest">Leads Received</span>
                  </div>
                  {/* CHANGED: Shows only receivedReferrals count */}
                  <h3 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">{receivedReferrals.length}</h3>
                  <p className="text-sm text-gray-500 font-medium">Total clients received from Indibrick.</p>
               </div>
            </div>
        </div>

        {/* TABS */}
        <div className="flex gap-8 mb-8 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('received')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition ${activeTab === 'received' ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ArrowDownLeft size={18} /> 
            Incoming 
            {receivedReferrals.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{receivedReferrals.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('sent')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition ${activeTab === 'sent' ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ArrowUpRight size={18} /> 
            Sent 
            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full ml-1">{sentReferrals.length}</span>
          </button>
        </div>

        {/* LIST VIEW */}
        <div className="grid gap-4">
          {(activeTab === 'received' ? receivedReferrals : sentReferrals).map((deal) => (
            <div 
                key={deal.id} 
                onClick={() => setSelectedDeal(deal)} 
                className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-black/10 hover:shadow-lg transition cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${['Closed', 'Funded'].includes(deal.status) ? 'bg-green-500' : 'bg-blue-500'}`} />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pl-4 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition">{deal.clientName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                        {activeTab === 'received' ? `From: ${deal.referrerName}` : `Assigned: ${deal.assignedAgentName || 'Processing'}`}
                     </p>
                     <span className="text-gray-300">•</span>
                     <p className="text-xs text-gray-400 font-medium">{new Date(deal.referralDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <span className="inline-block px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">{deal.status}</span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-black transition" />
                </div>
              </div>
            </div>
          ))}
          {(activeTab === 'received' ? receivedReferrals : sentReferrals).length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-[2rem]">
                <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No active deals.</p>
            </div>
          )}
        </div>

      </div>

      {/* DEAL MODAL */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-8 overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl flex flex-col">
            <button onClick={() => setSelectedDeal(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition"><X size={16}/></button>
            <h2 className="text-3xl font-black mb-1 text-slate-900">{selectedDeal.clientName}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
              {activeTab === 'received' ? 'Incoming Referral' : 'Outgoing Referral'}
            </p>

            {activeTab === 'received' && (
              <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Update Workflow ({partnerRole === 'partner_lawyer' ? 'Legal' : 'Realtor'})</label>
                <div className="grid grid-cols-2 gap-2">
                  {getStatusOptions().map(status => (
                    <button key={status} onClick={() => handleStatusUpdate(status)} className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition ${selectedDeal.status === status ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-black'}`}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col mb-4">
              <label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Activity Log</label>
              <div className="bg-gray-50 rounded-2xl p-4 flex-1 overflow-y-auto space-y-4 border border-gray-100 mb-4 min-h-[300px]">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Original Request</p>
                   <p className="text-sm text-gray-800 leading-relaxed">{selectedDeal.notes}</p>
                </div>
                {selectedDeal.timeline?.map((note, i) => (
                  <div key={i} className={`p-3 rounded-xl text-sm ${note.isSystemMessage ? 'bg-gray-200 text-center text-gray-600 text-[10px] font-bold uppercase' : 'bg-blue-50 border border-blue-100'}`}>
                    {!note.isSystemMessage && <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">{note.author}</p>}
                    <p className="text-slate-800">{note.content}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddNote} className="relative">
                <input className="w-full bg-white border-2 border-gray-200 p-4 rounded-2xl pr-12 font-medium focus:border-black outline-none transition" placeholder="Add a progress note..." value={noteInput} onChange={e => setNoteInput(e.target.value)} />
                <button className="absolute right-3 top-3 bg-black text-white p-2 rounded-xl hover:bg-gray-800 transition"><Send size={14} /></button>
              </form>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="font-bold text-sm mb-3 uppercase tracking-wide">Contact Details</h4>
              <p className="text-gray-600 text-sm flex items-center gap-3">
                 <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">📞</span> 
                 <a href={`tel:${selectedDeal.clientPhone}`} className="hover:underline font-bold">{selectedDeal.clientPhone}</a>
              </p>
              {selectedDeal.clientEmail && <p className="text-gray-600 text-sm flex items-center gap-3 mt-2"><span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">✉️</span> <a href={`mailto:${selectedDeal.clientEmail}`} className="hover:underline font-bold">{selectedDeal.clientEmail}</a></p>}
            </div>
          </div>
        </div>
      )}

      {/* NEW REFERRAL FORM (SERVICE DROPDOWN) */}
      {showNewReferralForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-200">
             <div className="flex justify-between items-start mb-6">
                <div><h3 className="font-black text-3xl text-slate-900 tracking-tight">New Lead</h3><p className="text-gray-500 font-medium text-sm">Submit a client to Indibrick HQ.</p></div>
                <button onClick={() => setShowNewReferralForm(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition"><X size={20}/></button>
             </div>
             <form onSubmit={handleCreateReferral} className="space-y-4">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 ml-1 mb-1 block">Service Required</label>
                    <select className="w-full p-4 bg-gray-50 border-r-[16px] border-transparent focus:bg-white focus:border-black rounded-xl font-bold outline-none transition cursor-pointer appearance-none" value={newClient.service} onChange={e => setNewClient({...newClient, service: e.target.value})}>
                        <option>Mortgage Pre-Approval</option><option>Purchase Financing (Live Deal)</option><option>Refinance / Equity Takeout</option><option>Private Mortgage / B-Lender</option><option>Commercial Loan</option><option>Construction Financing</option><option>Insurance (Life / Critical Illness)</option><option>Investment Planning</option><option>Other / General Inquiry</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Client Name" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-black rounded-xl font-bold outline-none transition" onChange={e => setNewClient({...newClient, name: e.target.value})} required />
                    <input placeholder="Client Phone" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-black rounded-xl font-bold outline-none transition" onChange={e => setNewClient({...newClient, phone: e.target.value})} required />
                </div>
                <input placeholder="Client Email (Optional)" className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-black rounded-xl font-bold outline-none transition" onChange={e => setNewClient({...newClient, email: e.target.value})} />
                <textarea placeholder="Notes: e.g. Purchase price $900k, closing date Nov 1st, self-employed..." className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-black rounded-xl font-bold outline-none transition min-h-[100px]" onChange={e => setNewClient({...newClient, message: e.target.value})} />
                <button className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition shadow-xl mt-4 flex items-center justify-center gap-2"><Send size={16} /> Send to Indibrick</button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}