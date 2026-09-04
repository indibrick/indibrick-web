import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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

// Dev-only global for console diagnostics. Modular Firebase v9+ has
// no global `firebase` namespace — this exposes the instances so we
// can run ad-hoc queries in the browser console during debugging.
// Stripped in production builds by NODE_ENV check.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as any).__ib = {
    app, db, auth,
    // Convenience: query the CURRENT user's assigned referrals with
    // one line in the console. Returns [] if the read is denied (rules
    // problem) or the deals genuinely don't exist.
    async myReferrals() {
      const u = auth.currentUser;
      if (!u) { console.warn('[__ib] not signed in'); return []; }
      console.log('[__ib] uid:', u.uid);
      try {
        const snap = await getDocs(query(
          collection(db, 'referrals'),
          where('assignedAgentId', '==', u.uid),
        ));
        const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        console.log('[__ib] matching referrals:', rows.length, rows);
        return rows;
      } catch (e: any) {
        console.error('[__ib] query FAILED:', e?.code, e?.message);
        return [];
      }
    },
    // Runs the exact 3 queries getPartnerDashboard runs, one at a time,
    // so we can see which one (if any) is the failure point + how the
    // filters strip results.
    async dashboard() {
      const u = auth.currentUser;
      if (!u) { console.warn('[__ib] not signed in'); return; }
      const uid = u.uid;
      console.group('[__ib] dashboard trace');
      console.log('uid:', uid);
      const runQ = async (label: string, q: any) => {
        try {
          const s = await getDocs(q);
          const rows = s.docs.map((d: any) => ({ id: d.id, ...d.data() }));
          console.log(`  ${label}: ${rows.length} rows`, rows.map((r: any) => ({ id: r.id, refBy: r.referrerId, assn: r.assignedAgentId, name: r.clientName })));
          return rows;
        } catch (e: any) {
          console.error(`  ${label}: FAILED`, e?.code, e?.message);
          return [];
        }
      };
      const sentAll = await runQ('sentQuery (referrerId==uid)',
        query(collection(db, 'referrals'), where('referrerId', '==', uid)));
      const receivedAll = await runQ('receivedQuery (assignedAgentId==uid)',
        query(collection(db, 'referrals'), where('assignedAgentId', '==', uid)));
      const partAll = await runQ('participatingQuery (participantIds array-contains uid)',
        query(collection(db, 'referrals'), where('participantIds', 'array-contains', uid)));
      const mine = sentAll.filter((l: any) => l.assignedAgentId === uid);
      const sent = sentAll.filter((l: any) => l.assignedAgentId !== uid);
      const received = receivedAll.filter((l: any) => l.referrerId !== uid);
      const participating = partAll.filter((l: any) => l.assignedAgentId !== uid && l.referrerId !== uid);
      console.log('AFTER FILTERS →', { sent: sent.length, received: received.length, mine: mine.length, participating: participating.length });
      const merged = [...sent, ...received, ...mine, ...participating]
        .filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.id === v.id) === i);
      console.log('activePipeline (deduped):', merged.length, merged.map((r: any) => r.clientName));
      console.groupEnd();
      return { sent, received, mine, participating, merged };
    },
  };
}

export { app, db, auth, storage, analytics };