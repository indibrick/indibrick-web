'use client';

// The core citation asset on /housing-index — 41 rows × 4 property types
// showing benchmark price + YoY. Client component so we can offer:
//  - Sortable columns (city name, benchmark, YoY)
//  - Filter box for city search
//  - Property-type toggle
// The full server-rendered HTML fallback still ships in initial payload,
// so LLM crawlers see all the numbers without executing JS.

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, TrendingUp, TrendingDown, Search } from 'lucide-react';
import type { IndexCityRow } from '../services/MarketDataService';

interface Props {
  cities: IndexCityRow[];
  propertyTypes: { slug: string; label: string }[];
}

type SortKey = 'city' | 'benchmark' | 'yoy';
type SortDir = 'asc' | 'desc';

const priceFmt = (n: number | undefined) => {
  if (typeof n !== 'number' || !isFinite(n) || n <= 0) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${Math.round(n / 1000)}K`;
};

const yoyFmt = (n: number | null | undefined) => {
  if (typeof n !== 'number' || !isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
};

export default function HousingIndexTable({ cities, propertyTypes }: Props) {
  const [activeType, setActiveType] = useState<string>(propertyTypes[0]?.slug || 'composite');
  const [sortKey, setSortKey] = useState<SortKey>('city');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const filtered = filter.trim()
      ? cities.filter((c) => c.cityName.toLowerCase().includes(filter.toLowerCase()))
      : cities;

    const mul = sortDir === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'city') return a.cityName.localeCompare(b.cityName) * mul;
      if (sortKey === 'benchmark') {
        const av = a.benchmarks[activeType] ?? 0;
        const bv = b.benchmarks[activeType] ?? 0;
        return (av - bv) * mul;
      }
      const ay = a.yoyPct[activeType] ?? -999;
      const by = b.yoyPct[activeType] ?? -999;
      return (ay - by) * mul;
    });
    return sorted;
  }, [cities, activeType, sortKey, sortDir, filter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'city' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {propertyTypes.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setActiveType(t.slug)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition ${
                activeType === t.slug
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full md:w-auto">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            placeholder="Filter cities…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full md:w-48"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl">
        <table className="w-full text-left text-sm min-w-[520px]">
          <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <tr>
              <th className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSort('city')}
                  className="flex items-center gap-1.5 hover:text-slate-900"
                >
                  City <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="p-4">Region</th>
              <th className="p-4 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('benchmark')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900"
                >
                  Benchmark <ArrowUpDown size={10} />
                </button>
              </th>
              <th className="p-4 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('yoy')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900"
                >
                  YoY <ArrowUpDown size={10} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const bench = row.benchmarks[activeType];
              const yoy = row.yoyPct[activeType];
              const trendUp = typeof yoy === 'number' && yoy >= 0;
              return (
                <tr
                  key={row.citySlug}
                  id={row.citySlug}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
                >
                  <td className="p-4">
                    <Link
                      href={`/real-estate/${row.citySlug}/condo/under-500k`}
                      className="font-black text-slate-900 hover:text-blue-600 transition"
                    >
                      {row.cityName}
                    </Link>
                  </td>
                  <td className="p-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    {row.region}
                  </td>
                  <td className="p-4 text-right font-black text-slate-900 tabular-nums">
                    {priceFmt(bench)}
                  </td>
                  <td className="p-4 text-right tabular-nums">
                    {typeof yoy === 'number' ? (
                      <span
                        className={`inline-flex items-center gap-1 font-black ${
                          trendUp ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {yoyFmt(yoy)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                  No cities match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-3 text-right">
          {rows.length} cit{rows.length === 1 ? 'y' : 'ies'} shown · Derived from CREA MLS® HPI
        </p>
      )}
    </div>
  );
}
