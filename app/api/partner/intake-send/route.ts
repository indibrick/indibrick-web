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

    const { leadId, summary, crmSummary, checklist, clientName, clientEmail, agentName, skipEmail } = await req.json();

    // summary = plain PURPOSE/PROFILE/INCOME/CREDIT recap (emailed to client for confirmation)
    // crmSummary = same recap enriched with internal risk band + LTV/GDS/TDS (saved to the deal, internal only)
    if (!leadId || !summary) {
      return NextResponse.json({ error: 'Missing leadId or summary' }, { status: 400 });
    }
    const safeChecklist: string[] = Array.isArray(checklist) ? checklist : [];
    // The client email is a data-confirmation message — it does not require a checklist
    const willEmail = !skipEmail && !!clientEmail;

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

    const timelineContent = willEmail
      ? `🤖 AI Intake summary${safeChecklist.length ? `, ${safeChecklist.length} document checklist,` : ''} and secure portal link emailed to client.`
      : `🤖 AI Intake summary saved to file (not emailed).${safeChecklist.length ? ` ${safeChecklist.length} document${safeChecklist.length === 1 ? '' : 's'} on internal checklist.` : ''}`;

    const updatePayload: any = {
      // Save the enriched (internal) version when provided; fall back to the plain summary
      dealSummary: crmSummary || summary,
      timeline: FieldValue.arrayUnion({
        type: 'system',
        author: agentName || 'AI Underwriter',
        content: timelineContent,
        timestamp,
        isSystemMessage: true,
      }),
      lastUpdated: timestamp,
    };
    // Keep the checklist on the file for the agent/underwriter even though it isn't emailed
    if (safeChecklist.length > 0) updatePayload.requiredDocuments = safeChecklist;

    await docRef.update(updatePayload);

    if (willEmail) {
      // Client receives: the data recap to confirm + the tailored document checklist + a secure portal link to upload.
      const portalUrl = `https://indibrick.ca/secure-portal/${encodeURIComponent(leadId)}`;
      const checklistHtml = safeChecklist.length
        ? `
              <h3 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 28px;">Documents We'll Need</h3>
              <ul style="color: #334155; font-size: 14px; line-height: 1.8; padding-left: 20px; margin-top: 12px;">
                ${safeChecklist.map((item) => `<li>${item}</li>`).join('')}
              </ul>`
        : '';

      await adminDb.collection('mail').add({
        to: [clientEmail],
        message: {
          subject: `Your summary, document checklist & secure portal — IndiBrick`,
          html: `
            <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">Hi ${clientName || 'there'},</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Thanks for speaking with us. Below is a summary of what we captured for your file. Please review it and <strong>reply to this email to confirm everything is correct</strong> — or let us know what needs fixing.
              </p>

              <h3 style="color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 24px;">Summary of Your Details</h3>
              <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; color: #334155; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${summary}</div>
              ${checklistHtml}

              <div style="text-align: center; margin-top: 32px;">
                <a href="${portalUrl}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Open Your Secure Portal</a>
              </div>
              <p style="color: #64748b; font-size: 13px; margin-top: 16px; line-height: 1.6; text-align: center;">
                Upload your documents anytime through the secure portal above.
              </p>

              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                Replying to this email reaches your advisor directly.
              </p>
            </div>
          `,
        },
      });
    }

    return NextResponse.json({ success: true, emailed: willEmail });
  } catch (error: any) {
    console.error('intake-send error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
