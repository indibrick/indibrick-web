'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, Loader2, ShieldCheck, Lock, AlertTriangle, FileText } from 'lucide-react';

export default function SecurePortalPage({ params }: { params: { leadId: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortalData();
  }, [params.leadId]);

  const fetchPortalData = async () => {
    try {
      const res = await fetch(`/api/client/portal-data?leadId=${params.leadId}`);
      if (!res.ok) throw new Error("Could not load portal data.");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("Invalid or expired secure link.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, requirementName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingItem(requirementName);
    setError('');

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
            leadId: params.leadId,
            requirementName: requirementName // Tell the backend WHICH item this is for
        })
      });

      if (!res.ok) throw new Error("Upload failed");
      
      // Refresh the data to show the new file in the stack!
      await fetchPortalData();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingItem(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 font-sans py-12">
      <div className="max-w-2xl w-full">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl mb-6 shadow-lg shadow-blue-500/30">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Secure Vault</h1>
          <p className="text-gray-500 font-medium">Welcome back, {data.clientName}. Please upload your required documents below.</p>
        </div>

        {/* Document Checklist Area */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
          <h3 className="font-black text-xl mb-6 uppercase tracking-tight">Your Document Checklist</h3>
          
          <div className="space-y-6">
             {data.requiredDocuments.length === 0 && <p className="text-gray-500">No documents requested yet.</p>}
             
             {data.requiredDocuments.map((req: string, i: number) => {
                // THE FIX: Find ALL files uploaded for this specific requirement
                const uploadedFiles = data.vault.filter((v: any) => v.requirementName === req);
                const hasFiles = uploadedFiles.length > 0;
                const isUploading = uploadingItem === req;

                return (
                   <div key={i} className={`p-6 rounded-3xl border transition-all duration-300 ${hasFiles ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      
                      {/* Top Row: Requirement Name & Upload Button */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                             {hasFiles ? <CheckCircle className="text-green-500 shrink-0" size={24}/> : <AlertTriangle className="text-orange-400 shrink-0" size={24}/>}
                             <span className={`font-bold text-base ${hasFiles ? 'text-slate-900' : 'text-slate-700'}`}>{req}</span>
                          </div>
                          
                          <div className="shrink-0 w-full md:w-auto">
                             <label className={`w-full md:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${hasFiles ? 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
                                {isUploading ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>}
                                {isUploading ? 'Encrypting...' : (hasFiles ? 'Add Another' : 'Upload File')}
                                <input type="file" accept=".pdf,image/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(e, req)} />
                             </label>
                          </div>
                      </div>

                      {/* Bottom Row: List of successfully uploaded files for this requirement */}
                      {hasFiles && (
                         <div className="mt-5 space-y-2 border-t border-blue-100 pt-5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Files Received</p>
                            {uploadedFiles.map((file: any, fileIdx: number) => (
                               <div key={fileIdx} className="flex items-center justify-between bg-white p-3 md:p-4 rounded-xl border border-blue-50 shadow-sm">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="bg-blue-50 text-blue-500 p-2 rounded-lg shrink-0">
                                        <FileText size={14} />
                                     </div>
                                     <span className="text-xs font-bold text-slate-700 truncate">{file.fileName}</span>
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1">
                                     <Lock size={10}/> Secured
                                  </span>
                               </div>
                            ))}
                         </div>
                      )}

                   </div>
                );
             })}
          </div>
          
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
             <Lock size={12} className="text-gray-400"/>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank-Level TLS 1.3 Encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}