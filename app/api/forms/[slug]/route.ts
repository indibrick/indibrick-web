// Public form fetch — used by the /f/{slug} page to render.
// No auth check: forms are inherently public once published.
// Read is limited to the presentation fields — we don't leak
// ownerUid, tenantId, notifyEmails, or submitCount.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  if (!adminDb) return NextResponse.json({ error: 'Server not initialized' }, { status: 500 });
  const snap = await adminDb.collection('forms').where('slug', '==', params.slug).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const doc = snap.docs[0].data() || {};
  if (!doc.enabled) return NextResponse.json({ error: 'Form disabled' }, { status: 410 });

  return NextResponse.json({
    form: {
      slug: doc.slug,
      headline: doc.headline || doc.name,
      subheadline: doc.subheadline || '',
      submitLabel: doc.submitLabel || 'Submit',
      fields: Array.isArray(doc.fields) ? doc.fields : [],
      requireCaptcha: doc.requireCaptcha === true,
      // Expose the site key so the client can render the widget without
      // a second round-trip. Server never leaks the secret half.
      turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || null,
    },
  });
}
