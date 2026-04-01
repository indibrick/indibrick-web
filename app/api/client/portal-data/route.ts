import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('leadId');

  if (!leadId || !adminDb) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    let docRef;
    const referralsRef = adminDb.collection('referrals');
    const snapshot = await referralsRef.where('leadId', '==', leadId).get();
    
    if (!snapshot.empty) docRef = snapshot.docs[0];
    else {
        const directDoc = await referralsRef.doc(leadId).get();
        if (directDoc.exists) docRef = directDoc;
    }

    if (!docRef) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = docRef.data();
    return NextResponse.json({
        clientName: data.clientName,
        requiredDocuments: data.requiredDocuments || [], // The checklist
        vault: data.vault || [] // What they have already uploaded
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}