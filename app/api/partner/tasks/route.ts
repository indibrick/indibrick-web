import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { requireAuth } from '@/lib/authGuard';

// GET: Fetch tasks for the calendar. Scope is always the caller's uid
// unless the caller is admin — the prior version accepted `userId` +
// `role` from the query string, which meant any signed-in user could
// read any other user's tasks by editing the URL.
export async function GET(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;

  try {
    if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
    const tasksSnap = role === 'admin'
      ? await adminDb.collection('tasks').get()
      : await adminDb.collection('tasks').where('assigneeId', '==', uid).get();
    const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new manual task. assigneeId is forced to the caller's
// uid unless the caller is admin (admins can create tasks for others).
export async function POST(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;

  try {
    if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
    const data = await req.json();
    const assigneeId = role === 'admin' && data.assigneeId ? data.assigneeId : uid;
    await adminDb.collection('tasks').add({
      ...data,
      assigneeId,
      createdBy: uid,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Mark a task as completed. Non-admins can only complete their own
// tasks; admins can complete any.
export async function PUT(req: NextRequest) {
  const guard = await requireAuth(req);
  if (!guard.ok) return guard.response;
  const { uid, role } = guard.session;

  try {
    const { taskId } = await req.json();
    if (!adminDb || !taskId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const taskRef = adminDb.collection('tasks').doc(taskId);
    const snap = await taskRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    const task = snap.data() || {};
    if (role !== 'admin' && task.assigneeId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await taskRef.update({ status: 'Completed', completedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}