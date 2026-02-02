import { NextResponse } from 'next/server';
import { db } from '@/firebase'; 
import { doc, setDoc } from 'firebase/firestore';
import { CITIES } from '@/data/cityData'; 

export async function GET(request: Request) {
  // SECURITY CHECK
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('key');
  const secret = process.env.NEXT_PUBLIC_ADMIN_OTP; // Or use a server-only key like ADMIN_SECRET_KEY

  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
  }

  try {
    if (!db) {
      throw new Error("Database connection (db) is undefined. Check firebase.ts");
    }

    const results = [];
    
    for (const city of CITIES) {
      if (!city.slug) continue;
      
      const cityRef = doc(db, "cities", city.slug);
      await setDoc(cityRef, city);
      results.push(`Uploaded: ${city.name}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database Populated Successfully", 
      count: results.length,
      details: results 
    });

  } catch (error: any) {
    console.error("Seed Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}