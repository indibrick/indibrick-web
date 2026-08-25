'use client';

// 3-step CSV import: Upload → Map → Confirm.
//
// Step 1 — user drops or picks a .csv. We parse client-side (no upload
//          during map/preview — data stays in the browser until
//          confirm). Headers show up as pill chips.
// Step 2 — auto-map runs; user tweaks any column → referral-field
//          mapping. Preview of first 5 rows renders using the current
//          mapping so mistakes are obvious.
// Step 3 — configure defaults (assign to me, default dealType/status
//          /tag), preview the destination counts, hit Import. Server
//          dedupes on email/phone against the last 5000 referrals.

import { useMemo, useRef, useState } from 'react';
import { Upload, ArrowRight, ArrowLeft, CheckCircle, X, FileSpreadsheet, AlertCircle } from 'lucide-react';
import {
  parseCsv, autoMapHeaders, projectRow, REFERRAL_IMPORT_FIELDS,
  type ReferralImportField,
} from '../../lib/csvImport';
import { authedPost } from '../../lib/apiClient';
import { useToast } from '../ui/ToastProvider';

interface CsvImportModalProps {
  onClose: () => void;
  onImported: (createdIds: string[]) => void;
}

type Step = 'upload' | 'map' | 'confirm' | 'importing' | 'done';

interface ImportSummary {
  received: number;
  imported: number;
  skippedDupes: number;
  skippedInvalid: number;
  skippedReasons?: string[];
  createdIds: string[];
}

export default function CsvImportModal({ onClose, onImported }: CsvImportModalProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, ReferralImportField | ''>>({});
  const [assignToSelf, setAssignToSelf] = useState(true);
  const [defaults, setDefaults] = useState({ dealType: 'Mortgage', status: 'New', tag: '' });
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const preview = useMemo(() => rows.slice(0, 5).map(r => projectRow(r, mapping)), [rows, mapping]);
  const projectedCount = rows.length;

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Not a CSV', 'Save your export as .csv first.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const { headers: hs, rows: rs } = parseCsv(text);
      if (hs.length === 0) { toast.error('CSV is empty or unreadable.'); return; }
      setFileName(file.name);
      setHeaders(hs);
      setRows(rs);
      setMapping(autoMapHeaders(hs));
      setStep('map');
    };
    reader.onerror = () => toast.error('Could not read that file.');
    reader.readAsText(file);
  };

  const runImport = async () => {
    setStep('importing');
    try {
      const payload = {
        rows: rows.map(r => projectRow(r, mapping)),
        assignToSelf,
        defaultDealType: defaults.dealType,
        defaultStatus: defaults.status,
        defaultTag: defaults.tag || undefined,
      };
      const res = await authedPost('/api/partner/referrals/import', payload);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error('Import failed', data.error || `HTTP ${res.status}`);
        setStep('confirm');
        return;
      }
      setSummary(data);
      setStep('done');
      toast.success(`Imported ${data.imported} deal${data.imported === 1 ? '' : 's'}`,
        data.skippedDupes || data.skippedInvalid
          ? `${data.skippedDupes || 0} dupes · ${data.skippedInvalid || 0} invalid rows skipped`
          : undefined);
      if (data.createdIds) onImported(data.createdIds);
    } catch (e: any) {
      toast.error('Network error', e?.message || 'Please retry.');
      setStep('confirm');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl border border-gray-200 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Import CSV</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === 'upload' && 'Pick a .csv export from your current CRM.'}
              {step === 'map' && `${projectedCount} row${projectedCount === 1 ? '' : 's'} from ${fileName}. Confirm the column mapping.`}
              {step === 'confirm' && `Ready to import ${projectedCount} row${projectedCount === 1 ? '' : 's'}.`}
              {step === 'importing' && 'Importing…'}
              {step === 'done' && 'Import complete.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-900 p-1"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-gray-50 custom-scrollbar">
          {/* Step 1 */}
          {step === 'upload' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center bg-white cursor-pointer hover:border-slate-900 transition"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={32} className="text-slate-500 mx-auto mb-3"/>
              <p className="text-lg font-black text-slate-900">Drop a CSV or click to pick</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Export from kvCORE / Follow Up Boss / any CRM. First row = column headers. Up to 5,000 rows per import.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {/* Step 2 — column mapping + preview */}
          {step === 'map' && (
            <div className="space-y-5">
              <section className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3 flex items-center gap-2">
                  <FileSpreadsheet size={12}/> Column mapping
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {headers.map((h, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">CSV column</p>
                      <p className="text-sm font-black text-slate-900 mb-2 truncate">{h || `Column ${idx + 1}`}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Maps to</p>
                      <select
                        value={mapping[idx] || ''}
                        onChange={e => setMapping(m => ({ ...m, [idx]: (e.target.value || '') as ReferralImportField | '' }))}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-slate-900 text-slate-900"
                      >
                        <option value="">— Ignore this column —</option>
                        {REFERRAL_IMPORT_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3">Preview (first 5)</h3>
                <div className="space-y-2">
                  {preview.map((p, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1">
                        <div><span className="text-gray-400">Name:</span> <span className="text-slate-900 font-bold">{p.clientName || '—'}</span></div>
                        <div><span className="text-gray-400">Email:</span> <span className="text-slate-900">{p.clientEmail || '—'}</span></div>
                        <div><span className="text-gray-400">Phone:</span> <span className="text-slate-900">{p.clientPhone || '—'}</span></div>
                        {p.status && <div><span className="text-gray-400">Status:</span> <span className="text-slate-900">{p.status}</span></div>}
                        {p.dealType && <div><span className="text-gray-400">Type:</span> <span className="text-slate-900">{p.dealType}</span></div>}
                        {p.loanAmount ? <div><span className="text-gray-400">Amount:</span> <span className="text-slate-900">${p.loanAmount.toLocaleString()}</span></div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Step 3 — defaults + confirm */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <section className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Assignment + defaults</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={assignToSelf} onChange={e => setAssignToSelf(e.target.checked)}
                    className="w-4 h-4 accent-slate-900"/>
                  <span className="font-bold text-slate-900">Assign to me</span>
                  <span className="text-xs text-gray-500">— unchecked = ADMIN_INBOX</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Default deal type</span>
                    <select value={defaults.dealType} onChange={e => setDefaults({ ...defaults, dealType: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900">
                      <option>Mortgage</option><option>Real Estate</option><option>Insurance</option><option>Legal</option>
                    </select>
                  </label>
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Default status</span>
                    <input value={defaults.status} onChange={e => setDefaults({ ...defaults, status: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                  </label>
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Auto-tag (optional)</span>
                    <input value={defaults.tag} onChange={e => setDefaults({ ...defaults, tag: e.target.value })}
                      placeholder="e.g. Imported book 2026"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-slate-900 text-slate-900"/>
                  </label>
                </div>
              </section>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold">Dedupe policy</p>
                  <p>Rows whose email or phone already exists on any of the most recent 5,000 referrals are skipped. Same file duplicates are collapsed automatically.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — importing spinner */}
          {step === 'importing' && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto mb-4"/>
              <p className="text-sm font-black text-slate-900">Writing {projectedCount} row{projectedCount === 1 ? '' : 's'}…</p>
              <p className="text-xs text-gray-500 mt-1">Do not close this tab.</p>
            </div>
          )}

          {/* Step 5 — done summary */}
          {step === 'done' && summary && (
            <div className="text-center py-10">
              <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3"/>
              <p className="text-xl font-black text-slate-900">Import complete</p>
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6">
                <div className="bg-white p-4 rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Imported</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{summary.imported}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Dupes</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{summary.skippedDupes}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Invalid</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">{summary.skippedInvalid}</p>
                </div>
              </div>
              {summary.skippedReasons && summary.skippedReasons.length > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  Sample issue: {summary.skippedReasons[0]}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
          <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2">
            Close
          </button>
          <div className="flex items-center gap-2">
            {step === 'map' && (
              <>
                <button onClick={() => setStep('upload')} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2 flex items-center gap-1">
                  <ArrowLeft size={11}/> Back
                </button>
                <button onClick={() => setStep('confirm')} className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm">
                  Continue <ArrowRight size={11}/>
                </button>
              </>
            )}
            {step === 'confirm' && (
              <>
                <button onClick={() => setStep('map')} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-slate-900 px-4 py-2 flex items-center gap-1">
                  <ArrowLeft size={11}/> Back
                </button>
                <button onClick={runImport} className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow-sm">
                  Import {projectedCount} row{projectedCount === 1 ? '' : 's'} <ArrowRight size={11}/>
                </button>
              </>
            )}
            {step === 'done' && (
              <button onClick={onClose} className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition shadow-sm">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
