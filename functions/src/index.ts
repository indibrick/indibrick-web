// eslint-disable-next-line import/no-unresolved
import { onRequest } from "firebase-functions/v2/https";
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

                // B. Parse Meta's array format into a clean object
                const formattedLead: any = {};
                if (leadData.field_data) {
                  leadData.field_data.forEach((field: any) => {
                    formattedLead[field.name] = field.values[0];
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
                  to: ["mrcinvestmentsinc@gmail.com"],
                  message: {
                    subject: `🚨 INSTANT META LEAD: ${clientName}`,
                    html: `
                      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #1877F2; border-radius: 10px;">
                        <h2 style="color: #1877F2;">New Lead Captured from Facebook/Instagram</h2>
                        <ul>
                          <li><strong>Name:</strong> ${clientName}</li>
                          <li><strong>Phone:</strong> ${clientPhone}</li>
                          <li><strong>Email:</strong> ${clientEmail}</li>
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