'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../AdminContext';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../../firebase'; 
import { 
  Activity, FileText, CheckCircle, Clock, LogOut, 
  ChevronRight, Shield, AlertTriangle, Zap, Target, 
  MapPin, X, Loader2, FolderOpen, User, ArrowDownLeft, Send, ArrowRight, Lock 
} from 'lucide-react';

interface BorrowDirectDeal {
  id: string;
  referralId: string;
  location: string;
  propertyType: string;
  loanAmount: number;
  ltv: number;
  position: string;
  aiSummary: string;
  status: 'Live' | 'Awarded' | 'Funded';
  awardedToLenderId?: string;
  createdAt: string;
}

interface Bid {
  id: string;
  dealId: string;
  lenderId: string;
  proposedRate: number;
  lenderFee: number;
  conditions: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}

export default function LenderDashboard() {
  const { user, loading, logout } = useAdmin();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'marketplace' | 'my_leads'>('marketplace');
  const [deals, setDeals] = useState<BorrowDirectDeal[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [lenderName, setLenderName] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  // Modals State
  const [selectedDeal, setSelectedDeal] = useState<BorrowDirectDeal | null>(null);
  const [selectedPortfolioDeal, setSelectedPortfolioDeal] = useState<any | null>(null);
  const [bidForm, setBidForm] = useState({ rate: '', fee: '', conditions: '' });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [lenderNoteInput, setLenderNoteInput] = useState('');

  // --- REAL-TIME DATA FETCHING ---
  useEffect(() => {
    if (!loading && !user) {
        router.push('/lender/login');
        return;
    } 
    if (!user) return;

    let unsubDeals: () => void;
    let unsubBids: () => void;

    const initLenderSession = async () => {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists() || (userDoc.data().role !== 'lender' && userDoc.data().role !== 'admin')) {
                alert("Unauthorized Access.");
                logout();
                return;
            }
            setLenderName(userDoc.data().displayName || 'Private Capital Partner');

            // 1. REAL-TIME LISTENER FOR ALL DEALS
            unsubDeals = onSnapshot(collection(db, 'borrow_direct_deals'), (dealsSnap) => {
                const allDeals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() } as BorrowDirectDeal));
                
                // 2. REAL-TIME LISTENER FOR MY BIDS
                const bidsQ = query(collection(db, 'borrow_direct_bids'), where('lenderId', '==', user.uid));
                unsubBids = onSnapshot(bidsQ, async (bidsSnap) => {
                    const fetchedBids = bidsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bid));
                    setMyBids(fetchedBids);

                    // Sort out Live Deals
                    const liveDeals = allDeals.filter(d => d.status === 'Live');
                    liveDeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setDeals(liveDeals);

                    // Build Awarded Portfolio (My Leads)
                    const acceptedBids = fetchedBids.filter(b => b.status === 'Accepted');
                    const awardedDeals = allDeals.filter(deal => 
                        acceptedBids.some(b => b.dealId === deal.id) || 
                        (deal.status === 'Awarded' && deal.awardedToLenderId === user.uid) ||
                        (deal.status === 'Funded' && deal.awardedToLenderId === user.uid)
                    );

                    const portfolioPromises = awardedDeals.map(async (dealData) => {
                        let refData: any = {};
                        let isLocked = false;
                        let clientName = "Syncing File...";
                        
                        const myWinningBid = fetchedBids.find(b => b.dealId === dealData.id) || { proposedRate: 'N/A', lenderFee: 'N/A' };

                        try {
                            let refDoc = await getDoc(doc(db, "referrals", dealData.referralId));
                            if (!refDoc.exists()) {
                                refDoc = await getDoc(doc(db, "leads", dealData.referralId));
                            }
                            if (refDoc.exists()) {
                                refData = refDoc.data();
                                clientName = refData.clientName || "Unknown Client";
                            } else {
                                clientName = "⚠️ CRM File Missing";
                                isLocked = true;
                            }
                        } catch (err) {
                            clientName = "⚠️ FIREBASE BLOCKED ACCESS";
                            isLocked = true;
                        }

                        return { 
                            ...refData, 
                            id: dealData.referralId, 
                            clientName: clientName,
                            bdDeal: dealData,
                            myBid: myWinningBid,
                            isLocked: isLocked 
                        };
                    });

                    const pDeals = await Promise.all(portfolioPromises);
                    setPortfolio(pDeals);
                    setDataLoading(false);
                });
            });

        } catch (e: any) {
            console.error("Session Init Error:", e);
            setDataLoading(false);
        }
    };

    initLenderSession();

    return () => {
        if (unsubDeals) unsubDeals();
        if (unsubBids) unsubBids();
    };
  }, [user, loading, router]);

  // --- SUBMIT TERM SHEET ---
  const handleBidSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !selectedDeal) return;
      setSubmittingBid(true);

      try {
          const newBid = {
              dealId: selectedDeal.id,
              lenderId: user.uid,
              lenderName: lenderName,
              proposedRate: Number(bidForm.rate),
              lenderFee: Number(bidForm.fee),
              conditions: bidForm.conditions,
              status: 'Pending',
              createdAt: new Date().toISOString()
          };

          await addDoc(collection(db, 'borrow_direct_bids'), newBid);
          alert("Term Sheet Submitted! IndiBrick Underwriting will review shortly.");
          setSelectedDeal(null);
          setBidForm({ rate: '', fee: '', conditions: '' });
      } catch (err) {
          alert("Failed to submit term sheet. Please try again.");
      } finally {
          setSubmittingBid(false);
      }
  };

  // --- CRM TIMELINE NOTE SUBMISSION ---
  const handleLenderNoteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPortfolioDeal || selectedPortfolioDeal.isLocked) return;
      
      const newNote = {
          type: 'note',
          author: `${lenderName} (Lender)`,
          content: lenderNoteInput,
          timestamp: new Date().toISOString(),
          isSystemMessage: false
      };

      const updatedTimeline = [...(selectedPortfolioDeal.timeline || []), newNote];
      
      try {
          try {
             await updateDoc(doc(db, "referrals", selectedPortfolioDeal.id), { timeline: updatedTimeline });
          } catch (e) {
             await updateDoc(doc(db, "leads", selectedPortfolioDeal.id), { timeline: updatedTimeline });
          }
          setSelectedPortfolioDeal({ ...selectedPortfolioDeal, timeline: updatedTimeline });
          setLenderNoteInput('');
      } catch (e) {
          alert("Failed to post note. Please check permissions.");
      }
  }

  if (loading || dataLoading) {
      return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-blue-600" size={40}/><p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Syncing Real-Time Data...</p></div>;
  }

  const biddedDealIds = new Set(myBids.map(b => b.dealId));
  const availableDeals = deals.filter(d => !biddedDealIds.has(d.id));
  const pendingBids = myBids.filter(b => b.status === 'Pending');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 pb-20 md:pb-0">
      
      <style dangerouslySetInnerHTML={{__html: `
        header:not(.portal-header), nav:not(.portal-nav), footer, [class*="fixed"][class*="bottom-"]:not(.portal-nav) { display: none !important; }
      `}} />

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-64 bg-[#0B0F19] text-white flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-8">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
             <Shield size={20} className="text-black fill-black"/>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter">BorrowDirect</h2>
          <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live Connection</p>
        </div>
        
        {/* THE FIX: ADDED .portal-nav SO IT DOES NOT GET HIDDEN BY CSS */}
        <nav className="portal-nav space-y-1 px-4 flex-1">
          <button onClick={() => setActiveTab('marketplace')} className={`w-full flex items-center justify-between px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'marketplace' ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <div className="flex items-center gap-3"><Target size={16} /> Dashboard</div>
             <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'marketplace' ? 'bg-black/20 text-black' : 'bg-white/10 text-white'}`}>{availableDeals.length + pendingBids.length}</span>
          </button>
          
          <button onClick={() => setActiveTab('my_leads')} className={`w-full flex items-center justify-between px-4 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'my_leads' ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
             <div className="flex items-center gap-3"><FolderOpen size={16} /> My Leads</div>
             <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'my_leads' ? 'bg-black/20 text-black' : 'bg-white/10 text-white'}`}>{portfolio.length}</span>
          </button>
        </nav>
        
        <div className="p-6 border-t border-slate-800">
           <button onClick={logout} className="w-full flex items-center gap-3 text-xs font-bold uppercase text-slate-500 hover:text-red-400 transition">
              <LogOut size={14}/> Sign Out
           </button>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="portal-nav md:hidden fixed bottom-0 left-0 w-full bg-[#0B0F19] text-slate-400 z-40 flex justify-between items-center px-6 py-3 pb-safe border-t border-slate-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
         <button onClick={() => setActiveTab('marketplace')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'marketplace' ? 'text-amber-500 scale-110' : 'hover:text-white'}`}>
            <Target size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Market</span>
         </button>

         <button onClick={() => setActiveTab('my_leads')} className={`flex flex-col items-center gap-1.5 transition ${activeTab === 'my_leads' ? 'text-amber-500 scale-110' : 'hover:text-white'}`}>
            <FolderOpen size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">My Leads</span>
         </button>

         <button onClick={logout} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-red-400 transition">
            <LogOut size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Exit</span>
         </button>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="md:ml-64 flex-1 p-6 md:p-10 overflow-x-hidden">
        
        <header className="portal-header flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
           <div>
             <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
               {activeTab === 'marketplace' ? 'Market Dashboard' : 'My Awarded Leads'}
             </h1>
             <p className="text-slate-500 font-medium text-sm mt-1">
               {activeTab === 'marketplace' ? 'Deploy capital into vetted, anonymized private debt opportunities.' : 'Full CRM access for leads awarded to your fund.'}
             </p>
           </div>
        </header>

        {/* --- TAB 1: DASHBOARD --- */}
        {activeTab === 'marketplace' && (
           <div className="animate-fade-in-up space-y-10">
              
              {pendingBids.length > 0 && (
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">Your Pending Bids</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                       {pendingBids.map(bid => (
                          <div key={bid.id} className="bg-gray-50 border border-gray-200 rounded-3xl p-6 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-10"><Clock size={40}/></div>
                             <div className="flex justify-between items-center mb-4">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Under Review</span>
                                <span className="text-[10px] font-bold text-gray-400">Ref: {bid.dealId.slice(0,6)}</span>
                             </div>
                             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Proposed Terms</p>
                             <h4 className="text-2xl font-black text-slate-900">{bid.proposedRate}% Rate</h4>
                             <p className="text-sm font-bold text-gray-600 mb-4">{bid.lenderFee}% Lender Fee</p>
                             <p className="text-xs text-gray-500 font-medium line-clamp-2">Awaiting Admin decision. You will be notified via email if awarded.</p>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              <div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">Borrowers Currently Looking</h3>
                 {availableDeals.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                       <Activity size={40} className="mx-auto text-gray-300 mb-4" />
                       <h3 className="text-xl font-bold text-gray-500 mb-2">No New Opportunities</h3>
                       <p className="text-sm text-gray-400 max-w-sm mx-auto">We are currently underwriting new applications. Check back soon.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                       {availableDeals.map(deal => (
                          <div key={deal.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all duration-200 flex flex-col">
                             <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                                <div className="space-y-2">
                                   <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${deal.position === '1st' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                      {deal.position} Position
                                   </span>
                                   <span className="block px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-md text-[9px] font-black uppercase tracking-widest w-max">
                                      {deal.propertyType}
                                   </span>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Target LTV</p>
                                   <p className="text-xl font-black text-amber-500">{deal.ltv}%</p>
                                </div>
                             </div>

                             <div className="mb-6">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Requested Loan</p>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">${deal.loanAmount.toLocaleString()}</h3>
                                <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-2">
                                   <MapPin size={14}/> {deal.location}, ON
                                </p>
                             </div>

                             <div className="flex-grow mb-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 mb-2">
                                   <Zap size={14} className="text-amber-500"/> Underwriting Summary
                                </p>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                   <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap line-clamp-4">
                                      {deal.aiSummary || "Deal vetted by IndiBrick underwriting. Strong exit strategy indicated."}
                                   </p>
                                </div>
                             </div>

                             <button onClick={() => setSelectedDeal(deal)} className="w-full bg-slate-900 hover:bg-amber-500 hover:text-black text-white py-4 rounded-xl font-black uppercase tracking-widest text-[11px] transition-colors duration-300 flex items-center justify-center gap-2 shadow-md">
                                Draft Term Sheet <ChevronRight size={16}/>
                             </button>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* --- TAB 2: MY LEADS (AWARDED CRM) --- */}
        {activeTab === 'my_leads' && (
           <div className="animate-fade-in-up">
              {portfolio.length === 0 ? (
                 <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                    <FolderOpen size={40} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-500 mb-2">No Awarded Leads Yet</h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">When your term sheet is accepted, the full client file will unlock here instantly.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {portfolio.map(deal => (
                       <div key={deal.id} onClick={() => !deal.isLocked && setSelectedPortfolioDeal(deal)} className={`bg-white rounded-3xl p-6 border ${deal.isLocked ? 'border-red-400 shadow-red-100' : 'border-green-200'} shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col relative overflow-hidden group`}>
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${deal.isLocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          
                          <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4 pl-2">
                             <div>
                                <h3 className={`text-xl font-black tracking-tight ${deal.isLocked ? 'text-red-600' : 'text-slate-900 group-hover:text-green-700'} transition`}>{deal.clientName}</h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                                   <MapPin size={12}/> {deal.bdDeal.location}
                                </p>
                             </div>
                             <div className="text-right">
                                <span className={`${deal.isLocked ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'} border px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm`}>
                                   {deal.isLocked ? 'Access Denied' : 'Active Lead'}
                                </span>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6 pl-2">
                             <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Loan Amount</p>
                                <p className="text-lg font-black text-slate-900">${deal.bdDeal.loanAmount.toLocaleString()}</p>
                             </div>
                             <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mb-0.5">Approved Rate</p>
                                <p className="text-lg font-black text-amber-600">{deal.myBid?.proposedRate || 'N/A'}%</p>
                             </div>
                          </div>

                          <div className="flex items-center justify-between mt-auto pl-2 pt-2">
                             {deal.isLocked ? (
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> Needs Rule Update</span>
                             ) : (
                                <>
                                   <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><FileText size={12}/> {deal.vault?.length || 0} Docs Available</span>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1">Open CRM <ArrowRight size={12}/></span>
                                </>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}
      </main>

      {/* --- MARKETPLACE BIDDING MODAL --- */}
      {selectedDeal && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 md:zoom-in-95 flex flex-col max-h-[90vh]">
               <div className="bg-slate-900 p-6 md:p-8 flex justify-between items-start relative shrink-0 text-white">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="relative z-10">
                     <span className="bg-amber-500 text-black px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mb-3 inline-block shadow-sm">Official Term Sheet</span>
                     <h3 className="text-2xl font-black uppercase tracking-tight">Draft Commitment</h3>
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Lock size={12}/> Target Deal: ${selectedDeal.loanAmount.toLocaleString()} • {selectedDeal.location}
                     </p>
                  </div>
                  <button onClick={() => setSelectedDeal(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition relative z-10"><X size={16}/></button>
               </div>

               <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar pb-10 md:pb-8">
                  <form onSubmit={handleBidSubmit} className="space-y-6">
                     <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4 items-start">
                        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5"/>
                        <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                           <strong>Fee Structure Disclosure:</strong> IndiBrick charges a standard administration fee directly to the borrower. The <strong>Lender Fee</strong> you propose below will be paid 100% to you from the mortgage proceeds.
                        </p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 md:gap-6">
                        <div>
                           <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Annual Rate (%)</label>
                           <div className="relative"><input required type="number" step="0.01" value={bidForm.rate} onChange={e=>setBidForm({...bidForm, rate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-black text-slate-900 text-xl focus:border-black focus:ring-2 focus:ring-black outline-none transition" placeholder="e.g. 8.99"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">%</span></div>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Lender Fee (%)</label>
                           <div className="relative"><input required type="number" step="0.01" value={bidForm.fee} onChange={e=>setBidForm({...bidForm, fee: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-black text-slate-900 text-xl focus:border-black focus:ring-2 focus:ring-black outline-none transition" placeholder="e.g. 2.00"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">%</span></div>
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Conditions Precedent / Notes</label>
                        <textarea rows={3} value={bidForm.conditions} onChange={e=>setBidForm({...bidForm, conditions: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium text-sm text-slate-900 focus:border-black focus:ring-2 focus:ring-black outline-none transition resize-none placeholder:text-gray-400" placeholder="e.g. Rate requires 12 months prepaid interest. Formal appraisal required by A-list firm."/>
                     </div>
                     <div className="pt-6 border-t border-gray-100 flex flex-col-reverse md:flex-row justify-end gap-3">
                        <button type="button" onClick={() => setSelectedDeal(null)} className="px-6 py-4 md:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition w-full md:w-auto">Cancel</button>
                        <button type="submit" disabled={submittingBid} className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 md:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 w-full md:w-auto">
                           {submittingBid ? 'Transmitting...' : 'Submit Official Term Sheet'} <ChevronRight size={16}/>
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         </div>
      )}

      {/* --- LENDER CRM MODAL (AWARDED DEALS) --- */}
      {selectedPortfolioDeal && !selectedPortfolioDeal.isLocked && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-end p-0 md:p-4">
          <div className="w-full md:max-w-xl bg-white h-[90vh] md:h-full shadow-2xl animate-in fade-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-200 flex flex-col rounded-t-[2rem] md:rounded-[2rem] overflow-hidden">
            
            <div className="bg-green-600 text-white p-5 md:p-6 pb-6 md:pb-8 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">{selectedPortfolioDeal.clientName}</h2>
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white text-green-700">Client File Unlocked</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-bold text-green-100 uppercase tracking-widest">📞 {selectedPortfolioDeal.clientPhone} • ✉️ {selectedPortfolioDeal.clientEmail}</p>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={() => setSelectedPortfolioDeal(null)} className="bg-black/10 hover:bg-black/20 text-white p-2 rounded-full transition"><X size={14}/></button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-5 md:p-6 bg-gray-50 overflow-y-auto pb-32 md:pb-6">
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                 <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-sm">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Approved Rate</p>
                    <p className="text-sm font-black text-amber-600">{selectedPortfolioDeal.myBid?.proposedRate || 'N/A'}%</p>
                 </div>
                 <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-sm">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Lender Fee</p>
                    <p className="text-sm font-black text-amber-600">{selectedPortfolioDeal.myBid?.lenderFee || 'N/A'}%</p>
                 </div>
                 <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-sm">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Target LTV</p>
                    <p className="text-sm font-black text-slate-900">{selectedPortfolioDeal.bdDeal.ltv}%</p>
                 </div>
              </div>
              
              {selectedPortfolioDeal.vault && selectedPortfolioDeal.vault.length > 0 && (
                 <div className="mb-5 md:mb-6">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                       <FileText size={12}/> Document Vault ({selectedPortfolioDeal.vault.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {selectedPortfolioDeal.vault.map((doc: any, i: number) => (
                          <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-400 transition">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg shrink-0"><FileText size={14} /></div>
                                <div className="truncate">
                                   <p className="text-[10px] font-bold text-slate-900 truncate">{doc.documentType || 'Document'}</p>
                                   <p className="text-[8px] text-gray-400 uppercase tracking-widest truncate">{doc.fileName}</p>
                                </div>
                             </div>
                             <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-100 hover:bg-slate-900 hover:text-white p-1.5 rounded-lg transition text-slate-600 shrink-0" title="Download File"><ArrowDownLeft size={12} className="rotate-180" /></a>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              <div className="mb-5 border-t border-gray-200 pt-4">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                     <Activity size={12}/> Communicate with Underwriting
                  </h3>
                  <form onSubmit={handleLenderNoteSubmit} className="relative">
                    <textarea className="w-full bg-white border border-gray-200 p-4 pr-12 rounded-2xl font-medium focus:border-blue-500 outline-none transition resize-none text-[14px] shadow-sm" rows={2} placeholder="Add a note or request additional documents..." value={lenderNoteInput} onChange={e => setLenderNoteInput(e.target.value)} required />
                    <button className="absolute right-2 bottom-3 p-2 rounded-xl text-white transition shadow-sm bg-slate-900 hover:bg-black"><Send size={14} /></button>
                  </form>
              </div>

              <div className="flex-1 space-y-3">
                {selectedPortfolioDeal.timeline?.slice().reverse().map((log: any, i: number) => (
                  <div key={i} className={`p-4 rounded-2xl text-xs border shadow-sm ${log.isSystemMessage ? 'bg-gray-100 border-gray-200 text-center' : log.author.includes('Lender') ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-200'}`}>
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

    </div>
  );
}