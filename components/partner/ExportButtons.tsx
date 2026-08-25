'use client';
// Wave I-1 — client-side download buttons for /api/partner/export.
// The export endpoint requires a Bearer token, so a plain <a> won't
// work; we fetch, blob, and trigger the download from JS.

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { authedGet } from '../../lib/apiClient';

interface Btn {
  label: string;
  url: string;
  filename: string;
}

const BUTTONS: Btn[] = [
  { label: 'Referrals CSV', url: '/api/partner/export?format=csv&collection=referrals', filename: 'referrals.csv' },
  { label: 'Messages CSV',  url: '/api/partner/export?format=csv&collection=messages',  filename: 'messages.csv' },
  { label: 'Tasks CSV',     url: '/api/partner/export?format=csv&collection=tasks',     filename: 'tasks.csv' },
];

async function downloadAuthed(url: string, filename: string) {
  const res = await authedGet(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function ExportButtons() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (b: Btn | { label: string; url: string; filename: string; jsonPretty?: boolean }) => {
    setBusy(b.label);
    setError(null);
    try {
      await downloadAuthed(b.url, b.filename);
    } catch (e: any) {
      setError(e?.message || 'Export failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BUTTONS.map(b => (
          <button key={b.label} onClick={() => run(b)} disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-600 disabled:opacity-50">
            {busy === b.label ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
            {b.label}
          </button>
        ))}
        <button onClick={() => run({ label: 'Full JSON', url: '/api/partner/export?format=json', filename: 'indibrick-export.json' })}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-neutral-700 hover:bg-neutral-100 disabled:opacity-50">
          {busy === 'Full JSON' ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
          Full JSON
        </button>
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
