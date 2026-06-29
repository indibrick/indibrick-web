import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Normalize a phone for dedupe matching: digits only, drop the leading 1
// so "+1 (416) 555-0199" and "4165550199" collide.
function normPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

function normEmail(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

// CSV row split with double-quote support so "Doe, Jane" doesn't break columns.
function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export async function POST(request: Request) {
  try {
    const { csvData, adminKey } = await request.json();

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin Key' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const rows = csvData.split(/\r?\n/).filter((row: string) => row.trim() !== '');
    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV is empty or only contains a header row.' }, { status: 400 });
    }

    const headers = parseCsvRow(rows[0]).map((h) => h.toLowerCase());
    const requiredHeaders = ['name', 'phone', 'email', 'service', 'city', 'notes'];
    if (!requiredHeaders.every((rh) => headers.includes(rh))) {
       return NextResponse.json({ error: 'Invalid CSV Format. Headers must include: Name, Phone, Email, Service, City, Notes' }, { status: 400 });
    }

    // Build the existing-key set so rows already in the pipeline get skipped.
    // Match policy: phone AND email both match (normalized). Without this,
    // a double-clicked upload or re-submitted CSV duplicates every row.
    const existing = await adminDb.collection('referrals').get();
    const existingKeys = new Set<string>();
    existing.forEach((doc) => {
      const d = doc.data() as any;
      const p = normPhone(d.clientPhone || '');
      const e = normEmail(d.clientEmail || '');
      if (p && e) existingKeys.add(`${p}|${e}`);
    });

    let importedCount = 0;
    let skippedCount = 0;
    let batch = adminDb.batch();
    let opsInBatch = 0;

    // 2 ops per row (leads + referrals). Flush + start a fresh batch before
    // the 500-op Firestore limit — the previous code reused the same batch
    // after `commit()`, which is undefined behavior.
    const FLUSH_AT_OPS = 480;

    for (let i = 1; i < rows.length; i++) {
       const cols = parseCsvRow(rows[i]);
       if (cols.length < 3) continue;

       const get = (key: string) => cols[headers.indexOf(key)]?.trim() || '';
       const leadData = {
          name: get('name') || 'Unknown',
          phone: get('phone'),
          email: get('email'),
          service: get('service') || 'General',
          city: get('city') || 'Unknown',
          notes: get('notes') || 'Bulk imported via CSV.',
       };

       const p = normPhone(leadData.phone);
       const e = normEmail(leadData.email);
       if (p && e) {
         const key = `${p}|${e}`;
         if (existingKeys.has(key)) { skippedCount++; continue; }
         existingKeys.add(key); // also dedupes against earlier rows in this same upload
       }

       const leadRef = adminDb.collection('leads').doc();
       const referralRef = adminDb.collection('referrals').doc();
       const timestamp = new Date().toISOString();

       batch.set(leadRef, {
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          serviceNeeded: leadData.service,
          city: leadData.city,
          message: leadData.notes,
          status: 'new',
          date: timestamp,
          pageSource: 'CSV Bulk Import',
       });

       batch.set(referralRef, {
          leadId: leadRef.id,
          referrerId: 'CSV_IMPORT',
          referrerName: 'System Import',
          assignedAgentId: 'ADMIN_INBOX',
          assignedAgentName: 'IndiBrick Admin Triage',
          status: 'New Web Lead',
          clientName: leadData.name,
          clientPhone: leadData.phone,
          clientEmail: leadData.email,
          referralDate: timestamp,
          notes: `Imported via CSV. City: ${leadData.city}. Notes: ${leadData.notes}`,
          timeline: [{
             type: 'system',
             author: 'System',
             content: 'Lead imported via CSV Bulk Tool.',
             timestamp,
             isSystemMessage: true,
          }],
          type: 'CSV Upload',
       });

       importedCount++;
       opsInBatch += 2;

       if (opsInBatch >= FLUSH_AT_OPS) {
         await batch.commit();
         batch = adminDb.batch();
         opsInBatch = 0;
       }
    }

    if (opsInBatch > 0) await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Imported ${importedCount}. Skipped ${skippedCount} duplicate${skippedCount === 1 ? '' : 's'}.`,
      imported: importedCount,
      skipped: skippedCount,
    });

  } catch (error: any) {
    console.error('Bulk Import Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
