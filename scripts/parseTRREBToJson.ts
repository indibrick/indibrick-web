// Pre-parse the TRREB Market Watch PDF to JSON.
//
// ─── Why ────────────────────────────────────────────────────────────
// lib/marketData/parseTRREB.ts dynamically imports `pdf-parse`, which pulls in
// pdfjs and expects to resolve a worker file at runtime. Inside the Next.js
// server bundle that worker is not emitted, so EVERY invocation fails with:
//
//   Setting up fake worker failed: Cannot find module
//   '.next/server/chunks/pdf.worker.mjs'
//
// The loader catches it, so the TRREB block silently disappears from
// /housing-index on every build. The parse itself is fine — it only fails
// under webpack.
//
// Running the parse here, once, and committing the JSON removes PDF parsing
// from the server bundle entirely. Build-time work becomes a file read.
//
// USAGE
//   npm run parse-trreb          # writes data/market/trreb-latest.json
//
// Re-run whenever a newer Market Watch PDF is dropped into data/market/.

import fs from 'fs';
import path from 'path';
import { parseTRREBPDF } from '../lib/marketData/parseTRREB';

const MARKET_DIR = path.join(process.cwd(), 'data', 'market');
const OUT = path.join(MARKET_DIR, 'trreb-latest.json');

function newestPdf(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const pdfs: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.toLowerCase().endsWith('.pdf')) pdfs.push(full);
    }
  };
  walk(dir);
  if (pdfs.length === 0) return null;
  return pdfs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

async function main() {
  const pdf = newestPdf(MARKET_DIR);
  if (!pdf) {
    console.error('❌ No TRREB PDF found under data/market/');
    process.exit(1);
  }
  console.log(`📄 Parsing ${path.relative(process.cwd(), pdf)}`);

  const parsed = await parseTRREBPDF(pdf);
  if (!parsed) {
    console.error('❌ Parser returned null — the PDF layout may have changed.');
    process.exit(1);
  }

  const payload = {
    sourceFile: path.relative(process.cwd(), pdf),
    parsedAt: new Date().toISOString(),
    data: parsed,
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`✅ Wrote ${path.relative(process.cwd(), OUT)}`);
  console.log(JSON.stringify(parsed, null, 2).slice(0, 600));
}

main().catch((e) => {
  console.error('❌ parse failed:', e);
  process.exit(1);
});
