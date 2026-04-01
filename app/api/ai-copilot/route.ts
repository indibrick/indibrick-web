import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { referralId, clientName, assigneeId, noteContent } = await req.json();
    
    if (!referralId || !noteContent || !adminDb) {
       return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // Force strict JSON responses
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an AI assistant for a CRM. Read the following note logged by an agent.
      Determine if the agent implies a future follow-up task, deadline, or appointment.
      
      CRITICAL: Today's date is ${new Date().toISOString().split('T')[0]}. Use this to calculate exact dates (YYYY-MM-DD).

      Note from Agent: "${noteContent}"

      Return ONLY a JSON object:
      {
        "hasTask": boolean,
        "date": "YYYY-MM-DD or null",
        "description": "Short action-oriented description or null"
      }
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = JSON.parse(result.response.text());

    // If a task is detected, save it via Admin SDK to bypass Firebase rules!
    if (aiResponse.hasTask && aiResponse.date && aiResponse.description) {
       await adminDb.collection('tasks').add({
          referralId,
          clientName,
          assigneeId,
          dueDate: aiResponse.date,
          description: aiResponse.description,
          status: 'Pending',
          createdAt: new Date().toISOString()
       });
    }

    return NextResponse.json({ success: true, taskScheduled: aiResponse.hasTask });

  } catch (error: any) {
    console.error('AI Copilot Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}