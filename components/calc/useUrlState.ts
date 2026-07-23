'use client';

// URL-backed state for calculators.
//
// Every calculator's inputs sync to the page URL as search params. Result:
//   1. The URL is naturally shareable — send indibrick.ca/mortgage-payment-
//      calculator?price=850000&down=170000&rate=4.29 and the recipient
//      lands on the exact same computed state.
//   2. Browser back/forward navigates through prior input snapshots.
//   3. Bookmarks preserve the scenario.
//
// Kept tiny + zero-dependency. Uses Next.js 14 App Router hooks
// (useSearchParams + useRouter). Falls back gracefully to a plain
// useState when the component runs outside a router context (SSR pre-hydration).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type Primitive = string | number | boolean;

/** Serialize a value to a URL-safe string; empty string means "omit from URL". */
function serialize(v: Primitive | undefined): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') {
    if (!isFinite(v)) return '';
    return String(v);
  }
  return String(v);
}

/** Parse a URL string into the caller's expected shape. */
function parse<T extends Primitive>(raw: string | null, fallback: T): T {
  if (raw === null || raw === '') return fallback;
  if (typeof fallback === 'boolean') return (raw === '1') as T;
  if (typeof fallback === 'number') {
    const n = Number(raw);
    return (isFinite(n) ? n : fallback) as T;
  }
  return raw as T;
}

/**
 * Multi-field URL state. Pass a `defaults` object keyed by param name.
 * Returns [state, setState] where setState accepts a partial patch.
 *
 * Example:
 *   const [state, set] = useUrlState({ price: 750000, rate: 4.29, isFTHB: true });
 *   set({ price: 800000 });  // URL becomes ?price=800000&rate=4.29&isFTHB=1
 */
export function useUrlState<T extends Record<string, Primitive>>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial hydration from URL — only happens once.
  const initialState = useMemo(() => {
    const out = { ...defaults } as T;
    if (!searchParams) return out;
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const raw = searchParams.get(key as string);
      if (raw !== null) {
        (out as any)[key] = parse(raw, defaults[key]);
      }
    }
    return out;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [state, setState] = useState<T>(initialState);

  // Push updates to URL. router.replace (not push) so browser history
  // doesn't accumulate a new entry on every slider drag.
  const updateUrl = useCallback((next: T) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const v = serialize(next[key]);
      // Only include params that differ from defaults to keep URLs short.
      const defaultSerialized = serialize(defaults[key]);
      if (v !== defaultSerialized && v !== '') {
        params.set(key as string, v);
      }
    }
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    router.replace(url, { scroll: false });
  }, [pathname, router, defaults]);

  // Merge patch → new state → sync URL. Debounced via microtask so a
  // burst of slider updates coalesces into one URL write per tick.
  const patch = useCallback((changes: Partial<T>) => {
    setState(prev => {
      const next = { ...prev, ...changes };
      queueMicrotask(() => updateUrl(next));
      return next;
    });
  }, [updateUrl]);

  // On first mount, if we hydrated defaults from URL, ensure the URL
  // reflects the same (no-op for most cases but keeps semantics tight).
  useEffect(() => {
    updateUrl(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [state, patch] as const;
}
