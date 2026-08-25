import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from '@/lib/authGuard';

export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;

  try {
    // Notice we now accept documentNames (an array)
    const { leadId, documentNames, clientEmail, clientName, agentName } = await req.json();

    if (!leadId || !documentNames || documentNames.length === 0 || !adminDb) {
        return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const referralsRef = adminDb.collection('referrals');
    const snapshot = await referralsRef.where('leadId', '==', leadId).get();
    
    let docRef;
    if (!snapshot.empty) docRef = referralsRef.doc(snapshot.docs[0].id);
    else docRef = referralsRef.doc(leadId);

    // 1. Add all documents to Checklist & Timeline
    await docRef.update({
        requiredDocuments: FieldValue.arrayUnion(...documentNames), // Spreads the array into Firebase
        timeline: FieldValue.arrayUnion({
            type: 'system', author: agentName,
            content: `Requested Documents:\n• ${documentNames.join('\n• ')}`,
            timestamp: new Date().toISOString(), isSystemMessage: true
        })
    });

    // Generate the HTML list for the email
    const docListHtml = documentNames.map((doc: string) => 
        `<li style="font-weight: bold; font-size: 16px; color: #d97706; margin-bottom: 8px;">📄 ${doc}</li>`
    ).join('');

    // 2. Email Client (ONE batched email)
    await adminDb.collection('mail').add({
        to: [clientEmail],
        message: {
            subject: `Action Required: New Documents Requested from ${agentName}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Hi ${clientName},</h2>
                    <p>Your advisor, ${agentName}, requires additional documentation to proceed with your file:</p>
                    <ul style="list-style-type: none; padding-left: 0;">
                        ${docListHtml}
                    </ul>
                    <br/>
                    <p>Please click the link below to securely upload these items to your vault.</p>
                    <br/>
                    <a href="https://indibrick.ca/secure-portal/${leadId}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Secure Vault</a>
                </div>
            `
        }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}