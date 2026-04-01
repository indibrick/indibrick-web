import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function chunkText(text: string, maxChunkSize: number = 1500) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = "";
  for (const p of paragraphs) {
    if (currentChunk.length + p.length > maxChunkSize) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = p;
    } else {
      currentChunk += "\n\n" + p;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, sourceTitle, adminKey } = await req.json();

    if (adminKey !== process.env.ADMIN_SECRET_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!pdfBase64 || !adminDb) return NextResponse.json({ error: 'Missing Data' }, { status: 400 });

    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const extractionResult = await visionModel.generateContent([
      { inlineData: { data: pdfBase64, mimeType: "application/pdf" } },
      "Extract all text accurately."
    ]);
    
    const rawText = extractionResult.response.text();
    if (!rawText) throw new Error("Could not extract text.");

    const chunks = chunkText(rawText, 1500);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const batch = adminDb.batch();
    const knowledgeRef = adminDb.collection('knowledge_base');

    for (const chunk of chunks) {
      const embedResult = await embeddingModel.embedContent(chunk);
      
      // THE FIX: Slice the array to 768 dimensions
      const vector = embedResult.embedding.values.slice(0, 768);
      
      const docRef = knowledgeRef.doc(); 
      batch.set(docRef, {
        text: chunk,
        source: sourceTitle || 'PDF Upload',
        uploadedAt: new Date().toISOString(),
        embedding: FieldValue.vector(vector) 
      });
    }

    await batch.commit();
    return NextResponse.json({ success: true, message: `Vectorized ${chunks.length} chunks.` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}