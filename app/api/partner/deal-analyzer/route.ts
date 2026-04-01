import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ error: "API Key missing." }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const { scenario, partnerName } = await req.json();

    // =================================================================
    // STEP 1: RAG RETRIEVAL (Checking your custom brokerage guidelines)
    // =================================================================
    let retrievedContext = "";
    if (adminDb) {
      try {
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const embeddingResult = await embeddingModel.embedContent(scenario);
        
        // Slice to 768 to match the Firebase limit we set in the Admin portal
        const vector = embeddingResult.embedding.values.slice(0, 768);

        const knowledgeRef = adminDb.collection('knowledge_base');
        const vectorQuery = knowledgeRef.findNearest('embedding', FieldValue.vector(vector), {
          limit: 3,
          distanceMeasure: 'COSINE'
        });

        const searchResults = await vectorQuery.get();
        retrievedContext = searchResults.docs.map(doc => doc.data().text).join('\n\n');
      } catch (e) {
        console.warn("RAG Retrieval Bypassed (Database empty or embedding failed).");
      }
    }

    // =================================================================
    // STEP 2: UNDERWRITING ANALYSIS (gemini-2.5-flash)
    // =================================================================
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an elite Senior Mortgage Underwriter for IndiBrick Financial.
      A Realtor partner named ${partnerName} has submitted a client scenario for quick analysis.

      YOUR KNOWLEDGE BASE (BROKERAGE GUIDELINES):
      ${retrievedContext || "Standard Canadian B-20 rules apply. Stress test is Contract Rate + 2% or 5.25%. Max GDS 39%, Max TDS 44% for A-Lenders. B-Lenders can go up to 50% TDS."}

      SCENARIO FROM REALTOR:
      "${scenario}"

      YOUR TASK:
      Act as a Senior Underwriter. Read the scenario, estimate the GDS/TDS (if enough info is provided, otherwise estimate 'N/A'), determine the likelihood of approval, and give actionable next steps for the Realtor to lock the client in with IndiBrick.
      Be realistic. If the deal is bad, say it, but offer an alternative (like a B-Lender or Private).

      OUTPUT FORMAT (JSON ONLY):
      {
        "confidenceScore": number (0-100, representing approval likelihood),
        "gds": "string (e.g. '~35%' or 'N/A')",
        "tds": "string (e.g. '~42%' or 'N/A')",
        "analysis": "string (A 2-3 sentence professional underwriter breakdown of the file)",
        "actionPlan": [
          "Step 1 string",
          "Step 2 string",
          "Step 3 string"
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    
    // Clean markdown formatting
    const cleanJsonText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResponse = JSON.parse(cleanJsonText);

    return NextResponse.json(aiResponse);

  } catch (error: any) {
    console.error("Deal Analyzer Error:", error);
    return NextResponse.json({ error: "Failed to analyze deal" }, { status: 500 });
  }
}