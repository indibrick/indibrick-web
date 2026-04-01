import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { text, sourceTitle, adminKey } = await request.json();

    if (adminKey !== process.env.ADMIN_SECRET_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!text || !adminDb) return NextResponse.json({ error: 'Missing text or Database connection' }, { status: 400 });

    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embeddingModel.embedContent(text);
    
    // THE FIX: Slice the array to 768 dimensions so Firebase accepts it
    const vector = embeddingResult.embedding.values.slice(0, 768);

    await adminDb.collection('knowledge_base').add({
      text: text,
      source: sourceTitle || 'Manual Upload',
      uploadedAt: new Date().toISOString(),
      embedding: FieldValue.vector(vector) 
    });

    return NextResponse.json({ success: true, message: `Successfully vectorized: ${sourceTitle}` });
  } catch (error: any) {
    console.error('Failed to train AI:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}