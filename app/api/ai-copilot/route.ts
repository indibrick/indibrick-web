import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with your server-side API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { note, clientName } = await req.json();

    if (!note) {
      return NextResponse.json({ error: 'No note provided' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // The CTO Prompt: Instructing the AI how to behave like a CRM assistant
    const prompt = `
      You are an elite CRM AI Copilot for a real estate and mortgage brokerage.
      A partner just logged the following note about a client named ${clientName}.
      
      Note: "${note}"
      
      Analyze the note. Does it imply that a future follow-up or task is needed? 
      If YES, figure out the best due date (format: YYYY-MM-DD) based on today's date (${new Date().toISOString()}).
      If no specific date is mentioned but a follow-up is needed, default to 3 days from now.
      
      Respond strictly in JSON format with exactly these keys:
      {
        "requiresTask": boolean,
        "description": string (A short, actionable task name like "Call John to collect paystubs"),
        "dueDate": string (YYYY-MM-DD format, or null if requiresTask is false)
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the markdown formatting Gemini sometimes wraps JSON in
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    return NextResponse.json(parsedData, { status: 200 });

  } catch (error) {
    console.error('Gemini Copilot Error:', error);
    return NextResponse.json({ error: 'Failed to process AI task generation' }, { status: 500 });
  }
}