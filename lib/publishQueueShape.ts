// Cross-channel publish queue.
//
// Approved seoContent items land here with a destination binding
// (WordPress site / Shopify shop / GBP location) and then are
// pushed out by the Phase 2 publisher. Human approval is required
// before an item enters the queue — no autonomous publishing.
//
// Each item is a SINGLE destination for a SINGLE piece of content.
// A blog post being pushed to 3 WordPress sites + GBP is 4 rows.
// That keeps status tracking per-destination clean and lets us
// retry one failed channel without re-publishing everywhere.

export type PublishDestination = 'wordpress' | 'shopify' | 'gbp';
export type PublishStatus = 'pending' | 'publishing' | 'published' | 'failed' | 'canceled';

export interface PublishQueueItem {
  contentId: string;                    // /seoContent doc id
  destination: PublishDestination;

  // Which specific account/site/location.
  destinationConfig: {
    // wordpress: which site
    wordpressSiteUrl?: string;
    // shopify: shop domain
    shopifyShopDomain?: string;
    // gbp: which location
    gbpLocationId?: string;
    gbpAccountId?: string;
    // credential ref — points at /integrationCredentials
    integrationCredentialId: string;
  };

  status: PublishStatus;
  approvedBy: string;              // uid — required before status !== 'canceled'
  approvedAt: string;

  // Populated when publishing runs.
  publishedUrl?: string | null;
  publishedAt?: string | null;
  destinationRemoteId?: string | null; // wp post id, shopify article id, gbp post id

  // Failure detail. Cleared on the next retry.
  failedAt?: string | null;
  failReason?: string | null;
  retryCount?: number;

  createdBy: string;
  createdAt?: any;
  updatedAt?: any;

  tenantId?: string;
}

export function validatePublishQueueItem(input: Partial<PublishQueueItem>): string[] {
  const errors: string[] = [];
  if (!input.contentId) errors.push('contentId required.');
  if (!input.destination || !['wordpress', 'shopify', 'gbp'].includes(input.destination)) {
    errors.push('destination invalid.');
  }
  if (!input.destinationConfig?.integrationCredentialId) {
    errors.push('destinationConfig.integrationCredentialId required.');
  }
  if (input.destination === 'wordpress' && !input.destinationConfig?.wordpressSiteUrl) {
    errors.push('wordpressSiteUrl required for wordpress destination.');
  }
  if (input.destination === 'shopify' && !input.destinationConfig?.shopifyShopDomain) {
    errors.push('shopifyShopDomain required for shopify destination.');
  }
  if (input.destination === 'gbp' && !input.destinationConfig?.gbpLocationId) {
    errors.push('gbpLocationId required for gbp destination.');
  }
  return errors;
}
