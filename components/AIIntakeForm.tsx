'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle, Loader2, Sparkles, FileText, Lock, AlertTriangle } from 'lucide-react';
import { LeadService } from '../services/LeadService';

export default function AIIntakeForm({ partnerId }: { partnerId?: string }) {
  const [step, setStep] = useState<'contact' | 'questions' | 'success'>('contact');
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  
  const [messages, setMessages] = useState<{role: 'ai' | 'user', content: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState<string[]>([]);
  
  // We store the Lead ID so we can update the CRM later when the chat finishes
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'questions' && !loading) {
      inputRef.current?.focus();
    }
  }, [step, loading, currentQuestion]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const cleaned = value.replace(/\D/g, ''); 
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      value = !match[2] ? match[1] : `(${match[1]}) ${match[2]}` + (match[3] ? `-${match[3]}` : '');
    }
    if (value.length > 14) return;
    setUserData({ ...userData, phone: value });
    if (error) setError(''); 
  };

  const startProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedPhone = userData.phone.replace(/\D/g, ''); 
    if (cleanedPhone.length !== 10) return setError('Please enter a valid 10-digit phone number.');
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(userData.email)) return setError('Please enter a valid email address.');

    setError('');
    setLoading(true);

    // INSTANT LEAD CAPTURE: Send to CRM and trigger Admin Email instantly.
    // partnerId (the realtor landing-page slug) attributes this lead to that partner.
    const result = await LeadService.submitLead({
      name: userData.name,
      email: userData.email,
      phone: cleanedPhone,
      serviceNeeded: 'AI Document Checklist (Started)',
      city: 'AI Form',
      message: 'Client has started the AI Intake Questionnaire.',
      consent: true,
      partnerId: partnerId || ''
    });

    if (result.success) {
      setActiveLeadId(result.id);
      setStep('questions');
      // Pass the lead ID directly so the first message knows about it
      processAnswer(`Hi, my name is ${userData.name}. I am ready for the questions to get my document checklist.`, result.id);
    } else {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  const processAnswer = async (answer: string, passedLeadId?: string) => {
    if (!answer.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, content: answer }];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages, 
          userData, 
          leadId: passedLeadId || activeLeadId // Pass the CRM Lead ID to the backend
        })
      });
      
      const data = await res.json();
      
      if (data.status === 'complete') {
         setChecklist(data.checklist);
         setStep('success');
      } else {
         setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
         setCurrentQuestion(data.reply);
      }
    } catch (err) {
      console.error("Intake error", err);
      setCurrentQuestion("We encountered a network error. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processAnswer(inputValue);
  };

  // ==========================================
  // UI 1: INITIAL CONTACT FORM
  // ==========================================
  if (step === 'contact') {
    return (
      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl border border-gray-100 w-full animate-fade-in">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 border border-blue-100">
           <FileText size={24}/>
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight mb-2 text-slate-900">Custom Checklist</h3>
        <p className="text-gray-500 mb-8 text-sm font-medium">
          Answer 3 quick questions and our system will instantly generate your exact document requirements.
        </p>
        
        <form onSubmit={startProcess} className="space-y-4">
           <input 
             required type="text" placeholder="Full Name" 
             className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition" 
             value={userData.name} onChange={e=>setUserData({...userData, name: e.target.value})}
           />
           <input 
             required type="email" placeholder="Email Address" 
             className={`w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition ${error.includes('email') ? 'border-red-400 focus:ring-red-500' : ''}`} 
             value={userData.email} onChange={e=>setUserData({...userData, email: e.target.value})}
           />
           <input 
             required type="tel" placeholder="Phone Number" 
             className={`w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition ${error.includes('phone') ? 'border-red-400 focus:ring-red-500' : ''}`} 
             value={userData.phone} onChange={handlePhoneChange}
           />

           {error && (
             <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 animate-shake mt-2 mb-2">
               <AlertTriangle className="text-red-500 shrink-0" size={18} />
               <p className="text-red-700 text-xs font-bold uppercase tracking-wide">{error}</p>
             </div>
           )}

           <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-500 transition mt-2 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" size={16}/> : <>Start Questionnaire <ArrowRight size={16}/></>}
           </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // UI 2: DYNAMIC QUESTIONNAIRE MODE
  // ==========================================
  if (step === 'questions') {
    return (
      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl border border-gray-100 w-full min-h-[400px] flex flex-col justify-center animate-fade-in relative overflow-hidden">
        {loading ? (
          <div className="text-center animate-pulse">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 size={32} className="text-blue-600 animate-spin" />
             </div>
             <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Analyzing Profile...</h3>
             <p className="text-gray-400 text-sm mt-2 font-medium">Customizing your next step.</p>
          </div>
        ) : (
          <div className="animate-fade-in-up">
             <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <Sparkles size={12} className="fill-blue-600" /> Smart Intake
             </div>
             <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                {currentQuestion}
             </h3>
             <form onSubmit={handleQuestionSubmit} className="relative group">
                <input 
                   ref={inputRef} type="text" 
                   className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 pr-16 font-bold text-lg text-slate-900 focus:border-blue-600 focus:bg-white outline-none transition" 
                   placeholder="Type your answer here..." 
                   value={inputValue} onChange={e => setInputValue(e.target.value)} 
                />
                <button type="submit" disabled={!inputValue.trim()} className="absolute right-3 top-3 bottom-3 bg-black text-white px-4 rounded-xl hover:bg-blue-600 transition disabled:opacity-50 disabled:hover:bg-black">
                   <ArrowRight size={20}/>
                </button>
             </form>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4 text-center">Press Enter to continue</p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // UI 3: SUCCESS & HANDOFF
  // ==========================================
  return (
    <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl border border-gray-100 w-full text-center animate-fade-in">
       <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200">
          <CheckCircle size={40}/>
       </div>
       <h3 className="text-3xl font-black uppercase tracking-tight mb-3 text-slate-900">Checklist Sent!</h3>
       <p className="text-gray-500 font-medium mb-8 leading-relaxed text-sm">
         We've emailed you the specific documents our underwriters need. Here is a quick preview:
       </p>
       <ul className="text-left space-y-3 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          {checklist.map((item, i) => (
             <li key={i} className="flex gap-3 text-sm font-bold text-slate-700">
                <CheckCircle size={18} className="text-green-500 shrink-0"/> {item}
             </li>
          ))}
       </ul>
       <a href={`/secure-portal/${activeLeadId}`} target="_blank" rel="noopener noreferrer" className="w-full block bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition shadow-xl">
          Open Secure Portal
       </a>
       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 flex items-center justify-center gap-2"><Lock size={12}/> Bank-Level Encryption</p>
    </div>
  );
}