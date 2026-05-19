// eslint-disable-next-line import/no-unresolved
import { onRequest } from "firebase-functions/v2/https";
// eslint-disable-next-line import/no-unresolved
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

admin.initializeApp();
const db = admin.firestore();

export const metaLeadReceiver = onRequest(
  { secrets: ["META_ACCESS_TOKEN"] },
  async (req, res) => {
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    // ===========================================================================
    // 1. META WEBHOOK VERIFICATION HANDSHAKE
    // ===========================================================================
    if (req.method === "GET") {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === "indibrick_secure_webhook_2026") {
        console.log("✅ Meta Webhook Verified Successfully!");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
      return;
    }

    // ===========================================================================
    // 2. LEAD INGESTION
    // ===========================================================================
    if (req.method === "POST") {
      const body = req.body;

      if (body.object === "page") {
        try {
          for (const entry of body.entry) {
            for (const change of entry.changes) {
              if (change.field === "leadgen" && change.value) {
                const leadgenId = change.value.leadgen_id;
                const formId = change.value.form_id;

                console.log(`🚀 New Lead Ping Received! ID: ${leadgenId}`);

                // A. Fetch decrypted lead data from Meta Graph API using the REAL token
                const graphApiUrl = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${META_ACCESS_TOKEN}`;
                const metaResponse = await fetch(graphApiUrl);
                const leadData = await metaResponse.json();

                if (leadData.error) {
                  console.error("❌ Graph API Error:", leadData.error);
                  continue;
                }

                // B. Parse Meta's array format into a clean object (FIXED FOR INSTAGRAM CRASH)
                const formattedLead: any = {};
                if (leadData.field_data) {
                  leadData.field_data.forEach((field: any) => {
                    // Safely check if values array exists and has at least one item before grabbing index [0]
                    formattedLead[field.name] = (field.values && field.values.length > 0) ? field.values[0] : '';
                  });
                }

                // Cleanly map the name fields
                const clientName = formattedLead.full_name || (formattedLead.first_name ? formattedLead.first_name + ' ' + formattedLead.last_name : 'Meta Test Lead');
                const clientPhone = formattedLead.phone_number || '';
                const clientEmail = formattedLead.email || '';
                const timestamp = new Date().toISOString();

                // C. INJECT DIRECTLY INTO INDIBRICK CRM
                await db.collection("referrals").add({
                  leadId: `META_${leadgenId}`,
                  referrerId: "META_ADS_SYSTEM",
                  referrerName: "Meta Lead Ads",
                  assignedAgentId: "ADMIN_INBOX",
                  assignedAgentName: "Indibrick Admin Triage",
                  status: "New Web Lead",
                  clientName: clientName,
                  clientPhone: clientPhone,
                  clientEmail: clientEmail,
                  referralDate: timestamp,
                  notes: `System: Auto-ingested from Meta Lead Ad. Form ID: ${formId}`,
                  type: "Social Inbound"
                });

                // D. TRIGGER SPEED-TO-LEAD EMAIL NOTIFICATION
                await db.collection("mail").add({
                  // REMINDER: Change this to your new admin email address!
                  to: ["indibrick@gmail.com"],
                  message: {
                    subject: `🚨 INSTANT META LEAD: ${clientName}`,
                    html: `
                      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1877F2; border-radius: 10px;">
                        <h2 style="color: #1877F2;">New Lead Captured from Facebook/Instagram</h2>
                        <ul>
                          <li><strong>Name:</strong> ${clientName}</li>
                          <li><strong>Phone:</strong> ${clientPhone || 'Not Provided'}</li>
                          <li><strong>Email:</strong> ${clientEmail || 'Not Provided'}</li>
                        </ul>
                        <br/>
                        <a href="https://indibrick.ca/partner/login" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log into CRM to Route Lead</a>
                      </div>
                    `
                  }
                });

                console.log(`✅ Successfully processed and injected Meta Lead: ${clientName}`);
              }
            }
          }
          res.status(200).send("EVENT_RECEIVED");
        } catch (error) {
          console.error("Critical Error processing lead:", error);
          res.status(500).send("INTERNAL_SERVER_ERROR");
        }
      } else {
        res.sendStatus(404);
      }
    }
  }
);

// =============================================================================
// STALLED DEAL DIGEST
// Runs every morning at 7am Toronto time. For every agent, finds active deals
// that haven't had a timeline entry in 5+ days and emails them a digest.
// Drops a digest into the `mail` Firestore collection (Trigger Email extension).
// =============================================================================
const FUNDED_STATUSES_BACKEND = [
  "Funded", "Closed", "Firm Sale", "Firm / Conditional", "Funded / Paid",
];
const LOST_STATUSES_BACKEND = ["Declined", "Lost", "Cancelled"];
const STALL_THRESHOLD_DAYS = 5;

export const stalledDealDigest = onSchedule(
  { schedule: "every day 07:00", timeZone: "America/Toronto" },
  async () => {
    const now = Date.now();
    const stallMs = STALL_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

    const snap = await db.collection("referrals").get();
    const byAgent: Record<string, Array<{
      id: string; clientName: string; clientPhone: string; status: string; daysIdle: number;
    }>> = {};

    snap.forEach((d) => {
      const r = d.data() as any;
      if (!r) return;
      if (FUNDED_STATUSES_BACKEND.includes(r.status)) return;
      if (LOST_STATUSES_BACKEND.includes(r.status)) return;
      const assignee = r.assignedAgentId;
      if (!assignee || assignee === "ADMIN_INBOX") return;

      const timeline = Array.isArray(r.timeline) ? r.timeline : [];
      const lastActivityStr = timeline.length > 0 ?
        timeline[timeline.length - 1].timestamp :
        (r.lastUpdated || r.referralDate);
      if (!lastActivityStr) return;
      const lastActivityTs = new Date(lastActivityStr).getTime();
      if (isNaN(lastActivityTs)) return;
      const idleMs = now - lastActivityTs;
      if (idleMs < stallMs) return;

      const daysIdle = Math.floor(idleMs / (24 * 60 * 60 * 1000));
      if (!byAgent[assignee]) byAgent[assignee] = [];
      byAgent[assignee].push({
        id: d.id,
        clientName: r.clientName || "Unknown",
        clientPhone: r.clientPhone || "",
        status: r.status || "Unknown",
        daysIdle,
      });
    });

    let agentsEmailed = 0;
    for (const [agentUid, deals] of Object.entries(byAgent)) {
      try {
        const userDoc = await db.collection("users").doc(agentUid).get();
        if (!userDoc.exists) continue;
        const u = userDoc.data() as any;
        const email = u?.email;
        if (!email) continue;

        deals.sort((a, b) => b.daysIdle - a.daysIdle);

        const rows = deals.slice(0, 25).map((d) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">${d.clientName}</td>
            <td style="padding: 10px 8px; color: #475569;">${d.status}</td>
            <td style="padding: 10px 8px; color: #b91c1c; font-weight: 700;">${d.daysIdle} days idle</td>
            <td style="padding: 10px 8px;">${d.clientPhone ? `<a href="tel:${d.clientPhone}" style="color: #2563eb; font-weight: 700;">${d.clientPhone}</a>` : "—"}</td>
          </tr>`).join("");

        const moreLine = deals.length > 25 ?
          `<p style="color:#64748b; font-size:12px; margin-top:8px;">+${deals.length - 25} more stalled deals not shown.</p>` :
          "";

        await db.collection("mail").add({
          to: [email],
          message: {
            subject: `⏰ ${deals.length} stalled deal${deals.length === 1 ? "" : "s"} need attention`,
            html: `
              <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0f172a; margin-bottom: 4px;">Daily Stall Report</h2>
                <p style="color: #475569; font-size: 14px; margin-top: 0;">
                  These deals haven't had any logged activity in ${STALL_THRESHOLD_DAYS}+ days. A 5-minute call today usually resurrects 30% of them.
                </p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                  <thead>
                    <tr style="background: #f1f5f9;">
                      <th style="padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Client</th>
                      <th style="padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Status</th>
                      <th style="padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Idle</th>
                      <th style="padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Phone</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
                ${moreLine}
                <div style="margin: 24px 0;">
                  <a href="https://indibrick.ca/partner" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open CRM</a>
                </div>
              </div>
            `,
          },
        });

        agentsEmailed += 1;
      } catch (err) {
        console.error("Stalled digest error for agent", agentUid, err);
      }
    }
    console.log(`📨 Stalled digest sent to ${agentsEmailed} agent(s).`);
  }
);
