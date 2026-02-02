import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';


const firebaseConfig = {
  apiKey: "AIzaSyBQAima3Bmsrt4cRMiokAJay3zNdmasJPw", 
  authDomain: "indibrick-web.firebaseapp.com", // <--- Check your .env.local
  projectId: "indibrick-web", // <--- Check your .env.local
  storageBucket: "indibrick-web.firebasestorage.app", 
  messagingSenderId: "52098750316", // (Optional, ok if missing)
  appId: "1:52098750316:web:3041e637a89a9617d28549",                // (Optional, ok if missing)
  measurementId: "G-HY24J1VLTG" // (Optional, ok if missing)
};

// Singleton pattern to avoid re-initialization errors
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Analytics only runs in the browser
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(null);
}

export { app, db, auth, storage, analytics };