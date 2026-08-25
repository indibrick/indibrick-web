// Waitlist form submission handler.
//
// Public endpoint — no auth required (these are prospects, not existing
// users). Server-side validation + rate limiting + Firestore write.
// Feeds two flows:
//   1. /partner_waitlist doc (source of truth for who applied)
//   2. onWaitlistCreate Cloud Function → sends the drip email sequence
//      (Days 0-7 welcome → Days 8-30 nudge → Days 31-90 activate)
//
// Territory-based scarcity (Offer Strategist's #1 GTM constraint —
// throttle partner acquisition to mortgage volume): the endpoint reads
// /waitlist_capacity/{kind} to check if new spots are available and
// stamps the waitlist doc as either 'active' (spot available, priority
// review) or 'queued' (waitlist behind existing prospects). The public
// counter on the landing page reads the same doc.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rateLimiter';

// Distributed rate limit: 3 submissions per IP per hour (Wave D).
const WAITLIST_WINDOW_MS = 60 * 60 * 1000;
const WAITLIST_MAX = 3;

function ipOf(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}

const ALLOWED_KINDS = new Set(['realtor', 'insurance_agent']);

export async function POST(req: NextRequest) {
  const rate = await checkRateLimit({
    bucket: 'waitlist.submit',
    key: ipOf(req),
    windowMs: WAITLIST_WINDOW_MS,
    max: WAITLIST_MAX,
  });
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
  }
  if (!adminDb) return NextResponse.json({ error: 'Server not initialized' }, { status: 500 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const kind = String(body.kind || '');
  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: 'kind must be realtor | insurance_agent' }, { status: 400 });
  }
  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 40);
  const brokerage = String(body.brokerage || '').trim().slice(0, 200);
  const territory = String(body.territory || '').trim().slice(0, 120);
  const volume = String(body.volume || '').trim().slice(0, 40);
  const notes = String(body.notes || '').trim().slice(0, 2000);

  if (!name || !email) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
  }
  // Very light email sanity check — the real filter is the drip email
  // itself, which bounces on invalid addresses.
  if (!email.includes('@') || email.length < 5) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // Read capacity for this kind. If no doc exists, default to
  // active + spots-of-15 so the first submission works cleanly.
  const capacityRef = adminDb.collection('waitlist_capacity').doc(kind);
  const capacitySnap = await capacityRef.get();
  const capacity = capacitySnap.exists ? (capacitySnap.data() || {}) : {};
  const totalSpots = typeof capacity.totalSpots === 'number' ? capacity.totalSpots : 15;
  const takenSpots = typeof capacity.takenSpots === 'number' ? capacity.takenSpots : 0;
  const status = takenSpots < totalSpots ? 'active' : 'queued';

  const doc = {
    kind,
    name, email, phone,
    brokerage, territory, volume, notes,
    status,       // 'active' = first-in-line for review; 'queued' = wait
    reviewed: false,
    convertedAt: null,
    dripDay: 0,   // Onboarding drip cursor — incremented by the scheduled fn
    ip: ipOf(req).slice(0, 40),
    userAgent: (req.headers.get('user-agent') || '').slice(0, 200),
    submittedAt: new Date().toISOString(),
    createdAt: FieldValue.serverTimestamp(),
  };
  const added = await adminDb.collection('partner_waitlist').add(doc);

  // Only bump the taken counter if this is an active spot (not queued).
  if (status === 'active') {
    await capacityRef.set(
      { takenSpots: FieldValue.increment(1) },
      { merge: true },
    );
  }

  return NextResponse.json({
    success: true,
    id: added.id,
    status,
    spotsRemaining: Math.max(0, totalSpots - takenSpots - (status === 'active' ? 1 : 0)),
    totalSpots,
  });
}

// Public counter for the landing page's "X of Y spots left" scarcity
// widget. Returns the capacity doc's currents without exposing PII.
export async function GET(req: NextRequest) {
  if (!adminDb) return NextResponse.json({ error: 'Server not initialized' }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const kind = String(searchParams.get('kind') || '');
  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: 'kind must be realtor | insurance_agent' }, { status: 400 });
  }
  const snap = await adminDb.collection('waitlist_capacity').doc(kind).get();
  const capacity = snap.exists ? (snap.data() || {}) : {};
  const totalSpots = typeof capacity.totalSpots === 'number' ? capacity.totalSpots : 15;
  const takenSpots = typeof capacity.takenSpots === 'number' ? capacity.takenSpots : 0;
  const spotsRemaining = Math.max(0, totalSpots - takenSpots);
  return NextResponse.json({
    kind,
    totalSpots,
    takenSpots,
    spotsRemaining,
    territory: capacity.territory || 'Ontario',
  });
}
