// Router — given a queue item + the underlying content, calls the
// matching publisher. Kept small on purpose: Phase 2 has just two
// destinations, both server-side. The GBP path is a no-op (the real
// "publish" happens when the operator pastes into GBP manually).

import { adminDb } from '@/lib/firebaseAdmin';
import { publishToNativeBlog } from '@/lib/publishers/nativeBlog';
import type { SeoContentDoc } from '@/lib/seoContentShape';

export type DispatchOutcome =
  | { status: 'published'; publishedUrl: string; remoteId: string }
  | { status: 'ready_for_manual'; note: string }
  | { status: 'failed'; error: string };

export async function dispatchPublish(
  destination: 'native' | 'gbp',
  contentId: string,
  publishedByEmail: string | null,
): Promise<DispatchOutcome> {
  if (!adminDb) return { status: 'failed', error: 'No DB' };
  const snap = await adminDb.collection('seoContent').doc(contentId).get();
  if (!snap.exists) return { status: 'failed', error: 'Content not found' };
  const content = { id: snap.id, ...(snap.data() as SeoContentDoc) };

  if (content.status !== 'approved' && content.status !== 'published') {
    return { status: 'failed', error: `Content must be approved (currently ${content.status}).` };
  }

  if (destination === 'native') {
    try {
      const res = await publishToNativeBlog(contentId, content, publishedByEmail);
      return { status: 'published', publishedUrl: res.publishedUrl, remoteId: res.remoteId };
    } catch (e: any) {
      return { status: 'failed', error: e?.message || String(e) };
    }
  }

  if (destination === 'gbp') {
    // Manual publish path — no API call. The console surfaces the
    // "Open GBP draft" button; the operator pastes into GBP and
    // marks the queue row posted from the modal.
    return {
      status: 'ready_for_manual',
      note: 'GBP is a manual paste — open the queue row and copy the draft, then mark as posted.',
    };
  }

  return { status: 'failed', error: `Unknown destination: ${destination}` };
}
