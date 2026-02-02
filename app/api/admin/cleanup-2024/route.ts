import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Security Check
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (key !== process.env.NEXT_PUBLIC_ADMIN_OTP) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    let deletedCount = 0;
    const batchPromises = [];

    snapshot.docs.forEach((document) => {
      const data = document.data();
      // Check if slug or title contains '2024'
      if (document.id.includes('2024') || data.title?.includes('2024')) {
        batchPromises.push(deleteDoc(doc(db, 'posts', document.id)));
        deletedCount++;
      }
    });

    await Promise.all(batchPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${deletedCount} old 2024 articles.`,
      deletedCount 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}