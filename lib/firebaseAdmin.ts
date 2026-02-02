import admin from 'firebase-admin';

// 1. Prepare the Private Key
// Handles standard formatting (newlines)
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : undefined;

// 2. Initialize Firebase Admin
if (!admin.apps.length) {
  // FIX: Fallback to 'indibrick-web' if the environment variable is missing
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'indibrick-web';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  // Only attempt to initialize if we have the critical secrets
  if (clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log(`✅ Server-Side Firebase Admin Initialized (${projectId})`);
    } catch (error) {
      console.error("❌ Firebase Admin Init Failed:", error);
    }
  } else {
    console.warn("⚠️ Firebase Admin Keys (Email/Key) missing. Skipping init.");
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;