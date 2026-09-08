import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Buyer-type self-selection — the target for the buttons in Email 1.
//
//   GET /api/segment?r=<referralId>&type=first-time&to=/listings/midhurst-valley
//
// Moves every active drip run for that referral onto the matching branch,
// then 302s to the real landing page. The redirect is the point: the click
// has to behave like an ordinary link.
//
// Segment lives on the RUN, not the referral. One client can be enrolled in
// more than one sequence, and a buyer-type answer is scoped to the campaign
// that asked the question — writing it to the referral would leak the answer
// across unrelated sequences.
//
// Deliberately unauthenticated: it is clicked from a mail client, which
// carries no session. Blast radius is limited to which of our own emails a
// recipient receives next. Guarded by validating the type against a fixed
// set, requiring an active run to exist, and restricting the redirect to
// same-site paths so this cannot become an open redirect.

const ALLOWED = new Set(['first-time', 'investor']);
const DEFAULT_REDIRECT = '/listings';

function safePath(raw: string | null): string {
  if (!raw) return DEFAULT_REDIRECT;
  // Same-site paths only. Protocol-relative (//evil.com) and absolute URLs
  // are rejected outright rather than sanitised.
  if (!raw.startsWith('/') || raw.startsWith('//')) return DEFAULT_REDIRECT;
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const referralId = (url.searchParams.get('r') || '').trim();
  const type = (url.searchParams.get('type') || '').trim();
  const to = safePath(url.searchParams.get('to'));
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  // Whatever happens below, the human gets their page. A tracking failure
  // must never surface as a broken link.
  const redirect = () => NextResponse.redirect(new URL(to, origin), 302);

  try {
    if (!adminDb || !referralId || !ALLOWED.has(type)) return redirect();

    const runs = await adminDb.collection('drip_runs')
      .where('referralId', '==', referralId)
      .where('status', '==', 'active')
      .limit(10)
      .get();

    if (runs.empty) return redirect();

    const batch = adminDb.batch();
    for (const doc of runs.docs) {
      const run = doc.data() as any;
      // Never re-segment someone who has converted.
      if (run.segment === 'applied') continue;
      batch.update(doc.ref, {
        segment: type,
        segmentAssignedAt: new Date().toISOString(),
        segmentAssignedBy: 'recipient:click',
        // A click is an open. Recording it stops the non-opener rule from
        // later stealing a recipient who demonstrably engaged.
        openedAny: true,
      });
    }
    await batch.commit();
  } catch (e: any) {
    console.error('[segment] failed for referral', referralId, e?.message);
  }

  return redirect();
}
