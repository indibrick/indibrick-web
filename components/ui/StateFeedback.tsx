'use client';

// Small, shared feedback primitives.
//
// Purpose: replace the scattered "Loading…" divs and hand-rolled
// "no results" tiles across CRM panels. Every panel using these
// helpers gets the same rhythm (spacing, icon size, copy weight),
// which is what "polish" looks like when you're not shipping a
// full redesign.

import React from 'react';
import { Loader2, Inbox } from 'lucide-react';

// ─── Loading ────────────────────────────────────────────────────────

interface LoadingStateProps {
  label?: string;
  variant?: 'inline' | 'block';
}

export function LoadingState({ label = 'Loading…', variant = 'block' }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500">
        <Loader2 size={11} className="animate-spin"/> {label}
      </span>
    );
  }
  return (
    <div className="flex items-center justify-center py-10 text-xs font-bold uppercase tracking-widest text-gray-400">
      <Loader2 size={14} className="animate-spin mr-2"/> {label}
    </div>
  );
}

// ─── Empty ──────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl text-center ${compact ? 'p-6' : 'p-10'}`}>
      <div className={`rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3 ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}>
        <Icon size={compact ? 18 : 22} className="text-blue-600"/>
      </div>
      <p className={`font-black text-slate-900 ${compact ? 'text-sm' : 'text-lg'}`}>{title}</p>
      {description && <p className={`text-gray-500 mt-1 max-w-md mx-auto leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>{description}</p>}
      {action && (
        <button onClick={action.onClick}
          className="mt-4 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition shadow-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Error ──────────────────────────────────────────────────────────

interface ErrorStateProps {
  title: string;
  detail?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, detail, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900">
      <p className="text-sm font-black">{title}</p>
      {detail && <p className="text-xs mt-1 opacity-90">{detail}</p>}
      {onRetry && (
        <button onClick={onRetry}
          className="mt-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition">
          Retry
        </button>
      )}
    </div>
  );
}
