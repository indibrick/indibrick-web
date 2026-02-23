import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; 

export async function GET() {
  try {
    if (!adminDb) {
      console.error("❌ Admin DB not connected. Check environment variables.");
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
    }

    // Fetch all existing leads from Portal X 99 legacy collection
    const leadsSnapshot = await adminDb.collection('leads').get();
    let migratedCount = 0;

    // Use Firestore Batch to safely process hundreds of documents at once
    const batch = adminDb.batch();

    leadsSnapshot.forEach((doc) => {
      const lead = doc.data();
      
      // Safety Check: Only migrate leads that are active and haven't been copied yet
      if (lead.status !== 'closed' && !lead.migratedToCRM) {
        const newReferralRef = adminDb.collection('referrals').doc(); // Auto-generate new ID
        
        // 1. Inject into the new Partner CRM Inbox
        batch.set(newReferralRef, {
          leadId: doc.id, // Keep the mapping to Portal X 99!
          referrerId: 'INDIBRICK_LEGACY_MIGRATION',
          referrerName: 'System Migration',
          assignedAgentId: 'ADMIN_INBOX', // Sends directly to your Admin Triage
          assignedAgentName: 'Indibrick Admin Triage',
          status: 'Migrated Web Lead',
          clientName: lead.name || 'Legacy Client',
          clientPhone: lead.phone || '',
          clientEmail: lead.email || '',
          referralDate: lead.date || new Date().toISOString(),
          notes: `Migrated from legacy database. Service: ${lead.serviceNeeded || 'General'}. Message: ${lead.message || 'N/A'}`,
          timeline: [{
            type: 'system',
            author: 'System',
            content: 'Lead migrated from legacy database to enterprise CRM.',
            timestamp: new Date().toISOString(),
            isSystemMessage: true
          }],
          type: 'Legacy Web Inbound'
        });

        // 2. Mark the old lead as migrated so it is never double-counted
        const oldLeadRef = adminDb.collection('leads').doc(doc.id);
        batch.update(oldLeadRef, { migratedToCRM: true });

        migratedCount++;
      }
    });

    // Execute the batch write
    if (migratedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Operation Complete: Successfully migrated ${migratedCount} legacy leads into the Partner CRM.` 
    });

  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}