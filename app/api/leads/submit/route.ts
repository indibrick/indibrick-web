import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; // Enterprise Admin SDK
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    if (!adminDb) {
      console.error("❌ Admin DB not connected. Check environment variables.");
      return NextResponse.json({ success: false, error: "Database not connected" }, { status: 500 });
    }

    const body = await request.json();
    const { name, email, phone, serviceNeeded, city, message, pageSource, userAgent, partnerId } = body;
    const timestamp = new Date().toISOString();
    const clientName = name || 'Unknown Client';

    if (!name || !phone || !serviceNeeded) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Realtor landing-page attribution. partnerId is the page slug (e.g. "mudit-chhura").
    const landingPageSlug = (partnerId || '').trim();
    const partnerName = landingPageSlug
      ? landingPageSlug.split('-').map((w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : '')).join(' ').trim()
      : '';
    const referralSource = landingPageSlug ? 'Realtor Partner' : 'Web Lead';

    // 1. Write to Portal X 99 (Leads Collection) securely via Admin
    const leadRef = await adminDb.collection('leads').add({
      name: clientName,
      email: email || '',
      phone: phone,
      serviceNeeded: serviceNeeded,
      city: city || 'Unknown',
      message: message || '',
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      date: timestamp,
      pageSource: pageSource || 'api',
      userAgent: userAgent || 'unknown',
      referralSource,
      landingPageSlug,
      partnerName,
    });

    // 2. THE CRM BRIDGE: Inject instantly into Partner Portal bypassing client rules
    await adminDb.collection('referrals').add({
      leadId: leadRef.id,
      referrerId: 'INDIBRICK_WEB_SYSTEM',
      referrerName: landingPageSlug ? partnerName : 'Indibrick Website',
      assignedAgentId: 'ADMIN_INBOX',
      assignedAgentName: 'Indibrick Admin Triage',
      status: 'New Web Lead',
      clientName: clientName,
      clientPhone: phone,
      clientEmail: email || '',
      referralDate: timestamp,
      message: message || '', // <--- THE FIX: Explicitly save the message for the CRM UI
      notes: `System: Lead submitted from website form. Service requested: ${serviceNeeded}.`,
      // Compensation/attribution: where the lead came from + which landing page (if any)
      referralSource,
      landingPageSlug,
      timeline: [{
        type: 'system',
        author: 'System',
        content: landingPageSlug
          ? `Lead generated from ${partnerName}'s landing page.`
          : 'Lead automatically ingested via secure Admin API from public web form.',
        timestamp: timestamp,
        isSystemMessage: true
      }],
      type: landingPageSlug ? 'Realtor Landing Page' : 'Web Inbound'
    });

    // 3. Trigger Admin Alert securely via Admin
    await adminDb.collection('mail').add({
      to: ['indibrick@gmail.com'], 
      message: {
        subject: `🚨 New Lead Alert: ${clientName} (${serviceNeeded})`,
        text: `Name: ${clientName}\nPhone: ${phone}\nEmail: ${email}\nService: ${serviceNeeded}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">New Lead Captured</h2>
            <ul>
              <li><strong>Name:</strong> ${clientName}</li>
              <li><strong>Phone:</strong> ${phone}</li>
              <li><strong>Email:</strong> ${email || 'N/A'}</li>
              <li><strong>Service Requested:</strong> ${serviceNeeded}</li>
            </ul>
            <p><strong>Message:</strong><br/> ${message || 'No message attached.'}</p>
            <br/>
            <a href="https://indibrick.ca/partner/login" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log into CRM to Route Lead</a>
          </div>
        `
      }
    });

    return NextResponse.json({ success: true, id: leadRef.id });

  } catch (error: any) {
    console.error("API Route Error submitting lead:", error); 
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}