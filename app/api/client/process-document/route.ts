import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, mimeType, fileName, leadId, requirementName } = await req.json();

    if (!fileBase64 || !leadId || !adminDb) {
      return NextResponse.json({ error: 'Missing file, lead ID, or DB connection' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. Ask Gemini to read the document
    const visionModel = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an elite Mortgage Underwriter. Analyze the attached document.
      Identify what type of document it is (e.g., Paystub, T4, Notice of Assessment, Bank Statement, ID).
      Extract the most important financial data you can find. 
      Return ONLY a JSON object: {"documentType": "string", "employerName": "string or null", "grossIncome": "string or null", "summary": "A 1-2 sentence underwriter summary"}
    `;

    const result = await visionModel.generateContent([
      { inlineData: { data: fileBase64, mimeType: mimeType } },
      prompt
    ]);
    
    const cleanJsonText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiSummary = JSON.parse(cleanJsonText);

    // =================================================================
    // 2. THE FIX: SAVE PHYSICAL FILE TO EXPLICIT FIREBASE STORAGE BUCKET
    // =================================================================
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    
    // We explicitly grab the bucket name from your environment variables
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
    
    if (!bucketName) {
        throw new Error("Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local file.");
    }

    // Pass the specific bucket name into the function
    const bucket = getStorage().bucket(bucketName); 
    const filePath = `vault/${leadId}/${Date.now()}_${fileName}`;
    const fileRef = bucket.file(filePath);
    
    // Save to Google Cloud Storage
    await fileRef.save(fileBuffer, {
        contentType: mimeType,
        metadata: { metadata: { leadId } }
    });

    // Generate a secure download URL
    const [downloadUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '01-01-2027' 
    });

    // =================================================================
    // 3. UPDATE THE CRM
    // =================================================================
    const referralsRef = adminDb.collection('referrals');
    const snapshot = await referralsRef.where('leadId', '==', leadId).get();
    
    let docRef;
    if (!snapshot.empty) docRef = referralsRef.doc(snapshot.docs[0].id);
    else {
        const directDoc = await referralsRef.doc(leadId).get();
        if (directDoc.exists) docRef = referralsRef.doc(leadId);
    }

    if (docRef) {
        const newTimelineEntry = {
            type: 'system', author: 'AI Underwriter',
            content: `📄 Document Uploaded: ${fileName}\nType: ${aiSummary.documentType}\nIncome Detected: ${aiSummary.grossIncome || 'N/A'}\nSummary: ${aiSummary.summary}`,
            timestamp: new Date().toISOString(), isSystemMessage: true
        };

        await docRef.update({
            timeline: FieldValue.arrayUnion(newTimelineEntry),
            vault: FieldValue.arrayUnion({
                fileName,
                mimeType,
                documentType: aiSummary.documentType,
                downloadUrl: downloadUrl,
                requirementName: requirementName || 'Additional Upload', 
                uploadedAt: new Date().toISOString()
            })
        });
    }

    return NextResponse.json({ success: true, aiSummary });

  } catch (error: any) {
    console.error('Document Processing Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}