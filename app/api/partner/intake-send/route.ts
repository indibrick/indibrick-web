import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Agent-confirmation step of the AI intake flow.
 *
 * The partner CRM calls /api/ai-intake with `draftMode: true` to chat with the AI and
 * generate a summary + checklist WITHOUT emailing the client. The agent then reviews,
 * edits, and confirms. On confirm, the partner page POSTs here to:
 *   1. Persist `dealSummary` + `requiredDocuments` on the referral
 *   2. Log a timeline entry attributed to the agent
 *   3. Email the client a single message containing both the underwriter summary
 *      and the personalized document checklist with a portal link
 */
export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Server not initialized' }, { status: 500 });
    }

    const { leadId, summary, checklist, clientName, clientEmail, agentName } = await req.json();

    if (!leadId || !summary || !Array.isArray(checklist) || checklist.length === 0) {
      return NextResponse.json({ error: 'Missing leadId, summary, or checklist' }, { status: 400 });
    }

    // Locate the referral by leadId field first; fall back to direct doc id (partner-created leads use the doc id)
    const referralsRef = adminDb.collection('referrals');
    let docRef;
    const snapshot = await referralsRef.where('leadId', '==', leadId).get();
    if (!snapshot.empty) docRef = referralsRef.doc(snapshot.docs[0].id);
    else {
      const direct = await referralsRef.doc(leadId).get();
      if (direct.exists) docRef = referralsRef.doc(leadId);
    }

    if (!docRef) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();

    await docRef.update({
      dealSummary: summary,
      requiredDocuments: checklist,
      timeline: FieldValue.arrayUnion({
        type: 'system',
        author: agentName || 'AI Underwriter',
        content: `🤖 AI Intake completed and sent to client. ${checklist.length} document${checklist.length === 1 ? '' : 's'} requested.`,
        timestamp,
        isSystemMessage: true,
      }),
      lastUpdated: timestamp,
    });

    if (clientEmail) {
      const checklistHtml = checklist
        .map((item: string) => `<li style="margin-bottom: 8px; color: #1e293b;">${item}</li>`)
        .join('');

      await adminDb.collection('mail').add({
        to: [clientEmail],
        message: {
          subject: `Your IndiBrick Mortgage File — Summary & Document Checklist`,
          html: `
            <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">Hi ${clientName || 'there'},</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for taking a few minutes with us. Here is a summary of your file along with the exact documents our underwriters need to move forward.
              </p>

              <h3 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Your File Summary</h3>
              <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${summary}</div>

              <h3 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Required Documents</h3>
              <ul style="padding-left: 22px; font-size: 14px;">${checklistHtml}</ul>

              <div style="margin: 30px 0;">
                <a href="https://indibrick.ca/secure-portal/${leadId}" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Upload Documents Securely</a>
              </div>

              <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
                Replying to this email reaches your advisor directly. Your portal uses bank-level encryption.
              </p>
            </div>
          `,
        },
      });
    }

    return NextResponse.json({ success: true, emailed: !!clientEmail });
  } catch (error: any) {
    console.error('intake-send error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
