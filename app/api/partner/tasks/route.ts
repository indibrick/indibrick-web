import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// GET: Fetch all tasks for the calendar
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !adminDb) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    let tasksSnap;
    if (role === 'admin') {
        tasksSnap = await adminDb.collection('tasks').get();
    } else {
        tasksSnap = await adminDb.collection('tasks').where('assigneeId', '==', userId).get();
    }

    const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new manual task
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!adminDb) return NextResponse.json({ error: 'No DB' }, { status: 500 });
    
    await adminDb.collection('tasks').add({
        ...data,
        createdAt: new Date().toISOString()
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Mark a task as completed
export async function PUT(req: NextRequest) {
  try {
    const { taskId } = await req.json();
    if (!adminDb || !taskId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    
    await adminDb.collection('tasks').doc(taskId).update({ status: 'Completed' });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}