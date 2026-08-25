'use client';

// Global toast system.
//
// Replaces the dozens of scattered `alert()` calls in the partner CRM
// with structured, dismissable notifications. Also underwrites
// promise-based flows (`toast.promise(...)` shows loading → success /
// error automatically) so we can wrap authedPost() calls uniformly.
//
// Design:
//   - Toasts render in a portal-like fixed container, bottom-right on
//     desktop, top-center on mobile
//   - Auto-dismiss after `duration` ms (default 4500), zero for sticky
//   - `variant`: info | success | warn | error — each has a color +
//     icon and matches the existing severity palette used in the
//     InAppInbox so the CRM feels consistent
//   - Consumer API: const toast = useToast(); toast.success('Saved.');
//     Also: toast.promise(fn(), { loading: '…', success: '…', error: fn })

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warn' | 'error';

interface ToastRecord {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
  duration: number; // 0 = sticky
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  info: (message: string, description?: string, opts?: Partial<Omit<ToastRecord, 'id' | 'message' | 'description' | 'variant'>>) => string;
  success: (message: string, description?: string, opts?: Partial<Omit<ToastRecord, 'id' | 'message' | 'description' | 'variant'>>) => string;
  warn: (message: string, description?: string, opts?: Partial<Omit<ToastRecord, 'id' | 'message' | 'description' | 'variant'>>) => string;
  error: (message: string, description?: string, opts?: Partial<Omit<ToastRecord, 'id' | 'message' | 'description' | 'variant'>>) => string;
  promise: <T>(
    promise: Promise<T>,
    labels: {
      loading: string;
      success: string | ((value: T) => string);
      error: string | ((err: any) => string);
    },
  ) => Promise<T>;
  dismiss: (id: string) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { border: string; bg: string; icon: React.ComponentType<{ size?: number; className?: string }>; iconColor: string }> = {
  info:    { border: 'border-blue-500',    bg: 'bg-white',    icon: Info,          iconColor: 'text-blue-600'    },
  success: { border: 'border-emerald-500', bg: 'bg-white',    icon: CheckCircle,   iconColor: 'text-emerald-600' },
  warn:    { border: 'border-amber-500',   bg: 'bg-white',    icon: AlertTriangle, iconColor: 'text-amber-600'   },
  error:   { border: 'border-red-500',     bg: 'bg-white',    icon: XCircle,       iconColor: 'text-red-600'     },
};

function ToastRow({ toast, onDismiss }: { toast: ToastRecord; onDismiss: () => void }) {
  const { border, bg, icon: Icon, iconColor } = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    if (toast.duration <= 0) return;
    const t = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(t);
  }, [toast.duration, onDismiss]);

  return (
    <div className={`${bg} border-l-4 ${border} border-r border-t border-b border-gray-200 rounded-xl shadow-lg p-4 flex items-start gap-3 min-w-[280px] max-w-md pointer-events-auto animate-fade-in`}>
      <Icon size={18} className={`${iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900 leading-snug">{toast.message}</p>
        {toast.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{toast.description}</p>}
        {toast.action && (
          <button
            onClick={() => { toast.action!.onClick(); onDismiss(); }}
            className="mt-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-slate-900 shrink-0 p-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((rec: Omit<ToastRecord, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { ...rec, id }]);
    return id;
  }, []);

  const api = useMemo<ToastApi>(() => {
    const make = (variant: ToastVariant) =>
      (message: string, description?: string, opts?: Partial<Omit<ToastRecord, 'id' | 'message' | 'description' | 'variant'>>): string => {
        return push({
          variant,
          message,
          description,
          duration: opts?.duration ?? (variant === 'error' ? 7000 : 4500),
          action: opts?.action,
        });
      };
    return {
      info: make('info'),
      success: make('success'),
      warn: make('warn'),
      error: make('error'),
      promise: async <T,>(promise: Promise<T>, labels: { loading: string; success: string | ((v: T) => string); error: string | ((e: any) => string) }): Promise<T> => {
        const loadingId = push({ variant: 'info', message: labels.loading, duration: 0 });
        try {
          const value = await promise;
          dismiss(loadingId);
          push({
            variant: 'success',
            message: typeof labels.success === 'function' ? labels.success(value) : labels.success,
            duration: 4500,
          });
          return value;
        } catch (err) {
          dismiss(loadingId);
          push({
            variant: 'error',
            message: typeof labels.error === 'function' ? labels.error(err) : labels.error,
            duration: 7000,
          });
          throw err;
        }
      },
      dismiss,
    };
  }, [push, dismiss]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* Container. Bottom-right on desktop; top-center on mobile so the
          keyboard doesn't push toasts off-screen when a form is open. */}
      <div className="fixed z-[200] pointer-events-none inset-x-0 top-4 flex flex-col items-center gap-2 md:inset-x-auto md:top-auto md:right-6 md:bottom-6 md:items-end">
        {toasts.map(t => (
          <ToastRow key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // Fallback: in server-render paths / tests, silent no-op API so the
    // caller doesn't need to gate on window. In real client code the
    // provider is always mounted (see components/Providers.tsx).
    return {
      info:    () => '',
      success: () => '',
      warn:    () => '',
      error:   () => '',
      promise: async <T,>(p: Promise<T>) => p,
      dismiss: () => {},
    };
  }
  return ctx;
}
