'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../AdminContext';
import { CRMService } from '../../services/CRMService';
import { PropertyService } from '../../services/PropertyService';
import { LeadService } from '../../services/LeadService';
import { Referral, Property, Lead } from '../../types';
import { 
  Lock, LogOut, Users, FileText, Settings, Plus, Trash2, RefreshCw, 
  Briefcase, ArrowRightCircle, ArrowUpRight, ArrowDownLeft, 
  Home, Edit2, X, MessageSquare, Send, UserPlus, BrainCircuit, Database, UploadCloud 
} from 'lucide-react';

export default function AdminPage() {
  const { 
    isAuthenticated, login, verifyOtp, logout, 
    leads, refreshLeads, 
    blogPosts, publishBlogPost, deleteBlogPost,
    user 
  } = useAdmin();
  
  // --- AUTH ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'login' | 'otp' | 'dashboard'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- TABS ---
  const [activeTab, setActiveTab] = useState('inventory');
  
  // --- DATA ---
  const [incomingReferrals, setIncomingReferrals] = useState<Referral[]>([]); 
  const [outgoingReferrals, setOutgoingReferrals] = useState<Referral[]>([]); 
  const [externalPartners, setExternalPartners] = useState<any[]>([]);
  const [listings, setListings] = useState<Property[]>([]);

  // --- MODAL STATES ---
  const [showListingModal, setShowListingModal] = useState(false);
  const [currentListing, setCurrentListing] = useState<Partial<Property>>({});
  
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<any>({});

  const [selectedDeal, setSelectedDeal] = useState<Referral | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const [newPost, setNewPost] = useState({
    title: '', slug: '', category: 'Mortgage', imageUrl: '', excerpt: '', content: ''
  });

  // --- AI TRAINER STATES ---
  const [uploadMode, setUploadMode] = useState<'text' | 'pdf'>('pdf');
  const [knowledgeSource, setKnowledgeSource] = useState('');
  const [knowledgeText, setKnowledgeText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [trainingMessage, setTrainingMessage] = useState('');

  // --- CSV IMPORT STATES ---
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [adminSecretKey, setAdminSecretKey] = useState('');

  // --- INIT ---
  useEffect(() => { 
    if (isAuthenticated) {
      setStep('dashboard');
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setLoading(true);
    
    // 1. Inventory
    const props = await PropertyService.fetchProperties();
    setListings(props);

    // 2. CRM
    const allRefs = await CRMService.getAllReferrals();
    const incoming = allRefs.filter(r => r.referrerId !== 'INDIBRICK_WEB');
    const outgoing = allRefs.filter(r => r.referrerId === 'INDIBRICK_WEB');
    setIncomingReferrals(incoming);
    setOutgoingReferrals(outgoing);
    
    // 3. Partners
    const partners = await CRMService.getUsersByRole('partner');
    setExternalPartners(partners);
    
    // 4. Web Leads
    refreshLeads();
    
    setLoading(false);
  };

  // ===========================================================================
  // HANDLERS: PARTNER MANAGEMENT
  // ===========================================================================

  const openPartnerModal = (partner?: any) => {
    if (partner) {
      setCurrentPartner(partner);
    } else {
      setCurrentPartner({
        uid: '',
        displayName: '',
        email: '',
        organization: '',
        role: 'partner_realtor',
        referralVolume: '$0.00'
      });
    }
    setShowPartnerModal(true);
  };

  const savePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPartner.uid || !currentPartner.displayName) {
        alert("UID and Name are required.");
        return;
    }
    await CRMService.savePartnerProfile(currentPartner);
    setShowPartnerModal(false);
    loadAllData();
    alert('Partner Profile Saved!');
  };

  const deletePartner = async (uid: string) => {
    if (confirm("Delete this partner profile?")) {
      await CRMService.deletePartnerProfile(uid);
      loadAllData();
    }
  };

  // ===========================================================================
  // HANDLERS: CRM & OTHER
  // ===========================================================================
  
  const openDealModal = (deal: Referral) => {
    setSelectedDeal(deal);
    setAdminNote('');
  };

  const handleAdminNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !adminNote.trim()) return;
    
    const authorName = user?.displayName || 'Indibrick Admin';
    await CRMService.addNoteToReferral(selectedDeal.id, adminNote, authorName);
    
    const updatedTimeline = [
      ...(selectedDeal.timeline || []), 
      { author: authorName, content: adminNote, timestamp: new Date().toISOString(), isSystemMessage: false }
    ];
    setSelectedDeal({ ...selectedDeal, timeline: updatedTimeline });
    setAdminNote('');
    loadAllData();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedDeal) return;
    const authorName = user?.displayName || 'Indibrick Admin';
    await CRMService.updateReferralStatus(selectedDeal.id, newStatus, authorName);
    setSelectedDeal({ ...selectedDeal, status: newStatus });
    loadAllData();
  };

  const handleLeadStatusUpdate = async (id: string, newStatus: string) => {
    await LeadService.updateStatus(id, newStatus);
    refreshLeads();
  };

  const handleLeadDelete = async (id: string) => {
    if(confirm("Permanently delete this lead?")) {
      await LeadService.deleteLead(id);
      refreshLeads();
    }
  };

  const handleTransferToPartner = async (lead: Lead, partnerUid: string) => {
    const partner = externalPartners.find(p => p.uid === partnerUid);
    if (!partner) return;
    if(confirm(`Transfer lead "${lead.name}" to ${partner.displayName}?`)) {
        await CRMService.assignWebLeadToPartner(lead.id, lead, partnerUid, partner.displayName);
        await LeadService.updateStatus(lead.id, 'closed');
        alert("Lead Transferred! Check 'Partner Deals > Outbound' to track progress.");
        loadAllData();
    }
  };

  const openListingModal = (listing?: Property) => {
    if (listing) setCurrentListing(listing);
    else setCurrentListing({
      title: '', price: 0, address: '', city: 'Toronto', 
      bedrooms: 3, bathrooms: 2, type: 'Detached', 
      purpose: 'Sale', imageUrl: '', isFeatured: false, status: 'Active',
      landingPageUrl: ''
    });
    setShowListingModal(true);
  };

  const saveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentListing.title) return;
    await PropertyService.saveProperty(currentListing as Property);
    setShowListingModal(false);
    loadAllData();
    alert('Listing Saved!');
  };

  const deleteListing = async (id: string) => {
    if (confirm("Delete this listing?")) {
      await PropertyService.deleteProperty(id);
      loadAllData();
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    await publishBlogPost({ ...newPost, author: 'Admin', date: new Date().toISOString(), status: 'published' });
    setNewPost({ title: '', slug: '', category: 'Mortgage', imageUrl: '', excerpt: '', content: '' });
    alert('Article Published!');
  };

  // --- CSV IMPORT HANDLER ---
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !adminSecretKey) {
       alert("Please select a CSV file and enter the Admin Secret Key.");
       return;
    }

    setIsImporting(true);
    try {
       const text = await csvFile.text();
       const res = await fetch('/api/admin/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvData: text, adminKey: adminSecretKey })
       });
       
       const data = await res.json();
       if (!res.ok) throw new Error(data.error);
       
       alert(`Success: ${data.message}`);
       setCsvFile(null);
       setAdminSecretKey('');
       refreshLeads(); 
       loadAllData();
    } catch (err: any) {
       alert(`Import Failed: ${err.message}`);
    } finally {
       setIsImporting(false);
    }
  };

  // --- AI TRAINER HANDLERS ---
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleTrainAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrainingStatus('loading');
    setTrainingMessage('');

    try {
      let endpoint = '/api/admin/train-ai';
      let bodyPayload: any = { sourceTitle: knowledgeSource, adminKey };

      if (uploadMode === 'pdf') {
        if (!pdfFile) throw new Error("Please select a PDF file.");
        
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(pdfFile);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
        });

        endpoint = '/api/admin/train-pdf';
        bodyPayload.pdfBase64 = base64;
      } else {
        bodyPayload.text = knowledgeText;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to train AI');
      
      setTrainingStatus('success');
      setTrainingMessage(`Success: ${data.message}`);
      setKnowledgeSource('');
      setKnowledgeText('');
      setPdfFile(null);
      
    } catch (err: any) {
      setTrainingStatus('error');
      setTrainingMessage(err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await login(username, password); setStep('otp'); } catch (err) { setError('Access Denied'); }
  };
  const handleOtp = (e: React.FormEvent) => { e.preventDefault(); if (verifyOtp(otp)) { setStep('dashboard'); loadAllData(); } else setError('Invalid OTP'); };

  if (step !== 'dashboard') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl w-full max-w-md text-center">
          <Lock className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase">IndiBrick OS</h1>
          {step === 'login' ? (
             <form onSubmit={handleLogin} className="mt-6 space-y-4">
               <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-xl" value={username} onChange={e => setUsername(e.target.value)} />
               <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 rounded-xl" value={password} onChange={e => setPassword(e.target.value)} />
               <button className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase">Login</button>
             </form>
          ) : (
             <form onSubmit={handleOtp} className="mt-6">
               <input placeholder="OTP" className="w-full p-4 bg-gray-50 rounded-xl text-center text-xl" value={otp} onChange={e => setOtp(e.target.value)} />
               <button className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase mt-4">Verify</button>
             </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      
      <aside className="w-64 bg-black text-white p-6 flex flex-col fixed h-full z-10">
        <div className="mb-10">
          <h2 className="text-2xl font-black uppercase tracking-tighter">IndiBrick HQ</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">v3.6 (Partners)</p>
        </div>
        <nav className="space-y-2 flex-1">
          {[
            { id: 'inventory', icon: Home, label: 'Properties' },
            { id: 'leads', icon: Users, label: 'Web Leads' },
            { id: 'referrals', icon: Briefcase, label: 'Partner Deals' },
            { id: 'partners', icon: Users, label: 'Partner Network' }, 
            { id: 'content', icon: FileText, label: 'Content' },
            { id: 'settings', icon: Settings, label: 'Config / AI' } 
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === item.id ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10'}`}>
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={logout} className="text-red-400 text-xs font-bold uppercase flex gap-2 items-center hover:text-red-300"><LogOut size={14}/> Terminate</button>
      </aside>

      <main className="ml-64 flex-1 p-10">
        <header className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-3xl font-black text-black uppercase tracking-tight">
               {activeTab === 'inventory' && 'Property Inventory'}
               {activeTab === 'leads' && 'Lead Command Center'}
               {activeTab === 'referrals' && 'Partner Matrix'}
               {activeTab === 'partners' && 'Network Manager'}
               {activeTab === 'content' && 'Content Manager'}
               {activeTab === 'settings' && 'AI Brain Configuration'}
             </h1>
             <p className="text-gray-500 font-bold text-sm mt-1">
               {activeTab === 'partners' ? 'Manage access and performance for Realtors & Lawyers.' : 'System Operations.'}
             </p>
           </div>
           
           <div className="flex gap-2">
             {activeTab === 'partners' && (
                <button onClick={() => openPartnerModal()} className="bg-black text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-gray-800 transition">
                  <UserPlus size={16}/> Add Partner
                </button>
             )}
             {activeTab === 'inventory' && (
               <button onClick={() => openListingModal()} className="bg-black text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-gray-800 transition">
                 <Plus size={16}/> New Listing
               </button>
             )}
             <button onClick={loadAllData} className="bg-white p-3 rounded-full shadow hover:shadow-md transition"><RefreshCw size={20}/></button>
           </div>
        </header>

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
                 <tr><th className="p-4">Property</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {listings.map(item => (
                   <tr key={item.id} className="hover:bg-slate-50 transition group">
                     <td className="p-4 flex items-center gap-4">
                       <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                         {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" />}
                       </div>
                       <div>
                         <p className="font-bold text-black flex items-center gap-2">
                           {item.title}
                           {item.landingPageUrl && <span className="bg-amber-100 text-amber-600 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">VIP</span>}
                         </p>
                         <p className="text-xs text-gray-400 uppercase tracking-wide">{item.city}</p>
                       </div>
                     </td>
                     <td className="p-4 font-mono font-bold text-green-600">${item.price?.toLocaleString()}</td>
                     <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${item.status === 'Sold' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{item.status || 'Active'}</span></td>
                     <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={() => openListingModal(item)} className="p-2 bg-gray-100 rounded-lg hover:bg-black hover:text-white transition"><Edit2 size={14}/></button>
                         <button onClick={() => deleteListing(item.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition"><Trash2 size={14}/></button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-6">
             
             {/* CSV UPLOAD WIDGET */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-black text-lg mb-2 flex items-center gap-2"><UploadCloud size={18}/> Bulk Import Leads</h3>
                <p className="text-xs text-gray-500 mb-4">Upload a .CSV file with exact headers: <code className="bg-gray-100 px-1 rounded">Name, Phone, Email, Service, City, Notes</code></p>
                <form onSubmit={handleCsvImport} className="flex flex-col md:flex-row items-center gap-4">
                   <input 
                      type="file" accept=".csv" required 
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="text-sm w-full md:w-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                   />
                   <input 
                      type="password" required placeholder="Admin Secret Key" 
                      value={adminSecretKey} onChange={(e) => setAdminSecretKey(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-black w-full md:w-auto"
                   />
                   <button disabled={isImporting || !csvFile} className="bg-black text-white px-6 py-2 rounded-lg font-bold uppercase text-xs disabled:opacity-50 hover:bg-gray-800 transition w-full md:w-auto">
                      {isImporting ? 'Importing...' : 'Upload CSV'}
                   </button>
                </form>
             </div>

             {/* EXISTING LEADS TABLE */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
                   <tr><th className="p-4">Date</th><th className="p-4">Lead Info</th><th className="p-4">Service</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {leads.map(lead => (
                     <tr key={lead.id} className="hover:bg-slate-50 transition">
                       <td className="p-4 text-gray-500 text-xs">{new Date(lead.date).toLocaleDateString()}</td>
                       <td className="p-4">
                         <div className="font-bold">{lead.name}</div>
                         <div className="text-xs text-gray-500">{lead.phone} • {lead.email}</div>
                       </td>
                       <td className="p-4"><span className="bg-black text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase">{lead.serviceNeeded}</span></td>
                       <td className="p-4">
                         <select value={lead.status} onChange={(e) => handleLeadStatusUpdate(lead.id, e.target.value)} className="p-2 rounded-lg text-xs font-bold uppercase border outline-none cursor-pointer">
                           <option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
                         </select>
                       </td>
                       <td className="p-4">
                          <div className="flex items-center gap-2">
                            <select className="bg-white border border-gray-200 text-gray-700 rounded-lg p-2 text-xs font-bold outline-none w-32 cursor-pointer hover:border-black transition" onChange={(e) => handleTransferToPartner(lead, e.target.value)} defaultValue="">
                               <option value="" disabled>Transfer...</option>
                               {externalPartners.map(p => <option key={p.uid} value={p.uid}>{p.displayName}</option>)}
                            </select>
                            <button onClick={() => handleLeadDelete(lead.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                 <ArrowDownLeft className="text-green-600" />
                 <h3 className="font-black text-sm uppercase tracking-wide">Incoming (Deals to Close)</h3>
               </div>
               <table className="w-full text-left text-sm">
                 <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase text-xs">
                   <tr><th className="p-4">From</th><th className="p-4">Client</th><th className="p-4">Status</th><th className="p-4">Action</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {incomingReferrals.map(deal => (
                     <tr key={deal.id} className="hover:bg-slate-50 transition">
                       <td className="p-4 font-bold">{deal.referrerName}<br/><span className="text-xs text-gray-400 font-normal">{new Date(deal.referralDate).toLocaleDateString()}</span></td>
                       <td className="p-4"><span className="font-bold">{deal.clientName}</span><br/><span className="text-xs text-gray-500">{deal.notes}</span></td>
                       <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-black uppercase">{deal.status}</span></td>
                       <td className="p-4">
                         <button onClick={() => openDealModal(deal)} className="bg-black text-white px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-gray-800 transition"><MessageSquare size={14} /> View</button>
                       </td>
                     </tr>
                   ))}
                   {incomingReferrals.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No incoming deals.</td></tr>}
                 </tbody>
               </table>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                 <ArrowUpRight className="text-blue-600" />
                 <h3 className="font-black text-sm uppercase tracking-wide">Outbound (Sent to Partners)</h3>
               </div>
               <table className="w-full text-left text-sm">
                 <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase text-xs">
                   <tr><th className="p-4">Assigned To</th><th className="p-4">Client</th><th className="p-4">Current Status</th><th className="p-4">Monitor</th></tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {outgoingReferrals.map(deal => (
                     <tr key={deal.id} className="hover:bg-slate-50 transition">
                       <td className="p-4 font-bold">{deal.assignedAgentName}<br/><span className="text-xs text-gray-400 font-normal">{new Date(deal.referralDate).toLocaleDateString()}</span></td>
                       <td className="p-4"><span className="font-bold">{deal.clientName}</span><br/><span className="text-xs text-gray-500">{deal.notes}</span></td>
                       <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase">{deal.status}</span></td>
                       <td className="p-4">
                         <button onClick={() => openDealModal(deal)} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-black hover:text-white transition"><MessageSquare size={14} /> Track</button>
                       </td>
                     </tr>
                   ))}
                   {outgoingReferrals.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No outgoing transfers yet.</td></tr>}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
                 <tr><th className="p-4">Partner</th><th className="p-4">Role</th><th className="p-4">Contact</th><th className="p-4">Volume</th><th className="p-4 text-right">Manage</th></tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {externalPartners.map(p => (
                   <tr key={p.uid} className="hover:bg-slate-50 transition">
                     <td className="p-4 font-bold">{p.displayName}<br/><span className="text-xs text-gray-400 font-normal">{p.organization}</span></td>
                     <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${p.role === 'partner_lawyer' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{p.role === 'partner_lawyer' ? 'Lawyer' : 'Realtor'}</span></td>
                     <td className="p-4 text-xs font-medium text-gray-600">{p.email}<br/>{p.phone}</td>
                     <td className="p-4 font-mono font-bold text-green-600">{p.referralVolume || '$0.00'}</td>
                     <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={() => openPartnerModal(p)} className="p-2 bg-gray-100 rounded-lg hover:bg-black hover:text-white transition"><Edit2 size={14}/></button>
                         <button onClick={() => deletePartner(p.uid)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition"><Trash2 size={14}/></button>
                       </div>
                     </td>
                   </tr>
                 ))}
                 {externalPartners.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No partners found. Add one!</td></tr>}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'content' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-black text-xl mb-6 flex items-center gap-2"><Plus size={20} /> New Article</h3>
                 <form onSubmit={handlePublish} className="space-y-4">
                    <input required type="text" placeholder="Title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold" />
                    <div className="grid grid-cols-2 gap-4">
                       <input required type="text" placeholder="Slug" value={newPost.slug} onChange={e => setNewPost({...newPost, slug: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none text-xs font-mono" />
                       <select value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold">
                          <option>Mortgage</option><option>Real Estate</option><option>Investment</option><option>Insurance</option>
                       </select>
                    </div>
                    <input type="text" placeholder="Cover Image URL" value={newPost.imageUrl} onChange={e => setNewPost({...newPost, imageUrl: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none text-xs" />
                    <textarea required placeholder="SEO Excerpt" rows={2} value={newPost.excerpt} onChange={e => setNewPost({...newPost, excerpt: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm"></textarea>
                    <textarea required placeholder="Content (HTML)" rows={8} value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none font-mono text-sm"></textarea>
                    <button className="w-full bg-black text-white py-4 rounded-xl font-black uppercase hover:bg-gray-800">Publish</button>
                 </form>
              </div>
              <div className="space-y-4">
                 <h3 className="font-bold text-lg">Live Articles</h3>
                 {blogPosts.map(post => (
                    <div key={post.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                       <span className="font-bold text-sm">{post.title}</span>
                       <button onClick={() => deleteBlogPost(post.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- TAB: SETTINGS / AI TRAINER --- */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-black text-xl mb-2 flex items-center gap-2"><BrainCircuit size={20} className="text-blue-600"/> Train AI Model</h3>
                <p className="text-gray-500 text-sm mb-6">Upload underwriting guidelines, lender matrices, or company policies to the vector database.</p>
                
                {/* TOGGLE: PDF vs TEXT */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                   <button 
                     type="button"
                     onClick={() => setUploadMode('pdf')} 
                     className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition ${uploadMode === 'pdf' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-black'}`}
                   >
                     <UploadCloud size={14} className="inline mr-1"/> Upload PDF
                   </button>
                   <button 
                     type="button"
                     onClick={() => setUploadMode('text')} 
                     className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition ${uploadMode === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-black'}`}
                   >
                     <FileText size={14} className="inline mr-1"/> Paste Text
                   </button>
                </div>

                <form onSubmit={handleTrainAI} className="space-y-4">
                   <input 
                     required type="text" placeholder="Source / Title (e.g., Scotiabank B-20 Rules)" 
                     value={knowledgeSource} onChange={e => setKnowledgeSource(e.target.value)} 
                     className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-sm" 
                   />
                   
                   {uploadMode === 'pdf' ? (
                     <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                        <input 
                          type="file" accept="application/pdf" required onChange={handlePdfChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <UploadCloud size={32} className="mx-auto text-blue-500 mb-3" />
                        <p className="text-sm font-bold text-slate-700">{pdfFile ? pdfFile.name : 'Click or Drag PDF to Upload'}</p>
                        <p className="text-xs text-gray-500 mt-1">Our AI will automatically read, chunk, and learn from this document.</p>
                     </div>
                   ) : (
                     <textarea 
                       required placeholder="Paste the exact text or guidelines here..." rows={6} 
                       value={knowledgeText} onChange={e => setKnowledgeText(e.target.value)} 
                       className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm resize-none"
                     ></textarea>
                   )}

                   <input 
                     required type="password" placeholder="Admin Secret Key" 
                     value={adminKey} onChange={e => setAdminKey(e.target.value)} 
                     className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-sm" 
                   />
                   
                   {trainingMessage && (
                      <div className={`p-4 rounded-xl text-sm font-bold ${trainingStatus === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {trainingMessage}
                      </div>
                   )}

                   <button 
                     disabled={trainingStatus === 'loading'} 
                     className="w-full bg-black text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition shadow-lg"
                   >
                      {trainingStatus === 'loading' ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
                      {trainingStatus === 'loading' ? 'Vectorizing Knowledge...' : 'Upload to Brain'}
                   </button>
                </form>
             </div>
             
             <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 h-fit">
                <h3 className="font-black text-lg mb-4 uppercase tracking-tight">How the PDF Engine Works</h3>
                <ul className="space-y-4 text-sm text-gray-600">
                  <li><strong>1. File Upload:</strong> Select any bank guideline or lender matrix PDF.</li>
                  <li><strong>2. Vision AI:</strong> Instead of buggy text-extractors, we securely send the document to Gemini 2.5 Flash's Vision Engine. It reads the PDF exactly like a human, ensuring tables and matrices are understood.</li>
                  <li><strong>3. Auto-Chunking:</strong> Large PDFs crash vector databases. Our server automatically slices your 50-page PDF into optimal 1,500-character chunks.</li>
                  <li><strong>4. Vectorization:</strong> Each chunk is converted into math coordinates and saved to Firebase. Your Homepage AI Intake Form instantly has access to this new rule!</li>
                </ul>
             </div>
          </div>
        )}

      </main>

      {/* --- MODAL 1: DEAL MONITOR --- */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-8 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <button onClick={() => setSelectedDeal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X /></button>
            
            <h2 className="text-2xl font-black mb-1">{selectedDeal.clientName}</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              {selectedDeal.referrerId === 'INDIBRICK_WEB' ? `Assigned To: ${selectedDeal.assignedAgentName}` : `From: ${selectedDeal.referrerName}`}
            </p>

            <div className="mb-6">
              <label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Update Stage</label>
              <div className="grid grid-cols-2 gap-2">
                {['Received', 'Contacted', 'Underwriting', 'Approved', 'Funded', 'Declined'].map(status => (
                  <button 
                    key={status} 
                    onClick={() => handleStatusChange(status)}
                    className={`py-2 text-[10px] font-bold uppercase rounded-lg border ${selectedDeal.status === status ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-black'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col mb-4">
              <label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Timeline & Notes</label>
              <div className="bg-gray-50 rounded-xl p-4 flex-1 overflow-y-auto space-y-4 border border-gray-100 mb-4 min-h-[300px]">
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                   <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Initial Note</p>
                   <p className="text-sm text-gray-800">{selectedDeal.notes}</p>
                </div>
                {selectedDeal.timeline?.map((note, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm ${note.isSystemMessage ? 'bg-gray-200 text-center text-gray-600 text-xs font-bold uppercase' : 'bg-blue-50 border border-blue-100'}`}>
                    {!note.isSystemMessage && <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">{note.author}</p>}
                    <p>{note.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(note.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAdminNoteSubmit} className="relative">
                <input 
                  className="w-full bg-white border-2 border-gray-200 p-4 rounded-xl pr-12 font-medium focus:border-black outline-none transition" 
                  placeholder="Add note..."
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                />
                <button className="absolute right-3 top-3 bg-black text-white p-2 rounded-lg hover:bg-gray-800"><Send size={14} /></button>
              </form>
            </div>
            
            <div className="border-t border-gray-100 pt-6">
               <h4 className="font-bold text-sm mb-2">Contact Details</h4>
               <p className="text-gray-600 text-sm mb-1">📞 {selectedDeal.clientPhone}</p>
               {selectedDeal.clientEmail && <p className="text-gray-600 text-sm">✉️ {selectedDeal.clientEmail}</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: INVENTORY --- */}
      {showListingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-black p-6 flex justify-between items-center text-white">
              <h3 className="font-black text-xl uppercase tracking-wide">{currentListing.id ? 'Edit Property' : 'New Property'}</h3>
              <button onClick={() => setShowListingModal(false)} className="hover:text-gray-300"><X /></button>
            </div>
            <form onSubmit={saveListing} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
               <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Title</label>
                <input required className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none border border-transparent focus:bg-white focus:border-black transition" value={currentListing.title} onChange={e => setCurrentListing({...currentListing, title: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Price</label>
                <input required type="number" className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none" value={currentListing.price} onChange={e => setCurrentListing({...currentListing, price: Number(e.target.value)})} />
              </div>
              <div>
                 <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Status</label>
                 <select className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none" value={currentListing.status} onChange={e => setCurrentListing({...currentListing, status: e.target.value as any})}>
                    <option value="Active">Active</option><option value="Sold">Sold</option><option value="Draft">Draft</option>
                 </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">City</label>
                <input className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none" value={currentListing.city} onChange={e => setCurrentListing({...currentListing, city: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Image URL</label>
                <input className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none text-xs" value={currentListing.imageUrl} onChange={e => setCurrentListing({...currentListing, imageUrl: e.target.value})} />
              </div>
              <div className="md:col-span-2 pt-4 flex gap-4">
                <button type="button" onClick={() => setShowListingModal(false)} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition">Cancel</button>
                <button className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition shadow-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: PARTNER EDITOR --- */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-black p-6 flex justify-between items-center text-white">
              <h3 className="font-black text-xl uppercase tracking-wide">Manage Partner</h3>
              <button onClick={() => setShowPartnerModal(false)} className="hover:text-gray-300"><X /></button>
            </div>
            <form onSubmit={savePartner} className="p-8 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Auth UID (From Firebase Console)</label>
                <input required className="w-full bg-gray-50 p-3 rounded-lg font-mono text-xs outline-none" placeholder="e.g. 7d9f8g..." value={currentPartner.uid} onChange={e => setCurrentPartner({...currentPartner, uid: e.target.value})} />
                <p className="text-[10px] text-gray-400 mt-1">Must match the Authentication ID created in Firebase console.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Display Name</label>
                    <input required className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none" value={currentPartner.displayName} onChange={e => setCurrentPartner({...currentPartner, displayName: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Organization</label>
                    <input className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none" value={currentPartner.organization} onChange={e => setCurrentPartner({...currentPartner, organization: e.target.value})} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Role</label>
                    <select className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none" value={currentPartner.role} onChange={e => setCurrentPartner({...currentPartner, role: e.target.value})}>
                       <option value="partner_realtor">Realtor</option>
                       <option value="partner_lawyer">Lawyer</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Funded Volume</label>
                    <input className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none text-green-600" value={currentPartner.referralVolume} onChange={e => setCurrentPartner({...currentPartner, referralVolume: e.target.value})} />
                 </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Email</label>
                <input required type="email" className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none" value={currentPartner.email} onChange={e => setCurrentPartner({...currentPartner, email: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Phone</label>
                <input className="w-full bg-gray-50 p-3 rounded-lg font-bold outline-none" value={currentPartner.phone} onChange={e => setCurrentPartner({...currentPartner, phone: e.target.value})} />
              </div>

              <button className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition shadow-lg mt-4">Save Profile</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}