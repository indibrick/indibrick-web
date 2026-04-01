import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore'; 

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ status: 'chat', reply: "System Error: API Key missing." });

    const genAI = new GoogleGenerativeAI(apiKey);
    const { messages, userData, leadId } = await req.json();
    const lastUserMessage = messages[messages.length - 1]?.content || "Hello";

    // =================================================================
    // STEP 1: RAG RETRIEVAL 
    // =================================================================
    let retrievedContext = "";
    if (adminDb) {
      try {
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const embeddingResult = await embeddingModel.embedContent(lastUserMessage);
        
        // Slice the search vector to exactly 768 dimensions
        const vector = embeddingResult.embedding.values.slice(0, 768);

        const knowledgeRef = adminDb.collection('knowledge_base');
        const vectorQuery = knowledgeRef.findNearest('embedding', FieldValue.vector(vector), {
          limit: 3,
          distanceMeasure: 'COSINE'
        });
        
        const searchResults = await vectorQuery.get();
        retrievedContext = searchResults.docs.map(doc => doc.data().text).join('\n\n');
      } catch (e) {
        console.warn("RAG Retrieval Bypassed.", e);
      }
    }

    // =================================================================
    // STEP 2: STATELESS GENERATION 
    // =================================================================
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const conversationTranscript = messages.map((msg: any) => 
      `${msg.role === 'ai' ? 'Specialist' : 'Client'}: ${msg.content}`
    ).join('\n\n');

    const prompt = `
      You are an elite Mortgage Intake Specialist for IndiBrick Financial in Ontario.
      You are chatting with a client named ${userData.name}.
      
      YOUR KNOWLEDGE BASE (STRICT RULES):
      ${retrievedContext || "Standard Canadian B-20 rules apply. You require 2 pieces of ID."}
      
      YOUR GOAL: Gather exactly 3 things to generate a document checklist:
      1. Goal (Buying, renewing, refinancing)
      2. Employment type (Salaried/T4, Self-Employed)
      3. Down payment or equity amount

      RULES:
      - Review the conversation transcript below.
      - Ask ONLY ONE question at a time to keep the conversation going.
      - Do NOT ask for name, email, or phone.
      - MANDATORY: The final checklist MUST start with "2 pieces of Photo ID (no Ontario Health Cards)".
      
      OUTPUT FORMAT (JSON ONLY - No markdown):
      If you still need info: {"status": "chat", "reply": "Your response here."}
      If complete: {"status": "complete", "reply": "Perfect...", "summary": "Summary here.", "checklist": ["Item 1", "Item 2"]}

      TRANSCRIPT SO FAR:
      ${conversationTranscript}
    `;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let aiResponse;
    try {
        aiResponse = JSON.parse(cleanJsonText);
    } catch (parseError) {
        return NextResponse.json({ status: 'chat', reply: "I'm processing that. Could you clarify your current employment status?" });
    }

    // =================================================================
    // STEP 3: CRM UPDATE & EMAIL
    // =================================================================
    if (aiResponse.status === 'complete' && adminDb) {
        if (leadId) {
            const referralsRef = adminDb.collection('referrals');
            const snapshot = await referralsRef.where('leadId', '==', leadId).get();

            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                const newTimelineEntry = {
                  type: 'system',
                  author: 'AI Copilot',
                  content: `AI Intake Completed. Summary: ${aiResponse.summary} | Documents requested: ${aiResponse.checklist.join(', ')}`,
                  timestamp: new Date().toISOString(),
                  isSystemMessage: true
                };

                await adminDb.collection('referrals').doc(docId).update({
                   timeline: FieldValue.arrayUnion(newTimelineEntry),
                   status: 'Contacted',
                   // Save the checklist to the database so the portal can read it
                   requiredDocuments: aiResponse.checklist 
                });
            }
        }

        const checklistHtml = aiResponse.checklist.map((item: string) => `<li>${item}</li>`).join('');
        await adminDb.collection('mail').add({
            to: [userData.email, 'sales@indibrick.ca'],
            message: {
                subject: `Your IndiBrick Mortgage Document Checklist`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2>Hi ${userData.name},</h2>
                        <p>Based on our quick chat, here is the exact document checklist our underwriters need to proceed with your file:</p>
                        <ul>${checklistHtml}</ul>
                        <br/>
                        <p>Please click the link below to access your secure portal and upload these documents.</p>
                        <br/>
                        <a href="https://indibrick.ca/secure-portal/${leadId}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Secure Vault</a>
                    </div>
                `
            }
        });
    }

    // These lines were accidentally deleted!
    return NextResponse.json(aiResponse);

  } catch (error: any) {
    console.error("AI Intake Error:", error);
    return NextResponse.json({ status: 'chat', reply: "My AI connection is currently updating. A specialist will review the file and reach out shortly!" });
  }
}