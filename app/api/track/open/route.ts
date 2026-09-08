import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// 1x1 open-tracking pixel.
//
//   GET /api/track/open?run=<dripRunId>&s=<stepIndex>
//
// Sets openedAny=true on the run. That flag is the only thing gating the
// non-opener branch in dripRunner, so it has to be cheap and it must never
// fail the image — a broken pixel shows as a missing-image icon in several
// clients, which looks like a broken email.
//
// Worth being honest about what this measures. Apple Mail Privacy Protection
// pre-fetches images for a large share of recipients, registering an open the
// human never performed. Treat openedAny as "not provably ignored" rather
// than as engagement. It is used here only to decide whether someone drops
// into the re-engagement branch, where a false positive simply means they
// stay on the normal sequence — the safe direction to be wrong in.

const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

function pixelResponse() {
  return new NextResponse(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      // Never cache. A cached pixel means a second open never reaches us, and
      // an intermediary could serve it without us seeing the request at all.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const runId = (url.searchParams.get('run') || '').trim();
    const step = (url.searchParams.get('s') || '').trim();
    if (!adminDb || !runId) return pixelResponse();

    const ref = adminDb.collection('drip_runs').doc(runId);
    const doc = await ref.get();
    if (!doc.exists) return pixelResponse();

    // Only write on the first open. Every later hit is a no-op, which stops a
    // mail client that re-fetches on scroll from generating a write per render.
    if ((doc.data() as any).openedAny !== true) {
      await ref.update({
        openedAny: true,
        firstOpenAt: new Date().toISOString(),
        firstOpenStepIndex: step ? Number(step) : null,
      });
    }
  } catch (e: any) {
    console.error('[track/open] failed:', e?.message);
  }

  return pixelResponse();
}
