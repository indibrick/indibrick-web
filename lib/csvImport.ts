// CSV parsing + mapping shared by the client preview UI and the server
// import endpoint. Zero deps — small, well-defined subset of RFC 4180:
//   - Comma-delimited
//   - Fields optionally quoted with "..."
//   - Doubled "" inside quoted fields = literal quote
//   - CRLF or LF line endings
// Realtor exports we've seen from kvCORE / Follow Up Boss / Rechat all
// fit inside this subset. Good enough — we don't need PapaParse.

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  errors: string[];
}

export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const src = text.replace(/﻿/g, ''); // strip BOM
  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += c; i += 1; continue;
    }
    if (c === '"') { inQuotes = true; i += 1; continue; }
    if (c === ',') { row.push(field); field = ''; i += 1; continue; }
    if (c === '\r') { i += 1; continue; }
    if (c === '\n') {
      row.push(field); field = '';
      if (row.length > 0 && row.some(v => v.length > 0)) rows.push(row);
      row = [];
      i += 1; continue;
    }
    field += c; i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some(v => v.length > 0)) rows.push(row);
  }
  const headers = rows.shift() || [];
  return { headers: headers.map(h => h.trim()), rows, errors };
}

// ─── Header → referral-field mapping ───────────────────────────────
// Heuristic auto-map: any header that fuzzy-matches a known column name
// gets suggested. Users can override any mapping in the UI before
// confirming the import.

export const REFERRAL_IMPORT_FIELDS = [
  { value: 'clientName',   label: 'Client name',   aliases: ['name', 'full name', 'full_name', 'client', 'contact name', 'contact', 'lead name'] },
  { value: 'clientEmail',  label: 'Client email',  aliases: ['email', 'e-mail', 'email address', 'primary email'] },
  { value: 'clientPhone',  label: 'Client phone',  aliases: ['phone', 'mobile', 'cell', 'phone number', 'primary phone'] },
  { value: 'status',       label: 'Status',        aliases: ['stage', 'pipeline stage', 'deal status'] },
  { value: 'notes',        label: 'Notes',         aliases: ['note', 'description', 'comments', 'summary'] },
  { value: 'dealType',     label: 'Deal type',     aliases: ['type', 'category', 'source type'] },
  { value: 'leadTag',      label: 'Lead tag',      aliases: ['tag', 'label', 'category', 'priority'] },
  { value: 'loanAmount',   label: 'Loan amount',   aliases: ['loan', 'amount', 'volume', 'deal value', 'price'] },
  { value: 'referralSource', label: 'Referral source', aliases: ['source', 'lead source', 'referrer', 'from'] },
] as const;

export type ReferralImportField = typeof REFERRAL_IMPORT_FIELDS[number]['value'];

export function autoMapHeaders(headers: string[]): Record<number, ReferralImportField | ''> {
  const map: Record<number, ReferralImportField | ''> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  headers.forEach((h, idx) => {
    const nh = norm(h);
    let match: ReferralImportField | '' = '';
    for (const f of REFERRAL_IMPORT_FIELDS) {
      if (norm(f.value) === nh || norm(f.label) === nh || f.aliases.some(a => norm(a) === nh)) {
        match = f.value;
        break;
      }
    }
    map[idx] = match;
  });
  return map;
}

// ─── Row → referral payload ────────────────────────────────────────

export interface ImportPreview {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  status?: string;
  notes?: string;
  dealType?: string;
  leadTag?: string;
  loanAmount?: number;
  referralSource?: string;
}

export function projectRow(row: string[], mapping: Record<number, ReferralImportField | ''>): ImportPreview {
  const out: any = {};
  for (const [idxStr, field] of Object.entries(mapping)) {
    if (!field) continue;
    const idx = Number(idxStr);
    const raw = (row[idx] ?? '').trim();
    if (!raw) continue;
    if (field === 'loanAmount') {
      const n = Number(raw.replace(/[^\d.-]/g, ''));
      if (!isNaN(n) && n > 0) out.loanAmount = n;
    } else {
      out[field] = raw;
    }
  }
  return out;
}

// Loose email check — we don't want to bounce a whole import over a
// stray-space typo, so validation just marks rows as needing attention
// rather than dropping them.
export function isProbablyValidEmail(s?: string): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
