import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; // Imports our safe db
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    // 1. RUNTIME SAFETY CHECK
    // If adminDb is null, it means the server secrets are missing in the cloud console.
    if (!adminDb) {
      console.error("❌ CRITICAL: Admin DB not connected. Check environment variables.");
      return NextResponse.json({ success: false, error: "Server Configuration Error: Database not connected" }, { status: 500 });
    }

    const body = await request.json();
    const { name, email, phone, serviceNeeded, city, message, pageSource, userAgent } = body;

    // Server-Side Validation
    if (!name || !phone || !serviceNeeded) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Write to CRM (Leads)
    const leadRef = await adminDb.collection('leads').add({
      name,
      email,
      phone,
      serviceNeeded,
      city: city || 'Unknown',
      message: message || '',
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      date: new Date().toISOString(),
      pageSource: pageSource || 'api',
      userAgent: userAgent || 'unknown',
    });

    // Trigger Email Notification (Mail)
    await adminDb.collection('mail').add({
      to: ['mrcinvestmentsinc@gmail.com'], 
      message: {
        subject: `🚀 New Lead: ${name} (${serviceNeeded})`,
        text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nService: ${serviceNeeded}`,
        html: `<h1>New Lead</h1><p>Name: ${name}</p><p>Phone: ${phone}</p><p>Service: ${serviceNeeded}</p>`
      }
    });

    return NextResponse.json({ success: true, id: leadRef.id });

  } catch (error: any) {
    console.error("API Route Error:", error); 
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}