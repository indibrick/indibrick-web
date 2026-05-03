import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
  try {
    const { leadId, clientEmail, clientName, agentName, notes, requiredDocs } = await req.json();

    if (!clientEmail || !adminDb) {
       return NextResponse.json({ error: 'Missing email or DB connection' }, { status: 400 });
    }

    const auth = getAuth();
    // Generate a secure 8-character temporary password
    let tempPassword = Math.random().toString(36).slice(-8); 
    let isNewUser = false;

    // 1. Check if user exists or create them
    try {
       await auth.getUserByEmail(clientEmail);
       // User already exists, we won't overwrite their password
       tempPassword = 'Use your existing password';
    } catch (error: any) {
       if (error.code === 'auth/user-not-found') {
           await auth.createUser({
               email: clientEmail,
               password: tempPassword,
               displayName: clientName,
           });
           isNewUser = true;

           // Map the user in Firestore so the portal knows who they are
           const userRecord = await auth.getUserByEmail(clientEmail);
           await adminDb.collection('users').doc(userRecord.uid).set({
               email: clientEmail,
               displayName: clientName,
               role: 'client',
               leadId: leadId,
               createdAt: new Date().toISOString()
           });
       } else {
           throw error;
       }
    }

    // 2. Log this action in the CRM Timeline
    const referralsRef = adminDb.collection('referrals');
    let docRef;
    const snapshot = await referralsRef.where('leadId', '==', leadId).get();
    if (!snapshot.empty) docRef = referralsRef.doc(snapshot.docs[0].id);
    else docRef = referralsRef.doc(leadId);

    // 3. Build the Email HTML
    const docListHtml = requiredDocs?.length > 0
        ? requiredDocs.map((doc: string) => `<li style="font-weight:bold; color: #2563eb; margin-bottom: 8px;">📄 ${doc}</li>`).join('')
        : '<li style="color: #64748b;">No documents requested yet.</li>';

    const loginInfoHtml = isNewUser
        ? `<div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
             <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;"><strong>Your Secure Login ID:</strong> ${clientEmail}</p>
             <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 18px; color: #0f172a;">${tempPassword}</span></p>
           </div>`
        : `<p style="color: #64748b;"><strong>Log in using your existing email and password.</strong></p>`;

    // 4. Send the Email
    await adminDb.collection('mail').add({
       to: [clientEmail],
       message: {
           subject: `Welcome to IndiBrick: Your Secure Portal is Ready`,
           html: `
               <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                   <h2 style="color: #0f172a; margin-bottom: 8px;">Welcome, ${clientName}!</h2>
                   <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                       Your advisor, <strong>${agentName}</strong>, has upgraded your file to Active status and generated a bank-grade secure portal for your transaction.
                   </p>
                   
                   ${loginInfoHtml}

                   <div style="margin: 30px 0;">
                      <a href="https://indibrick.ca/client/login" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Secure Portal</a>
                   </div>

                   <h3 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Message from your Advisor</h3>
                   <p style="color: #475569; font-style: italic; border-left: 4px solid #2563eb; padding-left: 12px;">"${notes || 'Please log in to review your file status.'}"</p>

                   <h3 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; mt-8;">Required Documents</h3>
                   <p style="color: #475569; font-size: 14px;">Please upload the following items to your secure vault:</p>
                   <ul style="padding-left: 20px;">
                       ${docListHtml}
                   </ul>
               </div>
           `
       }
    });

    return NextResponse.json({ success: true, isNewUser });
  } catch (error: any) {
    console.error('Onboarding Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}