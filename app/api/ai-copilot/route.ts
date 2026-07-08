import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebaseAdmin';

// Signals a competing broker or rate shop — these files close 40-60% below
// baseline unless someone escalates same-day. Detected on ANY logged note.
const COMPETING_BROKER_REGEX = /\b(dominion|rates\.ca|butler|true ?north|another broker|second opinion|other lender|shopping around|competing (offer|rate|broker))\b/i;

// Signals the client just replied to us. When we hear back, we don't want to
// pile a routine follow-up on top of an already-active conversation — that
// gets read as spammy. Pause the auto-cadence for 72h.
const CLIENT_REPLY_REGEX = /\b(client (replied|responded|got back|reached out|answered)|replied to us|responded to (us|our)|got back to (us|me)|heard back from (the )?client|email from (the )?client|text from (the )?client|call back)\b/i;
const CADENCE_PAUSE_MS = 72 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { referralId, clientName, assigneeId, noteContent } = await req.json();

    if (!referralId || !noteContent || !adminDb) {
       return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // ── Competing-broker escalation ────────────────────────────────
    // Same-day admin escalation + high-priority save-the-deal task on the
    // owning agent. Fires before the AI cadence path — we want the escalation
    // even if the note also has an explicit follow-up date in it.
    let escalated = false;
    if (COMPETING_BROKER_REGEX.test(noteContent)) {
      const now = new Date().toISOString();
      try {
        await adminDb.collection('referrals').doc(referralId).update({
          competingBrokerFlag: true,
          competingBrokerFlaggedAt: now,
        });
      } catch { /* referral may not exist yet — logging path shouldn't crash */ }

      // Two tasks: one for the owning agent (save the deal), one for admin
      // inbox (SLA-track it). Dedupe by referral+day so a chatty note thread
      // doesn't stack duplicates.
      const today = now.split('T')[0];
      const dupeSnap = await adminDb.collection('tasks')
        .where('referralId', '==', referralId)
        .where('kind', '==', 'save_the_deal')
        .where('dueDate', '==', today)
        .limit(1)
        .get();
      if (dupeSnap.empty) {
        await adminDb.collection('tasks').add({
          referralId, clientName, assigneeId,
          dueDate: today,
          description: `URGENT — ${clientName} mentioned a competing broker. Call today, hold the file.`,
          status: 'Pending',
          priority: 'urgent',
          kind: 'save_the_deal',
          aiGenerated: true,
          createdAt: now,
        });
        await adminDb.collection('tasks').add({
          referralId, clientName, assigneeId: 'ADMIN_INBOX',
          dueDate: today,
          description: `Escalation — ${clientName} flagged competing broker. Verify save-the-deal call was made.`,
          status: 'Pending',
          priority: 'urgent',
          kind: 'escalation',
          aiGenerated: true,
          createdAt: now,
        });
      }
      escalated = true;
    }

    // ── Cadence pause on client-reply ──────────────────────────────
    // If the note prefix or body signals a client reply, pause automated
    // follow-up scheduling for 72h. The pause window is stored on the
    // referral so any other cadence writer honors it too.
    const looksLikeClientUpdate = noteContent.includes('CLIENT UPDATE') || CLIENT_REPLY_REGEX.test(noteContent);
    let cadencePaused = false;
    if (looksLikeClientUpdate) {
      const until = new Date(Date.now() + CADENCE_PAUSE_MS).toISOString();
      try {
        await adminDb.collection('referrals').doc(referralId).update({
          cadencePausedUntil: until,
          cadencePausedReason: 'client_reply_detected',
        });
        cadencePaused = true;
      } catch { /* non-fatal */ }
    }

    // Honor an existing cadence pause even if this note didn't cause it.
    let cadencePauseActive = cadencePaused;
    if (!cadencePauseActive) {
      try {
        const refDoc = await adminDb.collection('referrals').doc(referralId).get();
        const pausedUntil = refDoc.data()?.cadencePausedUntil as string | undefined;
        if (pausedUntil && new Date(pausedUntil).getTime() > Date.now()) {
          cadencePauseActive = true;
        }
      } catch { /* non-fatal */ }
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
       // Explicit dates the agent typed always run — those are their own
       // commitments, not the automated cadence.
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
    } else if (!cadencePauseActive) {
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
    // else: cadence paused — silently skip the default 7-day auto-task.

    return NextResponse.json({
        success: true,
        taskScheduled: !!createdTaskId,
        taskId: createdTaskId,
        task: createdTask,
        escalated,
        cadencePaused: cadencePauseActive,
    });

  } catch (error: any) {
    console.error('AI Copilot Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
