'use client';
// System health page for the operator. One card per check with a
// traffic light and a one-line detail. Meant to be the first place
// to look when something feels off.

import { useEffect, useState } from 'react';
import { authedGet } from '@/lib/apiClient';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warn' | 'bad';
  detail: string;
}

interface HealthPayload {
  generatedAt: string;
  overall: 'ok' | 'warn' | 'bad';
  checks: HealthCheck[];
  summary: Record<string, number>;
}

function StatusIcon({ status }: { status: HealthCheck['status'] }) {
  if (status === 'ok') return <CheckCircle className="text-emerald-600" size={20}/>;
  if (status === 'warn') return <AlertTriangle className="text-amber-600" size={20}/>;
  return <XCircle className="text-red-600" size={20}/>;
}

const OVERALL_LABEL = {
  ok: 'All systems normal',
  warn: 'Something needs attention',
  bad: 'Action required',
} as const;

const OVERALL_TONE = {
  ok: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  warn: 'bg-amber-50 border-amber-200 text-amber-900',
  bad: 'bg-red-50 border-red-200 text-red-900',
} as const;

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedGet('/api/admin/system-health');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setData(body);
    } catch (e: any) {
      setError(e?.message || 'Failed to load system health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-neutral-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900">System health</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Snapshot of pipeline health — mail queue, drips, workflows, config.
            </p>
          </div>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
            Refresh
          </button>
        </div>

        {loading && !data && <div className="text-sm text-neutral-500">Loading…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {data && (
          <>
            <div className={`rounded-lg border p-4 ${OVERALL_TONE[data.overall]}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <StatusIcon status={data.overall}/>
                {OVERALL_LABEL[data.overall]}
              </div>
              <div className="mt-1 text-xs opacity-75">
                Generated {new Date(data.generatedAt).toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.checks.map(c => (
                <div key={c.name} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={c.status}/>
                    <div className="font-medium text-neutral-900">{c.name}</div>
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">{c.detail}</div>
                </div>
              ))}
            </div>

            {data.summary && (
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <h2 className="text-sm font-medium text-neutral-900">Raw numbers</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
                  {Object.entries(data.summary).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="mt-1 text-lg font-semibold text-neutral-900">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
