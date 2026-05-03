import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';

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

    // THE FIX: Generate fresh 2-hour Signed URLs on the fly
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
    const bucket = getStorage().bucket(bucketName);

    const freshVault = await Promise.all((data.vault || []).map(async (vItem: any) => {
        if (vItem.storagePath) {
            try {
                const [freshUrl] = await bucket.file(vItem.storagePath).getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 2 * 60 * 60 * 1000 // Expires in 2 hours securely
                });
                return { ...vItem, downloadUrl: freshUrl };
            } catch (e) { return vItem; }
        }
        return vItem;
    }));

    return NextResponse.json({
        clientName: data.clientName,
        requiredDocuments: data.requiredDocuments || [], 
        vault: freshVault 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}