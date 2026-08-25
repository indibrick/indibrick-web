'use client';

// Inline submissions viewer, opened from the form edit modal.
// Loads recent submissions on demand + offers a CSV download link.

import { useEffect, useState } from 'react';
import { Download, X, FileSpreadsheet, CheckCircle, User } from 'lucide-react';
import { authedGet } from '../../lib/apiClient';
import { LoadingState, EmptyState, ErrorState } from '../ui/StateFeedback';

interface FormSubmissionsPanelProps {
  formId: string;
  formSlug: string;
  onClose: () => void;
}

interface Submission {
  id: string;
  submittedAt?: string;
  payload?: Record<string, any>;
  dedupePolicy?: string;
  dedupedInto?: string | null;
  ip?: string;
}

function formatTs(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function FormSubmissionsPanel({ formId, formSlug, onClose }: FormSubmissionsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    authedGet(`/api/partner/forms/${formId}/submissions?limit=100`)
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) setError(data.error || `HTTP ${res.status}`);
        else setRows(data.submissions || []);
      })
      .catch(e => { if (!cancelled) setError(e?.message || 'Network error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [formId]);

  const download = () => {
    // Auth guard is applied server-side. Use authedGet then create a
    // blob URL so the browser prompts a save dialog with the intended
    // filename (Content-Disposition on the response).
    authedGet(`/api/partner/forms/${formId}/submissions?export=csv&limit=500`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formSlug}-submissions.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => setError('CSV download failed'));
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Submissions · /f/{formSlug}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Last 100 submissions, newest first. Export up to 500.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={download}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg flex items-center gap-1 transition shadow-sm">
              <Download size={11}/> CSV
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-slate-900 p-1"><X size={18}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
          {loading && <LoadingState label="Loading submissions"/>}
          {error && !loading && <ErrorState title="Could not load submissions" detail={error} />}
          {!loading && !error && rows.length === 0 && (
            <EmptyState
              icon={FileSpreadsheet}
              title="No submissions yet"
              description={`Once someone submits at /f/${formSlug}, they'll appear here.`}
              compact
            />
          )}
          {!loading && !error && rows.map(r => {
            const p = r.payload || {};
            const name = p.name || p.full_name || p.fullName || p.clientName || Object.values(p)[0] || '(no name)';
            const email = p.email || p.clientEmail;
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm mb-2">
                <button onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full flex items-start justify-between gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User size={12} className="text-slate-500 shrink-0"/>
                      <p className="text-sm font-black text-slate-900 truncate">{String(name)}</p>
                      {r.dedupedInto && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5">
                          {r.dedupePolicy === 'append' ? 'APPENDED' : r.dedupePolicy === 'skip' ? 'SKIPPED' : 'DUPE'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{email || '—'} · {formatTs(r.submittedAt)}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">{isOpen ? 'Hide' : 'Details'}</span>
                </button>
                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <table className="w-full text-xs">
                      <tbody>
                        {Object.entries(p).map(([k, v]) => (
                          <tr key={k} className="border-b border-gray-50 last:border-0">
                            <td className="py-1.5 pr-3 text-[10px] font-black uppercase tracking-widest text-gray-500 w-1/3 align-top">{k}</td>
                            <td className="py-1.5 text-slate-900 break-words">{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {r.dedupedInto && (
                      <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1"><CheckCircle size={10} className="text-emerald-600"/> Deduped into referral <code className="bg-gray-100 px-1 rounded">{r.dedupedInto}</code></p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
