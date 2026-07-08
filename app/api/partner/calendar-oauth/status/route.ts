// Tiny helper the partner UI polls to know whether to show
// "Connect Google Calendar" vs "Sync Now". Returns the connected email
// too so the UI can display "Connected as {email}".

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) return NextResponse.json({ connected: false, reason: 'missing_uid' });
  if (!adminDb) return NextResponse.json({ connected: false, reason: 'admin_db_not_ready' });

  try {
    const doc = await adminDb.collection('users').doc(uid).get();
    if (!doc.exists) return NextResponse.json({ connected: false });
    const data = doc.data() as any;
    const cal = data?.googleCalendar;
    if (!cal?.refreshToken) return NextResponse.json({ connected: false });
    return NextResponse.json({
      connected: true,
      email: cal.connectedEmail || null,
      connectedAt: cal.connectedAt || null,
    });
  } catch (e: any) {
    return NextResponse.json({ connected: false, reason: 'lookup_failed', detail: e.message });
  }
}
