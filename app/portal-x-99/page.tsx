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
  Home, Edit2, X, MessageSquare, Send, UserPlus 
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
  
  // Partner Modal (NEW)
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<any>({});

  const [selectedDeal, setSelectedDeal] = useState<Referral | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const [newPost, setNewPost] = useState({
    title: '', slug: '', category: 'Mortgage', imageUrl: '', excerpt: '', content: ''
  });

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
      // New Partner Template
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
    if (confirm("Delete this partner profile? (This removes them from the database, but does not delete their login credentials in Firebase Auth)")) {
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

  const handleSeedDatabase = async () => {
    if(confirm("Import default listings?")) {
      await PropertyService.seedDatabase();
      loadAllData();
    }
  };

  const openListingModal = (listing?: Property) => {
    if (listing) setCurrentListing(listing);
    else setCurrentListing({
      title: '', price: 0, address: '', city: 'Toronto', 
      bedrooms: 3, bathrooms: 2, type: 'Detached', 
      purpose: 'Sale', imageUrl: '', isFeatured: false, status: 'Active',
      landingPageUrl: '' // <-- NEW FIELD FOR CUSTOM VIP FUNNELS
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
            { id: 'settings', icon: Settings, label: 'Config' }
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

        {/* --- TAB: PARTNERS (FULL MANAGER) --- */}
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
              
              {/* --- NEW FIELD: CUSTOM VIP FUNNEL ROUTING --- */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Custom Funnel URL (Optional)</label>
                <input 
                  placeholder="/vip-access/1515-pickering-pkwy" 
                  className="w-full bg-blue-50 border border-blue-100 p-3 rounded-lg font-bold outline-none text-xs text-blue-700 focus:border-blue-300 transition" 
                  value={currentListing.landingPageUrl || ''} 
                  onChange={e => setCurrentListing({...currentListing, landingPageUrl: e.target.value})} 
                />
                <p className="text-[10px] text-gray-400 mt-1">If filled, users will bypass the modal and go straight to this high-converting landing page.</p>
              </div>
              {/* ------------------------------------------- */}

              <div className="md:col-span-2 pt-4 flex gap-4">
                <button type="button" onClick={() => setShowListingModal(false)} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition">Cancel</button>
                <button className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition shadow-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: PARTNER EDITOR (NEW) --- */}
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