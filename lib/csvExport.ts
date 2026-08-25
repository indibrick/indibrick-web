// Minimal RFC 4180 CSV serializer — pair to lib/csvImport.ts (which
// only parses). Zero deps. Rows are string-keyed objects; header row
// = union of all keys in encounter order.

function escape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'string' ? v : (
    typeof v === 'object' ? JSON.stringify(v) : String(v)
  );
  // Quote if it contains delimiter, quote, or newline. Doubled quotes escape.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Array<Record<string, any>>, columns?: string[]): string {
  if (rows.length === 0) return '';
  const cols = columns && columns.length > 0
    ? columns
    : Array.from(rows.reduce<Set<string>>((set, r) => {
        Object.keys(r).forEach(k => set.add(k));
        return set;
      }, new Set()));
  const lines: string[] = [cols.map(escape).join(',')];
  for (const r of rows) {
    lines.push(cols.map(c => escape(r[c])).join(','));
  }
  return lines.join('\r\n');
}
