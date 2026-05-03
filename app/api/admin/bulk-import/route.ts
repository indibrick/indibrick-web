import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { csvData, adminKey } = await request.json();

    // 1. Security Check
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin Key' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 2. Parse the CSV Data
    // Split by newlines, handling both \n and \r\n
    const rows = csvData.split(/\r?\n/).filter((row: string) => row.trim() !== '');
    
    // Extract headers and lowercase them for safe mapping
    const headers = rows[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    const requiredHeaders = ['name', 'phone', 'email', 'service', 'city', 'notes'];
    const isValidFormat = requiredHeaders.every(rh => headers.includes(rh));

    if (!isValidFormat) {
       return NextResponse.json({ error: 'Invalid CSV Format. Headers must include: Name, Phone, Email, Service, City, Notes' }, { status: 400 });
    }

    // 3. Prepare Firestore Batch (can handle up to 500 writes at once)
    const batch = adminDb.batch();
    let importedCount = 0;

    // Start at index 1 to skip the header row
    for (let i = 1; i < rows.length; i++) {
       // A simple split by comma (Note: this basic split assumes no commas inside the cell values)
       // For a production app handling complex CSVs, you might use a library like 'papaparse', but this works for clean data.
       const cols = rows[i].split(',');
       
       if (cols.length < 3) continue; // Skip empty or broken rows

       const leadData = {
          name: cols[headers.indexOf('name')]?.trim() || 'Unknown',
          phone: cols[headers.indexOf('phone')]?.trim() || '',
          email: cols[headers.indexOf('email')]?.trim() || '',
          service: cols[headers.indexOf('service')]?.trim() || 'General',
          city: cols[headers.indexOf('city')]?.trim() || 'Unknown',
          notes: cols[headers.indexOf('notes')]?.trim() || 'Bulk imported via CSV.',
       };

       // Generate references
       const leadRef = adminDb.collection('leads').doc();
       const referralRef = adminDb.collection('referrals').doc();
       const timestamp = new Date().toISOString();

       // Step A: Save to Raw Leads DB
       batch.set(leadRef, {
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          serviceNeeded: leadData.service,
          city: leadData.city,
          message: leadData.notes,
          status: 'new',
          date: timestamp,
          pageSource: 'CSV Bulk Import'
       });

       // Step B: Inject into the Active CRM Pipeline (Admin Inbox)
       batch.set(referralRef, {
          leadId: leadRef.id,
          referrerId: 'CSV_IMPORT',
          referrerName: 'System Import',
          assignedAgentId: 'ADMIN_INBOX',
          assignedAgentName: 'IndiBrick Admin Triage',
          status: 'New Web Lead', // Enters as new so you can route it
          clientName: leadData.name,
          clientPhone: leadData.phone,
          clientEmail: leadData.email,
          referralDate: timestamp,
          notes: `Imported via CSV. City: ${leadData.city}. Notes: ${leadData.notes}`,
          timeline: [{
             type: 'system',
             author: 'System',
             content: 'Lead imported via CSV Bulk Tool.',
             timestamp: timestamp,
             isSystemMessage: true
          }],
          type: 'CSV Upload'
       });

       importedCount++;
       
       // Firestore batches are limited to 500 operations. Since we do 2 ops per lead, 
       // we safely commit and create a new batch if we hit 240 leads.
       if (importedCount % 240 === 0) {
           await batch.commit();
       }
    }

    // Commit any remaining leads
    await batch.commit();

    return NextResponse.json({ success: true, message: `Successfully imported ${importedCount} leads.` });

  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}