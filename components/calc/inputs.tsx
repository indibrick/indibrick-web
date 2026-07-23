'use client';

// Shared input primitives for all calculators. Every input is controlled,
// keyboard-accessible, and renders identically across every calculator
// on the site — the visual consistency the previous fragmented
// implementations lacked.

import React from 'react';

// ─── CurrencyInput ────────────────────────────────────────────────────

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
}

export function CurrencyInput({ label, value, onChange, min = 0, max, step = 1000, placeholder, helpText, disabled }: CurrencyInputProps) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
        {label}
        {helpText && <span className="text-gray-400 normal-case tracking-normal font-medium ml-1">({helpText})</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value === 0 ? '' : value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-7 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-50"
        />
      </div>
    </div>
  );
}

// ─── PercentInput ─────────────────────────────────────────────────────

interface PercentInputProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
}

export function PercentInput({ label, value, onChange, min = 0, max = 100, step = 0.01, placeholder, helpText }: PercentInputProps) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
        {label}
        {helpText && <span className="text-gray-400 normal-case tracking-normal font-medium ml-1">({helpText})</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value === 0 ? '' : value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full pl-3 pr-8 p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
      </div>
    </div>
  );
}

// ─── NumberInput ──────────────────────────────────────────────────────

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  helpText?: string;
}

export function NumberInput({ label, value, onChange, min, max, step = 1, suffix, placeholder, helpText }: NumberInputProps) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
        {label}
        {helpText && <span className="text-gray-400 normal-case tracking-normal font-medium ml-1">({helpText})</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value === 0 ? '' : value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className={`w-full p-3 ${suffix ? 'pr-12' : ''} rounded-xl border border-gray-200 bg-gray-50 text-slate-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── SelectInput ──────────────────────────────────────────────────────

interface SelectInputProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  helpText?: string;
}

export function SelectInput<T extends string>({ label, value, onChange, options, helpText }: SelectInputProps<T>) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
        {label}
        {helpText && <span className="text-gray-400 normal-case tracking-normal font-medium ml-1">({helpText})</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── ToggleInput ──────────────────────────────────────────────────────
// Segmented control for boolean or 2-3 way selectors.

interface ToggleInputProps<T extends string | boolean> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  helpText?: string;
}

export function ToggleInput<T extends string | boolean>({ label, value, onChange, options, helpText }: ToggleInputProps<T>) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
        {label}
        {helpText && <span className="text-gray-400 normal-case tracking-normal font-medium ml-1">({helpText})</span>}
      </label>
      <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 gap-1">
        {options.map(o => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${
              value === o.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-slate-700'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SliderInput ──────────────────────────────────────────────────────
// Range slider paired with a numeric readout — replaces the "type-only"
// input for values people want to drag through (rate, amortization, etc).

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (n: number) => string;
  helpText?: string;
}

export function SliderInput({ label, value, onChange, min, max, step, format, helpText }: SliderInputProps) {
  const display = format ? format(value) : String(value);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">
          {label}
          {helpText && <span className="text-gray-400 normal-case tracking-normal font-medium ml-1">({helpText})</span>}
        </label>
        <span className="text-sm font-black text-slate-900 tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-600 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-gray-400 font-medium mt-1">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}
