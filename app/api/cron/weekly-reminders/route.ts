import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
    // Basic Security Check: To prevent strangers from triggering your emails
    const { searchParams } = new URL(request.url);
    if (searchParams.get('key') !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (!adminDb) throw new Error("No admin DB connection");

        // 1. Fetch all referrals
        const referralsSnap = await adminDb.collection('referrals').get();
        const allReferrals = referralsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Filter only ACTIVE deals
        const activeReferrals = allReferrals.filter((r: any) => 
            !['Closed', 'Funded', 'Declined', 'Dead Deal'].includes(r.status)
        );

        // 3. Group the active deals by the Agent they are assigned to
        const agentPipelines: Record<string, any[]> = {};
        activeReferrals.forEach((ref: any) => {
            const agentId = ref.assignedAgentId || 'ADMIN_INBOX';
            if (!agentPipelines[agentId]) agentPipelines[agentId] = [];
            agentPipelines[agentId].push(ref);
        });

        // 4. Fetch all users to grab their real email addresses
        const usersSnap = await adminDb.collection('users').get();
        const users = usersSnap.docs.reduce((acc: any, doc) => {
            acc[doc.id] = doc.data();
            return acc;
        }, {});

        const batch = adminDb.batch();
        let emailsSent = 0;

        // 5. Build and stage the emails
        for (const [agentId, deals] of Object.entries(agentPipelines)) {
            let agentEmail = 'sales@indibrick.ca'; // Defaults to Admin inbox if unassigned
            let agentName = 'IndiBrick Admin';

            if (agentId !== 'ADMIN_INBOX' && users[agentId]) {
                agentEmail = users[agentId].email;
                agentName = users[agentId].displayName || 'Partner';
            }

            if (!agentEmail) continue;

            let dealsListHtml = deals.map(d => 
                `<li style="margin-bottom: 8px;"><strong>${d.clientName}</strong> - Stage: ${d.status} (${d.dealCategory || 'potential'})</li>`
            ).join('');

            const mailRef = adminDb.collection('mail').doc();
            batch.set(mailRef, {
                to: [agentEmail],
                message: {
                    subject: `📊 Your Weekly IndiBrick Pipeline Update`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px; max-width: 600px;">
                            <h2 style="color: #0F172A;">Hi ${agentName},</h2>
                            <p style="color: #475569; line-height: 1.6;">Here is your weekly pipeline summary. Please log into the IndiBrick CRM to update the statuses of your active deals, log your calls, and add any new notes.</p>
                            
                            <h3 style="color: #0F172A; border-bottom: 1px solid #eee; padding-bottom: 10px;">Active Deals (${deals.length})</h3>
                            <ul style="color: #475569; padding-left: 20px;">
                                ${dealsListHtml}
                            </ul>
                            
                            <br/><br/>
                            <a href="https://indibrick.ca/partner" style="background-color: #0F172A; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open IndiBrick CRM</a>
                        </div>
                    `
                }
            });
            emailsSent++;
        }

        // 6. Send all emails at once
        await batch.commit();

        return NextResponse.json({ success: true, message: `Dispatched ${emailsSent} weekly reminder emails to agents.` });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}