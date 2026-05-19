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

    // If the AI caught an explicit follow-up date in the note, use it.
    // Otherwise fall back to a 7-day default so deals never go cold —
    // unless this referral already has a pending future task (avoid stacking).
    let createdTaskId: string | null = null;
    let createdTask: { dueDate: string; description: string; isDefault: boolean } | null = null;

    if (aiResponse.hasTask && aiResponse.date && aiResponse.description) {
       const ref = await adminDb.collection('tasks').add({
          referralId,
          clientName,
          assigneeId,
          dueDate: aiResponse.date,
          description: aiResponse.description,
          status: 'Pending',
          aiGenerated: true,
          createdAt: new Date().toISOString()
       });
       createdTaskId = ref.id;
       createdTask = { dueDate: aiResponse.date, description: aiResponse.description, isDefault: false };
    } else {
       // No explicit date — schedule a 7-day default, but only if there's no pending future task already
       const today = new Date().toISOString().split('T')[0];
       const existing = await adminDb.collection('tasks')
          .where('referralId', '==', referralId)
          .where('assigneeId', '==', assigneeId)
          .where('status', '==', 'Pending')
          .where('dueDate', '>=', today)
          .limit(1)
          .get();

       if (existing.empty) {
           const due = new Date();
           due.setDate(due.getDate() + 7);
           const dueDate = due.toISOString().split('T')[0];
           const description = `Routine follow-up — check in with ${clientName}`;
           const ref = await adminDb.collection('tasks').add({
              referralId,
              clientName,
              assigneeId,
              dueDate,
              description,
              status: 'Pending',
              aiGenerated: true,
              isDefault: true,
              createdAt: new Date().toISOString()
           });
           createdTaskId = ref.id;
           createdTask = { dueDate, description, isDefault: true };
       }
    }

    return NextResponse.json({
        success: true,
        taskScheduled: !!createdTaskId,
        taskId: createdTaskId,
        task: createdTask,
    });

  } catch (error: any) {
    console.error('AI Copilot Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}