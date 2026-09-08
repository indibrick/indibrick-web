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
    const {
      name, email, phone, serviceNeeded, city, message, pageSource, userAgent, partnerId,
      // Wizard extensions (/contact + /apply): structured fields the legacy LeadForm doesn't send.
      // All optional — the older `name/phone/serviceNeeded` contract still works when these are absent.
      source, goal, province, propertyValue, mortgageBalance, ltv, employmentType,
      firstName, lastName, consentGiven, lenderTier, creditRange, trustedFormCertUrl,
    } = body;
    const timestamp = new Date().toISOString();

    // Derive `name` from firstName/lastName when the wizard sends them separately.
    const clientName = (name && name.trim())
      || [firstName, lastName].filter((s: any) => s && String(s).trim()).join(' ').trim()
      || 'Unknown Client';
    // Older callers always send serviceNeeded; the new wizard sends `goal` instead.
    const effectiveServiceNeeded = (serviceNeeded && String(serviceNeeded).trim()) || (goal && String(goal).trim()) || '';

    if (!clientName || clientName === 'Unknown Client' || !phone || !effectiveServiceNeeded) {
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
      serviceNeeded: effectiveServiceNeeded,
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
      // Wizard fields — written when present, ignored by older callers.
      source: source || '',
      goal: goal || '',
      province: province || '',
      propertyValue: propertyValue ?? null,
      mortgageBalance: mortgageBalance ?? null,
      ltv: ltv ?? null,
      employmentType: employmentType || '',
      firstName: firstName || '',
      lastName: lastName || '',
      consentGiven: consentGiven === true,
      lenderTier: lenderTier || '',
      creditRange: creditRange || '',
      trustedFormCertUrl: trustedFormCertUrl || '',
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
      // Carried across from the lead so drip copy can address the buyer's
      // market ({{city}} in the Simcoe sequence). Without it the tag has
      // nothing to resolve against on the referral.
      city: city || '',
      clientEmail: email || '',
      referralDate: timestamp,
      message: message || '', // <--- THE FIX: Explicitly save the message for the CRM UI
      notes: `System: Lead submitted from website form. Service requested: ${effectiveServiceNeeded}.${lenderTier ? ` Tier: ${lenderTier}.` : ''}${ltv != null ? ` LTV: ${ltv}%.` : ''}`,
      // Compensation/attribution: where the lead came from + which landing page (if any)
      referralSource,
      landingPageSlug,
      // Wizard context surfaced to the CRM so the agent can pick up the file cold
      goal: goal || '',
      province: province || '',
      propertyValue: propertyValue ?? null,
      mortgageBalance: mortgageBalance ?? null,
      ltv: ltv ?? null,
      employmentType: employmentType || '',
      lenderTier: lenderTier || '',
      creditRange: creditRange || '',
      source: source || '',
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
        subject: `🚨 New Lead Alert: ${clientName} (${effectiveServiceNeeded}${lenderTier ? ` · ${lenderTier}` : ''})`,
        text: `Name: ${clientName}\nPhone: ${phone}\nEmail: ${email}\nService: ${effectiveServiceNeeded}${lenderTier ? `\nLender Tier: ${lenderTier}` : ''}${ltv != null ? `\nLTV: ${ltv}%` : ''}${source ? `\nSource: ${source}` : ''}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">New Lead Captured</h2>
            <ul>
              <li><strong>Name:</strong> ${clientName}</li>
              <li><strong>Phone:</strong> ${phone}</li>
              <li><strong>Email:</strong> ${email || 'N/A'}</li>
              <li><strong>Service Requested:</strong> ${effectiveServiceNeeded}</li>
              ${lenderTier ? `<li><strong>Lender Tier:</strong> ${lenderTier}</li>` : ''}
              ${ltv != null ? `<li><strong>LTV:</strong> ${ltv}%</li>` : ''}
              ${province ? `<li><strong>Province:</strong> ${province}</li>` : ''}
              ${employmentType ? `<li><strong>Employment:</strong> ${employmentType}</li>` : ''}
              ${creditRange ? `<li><strong>Credit:</strong> ${creditRange}</li>` : ''}
              ${source ? `<li><strong>Source:</strong> ${source}</li>` : ''}
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