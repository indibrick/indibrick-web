import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { messages, clientName, dealStatus, dealService, assignedAgent } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return NextResponse.json({ reply: "API Key missing." }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. RAG Retrieval (Look up internal knowledge base for real estate questions)
    let retrievedContext = "";
    if (adminDb) {
      try {
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const embeddingResult = await embeddingModel.embedContent(lastUserMessage);
        const vector = embeddingResult.embedding.values.slice(0, 768);

        const knowledgeRef = adminDb.collection('knowledge_base');
        const vectorQuery = knowledgeRef.findNearest('embedding', FieldValue.vector(vector), {
          limit: 2, distanceMeasure: 'COSINE'
        });
        
        const searchResults = await vectorQuery.get();
        retrievedContext = searchResults.docs.map(doc => doc.data().text).join('\n\n');
      } catch (e) {
        console.warn("RAG Retrieval Bypassed.");
      }
    }

    // 2. Inject the Client Context into the Prompt
    const prompt = `
      You are the IndiBrick Client Concierge AI. 
      You are chatting with a verified client named ${clientName}.
      
      CURRENT FILE CONTEXT:
      - Service Requested: ${dealService}
      - Current Stage/Status: ${dealStatus}
      - Assigned Human Advisor: ${assignedAgent}

      COMPANY KNOWLEDGE BASE (Use if they ask general real estate/mortgage questions):
      ${retrievedContext || "Standard Canadian real estate rules apply."}

      RULES:
      - Be extremely polite, professional, and reassuring.
      - If they ask about their file status, use the CURRENT FILE CONTEXT above.
      - If they ask something you don't know, tell them their advisor (${assignedAgent}) will reach out to them.
      - Keep responses concise (2-3 sentences max).
      - NEVER make promises about approvals or rates.
    `;

    // 3. Convert message history to Gemini format
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = model.startChat({ history, systemInstruction: prompt });

    const result = await chat.sendMessage(lastUserMessage);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error("Client Chat Error:", error);
    return NextResponse.json({ reply: "I'm having trouble connecting right now. Please reach out to your advisor directly." }, { status: 500 });
  }
}