import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { rates, adminKey } = await request.json();

    // 1. SECURITY CHECK
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Wrong Password' }, { status: 401 });
    }

    // 2. SAVE TO FIRESTORE
    // We store this in a 'site_settings' collection, document 'mortgage_rates'
    await setDoc(doc(db, 'site_settings', 'mortgage_rates'), {
      ...rates,
      lastUpdated: new Date().toISOString()
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}