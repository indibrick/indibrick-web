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

    // THE FIX: Do NOT generate a signed URL here. 
    // Save the raw 'filePath' so we can generate fresh URLs dynamically on load.

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
        const newVaultItem = {
            fileName,
            mimeType,
            documentType: aiSummary.documentType,
            storagePath: filePath,
            requirementName: requirementName || 'Additional Upload',
            uploadedAt: new Date().toISOString(),
            grossIncome: aiSummary.grossIncome || null,
            employerName: aiSummary.employerName || null,
            extractionSummary: aiSummary.summary || null,
        };
        const newTimelineEntry = {
            type: 'system', author: 'AI Underwriter',
            content: `📄 Document Uploaded: ${fileName}\nType: ${aiSummary.documentType}\nIncome Detected: ${aiSummary.grossIncome || 'N/A'}\nSummary: ${aiSummary.summary}`,
            timestamp: new Date().toISOString(), isSystemMessage: true
        };

        await docRef.update({
            timeline: FieldValue.arrayUnion(newTimelineEntry),
            vault: FieldValue.arrayUnion(newVaultItem)
        });

        // =================================================================
        // 4. REFRESH AI DEAL SUMMARY
        // The deal summary written by the partner intake flow reflects the file as
        // of intake time. When new documents arrive (paystubs, T4s, NoAs), we re-run
        // the underwriter prompt with the full vault context so the summary stays
        // accurate — agents see verified data overwrite the client's stated numbers.
        // =================================================================
        try {
            const freshSnap = await docRef.get();
            const dealData = freshSnap.data() || {};
            const fullVault = [...(dealData.vault || []), newVaultItem];
            const existingSummary = dealData.dealSummary || '';
            const requiredDocs = dealData.requiredDocuments || [];

            const vaultManifest = fullVault.map((v: any) => {
                const parts = [`- ${v.documentType || v.fileName}`];
                if (v.grossIncome) parts.push(`income: ${v.grossIncome}`);
                if (v.employerName) parts.push(`employer: ${v.employerName}`);
                if (v.extractionSummary) parts.push(`note: ${v.extractionSummary}`);
                return parts.join(' | ');
            }).join('\n');

            const refreshPrompt = `
You are a Canadian mortgage underwriter. The deal currently has this AI summary:
--- EXISTING SUMMARY ---
${existingSummary || '(none yet)'}
--- DOCUMENTS UPLOADED SO FAR (${fullVault.length} files) ---
${vaultManifest}
--- REQUIRED DOCUMENT CHECKLIST (${requiredDocs.length} items) ---
${requiredDocs.map((d: string) => `- ${d}`).join('\n') || '(none)'}

A new document was just uploaded: ${fileName} (${aiSummary.documentType}).

REWRITE the summary as a concise underwriter assessment (4-8 lines, plain text, no markdown).
- Keep the existing LTV/GDS/TDS metric block if it was present (mark numbers stale if income from docs differs).
- Add a "DOCS VERIFIED:" line listing which checklist items are now satisfied.
- Add a "STILL OUTSTANDING:" line listing checklist items not yet covered.
- If the uploaded doc's income differs materially from the originally-stated income, FLAG it.
Output the new summary only — no preamble.`;

            const refreshModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const refreshResult = await refreshModel.generateContent(refreshPrompt);
            const newSummary = refreshResult.response.text().trim();

            if (newSummary) {
                await docRef.update({
                    dealSummary: newSummary,
                    summaryRefreshedAt: new Date().toISOString(),
                    timeline: FieldValue.arrayUnion({
                        type: 'system', author: 'AI Underwriter',
                        content: `♻️ Deal summary auto-refreshed after ${aiSummary.documentType || 'document'} upload.`,
                        timestamp: new Date().toISOString(), isSystemMessage: true
                    })
                });
            }
        } catch (refreshErr) {
            // Non-fatal: doc still saved, only the summary refresh failed
            console.warn('Deal summary refresh failed:', refreshErr);
        }
    }

    return NextResponse.json({ success: true, aiSummary });

  } catch (error: any) {
    console.error('Document Processing Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}